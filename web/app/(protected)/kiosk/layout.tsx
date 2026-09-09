import { redirect } from "next/navigation";
import { isKiosk } from "@/lib/better-auth/session";
import { routes } from "@/lib/routes";

// /kiosk 以下はキオスク端末専用。一般端末はアプリのホームへ戻す。
export default async function KioskLayout({ children }: { children: React.ReactNode }) {
  if (!await isKiosk()) redirect(routes.app);
  return children;
}
