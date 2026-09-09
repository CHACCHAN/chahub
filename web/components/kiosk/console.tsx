"use client";

import { useEffect, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { RoomContext, RoomAudioRenderer, StartAudio, VideoTrack, useParticipants, useTracks } from "@livekit/components-react";
import { Badge, Button, Card } from "@/components/ui";

import type { KioskDevice } from "@/lib/kiosk/devices";
import type { KioskConnectionMode } from "@/lib/livekit/permissions";
type Connection = { target: string; mode: KioskConnectionMode };

function Feeds() {
  const tracks = useTracks([Track.Source.Camera]);
  const participants = useParticipants();
  return <>
    <p className="text-sm text-zinc-500">接続中: {participants.map(p => p.name || "端末").join("、")}</p>
    {participants.length < 2 && <p className="text-sm text-zinc-500">相手の接続を待っています。映像が出ない場合は、相手端末の配信状態を確認してください。</p>}
    <div className="grid gap-3 sm:grid-cols-2">{tracks.map(track => <div key={`${track.participant.identity}-${track.source}`} className="min-w-0 overflow-hidden rounded-xl bg-zinc-950">
      <VideoTrack trackRef={track} className="aspect-video w-full object-contain" />
      <p className="px-3 py-2 text-sm text-white">{track.participant.name}{track.participant.isLocal ? "（この端末）" : ""}</p>
    </div>)}</div>
    <RoomAudioRenderer />
    <StartAudio label="スピーカーの音声を有効にする" className="rounded-xl border p-3 text-sm" />
  </>;
}

function ConnectionPanel({ connection, sharedRoom, onRoom, onClose }: { connection: Connection; sharedRoom?: Room; onRoom?: (room: Room | undefined) => void; onClose?: () => void }) {
  const [room, setRoom] = useState<Room>();
  const [status, setStatus] = useState("接続中…");
  const [error, setError] = useState("");
  const [microphone, setMicrophone] = useState(connection.mode !== "watch");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const room = new Room({ adaptiveStream: true, dynacast: true });
    let cancelled = false;
    const abort = new AbortController();
    const clones: MediaStreamTrack[] = [];
    function disconnect() {
      clones.forEach(track => track.stop());
      return room.disconnect();
    }
    room.on(RoomEvent.Reconnecting, () => setStatus("再接続中…"));
    room.on(RoomEvent.Reconnected, () => setStatus("接続済み"));
    room.on(RoomEvent.Disconnected, () => { setRoom(undefined); setStatus("切断されました。終了して再接続してください。"); onRoom?.(undefined); });
    async function connect() {
      try {
        const response = await fetch("/api/livekit/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(connection), signal: abort.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "接続できませんでした。");
        if (cancelled) return;
        await room.connect(data.url, data.token);
        if (cancelled) { await disconnect(); return; }
        if (connection.mode === "call") {
          if (!sharedRoom) throw new Error("この端末の配信が停止しました。配信を再開してください。");
          for (const source of [Track.Source.Camera, Track.Source.Microphone]) {
            const track = sharedRoom.localParticipant.getTrackPublication(source)?.track;
            if (!track) throw new Error("この端末の配信を開始してから通話してください。");
            const clone = track.mediaStreamTrack.clone();
            clones.push(clone);
            await room.localParticipant.publishTrack(clone, { source });
          }
        } else if (connection.mode === "host") {
          await room.localParticipant.enableCameraAndMicrophone();
        }
        if (cancelled) { await disconnect(); return; }
        setRoom(room); setStatus("接続済み"); onRoom?.(room);
      } catch (cause) {
        await disconnect();
        if (!cancelled) setError(cause instanceof Error ? cause.message : "接続に失敗しました。カメラ・マイクの許可を確認してください。");
      }
    }
    void connect();
    return () => { cancelled = true; abort.abort(); room.removeAllListeners(); void disconnect(); };
  }, [connection, sharedRoom, onRoom]);
  async function toggleMicrophone() {
    if (!room) return;
    setError("");
    setBusy(true);
    try { await room.localParticipant.setMicrophoneEnabled(!microphone); setMicrophone(!microphone); }
    catch { setError("マイクを利用できません。ブラウザーの権限を確認してください。"); }
    finally { setBusy(false); }
  }
  return <Card className="space-y-4 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><Badge>{status}</Badge>{onClose && <Button variant="secondary" onClick={onClose}>終了</Button>}</div>
    {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    {room && <RoomContext.Provider value={room}><Feeds /></RoomContext.Provider>}
    {connection.mode !== "host" && <Button disabled={!room} pending={busy} variant="secondary" onClick={toggleMicrophone}>{microphone ? "マイクをオフ" : "マイクで話す"}</Button>}
  </Card>;
}

export function KioskConsole({ devices, ownId }: { devices: KioskDevice[]; ownId?: string }) {
  const [host, setHost] = useState<Connection | null>(null);
  const [hostRoom, setHostRoom] = useState<Room>();
  const [visit, setVisit] = useState<Connection | null>(null);
  const others = devices.filter(device => device.id !== ownId);
  return <div className="space-y-6">
    {ownId && <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">この端末のカメラ・スピーカー</h2>
        <Button variant="secondary" onClick={() => { setVisit(null); setHostRoom(undefined); setHost(host ? null : { target: ownId, mode: "host" }); }}>{host ? "配信を停止" : "カメラ・スピーカーを開始"}</Button></div>
      <p className="text-sm text-zinc-500">開始するとカメラとマイクを配信し、ほかの端末からの声やビデオ通話を受け取ります。</p>
      {host && <ConnectionPanel connection={host} onRoom={setHostRoom} />}
    </section>}
    <section className="space-y-3"><h2 className="font-semibold">接続先の端末</h2>
      {others.length === 0 && <p className="text-sm text-zinc-500">ほかの端末はまだ登録されていません。</p>}
      <div className="grid gap-3 sm:grid-cols-2">{others.map(device => <Card key={device.id} className="space-y-3 p-4">
        <div><h3 className="font-medium">{device.name}</h3><p className="text-sm text-zinc-500">{device.location || "設置場所未設定"}</p></div>
        <div className="flex flex-wrap gap-2"><Button disabled={!device.enabled || !!visit} onClick={() => setVisit({ target: device.id, mode: "watch" })}>カメラを見る</Button>
          {ownId && <Button variant="secondary" disabled={!device.enabled || !hostRoom || !!visit} onClick={() => setVisit({ target: device.id, mode: "call" })}>ビデオ通話</Button>}
          {!device.enabled && <Badge>利用停止中</Badge>}</div>
      </Card>)}</div>
    </section>
    {visit && <section className="space-y-3"><h2 className="font-semibold">{devices.find(d => d.id === visit.target)?.name} — {visit.mode === "call" ? "ビデオ通話" : "見守り"}</h2><ConnectionPanel connection={visit} sharedRoom={visit.mode === "call" ? hostRoom : undefined} onClose={() => setVisit(null)} /></section>}
  </div>;
}
