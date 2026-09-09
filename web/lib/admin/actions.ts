"use server";

import { auth } from "@/lib/better-auth/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/prisma/db";
import { createAdminTeam, DuplicateTeamError } from "./teams";
import { isRole, roleLabels, setTeamRole, setUserRole, syncUserRoles } from "./roles";
import { requireAdmin } from "./access";

export type ActionState = { error?: string; success?: string };

export async function createTeam(_previous: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 80) return { error: "チーム名は1〜80文字で入力してください。" };
  try {
    await createAdminTeam(name);
  } catch (error) {
    if (error instanceof DuplicateTeamError) return { error: "同じ名前のチームが既にあります。" };
    return { error: "チームを作成できませんでした。もう一度お試しください。" };
  }
  revalidatePath("/admin", "layout");
  return { success: `「${name}」を作成しました。` };
}

export async function deleteTeam(_previous: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const teamId = String(form.get("teamId") ?? "");
  const team = teamId ? await db.orm.public.AuthTeam.select("id", "name", "organizationId").first({ id: teamId }) : null;
  if (!team) return { error: "チームが見つかりません。すでに削除されている可能性があります。" };
  const members = (await db.orm.public.AuthTeamMember.select("userId").where({ teamId: team.id }).all()).map(member => member.userId);
  try {
    // 管理者権限は requireAdmin で確認済み。headers を渡さないサーバー呼び出しにすると、
    // Better Auth は組織メンバーとしての権限確認を省き、チームと所属を削除する。
    await auth.api.removeTeam({ body: { teamId: team.id, organizationId: team.organizationId } });
  } catch {
    return { error: `「${team.name}」を削除できませんでした。もう一度お試しください。` };
  }
  // チームのロール設定を受けていたメンバーのロールを再計算する。
  await syncUserRoles(members);
  revalidatePath("/admin", "layout");
  return { success: `「${team.name}」を削除しました。OIDC マッピングとチームのロール設定も削除されました。` };
}

export async function updateRole(_previous: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const role = String(form.get("role") ?? "");
  if (role !== "inherit" && !isRole(role)) return { error: "有効な権限を選択してください。" };
  if (!userId || !await db.orm.public.AuthUser.first({ id: userId })) return { error: "対象ユーザーが見つかりません。" };
  try {
    await setUserRole(userId, role === "inherit" ? null : role);
  } catch {
    return { error: "権限を変更できませんでした。もう一度お試しください。" };
  }
  revalidatePath("/", "layout");
  return { success: role === "inherit" ? "ユーザー単位の指定を解除し、チームの設定に従うようにしました。" : `ユーザーの権限を「${roleLabels[role]}」にしました。` };
}

export async function updateTeamRole(_previous: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const teamId = String(form.get("teamId") ?? "");
  const role = String(form.get("role") ?? "");
  if (role !== "none" && !isRole(role)) return { error: "有効な権限を選択してください。" };
  const team = teamId ? await db.orm.public.AuthTeam.select("id", "name").first({ id: teamId }) : null;
  if (!team) return { error: "チームが見つかりません。" };
  try {
    await setTeamRole(team.id, role === "none" ? null : role);
  } catch {
    return { error: "チームの権限を変更できませんでした。もう一度お試しください。" };
  }
  revalidatePath("/", "layout");
  return { success: role === "none" ? `「${team.name}」のチーム権限を解除しました。` : `「${team.name}」の所属メンバーを「${roleLabels[role]}」にしました。ユーザー単位の指定があるメンバーはそちらが優先されます。` };
}
