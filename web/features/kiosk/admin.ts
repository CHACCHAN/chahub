import { db } from "@/prisma/db";
import { KIOSK_ONLINE_WINDOW_MS } from "@/features/kiosk/device";

/** 管理画面の一覧に出す端末。online はいまサイトを訪問中かどうか。 */
export type KioskRow = {
  deviceId: string; name: string; enabled: boolean; online: boolean;
  location: string | null; note: string | null; lastSeenAt: string | null; createdAt: string;
};

type Client = Pick<typeof db, "orm">;
const iso = (value: Date | string | null | undefined) => value == null ? null : new Date(value).toISOString();

/** 自動登録済みの端末情報を編集する。 */
export async function updateKiosk(input: { deviceId: string; name: string; location?: string | null; note?: string | null }, client: Client = db) {
  return client.orm.public.KioskDevice.where({ deviceId: input.deviceId }).update({
    name: input.name, location: input.location || null, note: input.note || null, updatedAt: new Date().toISOString(),
  });
}

/** 端末を有効 / 無効にする。無効にすると訪問しても認識しない。 */
export async function setKioskEnabled(deviceId: string, enabled: boolean, client: Client = db) {
  if (!await client.orm.public.KioskDevice.first({ deviceId })) return false;
  await client.orm.public.KioskDevice.where({ deviceId }).update({ enabled, updatedAt: new Date().toISOString() });
  return true;
}

export async function deleteKiosk(deviceId: string, client: Client = db) {
  if (!await client.orm.public.KioskDevice.first({ deviceId })) return false;
  await client.orm.public.KioskDevice.where({ deviceId }).delete();
  return true;
}

export async function listKiosks(client: Client = db): Promise<KioskRow[]> {
  const devices = await client.orm.public.KioskDevice.orderBy(device => device.createdAt.desc()).all();
  const online = Date.now() - KIOSK_ONLINE_WINDOW_MS;
  return devices.map(device => {
    const lastSeenAt = iso(device.lastSeenAt);
    return {
      deviceId: device.deviceId, name: device.name, enabled: device.enabled,
      online: device.enabled && lastSeenAt !== null && new Date(lastSeenAt).getTime() > online,
      location: device.location ?? null, note: device.note ?? null,
      lastSeenAt, createdAt: new Date(device.createdAt).toISOString(),
    };
  });
}
