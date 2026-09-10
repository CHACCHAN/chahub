import { beforeEach, afterAll, mock, test, expect } from "bun:test";

const writes = [];
const touched = [];
// undefined の間は実装に委譲する。bun のモジュールモックは他のテストにも見えるため、
// 差し替えるのはこのファイルのテストが stub を置いている間だけにする。
let stub;

const previousUrl = process.env.BETTER_AUTH_URL;
process.env.BETTER_AUTH_URL = "https://chahub.example.com";
mock.module("next/headers", () => ({ cookies: async () => ({
  set: (...args) => writes.push(args), delete: name => writes.push([name]), get: () => undefined,
}) }));
// モックを適用すると同じ束縛が差し替わるので、実体は適用前に控えておく。
const original = { ...await import("../features/kiosk/device") };
mock.module("@/features/kiosk/device", () => ({
  ...original,
  touchKioskDevice: async (deviceId, client) => {
    if (stub === undefined) return original.touchKioskDevice(deviceId, client);
    touched.push(deviceId);
    return stub;
  },
}));
const { POST } = await import("../app/api/kiosk/session/route");

beforeEach(() => { writes.length = 0; touched.length = 0; stub = null; });
afterAll(() => {
  stub = undefined;
  if (previousUrl === undefined) delete process.env.BETTER_AUTH_URL; else process.env.BETTER_AUTH_URL = previousUrl;
});

const request = (body, headers = {}) => new Request("https://chahub.example.com/api/kiosk/session", {
  method: "POST", headers: { origin: "https://chahub.example.com", "content-type": "application/json", ...headers },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const cookie = ["chahub.kiosk-device", "12345678-1234-4234-8234-123456789abc", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 365 * 24 * 60 * 60 }];

test("登録済みの端末には HttpOnly・Secure・SameSite の永続 Cookie を発行する", async () => {
  stub = { deviceId: "12345678-1234-4234-8234-123456789abc", name: "受付タブレット" };
  const response = await POST(request({ deviceId: " 12345678-1234-4234-8234-123456789abc " }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ registered: true, name: "受付タブレット" });
  expect(writes).toEqual([cookie]);
  expect(touched).toEqual(["12345678-1234-4234-8234-123456789abc"]);
});
test("無効の端末には Cookie を発行せず、既存 Cookie を削除する", async () => {
  const response = await POST(request({ deviceId: "12345678-1234-4234-8234-123456789abd" }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ registered: false });
  expect(writes).toEqual([["chahub.kiosk-device"]]);
  expect(touched).toEqual(["12345678-1234-4234-8234-123456789abd"]);
});
test("端末 ID が読めなければ照合せず 400 を返す", async () => {
  expect((await POST(request({ deviceId: "   " }))).status).toBe(400);
  expect((await POST(request({ deviceId: 12345 }))).status).toBe(400);
  expect((await POST(request({ deviceId: "a".repeat(201) }))).status).toBe(400);
  expect((await POST(request({ deviceId: "legacy-device" }))).status).toBe(400);
  expect((await POST(request({}))).status).toBe(400);
  expect((await POST(request())).status).toBe(400);
  expect(touched).toEqual([]);
  expect(writes).toEqual([]);
});
test("信頼していないオリジンからは照合させない", async () => {
  const response = await POST(request({ deviceId: "12345678-1234-4234-8234-123456789abc" }, { origin: "https://other.example.com" }));
  expect(response.status).toBe(403);
  expect(touched).toEqual([]);
  expect(writes).toEqual([]);
});
