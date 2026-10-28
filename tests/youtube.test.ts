import { describe, it } from "node:test";
import assert from "node:assert";
import { parseIsoDuration, isChannelVerified } from "../src/server/core/youtube.ts";
import { recordQuotaUsage, isQuotaResting, getQuotaStats } from "../src/server/core/quotaGuard.ts";

describe("YouTube Core & Quota Guard", () => {
  it("parses ISO 8601 durations correctly", () => {
    assert.deepStrictEqual(parseIsoDuration("PT3M45S"), { seconds: 225, formatted: "3:45" });
    assert.deepStrictEqual(parseIsoDuration("PT1H2M3S"), { seconds: 3723, formatted: "1:02:03" });
    assert.deepStrictEqual(parseIsoDuration("PT45S"), { seconds: 45, formatted: "0:45" });
    assert.deepStrictEqual(parseIsoDuration("PT4M"), { seconds: 240, formatted: "4:00" });
  });

  it("identifies allowlisted karaoke channels", () => {
    assert.strictEqual(isChannelVerified("Sing King Karaoke"), true);
    assert.strictEqual(isChannelVerified("KaraFun Official"), true);
    assert.strictEqual(isChannelVerified("Sing2Music Tracks"), true);
    assert.strictEqual(isChannelVerified("Random Guy Uploads"), false);
  });

  it("tracks quota usage and triggers resting mode near 90%", () => {
    recordQuotaUsage(100);
    assert.strictEqual(isQuotaResting(), false);

    recordQuotaUsage(8950);
    assert.strictEqual(isQuotaResting(), true);

    const stats = getQuotaStats();
    assert.strictEqual(stats.isResting, true);
    assert.ok(stats.unitsUsed >= 9000);
  });
});
