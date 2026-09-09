import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isKiosk } from "@/lib/better-auth/session";
import { roleLabels } from "@/lib/admin/roles";
import { AppNavigation } from "@/components/app/navigation";
import { Card, Logo } from "@/components/ui";

// 一般画面(/)と管理者画面(/admin 以下)で共通のサイドバーレイアウト。
// メニューは「一般」と「管理者」に分かれ、管理者メニューは管理者にだけ表示する。
// 常駐キオスク端末(x-api-key で認証)はこのレイアウトを使わず、専用の /kiosk へ転送する。
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (await isKiosk()) redirect("/kiosk");
  const administrator = Boolean(session.user.role?.split(",").includes("administrator"));
  return <div className="mx-auto flex max-w-[1440px] flex-col border-t border-zinc-200 text-zinc-900 md:min-h-[calc(100dvh-5rem)] md:flex-row dark:border-zinc-800 dark:text-zinc-100">
    <aside className="shrink-0 border-b border-zinc-200 bg-zinc-50/70 md:w-60 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="md:sticky md:top-0 md:flex md:min-h-[calc(100dvh-5rem)] md:flex-col md:p-5">
        <div className="hidden px-4 pt-2 pb-8 md:block">
          <Link href="/"><Logo className="text-xl" /></Link>
        </div>
        <AppNavigation administrator={administrator} />
        <div className="hidden pt-10 md:mt-auto md:block">
          <Card className="p-4">
            <p className="truncate text-sm font-medium">{session.user.name || "ユーザー"}</p>
            <p className={`mt-1 text-xs ${administrator ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500"}`}>
              {administrator ? roleLabels.administrator : roleLabels.member}
            </p>
          </Card>
        </div>
      </div>
    </aside>
    <main id="app-content" className="min-w-0 flex-1 bg-zinc-50/40 px-4 py-8 sm:px-8 lg:px-10 dark:bg-zinc-900/20">{children}</main>
  </div>;
}
