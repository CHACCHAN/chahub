import { listKioskDevices } from "@/lib/kiosk/devices";
import { findService } from "@/lib/generic/services";
import { routes } from "@/lib/routes";
import { KioskConsole } from "@/components/kiosk/console";
import { PageHeader } from "@/components/ui";

export default async function KiosksPage() {
  const devices = await listKioskDevices();
  const service = findService(routes.kioskMonitor);
  return <div className="space-y-6"><PageHeader title={service.title} description={service.description} /><KioskConsole devices={devices} /></div>;
}
