## 認証のセットアップ

1. `.env.example` を参考に PostgreSQL、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、Authentik の設定を `.env` に指定します。
2. Authentik のリダイレクト URI に `<BETTER_AUTH_URL>/api/auth/callback/authentik` を登録します。
3. `bun run auth:migrate` で認証用テーブルを作成し、`bun prisma db update` でアプリ用のテーブル（OIDC マッピング、チーム権限、ユーザー権限）を作成します。
4. `bun dev` を起動し、`/login` から OIDC でログインします。

Prisma Next は Better Auth の Prisma アダプターと互換性がないため、認証は標準 PostgreSQL アダプターを使用します。アプリ側は同じ `auth_` テーブルを Prisma 8 の contract に定義して操作します。`@@map` で実テーブル名に対応させ、`@@control(external)` で DDL は Better Auth 側に任せています。管理画面の取得・作成・更新は `db.orm.public.AuthUser` / `AuthTeam` などを使用します。

contract を編集したら `bun run contract:emit` で型と JSON を更新してください。emit は DB のテーブルを変更しません。認証スキーマの更新後は contract も追従させてください。日時は PostgreSQL の型を維持した `TimestamptzString` で扱います。ORM に専用 API がないテーブルロックだけは、Prisma の raw lane を同じトランザクション内で使用しています。

キオスク用キーは信頼できるサーバー上で `bun run auth:kiosk-key <auth_user.id>` を実行して発行します。OIDC ログイン済みユーザーの認証用 ID を指定してください。キーの有効期間は30日で、表示は発行時のみです。`/kiosk-login` に入力すると HttpOnly / SameSite=Strict Cookie（本番では Secure）に保存され、各リクエストで検証されます。端末から `x-api-key` ヘッダーを送る方法にも対応します。ログアウトは端末の Cookie を削除しますが、キー自体は失効しません。

主要ページは `app/(protected)/` に配置してください。共通レイアウトで未認証アクセスを `/login` に転送します。ページのデータ取得や Server Action では `requireSession()`、API Route Handler では `getSession()` を呼び、未認証時に 401 を返してください。レイアウトだけでは API や Server Action は保護されません。`(public)` はログイン関連のページのみです。

