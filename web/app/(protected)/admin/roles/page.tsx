import { getAdminPageUser } from "@/lib/admin/access";
import { searchUsers } from "@/lib/admin/users";
import { isRole, resolveRoles, roleLabels, type ResolvedRole, type Role } from "@/lib/admin/roles";
import { db } from "@/prisma/db";
import { UserSearch } from "@/components/admin/user-search";
import { UserIdentity } from "@/components/admin/user-identity";
import { RoleForm, TeamRoleForm } from "@/components/admin/forms";
import { PageHeader, Card, Badge, List, ListItem } from "@/components/ui";

const roles = [
  { name: "一般ユーザー", key: "member", description: "通常の機能を利用できます。" },
  { name: "管理者", key: "administrator", description: "チームの作成やユーザーの権限変更ができます。" },
];

function sourceLabel(resolved: ResolvedRole) {
  if (resolved.source.kind === "user") return "ユーザー単位の指定";
  if (resolved.source.kind === "team") return `チーム「${resolved.source.teamName}」の設定`;
  return "既定";
}

export default async function RolesPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const actor = await getAdminPageUser();
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 200);
  const [users, allUsers, teams, teamRoles] = await Promise.all([
    searchUsers(query),
    db.orm.public.AuthUser.select("role").all(),
    db.orm.public.AuthTeam.select("id", "name").include("organization", organization => organization.select("name"))
      .include("authTeamMembers", members => members.count()).orderBy(team => team.createdAt.desc()).all(),
    db.orm.public.TeamRole.all(),
  ]);
  const resolved = await resolveRoles(users.map(user => user.id));
  const roleOfTeam = new Map(teamRoles.map(teamRole => [teamRole.teamId, teamRole.role]));
  const administrators = allUsers.filter(user => user.role?.split(",").includes("administrator")).length;
  // ロールで所属が決まる標準チーム。権限はロールそのもので固定。
  const standardTeams: { name: string; role: Role; count: number }[] = [
    { name: "Administrator", role: "administrator", count: administrators },
    { name: "Member", role: "member", count: allUsers.length - administrators },
  ];
  return <>
    <PageHeader title="ロール・権限" description="ロールはチームごと、またはユーザーごとに設定できます。ユーザー単位の指定が最優先、次に所属チームの設定(複数なら管理者が優先)、どちらも無ければ一般ユーザーです。" />
    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      {roles.map(role => <Card key={role.key} className="p-5">
        <h2 className="font-semibold">{role.name}<span className="ml-2 text-xs font-normal text-zinc-500">{role.key}</span></h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{role.description}</p>
      </Card>)}
    </div>
    <Card as="section" title="チームごとの権限" meta={`${standardTeams.length + teams.length} チーム`} className="mb-6" divided
      description="チームに設定した権限は所属メンバー全員に適用されます。Administrator / Member の標準チームはロールそのものなので権限は固定です。">
      <List>
        {standardTeams.map(team => <ListItem key={team.name} className="flex-col items-stretch lg:flex-row lg:items-center">
          <div className="min-w-0">
            <p className="break-words font-medium">{team.name}<Badge variant="accent" className="ml-2">標準</Badge><span className="ml-2 text-xs font-normal text-zinc-500">{team.count} 人</span></p>
            <p className="mt-1 text-xs text-zinc-500">ロールに応じて自動的に所属します</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={team.role === "administrator" ? "accent" : "neutral"}>{roleLabels[team.role]}</Badge>
            <span className="text-xs text-zinc-500">固定</span>
          </div>
        </ListItem>)}
        {teams.map(team => {
          const role = roleOfTeam.get(team.id);
          return <ListItem key={team.id} className="flex-col items-stretch lg:flex-row lg:items-center">
            <div className="min-w-0">
              <p className="break-words font-medium">{team.name}<span className="ml-2 text-xs font-normal text-zinc-500">{team.authTeamMembers} 人</span></p>
              <p className="mt-1 text-xs text-zinc-500">{team.organization?.name}{isRole(role) && <> ・ 所属メンバーは <span className="font-medium text-zinc-700 dark:text-zinc-300">{roleLabels[role]}</span></>}</p>
            </div>
            <TeamRoleForm id={team.id} role={isRole(role) ? role : "none"} />
          </ListItem>;
        })}
      </List>
    </Card>
    <UserSearch query={query} path="/admin/roles" />
    <Card as="section" title="ユーザーごとの権限" meta={`${users.length} 人`} divided
      description="「チームの設定に従う」にすると、所属チームの設定(無ければ一般ユーザー)が適用されます。">
      <List empty={query ? "一致するユーザーが見つかりません。" : "登録ユーザーがありません。"}>
        {users.map(user => {
          const current = resolved.get(user.id) ?? { role: "member" as const, source: { kind: "default" as const } };
          return <ListItem key={user.id} className="flex-col items-stretch lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <UserIdentity user={user} self={user.id === actor.id} />
              <div className="flex items-center gap-2">
                <Badge variant={current.role === "administrator" ? "accent" : "neutral"}>{roleLabels[current.role]}</Badge>
                <span className="text-xs text-zinc-500">{sourceLabel(current)}</span>
              </div>
            </div>
            <RoleForm id={user.id} role={current.source.kind === "user" ? current.role : "inherit"} />
          </ListItem>;
        })}
      </List>
    </Card>
  </>;
}
