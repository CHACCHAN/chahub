"use client";

import { useSyncExternalStore } from "react";

const timeFormat = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
const dateFormat = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" });

// 10 秒ごとに再評価し、分が変わったときだけ再描画する。
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 10_000);
  return () => clearInterval(timer);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

/** 端末の時刻表示。サーバーでは時刻を出さず、クライアントで描画してずれを避ける。 */
export function Clock() {
  const minute = useSyncExternalStore(subscribe, currentMinute, serverMinute);
  const now = minute === null ? null : new Date(minute * 60_000);
  return <div className="text-right">
    <p className="text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">{now ? timeFormat.format(now) : "--:--"}</p>
    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{now ? dateFormat.format(now) : " "}</p>
  </div>;
}
