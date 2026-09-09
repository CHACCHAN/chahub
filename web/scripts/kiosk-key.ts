import "dotenv/config";
import { auth, authPool } from "../lib/better-auth/auth";

// Run only on a trusted server. The raw key is shown once.
try {
  const userId = process.argv[2];
  if (!userId) throw new Error("Usage: bun run auth:kiosk-key <auth_user.id>");
  const result = await auth.api.createApiKey({
    body: { userId, name: "kiosk", expiresIn: 60 * 60 * 24 * 30 },
  });
  console.log(result.key);
} finally {
  await authPool.end();
}
