import "server-only";

import { cache } from "react";
import { headers as h } from "next/headers";
import { auth } from "./auth";

export const getSession = cache(async () => {
  const headers = await h();

  return auth.api.getSession({ headers });
});

// キオスク端末チェック
export async function isKiosk() {
  const requestHeaders = new Headers(await h());
  const apiKey = requestHeaders.get("x-api-key");

  if (!apiKey) return false;

  // 正規のAPIキーか検証
  const result = await auth.api.verifyApiKey({
    body: {
      key: apiKey,
    },
  });

  return result.valid;
}
