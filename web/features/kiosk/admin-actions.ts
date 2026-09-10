"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/access";
import { updateKiosk, deleteKiosk, setKioskEnabled } from "./admin";

export type KioskActionState = { error?: string; success?: string };

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

export async function updateKioskAction(_previous: KioskActionState, form: FormData): Promise<KioskActionState> {
  await requireAdmin();
  const deviceId = text(form, "deviceId", 200);
  const name = text(form, "name", 32);
  if (!deviceId) return { error: "端末 ID を確認できません。" };
  if (!name) return { error: "端末名は1〜32文字で入力してください。" };
  try {
    if (!await updateKiosk({ deviceId, name, location: text(form, "location", 120), note: text(form, "note", 500) })) {
      return { error: "キオスク端末が見つかりません。" };
    }
  } catch {
    return { error: "キオスク端末を更新できませんでした。もう一度お試しください。" };
  }
  revalidatePath("/admin", "layout");
  return { success: `「${name}」を更新しました。` };
}

export async function toggleKioskAction(_previous: KioskActionState, form: FormData): Promise<KioskActionState> {
  await requireAdmin();
  const enabled = form.get("enabled") === "true";
  try {
    if (!await setKioskEnabled(text(form, "deviceId", 200), enabled)) return { error: "キオスク端末が見つかりません。" };
  } catch {
    return { error: "端末の状態を変更できませんでした。" };
  }
  revalidatePath("/admin", "layout");
  return { success: enabled ? "端末を有効にしました。" : "端末を無効にしました。この端末からの接続は拒否されます。" };
}

export async function deleteKioskAction(_previous: KioskActionState, form: FormData): Promise<KioskActionState> {
  await requireAdmin();
  try {
    if (!await deleteKiosk(text(form, "deviceId", 200))) return { error: "キオスク端末が見つかりません。" };
  } catch {
    return { error: "キオスク端末を削除できませんでした。もう一度お試しください。" };
  }
  revalidatePath("/admin", "layout");
  return { success: "キオスク端末を削除しました。" };
}
