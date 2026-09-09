"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/prisma/db";
import { requireAdmin } from "./access";
import type { ActionState } from "./actions";

export async function addOidcMapping(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const groupName = String(form.get("groupName") ?? "").trim();
  const teamId = String(form.get("teamId") ?? "");
  if (!groupName || groupName.length > 200) return { error: "グループ名は1〜200文字で入力してください。" };
  if (!await db.orm.public.AuthTeam.first({ id: teamId })) return { error: "所属先のチームを選択してください。" };
  if (await db.orm.public.OidcTeamMapping.where({ groupName, teamId }).first()) return { error: "同じマッピングが既にあります。" };
  try {
    await db.orm.public.OidcTeamMapping.create({ id: crypto.randomUUID(), groupName, teamId });
  } catch {
    return { error: "マッピングを保存できませんでした。再読み込みしてお試しください。" };
  }
  revalidatePath("/admin/teams");
  return { success: "OIDC マッピングを追加しました。次回ログインから適用されます。" };
}

export async function removeOidcMapping(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    await db.orm.public.OidcTeamMapping.where({ id: String(form.get("id") ?? "") }).delete();
  } catch {
    return { error: "マッピングを削除できませんでした。もう一度お試しください。" };
  }
  revalidatePath("/admin/teams");
  return { success: "マッピングを削除しました。既存の所属は維持されます。" };
}
