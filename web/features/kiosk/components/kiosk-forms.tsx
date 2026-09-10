"use client";

import { useActionState } from "react";
import { Badge, Button, Input } from "@/component/ui";
import { toast } from "@/lib/notifications";
import { updateKioskAction, deleteKioskAction, toggleKioskAction, type KioskActionState } from "@/features/kiosk/admin-actions";
import type { KioskRow } from "@/features/kiosk/admin";

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

/** 自動登録後の端末情報を編集する。 */
function EditKioskForm({ kiosk }: { kiosk: KioskRow }) {
  const [state, action, pending] = useKioskAction(updateKioskAction);
  return <form action={action} key={state.success ?? kiosk.deviceId} className="grid gap-4 lg:grid-cols-2">
    <input type="hidden" name="deviceId" value={kiosk.deviceId} />
    <Input label="端末名" name="name" defaultValue={kiosk.name} required maxLength={32} placeholder="例：受付タブレット 1" />
    <Input label="設置場所(任意)" name="location" defaultValue={kiosk.location ?? ""} maxLength={120} placeholder="例：1F 受付" />
    <Input label="メモ(任意)" name="note" defaultValue={kiosk.note ?? ""} maxLength={500} placeholder="例：Pixel Tablet / 社内 Wi-Fi" />
    <div className="lg:col-span-2"><Button type="submit" pending={pending} pendingLabel="保存中…">保存</Button></div>
  </form>;
}

export function KioskItem({ kiosk }: { kiosk: KioskRow }) {
  const [, toggle, toggling] = useKioskAction(toggleKioskAction);
  const [, remove, removing] = useKioskAction(deleteKioskAction);
  return <li className="flex flex-col gap-4 p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="break-words font-medium">{kiosk.name}
          <Badge variant={kiosk.enabled ? "success" : "neutral"} className="ml-2">{kiosk.enabled ? "有効" : "無効"}</Badge>
          <Badge variant={kiosk.online ? "accent" : "neutral"} className="ml-2">{kiosk.online ? "訪問中" : "未訪問"}</Badge>
        </p>
        {kiosk.location && <p className="mt-1 text-xs text-zinc-500">{kiosk.location}</p>}
        {kiosk.note && <p className="mt-1 text-xs text-zinc-500">{kiosk.note}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <form action={toggle}>
          <input type="hidden" name="deviceId" value={kiosk.deviceId} /><input type="hidden" name="enabled" value={String(!kiosk.enabled)} />
          <Button type="submit" variant="secondary" pending={toggling} pendingLabel="変更中…">{kiosk.enabled ? "無効にする" : "有効にする"}</Button>
        </form>
        <form action={remove} onSubmit={event => {
          if (!window.confirm(`「${kiosk.name}」を削除しますか？\n次回アクセス時に自動登録されます。接続を止める場合は無効にしてください。`)) event.preventDefault();
        }}>
          <input type="hidden" name="deviceId" value={kiosk.deviceId} />
          <Button type="submit" variant="danger" pending={removing} pendingLabel="削除中…">削除</Button>
        </form>
      </div>
    </div>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-500 sm:grid-cols-3">
      <div className="min-w-0"><dt>端末 ID</dt><dd className="truncate font-mono text-zinc-700 dark:text-zinc-300" title={kiosk.deviceId}>{kiosk.deviceId}</dd></div>
      <div><dt>最終訪問</dt><dd className="text-zinc-700 dark:text-zinc-300">{format(kiosk.lastSeenAt)}</dd></div>
      <div><dt>登録日</dt><dd className="text-zinc-700 dark:text-zinc-300">{format(kiosk.createdAt)}</dd></div>
    </dl>
    <details><summary className="cursor-pointer text-sm">端末情報を編集</summary><div className="mt-4"><EditKioskForm kiosk={kiosk} /></div></details>
  </li>;
}
