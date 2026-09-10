import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/prisma/db";

// next/headers と DB を使うサーバー側のモジュール(テストから直接読めるよう server-only は付けない)。

/** localStorage に保存した UUIDを持ち回す Cookie。POST /api/kiosk/session が書き込む。 */
export const KIOSK_DEVICE_COOKIE = "chahub.kiosk-device";
export const KIOSK_DEVICE_MAX_AGE = 365 * 24 * 60 * 60;

/** この時間内に訪問していれば「サイトを訪問中」とみなす。ping 間隔より余裕を持たせる。 */
export const KIOSK_ONLINE_WINDOW_MS = 90_000;

/** 画面へ渡す端末情報。id は端末識別子。 */
export type KioskDevice = { id: string; name: string; location: string | null; enabled: boolean };

/**
 * 訪問中の端末が登録済みキオスクなら、その行を返す。
 * Better Auth の認証は通さず、Cookie の端末識別子を DB と照合するだけ。
 */
export const getKioskDevice = cache(async () => {
  const deviceId = (await cookies()).get(KIOSK_DEVICE_COOKIE)?.value;
  if (!deviceId) return null;
  return db.orm.public.KioskDevice.where({ deviceId, enabled: true }).first();
});

type Client = Pick<typeof db, "orm">;

/** 初回アクセスで登録し、既存端末は設定を保持したまま在席を更新する。 */
export async function touchKioskDevice(deviceId: string, client: Client = db) {
  const now = new Date().toISOString();
  await client.orm.public.KioskDevice.upsert({
    create: { deviceId, name: `キオスク ${deviceId.slice(0, 8)}`, enabled: true,
      location: null, note: null, lastSeenAt: null, createdAt: now, updatedAt: now },
    update: { deviceId },
  });
  return client.orm.public.KioskDevice
    .where({ deviceId, enabled: true })
    .update({ lastSeenAt: now, updatedAt: now });
}

/** いまサイトを訪問している端末。見守り・通話の相手として選べるのはこれだけ。 */
export async function listOnlineKioskDevices(client: Client = db): Promise<KioskDevice[]> {
  const since = new Date(Date.now() - KIOSK_ONLINE_WINDOW_MS).toISOString();
  const devices = await client.orm.public.KioskDevice
    .where({ enabled: true })
    .where(device => device.lastSeenAt.gte(since))
    .orderBy(device => device.name.asc())
    .all();
  return devices.map(device => ({ id: device.deviceId, name: device.name, location: device.location ?? null, enabled: true }));
}
