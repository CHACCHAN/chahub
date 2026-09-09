import { getAdminPageUser } from "@/lib/admin/access";

// 見た目は (app) の共通レイアウトが担当する。ここは管理者以外を締め出す関門だけを持つ。
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await getAdminPageUser();
  return children;
}
