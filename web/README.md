## 認証のセットアップ

1. `.env.example` を参考に PostgreSQL、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、Authentik の設定を `.env` に指定します。`BETTER_AUTH_URL` 以外のオリジン(開発機の LAN IP など)からも開く場合は `CHAHUB_TRUSTED_ORIGINS` にカンマ区切りで足します。
2. Authentik のリダイレクト URI に `<BETTER_AUTH_URL>/api/auth/callback/authentik` を登録します。
3. `bun run auth:migrate` で認証用テーブルを作成し、`bun prisma db update` でアプリ用のテーブル（OIDC マッピング、チーム権限、ユーザー権限）を作成します。
4. `bun dev` を起動し、`/login` から OIDC でログインします。

Prisma Next は Better Auth の Prisma アダプターと互換性がないため、認証は標準 PostgreSQL アダプターを使用します。アプリ側は同じ `auth_` テーブルを Prisma 8 の contract に定義して操作します。`@@map` で実テーブル名に対応させ、`@@control(external)` で DDL は Better Auth 側に任せています。管理画面の取得・作成・更新は `db.orm.public.AuthUser` / `AuthTeam` などを使用します。

contract を編集したら `bun run contract:emit` で型と JSON を更新してください。emit は DB のテーブルを変更しません。認証スキーマの更新後は contract も追従させてください。日時は PostgreSQL の型を維持した `TimestamptzString` で扱います。ORM に専用 API がないテーブルロックだけは、Prisma の raw lane を同じトランザクション内で使用しています。

キオスク端末(Android タブレット + Free Kiosk)はローカル API の確認後、localStorage に保存した UUID で自動登録します。専用アプリのビルドも端末ごとのアカウントも不要で、端末の `kiosk_device` 行(端末 ID・端末名・設置場所・メモ・有効フラグ・最終訪問時刻)だけを持ちます。端末は Better Auth の認証を通さず、訪問時に端末 ID を DB と照合して認識します(`getKioskDevice()`、`features/kiosk/device.ts`)。端末固有のデータはこの端末 ID をキーに持たせてください。

一般端末とキオスク端末では、完全に別のホーム画面を開きます。認証の共通境界 `app/(protected)/layout.tsx` は「人のログインセッションがある」か「登録済みキオスク端末である」のどちらかを求め、キオスク端末はログインなしで `(protected)` 以下を開けます。振り分けは `app/(protected)/(app)/layout.tsx` が行い、キオスク端末なら `/kiosk` へ転送します。逆に一般端末が `/kiosk` 以下を開いた場合は `kiosk/layout.tsx` で `/` へ戻します。

- `/`（`app/(protected)/(app)/page.tsx`）: ブラウザーからログインしたときのホームです。キオスクでなくても使う普段づかいの画面で、同じサービスをスマートフォンやパソコンからも利用できる想定です。
- `/generic` 以下: 一般メニューの各サービス（伝言板・買い物リスト・予定と天気・家の状態・家電の操作・タイマー）。`/admin` と同じくフォルダごとに 1 ページを置きます。サービスの定義（パス・名前・説明・アイコン）は `features/generic/services.ts` にまとめ、サイドバーとホームの一覧が同じ定義を参照します。`/generic/kiosks` は一般端末向けの見守り・声かけ画面です。その他のサービスは現在サンプル表示です。`/generic` 自体は `/` へ転送します。
- `/admin` 以下: 管理者画面。`/` と同じサイドバーレイアウトの中に入ります。サイドバーのメニューは「一般メニュー」と「管理者メニュー」に分かれ、管理者メニューは管理者にだけ表示されます。ロゴは `/` にリンクします。管理者以外の締め出しは `app/(protected)/(app)/admin/layout.tsx` の関門（`getAdminPageUser()`）が担当します。
- `/kiosk`（`app/(protected)/kiosk/page.tsx`）: 家の中に置く常駐タブレット向けの画面（店舗の注文タブレットや ALSOK のような常駐端末のイメージ）。サイドバーは持ちません。時計、見守り配信、他端末の閲覧、キオスク同士のビデオ通話を表示します。その他のサービスは準備中です。ログイン中の端末が `kiosk` に登録されていれば端末名と設置場所を表示し、ほかの登録端末を一覧します。

