"use client";

import { useActionState } from "react";
import { Button, Input, Select } from "@/component/ui";
import { createTeam, deleteTeam, updateRole, updateTeamRole, type ActionState } from "@/features/admin/actions";
import { toast } from "@/lib/notifications";

function useNotifiedAction(serverAction: (state: ActionState, form: FormData) => Promise<ActionState>) {
  return useActionState(async (previous: ActionState, form: FormData) => {
    const result = await serverAction(previous, form);
    if (result.error) toast.error(result.error);
    if (result.success) toast.success(result.success);
    return result;
  }, {});
}

export function CreateTeamForm() {
  const [, action, pending] = useNotifiedAction(createTeam);
  return <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
    <Input label="チーム名" wrapperClassName="flex-1" name="name" required maxLength={80} placeholder="例：開発チーム" />
    <Button type="submit" pending={pending} pendingLabel="作成中…">＋ チームを作成</Button>
  </form>;
}

export function DeleteTeamForm({ id, name }: { id: string; name: string }) {
  const [, action, pending] = useNotifiedAction(deleteTeam);
  return <form action={action} onSubmit={event => {
    if (!window.confirm(`「${name}」を削除しますか？\n所属メンバーと OIDC マッピングも削除されます。この操作は取り消せません。`)) event.preventDefault();
  }}>
    <input type="hidden" name="teamId" value={id} />
    <Button type="submit" variant="danger" pending={pending} pendingLabel="削除中…" aria-label={`${name} を削除`}>削除</Button>
  </form>;
}

export function RoleForm({ id, role }: { id: string; role: "inherit" | "member" | "administrator" }) {
  const [, action, pending] = useNotifiedAction(updateRole);
  return <form action={action}>
    <input type="hidden" name="userId" value={id} />
    <div className="flex items-center gap-2">
      <Select aria-label="ユーザー単位の権限" name="role" defaultValue={role} key={role} disabled={pending}>
        <option value="inherit">チームの設定に従う</option><option value="member">一般</option><option value="administrator">管理者</option>
      </Select>
      <Button type="submit" pending={pending} pendingLabel="保存中…">保存</Button>
    </div>
  </form>;
}

export function TeamRoleForm({ id, role }: { id: string; role: "none" | "member" | "administrator" }) {
  const [, action, pending] = useNotifiedAction(updateTeamRole);
  return <form action={action}>
    <input type="hidden" name="teamId" value={id} />
    <div className="flex items-center gap-2">
      <Select aria-label="チーム単位の権限" name="role" defaultValue={role} key={role} disabled={pending}>
        <option value="none">設定しない</option><option value="member">一般</option><option value="administrator">管理者</option>
      </Select>
      <Button type="submit" pending={pending} pendingLabel="保存中…">保存</Button>
    </div>
  </form>;
}
