import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { getKioskDevice } from "@/features/kiosk/device";

// 認証の共通境界。人はログインが必要で、登録済みのキオスク端末は認証なしで通す。
export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!await getSession() && !await getKioskDevice()) redirect("/login");

  return children;
}
