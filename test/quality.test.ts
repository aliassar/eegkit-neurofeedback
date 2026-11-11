import type { ChannelQuality, ChannelResult, PipelineResult } from "eegkit";
import { describe, expect, it } from "vitest";
import { describeQuality, meanPeakAlpha, qualityGate } from "../src/lib/quality";

const clean: ChannelQuality = {
  score: 0.95,
  level: "good",
  flatline: false,
  clipped: 0,
  peakToPeak: 60,
  lineNoiseRatio: 0.01,
  artifact: false,
};

function channel(label: string, quality: Partial<ChannelQuality>, peakAlpha = 10): ChannelResult {
  return {
    label,
    bandPower: { alpha: 1 },
    relativeBandPower: { alpha: 1 },
    peakAlpha,
    spectrum: { frequencies: new Float64Array(0), power: new Float64Array(0) } as never,
    quality: { ...clean, ...quality },
  };
}

const result = (...channels: ChannelResult[]): PipelineResult => ({ index: 0, time: 2, channels });

describe("describeQuality", () => {
  it("calls a good window clean", () => {
    expect(describeQuality(clean)).toEqual({ level: "good", reasons: [], summary: "Clean" });
  });

  it("names every problem, flatline alone", () => {
    expect(
      describeQuality({ ...clean, level: "poor", flatline: true, clipped: 0.5 }).reasons,
    ).toEqual(["Flatline"]);
    expect(
      describeQuality({
        ...clean,
        level: "poor",
        clipped: 0.02,
        artifact: true,
        lineNoiseRatio: 0.3,
      }).summary,
    ).toBe("Clipping · Artifact · Line noise");
  });

  it("ignores line noise below eegkit's tolerance", () => {
    expect(describeQuality({ ...clean, lineNoiseRatio: 0.08 }).reasons).toEqual([]);
  });

  it("handles a missing assessment", () => {
    expect(describeQuality(undefined).level).toBe("unknown");
  });
});

describe("qualityGate", () => {
  it("waits for the first window", () => {
    expect(qualityGate(undefined).status).toBe("waiting");
  });

  it("is ready while at least one channel is usable", () => {
    const gate = qualityGate(result(channel("Fz", {}), channel("Cz", { level: "poor" })));
    expect(gate).toMatchObject({ status: "ready", usable: 1, total: 2 });
    expect(gate.message).toMatch(/1 of 2/);
  });

  it("blocks when every channel is poor", () => {
    expect(qualityGate(result(channel("Fz", { level: "poor" }))).status).toBe("blocked");
  });
});

describe("meanPeakAlpha", () => {
  it("averages the channels that found a peak", () => {
    expect(
      meanPeakAlpha(
        result(channel("a", {}, 10), channel("b", {}, Number.NaN), channel("c", {}, 11)),
      ),
    ).toBe(10.5);
    expect(meanPeakAlpha(result(channel("a", {}, Number.NaN)))).toBeNaN();
  });
});
