import { describe, expect, it } from "vitest";
import { celebrationMessage, earnedBadges, newBadges, totalStars } from "../src/lib/rewards";
import { round, session } from "./fixtures";

describe("rewards", () => {
  it("counts stars over every round", () => {
    expect(
      totalStars([session(), session({ rounds: [round({ stars: 2 }), round({ stars: 3 })] })]),
    ).toBe(13);
  });

  it("awards badges for practice, not for scores", () => {
    expect(earnedBadges([])).toEqual([]);
    const low = session({ rounds: [round({ focusedFraction: 0, meanScore: 0.1, stars: 1 })] });
    expect(earnedBadges([low]).map((b) => b.id)).toEqual(["first", "game-balloon"]);
    const many = Array.from({ length: 10 }, (_, i) =>
      session({ id: `s${i}`, game: i % 2 ? "garden" : "river" }),
    );
    expect(earnedBadges(many).map((b) => b.id)).toEqual([
      "first",
      "game-garden",
      "game-river",
      "five",
      "ten",
      "stars-50",
    ]);
  });

  it("finds newly earned badges", () => {
    const before = earnedBadges([session()]);
    const after = earnedBadges([session(), session({ id: "s2", game: "garden" })]);
    expect(newBadges(before, after).map((b) => b.id)).toEqual(["game-garden"]);
  });

  it("always has something kind to say", () => {
    expect(celebrationMessage(0, 3)).toMatch(/Thanks for trying/);
    for (let seed = 0; seed < 8; seed++)
      expect(celebrationMessage(2, seed).length).toBeGreaterThan(5);
  });
});
