import { describe, expect, it } from "vitest";
import {
  AVATAR_COUNT,
  createProfile,
  DEFAULT_PLAN,
  parseProfiles,
  validateName,
} from "../src/lib/profiles";

describe("profiles", () => {
  it("validates names", () => {
    expect(validateName("Sam")).toBeNull();
    expect(validateName("   ")).toMatch(/Enter/);
    expect(validateName("x".repeat(21))).toMatch(/At most/);
  });

  it("creates a profile with the default plan", () => {
    const p = createProfile("  Mia ", AVATAR_COUNT + 2, new Date("2026-11-12T10:00:00Z"), "id-1");
    expect(p).toEqual({
      id: "id-1",
      name: "Mia",
      avatar: 2,
      ...DEFAULT_PLAN,
      createdAt: "2026-11-12T10:00:00.000Z",
    });
    expect(DEFAULT_PLAN.protocol).toBe("tbr");
  });

  it("parses stored profiles, fixing bad plan fields and dropping bad entries", () => {
    const stored = JSON.stringify([
      {
        id: "a",
        name: "Ana",
        avatar: 3,
        protocol: "smr",
        rounds: 3,
        roundSeconds: 90,
        baselineSeconds: 20,
        createdAt: "2026-11-01T00:00:00Z",
      },
      { id: "b", name: "Ben", avatar: -1, protocol: "telepathy", rounds: 99, roundSeconds: 7 },
      { id: "a", name: "Duplicate" },
      { id: "c", name: "" },
      { name: "No id" },
      null,
    ]);
    const profiles = parseProfiles(stored);
    expect(profiles.map((p) => p.id)).toEqual(["a", "b"]);
    expect(profiles[0]).toMatchObject({ protocol: "smr", rounds: 3, roundSeconds: 90 });
    expect(profiles[1]).toMatchObject({ avatar: 0, ...DEFAULT_PLAN });
  });

  it("survives broken JSON", () => {
    expect(parseProfiles("{")).toEqual([]);
    expect(parseProfiles(null)).toEqual([]);
    expect(parseProfiles("{}")).toEqual([]);
  });
});
