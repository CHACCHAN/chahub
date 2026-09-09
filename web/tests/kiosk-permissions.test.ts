import { test } from "node:test";
import assert from "node:assert/strict";
import { AccessToken, TrackSource } from "livekit-server-sdk";
import { kioskGrant } from "../lib/livekit/permissions";

test("一般端末は見守りと音声だけを利用でき、配信元やビデオ通話を偽装できない", () => {
  assert.equal(kioskGrant("host", "device", "user", false), null);
  assert.equal(kioskGrant("host", "user", "user", false), null);
  assert.equal(kioskGrant("call", "device", "user", false), null);
  const grant = kioskGrant("watch", "device", "user", false)!;
  assert.deepEqual(grant.canPublishSources, [TrackSource.MICROPHONE]);
  assert.equal(grant.room, "kiosk-device");
  assert.equal(grant.canPublishData, false);
});

test("キオスクは自端末のみをホストし、他端末に映像と音声を送信できる", () => {
  assert.equal(kioskGrant("host", "other", "device", true), null);
  assert.equal(kioskGrant("call", "device", "device", true), null);
  assert.deepEqual(kioskGrant("host", "device", "device", true)?.canPublishSources, [TrackSource.CAMERA, TrackSource.MICROPHONE]);
  assert.deepEqual(kioskGrant("call", "other", "device", true)?.canPublishSources, [TrackSource.CAMERA, TrackSource.MICROPHONE]);
});

test("発行するJWTは接続先のルームと音声送信に限定される", async () => {
  const token = new AccessToken("test-key", "test-secret-at-least-32-characters", { identity: "viewer", ttl: "10m" });
  token.addGrant(kioskGrant("watch", "device", "user", false)!);
  const payload = JSON.parse(Buffer.from((await token.toJwt()).split(".")[1], "base64url").toString());
  assert.equal(payload.video.room, "kiosk-device");
  assert.deepEqual(payload.video.canPublishSources, ["microphone"]);
  assert.equal(payload.video.roomAdmin, undefined);
  assert.ok(payload.exp - payload.nbf <= 600);
});