管理者が 1 人もいない初期状態では管理者メニューが出ないため、`/` に管理者ダッシュボードへの案内を表示します。最初にそこを開いたアカウントが管理者になります。

ログイン画面 `/login` はログイン済みなら `/` へ転送し、失敗時はトーストと画面内の警告を表示します。

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
- `/admin/kiosks`: 自動登録されたキオスク端末の編集・有効化 / 無効化・削除
- `/admin/livekit`: LiveKit サーバーの接続状況（HTTP 到達性・API 認証・応答時間）、環境変数の設定状態、開かれているルームと参加者の一覧

すべての管理ページで管理者権限を確認します。

- `bun run auth:migrate` で Admin プラグインの必要なカラムを追加してください。旧 `admin` は `administrator`、旧 `user` / `kiosk` と未設定のロールは `member` に移行します。起動中の開発サーバーは再起動してください。
- 現在 `administrator` のユーザーが1人もいない場合、ログインして `/admin` を最初に開いたユーザーが自動で `administrator` になります。未認証アクセスやリンクの事前読み込みでは昇格しません。同時アクセスでも1人だけが昇格します。
- 登録ユーザー数や過去の管理者作成履歴は条件にしません。最後の管理者が降格・削除された場合も、次に `/admin` を開いたログイン済みユーザーが自動昇格します。旧履歴テーブルとトリガーは `auth:migrate` で削除します。
- チーム作成時は共通の `ChaHub` 組織を用意し、その配下に空のチームを作成します。メンバー追加は未実装です。
- チーム削除は Better Auth の Organization プラグイン `auth.api.removeTeam` を使用します。管理者権限は `requireAdmin()` で確認し、`headers` を渡さないサーバー呼び出しにすることで組織メンバーとしての権限確認を省いています。所属（`auth_team_member`）は Better Auth が削除し、OIDC マッピングは外部キーの `ON DELETE CASCADE` で削除されます。`teams.allowRemovingAllTeams` を有効にしているため、最後のチームも削除できます。
- 権限は組織内の owner / member とは別のアプリ全体の区分です。管理者は自分自身のロールも変更できます。最後の管理者を一般ユーザーへ変更した場合も、再度 `/admin` にアクセスすれば管理者に戻れます。
- ロールはチームごと（`team_role`）とユーザーごと（`user_role_override`）に設定できます。「チームごとの権限」には Administrator / Member の標準チームも並びますが、ロールそのものなので権限は固定表示です。有効なロールは **ユーザー単位の指定 > 所属チームの設定（複数チームなら管理者が優先）> 既定の一般ユーザー** の順で `features/admin/roles.ts` の `resolveRoles()` が解決し、Better Auth が参照する `auth_user.role` に同期します。同期はチーム権限の変更、ユーザー権限の変更、OIDC マッピングによるチーム所属追加、チーム削除の直後に行います。自動昇格と `auth:admin` はユーザー単位の指定として保存するため、チーム設定の同期で降格しません。
- キオスク専用ロールはありません。キオスク端末は認証を通さず、ユーザーやロールとは無関係に端末 ID だけで扱います。管理画面(`/admin` 以下)はログインが必要なため、キオスク端末からは開けません。

