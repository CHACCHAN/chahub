import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { db } from "@/prisma/db";
import { listKiosks } from "@/lib/admin/kiosks";
import { Card, Badge, Icon } from "@/components/ui";
import { Clock } from "@/components/home/clock";

// 家の中に常駐させるキオスク端末(Android タブレット + Tauri)専用のホーム画面。機能は未実装で、枠だけを用意している。
// 通常のブラウザーからログインした場合は、サイドバー付きの共通レイアウト(app/(protected)/(app)/)のホーム / を開く。
const services = [
  { title: "伝言板", description: "家族への伝言や買い物のメモを端末間で共有します。", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { title: "家の状態", description: "ドア・窓・室温などのセンサーの状態と見守りの記録を表示します。", icon: "M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" },
  { title: "買い物リスト", description: "足りないものを追加して、外出中の家族と共有します。", icon: "M6 6h15l-1.5 9h-12zM6 6 5 3H2M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" },
  { title: "予定と天気", description: "今日の予定、ゴミ出しの日、天気予報をまとめて確認します。", icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
  { title: "タイマー", description: "料理や洗濯のタイマーを、どの端末からでも確認できます。", icon: "M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 10v4l3 2M9 2h6" },
  { title: "家電の操作", description: "照明やエアコンなど、連携した家電をまとめて操作します。", icon: "M9 2v6M15 2v6M5 8h14v4a7 7 0 0 1-14 0zM12 19v3" },
];

export default async function KioskHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [kiosk, devices] = await Promise.all([
    db.orm.public.Kiosk.include("user", user => user.select("name")).first({ userId: session.user.id }),
    listKiosks(),
  ]);
  const others = devices.filter(device => device.userId !== session.user.id);
  return <main className="mx-auto max-w-6xl px-6 pb-16">
    <header className="flex flex-wrap items-end justify-between gap-6 py-6">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {kiosk ? <>この端末: <span className="font-medium text-zinc-700 dark:text-zinc-200">{kiosk.user?.name}</span>{kiosk.location && <> ・ {kiosk.location}</>}</> : <>{session.user.name} としてログイン中</>}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">こんにちは</h1>
      </div>
      <Clock />
    </header>

    <section aria-labelledby="intercom-heading" className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="intercom-heading" className="flex items-center gap-2 font-semibold"><Icon path="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" className="text-indigo-500" />ほかの端末と話す</h2>
          <Badge>準備中</Badge>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">家の中の端末を選んで、インターホンのように音声や映像でつなぎます。</p>
        {others.length === 0 ? <p className="mt-6 rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800">ほかの端末はまだ登録されていません。</p> :
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {others.map(device => <li key={device.userId} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="flex min-w-0 items-center gap-3">
                <Icon path="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 19h2" className="size-5 text-zinc-400" />
                <div className="min-w-0"><p className="truncate font-medium">{device.name}</p><p className="truncate text-xs text-zinc-500">{device.location ?? "設置場所未設定"}</p></div>
              </div>
              <span className={`size-2.5 shrink-0 rounded-full ${device.key?.status === "active" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} aria-label={device.key?.status === "active" ? "接続可能" : "停止中"} />
            </li>)}
          </ul>}
      </Card>
      <Card className="flex flex-col justify-between border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/40">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300"><Icon path="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />緊急呼び出し</h2>
            <Badge variant="danger">準備中</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-red-700/80 dark:text-red-300/80">家じゅうの端末に大きな音と通知を送り、家族を呼びます。</p>
        </div>
        <button type="button" disabled aria-disabled="true" className="mt-6 min-h-16 w-full rounded-2xl bg-red-600 text-lg font-semibold text-white opacity-60 disabled:cursor-not-allowed">呼び出す</button>
      </Card>
    </section>

    <section aria-labelledby="services-heading" className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 id="services-heading" className="font-semibold">サービス</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">家の中で使う便利な機能をここに並べます。順次追加していきます。</p>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map(service => <li key={service.title}>
          <Card className="h-full p-6 opacity-80" aria-disabled="true">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"><Icon path={service.icon} className="size-6" /></span>
              <Badge>準備中</Badge>
            </div>
            <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{service.description}</p>
          </Card>
        </li>)}
      </ul>
    </section>

    <footer className="mt-10 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      この端末の登録・キーの管理は、別の端末から管理者ダッシュボードで行います。
    </footer>
  </main>;
}
