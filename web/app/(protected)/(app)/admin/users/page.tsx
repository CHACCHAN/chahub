import { getAdminPageUser } from "@/lib/admin/access";
import { searchUsers } from "@/lib/admin/users";
import { kioskUserIds } from "@/lib/admin/kiosks";
import { UserSearch } from "@/components/admin/user-search";
import { UserIdentity } from "@/components/admin/user-identity";
import { PageHeader, Card, Badge, List, ListItem, TextLink } from "@/components/ui";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const actor = await getAdminPageUser();
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 200);
  const [users, kiosks] = await Promise.all([searchUsers(query), kioskUserIds()]);
  return <>
    <PageHeader title="ユーザー" description="ChaHub に登録されているユーザーを確認できます。" />
    <UserSearch query={query} path="/admin/users" />
    <Card as="section" title="登録ユーザー" meta={`${users.length} 人`} divided
      action={<TextLink href="/admin/roles">ロールを変更する <span aria-hidden="true">→</span></TextLink>}>
      <List empty={query ? "一致するユーザーが見つかりません。" : "登録ユーザーがありません。"}>
        {users.map(user => {
          const administrator = user.role?.split(",").includes("administrator");
          return <ListItem key={user.id}>
            <UserIdentity user={user} self={user.id === actor.id} kiosk={kiosks.has(user.id)} avatar />
            <Badge variant={administrator ? "accent" : "neutral"}>{administrator ? "管理者" : "一般ユーザー"}</Badge>
          </ListItem>;
        })}
      </List>
    </Card>
  </>;
}
