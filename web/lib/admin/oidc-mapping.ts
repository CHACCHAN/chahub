import { createHash } from "node:crypto";
import { db } from "@/prisma/db";
import { applyRoles } from "./roles";

// Add matching memberships only; existing/manual memberships are retained.
export async function applyOidcTeamMappings(userId: string, groups: string[], client = db) {
  if (!groups.length) return;
  await client.transaction(async tx => {
    await tx.execute(client.raw.sql`LOCK TABLE auth_user, auth_team, auth_member, auth_team_member IN SHARE ROW EXCLUSIVE MODE`.affectedCount().build());
    const rules = await tx.orm.public.OidcTeamMapping.where(rule => rule.groupName.in(groups))
      .include("team", team => team.select("id", "organizationId")).all();
    const seen = new Set<string>();
    for (const rule of rules) {
      const team = rule.team;
      if (!team || seen.has(team.id)) continue;
      seen.add(team.id);
      const organizationMembership = await tx.orm.public.AuthMember
        .where({ organizationId: team.organizationId, userId }).first();
      if (!organizationMembership) await tx.orm.public.AuthMember.create({
        id: crypto.randomUUID(), organizationId: team.organizationId, userId,
        role: "member", createdAt: new Date().toISOString(),
      });
      const membership = await tx.orm.public.AuthTeamMember.where({ teamId: team.id, userId }).first();
      if (membership) continue;
      const membershipKey = createHash("sha256").update(JSON.stringify([team.id, userId])).digest("base64url");
      await tx.orm.public.AuthTeamMember.create({
        id: crypto.randomUUID(), teamId: team.id, userId, membershipKey, createdAt: new Date().toISOString(),
      });
      const counts = await tx.orm.public.AuthTeamMember.where({ teamId: team.id })
        .aggregate(aggregate => ({ count: aggregate.count() }));
      await tx.orm.public.AuthTeam.where({ id: team.id }).update({ memberCount: counts.count });
    }
    // 新しい所属チームにロールが設定されていれば反映する。
    await applyRoles([userId], tx);
  });
}
