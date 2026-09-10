"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** ライト / ダーク / システムのテーマを <html class="dark"> と localStorage("chahub-theme")で管理する。ルートレイアウトで 1 回だけ使う。 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemesProvider attribute="class" defaultTheme="system" enableSystem storageKey="chahub-theme" disableTransitionOnChange>
    {children}
  </NextThemesProvider>;
}
