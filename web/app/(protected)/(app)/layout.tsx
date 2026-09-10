import { KioskEntryRedirect } from "@/features/kiosk/components/kiosk-entry-redirect";
import { routes } from "@/lib/routes";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { getKioskDevice } from "@/features/kiosk/device";
import { roleLabels } from "@/features/admin/roles";
import { AppSidebar } from "@/component/layout/sidebar";

// 一般画面(/)と管理者画面(/admin 以下)で共通のサイドバーレイアウト。
// メニューは「一般」と「管理者」に分かれ、管理者メニューは管理者にだけ表示する。
// 常駐キオスク端末はこのレイアウトを使わず、専用の /kiosk へ転送する。
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (await getKioskDevice()) redirect(routes.kiosk);
  const session = await getSession();
  if (!session) redirect("/login");
  const administrator = Boolean(session.user.role?.split(",").includes("administrator"));
  return <div className="mx-auto flex min-h-dvh max-w-[1440px] flex-col text-zinc-900 md:flex-row dark:text-zinc-100">
    <KioskEntryRedirect />
    <AppSidebar administrator={administrator} name={session.user.name || "ユーザー"} role={administrator ? roleLabels.administrator : roleLabels.member} />
    <main id="app-content" className="min-w-0 flex-1 bg-zinc-50/40 px-4 py-8 sm:px-8 lg:px-10 dark:bg-zinc-900/20">{children}</main>
  </div>;
}
