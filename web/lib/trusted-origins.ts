// 信頼するオリジン。既定は BETTER_AUTH_URL のオリジンだけ。
// 開発機の LAN IP など複数のオリジンから開く場合は、CHAHUB_TRUSTED_ORIGINS に
// カンマ区切りで足す(例: CHAHUB_TRUSTED_ORIGINS=http://192.168.1.20:3000)。
// next.config.ts からも読み込むため、サーバー専用モジュールを import しないこと。

function toOrigin(value: string): string | null {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

/** 許可するオリジンの一覧。重複と不正な値は落とす。 */
export function trustedOrigins(): string[] {
  const configured = [process.env.BETTER_AUTH_URL ?? "", ...(process.env.CHAHUB_TRUSTED_ORIGINS ?? "").split(",")];
  return [...new Set(configured.filter(Boolean).map(toOrigin).filter((origin): origin is string => origin !== null))];
}

/** リクエストの Origin ヘッダーが信頼できるか。未設定・不一致は false。 */
export function isTrustedOrigin(origin: string | null | undefined): boolean {
  return Boolean(origin) && trustedOrigins().includes(origin!);
}

/** next.config.ts の allowedDevOrigins 用。ポートを除いたホスト名を返す。 */
export function trustedOriginHosts(): string[] {
  return [...new Set(trustedOrigins().map(origin => new URL(origin).hostname))];
}
