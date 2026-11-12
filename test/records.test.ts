import { describe, expect, it } from "vitest";
import { parseFocusChecks, parseSessions } from "../src/lib/records";
import { check, round, session } from "./fixtures";

describe("parseSessions", () => {
  it("round-trips through JSON, newest first, with NaN restored from null", () => {
    const older = session({ id: "old", startedAt: "2026-11-01T10:00:00.000Z" });
    const newer = session({ id: "new", rounds: [round({ meanScore: Number.NaN })] });
    const parsed = parseSessions(JSON.stringify([older, newer]));
    expect(parsed.map((s) => s.id)).toEqual(["new", "old"]);
    expect(parsed[0]?.rounds[0]?.meanScore).toBeNaN();
    expect(parsed[1]).toEqual(older);
  });

  it("drops malformed sessions and rounds", () => {
    const bad = [
      session({ id: "x", game: "chess" as never }),
      session({ id: "y", protocol: "magic" as never }),
      session({ id: "z", startedAt: "yesterday" }),
      { ...session({ id: "w" }), rounds: [{ nope: 1 }] },
      null,
      7,
    ];
    expect(parseSessions(JSON.stringify(bad))).toEqual([]);
    expect(parseSessions("not json")).toEqual([]);
  });
});

describe("parseFocusChecks", () => {
  it("round-trips and keeps missing EEG as NaN / null", () => {
    const noEeg = check({ id: "c2", protocol: null, source: null, eegMetric: Number.NaN });
    const parsed = parseFocusChecks(JSON.stringify([check(), noEeg]));
    expect(parsed).toHaveLength(2);
    const restored = parsed.find((c) => c.id === "c2");
    expect(restored?.protocol).toBeNull();
    expect(restored?.eegMetric).toBeNaN();
    expect(parsed.find((c) => c.id === "c1")).toEqual(check());
  });

  it("drops entries without counts", () => {
    expect(parseFocusChecks(JSON.stringify([{ id: "c", profileId: "p" }]))).toEqual([]);
  });
});
