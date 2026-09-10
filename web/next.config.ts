import "dotenv/config";
import type { NextConfig } from "next";
import { trustedOriginHosts } from "./lib/trusted-origins";

const nextConfig: NextConfig = {
  // 開発サーバーへ localhost 以外(LAN の IP など)からアクセスするときの許可ホスト。
  // BETTER_AUTH_URL と CHAHUB_TRUSTED_ORIGINS から導出する。
  allowedDevOrigins: trustedOriginHosts(),
};

export default nextConfig;
