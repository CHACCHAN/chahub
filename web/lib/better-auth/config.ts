import type { BetterAuthOptions } from "better-auth";
import { Pool } from "pg";
import { admin, genericOAuth, organization } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { captureOidcGroups, getOidcGroups } from "./oidc-context";
import { applyOidcTeamMappings } from "../admin/oidc-mapping";
import { roles } from "./roles";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

export const authPool = new Pool({ connectionString: process.env.DATABASE_URL })
export const authOptions = {
  database: authPool,
  user: { modelName: "auth_user" },
  session: { modelName: "auth_session", cookieCache: { enabled: false } },
  account: { modelName: "auth_account" },
  verification: { modelName: "auth_verification" },

  databaseHooks: {
    session: { create: { before: async (session) => {
      const groups = getOidcGroups();
      if (groups) await applyOidcTeamMappings(session.userId, groups);
      return { data: session };
    } } },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/admin/") && ctx.headers?.has("x-api-key")) {
        throw new APIError("FORBIDDEN", { message: "Admin operations require a browser session." });
      }
    }),
  },
  plugins: [
    admin({ roles, defaultRole: "member", adminRoles: ["administrator"] }),
    // 通常ログイン
    genericOAuth({
      config: [
        {
          providerId: "authentik",
          clientId: process.env.AUTHENTIK_CLIENT_ID!,
          clientSecret: process.env.AUTHENTIK_CLIENT_SECRET!,
          discoveryUrl: process.env.AUTHENTIK_DISCOVERY_URL!,
          scopes: ["openid", "profile", "email"],
          mapProfileToUser(profile) {
            captureOidcGroups(profile[process.env.AUTHENTIK_GROUPS_CLAIM || "groups"]);
            return {};
          },
        }
      ]
    }),
    // キオスク端末ログイン
    apiKey({
      enableSessionForAPIKeys: true,
      schema: { apikey: { modelName: "auth_apikey" } },
      rateLimit: { enabled: true, timeWindow: 60 * 60 * 1000, maxRequests: 1000 },
    }),
    // チームを扱う
    organization({
      schema: {
        organization: { modelName: "auth_organization" },
        member: { modelName: "auth_member" },
        invitation: { modelName: "auth_invitation" },
        team: { modelName: "auth_team" },
        teamMember: { modelName: "auth_team_member" },
      },
      teams: {
        enabled: true,
        // 管理画面から最後のチームも削除できるようにする。
        allowRemovingAllTeams: true,
      },
    }),
    nextCookies(),
  ]
} satisfies BetterAuthOptions

