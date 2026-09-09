"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./access";
import { createKiosk, deleteKiosk, rotateKioskKey, setKioskKeyEnabled } from "./kiosks";
import { isKioskKeyExpiry, type KioskCredentials } from "./kiosk-shared";

export type KioskActionState = { error?: string; success?: string; credentials?: KioskCredentials };

export async function createKioskAction(_previous: KioskActionState, form: FormData): Promise<KioskActionState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  const location = String(form.get("location") ?? "").trim().slice(0, 120);
  const note = String(form.get("note") ?? "").trim().slice(0, 500);
  const expiry = String(form.get("expiry") ?? "never");
  if (!name || name.length > 32) return { error: "端末名は1〜32文字で入力してください。" };
  if (!isKioskKeyExpiry(expiry)) return { error: "有効期限を選択してください。" };
  try {
    const credentials = await createKiosk({ name, location, note, expiry });
    revalidatePath("/admin", "layout");
    return { success: `「${name}」を追加しました。表示された情報を Tauri のビルドに埋め込んでください。`, credentials };
  } catch {
    return { error: "キオスク端末を追加できませんでした。もう一度お試しください。" };
  }
}

export async function rotateKioskKeyAction(_previous: KioskActionState, form: FormData): Promise<KioskActionState> {
  await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const expiry = String(form.get("expiry") ?? "never");
  if (!isKioskKeyExpiry(expiry)) return { error: "有効期限を選択してください。" };
  try {
    const credentials = await rotateKioskKey(userId, expiry);
    if (!credentials) return { error: "キオスク端末が見つかりません。" };
    revalidatePath("/admin", "layout");
    return { success: "API キーを再発行しました。旧キーは使えません。新しい情報で端末をビルドし直してください。", credentials };
  } catch {
    return { error: "API キーを再発行できませんでした。もう一度お試しください。" };
  }
}

export async function toggleKioskKeyAction(_previous: KioskActionState, form: FormData): Promise<KioskActionState> {
  await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const enabled = form.get("enabled") === "true";
  try {
    const count = await setKioskKeyEnabled(userId, enabled);
    if (!count) return { error: "この端末には API キーがありません。再発行してください。" };
  } catch {
    return { error: "API キーの状態を変更できませんでした。" };
  }
  revalidatePath("/admin", "layout");
  return { success: enabled ? "API キーを有効にしました。" : "API キーを無効にしました。端末からの接続は拒否されます。" };
}

export async function deleteKioskAction(_previous: KioskActionState, form: FormData): Promise<KioskActionState> {
  await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  try {
    if (!await deleteKiosk(userId)) return { error: "キオスク端末が見つかりません。" };
  } catch {
    return { error: "キオスク端末を削除できませんでした。もう一度お試しください。" };
  }
  revalidatePath("/admin", "layout");
  return { success: "キオスク端末を削除しました。API キーとアカウントは無効になりました。" };
}
