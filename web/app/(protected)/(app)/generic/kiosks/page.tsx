import { listOnlineKioskDevices } from "@/features/kiosk/device";
import { findService } from "@/features/generic/services";
import { routes } from "@/lib/routes";
import { KioskConsole } from "@/features/kiosk/components/console";
import { PageHeader } from "@/component/ui";

export default async function KiosksPage() {
  const devices = await listOnlineKioskDevices();
  const service = findService(routes.kioskMonitor);
  return <div className="space-y-6"><PageHeader title={service.title} description={service.description} /><KioskConsole devices={devices} /></div>;
}
