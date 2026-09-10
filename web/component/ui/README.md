# 共通 UI

ページや機能を問わず共有する表示部品は、このディレクトリに置きます。
認証・DB・Server Action などの業務処理は呼び出し側に置いてください。
部品は「それだけで形になる」単位で作り、細かい装飾(説明文の `<p>` など)は呼び出し側に書きます。

```tsx
import { Card, List, ListItem, Input, Button, Badge, TextLink } from "@/component/ui";

<Card as="section" title="チーム一覧" meta={`${teams.length} チーム`} divided action={<TextLink href="/admin/roles">ロールを変更する →</TextLink>}>
  <List empty="まだチームがありません。">
    {teams.map(team => <ListItem key={team.id}>{team.name}<Badge>{team.members} 人</Badge></ListItem>)}
  </List>
</Card>

<Card as="section" title="チームを作成">
  <form className="flex gap-3 sm:items-end">
    <Input label="チーム名" wrapperClassName="flex-1" name="name" required />
    <Button type="submit" pending={pending} pendingLabel="保存中…">保存</Button>
  </form>
</Card>
```

- `Button`: primary / secondary / danger。既定は `type="button"`。フォーム送信には `type="submit"` を指定します。`pending` でスピナー・連打防止、`pendingLabel` で処理中の文言、`fullWidth` で全幅になります。
- `TextLink`: 本文中や見出し横に置くインディゴのテキストリンク。パネル全体をリンクにするときは `CardLink`。
- `CopyButton`: `text` をクリップボードにコピーする小さなボタン(Client Component)。成功すると一時的に「コピーしました」と表示します。
- `Card` / `CardLink`: 同じ枠線・背景・角丸のパネル。`title` を渡すと見出し帯(`h2` + `meta` + `description` + 右側の `action`)と本文の構造になり、`aria-labelledby` も自動で付きます。本文に `List` を直接置くときは `divided` で区切り線を引きます。`title` なしのときは余白を `className` で指定します。
- `List` / `ListItem`: 区切り線付きの縦リスト。`empty` を渡すと項目が無いときに案内文を表示します。`ListItem` は左右に要素を並べる `flex` です。
- `Input` / `Select`: HTML 標準の props と ref を受け取り、フォーカス・無効状態・ダークモードを統一します。`label` を渡すとラベル付きになり、id を自動で結び付けます(`wrapperClassName` で外枠の幅を指定)。hidden input は標準 HTML を使います。
- `Notice`: 補足や注意を伝える帯(info / warning)。`title` に見出し、`action` にリンクやボタンを渡せます。
- `Badge`: neutral / accent / success / danger の状態表示。
- `Icon`: 24px グリッドの線画アイコン。`path` に SVG の d 属性を渡します(装飾扱い)。
- `Logo`: ChaHub のロゴ(結線マーク + ワードマーク)。文字サイズは `className` の `text-*` に連動します(`text-2xl` など)。マークだけ消したいときは `mark={false}`。
- `PageHeader`: ページ見出しと任意の説明。
- `Spinner`: 処理中のアイコン。
- `ThemeProvider` / `ThemeToggle`: `compact` でラベルを読み上げ用に残し、アイコンだけを表示できます。 テーマ(ライト / ダーク / システム)。`ThemeProvider` はルートレイアウトで 1 回だけ使い、`next-themes` が `<html class="dark">` を付け外しします。`ThemeToggle` は 3 択のセグメントボタンで、アプリのサイドバー（モバイルではコンテンツに重なる開閉メニュー）とログイン画面に置いています。
- `NavigationProgress`: ページ遷移中に上部へ表示する NProgress のバー。ルートレイアウトに 1 つだけ置き、`@/component/ui/navigation-progress` から読み込みます。遷移開始は `instrumentation-client.ts` の `onRouterTransitionStart` から受け取り、完了は URL の変化で検知します。色は `app/globals.css` で指定しています。
- `Toaster`: 全ページの共通通知領域。`@/component/ui/toaster` から読み込みます。通知の呼び出しは既存どおり `@/lib/notifications` の `toast` を使います。

基本部品には `use client` を付けず、Server / Client Component の両方から使えます。ブラウザー状態を使う部品にだけ付けてください。
色はインディゴ(アクセント)と zinc(中立)だけを使い、`dark:` も必ず併記します。`dark:` は OS 設定ではなく `<html class="dark">` で切り替わります(`app/globals.css` の `@custom-variant dark`)。
機能固有の組み合わせ(例: 管理画面のユーザー表示)は `features/<feature>/components/` に置きます。
