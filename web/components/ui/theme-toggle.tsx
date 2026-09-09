"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Icon } from "./icon";

const options = [
  { value: "light", label: "ライト", icon: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" },
  { value: "dark", label: "ダーク", icon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" },
  { value: "system", label: "システム", icon: "M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 21h8M12 17v4" },
] as const;

const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

/** テーマの切り替え(ライト / ダーク / システム)。サーバー側では選択状態を出さず、マウント後に反映する。 */
export function ThemeToggle({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const current = mounted ? theme ?? "system" : null;
  return <div role="group" aria-label="テーマ" className={`inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${className}`}>
    {options.map(option => {
      const active = current === option.value;
      return <button key={option.value} type="button" onClick={() => setTheme(option.value)} aria-pressed={active} title={option.label}
        className={`inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${active ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"}`}>
        <Icon path={option.icon} />
        <span className={compact ? "sr-only" : "sr-only sm:not-sr-only"}>{option.label}</span>
      </button>;
    })}
  </div>;
}
