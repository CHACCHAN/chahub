import { redirect } from "next/navigation";
import { getSession } from "@/lib/better-auth/session";
import { PageHeader, TextLink } from "@/components/ui";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <main className="mx-auto max-w-5xl space-y-4 p-8">
    <PageHeader title="ChaHub" description={`${session.user.name} としてログインしています。`} />
    <TextLink href="/admin">管理者ダッシュボード <span aria-hidden="true">→</span></TextLink>
  </main>;
}
