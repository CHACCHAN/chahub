import { getAdminPageUser } from "@/lib/admin/access";
import { getLiveKitStatus, type LiveKitCheck, type LiveKitRoom } from "@/lib/livekit/status";
import { RefreshButton } from "@/components/admin/refresh-button";
import { PageHeader, Card, Badge, List, ListItem, Notice } from "@/components/ui";

const time = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Tokyo" });
const format = (iso: string | null) => iso ? time.format(new Date(iso)) : "—";

function CheckCard({ title, check }: { title: string; check: LiveKitCheck }) {
  return <Card className="p-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-semibold">{title}</h2>
      <Badge variant={check.ok ? "success" : "danger"}>{check.ok ? "正常" : "異常"}</Badge>
    </div>
    <p className="my-4"><span className="text-3xl font-semibold tabular-nums">{check.latencyMs ?? "—"}</span><span className="ml-2 text-xs text-zinc-500">ms</span></p>
    <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">{check.detail}</p>
  </Card>;
}

function RoomItem({ room }: { room: LiveKitRoom }) {
  return <ListItem className="flex-col items-stretch">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="break-words font-medium">{room.name}{room.activeRecording && <Badge variant="danger" className="ml-2">録画中</Badge>}</p>
        <p className="mt-1 break-all font-mono text-xs text-zinc-500">{room.sid}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">{room.numParticipants} 人参加</Badge>
        <Badge>{room.numPublishers} 人配信中</Badge>
      </div>
    </div>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-500 sm:grid-cols-4">
      <div><dt>作成</dt><dd className="text-zinc-700 dark:text-zinc-300">{format(room.createdAt)}</dd></div>
      <div><dt>最大人数</dt><dd className="text-zinc-700 dark:text-zinc-300">{room.maxParticipants || "無制限"}</dd></div>
      <div><dt>空室タイムアウト</dt><dd className="text-zinc-700 dark:text-zinc-300">{room.emptyTimeout} 秒</dd></div>
      <div><dt>メタデータ</dt><dd className="truncate text-zinc-700 dark:text-zinc-300" title={room.metadata}>{room.metadata || "—"}</dd></div>
    </dl>
    {room.participants === null ? <p className="text-xs text-zinc-500">参加者の詳細は取得できませんでした。</p> :
      <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900">
            <tr><th className="px-3 py-2 font-medium">参加者</th><th className="px-3 py-2 font-medium">状態</th><th className="px-3 py-2 font-medium">種別</th><th className="px-3 py-2 font-medium">トラック</th><th className="px-3 py-2 font-medium">リージョン</th><th className="px-3 py-2 font-medium">参加時刻</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {room.participants.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-zinc-500">参加者はいません。</td></tr>}
            {room.participants.map(participant => <tr key={participant.sid}>
              <td className="px-3 py-2"><p className="font-medium">{participant.name || participant.identity}</p>{participant.name && <p className="text-xs text-zinc-500">{participant.identity}</p>}</td>
              <td className="px-3 py-2"><Badge variant={participant.state === "アクティブ" ? "success" : "neutral"}>{participant.state}</Badge></td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{participant.kind}{participant.isPublisher && " / 配信中"}</td>
              <td className="px-3 py-2 tabular-nums text-zinc-600 dark:text-zinc-400">音声 {participant.tracks.audio} / 映像 {participant.tracks.video} / 画面 {participant.tracks.screenShare}{participant.tracks.muted > 0 && ` (ミュート ${participant.tracks.muted})`}</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{participant.region || "—"}</td>
              <td className="px-3 py-2 whitespace-nowrap text-zinc-600 dark:text-zinc-400">{format(participant.joinedAt)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>}
  </ListItem>;
}

export default async function LiveKitPage() {
  await getAdminPageUser();
  const status = await getLiveKitStatus();
  const participants = status.rooms.reduce((sum, room) => sum + room.numParticipants, 0);
  return <>
    <PageHeader title="LiveKit" description="LiveKit サーバーへの接続状況と、現在開かれているルーム・参加者を確認します。" />
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-zinc-500">最終確認: {format(status.checkedAt)}</p>
      <RefreshButton />
    </div>
    {!status.config.configured && <Notice variant="warning" className="mb-6" title="LiveKit の接続設定が不足しています">
      <code className="font-mono">LIVEKIT_URL</code>、<code className="font-mono">LIVEKIT_API_KEY</code>、<code className="font-mono">LIVEKIT_API_SECRET</code> を <code className="font-mono">.env</code> に設定し、開発サーバーを再起動してください。
    </Notice>}
    <section aria-label="接続状況" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <CheckCard title="HTTP 到達性" check={status.http} />
      <CheckCard title="API 認証" check={status.api} />
      <Card className="p-5">
        <h2 className="font-semibold">利用状況</h2>
        <p className="my-4"><span className="text-3xl font-semibold tabular-nums">{status.rooms.length}</span><span className="ml-2 text-xs text-zinc-500">ルーム</span><span className="ml-4 text-3xl font-semibold tabular-nums">{participants}</span><span className="ml-2 text-xs text-zinc-500">人</span></p>
        <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">現在サーバー上で開かれているルームと参加者の合計です。</p>
      </Card>
    </section>
    <Card as="section" title="接続設定" className="mb-6" description="サーバー側の環境変数の状態です。シークレットは表示しません。">
      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-zinc-500">LIVEKIT_URL</dt><dd className="mt-1 break-all font-mono">{status.config.url ?? "未設定"}</dd></div>
        <div><dt className="text-xs text-zinc-500">LIVEKIT_API_KEY</dt><dd className="mt-1 font-mono">{status.config.apiKey ?? "未設定"}</dd></div>
        <div><dt className="text-xs text-zinc-500">LIVEKIT_API_SECRET</dt><dd className="mt-1">{status.config.hasSecret ? <Badge variant="success">設定済み</Badge> : <Badge variant="danger">未設定</Badge>}</dd></div>
      </dl>
    </Card>
    <Card as="section" title="ルーム一覧" meta={`${status.rooms.length} ルーム`} divided>
      <List empty={status.api.ok ? "現在開かれているルームはありません。" : "API に接続できないため、ルームを取得できません。"}>
        {status.rooms.map(room => <RoomItem key={room.sid} room={room} />)}
      </List>
    </Card>
  </>;
}
