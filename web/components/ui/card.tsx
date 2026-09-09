import { useId, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";

const cardClassName = "rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

type CardProps = ComponentProps<"div"> & {
  as?: "div" | "section" | "article";
  /** 見出し(h2)。指定すると見出し帯と本文の構造になり、aria-labelledby も自動で付きます。 */
  title?: ReactNode;
  /** 見出し横の件数などの補足。 */
  meta?: ReactNode;
  /** 見出し下の説明文。 */
  description?: ReactNode;
  /** 見出し帯の右側に置くリンクやボタン。 */
  action?: ReactNode;
  /** 見出し帯の下に区切り線を引き、本文を余白なしで置きます(List を続けるとき)。 */
  divided?: boolean;
};

export function Card({ as: Tag = "div", title, meta, description, action, divided = false, className = "", children, ...props }: CardProps) {
  const id = useId();
  if (title == null) return <Tag {...props} className={`${cardClassName} ${className}`}>{children}</Tag>;
  return <Tag aria-labelledby={id} {...props} className={`${cardClassName} ${className}`}>
    <div className={`flex flex-wrap items-start justify-between gap-3 p-6 ${divided ? "border-b border-zinc-100 dark:border-zinc-800" : "pb-0"}`}>
      <div className="min-w-0">
        <h2 id={id} className="font-semibold">{title}{meta != null && <span className="ml-2 text-sm font-normal text-zinc-500">{meta}</span>}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {action}
    </div>
    {divided ? children : <div className="p-6">{children}</div>}
  </Tag>;
}

export function CardLink({ className = "", ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} className={`${cardClassName} block transition-colors hover:border-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:hover:border-indigo-700 ${className}`} />;
}
