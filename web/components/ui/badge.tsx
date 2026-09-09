import type { ComponentProps } from "react";

const variants = {
  neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  accent: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function Badge({ variant = "neutral", className = "", ...props }: ComponentProps<"span"> & { variant?: keyof typeof variants }) {
  return <span {...props} className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${variants[variant]} ${className}`} />;
}
