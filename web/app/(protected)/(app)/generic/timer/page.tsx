import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { findService } from "@/features/generic/services";
import { Badge, Button, Card, Icon, Input, List, ListItem, Notice, PageHeader, Select } from "@/component/ui";

const service = findService("/generic/timer");

// 表示はすべて固定のサンプル。残り時間も固定の文字列で、計測や通知はこれから実装する。
const presets = ["3 分", "5 分", "10 分", "15 分", "30 分", "1 時間"];

const timers: { id: string; name: string; remaining: string; ends: string; source: string; progress: string; state: string; variant: "accent" | "neutral" }[] = [
  { id: "1", name: "パスタをゆでる", remaining: "3:20", ends: "19:42 に終了", source: "キッチンの端末", progress: "62%", state: "動作中", variant: "accent" },
  { id: "2", name: "洗濯機", remaining: "24:10", ends: "20:03 に終了", source: "洗面所の端末", progress: "28%", state: "動作中", variant: "accent" },
  { id: "3", name: "お風呂の追い焚き", remaining: "8:00", ends: "再開すると 19:47 に終了", source: "リビングの端末", progress: "45%", state: "一時停止", variant: "neutral" },
];

const finished = [
  { id: "1", name: "煮込み", at: "今日 18:20 に終了" },
  { id: "2", name: "コーヒーの蒸らし", at: "今日 15:02 に終了" },
];

export default async function TimerPage() {
  if (!await getSession()) redirect("/login");
  return <div className="mx-auto max-w-3xl">
    <PageHeader title={service.title} description={service.description} />
    <Notice className="mb-6">画面のサンプルです。残り時間は固定の表示で、計測や終了のお知らせはこれから実装します。</Notice>

    <Card as="section" title="タイマーを追加" className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input label="名前" wrapperClassName="flex-1" placeholder="例：ゆで卵" disabled />
        <Select label="長さ" wrapperClassName="sm:w-40" defaultValue="5" disabled>
          <option value="3">3 分</option>
          <option value="5">5 分</option>
          <option value="10">10 分</option>
          <option value="30">30 分</option>
        </Select>
        <Button type="button" disabled>始める</Button>
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium">よく使う時間</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map(preset => <Button key={preset} type="button" variant="secondary" disabled>{preset}</Button>)}
        </div>
      </div>
    </Card>

    <Card as="section" title="動作中のタイマー" meta={`${timers.length} 件`} description="家じゅうの端末で同じ残り時間を表示します。" className="mb-6" divided>
      <List empty="動作中のタイマーはありません。">
        {timers.map(timer => <ListItem key={timer.id} className="flex-col items-start gap-3">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words font-medium">{timer.name}<Badge variant={timer.variant} className="ml-2">{timer.state}</Badge></p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500"><Icon path="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 19h2" className="size-3.5" />{timer.source} ・ {timer.ends}</p>
            </div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{timer.remaining}</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className={`h-full rounded-full ${timer.variant === "accent" ? "bg-indigo-500 dark:bg-indigo-400" : "bg-zinc-300 dark:bg-zinc-600"}`} style={{ width: timer.progress }} />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled>{timer.state === "一時停止" ? "再開" : "一時停止"}</Button>
            <Button type="button" variant="danger" disabled>取り消す</Button>
          </div>
        </ListItem>)}
      </List>
    </Card>

    <Card as="section" title="今日終わったタイマー" meta={`${finished.length} 件`} divided>
      <List>
        {finished.map(timer => <ListItem key={timer.id}>
          <p className="min-w-0 break-words font-medium">{timer.name}</p>
          <p className="text-xs text-zinc-500">{timer.at}</p>
        </ListItem>)}
      </List>
    </Card>
  </div>;
}
