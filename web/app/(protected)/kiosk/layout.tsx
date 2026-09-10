import { redirect } from "next/navigation";
import { getKioskDevice } from "@/features/kiosk/device";
import { routes } from "@/lib/routes";
import { KioskHeartbeat } from "@/features/kiosk/components/heartbeat";

// /kiosk 以下は登録済みキオスク端末専用。一般端末はアプリのホームへ戻す。
export default async function KioskLayout({ children }: { children: React.ReactNode }) {
  if (!await getKioskDevice()) redirect(routes.app);
  return <>{children}<KioskHeartbeat /></>;
}
