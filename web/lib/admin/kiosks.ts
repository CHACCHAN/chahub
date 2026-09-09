import { auth } from "@/lib/better-auth/auth";
import { db } from "@/prisma/db";

import { KIOSK_EMAIL_DOMAIN, KIOSK_KEY_EXPIRIES, KIOSK_KEY_HEADER, KIOSK_KEY_PREFIX, type KioskCredentials, type KioskKeyExpiry, type KioskKeyStatus, type KioskRow } from "./kiosk-shared";
export { KIOSK_EMAIL_DOMAIN, KIOSK_KEY_EXPIRIES, KIOSK_KEY_HEADER, KIOSK_KEY_PREFIX, isKioskKeyExpiry, type KioskCredentials, type KioskKeyExpiry, type KioskKeyStatus, type KioskRow } from "./kiosk-shared";

type Client = Pick<typeof db, "orm" | "transaction">;
type Api = Pick<typeof auth.api, "createApiKey" | "updateApiKey">;
type Deps = { client?: Client; api?: Api };

const iso = (value: Date | string | null | undefined) => value == null ? null : new Date(value).toISOString();

function serverUrl() {
  return (process.env.BETTER_AUTH_URL ?? "").trim().replace(/\/+$/, "");
}

/** ブラウザー/端末から LiveKit に接続する URL。https は wss に変換する。 */
function liveKitClientUrl() {
  const url = process.env.LIVEKIT_URL?.trim();
  return url ? url.replace(/^http(s?):\/\//, "ws$1://").replace(/\/+$/, "") : null;
}

async function issueKey(api: Api, userId: string, name: string, expiry: KioskKeyExpiry) {
  const days = KIOSK_KEY_EXPIRIES.find(option => option.value === expiry)?.days ?? null;
  return api.createApiKey({
    body: { userId, name: name.slice(0, 32), prefix: KIOSK_KEY_PREFIX, expiresIn: days === null ? null : days * 24 * 60 * 60 },
  });
}

function toCredentials(user: { id: string; name: string; email: string }, location: string | null, key: Awaited<ReturnType<Api["createApiKey"]>>): KioskCredentials {
  return {
    userId: user.id, name: user.name, email: user.email, location,
    keyId: key.id, apiKey: key.key, keyStart: key.start ?? null, expiresAt: iso(key.expiresAt), issuedAt: new Date().toISOString(),
    serverUrl: serverUrl(), liveKitUrl: liveKitClientUrl(), header: KIOSK_KEY_HEADER,
  };
}

/** 端末用のユーザー(member)と kiosk 行を作成し、API キーを発行する。 */
export async function createKiosk(input: { name: string; location?: string | null; note?: string | null; expiry: KioskKeyExpiry }, { client = db, api = auth.api }: Deps = {}) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const user = { id, name: input.name, email: `kiosk-${id.slice(0, 8)}@${KIOSK_EMAIL_DOMAIN}` };
  await client.transaction(async tx => {
    await tx.orm.public.AuthUser.create({ ...user, emailVerified: true, role: "member", banned: false, createdAt: now, updatedAt: now });
    await tx.orm.public.Kiosk.create({ userId: id, location: input.location || null, note: input.note || null, createdAt: now, updatedAt: now });
  });
  try {
    return toCredentials(user, input.location || null, await issueKey(api, id, input.name, input.expiry));
  } catch (error) {
    // キーが発行できなければユーザーごと取り消す(kiosk 行は CASCADE で消える)。
    await client.orm.public.AuthUser.where({ id }).delete();
    throw error;
  }
}

/** 既存のキーをすべて失効させて新しいキーを発行する。 */
export async function rotateKioskKey(userId: string, expiry: KioskKeyExpiry, { client = db, api = auth.api }: Deps = {}) {
  const kiosk = await client.orm.public.Kiosk.include("user", user => user.select("id", "name", "email")).first({ userId });
  if (!kiosk?.user) return null;
  const previous = (await client.orm.public.AuthApikey.select("id").where({ referenceId: userId }).all()).map(existing => existing.id);
  const key = await issueKey(api, userId, kiosk.user.name, expiry);
  if (previous.length) await client.orm.public.AuthApikey.where(existing => existing.id.in(previous)).delete();
  return toCredentials(kiosk.user, kiosk.location, key);
}

/** 端末のキーを有効/無効にする(削除せず一時停止できる)。 */
export async function setKioskKeyEnabled(userId: string, enabled: boolean, { client = db, api = auth.api }: Deps = {}) {
  const keys = await client.orm.public.AuthApikey.select("id").where({ referenceId: userId }).all();
  for (const key of keys) await api.updateApiKey({ body: { keyId: key.id, userId, enabled } });
  return keys.length;
}

/** 端末を削除する。API キーは FK が無いため先に削除し、ユーザー削除で kiosk 行・セッション・所属を CASCADE で消す。 */
export async function deleteKiosk(userId: string, { client = db }: Deps = {}) {
  if (!await client.orm.public.Kiosk.first({ userId })) return false;
  await client.transaction(async tx => {
    await tx.orm.public.AuthApikey.where({ referenceId: userId }).delete();
    await tx.orm.public.AuthUser.where({ id: userId }).delete();
  });
  return true;
}

export async function kioskUserIds(client: Pick<typeof db, "orm"> = db) {
  return new Set((await client.orm.public.Kiosk.select("userId").all()).map(kiosk => kiosk.userId));
}

export async function listKiosks(client: Pick<typeof db, "orm"> = db): Promise<KioskRow[]> {
  const kiosks = await client.orm.public.Kiosk.include("user", user => user.select("id", "name", "email", "role")).orderBy(kiosk => kiosk.createdAt.desc()).all();
  if (!kiosks.length) return [];
  const keys = await client.orm.public.AuthApikey.where(key => key.referenceId.in(kiosks.map(kiosk => kiosk.userId))).orderBy(key => key.createdAt.desc()).all();
  const now = Date.now();
  return kiosks.map(kiosk => {
    const key = keys.find(candidate => candidate.referenceId === kiosk.userId);
    const expiresAt = iso(key?.expiresAt);
    const status: KioskKeyStatus = !key ? "missing" : key.enabled === false ? "disabled" : expiresAt && new Date(expiresAt).getTime() < now ? "expired" : "active";
    return {
      userId: kiosk.userId, name: kiosk.user?.name ?? "", email: kiosk.user?.email ?? "", role: kiosk.user?.role ?? null,
      location: kiosk.location ?? null, note: kiosk.note ?? null, createdAt: new Date(kiosk.createdAt).toISOString(),
      key: key ? { id: key.id, start: key.start ?? null, status, expiresAt, lastRequest: iso(key.lastRequest), requestCount: key.requestCount ?? 0, createdAt: new Date(key.createdAt).toISOString() } : null,
    };
  });
}
