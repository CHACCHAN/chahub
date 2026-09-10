import { Suspense } from "react";
import { getAdminPageUser } from "@/features/admin/access";
import { db } from "@/prisma/db";
import { SectionCard, LiveKitCard } from "@/features/admin/components/dashboard-cards";
import { PageHeader, Card, Spinner } from "@/component/ui";

export default async function AdminPage() {
  await getAdminPageUser();
  const [users, teams, kiosks] = await Promise.all([
    db.orm.public.AuthUser.select("role").all(),
    db.orm.public.AuthTeam.aggregate(aggregate => ({ count: aggregate.count() })),
    db.orm.public.KioskDevice.aggregate(aggregate => ({ count: aggregate.count() })),
  ]);
  const administrators = users.filter(user => user.role?.split(",").includes("administrator")).length;
  return <>
    <PageHeader title="ダッシュボード" description="ChaHub の利用状況と、管理機能への入り口です。" />
    <section aria-label="管理機能と利用状況" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SectionCard href="/admin/users" title="ユーザー" count={users.length} unit="人" description="登録ユーザーと現在のロールを確認します。" />
      <SectionCard href="/admin/teams" title="チーム" count={teams.count + 2} unit="チーム" description="標準チームを含むチームの作成・削除と所属人数を確認します。" />
      <SectionCard href="/admin/roles" title="ロール・権限" count={administrators} unit="人の管理者" description="チームごと・ユーザーごとにロールを設定します。" />
      <SectionCard href="/admin/kiosks" title="キオスク端末" count={kiosks.count} unit="台" description="自動登録されたキオスク端末を管理します。" />
      <Suspense fallback={<Card className="flex min-h-48 items-center justify-center p-6 text-sm text-zinc-500"><Spinner /><span className="ml-2">LiveKit に接続中…</span></Card>}>
        <LiveKitCard />
      </Suspense>
    </section>
  </>;
}
