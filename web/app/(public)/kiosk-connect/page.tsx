import { Card, Logo, ThemeToggle } from "@/component/ui";
import { KioskConnect } from "@/features/kiosk/components/kiosk-connect";

// キオスク端末の入口。Free Kiosk の Start URL にこのパスを設定する。
// 公開ルートなので未登録の端末でも /login へは飛ばさない ＝ ここでループにはならない。
export default async function KioskConnectPage() {
  return <main className="relative flex min-h-dvh items-center justify-center px-6 py-12">
    <div className="absolute top-4 right-4"><ThemeToggle /></div>
    <div className="w-full max-w-lg">
      <Card as="section" aria-labelledby="kiosk-connect-heading" className="p-6 sm:p-8">
        <Logo className="text-2xl" />
        <h1 id="kiosk-connect-heading" className="mt-8 text-xl font-semibold">キオスク端末を接続</h1>
        <p className="mt-2 mb-6 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Free Kiosk を確認し、この端末を自動登録してキオスク画面を開きます。
        </p>
        <KioskConnect />
      </Card>
    </div>
  </main>;
}
