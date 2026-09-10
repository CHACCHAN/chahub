import { kioskGrant } from "@/features/kiosk/permissions";
import { AccessToken } from "livekit-server-sdk";
import { getSession } from "@/lib/better-auth/session";
import { getKioskDevice, listOnlineKioskDevices } from "@/features/kiosk/device";

export async function POST(request: Request) {
  // キオスク端末は認証を通さず、登録済みの端末として扱う。人はログインが必要。
  const device = await getKioskDevice();
  const session = device ? null : await getSession();
  if (!device && !session) return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "不正なリクエストです。" }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("target" in body) || typeof body.target !== "string" || !("mode" in body) || (body.mode !== "host" && body.mode !== "watch" && body.mode !== "call")) {
    return Response.json({ error: "接続先と接続方法を指定してください。" }, { status: 400 });
  }
  // 接続先はいまサイトを訪問している端末だけ。停止中・不在の端末は一覧にも出ない。
  const target = (await listOnlineKioskDevices()).find(candidate => candidate.id === body.target);
  if (!target) return Response.json({ error: "この端末は利用できません。" }, { status: 404 });
  const selfId = device?.deviceId ?? session!.user.id;
  const grant = kioskGrant(body.mode, target.id, selfId, Boolean(device));
  if (!grant) {
    return Response.json({ error: "この接続方法は利用できません。" }, { status: 403 });
  }
  const url = process.env.LIVEKIT_URL?.trim();
  const key = process.env.LIVEKIT_API_KEY?.trim();
  const secret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!url || !key || !secret) return Response.json({ error: "LiveKit の接続設定がありません。" }, { status: 503 });
  const token = new AccessToken(key, secret, {
    identity: body.mode === "host" ? `kiosk:${selfId}` : `visitor:${selfId}:${crypto.randomUUID()}`,
    name: device?.name ?? session!.user.name,
    ttl: "10m",
  });
  token.addGrant(grant);
  return Response.json({ token: await token.toJwt(), url: url.replace(/^http(s?):\/\//, "ws$1://") }, { headers: { "Cache-Control": "no-store" } });
}
