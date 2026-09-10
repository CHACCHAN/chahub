import { isKioskId } from "@/features/kiosk/identity";
import { cookies } from "next/headers";
import { KIOSK_DEVICE_COOKIE, KIOSK_DEVICE_MAX_AGE, touchKioskDevice } from "@/features/kiosk/device";
import { isTrustedOrigin } from "@/lib/trusted-origins";

// 訪問してきた端末の識別子を DB と照合し、未登録なら自動登録し、Cookie に覚えて訪問時刻を更新する。
// 認証(Better Auth)は通さない。定期的に呼び直すことで「訪問中」の在席にもなる。
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!isTrustedOrigin(origin)) return Response.json({ error: "接続元を確認できません。" }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  const value = body && typeof body === "object" ? (body as { deviceId?: unknown }).deviceId : null;
  const deviceId = typeof value === "string" ? value.trim() : "";
  if (!isKioskId(deviceId)) return Response.json({ error: "端末 ID を取得できませんでした。" }, { status: 400 });
  const device = await touchKioskDevice(deviceId);
  const jar = await cookies();
  if (!device) {
    jar.delete(KIOSK_DEVICE_COOKIE);
    return Response.json({ registered: false }, { headers: { "Cache-Control": "no-store" } });
  }
  jar.set(KIOSK_DEVICE_COOKIE, deviceId, {
    httpOnly: true, secure: origin!.startsWith("https:"), sameSite: "strict", path: "/", maxAge: KIOSK_DEVICE_MAX_AGE,
  });
  return Response.json({ registered: true, name: device.name }, { headers: { "Cache-Control": "no-store" } });
}
