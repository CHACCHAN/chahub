import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { findService } from "@/lib/generic/services";
import { Button, Badge, Card, Input, List, ListItem, Notice, PageHeader, Select } from "@/components/ui";

const service = findService("/generic/shopping");

// 表示はすべて固定のサンプル。実際の追加・共有はこれから実装する。
const items = [
  { id: "1", name: "牛乳 1L", category: "食品", by: "お母さん", at: "今日 8:20" },
  { id: "2", name: "トイレットペーパー", category: "日用品", by: "お父さん", at: "今日 7:55" },
  { id: "3", name: "卵 10 個", category: "食品", by: "さくら", at: "昨日 20:10" },
  { id: "4", name: "食器用洗剤(詰め替え)", category: "日用品", by: "お母さん", at: "昨日 18:32" },
  { id: "5", name: "お米 5kg", category: "食品", by: "お父さん", at: "2 日前" },
];

const bought = [
  { id: "6", name: "食パン", by: "お母さん", at: "今日 9:15" },
  { id: "7", name: "ラップ", by: "お父さん", at: "昨日 17:40" },
];

export default async function ShoppingPage() {
  if (!await getSession()) redirect("/login");
  return <div className="mx-auto max-w-3xl">
    <PageHeader title={service.title} description={service.description} />
    <Notice className="mb-6">画面のサンプルです。表示している内容は仮のもので、追加や共有はこれから実装します。</Notice>

    <Card as="section" title="足りないものを追加" className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input label="品名" wrapperClassName="flex-1" placeholder="例:牛乳 1L" disabled />
        <Select label="分類" wrapperClassName="sm:w-36" defaultValue="食品" disabled>
          <option value="食品">食品</option>
          <option value="日用品">日用品</option>
          <option value="その他">その他</option>
        </Select>
        <Button type="button" disabled>追加する</Button>
      </div>
    </Card>

    <Card as="section" title="買うもの" meta={`${items.length} 件`} divided className="mb-6">
      <List empty="買うものはありません。">
        {items.map(item => <ListItem key={item.id}>
          <label className="flex min-w-0 items-start gap-3">
            <input type="checkbox" disabled className="mt-1 size-4 shrink-0 accent-indigo-600 disabled:cursor-not-allowed dark:accent-indigo-500" />
            <span className="min-w-0">
              <span className="block break-words font-medium">{item.name}</span>
              <span className="mt-1 block text-xs text-zinc-500">{item.by} が {item.at} に追加</span>
            </span>
          </label>
          <Badge variant={item.category === "食品" ? "accent" : "neutral"}>{item.category}</Badge>
        </ListItem>)}
      </List>
    </Card>

    <Card as="section" title="買い終わったもの" meta={`${bought.length} 件`} divided
      description="チェックしたものはここに移り、翌日の朝に自動で片付ける予定です。">
      <List empty="買い終わったものはまだありません。">
        {bought.map(item => <ListItem key={item.id}>
          <label className="flex min-w-0 items-start gap-3">
            <input type="checkbox" checked disabled readOnly className="mt-1 size-4 shrink-0 accent-indigo-600 disabled:cursor-not-allowed dark:accent-indigo-500" />
            <span className="min-w-0">
              <span className="block break-words font-medium text-zinc-500 line-through dark:text-zinc-400">{item.name}</span>
              <span className="mt-1 block text-xs text-zinc-500">{item.by} が {item.at} に購入</span>
            </span>
          </label>
          <Badge variant="success">購入済み</Badge>
        </ListItem>)}
      </List>
    </Card>
  </div>;
}
