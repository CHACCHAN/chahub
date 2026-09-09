import { db } from "@/prisma/db";

export const ROLES = ["member", "administrator"] as const;
export type Role = (typeof ROLES)[number];
export const roleLabels: Record<Role, string> = { member: "一般ユーザー", administrator: "管理者" };

export function isRole(value: unknown): value is Role {
  return ROLES.includes(value as Role);
}

export type OverrideSource = "admin" | "oidc";
export type RoleSource =
  | { kind: "user"; via: OverrideSource }
  | { kind: "team"; teamId: string; teamName: string }
  | { kind: "default" };
export type ResolvedRole = { role: Role; source: RoleSource };

// トランザクション内の tx とアプリの db の両方を受け取れる最小の型。
type Client = Pick<typeof db, "orm">;

/**
 * ユーザーの有効なロールを解決する。
 * 優先順位: ユーザー単位の指定 > 所属チームの設定(複数なら管理者が優先) > 既定(一般ユーザー)。
 */
export async function resolveRoles(userIds: string[], client: Client = db): Promise<Map<string, ResolvedRole>> {
  const resolved = new Map<string, ResolvedRole>();
  if (!userIds.length) return resolved;
  const overrides = await client.orm.public.UserRoleOverride.where(override => override.userId.in(userIds)).all();
  const memberships = await client.orm.public.AuthTeamMember.select("userId", "teamId").where(member => member.userId.in(userIds)).all();
  const teamRoles = await client.orm.public.TeamRole.include("team", team => team.select("name")).all();
  const byTeam = new Map(teamRoles.map(teamRole => [teamRole.teamId, teamRole]));
  for (const userId of userIds) {
    const override = overrides.find(candidate => candidate.userId === userId);
    if (override && isRole(override.role)) { resolved.set(userId, { role: override.role, source: { kind: "user", via: override.source === "oidc" ? "oidc" : "admin" } }); continue; }
    const granted = memberships.filter(member => member.userId === userId)
      .flatMap(member => { const teamRole = byTeam.get(member.teamId); return teamRole && isRole(teamRole.role) ? [teamRole] : []; });
    const winner = granted.find(teamRole => teamRole.role === "administrator") ?? granted[0];
    resolved.set(userId, winner
      ? { role: winner.role as Role, source: { kind: "team", teamId: winner.teamId, teamName: winner.team?.name ?? "" } }
      : { role: "member", source: { kind: "default" } });
  }
  return resolved;
}

/** 解決したロールを Better Auth が参照する auth_user.role に書き込む。呼び出し側でトランザクションと auth_user のロックを取ること。 */
export async function applyRoles(userIds: string[], client: Client) {
  if (!userIds.length) return;
  const resolved = await resolveRoles(userIds, client);
  const users = await client.orm.public.AuthUser.select("id", "role").where(user => user.id.in(userIds)).all();
  for (const user of users) {
    const role = resolved.get(user.id)?.role ?? "member";
    if (user.role !== role) await client.orm.public.AuthUser.where({ id: user.id }).update({ role, updatedAt: new Date().toISOString() });
  }
}

async function teamMemberIds(teamId: string, client: Client) {
  return (await client.orm.public.AuthTeamMember.select("userId").where({ teamId }).all()).map(member => member.userId);
}

function lock(client: typeof db) {
  return client.raw.sql`LOCK TABLE auth_user IN SHARE ROW EXCLUSIVE MODE`.affectedCount().build();
}

/** 指定ユーザーの auth_user.role を現在の設定に合わせる(チーム削除などの後に使う)。 */
export async function syncUserRoles(userIds: string[], client = db) {
  if (!userIds.length) return;
  await client.transaction(async tx => {
    await tx.execute(lock(client));
    await applyRoles(userIds, tx);
  });
}

/** チームにロールを設定(null で解除)し、所属メンバーのロールを更新する。 */
export async function setTeamRole(teamId: string, role: Role | null, client = db) {
  await client.transaction(async tx => {
    await tx.execute(lock(client));
    const updatedAt = new Date().toISOString();
    if (role) await tx.orm.public.TeamRole.upsert({ create: { teamId, role, updatedAt }, update: { role, updatedAt } });
    else await tx.orm.public.TeamRole.where({ teamId }).delete();
    await applyRoles(await teamMemberIds(teamId, tx), tx);
  });
}

/** ユーザー単位のロールを設定(null でチームの設定に従う)し、そのユーザーのロールを更新する。 */
export async function setUserRole(userId: string, role: Role | null, client = db) {
  await client.transaction(async tx => {
    await tx.execute(lock(client));
    const updatedAt = new Date().toISOString();
    if (role) await tx.orm.public.UserRoleOverride.upsert({ create: { userId, role, source: "admin", updatedAt }, update: { role, source: "admin", updatedAt } });
    else await tx.orm.public.UserRoleOverride.where({ userId }).delete();
    await applyRoles([userId], tx);
  });
}
