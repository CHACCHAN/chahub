import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { findService } from "@/features/generic/services";
import { Badge, Card, Icon, List, ListItem, Notice, PageHeader } from "@/component/ui";

const service = findService("/generic/status");

// 表示はすべて固定のサンプル。実際のセンサー連携と記録の保存はこれから実装する。
const readings = [
  { id: "temperature", label: "室温", value: "22.4", unit: "℃", note: "リビング ・ 過ごしやすい", icon: "M14 14.8V4a2 2 0 1 0-4 0v10.8a4 4 0 1 0 4 0z" },
  { id: "humidity", label: "湿度", value: "48", unit: "%", note: "リビング ・ ちょうどよい", icon: "M12 2.7 6.5 8.2a7.8 7.8 0 1 0 11 0z" },
  { id: "outside", label: "外の気温", value: "9.6", unit: "℃", note: "玄関 ・ 30 分前の値", icon: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" },
];

const sensors: { id: string; name: string; place: string; state: string; variant: "neutral" | "success" | "danger"; icon: string }[] = [
  { id: "front-door", name: "玄関ドア", place: "1 階 ・ 更新 2 分前", state: "施錠中", variant: "success", icon: "M4 21V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v17M3 21h18M13 12h.01" },
  { id: "back-door", name: "勝手口", place: "1 階 ・ 更新 2 分前", state: "施錠中", variant: "success", icon: "M4 21V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v17M3 21h18M13 12h.01" },
  { id: "living-window", name: "リビングの窓", place: "1 階 ・ 更新 1 分前", state: "開いています", variant: "danger", icon: "M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM12 3v18M3 12h18" },
  { id: "bedroom-window", name: "寝室の窓", place: "2 階 ・ 更新 6 分前", state: "閉まっています", variant: "success", icon: "M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM12 3v18M3 12h18" },
  { id: "garage", name: "ガレージ", place: "屋外 ・ 更新 12 分前", state: "電池残量わずか", variant: "neutral", icon: "M3 11 12 3l9 8v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" },
];

const activities = [
  { id: "1", at: "今日 9:14", body: "リビングで人の動きを検知しました。" },
  { id: "2", at: "今日 8:02", body: "玄関ドアが施錠されました。" },
  { id: "3", at: "今日 7:38", body: "キッチンの端末で操作がありました。" },
  { id: "4", at: "昨日 22:41", body: "全ての窓が閉まったことを確認しました。" },
];

export default async function StatusPage() {
  if (!await getSession()) redirect("/login");
  const alerts = sensors.filter(sensor => sensor.variant !== "success").length;
  return <div className="mx-auto max-w-3xl">
    <PageHeader title={service.title} description={service.description} />
    <Notice className="mb-6">画面のサンプルです。表示している内容は仮のもので、センサーとの連携はこれから実装します。</Notice>

    <Card as="section" title="いまの室内" description="家に置いたセンサーが測った値を表示します。" className="mb-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {readings.map(reading => <div key={reading.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"><Icon path={reading.icon} className="text-indigo-500 dark:text-indigo-400" />{reading.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{reading.value}<span className="ml-1 text-base font-normal text-zinc-500 dark:text-zinc-400">{reading.unit}</span></p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{reading.note}</p>
        </div>)}
      </div>
    </Card>

    <Card as="section" title="戸締まりとセンサー" meta={`${alerts} 件 確認が必要`} className="mb-6" divided>
      <List>
        {sensors.map(sensor => <ListItem key={sensor.id}>
          <div className="flex min-w-0 items-center gap-3">
            <Icon path={sensor.icon} className="size-5 text-zinc-400" />
            <div className="min-w-0">
              <p className="break-words font-medium">{sensor.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{sensor.place}</p>
            </div>
          </div>
          <Badge variant={sensor.variant}>{sensor.state}</Badge>
        </ListItem>)}
      </List>
    </Card>

    <Card as="section" title="見守りの記録" meta={`${activities.length} 件`} description="人の動きやドアの開閉を、時刻とあわせて残します。" divided>
      <List>
        {activities.map(activity => <ListItem key={activity.id} className="items-start">
          <p className="min-w-0 break-words text-sm leading-6 text-zinc-600 dark:text-zinc-300">{activity.body}</p>
          <p className="text-xs text-zinc-500">{activity.at}</p>
        </ListItem>)}
      </List>
    </Card>
  </div>;
}
