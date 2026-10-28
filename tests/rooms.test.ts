import { describe, it } from "node:test";
import assert from "node:assert";
import { generateRoomKey } from "../src/server/core/rooms.ts";

describe("Rooms Core", () => {
  it("generates 6-character room keys using CSPRNG charset", () => {
    const key = generateRoomKey();
    assert.strictEqual(key.length, 6);
    assert.match(key, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    // Ensure no ambiguous characters (0, O, 1, I)
    assert.doesNotMatch(key, /[01OI]/);
  });

  it("generates unique keys across multiple generations", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i++) {
      keys.add(generateRoomKey());
    }
    assert.strictEqual(keys.size, 50);
  });
});
