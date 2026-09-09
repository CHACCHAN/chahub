"use client";

import { useActionState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { toast } from "@/components/notifications";
import { addOidcMapping, removeOidcMapping } from "@/lib/admin/mapping-actions";
import type { ActionState } from "@/lib/admin/actions";

function useMappingAction(action: typeof addOidcMapping) {
  return useActionState(async (state: ActionState, form: FormData) => {
    const result = await action(state, form);
    if (result.success) toast.success(result.success);
    if (result.error) toast.error(result.error);
    return result;
  }, {});
}

export function OidcMappingForm({ teams }: { teams: { id: string; name: string; organization: string }[] }) {
  const [, action, pending] = useMappingAction(addOidcMapping);
  return <form action={action} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
    <Input label="OIDC グループ名" name="groupName" required maxLength={200} placeholder="例：engineering" />
    <Select label="所属先チーム" name="target" required defaultValue="">
      <option value="" disabled>チームを選択</option>
      <optgroup label="標準チーム(ロール)">
        <option value="role:administrator">Administrator(管理者になる)</option>
        <option value="role:member">Member(一般ユーザーになる)</option>
      </optgroup>
      {teams.length > 0 && <optgroup label="チーム">
        {teams.map(team => <option key={team.id} value={`team:${team.id}`}>{team.organization} / {team.name}</option>)}
      </optgroup>}
    </Select>
    <Button type="submit" pending={pending} pendingLabel="保存中…">マッピングを追加</Button>
  </form>;
}

export function RemoveOidcMapping({ id }: { id: string }) {
  const [, action, pending] = useMappingAction(removeOidcMapping);
  return <form action={action}><input type="hidden" name="id" value={id} /><Button type="submit" pending={pending} pendingLabel="削除中…" variant="danger">削除</Button></form>;
}
