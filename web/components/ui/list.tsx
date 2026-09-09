import { Children, type ComponentProps, type ReactNode } from "react";

/** 区切り線付きの縦リスト。`empty` を渡すと項目が無いときに案内文を表示します。 */
export function List({ empty, className = "", children, ...props }: ComponentProps<"ul"> & { empty?: ReactNode }) {
  if (empty != null && Children.toArray(children).length === 0)
    return <p className="p-10 text-center text-sm leading-7 text-zinc-500">{empty}</p>;
  return <ul {...props} className={`divide-y divide-zinc-100 dark:divide-zinc-800 ${className}`}>{children}</ul>;
}

export function ListItem({ className = "", ...props }: ComponentProps<"li">) {
  return <li {...props} className={`flex flex-wrap items-center justify-between gap-4 p-6 ${className}`} />;
}
