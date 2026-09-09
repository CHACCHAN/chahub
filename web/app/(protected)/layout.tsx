import { getSession } from "@/lib/better-auth/session";
import { LogoutButton } from "@/components/auth";
import { ThemeToggle } from "@/components/ui";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!await getSession()) redirect("/login");

  return <>
    <header className="flex items-center justify-end gap-3 p-4"><ThemeToggle /><LogoutButton /></header>
    {children}
  </>;
}
