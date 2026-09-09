import { OidcMappingForm, RemoveOidcMapping } from "@/components/admin/oidc-mapping-form";
import { getAdminPageUser } from "@/lib/admin/access";
import { db } from "@/prisma/db";
import { CreateTeamForm, DeleteTeamForm } from "@/components/admin/forms";
import { PageHeader, Card, Badge, List, ListItem, TextLink } from "@/components/ui";
import { STANDARD_TEAM_NAMES } from "@/lib/admin/oidc-mapping";
import { isRole } from "@/lib/admin/roles";

export default async function TeamsPage() {
  await getAdminPageUser();
  const teams = await db.orm.public.AuthTeam.select("id", "name")
    .include("organization", organization => organization.select("name"))
    .include("authTeamMembers", members => members.count())
    .orderBy(team => team.createdAt.desc()).all();
  const [users, mappings] = await Promise.all([
    db.orm.public.AuthUser.select("role").all(),
    db.orm.public.OidcTeamMapping.include("team", team => team.select("name")).orderBy(rule => rule.groupName.asc()).all(),
  ]);
  const administrators = users.filter(user => user.role?.split(",").includes("administrator")).length;
  // ロールで決まる標準チーム。実チームと同じ一覧に並べるが、削除はできない。
  const standardTeams = [
    { name: "Administrator", count: administrators },
    { name: "Member", count: users.length - administrators },
  ];
  return <>
    <PageHeader title="チーム" description="チームの作成・削除と、作成済みチームの確認ができます。" />
    <Card as="section" title="チームを作成" className="mb-6">
      <CreateTeamForm />
    </Card>
    <Card as="section" title="OIDC グループの自動マッピング" className="mb-6"
      description="ログイン時、グループ名が完全一致するユーザーを指定チームに追加します。標準チーム(Administrator / Member)を選ぶと、そのユーザーのロールを OIDC 由来の指定として設定します(管理者が画面で指定したロールは上書きしません)。既存の所属は変更しません。">
      <OidcMappingForm teams={teams.map(team => ({id: team.id, name: team.name, organization: team.organization?.name ?? ""}))} />
      <List className="mt-5" empty="マッピングはまだ設定されていません。">
        {mappings.map(rule => <ListItem key={rule.id} className="px-0 py-3">
          <p className="min-w-0 break-words text-sm"><span className="font-medium">{rule.groupName}</span><span className="mx-2 text-zinc-400" aria-hidden="true">→</span>{rule.team?.name ?? (isRole(rule.role) ? STANDARD_TEAM_NAMES[rule.role] : "(削除済み)")}{isRole(rule.role) && <Badge variant="accent" className="ml-2">標準</Badge>}</p>
          <RemoveOidcMapping id={rule.id} />
        </ListItem>)}
      </List>
    </Card>
    <Card as="section" title="チーム一覧" meta={`${standardTeams.length + teams.length} チーム`} divided
      description="Administrator / Member はロールで所属が決まる標準チームのため削除できません。所属の変更はロール・権限から行います。">
      <List>
        {standardTeams.map(team => <ListItem key={team.name}>
          <div className="min-w-0">
            <p className="break-words font-medium">{team.name}<Badge variant="accent" className="ml-2">標準</Badge></p>
            <p className="mt-1 text-xs text-zinc-500">ロールに応じて自動的に所属します</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge>{team.count} 人</Badge>
            <TextLink href="/admin/roles">ロールで変更 <span aria-hidden="true">→</span></TextLink>
          </div>
        </ListItem>)}
        {teams.map(team => <ListItem key={team.id}>
          <div className="min-w-0"><p className="break-words font-medium">{team.name}</p><p className="mt-1 text-xs text-zinc-500">{team.organization?.name}</p></div>
          <div className="flex items-center gap-4">
            <Badge>{team.authTeamMembers} 人</Badge>
            <DeleteTeamForm id={team.id} name={team.name} />
          </div>
        </ListItem>)}
      </List>
    </Card>
  </>;
}
