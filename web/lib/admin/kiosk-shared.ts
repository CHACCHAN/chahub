// Client Component からも読み込む定数と型。サーバー専用モジュール(auth / db)を import しないこと。

export const KIOSK_EMAIL_DOMAIN = "kiosk.chahub.invalid";
export const KIOSK_KEY_HEADER = "x-api-key";
export const KIOSK_KEY_PREFIX = "kiosk_";

/** キーの有効期限の選択肢。ビルドに埋め込む前提なので既定は無期限。 */
export const KIOSK_KEY_EXPIRIES = [
  { value: "never", label: "無期限", days: null },
  { value: "365", label: "1年", days: 365 },
  { value: "90", label: "90日", days: 90 },
  { value: "30", label: "30日", days: 30 },
] as const;
export type KioskKeyExpiry = (typeof KIOSK_KEY_EXPIRIES)[number]["value"];

export function isKioskKeyExpiry(value: unknown): value is KioskKeyExpiry {
  return KIOSK_KEY_EXPIRIES.some(option => option.value === value);
}

/** 作成・再発行の直後にだけ得られる、端末のビルドに埋め込む情報。生のキーは保存しない。 */
export type KioskCredentials = {
  userId: string; name: string; email: string; location: string | null;
  keyId: string; apiKey: string; keyStart: string | null; expiresAt: string | null; issuedAt: string;
  serverUrl: string; liveKitUrl: string | null; header: string;
};

export type KioskKeyStatus = "active" | "disabled" | "expired" | "missing";
export type KioskRow = {
  userId: string; name: string; email: string; role: string | null; location: string | null; note: string | null; createdAt: string;
  key: { id: string; start: string | null; status: KioskKeyStatus; expiresAt: string | null; lastRequest: string | null; requestCount: number; createdAt: string } | null;
};
