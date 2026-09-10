import "server-only";
import { LiveKitAPI, ServerError, ParticipantInfo_State, TrackType, TrackSource, type Room, type ParticipantInfo } from "livekit-server-sdk";

const TIMEOUT_SECONDS = 5;
const MAX_ROOMS_WITH_PARTICIPANTS = 20;

export type LiveKitCheck = { ok: boolean; latencyMs?: number; detail?: string };

export type LiveKitParticipant = {
  sid: string; identity: string; name: string; state: string; kind: string;
  isPublisher: boolean; region: string; joinedAt: string | null;
  tracks: { audio: number; video: number; screenShare: number; muted: number };
};

export type LiveKitRoom = {
  sid: string; name: string; numParticipants: number; numPublishers: number; maxParticipants: number;
  emptyTimeout: number; activeRecording: boolean; metadata: string; createdAt: string | null;
  participants: LiveKitParticipant[] | null;
};

export type LiveKitStatus = {
  checkedAt: string;
  config: { url: string | null; apiKey: string | null; hasSecret: boolean; configured: boolean };
  http: LiveKitCheck;
  api: LiveKitCheck;
  rooms: LiveKitRoom[];
};

const stateLabels: Record<ParticipantInfo_State, string> = {
  [ParticipantInfo_State.JOINING]: "接続中",
  [ParticipantInfo_State.JOINED]: "参加",
  [ParticipantInfo_State.ACTIVE]: "アクティブ",
  [ParticipantInfo_State.DISCONNECTED]: "切断",
};
// ParticipantInfo_Kind は livekit-server-sdk から再エクスポートされていないため数値で対応する。
const kindLabels: Record<number, string> = { 0: "標準", 1: "Ingress", 2: "Egress", 3: "SIP", 4: "エージェント", 7: "Connector", 8: "Bridge" };

function maskApiKey(key: string) {
  return key.length <= 6 ? `${key.slice(0, 2)}…` : `${key.slice(0, 4)}…${key.slice(-2)}`;
}

/** ミリ秒があればそれを、無ければ秒を使って ISO 文字列にする。 */
function toIso(ms: bigint, seconds: bigint) {
  const value = Number(ms) || Number(seconds) * 1000;
  return value > 0 ? new Date(value).toISOString() : null;
}

function describeError(error: unknown) {
  if (error instanceof ServerError) return error.status === 401 ? "API キーまたはシークレットが正しくありません。" : `サーバーエラー (${error.status}): ${error.message}`;
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return `${TIMEOUT_SECONDS} 秒以内に応答がありませんでした。`;
    return error.message;
  }
  return String(error);
}

function toParticipant(participant: ParticipantInfo): LiveKitParticipant {
  const tracks = { audio: 0, video: 0, screenShare: 0, muted: 0 };
  for (const track of participant.tracks) {
    if (track.muted) tracks.muted++;
    if (track.source === TrackSource.SCREEN_SHARE || track.source === TrackSource.SCREEN_SHARE_AUDIO) tracks.screenShare++;
    else if (track.type === TrackType.AUDIO) tracks.audio++;
    else if (track.type === TrackType.VIDEO) tracks.video++;
  }
  return {
    sid: participant.sid, identity: participant.identity, name: participant.name,
    state: stateLabels[participant.state] ?? String(participant.state),
    kind: kindLabels[participant.kind] ?? String(participant.kind),
    isPublisher: participant.isPublisher, region: participant.region,
    joinedAt: toIso(participant.joinedAtMs, participant.joinedAt), tracks,
  };
}

function toRoom(room: Room, participants: ParticipantInfo[] | null): LiveKitRoom {
  return {
    sid: room.sid, name: room.name, numParticipants: room.numParticipants, numPublishers: room.numPublishers,
    maxParticipants: room.maxParticipants, emptyTimeout: room.emptyTimeout, activeRecording: room.activeRecording,
    metadata: room.metadata, createdAt: toIso(room.creationTimeMs, room.creationTime),
    participants: participants?.map(toParticipant) ?? null,
  };
}

/** HTTP 到達性(GET /)を確認する。LiveKit サーバーは "OK" を返す。 */
async function checkHttp(url: string): Promise<LiveKitCheck> {
  const started = performance.now();
  try {
    const response = await fetch(url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_SECONDS * 1000) });
    const latencyMs = Math.round(performance.now() - started);
    return response.ok ? { ok: true, latencyMs, detail: `HTTP ${response.status}` } : { ok: false, latencyMs, detail: `HTTP ${response.status} が返されました。` };
  } catch (error) {
    return { ok: false, latencyMs: Math.round(performance.now() - started), detail: describeError(error) };
  }
}

/** API 認証と RoomService の応答を確認し、ルームと参加者を取得する。 */
async function checkApi(api: LiveKitAPI): Promise<{ check: LiveKitCheck; rooms: LiveKitRoom[] }> {
  const started = performance.now();
  try {
    const rooms = await api.room.listRooms();
    const latencyMs = Math.round(performance.now() - started);
    const detailed = await Promise.all(rooms.map(async (room, index) => {
      if (index >= MAX_ROOMS_WITH_PARTICIPANTS) return toRoom(room, null);
      try { return toRoom(room, await api.room.listParticipants(room.name)); } catch { return toRoom(room, null); }
    }));
    detailed.sort((a, b) => b.numParticipants - a.numParticipants || a.name.localeCompare(b.name));
    return { check: { ok: true, latencyMs, detail: `${rooms.length} ルームを取得` }, rooms: detailed };
  } catch (error) {
    return { check: { ok: false, latencyMs: Math.round(performance.now() - started), detail: describeError(error) }, rooms: [] };
  }
}

export async function getLiveKitStatus(): Promise<LiveKitStatus> {
  const url = process.env.LIVEKIT_URL?.trim() || null;
  const apiKey = process.env.LIVEKIT_API_KEY?.trim() || null;
  const secret = process.env.LIVEKIT_API_SECRET?.trim() || null;
  const configured = Boolean(url && apiKey && secret);
  const status: LiveKitStatus = {
    checkedAt: new Date().toISOString(),
    config: { url, apiKey: apiKey ? maskApiKey(apiKey) : null, hasSecret: Boolean(secret), configured },
    http: { ok: false, detail: "LIVEKIT_URL が設定されていません。" },
    api: { ok: false, detail: "LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET を設定してください。" },
    rooms: [],
  };
  if (!url) return status;
  // WebSocket URL が設定されていても HTTP で到達確認できるように変換する。
  const httpUrl = url.replace(/^ws(s?):\/\//, "http$1://");
  const httpCheck = checkHttp(httpUrl);
  if (!configured) { status.http = await httpCheck; return status; }
  const api = new LiveKitAPI({ host: httpUrl, apiKey: apiKey!, secret: secret!, requestTimeout: TIMEOUT_SECONDS, failover: false });
  const [http, result] = await Promise.all([httpCheck, checkApi(api)]);
  status.http = http; status.api = result.check; status.rooms = result.rooms;
  return status;
}
