import type { ComponentProps, ReactNode } from "react";

const variants = {
  info: "border-indigo-200 bg-indigo-50/60 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200",
  warning: "border-amber-300 bg-amber-50/60 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
};

/** 補足や注意を伝える帯。`title` は見出し、`action` は下に置くリンクやボタン。 */
export function Notice({ variant = "info", title, action, className = "", children, ...props }: Omit<ComponentProps<"div">, "title"> & { variant?: keyof typeof variants; title?: ReactNode; action?: ReactNode }) {
  return <div {...props} className={`rounded-2xl border p-6 ${variants[variant]} ${className}`}>
    {title && <h2 className="font-semibold">{title}</h2>}
    {children && <div className={`text-sm leading-6 ${title ? "mt-2" : ""}`}>{children}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>;
}
