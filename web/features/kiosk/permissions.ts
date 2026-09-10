import { TrackSource, type VideoGrant } from "livekit-server-sdk";

export type KioskConnectionMode = "host" | "watch" | "call";

/** クライアント指定のルーム名や権限を信用せず、認証済みの端末情報から権限を決める。 */
export function kioskGrant(mode: KioskConnectionMode, target: string, userId: string, kiosk: boolean): VideoGrant | null {
  if (mode === "host" && (!kiosk || target !== userId)) return null;
  if (mode === "call" && (!kiosk || target === userId)) return null;
  return { roomJoin: true, room: `kiosk-${target}`, canSubscribe: true, canPublish: true,
    canPublishSources: mode === "watch" ? [TrackSource.MICROPHONE] : [TrackSource.CAMERA, TrackSource.MICROPHONE],
    canPublishData: false,
  };
}
