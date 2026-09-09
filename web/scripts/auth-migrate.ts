import "dotenv/config";
import { readFile } from "node:fs/promises";
import { getMigrations } from "better-auth/db/migration";
import { authOptions, authPool } from "../lib/better-auth/config";

try {
  const migration = await getMigrations(authOptions);
  await migration.runMigrations();
  const db = await authPool.connect();
  try {
    await db.query("BEGIN");
    // Keep fresh Better Auth databases aligned with the external Prisma contract.
    await db.query("ALTER TABLE auth_user ALTER COLUMN banned SET DEFAULT false");
    await db.query(`UPDATE auth_user SET role = CASE
      WHEN 'admin' = ANY(string_to_array(role, ',')) THEN 'administrator'
      ELSE 'member' END
      WHERE role IS NULL OR role IN ('user', 'kiosk') OR 'admin' = ANY(string_to_array(role, ','))`);
    await db.query(await readFile(new URL("../migrations/admin-bootstrap.sql", import.meta.url), "utf8"));
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
  console.log("認証用テーブルを更新しました。");
} finally {
  await authPool.end();
}
