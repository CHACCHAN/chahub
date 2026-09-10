"use client";

import { useEffect, useState } from "react";
import { connectKiosk, getOrCreateKioskId, isFreeKiosk } from "@/features/kiosk/browser";
import { Notice, Spinner, TextLink } from "@/component/ui";
import { routes } from "@/lib/routes";

export function KioskConnect() {
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function connect() {
      if (!await isFreeKiosk()) throw new Error("Free Kiosk のローカル API に接続できません。Free Kiosk の REST API をポート 8080 で有効にして、再読み込みしてください。");
      if (!active) return;
      let deviceId: string;
      try { deviceId = getOrCreateKioskId(); }
      catch { throw new Error("端末 ID を保存できません。ブラウザーのストレージを有効にしてください。"); }
      await connectKiosk(deviceId);
      if (active) window.location.replace(routes.kiosk);
    }
    void connect().catch(error => {
      if (active) setError(error instanceof Error ? error.message : "接続できませんでした。");
    });
    return () => { active = false; };
  }, []);

  if (error) return <Notice variant="warning" title="接続できませんでした" action={<TextLink href="/login?browser=1">通常のログインへ</TextLink>}>{error}</Notice>;
  return <p role="status" className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
    <Spinner />この端末を自動登録して接続しています…
  </p>;
}
