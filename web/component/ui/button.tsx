import type { ComponentProps, ReactNode } from "react";
import { Spinner } from "./spinner";

const variants = {
  primary: "border-indigo-600 bg-indigo-600 text-white shadow-sm enabled:hover:bg-indigo-500 dark:border-indigo-500 dark:bg-indigo-500 dark:enabled:hover:bg-indigo-400",
  secondary: "border-zinc-200 bg-white text-zinc-700 shadow-sm enabled:hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:enabled:hover:bg-zinc-800",
  danger: "border-transparent bg-transparent text-red-600 enabled:hover:bg-red-50 dark:text-red-400 dark:enabled:hover:bg-red-950",
};

export type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  pending?: boolean;
  pendingLabel?: ReactNode;
  fullWidth?: boolean;
};

export function Button({ variant = "primary", pending = false, pendingLabel, fullWidth = false, disabled, type = "button", className = "", children, ...props }: ButtonProps) {
  return <button {...props} type={type} disabled={disabled || pending} aria-busy={pending || props["aria-busy"]}
    className={`inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}>
    {pending && <Spinner />}
    {pending && pendingLabel ? pendingLabel : children}
  </button>;
}
