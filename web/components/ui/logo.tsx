import type { ComponentProps } from "react";

/** ChaHub のロゴ(ハブを表す結線マーク + ワードマーク)。ログイン画面・管理画面のサイドバー・トップの選択画面で使う。 */
export function Logo({ mark = true, className = "" }: { mark?: boolean } & Omit<ComponentProps<"span">, "children">) {
  return <span {...{ className: `inline-flex items-center gap-2 font-semibold tracking-tight ${className}` }}>
    {mark && <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[1.15em] shrink-0 text-indigo-500">
      <circle cx="12" cy="12" r="11" fill="currentColor" fillOpacity=".12" />
      <path d="M12 8v3M12 11 8.3 14.3M12 11l3.7 3.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="6.2" r="2" fill="currentColor" />
      <circle cx="6.8" cy="16.4" r="2" fill="currentColor" />
      <circle cx="17.2" cy="16.4" r="2" fill="currentColor" />
    </svg>}
    <span>ChaHub<span className="text-indigo-500">.</span></span>
  </span>;
}
