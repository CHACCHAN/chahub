import { afterEach, expect, test } from "bun:test";
import { connectKiosk, getOrCreateKioskId, isFreeKiosk } from "../features/kiosk/browser";
import { isKioskId, KIOSK_STORAGE_KEY } from "../features/kiosk/identity";

const originalFetch = globalThis.fetch;
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

test("ローカル API の成功応答のみをキオスクとして判定する", async () => {
  globalThis.fetch = (async (url, options) => {
    expect(url).toBe("http://127.0.0.1:8080/api/status");
    expect(options?.cache).toBe("no-store");
    return new Response("{}", { status: 200 });
  });
  expect(await isFreeKiosk()).toBe(true);
  globalThis.fetch = (async () => new Response(null, { status: 401 }));
  expect(await isFreeKiosk()).toBe(false);
  globalThis.fetch = (async () => { throw new TypeError("network/CORS/timeout"); });
  expect(await isFreeKiosk()).toBe(false);
});

test("UUID を保存し、再接続時に再利用する。不正な保存値は置き換える", () => {
  const data = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  } });
  const id = getOrCreateKioskId();
  expect(isKioskId(id)).toBe(true);
  expect(data.get(KIOSK_STORAGE_KEY)).toBe(id);
  expect(getOrCreateKioskId()).toBe(id);
  data.set(KIOSK_STORAGE_KEY, "old-id");
  expect(getOrCreateKioskId()).not.toBe(id);
  expect(isKioskId(data.get(KIOSK_STORAGE_KEY))).toBe(true);
});

test("ストレージに保存できなければ UUID を返さない", () => {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: () => null, setItem: () => { throw new Error("storage blocked"); },
  } });
  expect(() => getOrCreateKioskId()).toThrow("storage blocked");
});

test("無効端末と登録 API の失敗を呼び出し元に通知する", async () => {
  globalThis.fetch = (async () => Response.json({ registered: false }));
  await expect(connectKiosk(crypto.randomUUID())).rejects.toThrow("無効");
  globalThis.fetch = (async () => Response.json({ error: "DB error" }, { status: 500 }));
  await expect(connectKiosk(crypto.randomUUID())).rejects.toThrow("DB error");
});
