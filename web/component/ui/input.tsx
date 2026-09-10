import { useId, type ComponentProps, type ReactNode } from "react";

export const fieldClassName = "min-h-11 min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export type FieldProps = { label?: ReactNode; wrapperClassName?: string };

/** `label` を渡すとラベル付きの縦並びになり、id を自動で結び付けます。 */
export function Field({ id, label, wrapperClassName = "", children }: { id: string; label?: ReactNode; wrapperClassName?: string; children: ReactNode }) {
  if (label == null) return children;
  return <div className={wrapperClassName}>
    <label htmlFor={id} className="mb-2 block text-sm font-medium">{label}</label>
    {children}
  </div>;
}

export function Input({ label, wrapperClassName, id: givenId, className = "", ...props }: ComponentProps<"input"> & FieldProps) {
  const generated = useId();
  const id = givenId ?? generated;
  return <Field id={id} label={label} wrapperClassName={wrapperClassName}>
    <input {...props} id={id} className={`${fieldClassName} ${label != null ? "w-full" : ""} ${className}`} />
  </Field>;
}
