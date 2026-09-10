import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { findService } from "@/features/generic/services";
import { Badge, Card, Icon, List, ListItem, Notice, PageHeader } from "@/component/ui";

const service = findService("/generic/schedule");

// 天気アイコン(24px グリッドの線画)。
const icons = {
  sunny: "M12 3v2M12 19v2M5.6 5.6 7 7M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  cloudy: "M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 2A3.5 3.5 0 0 0 7 18z",
  rainy: "M7 15h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 2A3.5 3.5 0 0 0 7 15zM8 18l-1 2M12 18l-1 2M16 18l-1 2",
};

// 表示はすべて固定のサンプル。実際の予定と天気の取得はこれから実装する。
const today = { date: "9 月 9 日(火)", condition: "晴れときどき曇り", icon: icons.sunny, temperature: 27, high: 29, low: 19, rain: 20, humidity: 54 };

const forecast = [
  { day: "水", condition: "曇り", icon: icons.cloudy, high: 26, low: 18, rain: 40 },
  { day: "木", condition: "雨", icon: icons.rainy, high: 22, low: 17, rain: 80 },
  { day: "金", condition: "晴れ", icon: icons.sunny, high: 28, low: 18, rain: 10 },
];

const events = [
  { id: "1", time: "7:30", title: "燃えるゴミを出す", who: "玄関前 / 8:00 までに", tag: "ゴミ出し", variant: "danger" },
  { id: "2", time: "9:00", title: "さくら 登校", who: "体操着を持って行く日", tag: "", variant: "neutral" },
  { id: "3", time: "13:30", title: "宅配便の受け取り", who: "お母さん / 時間指定あり", tag: "外出前に確認", variant: "accent" },
  { id: "4", time: "18:00", title: "夕食の当番", who: "お父さん", tag: "", variant: "neutral" },
  { id: "5", time: "20:00", title: "町内会のオンライン集まり", who: "リビングの端末から", tag: "", variant: "neutral" },
] as const;

const garbage = [
  { id: "1", day: "火曜日", kind: "燃えるゴミ", next: "今日" },
  { id: "2", day: "木曜日", kind: "プラスチック", next: "あと 2 日" },
  { id: "3", day: "土曜日", kind: "びん・かん・ペットボトル", next: "あと 4 日" },
];

export default async function SchedulePage() {
  if (!await getSession()) redirect("/login");
  return <div className="mx-auto max-w-3xl">
    <PageHeader title={service.title} description={service.description} />
    <Notice className="mb-6">画面のサンプルです。表示している内容は仮のもので、カレンダーや天気予報との連携はこれから実装します。</Notice>

    <Card as="section" title="今日の天気" meta={today.date} className="mb-6">
      <div className="flex flex-wrap items-center gap-5">
        <Icon path={today.icon} className="size-12 text-indigo-600 dark:text-indigo-400" />
        <div className="min-w-0">
          <p className="text-3xl font-semibold tracking-tight">{today.temperature}<span className="ml-0.5 text-xl">℃</span></p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{today.condition}</p>
        </div>
        <dl className="ml-auto grid grid-cols-3 gap-x-6 text-sm">
          {[{ label: "最高", value: `${today.high}℃` }, { label: "最低", value: `${today.low}℃` }, { label: "降水", value: `${today.rain}%` }].map(entry =>
            <div key={entry.label}>
              <dt className="text-zinc-500 dark:text-zinc-400">{entry.label}</dt>
              <dd className="mt-1 font-medium">{entry.value}</dd>
            </div>)}
        </dl>
      </div>
      <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">湿度 {today.humidity}%。洗濯物は外に干せそうです。</p>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        {forecast.map(day => <div key={day.day} className="rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-900">
          <p className="text-sm font-medium">{day.day}</p>
          <Icon path={day.icon} className="mx-auto my-2 size-6 text-zinc-500 dark:text-zinc-400" />
          <p className="text-sm font-medium">{day.high}℃<span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">/ {day.low}℃</span></p>
          <p className="mt-1 text-xs text-zinc-500">{day.condition} ・ 降水 {day.rain}%</p>
        </div>)}
      </div>
    </Card>

    <Card as="section" title="今日の予定" meta={`${events.length} 件`} divided className="mb-6">
      <List empty="今日の予定はありません。">
        {events.map(event => <ListItem key={event.id}>
          <div className="flex min-w-0 items-baseline gap-4">
            <p className="w-12 shrink-0 text-sm font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">{event.time}</p>
            <div className="min-w-0">
              <p className="break-words font-medium">{event.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{event.who}</p>
            </div>
          </div>
          {event.tag && <Badge variant={event.variant}>{event.tag}</Badge>}
        </ListItem>)}
      </List>
    </Card>

    <Card as="section" title="ゴミ出しの曜日" divided description="地域の収集日を登録しておくと、当日の朝に伝言板へも表示する予定です。">
      <List>
        {garbage.map(day => <ListItem key={day.id}>
          <div className="min-w-0">
            <p className="break-words font-medium">{day.kind}</p>
            <p className="mt-1 text-xs text-zinc-500">毎週 {day.day}</p>
          </div>
          <Badge variant={day.next === "今日" ? "danger" : "neutral"}>{day.next}</Badge>
        </ListItem>)}
      </List>
    </Card>
  </div>;
}
