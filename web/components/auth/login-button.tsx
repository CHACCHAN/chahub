"use client";

import { authClient } from "@/lib/better-auth/client";
import { AuthButton, type AuthButtonProps } from "./auth-button";

export type LoginButtonProps = AuthButtonProps & {
  /** Same-origin destination after authentication. */
  callbackURL?: string;
};

export function LoginButton({ callbackURL = "/", ...props }: LoginButtonProps) {
  async function login() {
    const { error } = await authClient.signIn.social({
      provider: "authentik",
      callbackURL,
      errorCallbackURL: "/login?error=oidc",
    });
    if (error) throw new Error(error.message);
  }

  return <AuthButton {...props} kind="login" onAction={login} />;
}
