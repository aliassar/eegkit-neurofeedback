import { describe, expect, it } from "vitest";
import {
  ANTICIPATION_MS,
  makePlan,
  scoreFocusCheck,
  type TrialResult,
} from "../src/lib/focus-check";

describe("makePlan", () => {
  it("is deterministic and follows the rules", () => {
    const plan = makePlan(42);
    expect(makePlan(42)).toEqual(plan);
    expect(plan.trials).toHaveLength(60);
    expect(plan.trials.filter((t) => t === "nogo")).toHaveLength(15);
    expect(plan.trials.slice(0, 3)).toEqual(["go", "go", "go"]);
    for (let i = 1; i < plan.trials.length; i++) {
      expect(plan.trials[i] === "nogo" && plan.trials[i - 1] === "nogo").toBe(false);
    }
    for (const gap of plan.gapsMs) {
      expect(gap).toBeGreaterThanOrEqual(1000);
      expect(gap).toBeLessThanOrEqual(1600);
    }
    expect(makePlan(7).trials).not.toEqual(plan.trials);
  });
});

describe("scoreFocusCheck", () => {
  it("counts hits, omissions and commissions, and reaction-time stats", () => {
    const results: TrialResult[] = [
      { kind: "go", rtMs: 400 },
      { kind: "go", rtMs: 600 },
      { kind: "go", rtMs: null },
      { kind: "go", rtMs: ANTICIPATION_MS - 50 }, // a hit, but too fast to count for RT
      { kind: "nogo", rtMs: 350 },
      { kind: "nogo", rtMs: null },
    ];
    expect(scoreFocusCheck(results)).toEqual({
      goTrials: 4,
      noGoTrials: 2,
      hits: 3,
      omissions: 1,
      commissions: 1,
      meanRtMs: 500,
      rtSdMs: 141,
    });
  });

  it("gives NaN reaction times without hits", () => {
    const score = scoreFocusCheck([{ kind: "go", rtMs: null }]);
    expect(score.meanRtMs).toBeNaN();
    expect(score.rtSdMs).toBeNaN();
  });
});
