import type { ReactNode } from "react";

export function PageHeader({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return <header className="mb-8 space-y-2">
    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
    {description && <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>}
  </header>;
}
