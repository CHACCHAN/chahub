import type { ComponentProps } from "react";

/** 24px グリッドの線画アイコン。`path` に SVG の d 属性を渡します。装飾扱いなので意味はテキストで補ってください。 */
export function Icon({ path, className = "", ...props }: Omit<ComponentProps<"svg">, "children"> & { path: string }) {
  return <svg aria-hidden="true" {...props} className={`size-4 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>;
}
