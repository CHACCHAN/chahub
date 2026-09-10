import { CardLink } from "@/component/ui";
import { getLiveKitStatus } from "../livekit-status";

export function SectionCard({ href, title, count, unit, description }: { href: string; title: string; count: number | string; unit: string; description: string }) {
  return <CardLink href={href} prefetch={false} className="p-6">
    <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</h2>
    <p className="my-5"><span className="text-4xl font-semibold tabular-nums">{count}</span><span className="ml-2 text-xs text-zinc-500">{unit}</span></p>
    <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>
    <p className="mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-400">管理する <span aria-hidden="true">→</span></p>
  </CardLink>;
}

// LiveKit サーバーへの問い合わせは他のカードを待たせないようにストリーミングする。
export async function LiveKitCard() {
  const status = await getLiveKitStatus();
  const healthy = status.http.ok && status.api.ok;
  return <SectionCard href="/admin/livekit" title="LiveKit" count={healthy ? status.rooms.length : "—"} unit={healthy ? "ルーム" : "接続できません"}
    description={healthy ? "サーバーの接続状況と、開かれているルーム・参加者を確認します。" : status.api.detail ?? status.http.detail ?? "接続状況を確認します。"} />;
}

