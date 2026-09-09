import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { auth } from "@/lib/better-auth/auth";
import { db } from "@/prisma/db";
import { bootstrapAdministrator } from "./bootstrap";

export async function requireAdmin({ bootstrap = false }: { bootstrap?: boolean } = {}) {
  const session = await getSession();
  if (!session) redirect("/login");
  // API keys must never inherit the owner's administrative access.
  if ((await headers()).has("x-api-key")) redirect("/");
  if (bootstrap && !(await headers()).has("next-router-prefetch")) {
    await bootstrapAdministrator(db, session.user.id);
  }
  const result = await auth.api.userHasPermission({
    headers: await headers(),
    body: { permissions: { user: ["set-role"] } },
  });
  if (!result.success) redirect("/");
  return session.user;
}

// Share page authorization between the layout and page within a single request.
export const getAdminPageUser = cache(() => requireAdmin({ bootstrap: true }));
