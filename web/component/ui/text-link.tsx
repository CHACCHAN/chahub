import type { ComponentProps } from "react";
import Link from "next/link";

/** 本文中や見出し横に置くインディゴのリンク。ボタン状のリンクには Button / CardLink を使います。 */
export function TextLink({ className = "", prefetch = false, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={prefetch} className={`rounded text-sm font-medium text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-400 ${className}`} />;
}
