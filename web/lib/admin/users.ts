import { or } from "@prisma/orm-family-sql/orm-client";
import { db } from "@/prisma/db";

export async function searchUsers(query: string, client = db) {
  const users = client.orm.public.AuthUser.select("id", "name", "email", "role")
    .orderBy(user => user.createdAt.desc());
  const text = query.trim();
  if (!text) return users.all();
  const pattern = `%${text.replace(/[\\%_]/g, "\\$&")}%`;
  return users.where(user => or(user.name.ilike(pattern), user.email.ilike(pattern))).all();
}
