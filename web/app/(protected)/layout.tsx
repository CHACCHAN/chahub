import { getSession } from "@/lib/better-auth/session";
import { LogoutButton } from "@/components/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!await getSession()) redirect("/login");

  return <>
    <header className="flex justify-end p-4"><LogoutButton /></header>
    {children}
  </>;
}
