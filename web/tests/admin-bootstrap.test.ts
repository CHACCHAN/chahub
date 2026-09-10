import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { searchUsers } from "../features/admin/users";
import { applyOidcTeamMappings } from "../features/admin/oidc-mapping";
import { captureOidcGroups, getOidcGroups, withOidcContext } from "../lib/better-auth/oidc-context";
import { test } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import postgres from "@prisma/orm-postgres/runtime";
import { getMigrations } from "better-auth/db/migration";
import { betterAuth } from "better-auth";
import { authOptions, authPool } from "../lib/better-auth/config";
import type { Contract } from "../prisma/contract.d";
import contractJson from "../prisma/contract.json";
import { bootstrapAdministrator } from "../features/admin/bootstrap";
import { createAdminTeam, DuplicateTeamError } from "../features/admin/teams";
import { resolveRoles, setTeamRole, setUserRole, syncUserRoles } from "../features/admin/roles";
import { updateKiosk, deleteKiosk, listKiosks, setKioskEnabled } from "../features/kiosk/admin";
import { listOnlineKioskDevices, touchKioskDevice } from "../features/kiosk/device";
import { db as applicationDb } from "../prisma/db";

const connectionString = process.env.TEST_DATABASE_URL;

test("Prisma admin queries, team creation and administrator recovery", { skip: !connectionString }, async () => {
  const database = `admin_test_${crypto.randomUUID().replaceAll("-", "")}`;
  const control = new Pool({ connectionString });
  const url = new URL(connectionString!);
  url.pathname = `/${database}`;
  const pool = new Pool({ connectionString: url.toString() });
  const db = postgres<Contract>({ contractJson, url: url.toString() });
  // headers を渡さないサーバー呼び出し(removeTeam・権限チェックなど)に使う、素の Better Auth インスタンス。
  const testAuth = betterAuth({ ...authOptions, database: pool });
  try {
    await control.query(`CREATE DATABASE "${database}"`);
    await (await getMigrations({ ...authOptions, database: pool })).runMigrations();
    await pool.query("ALTER TABLE auth_user ALTER COLUMN banned SET DEFAULT false");
    await promisify(execFile)("bun", ["prisma", "db", "update"], { env: { ...process.env, DATABASE_URL: url.toString() } });
    const users = db.orm.public.AuthUser;
    async function user(id: string, banned = false) {
      return users.create({ id, name: id, email: `${id}@example.invalid`, emailVerified: true, role: "member", banned });
    }
    await user("first"); await user("second"); await user("banned", true);
    assert.equal(await bootstrapAdministrator(db, "missing"), false);
    assert.equal(await bootstrapAdministrator(db, "banned"), false);
    const results = await Promise.all([bootstrapAdministrator(db, "first"), bootstrapAdministrator(db, "second")]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal((await users.where({ role: "administrator" }).all()).length, 1);
    assert.equal((await db.orm.public.UserRoleOverride.all()).length, 1);
    assert.equal(await bootstrapAdministrator(db, "second"), false);
    for (const current of await users.all()) await users.where({ id: current.id }).update({ role: "member" });
    assert.equal(await bootstrapAdministrator(db, "second"), true);
    assert.equal(await bootstrapAdministrator(db, "first"), false);
    await users.where({ id: "second" }).delete();
    assert.equal(await bootstrapAdministrator(db, "first"), true);
    await users.where({ id: "first" }).update({ role: "member,administrator" });
    await user("later");
    assert.equal(await bootstrapAdministrator(db, "later"), false);

    const teams = await Promise.allSettled([createAdminTeam("Example", db), createAdminTeam("EXAMPLE", db)]);
    assert.equal(teams.filter(result => result.status === "fulfilled").length, 1);
    const rejected = teams.find(result => result.status === "rejected");
    assert.ok(rejected?.status === "rejected" && rejected.reason instanceof DuplicateTeamError);
    await createAdminTeam("100%_team", db);
    await createAdminTeam("100xxteam", db);
    await assert.rejects(createAdminTeam("100%_team", db), DuplicateTeamError);
    const listed = await db.orm.public.AuthTeam
      .select("id", "name")
      .include("organization", organization => organization.select("name"))
      .include("authTeamMembers", members => members.count())
      .orderBy(team => team.createdAt.desc()).all();
    assert.equal(listed.length, 3);
    assert.equal(listed[0].organization?.name, "ChaHub");
    assert.equal(listed[0].authTeamMembers, 0);
    const team = listed[0];
    await db.orm.public.AuthTeamMember.create({ id: crypto.randomUUID(), teamId: team.id, userId: "first" });
    const withMember = await db.orm.public.AuthTeam.where({ id: team.id })
      .include("authTeamMembers", members => members.count()).first();
    assert.equal(withMember?.authTeamMembers, 1);
    await users.where({ id: "later" }).update({ name: "Example%_Name", email: "find-me@example.invalid" });
    assert.equal((await searchUsers("EXAMPLE%_", db)).length, 1);
    assert.equal((await searchUsers("find-me@", db))[0].id, "later");
    assert.equal((await searchUsers("no-match", db)).length, 0);
    await db.orm.public.OidcTeamMapping.create({ id: "mapping", groupName: "engineering", teamId: team.id });
    await Promise.all([applyOidcTeamMappings("later", ["engineering"], db), applyOidcTeamMappings("later", ["engineering"], db)]);
    const memberships = await db.orm.public.AuthTeamMember.where({ userId: "later", teamId: team.id }).all();
    assert.equal(memberships.length, 1);
    assert.equal((await db.orm.public.AuthTeam.first({ id: team.id }))?.memberCount, 2);
    assert.equal((await db.orm.public.AuthMember.where({ userId: "later" }).all()).length, 1);
    assert.equal((await users.first({ id: "later" }))?.role, "member");
    await applyOidcTeamMappings("later", [], db);
    assert.equal((await db.orm.public.AuthTeamMember.where({ userId: "later" }).all()).length, 1);
    await applyOidcTeamMappings("banned", ["Engineering"], db);
    assert.equal((await db.orm.public.AuthTeamMember.where({ userId: "banned" }).all()).length, 0);
    const isolated = await Promise.all(["a", "b"].map(group => withOidcContext(async () => {
      captureOidcGroups([group]);
      await new Promise(resolve => setTimeout(resolve, 5));
      return getOidcGroups();
    })));
    assert.deepEqual(isolated, [["a"], ["b"]]);
    assert.equal(getOidcGroups(), undefined);

    // チーム単位・ユーザー単位のロール。ユーザー指定 > チーム設定 > 既定の順で解決する。
    // 管理者復帰で作られたユーザー単位の指定を外し、チーム設定だけの状態にする。
    for (const override of await db.orm.public.UserRoleOverride.all()) await db.orm.public.UserRoleOverride.where({ userId: override.userId }).delete();
    await users.where({ id: "first" }).update({ role: "member" });
    await setTeamRole(team.id, "administrator", db);
    assert.equal((await users.first({ id: "first" }))?.role, "administrator");
    assert.equal((await users.first({ id: "later" }))?.role, "administrator");
    assert.equal((await users.first({ id: "banned" }))?.role, "member");
    assert.equal((await resolveRoles(["later"], db)).get("later")?.source.kind, "team");

    // 回帰テスト: 「一般アカウント兼管理者」(チーム経由で管理者権限を持つ通常ユーザー)が、
    // requireAdmin() が実際に使う権限チェック(auth.api.userHasPermission, user:set-role)を通過できること。
    // role を直接渡す呼び出しはヘッダー/セッション不要で、Better Auth 側の has-permission ロジック単体を検証できる。
    // 実行時のスキーマは任意の文字列(カンマ区切り含む)を受け付けるが、静的型は roles の定義から絞られるため as で通す。
    const canSetRole = (role: string) => testAuth.api.userHasPermission({ body: { role: role as "administrator", permissions: { user: ["set-role"] } } });
    assert.equal((await canSetRole((await users.first({ id: "first" }))!.role!)).success, true);
    assert.equal((await canSetRole((await users.first({ id: "banned" }))!.role!)).success, false);
    // 移行前の複数ロール形式(カンマ区切り)でも、順序に関わらず管理者権限を認識できること。
    assert.equal((await canSetRole("member,administrator")).success, true);
    assert.equal((await canSetRole("administrator,member")).success, true);
    assert.equal((await canSetRole("member")).success, false);
    await setUserRole("later", "member", db);
    assert.equal((await users.first({ id: "later" }))?.role, "member");
    assert.deepEqual((await resolveRoles(["later"], db)).get("later"), { role: "member", source: { kind: "user", via: "admin" } });
    await user("oidc");
    await applyOidcTeamMappings("oidc", ["engineering"], db);
    assert.equal((await users.first({ id: "oidc" }))?.role, "administrator");
    await setTeamRole(team.id, null, db);
    assert.equal((await users.first({ id: "first" }))?.role, "member");
    assert.equal((await users.first({ id: "oidc" }))?.role, "member");
    assert.equal((await users.first({ id: "later" }))?.role, "member");
    await setUserRole("later", null, db);
    assert.equal((await resolveRoles(["later"], db)).get("later")?.source.kind, "default");
    await setTeamRole(team.id, "administrator", db);
    assert.equal((await users.first({ id: "later" }))?.role, "administrator");

    // 標準チーム(ロール)への OIDC マッピング。OIDC 由来の指定は更新するが、管理者の指定は上書きしない。
    await db.orm.public.OidcTeamMapping.create({ id: "mapping-admin", groupName: "admins", role: "administrator", teamId: null });
    await db.orm.public.OidcTeamMapping.create({ id: "mapping-member", groupName: "guests", role: "member", teamId: null });
    await user("sso");
    await applyOidcTeamMappings("sso", ["guests", "admins"], db);
    assert.equal((await users.first({ id: "sso" }))?.role, "administrator");
    assert.deepEqual((await resolveRoles(["sso"], db)).get("sso")?.source, { kind: "user", via: "oidc" });
    await applyOidcTeamMappings("sso", ["guests"], db);
    assert.equal((await users.first({ id: "sso" }))?.role, "member");
    await setUserRole("sso", "administrator", db);
    await applyOidcTeamMappings("sso", ["guests"], db);
    assert.equal((await users.first({ id: "sso" }))?.role, "administrator");
    assert.deepEqual((await resolveRoles(["sso"], db)).get("sso")?.source, { kind: "user", via: "admin" });

    // headers を渡さないサーバー呼び出しでチームを削除し、所属とマッピングも消えることを確認する。
    await testAuth.api.removeTeam({ body: { teamId: team.id, organizationId: (await db.orm.public.AuthTeam.first({ id: team.id }))!.organizationId } });
    assert.equal(await db.orm.public.AuthTeam.first({ id: team.id }), null);
    assert.equal((await db.orm.public.AuthTeamMember.where({ teamId: team.id }).all()).length, 0);
    assert.equal((await db.orm.public.OidcTeamMapping.where({ teamId: team.id }).all()).length, 0);
    assert.equal((await db.orm.public.TeamRole.where({ teamId: team.id }).all()).length, 0);
    await syncUserRoles(["first", "later", "oidc"], db);
    assert.equal((await users.first({ id: "later" }))?.role, "member");
    assert.equal((await db.orm.public.AuthTeam.all()).length, 2);
    await assert.rejects(testAuth.api.removeTeam({ body: { teamId: team.id, organizationId: "missing" } }));
    // allowRemovingAllTeams により最後のチームも削除できる。
    for (const remaining of await db.orm.public.AuthTeam.select("id", "organizationId").all()) {
      await testAuth.api.removeTeam({ body: { teamId: remaining.id, organizationId: remaining.organizationId } });
    }
    assert.equal((await db.orm.public.AuthTeam.all()).length, 0);

    // 同時の初回アクセスでも同じ UUID の行は一つだけ。
    const deviceId = "12345678-1234-4234-8234-123456789abc";
    await Promise.all([touchKioskDevice(deviceId, db), touchKioskDevice(deviceId, db)]);
    assert.equal((await listKiosks(db)).length, 1);
    assert.ok(await updateKiosk({ deviceId, name: "受付タブレット", location: "1F" }, db));
    const [registered] = await listKiosks(db);
    assert.equal(registered?.name, "受付タブレット");
    assert.equal(registered?.location, "1F");
    assert.equal(registered?.enabled, true);
    assert.equal(registered?.online, true);
    // 訪問すると在席になり、見守り・通話の相手として選べる。
    assert.equal((await touchKioskDevice("12345678-1234-4234-8234-123456789abc", db))?.name, "受付タブレット");
    assert.deepEqual((await listOnlineKioskDevices(db)).map(device => device.id), ["12345678-1234-4234-8234-123456789abc"]);
    assert.equal((await listKiosks(db))[0]?.online, true);
    // 無効にすると訪問しても認識せず、一覧からも消える。
    assert.equal(await setKioskEnabled("12345678-1234-4234-8234-123456789abc", false, db), true);
    assert.equal(await touchKioskDevice("12345678-1234-4234-8234-123456789abc", db), null);
    assert.equal((await listOnlineKioskDevices(db)).length, 0);
    assert.equal((await listKiosks(db))[0]?.enabled, false);
    assert.equal(await setKioskEnabled("12345678-1234-4234-8234-123456789abc", true, db), true);
    assert.equal(await deleteKiosk("12345678-1234-4234-8234-123456789abc", db), true);
    assert.equal((await listKiosks(db)).length, 0);
    assert.equal(await deleteKiosk("12345678-1234-4234-8234-123456789abc", db), false);
    assert.equal(await setKioskEnabled("12345678-1234-4234-8234-123456789abc", true, db), false);

  } finally {
    await db.close(); await pool.end();
    await control.query(`DROP DATABASE IF EXISTS "${database}"`);
    await control.end();
    await applicationDb.close(); await authPool.end();
  }
});
