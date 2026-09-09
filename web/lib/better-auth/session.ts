import "server-only";

import { cache } from "react";
import { headers as h } from "next/headers";
import { auth } from "./auth";
import { db } from "@/prisma/db";
import { KIOSK_KEY_HEADER } from "@/lib/admin/kiosk-shared";

export const getSession = cache(async () => {
  const headers = await h();

  return auth.api.getSession({ headers });
});

// キオスク端末チェック
export const isKiosk = cache(async () => {
  const apiKey = (await h()).get(KIOSK_KEY_HEADER);

  if (!apiKey) return false;

  // 正規のAPIキーか検証
  const result = await auth.api.verifyApiKey({ body: { key: apiKey } });

  if (!result.valid) return false;
  const session = await getSession();
  if (!session) return false;
  return Boolean(await db.orm.public.Kiosk.first({ userId: session.user.id }));
});
