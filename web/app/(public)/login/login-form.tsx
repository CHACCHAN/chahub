"use client";

import { useEffect } from "react";
import { toast } from "@/components/notifications";
import { Icon } from "@/components/ui";
import { LoginButton } from "@/components/auth";

export default function LoginForm({ failed }: { failed: boolean }) {
  useEffect(() => {
    if (failed) toast.error("認証に失敗しました。もう一度ログインしてください。", { id: "oidc-login-error" });
  }, [failed]);
  return <div className="space-y-4">
    {failed && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <Icon path="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" className="mt-1" />
      認証に失敗しました。時間をおいて、もう一度お試しください。
    </p>}
    <LoginButton fullWidth className="min-h-12 text-base">Authentik でログイン</LoginButton>
    <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">Authentik のログイン画面に移動します。</p>
  </div>;
}
