"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/prisma/db";
import { requireAdmin } from "./access";
import { isRole } from "./roles";
import { STANDARD_TEAM_NAMES } from "./oidc-mapping";
import type { ActionState } from "./actions";

/** フォームの target 値("team:<id>" または "role:<administrator|member>")を解釈する。 */
function parseTarget(value: string): { teamId: string } | { role: "administrator" | "member" } | null {
  const [kind, rest] = value.split(":", 2);
  if (kind === "team" && rest) return { teamId: rest };
  if (kind === "role" && isRole(rest)) return { role: rest };
  return null;
}

export async function addOidcMapping(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const groupName = String(form.get("groupName") ?? "").trim();
  const target = parseTarget(String(form.get("target") ?? ""));
  if (!groupName || groupName.length > 200) return { error: "グループ名は1〜200文字で入力してください。" };
  if (!target) return { error: "所属先のチームを選択してください。" };
  let label: string;
  if ("teamId" in target) {
    const team = await db.orm.public.AuthTeam.select("name").first({ id: target.teamId });
    if (!team) return { error: "所属先のチームを選択してください。" };
    if (await db.orm.public.OidcTeamMapping.where({ groupName, teamId: target.teamId }).first()) return { error: "同じマッピングが既にあります。" };
    label = team.name;
  } else {
    if (await db.orm.public.OidcTeamMapping.where({ groupName, role: target.role }).first()) return { error: "同じマッピングが既にあります。" };
    label = `${STANDARD_TEAM_NAMES[target.role]}(標準)`;
  }
  try {
    await db.orm.public.OidcTeamMapping.create({ id: crypto.randomUUID(), groupName, teamId: "teamId" in target ? target.teamId : null, role: "role" in target ? target.role : null });
  } catch {
    return { error: "マッピングを保存できませんでした。再読み込みしてお試しください。" };
  }
  revalidatePath("/admin/teams");
  return { success: `「${groupName}」→「${label}」のマッピングを追加しました。次回ログインから適用されます。` };
}

export async function removeOidcMapping(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    await db.orm.public.OidcTeamMapping.where({ id: String(form.get("id") ?? "") }).delete();
  } catch {
    return { error: "マッピングを削除できませんでした。もう一度お試しください。" };
  }
  revalidatePath("/admin/teams");
  return { success: "マッピングを削除しました。既存の所属やロールは維持されます。" };
}
