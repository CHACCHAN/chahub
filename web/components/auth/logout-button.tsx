"use client";

import { authClient } from "@/lib/better-auth/client";
import { toast } from "@/components/notifications";
import { useRouter } from "next/navigation";
import { AuthButton, type AuthButtonProps } from "./auth-button";

export function LogoutButton(props: AuthButtonProps) {
  const router = useRouter();
  async function logout() {
    const { error } = await authClient.signOut();
    if (error) throw new Error(error.message);
    toast.success("ログアウトしました。");
    router.replace("/login");
    router.refresh();
  }

  return <AuthButton {...props} kind="logout" onAction={logout} />;
}
