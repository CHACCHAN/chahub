import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { findService } from "@/features/generic/services";
import { Button, Badge, Card, Input, List, ListItem, Notice, PageHeader } from "@/component/ui";

const service = findService("/generic/messages");

// 表示はすべて固定のサンプル。実際の保存・共有はこれから実装する。
const messages = [
  { id: "1", from: "お母さん", at: "今日 8:12", body: "宅配便が 18 時ごろ届きます。受け取りお願いします。", pinned: true },
  { id: "2", from: "お父さん", at: "今日 7:40", body: "今日は遅くなります。夕飯はいりません。", pinned: false },
  { id: "3", from: "受付タブレット", at: "昨日 19:03", body: "回覧板を玄関の棚に置きました。", pinned: false },
];

export default async function MessagesPage() {
  if (!await getSession()) redirect("/login");
  return <div className="mx-auto max-w-3xl">
    <PageHeader title={service.title} description={service.description} />
    <Notice className="mb-6">画面のサンプルです。表示している内容は仮のもので、投稿や共有はこれから実装します。</Notice>

    <Card as="section" title="伝言を書く" className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input label="伝言" wrapperClassName="flex-1" placeholder="例：牛乳を買ってきてください" disabled />
        <Button type="button" disabled>貼り出す</Button>
      </div>
    </Card>

    <Card as="section" title="貼り出されている伝言" meta={`${messages.length} 件`} divided>
      <List>
        {messages.map(message => <ListItem key={message.id} className="flex-col items-start gap-2">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="font-medium">{message.from}{message.pinned && <Badge variant="accent" className="ml-2">固定</Badge>}</p>
            <p className="text-xs text-zinc-500">{message.at}</p>
          </div>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{message.body}</p>
        </ListItem>)}
      </List>
    </Card>
  </div>;
}
