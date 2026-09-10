import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { findService } from "@/features/generic/services";
import { Badge, Button, Card, Icon, List, ListItem, Notice, PageHeader } from "@/component/ui";

const service = findService("/generic/appliances");

// 表示はすべて固定のサンプル。実際の家電連携と操作はこれから実装する。
const scenes = [
  { id: "home", label: "おかえり", description: "玄関とリビングの照明をつけます。" },
  { id: "night", label: "おやすみ", description: "1 階の家電をまとめて消します。" },
  { id: "away", label: "外出", description: "エアコンと照明をすべて切ります。" },
];

const rooms = [
  {
    id: "living", name: "リビング", appliances: [
      { id: "living-light", name: "照明", detail: "明るさ 60% ・ 電球色", on: true, icon: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" },
      { id: "living-ac", name: "エアコン", detail: "暖房 22℃ ・ 風量 自動", on: true, icon: "M4 5h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM7 16v2M12 16v3M17 16v2" },
      { id: "living-tv", name: "テレビ", detail: "最後の操作 昨日 21:40", on: false, icon: "M4 7h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM8 21h8M9 7l3-4 3 4" },
    ],
  },
  {
    id: "bedroom", name: "寝室", appliances: [
      { id: "bedroom-light", name: "照明", detail: "明るさ 20% ・ 常夜灯", on: true, icon: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" },
      { id: "bedroom-humidifier", name: "加湿器", detail: "タンク残量 40%", on: false, icon: "M12 2.7 6.5 8.2a7.8 7.8 0 1 0 11 0z" },
    ],
  },
  {
    id: "kitchen", name: "キッチンと玄関", appliances: [
      { id: "kitchen-light", name: "キッチンの照明", detail: "明るさ 100%", on: false, icon: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" },
      { id: "kitchen-fan", name: "換気扇", detail: "風量 弱", on: true, icon: "M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h18" },
      { id: "porch-light", name: "ポーチライト", detail: "日の入りに合わせて点灯", on: false, icon: "M8 2h8l3 8H5zM12 10v6M9 22a3 3 0 0 1 6 0z" },
    ],
  },
];

export default async function AppliancesPage() {
  if (!await getSession()) redirect("/login");
  return <div className="mx-auto max-w-3xl">
    <PageHeader title={service.title} description={service.description} />
    <Notice className="mb-6">画面のサンプルです。表示している内容は仮のもので、家電との連携や操作はこれから実装します。</Notice>

    <Card as="section" title="まとめて操作" description="よく使う組み合わせをひとつのボタンにまとめます。" className="mb-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {scenes.map(scene => <div key={scene.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="font-medium">{scene.label}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{scene.description}</p>
          <Button type="button" variant="secondary" fullWidth className="mt-4" disabled>実行する</Button>
        </div>)}
      </div>
    </Card>

    {rooms.map(room => <Card key={room.id} as="section" title={room.name} meta={`${room.appliances.filter(appliance => appliance.on).length} / ${room.appliances.length} 台 運転中`} className="mb-6 last:mb-0" divided>
      <List>
        {room.appliances.map(appliance => <ListItem key={appliance.id}>
          <div className="flex min-w-0 items-center gap-3">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${appliance.on ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"}`}>
              <Icon path={appliance.icon} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="break-words font-medium">{appliance.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{appliance.detail}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={appliance.on ? "success" : "neutral"}>{appliance.on ? "運転中" : "停止中"}</Badge>
            <Button type="button" variant="secondary" disabled>{appliance.on ? "消す" : "つける"}</Button>
          </div>
        </ListItem>)}
      </List>
    </Card>)}
  </div>;
}
