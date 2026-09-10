"use client";

import { useEffect } from "react";
import { connectKiosk, getOrCreateKioskId, isFreeKiosk } from "@/features/kiosk/browser";
import { routes } from "@/lib/routes";

/** ローカル API を確認してから、30 秒ごとに在席を更新する。 */
export function KioskHeartbeat() {
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function ping() {
      try {
        if (!await isFreeKiosk()) throw new Error("Free Kiosk unavailable");
        if (!active) return;
        await connectKiosk(getOrCreateKioskId());
      } catch {
        if (active) window.location.replace(routes.kioskConnect);
        return;
      }
      if (active) timer = setTimeout(() => void ping(), 30_000);
    }
    void ping();
    return () => { active = false; clearTimeout(timer); };
  }, []);
  return null;
}