ロールの定義・権限判定は Better Auth の [Admin プラグイン](https://better-auth.com/docs/plugins/admin) を利用しています。管理画面の権限判定は `auth.api.userHasPermission` を使用します。画面からの変更は `setUserRole()` / `setTeamRole()` が `auth_user.role` を直接更新します（テーブルロック付きトランザクション）。`auth:admin` は手動設定・復旧用のサーバー専用コマンドです。自動昇格は DB トランザクションとテーブルロックで、現在の管理者の有無の確認と昇格を一括して実行します。

初期設定の統合テストは `TEST_DATABASE_URL=... bun test tests/admin-bootstrap.test.ts` で実行できます。テスト用の独立した DB を作成し、終了時に削除します。接続ユーザーには DB 作成権限が必要です。管理者復帰、同時チーム作成、関連データと人数の集計を実 DB と ORM で検証します。

## キオスク端末

`/admin/kiosks` の処理は `features/kiosk/admin.ts` にあります。

- 登録: Free Kiosk で `/kiosk-connect` を開くと自動登録します。端末名・設置場所・メモは管理画面で編集できます。
- 一覧: 端末名・有効 / 無効・訪問中かどうか・端末 ID・最終訪問・登録日を表示します。
- 有効化 / 無効化: `enabled` を切り替えます。無効の端末は訪問しても認識せず、見守り・通話の一覧にも出ません。削除: 行を削除します。次回アクセスで自動登録されるため、接続停止には無効化を使います。
- 端末はユーザーではないため、ユーザー一覧やロール・権限には出てきません。

## LiveKit の接続状況

`/admin/livekit` は `features/admin/livekit-status.ts` の `getLiveKitStatus()` でサーバーに問い合わせます。

- `LIVEKIT_URL` に GET を送り HTTP 到達性と応答時間を確認します（LiveKit サーバーは `OK` を返します）。`wss://` が設定されている場合は `https://` に変換します。
- `livekit-server-sdk` の `LiveKitAPI` で `listRooms` を呼び、API キー・シークレットの認証と応答時間を確認します。成功した場合は各ルームの `listParticipants` も取得し、参加者の状態・種別・トラック数・参加時刻を表示します（参加者の詳細取得は先頭20ルームまで）。
- いずれも 5 秒でタイムアウトします。API キーは先頭と末尾のみ表示し、シークレットは設定済みかどうかだけを表示します。
- ページは毎回サーバーに問い合わせます。「再読み込み」ボタンで再取得できます。ダッシュボードの LiveKit カードは他のカードを待たせないよう Suspense でストリーミングします。

## テーマ切り替え

ライト / ダーク / システムを [next-themes](https://github.com/pacocoursey/next-themes) で切り替えます。選択は `localStorage` の `chahub-theme` に保存され、初回描画前に `<html class="dark">` を付けるためフラッシュしません。Tailwind の `dark:` は `app/globals.css` の `@custom-variant dark (&:where(.dark, .dark *))` でクラス方式にしており、OS 設定は「システム」を選んだときだけ参照します。切り替え UI(`ThemeToggle`)は保護ページ共通ヘッダーとログイン画面にあり、トースト(Sonner)と NProgress の色もテーマに追従します。

## ページ遷移のプログレスバー

ページ移動中に固まったと誤解されないよう、画面上部に [NProgress](https://github.com/rstacruz/nprogress) のバーを表示します。`instrumentation-client.ts` の `onRouterTransitionStart`(Next.js の App Router 遷移フック)が遷移開始を `chahub:navigation-start` イベントで通知し、ルートレイアウトの `NavigationProgress` が `NProgress.start()` を呼びます。完了は `usePathname` / `useSearchParams` の変化で検知して `NProgress.done()` します。同じ URL への移動では表示せず、15 秒以内に完了を検知できない場合は自動で終了します。スタイルは `app/globals.css` の `#nprogress` にあり、ダークモードと `prefers-reduced-motion` に対応します。

## 共通トースト通知

ルートレイアウトに [Sonner](https://github.com/emilkowalski/sonner) の通知領域を配置しています。右上に表示し、約4.5秒で自動的に消えます。閉じるボタン、ダークモード、スマートフォン表示に対応しています。

Client Component のイベントや Server Action の結果受信後に呼び出してください。

```tsx
import { toast } from "@/lib/notifications";

toast.success("保存しました。");
toast.error("保存できませんでした。");
toast.info("お知らせがあります。");
```

Server Action 内から直接 `toast` を呼び出さず、結果をクライアントに返して表示してください。

## ユーザー検索と OIDC チームマッピング

- `/admin/users` と `/admin/roles` で名前・メールアドレスを部分一致検索できます。大文字小文字を区別せず、検索条件は URL の `q` に保存します。
- `/admin/teams` のチーム一覧には、ロール別の人数を示す Administrator / Member の標準チームと、全組織の実チームを同じ一覧に表示します。標準チームは削除できず、所属変更は `/admin/roles` で行います。実チームは一覧の「削除」から削除できます（確認ダイアログあり）。
- 同じ画面の「OIDC グループの自動マッピング」で、グループ名と所属先チームを指定します。1つのグループを複数のチームへ割り当てることもできます。設定は Prisma 管理の `oidc_team_mapping` に保存されます（`teamId` か `role` のどちらか一方を持ちます）。
- 所属先には標準チーム（Administrator / Member）も選べます。選ぶと、ログイン時にそのユーザーのロールを OIDC 由来のユーザー単位指定（`user_role_override.source = oidc`）として保存し、複数該当する場合は Administrator を優先します。管理者が画面や CLI で指定したロール（`source = admin`）は上書きしません。ロール・権限画面では「OIDC グループからの指定」と表示されます。
- ログイン時に認証プロバイダーが返す `groups` クレーム（文字列配列）を読み、完全一致・大文字小文字を区別してマッピングします。クレーム名は `AUTHENTIK_GROUPS_CLAIM` で変更できます。Authentik の `profile` スコープマッピングからグループを返すように設定してください（[Authentik OAuth2](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)）。
- 新規・既存ユーザーのログイン時に、組織への member 所属とチーム所属を追加します。重複登録を防ぎ、チーム人数も更新します。既存の所属・ロールは削除／変更しません。ルール削除や OIDC グループ脱退時も、自動的には所属を削除しません。
- OIDC プロフィールはリクエスト単位で保持し、Better Auth がセッションを作成する直前に適用します。別ユーザーの並行ログインにプロフィールが流用されることはありません。


## キオスクの見守り・ビデオ通話

- `LIVEKIT_URL`、`LIVEKIT_API_KEY`、`LIVEKIT_API_SECRET` を設定します。端末から WebSocket と WebRTC で LiveKit に到達できる必要があります。
- カメラ・マイクを使用するため、Web アプリは HTTPS（ローカル開発では localhost）で開きます。
- 登録済みキオスクはログインなしで `/kiosk` を開き、「カメラ・スピーカーを開始」を押してカメラ・マイクを許可します。配信中はログイン済みの一般端末・他のキオスクから接続できます。ページを閉じるか「配信を停止」で配信を終了します。
- 一般端末はメニューの「キオスク・見守り」から「カメラを見る」で接続します。マイクは初期状態でオフで、「マイクで話す」を押すと相手のスピーカーへ声を送ります。
- キオスクからも他端末のカメラを閲覧できます。自端末の配信開始後は「ビデオ通話」も利用できます。接続先の配信ルームに参加する方式で、接続先での着信承認はありません。通話中も自端末の見守り配信を維持します。
- 見守り・通話の相手として選べるのは、いまサイトを訪問中の端末だけです。キオスク画面は 30 秒ごとに `POST /api/kiosk/session` を呼んで最終訪問時刻を更新し、90 秒以内に訪問があった端末を「訪問中」として一覧に出します(`features/kiosk/device.ts`)。一覧に出ていても配信中とは限らないため、接続画面で参加者と映像を確認してください。
- 音声の自動再生をブラウザーが制限した場合は「スピーカーの音声を有効にする」を押します。
- トークンは接続先ルームと送信可能なメディアに限定され、有効期間は10分です。端末の無効化は新規接続を拒否しますが、すでに接続済みの LiveKit セッションを強制切断するものではありません。

実機確認: 2台の登録済みキオスクで配信を開始し、一般ブラウザーからの閲覧・声かけ、キオスク間のビデオ通話、終了後のカメラ解放、カメラ権限拒否と再接続を確認してください。カメラ・マイクの許可は Free Kiosk 側の設定に従います。


## 画面と共通処理の配置

| ディレクトリ | 責務 |
| --- | --- |
| `app/` | ページ・レイアウト・API の入口。機能の UI と処理を組み合わせます。 |
| `component/ui/` | どのページでも使える Card・Button・Input などの汎用 UI。 |
| `component/layout/` | サイドバー・ナビゲーションなどの共通レイアウト部品。 |
| `features/auth/components/` | ログインフォーム・ログイン／ログアウトボタン。 |
| `features/kiosk/components/` | キオスク接続・在席更新・時計・見守り／通話・端末管理フォーム。 |
| `features/kiosk/` | UUID・ローカル API・端末 DB・端末管理アクション・通話権限。 |
| `features/admin/components/` | ユーザー・チーム・ロール・OIDC マッピング・LiveKit 状態表示の UI。 |
| `features/admin/` | 管理権限・ユーザー／チーム管理・ロール解決・OIDC マッピング・LiveKit 状態取得。 |
| `features/generic/` | 一般サービスの定義。ホームとナビゲーションから共通で参照します。 |
| `lib/` | Better Auth などの共通基盤、信頼するオリジンの判定、通知呼び出し、共通ルート定義。 |

共通部品は単数形の `component/`、機能固有の部品は `features/<機能名>/components/` に置きます。機能固有の型・処理・Server Actions は同じ feature にまとめます。管理画面に表示する場合でも、キオスク専用の UI と処理は kiosk に所属します。

`app/` のページや API は feature のサービスを呼び出せます。Better Auth の OIDC フックも `features/admin/oidc-mapping.ts` を呼び出します。認証基盤とアプリ固有の所属・ロール反映の境界です。クライアント用モジュールとサーバー用モジュールは混ぜず、個別に import します。

配置ルールは `AGENTS.md`、共通 UI の使い方は `component/ui/README.md` を参照してください。

接続URL・秘密鍵は環境変数から、端末ID・名前・設置場所はDBから取得します。URLパス、表示文言、デザイン値、トークン有効期間などのアプリ仕様はコードで管理します。


### Free Kiosk での接続

Free Kiosk の開始 URL を `https://<ChaHub Host>/kiosk-connect` に設定し、REST API をポート 8080 で有効にします。ローカルから API キーなしで `GET http://127.0.0.1:8080/api/status` にアクセスできる設定が必要です。API の仕様: https://github.com/RushB-fr/freekiosk/blob/main/docs/rest-api.md

1. ブラウザーからローカル API を確認します。3 秒以内に成功応答がなければ登録しません。通常ログインはそのまま使えます。
2. 初回は `crypto.randomUUID()` で UUID を生成し、localStorage の `chahub.kiosk-device` に保存します。次回以降は同じ値を使用します。保存できなければ登録を中止します。
3. UUID を `POST /api/kiosk/session` に送り、DB の `kiosk_device.deviceId` を主キーとして自動登録します。既存端末の名前・設置場所・無効状態は保持します。
4. 有効な端末には HttpOnly / SameSite=Strict の Cookie を発行し、サーバーは UUID を DB と照合します。HTTPS では Secure、寿命は 365 日です。30 秒ごとにローカル API の確認と在席更新を行います。

管理画面で端末名・設置場所・メモを編集できます。接続を止める場合は無効化してください。削除した端末は次回アクセス時に再登録されます。localStorage の消去やサイトのオリジン変更は別 UUID の新規端末になります。旧端末の行は必要に応じて管理画面で整理してください。

`BETTER_AUTH_URL` は端末がアクセスするオリジンに合わせ、追加の開発 URL は `CHAHUB_TRUSTED_ORIGINS` に指定します。HTTPS のページからローカル HTTP API にアクセスできること（CORS、WebView の混在コンテンツ設定、ローカルネットワーク権限）を実機で確認してください。

ローカル API の到達確認はクライアント側の端末判定です。サーバーはこの確認を証明できず、有効な形式の UUID を送るクライアントを自動登録します。キオスク登録はユーザー認証とは別の仕組みです。

`/login` とログイン済みの一般画面でも Free Kiosk を検出すると `/kiosk-connect` へ移動します。`/login?browser=1` ではログイン画面の自動転送を止められます。
