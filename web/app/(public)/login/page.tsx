import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { Card, Logo, ThemeToggle } from "@/component/ui";
import { KioskEntryRedirect } from "@/features/kiosk/components/kiosk-entry-redirect";
import LoginForm from "@/features/auth/components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; browser?: string }> }) {
  if (await getSession()) redirect("/");
  const { error, browser } = await searchParams;
  return <main className="relative flex min-h-dvh items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
    {!browser && <KioskEntryRedirect />}
    <div className="absolute top-4 right-4"><ThemeToggle /></div>
    <div className="w-full max-w-md">
      <Card as="section" aria-labelledby="login-heading" className="p-8 sm:p-10">
        <Logo className="text-2xl" />
        <h1 id="login-heading" className="mt-8 text-xl font-semibold">ログイン</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">家の中の端末と便利なサービスをまとめるハブです。Authentik のアカウントでログインしてください。</p>
        <div className="mt-8"><LoginForm failed={Boolean(error)} /></div>
        <ul className="mt-8 space-y-2 border-t border-zinc-100 pt-6 text-xs leading-5 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <li>ログインすると、ChaHub でのロールと所属チームが自動で反映されます。</li>
          <li>キオスク端末は管理者が発行したキーで接続するため、この画面でのログインは不要です。</li>
        </ul>
      </Card>
      <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">ChaHub</p>
    </div>
  </main>;
}
