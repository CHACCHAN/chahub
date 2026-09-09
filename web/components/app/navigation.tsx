"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { genericServices } from "@/lib/generic/services";

type Item = { label: string; icon: string; href: string };

const generalItems: Item[] = [
  { href: "/", label: "ホーム", icon: "M3 11 12 3l9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" },
  ...genericServices.map(service => ({ href: service.href, label: service.title, icon: service.icon })),
];

const adminItems: Item[] = [
  { href: "/admin", label: "ダッシュボード", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { href: "/admin/teams", label: "チーム", icon: "M3 7h7l2 2h9v11H3zM3 7V4h7l2 3" },
  { href: "/admin/users", label: "ユーザー", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0" },
  { href: "/admin/roles", label: "ロール・権限", icon: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-5" },
  { href: "/admin/kiosks", label: "キオスク端末", icon: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 17h18M11 20h2" },
  { href: "/admin/livekit", label: "LiveKit", icon: "M15 10l4.55-2.28A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.9L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
];

const base = "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium";

/** 一般メニューと管理者メニューを分けて表示するサイドバーのナビゲーション。 */
export function AppNavigation({ administrator }: { administrator: boolean }) {
  const pathname = usePathname();
  const groups = [
    { title: "一般メニュー", items: generalItems },
    ...(administrator ? [{ title: "管理者メニュー", items: adminItems }] : []),
  ];
  return <nav aria-label="メニュー" className="flex gap-1 overflow-x-auto p-2 md:flex-col md:gap-7 md:overflow-visible md:p-0">
    {groups.map(group => <div key={group.title} className="flex shrink-0 gap-1 md:flex-col">
      <p className="hidden px-4 pb-2 text-xs font-medium tracking-wider text-zinc-500 md:block">{group.title}</p>
      {group.items.map(item => {
        const active = item.href === "/" || item.href === "/admin"
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return <Link key={item.href} href={item.href} prefetch={false} aria-current={active ? "page" : undefined}
          className={`${base} transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${active ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"}`}>
          <Icon path={item.icon} />{item.label}
        </Link>;
      })}
    </div>)}
  </nav>;
}
