import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createRoomSchema,
  joinRoomSchema,
  addQueueItemSchema,
} from "../src/lib/validations/index.ts";

describe("Zod Validations", () => {
  it("validates room creation payload and applies defaults", () => {
    const valid = createRoomSchema.parse({ name: "Party Room" });
    assert.strictEqual(valid.name, "Party Room");
    assert.strictEqual(valid.maxGuests, 12);
    assert.strictEqual(valid.settings.maxSongsPerGuest, 3);
    assert.strictEqual(valid.settings.allowGuestReorder, true);

    assert.throws(() => createRoomSchema.parse({ name: "" }));
  });

  it("validates and transforms room keys", () => {
    const valid = joinRoomSchema.parse({ roomKey: "abc234", nickname: "Singer" });
    assert.strictEqual(valid.roomKey, "ABC234");
    assert.strictEqual(valid.nickname, "Singer");

    // Invalid length
    assert.throws(() => joinRoomSchema.parse({ roomKey: "ABC", nickname: "Singer" }));
  });

  it("validates queue item schema", () => {
    const valid = addQueueItemSchema.parse({
      videoId: "dQw4w9WgXcQ",
      title: "Never Gonna Give You Up",
      durationSeconds: 213,
    });
    assert.strictEqual(valid.videoId, "dQw4w9WgXcQ");
    assert.strictEqual(valid.durationSeconds, 213);
  });
});
