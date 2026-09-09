"use client";

import { useActionState } from "react";
import { Button, Input, Select, Badge, Card, CopyButton } from "@/components/ui";
import { toast } from "@/components/notifications";
import { createKioskAction, deleteKioskAction, rotateKioskKeyAction, toggleKioskKeyAction, type KioskActionState } from "@/lib/admin/kiosk-actions";
import { KIOSK_KEY_EXPIRIES, type KioskCredentials, type KioskRow } from "@/lib/admin/kiosk-shared";

const time = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" });
const format = (iso: string | null) => iso ? time.format(new Date(iso)) : "—";

function useKioskAction(action: (state: KioskActionState, form: FormData) => Promise<KioskActionState>) {
  return useActionState(async (previous: KioskActionState, form: FormData) => {
    const result = await action(previous, form);
    if (result.error) toast.error(result.error);
    if (result.success) toast.success(result.success);
    return result;
  }, {});
}

function ExpirySelect({ id }: { id?: string }) {
  return <Select id={id} name="expiry" defaultValue="never" aria-label={id ? undefined : "キーの有効期限"}>
    {KIOSK_KEY_EXPIRIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
  </Select>;
}

/** 作成・再発行の直後に一度だけ表示する、Tauri のビルドに埋め込む情報。 */
export function KioskCredentialsPanel({ credentials }: { credentials: KioskCredentials }) {
  const fields = [
    { key: "CHAHUB_SERVER_URL", label: "サーバー URL", value: credentials.serverUrl },
    { key: "CHAHUB_KIOSK_ID", label: "端末 ID(ユーザー ID)", value: credentials.userId },
    { key: "CHAHUB_KIOSK_NAME", label: "端末名", value: credentials.name },
    { key: "CHAHUB_API_KEY_HEADER", label: "API キーを送るヘッダー", value: credentials.header },
    { key: "CHAHUB_API_KEY", label: "API キー", value: credentials.apiKey, secret: true },
    { key: "CHAHUB_LIVEKIT_URL", label: "LiveKit URL", value: credentials.liveKitUrl ?? "" },
  ];
  const env = [`# ChaHub キオスク端末「${credentials.name}」 発行 ${format(credentials.issuedAt)}`, ...fields.map(field => `${field.key}=${field.value}`)].join("\n");
  const json = JSON.stringify({
    serverUrl: credentials.serverUrl, kioskId: credentials.userId, kioskName: credentials.name, apiKeyHeader: credentials.header,
    apiKey: credentials.apiKey, liveKitUrl: credentials.liveKitUrl, expiresAt: credentials.expiresAt, issuedAt: credentials.issuedAt,
  }, null, 2);
  return <Card as="section" aria-label="端末のビルド情報" className="border-amber-300 bg-amber-50/60 p-6 dark:border-amber-800 dark:bg-amber-950/40">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-amber-900 dark:text-amber-200">「{credentials.name}」のビルド情報</h3>
        <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-300">API キーはこの画面を離れると二度と表示されません。Tauri アプリのビルド時に埋め込む値として、いま控えてください。</p>
      </div>
      <Badge variant={credentials.expiresAt ? "neutral" : "accent"}>{credentials.expiresAt ? `${format(credentials.expiresAt)} まで有効` : "無期限"}</Badge>
    </div>
    <dl className="mt-5 divide-y divide-amber-200/70 dark:divide-amber-900">
      {fields.map(field => <div key={field.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0 flex-1">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">{field.label} <span className="ml-1 font-mono">{field.key}</span></dt>
          <dd className={`mt-1 break-all font-mono text-sm ${field.secret ? "font-semibold" : ""}`}>{field.value || "—"}</dd>
        </div>
        {field.value && <CopyButton text={field.value} />}
      </div>)}
    </dl>
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {[{ title: ".env 形式", text: env }, { title: "JSON 形式", text: json }].map(block => <div key={block.title}>
        <div className="mb-2 flex items-center justify-between gap-3"><p className="text-sm font-medium">{block.title}</p><CopyButton text={block.text} label="すべてコピー" /></div>
        <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 font-mono text-xs leading-5 dark:border-zinc-800 dark:bg-zinc-950"><code>{block.text}</code></pre>
      </div>)}
    </div>
  </Card>;
}

export function CreateKioskForm() {
  const [state, action, pending] = useKioskAction(createKioskAction);
  return <div className="space-y-6">
    <form action={action} key={state.credentials?.keyId ?? "new"} className="grid gap-4 lg:grid-cols-[2fr_2fr_1fr]">
      <Input label="端末名" name="name" required maxLength={32} placeholder="例：受付タブレット 1" />
      <Input label="設置場所(任意)" name="location" maxLength={120} placeholder="例：1F 受付" />
      <div><label htmlFor="kiosk-expiry" className="mb-2 block text-sm font-medium">キーの有効期限</label><ExpirySelect id="kiosk-expiry" /></div>
      <Input label="メモ(任意)" wrapperClassName="lg:col-span-2" name="note" maxLength={500} placeholder="例：Pixel Tablet / 社内 Wi-Fi" />
      <div className="flex items-end"><Button type="submit" pending={pending} pendingLabel="発行中…" fullWidth>＋ 端末を追加してキーを発行</Button></div>
    </form>
    {state.credentials && <KioskCredentialsPanel credentials={state.credentials} />}
  </div>;
}

const statusLabels: Record<NonNullable<KioskRow["key"]>["status"] | "missing", { label: string; variant: "success" | "neutral" | "danger" }> = {
  active: { label: "有効", variant: "success" },
  disabled: { label: "無効", variant: "neutral" },
  expired: { label: "期限切れ", variant: "danger" },
  missing: { label: "キーなし", variant: "danger" },
};

export function KioskItem({ kiosk }: { kiosk: KioskRow }) {
  const [rotateState, rotate, rotating] = useKioskAction(rotateKioskKeyAction);
  const [, toggle, toggling] = useKioskAction(toggleKioskKeyAction);
  const [, remove, removing] = useKioskAction(deleteKioskAction);
  const status = statusLabels[kiosk.key?.status ?? "missing"];
  const enabled = kiosk.key?.status === "active" || kiosk.key?.status === "expired";
  return <li className="flex flex-col gap-4 p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="break-words font-medium">{kiosk.name}<Badge variant={status.variant} className="ml-2">{status.label}</Badge></p>
        <p className="mt-1 break-all text-xs text-zinc-500">{kiosk.email}{kiosk.location && <> ・ {kiosk.location}</>}</p>
        {kiosk.note && <p className="mt-1 text-xs text-zinc-500">{kiosk.note}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <form action={toggle}>
          <input type="hidden" name="userId" value={kiosk.userId} /><input type="hidden" name="enabled" value={String(!enabled)} />
          <Button type="submit" variant="secondary" pending={toggling} pendingLabel="変更中…" disabled={!kiosk.key}>{enabled ? "無効にする" : "有効にする"}</Button>
        </form>
        <form action={rotate} className="flex items-center gap-2" onSubmit={event => {
          if (!window.confirm(`「${kiosk.name}」の API キーを再発行しますか？\n現在のキーは即座に使えなくなり、端末のビルドをやり直す必要があります。`)) event.preventDefault();
        }}>
          <input type="hidden" name="userId" value={kiosk.userId} />
          <ExpirySelect />
          <Button type="submit" variant="secondary" pending={rotating} pendingLabel="発行中…">キーを再発行</Button>
        </form>
        <form action={remove} onSubmit={event => {
          if (!window.confirm(`「${kiosk.name}」を削除しますか？\nAPI キーとアカウント、チーム所属も削除されます。この操作は取り消せません。`)) event.preventDefault();
        }}>
          <input type="hidden" name="userId" value={kiosk.userId} />
          <Button type="submit" variant="danger" pending={removing} pendingLabel="削除中…">削除</Button>
        </form>
      </div>
    </div>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-500 sm:grid-cols-3 lg:grid-cols-6">
      <div><dt>端末 ID</dt><dd className="truncate font-mono text-zinc-700 dark:text-zinc-300" title={kiosk.userId}>{kiosk.userId}</dd></div>
      <div><dt>キー</dt><dd className="font-mono text-zinc-700 dark:text-zinc-300">{kiosk.key?.start ? `${kiosk.key.start}…` : "—"}</dd></div>
      <div><dt>有効期限</dt><dd className="text-zinc-700 dark:text-zinc-300">{kiosk.key ? (kiosk.key.expiresAt ? format(kiosk.key.expiresAt) : "無期限") : "—"}</dd></div>
      <div><dt>最終アクセス</dt><dd className="text-zinc-700 dark:text-zinc-300">{format(kiosk.key?.lastRequest ?? null)}</dd></div>
      <div><dt>リクエスト数</dt><dd className="tabular-nums text-zinc-700 dark:text-zinc-300">{kiosk.key?.requestCount ?? 0}</dd></div>
      <div><dt>登録日</dt><dd className="text-zinc-700 dark:text-zinc-300">{format(kiosk.createdAt)}</dd></div>
    </dl>
    {rotateState.credentials && <KioskCredentialsPanel credentials={rotateState.credentials} />}
  </li>;
}
