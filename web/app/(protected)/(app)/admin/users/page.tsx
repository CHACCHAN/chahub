import { getAdminPageUser } from "@/features/admin/access";
import { searchUsers } from "@/features/admin/users";
import { UserSearch } from "@/features/admin/components/user-search";
import { UserIdentity } from "@/features/admin/components/user-identity";
import { PageHeader, Card, Badge, List, ListItem, TextLink } from "@/component/ui";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const actor = await getAdminPageUser();
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 200);
  const users = await searchUsers(query);
  return <>
    <PageHeader title="ユーザー" description="ChaHub に登録されているユーザーを確認できます。" />
    <UserSearch query={query} path="/admin/users" />
    <Card as="section" title="登録ユーザー" meta={`${users.length} 人`} divided
      action={<TextLink href="/admin/roles">ロールを変更する <span aria-hidden="true">→</span></TextLink>}>
      <List empty={query ? "一致するユーザーが見つかりません。" : "登録ユーザーがありません。"}>
        {users.map(user => {
          const administrator = user.role?.split(",").includes("administrator");
          return <ListItem key={user.id}>
            <UserIdentity user={user} self={user.id === actor.id} avatar />
            <Badge variant={administrator ? "accent" : "neutral"}>{administrator ? "管理者" : "一般ユーザー"}</Badge>
          </ListItem>;
        })}
      </List>
    </Card>
  </>;
}
