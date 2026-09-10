import { isKioskId, KIOSK_STORAGE_KEY } from "./identity";

/** 判定は必ず端末自身のブラウザーから行う。保存済み ID だけでは判定しない。 */
export async function isFreeKiosk(): Promise<boolean> {
  try {
    const response = await fetch("http://127.0.0.1:8080/api/status", {
      cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(3_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function getOrCreateKioskId(): string {
  const stored = localStorage.getItem(KIOSK_STORAGE_KEY);
  if (isKioskId(stored)) return stored;
  const deviceId = crypto.randomUUID();
  localStorage.setItem(KIOSK_STORAGE_KEY, deviceId);
  return deviceId;
}

export async function connectKiosk(deviceId: string): Promise<void> {
  const response = await fetch("/api/kiosk/session", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId }), credentials: "same-origin",
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json();
  if (!response.ok || !result.registered) {
    throw new Error(result.error ?? "この端末は無効になっています。管理者に確認してください。");
  }
}
