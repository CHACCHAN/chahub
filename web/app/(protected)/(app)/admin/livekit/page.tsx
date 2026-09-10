import { CheckCard, RoomItem } from "@/features/admin/components/livekit-cards";
import { formatLiveKitTime as format } from "@/features/admin/livekit-format";
import { getAdminPageUser } from "@/features/admin/access";
import { getLiveKitStatus } from "@/features/admin/livekit-status";
import { RefreshButton } from "@/features/admin/components/refresh-button";
import { PageHeader, Card, Badge, List, Notice } from "@/component/ui";

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
