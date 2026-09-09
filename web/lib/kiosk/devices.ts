import "server-only";
import { listKiosks } from "@/lib/admin/kiosks";
export type KioskDevice = {
  id: string;
  name: string;
  location: string | null;
  enabled: boolean;
};

// 見守り画面に必要な情報だけをクライアントへ渡す。
export async function listKioskDevices(): Promise<KioskDevice[]> {
  return (await listKiosks()).map(device => ({
    id: device.userId,
    name: device.name,
    location: device.location,
    enabled: device.key?.status === "active",
  }));
}
