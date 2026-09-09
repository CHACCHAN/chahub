import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { db } from "@/prisma/db";
import { resolveRoles, roleLabels } from "@/lib/admin/roles";
import { PageHeader, Card, Badge, List, ListItem, Icon, TextLink, Notice } from "@/components/ui";
import { genericServices } from "@/lib/generic/services";

// ブラウザー(スマートフォン・パソコンなど、キオスク端末以外)からログインしたときのホーム画面(ルート /)。
// 管理者画面と同じサイドバーレイアウト((app)/layout.tsx)の中に入り、サイドバーの「一般メニュー」から辿る。
// キオスクのような常設ダッシュボードではなく、普段使うアプリのような一覧構成にする。機能は未実装で、枠だけを用意している。

export default async function GeneralHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [teamMemberships, resolved, roleHolders] = await Promise.all([
    db.orm.public.AuthTeamMember.include("team", team => team.select("name")).where({ userId: session.user.id }).all(),
    resolveRoles([session.user.id]),
    db.orm.public.AuthUser.select("role").where(user => user.role.isNotNull()).all(),
  ]);
  const role = resolved.get(session.user.id)?.role ?? "member";
  // 管理者が 1 人もいない初期状態では、管理者メニューが出ないため /admin への入り口をここに出す。
  const noAdministrator = !roleHolders.some(user => user.role?.split(",").includes("administrator"));
  const teamNames = teamMemberships.map(membership => membership.team?.name).filter((name): name is string => Boolean(name));

  return <div className="mx-auto max-w-2xl">
    <PageHeader title="ホーム" description="スマートフォンやパソコンのブラウザーからも、キオスク端末と同じアカウントで使えます。" />

    {noAdministrator && <Notice variant="warning" className="mb-6" title="管理者がまだ設定されていません"
      action={<TextLink href="/admin">管理者ダッシュボードを開く <span aria-hidden="true">→</span></TextLink>}>
      最初に管理者ダッシュボードを開いたアカウントが管理者になります。
    </Notice>}

    <Card as="section" title="アカウント" description="このアカウントでログイン中です。" className="mb-6">
      <div className="flex flex-wrap items-center gap-5">
        <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          {session.user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{session.user.name}</p>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{session.user.email}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Badge variant={role === "administrator" ? "accent" : "neutral"}>{roleLabels[role]}</Badge>
          {teamNames.map(name => <Badge key={name}>{name}</Badge>)}
        </div>
      </div>
    </Card>

    <Card as="section" title="サービス" meta={`${genericServices.length} 件`} divided
      description="家の中で使う機能をまとめています。「外出先でも」がついたものは、自宅の外からでも利用できます。">
      <List>
        {genericServices.map(service => <ListItem key={service.href} className="p-0">
          <Link href={service.href} className="flex w-full flex-wrap items-center justify-between gap-4 p-6 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500 dark:hover:bg-zinc-900">
            <span className="flex min-w-0 items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <Icon path={service.icon} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{service.title}</span>
                <span className="mt-0.5 block truncate text-sm text-zinc-500 dark:text-zinc-400">{service.description}</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {service.away && <Badge variant="accent">外出先でも</Badge>}
              {!service.available && <Badge>準備中</Badge>}
              <Icon path="M9 18l6-6-6-6" className="text-zinc-300 dark:text-zinc-700" />
            </span>
          </Link>
        </ListItem>)}
      </List>
    </Card>
  </div>;
}
