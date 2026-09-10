import { db } from "@/prisma/db";

export class DuplicateTeamError extends Error {}

export async function createAdminTeam(name: string, client = db) {
  return client.transaction(async tx => {
    // PostgreSQL locks are the only raw statements; all CRUD uses the contract.
    await tx.execute(client.raw.sql`LOCK TABLE auth_organization, auth_team IN SHARE ROW EXCLUSIVE MODE`.affectedCount().build());
    const organizations = tx.orm.public.AuthOrganization;
    const organization = await organizations.where({ slug: "chahub" }).first()
      ?? await organizations.create({ id: crypto.randomUUID(), name: "ChaHub", slug: "chahub", createdAt: new Date().toISOString() });
    const teams = tx.orm.public.AuthTeam.where({ organizationId: organization.id });
    // Escape LIKE metacharacters so names such as "100%" compare literally.
    const pattern = name.replace(/[\\%_]/g, "\\$&");
    if (await teams.where(team => team.name.ilike(pattern)).first()) throw new DuplicateTeamError();
    return tx.orm.public.AuthTeam.create({
      id: crypto.randomUUID(), name, organizationId: organization.id,
      memberCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
  });
}
