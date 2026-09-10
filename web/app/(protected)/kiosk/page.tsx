import { redirect } from "next/navigation";
import { genericServices } from "@/features/generic/services";
import { getKioskDevice, listOnlineKioskDevices } from "@/features/kiosk/device";
import { routes } from "@/lib/routes";
import { Card, Badge, Icon, Logo } from "@/component/ui";
import { KioskConsole } from "@/features/kiosk/components/console";
import { Clock } from "@/features/kiosk/components/clock";

// 常駐キオスク端末専用のホーム画面。
// 通常のブラウザーからログインした場合は、サイドバー付きの共通レイアウト(app/(protected)/(app)/)のホーム / を開く。

export default async function KioskHomePage() {
  const device = await getKioskDevice();
  if (!device) redirect(routes.app);
  const devices = await listOnlineKioskDevices();
  return <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
    <div className="pt-5"><Logo className="text-xl" /></div>
    <header className="flex flex-wrap items-end justify-between gap-6 py-6">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          この端末: <span className="font-medium text-zinc-700 dark:text-zinc-200">{device.name}</span>{device.location && <> ・ {device.location}</>}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">こんにちは</h1>
      </div>
      <Clock />
    </header>

    <KioskConsole ownId={device.deviceId} devices={devices} />

    <section aria-labelledby="services-heading" className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 id="services-heading" className="font-semibold">サービス</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">家の中で使う便利な機能をここに並べます。順次追加していきます。</p>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {genericServices.filter(service => !service.available).map(service => <li key={service.title}>
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
      この端末の登録は、別の端末から管理者ダッシュボードで行います。
    </footer>
  </main>;
}
