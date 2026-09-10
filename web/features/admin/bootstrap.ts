import type { db } from "@/prisma/db";

// Called only after validating a browser session on the admin page.
export async function bootstrapAdministrator(client: typeof db, userId: string) {
  return client.transaction(async tx => {
    // The ORM has no table-lock API. Keep this lock on the Prisma transaction
    // so Better Auth writes and concurrent recovery attempts cannot race.
    await tx.execute(client.raw.sql`LOCK TABLE auth_user IN SHARE ROW EXCLUSIVE MODE`.affectedCount().build());
    const users = await tx.orm.public.AuthUser.select("role").where(user => user.role.isNotNull()).all();
    if (users.some(user => user.role?.split(",").includes("administrator"))) return false;
    const user = await tx.orm.public.AuthUser.select("id", "banned").first({ id: userId });
    if (!user || user.banned) return false;
    const updatedAt = new Date().toISOString();
    await tx.orm.public.AuthUser.where({ id: userId }).update({ role: "administrator", updatedAt });
    // ユーザー単位の指定として残し、チーム設定の同期で降格しないようにする。
    await tx.orm.public.UserRoleOverride.upsert({ create: { userId, role: "administrator", source: "admin", updatedAt }, update: { role: "administrator", source: "admin", updatedAt } });
    return true;
  });
}
