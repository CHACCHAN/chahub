import { Card, TextLink } from "@/components/ui";
import Link from "next/link";
import { getAdminPageUser } from "@/lib/admin/access";
import { AdminNavigation } from "@/components/admin/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminPageUser();
  return <div className="mx-auto flex max-w-[1440px] flex-col border-t border-zinc-200 text-zinc-900 md:min-h-[calc(100dvh-5rem)] md:flex-row dark:border-zinc-800 dark:text-zinc-100">
    <aside className="shrink-0 border-b border-zinc-200 bg-zinc-50/70 md:w-60 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="md:sticky md:top-0 md:flex md:min-h-[calc(100dvh-5rem)] md:flex-col md:p-5">
        <div className="hidden px-4 pt-2 pb-8 md:block">
          <Link href="/" className="text-xl font-semibold tracking-tight">ChaHub<span className="text-indigo-500">.</span></Link>
          <p className="mt-2 text-xs font-medium tracking-wider text-zinc-500">管理コンソール</p>
        </div>
        <AdminNavigation />
        <div className="hidden pt-10 md:mt-auto md:block">
          <Card className="p-4">
            <p className="truncate text-sm font-medium">{user.name || "管理者"}</p>
            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">Administrator</p>
          </Card>
          <TextLink href="/" className="mt-4 block px-4 font-normal text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"><span aria-hidden="true">←</span> ホームに戻る</TextLink>
        </div>
      </div>
    </aside>
    <main id="admin-content" className="min-w-0 flex-1 bg-zinc-50/40 px-4 py-8 sm:px-8 lg:px-10 dark:bg-zinc-900/20">{children}</main>
  </div>;
}
