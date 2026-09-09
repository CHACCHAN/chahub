"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { AppNavigation } from "./navigation";
import { Button, Card, Icon, Logo, ThemeToggle } from "@/components/ui";
import { routes } from "@/lib/routes";
import { LogoutButton } from "@/components/auth";

export function AppSidebar({ administrator, name, role }: { administrator: boolean; name: string; role: string }) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { dialog.current?.close(); }, [pathname]);
  useEffect(() => {
    // デスクトップへ切り替えた際、非表示のモーダルが背景操作を妨げないよう閉じる。
    const observer = new ResizeObserver(() => {
      if (!toggle.current?.getClientRects().length) dialog.current?.close();
    });
    if (toggle.current) observer.observe(toggle.current);
    return () => observer.disconnect();
  }, []);
  const logo = <Link href={routes.app} aria-label="ChaHub ホーム"><Logo className="text-xl" /></Link>;
  const menu = <div className="flex flex-col gap-6">
    <AppNavigation administrator={administrator} />
    <Card className="space-y-4 p-4">
      <div><p className="truncate text-sm font-medium">{name}</p><p className="mt-1 text-xs text-zinc-500">{role}</p></div>
      <ThemeToggle compact />
      <LogoutButton />
    </Card>
  </div>;
  return <>
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200 bg-zinc-50 p-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
      {logo}
      <Button ref={toggle} variant="secondary" aria-haspopup="dialog" aria-controls="app-menu" aria-label="メニューを開く" onClick={() => dialog.current?.showModal()}>
        <Icon path="M3 6h18M3 12h18M3 18h18" />
      </Button>
    </header>
    <dialog ref={dialog} id="app-menu" data-app-menu aria-label="メニュー" className="m-0 max-h-dvh w-full max-w-none overflow-y-auto overscroll-contain border-b border-zinc-200 bg-zinc-50 p-4 text-zinc-900 shadow-xl backdrop:bg-black/40 md:hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      onClick={event => { if (event.target === event.currentTarget || (event.target as HTMLElement).closest("a")) dialog.current?.close(); }}>
      <div className="mb-4 flex items-center justify-between">
        {logo}
        <Button variant="secondary" aria-label="メニューを閉じる" onClick={() => dialog.current?.close()}><Icon path="M6 6l12 12M6 18 18 6" /></Button>
      </div>
      {menu}
    </dialog>
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-zinc-50 md:block dark:border-zinc-800 dark:bg-zinc-950">
      <div className="sticky top-0 max-h-dvh overflow-y-auto p-5">
        <div className="px-4 pt-2 pb-8">{logo}</div>
        {menu}
      </div>
    </aside>
  </>;
}
