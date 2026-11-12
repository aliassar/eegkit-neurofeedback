import { describe, expect, it } from "vitest";
import {
  createFocusMeter,
  FINISH_BONUS,
  stepFocus,
  summarizeRound,
  totalRounds,
} from "../src/lib/focus-meter";

const opts = { threshold: 0.6, secondsPerStar: 2 };

function run(scores: number[], dt = 0.25) {
  const meter = createFocusMeter();
  let earned = 0;
  for (const s of scores) earned += stepFocus(meter, dt, s, opts);
  return { meter, earned };
}

describe("focus meter", () => {
  it("counts focused time, stars and the longest streak", () => {
    // 3 s focused, 1 s not, 1 s focused.
    const scores = [...Array(12).fill(0.8), ...Array(4).fill(0.3), ...Array(4).fill(0.7)];
    const { meter, earned } = run(scores);
    expect(meter.elapsed).toBeCloseTo(5);
    expect(meter.focused).toBeCloseTo(4);
    expect(meter.longestStreak).toBeCloseTo(3);
    expect(meter.streak).toBeCloseTo(1);
    expect(earned).toBe(2); // 4 s focused at 2 s per star
    expect(meter.stars).toBe(2);
    expect(meter.progress).toBeCloseTo(0);
  });

  it("ignores non-finite scores and empty steps", () => {
    const meter = createFocusMeter();
    expect(stepFocus(meter, 0.25, Number.NaN, opts)).toBe(0);
    expect(stepFocus(meter, 0, 0.9, opts)).toBe(0);
    expect(meter.elapsed).toBe(0);
  });

  it("keeps a per-second series, splitting steps across seconds", () => {
    const { meter } = run([0.2, 0.2, 0.2, 0.2, 1, 1, 1, 1], 0.25);
    expect(meter.series).toEqual([0.2, 1]);
    const odd = createFocusMeter();
    stepFocus(odd, 0.6, 0, opts);
    stepFocus(odd, 0.6, 1, opts);
    expect(odd.series).toEqual([0.4]);
  });

  it("summarises a round, adding the finishing bonus only when finished", () => {
    const { meter } = run([...Array(8).fill(1), ...Array(8).fill(0)]);
    const done = summarizeRound(meter, true);
    expect(done).toMatchObject({
      durationSeconds: 4,
      focusedFraction: 0.5,
      longestStreakSeconds: 2,
      stars: 1 + FINISH_BONUS,
    });
    expect(done.meanScore).toBeCloseTo(0.5);
    expect(summarizeRound(meter, false).stars).toBe(1);
    expect(summarizeRound(createFocusMeter(), false).meanScore).toBeNaN();
  });

  it("totals rounds weighted by duration", () => {
    const a = {
      durationSeconds: 60,
      focusedFraction: 0.5,
      longestStreakSeconds: 10,
      meanScore: 0.6,
      stars: 4,
      series: [],
    };
    const b = {
      durationSeconds: 30,
      focusedFraction: 0.2,
      longestStreakSeconds: 25,
      meanScore: 0.3,
      stars: 1,
      series: [],
    };
    const t = totalRounds([a, b]);
    expect(t.durationSeconds).toBe(90);
    expect(t.focusedFraction).toBeCloseTo(0.4);
    expect(t.meanScore).toBeCloseTo(0.5);
    expect(t.longestStreakSeconds).toBe(25);
    expect(t.stars).toBe(5);
  });
});