参考: [Better Auth PostgreSQL](https://better-auth.com/docs/adapters/postgresql)、[Generic OAuth](https://better-auth.com/docs/plugins/generic-oauth)、[API Key](https://better-auth.com/docs/plugins/api-key/advanced)。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 管理者ダッシュボード

管理画面は共通の左メニューから移動できます（スマートフォンでは上部メニュー）。

- `/admin`: 利用状況の概要
- `/admin/teams`: チームの作成・削除・一覧
- `/admin/users`: 登録ユーザーと現在のロールの確認
- `/admin/roles`: Better Auth のロール（一般ユーザー `member` / 管理者 `administrator`）をチームごと・ユーザーごとに設定
- `/admin/livekit`: LiveKit サーバーの接続状況（HTTP 到達性・API 認証・応答時間）、環境変数の設定状態、開かれているルームと参加者の一覧

すべての管理ページで管理者権限を確認します。

- `bun run auth:migrate` で Admin プラグインの必要なカラムを追加してください。旧 `admin` は `administrator`、旧 `user` / `kiosk` と未設定のロールは `member` に移行します。起動中の開発サーバーは再起動してください。
- 現在 `administrator` のユーザーが1人もいない場合、ログインして `/admin` を最初に開いたユーザーが自動で `administrator` になります。未認証アクセス・API キー・リンクの事前読み込みでは昇格しません。同時アクセスでも1人だけが昇格します。
- 登録ユーザー数や過去の管理者作成履歴は条件にしません。最後の管理者が降格・削除された場合も、次に `/admin` を開いたログイン済みユーザーが自動昇格します。旧履歴テーブルとトリガーは `auth:migrate` で削除します。
- チーム作成時は共通の `ChaHub` 組織を用意し、その配下に空のチームを作成します。メンバー追加は未実装です。
- チーム削除は Better Auth の Organization プラグイン `auth.api.removeTeam` を使用します。管理者権限は `requireAdmin()` で確認し、`headers` を渡さないサーバー呼び出しにすることで組織メンバーとしての権限確認を省いています。所属（`auth_team_member`）は Better Auth が削除し、OIDC マッピングは外部キーの `ON DELETE CASCADE` で削除されます。`teams.allowRemovingAllTeams` を有効にしているため、最後のチームも削除できます。
- 権限は組織内の owner / member とは別のアプリ全体の区分です。API キーでは管理画面を操作できません。管理者は自分自身のロールも変更できます。最後の管理者を一般ユーザーへ変更した場合も、再度 `/admin` にアクセスすれば管理者に戻れます。
- ロールはチームごと（`team_role`）とユーザーごと（`user_role_override`）に設定できます。「チームごとの権限」には Administrator / Member の標準チームも並びますが、ロールそのものなので権限は固定表示です。有効なロールは **ユーザー単位の指定 > 所属チームの設定（複数チームなら管理者が優先）> 既定の一般ユーザー** の順で `lib/admin/roles.ts` の `resolveRoles()` が解決し、Better Auth が参照する `auth_user.role` に同期します。同期はチーム権限の変更、ユーザー権限の変更、OIDC マッピングによるチーム所属追加、チーム削除の直後に行います。自動昇格と `auth:admin` はユーザー単位の指定として保存するため、チーム設定の同期で降格しません。
- キオスク専用ロールはありません。キオスクの認証は API キーで行い、ユーザーのロールとは分離しています。

ロールの定義・権限判定は Better Auth の [Admin プラグイン](https://better-auth.com/docs/plugins/admin) を利用しています。管理画面の権限判定は `auth.api.userHasPermission` を使用します。画面からの変更は `setUserRole()` / `setTeamRole()` が `auth_user.role` を直接更新します（テーブルロック付きトランザクション）。`auth:admin` は手動設定・復旧用のサーバー専用コマンドです。自動昇格は DB トランザクションとテーブルロックで、現在の管理者の有無の確認と昇格を一括して実行します。

初期設定の統合テストは `TEST_DATABASE_URL=... bun test tests/admin-bootstrap.test.ts` で実行できます。テスト用の独立した DB を作成し、終了時に削除します。接続ユーザーには DB 作成権限が必要です。管理者復帰、同時チーム作成、関連データと人数の集計を実 DB と ORM で検証します。

## LiveKit の接続状況

`/admin/livekit` は `lib/livekit/status.ts` の `getLiveKitStatus()` でサーバーに問い合わせます。

- `LIVEKIT_URL` に GET を送り HTTP 到達性と応答時間を確認します（LiveKit サーバーは `OK` を返します）。`wss://` が設定されている場合は `https://` に変換します。
- `livekit-server-sdk` の `LiveKitAPI` で `listRooms` を呼び、API キー・シークレットの認証と応答時間を確認します。成功した場合は各ルームの `listParticipants` も取得し、参加者の状態・種別・トラック数・参加時刻を表示します（参加者の詳細取得は先頭20ルームまで）。
- いずれも 5 秒でタイムアウトします。API キーは先頭と末尾のみ表示し、シークレットは設定済みかどうかだけを表示します。
- ページは毎回サーバーに問い合わせます。「再読み込み」ボタンで再取得できます。ダッシュボードの LiveKit カードは他のカードを待たせないよう Suspense でストリーミングします。

## 共通トースト通知

ルートレイアウトに [Sonner](https://github.com/emilkowalski/sonner) の通知領域を配置しています。右上に表示し、約4.5秒で自動的に消えます。閉じるボタン、ダークモード、スマートフォン表示に対応しています。

Client Component のイベントや Server Action の結果受信後に呼び出してください。

```tsx
import { toast } from "@/components/notifications";

toast.success("保存しました。");
toast.error("保存できませんでした。");
toast.info("お知らせがあります。");
```

Server Action 内から直接 `toast` を呼び出さず、結果をクライアントに返して表示してください。

## ユーザー検索と OIDC チームマッピング

- `/admin/users` と `/admin/roles` で名前・メールアドレスを部分一致検索できます。大文字小文字を区別せず、検索条件は URL の `q` に保存します。
- `/admin/teams` のチーム一覧には、ロール別の人数を示す Administrator / Member の標準チームと、全組織の実チームを同じ一覧に表示します。標準チームは削除できず、所属変更は `/admin/roles` で行います。実チームは一覧の「削除」から削除できます（確認ダイアログあり）。
- 同じ画面の「OIDC グループの自動マッピング」で、グループ名と所属先チームを指定します。1つのグループを複数のチームへ割り当てることもできます。設定は Prisma 管理の `oidc_team_mapping` に保存されます。
- ログイン時に認証プロバイダーが返す `groups` クレーム（文字列配列）を読み、完全一致・大文字小文字を区別してマッピングします。クレーム名は `AUTHENTIK_GROUPS_CLAIM` で変更できます。Authentik の `profile` スコープマッピングからグループを返すように設定してください（[Authentik OAuth2](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)）。
- 新規・既存ユーザーのログイン時に、組織への member 所属とチーム所属を追加します。重複登録を防ぎ、チーム人数も更新します。既存の所属・ロールは削除／変更しません。ルール削除や OIDC グループ脱退時も、自動的には所属を削除しません。
- OIDC プロフィールはリクエスト単位で保持し、Better Auth がセッションを作成する直前に適用します。別ユーザーの並行ログインや API キー認証にプロフィールが流用されることはありません。
