import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { isTrustedOrigin, trustedOriginHosts, trustedOrigins } from "../lib/trusted-origins";

const previous = { auth: process.env.BETTER_AUTH_URL, extra: process.env.CHAHUB_TRUSTED_ORIGINS };
const restore = (key: "BETTER_AUTH_URL" | "CHAHUB_TRUSTED_ORIGINS", value: string | undefined) => {
  if (value === undefined) delete process.env[key]; else process.env[key] = value;
};
afterEach(() => {
  restore("BETTER_AUTH_URL", previous.auth);
  restore("CHAHUB_TRUSTED_ORIGINS", previous.extra);
});

test("既定では BETTER_AUTH_URL のオリジンだけを信頼する", () => {
  process.env.BETTER_AUTH_URL = "https://chahub.example.com";
  delete process.env.CHAHUB_TRUSTED_ORIGINS;
  assert.deepEqual(trustedOrigins(), ["https://chahub.example.com"]);
  assert.equal(isTrustedOrigin("https://chahub.example.com"), true);
  assert.equal(isTrustedOrigin("https://other.example.com"), false);
  assert.equal(isTrustedOrigin(null), false);
  assert.equal(isTrustedOrigin(""), false);
});

test("CHAHUB_TRUSTED_ORIGINS で開発機の LAN オリジンを足せる", () => {
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.CHAHUB_TRUSTED_ORIGINS = "http://172.16.11.21:3000, http://192.168.1.20:3000";
  assert.deepEqual(trustedOrigins(), ["http://localhost:3000", "http://172.16.11.21:3000", "http://192.168.1.20:3000"]);
  assert.equal(isTrustedOrigin("http://172.16.11.21:3000"), true);
});

test("パスやゴミが混ざってもオリジンだけに正規化し、重複と不正値を落とす", () => {
  process.env.BETTER_AUTH_URL = "http://localhost:3000/";
  process.env.CHAHUB_TRUSTED_ORIGINS = "http://localhost:3000/kiosk-connect,,not a url";
  assert.deepEqual(trustedOrigins(), ["http://localhost:3000"]);
  assert.deepEqual(trustedOriginHosts(), ["localhost"]);
});

test("何も設定されていなければ何も信頼しない", () => {
  delete process.env.BETTER_AUTH_URL;
  delete process.env.CHAHUB_TRUSTED_ORIGINS;
  assert.deepEqual(trustedOrigins(), []);
  assert.equal(isTrustedOrigin("https://chahub.example.com"), false);
});
