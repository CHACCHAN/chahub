"use client";

import { useEffect } from "react";
import { toast } from "@/components/notifications";
import { PageHeader } from "@/components/ui";
import { LoginButton } from "@/components/auth";

export default function LoginForm({ failed }: { failed: boolean }) {
  useEffect(() => {
    if (failed) toast.error("認証に失敗しました。もう一度ログインしてください。", { id: "oidc-login-error" });
  }, [failed]);
  return <main className="mx-auto max-w-sm space-y-6 p-8">
    <PageHeader title="ログイン" />
    <LoginButton fullWidth>Authentik でログイン</LoginButton>
  </main>;
}
