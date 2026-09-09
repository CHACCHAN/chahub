import { Suspense } from "react";
import { getAdminPageUser } from "@/lib/admin/access";
import { db } from "@/prisma/db";
import { getLiveKitStatus } from "@/lib/livekit/status";
import { PageHeader, CardLink, Card, Spinner } from "@/components/ui";

function SectionCard({ href, title, count, unit, description }: { href: string; title: string; count: number | string; unit: string; description: string }) {
  return <CardLink href={href} prefetch={false} className="p-6">
    <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</h2>
    <p className="my-5"><span className="text-4xl font-semibold tabular-nums">{count}</span><span className="ml-2 text-xs text-zinc-500">{unit}</span></p>
    <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>
    <p className="mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-400">管理する <span aria-hidden="true">→</span></p>
  </CardLink>;
}

// LiveKit サーバーへの問い合わせは他のカードを待たせないようにストリーミングする。
async function LiveKitCard() {
  const status = await getLiveKitStatus();
  const healthy = status.http.ok && status.api.ok;
  return <SectionCard href="/admin/livekit" title="LiveKit" count={healthy ? status.rooms.length : "—"} unit={healthy ? "ルーム" : "接続できません"}
    description={healthy ? "サーバーの接続状況と、開かれているルーム・参加者を確認します。" : status.api.detail ?? status.http.detail ?? "接続状況を確認します。"} />;
}

export default async function AdminPage() {
  await getAdminPageUser();
  const [users, teams, kiosks] = await Promise.all([
    db.orm.public.AuthUser.select("role").all(),
    db.orm.public.AuthTeam.aggregate(aggregate => ({ count: aggregate.count() })),
    db.orm.public.Kiosk.aggregate(aggregate => ({ count: aggregate.count() })),
  ]);
  const administrators = users.filter(user => user.role?.split(",").includes("administrator")).length;
  return <>
    <PageHeader title="ダッシュボード" description="ChaHub の利用状況と、管理機能への入り口です。" />
    <section aria-label="管理機能と利用状況" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SectionCard href="/admin/users" title="ユーザー" count={users.length} unit="人" description="登録ユーザーと現在のロールを確認します。" />
      <SectionCard href="/admin/teams" title="チーム" count={teams.count + 2} unit="チーム" description="標準チームを含むチームの作成・削除と所属人数を確認します。" />
      <SectionCard href="/admin/roles" title="ロール・権限" count={administrators} unit="人の管理者" description="チームごと・ユーザーごとにロールを設定します。" />
      <SectionCard href="/admin/kiosks" title="キオスク端末" count={kiosks.count} unit="台" description="端末アカウントと API キーを発行・管理します。" />
      <Suspense fallback={<Card className="flex min-h-48 items-center justify-center p-6 text-sm text-zinc-500"><Spinner /><span className="ml-2">LiveKit に接続中…</span></Card>}>
        <LiveKitCard />
      </Suspense>
    </section>
  </>;
}
