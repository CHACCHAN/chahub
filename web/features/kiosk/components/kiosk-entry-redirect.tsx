"use client";

import { useEffect } from "react";
import { isFreeKiosk } from "@/features/kiosk/browser";
import { routes } from "@/lib/routes";

/**
 * キオスク端末が /login に流れ着いたとき、キオスクの入口へ戻す。
 * 無人の端末がログイン画面で止まらないようにするための転送。
 * /kiosk-connect は公開ルートで /login へ戻さないため、ここでループにはならない。
 * 同じ端末で人が通常ログインしたいときは /login?browser=1 を開く(この転送を止める)。
 */
export function KioskEntryRedirect() {
  useEffect(() => {
    let active = true;
    void isFreeKiosk().then(available => {
      if (active && available) window.location.replace(routes.kioskConnect);
    });
    return () => { active = false; };
  }, []);

  return null;
}
