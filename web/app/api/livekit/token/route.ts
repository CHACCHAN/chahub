import { kioskGrant } from "@/lib/livekit/permissions";
import { AccessToken } from "livekit-server-sdk";
import { getSession, isKiosk } from "@/lib/better-auth/session";
import { listKiosks } from "@/lib/admin/kiosks";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "不正なリクエストです。" }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("target" in body) || typeof body.target !== "string" || !("mode" in body) || (body.mode !== "host" && body.mode !== "watch" && body.mode !== "call")) {
    return Response.json({ error: "接続先と接続方法を指定してください。" }, { status: 400 });
  }
  const devices = await listKiosks();
  const target = devices.find(device => device.userId === body.target);
  if (!target || target.key?.status !== "active") return Response.json({ error: "この端末は利用できません。" }, { status: 404 });
  const kiosk = await isKiosk() && devices.some(device => device.userId === session.user.id && device.key?.status === "active");
  const grant = kioskGrant(body.mode, target.userId, session.user.id, kiosk);
  if (!grant) {
    return Response.json({ error: "この接続方法は利用できません。" }, { status: 403 });
  }
  const url = process.env.LIVEKIT_URL?.trim();
  const key = process.env.LIVEKIT_API_KEY?.trim();
  const secret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!url || !key || !secret) return Response.json({ error: "LiveKit の接続設定がありません。" }, { status: 503 });
  const token = new AccessToken(key, secret, {
    identity: body.mode === "host" ? `kiosk:${session.user.id}` : `visitor:${session.user.id}:${crypto.randomUUID()}`,
    name: session.user.name,
    ttl: "10m",
  });
  token.addGrant(grant);
  return Response.json({ token: await token.toJwt(), url: url.replace(/^http(s?):\/\//, "ws$1://") }, { headers: { "Cache-Control": "no-store" } });
}
