/** 一覧行で使うユーザーの名前・メール表示。管理画面のユーザー/ロール一覧で共通です。 */
export function UserIdentity({ user, self = false, avatar = false, kiosk = false }: { user: { name?: string | null; email: string }; self?: boolean; avatar?: boolean; kiosk?: boolean }) {
  const label = user.name || user.email;
  return <div className="flex min-w-0 items-center gap-3">
    {avatar && <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">{label.trim().slice(0, 1).toUpperCase() || "?"}</span>}
    <div className="min-w-0">
      <p className="break-words text-sm font-medium">{user.name || "名前未設定"}{self && <span className="ml-2 text-xs text-zinc-500">あなた</span>}{kiosk && <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">キオスク</span>}</p>
      <p className="mt-1 break-all text-xs text-zinc-500">{user.email}</p>
    </div>
  </div>;
}
