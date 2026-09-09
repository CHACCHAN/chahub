import "dotenv/config";
import { db } from "../prisma/db";
import { setUserRole } from "../lib/admin/roles";

try {
  const id = process.argv[2];
  if (!id) throw new Error("Usage: bun run auth:admin <auth_user.id>");
  if (!await db.orm.public.AuthUser.first({ id })) throw new Error("指定されたユーザーが見つかりません。");
  // ユーザー単位の指定として保存し、auth_user.role に同期する。
  await setUserRole(id, "administrator");
  console.log("管理者権限を付与しました。");
} finally {
  await db.close();
}
