import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";

// 人のログインセッション。キオスク端末は認証を通さないので、端末の判定は
// features/kiosk/device.ts の getKioskDevice() が担当する。
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));
