"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function logout() {
  // Sign out the browser session, without passing the kiosk's mock session.
  const requestHeaders = new Headers(await headers());
  requestHeaders.delete("x-api-key");
  await auth.api.signOut({ headers: requestHeaders });
  redirect("/login");
}
