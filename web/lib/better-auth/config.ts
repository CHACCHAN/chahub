import type { BetterAuthOptions } from "better-auth";
import { Pool } from "pg";
import { admin, genericOAuth, organization } from "better-auth/plugins";
import { captureOidcGroups, getOidcGroups } from "./oidc-context";
import { applyOidcTeamMappings } from "@/features/admin/oidc-mapping";
import { roles } from "./roles";
import { nextCookies } from "better-auth/next-js";
import { trustedOrigins } from "../trusted-origins";

export const authPool = new Pool({ connectionString: process.env.DATABASE_URL })
export const authOptions = {
  database: authPool,
  // 既定は BETTER_AUTH_URL のオリジンだけ。開発機の LAN IP などは CHAHUB_TRUSTED_ORIGINS で足す。
  trustedOrigins: trustedOrigins(),
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

