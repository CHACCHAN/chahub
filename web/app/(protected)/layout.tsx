import { getSession } from "@/lib/better-auth/session";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!await getSession()) redirect("/login");

  return children;
}
