import type { ChannelResult, PipelineResult } from "eegkit";
import { describe, expect, it } from "vitest";
import {
  ANALYSIS_BANDS,
  getProtocol,
  PROTOCOLS,
  type Protocol,
  protocolMetric,
  standardRelativePowers,
} from "../src/lib/protocols";

function channel(
  bandPower: Record<string, number>,
  level: "good" | "fair" | "poor" = "good",
  artifact = false,
): ChannelResult {
  return {
    label: "ch",
    bandPower,
    relativeBandPower: {},
    peakAlpha: 10,
    spectrum: {} as never,
    quality: {
      score: level === "poor" ? 0.1 : 0.9,
      level,
      flatline: false,
      clipped: 0,
      peakToPeak: 50,
      lineNoiseRatio: 0,
      artifact,
    },
  };
}

function byId(id: string): Protocol {
  const protocol = getProtocol(id);
  if (!protocol) throw new Error(`no protocol ${id}`);
  return protocol;
}

const result = (...channels: ChannelResult[]): PipelineResult => ({ index: 0, time: 2, channels });
const powers = { delta: 4, theta: 4, alpha: 8, beta: 2, gamma: 2, smr: 1 };

describe("protocols", () => {
  it("have unique ids, Theta/Beta first, and can be looked up", () => {
    expect(new Set(PROTOCOLS.map((p) => p.id)).size).toBe(PROTOCOLS.length);
    expect(PROTOCOLS[0]?.id).toBe("tbr");
    expect(byId("tbr").direction).toBe("down");
    expect(byId("smr").direction).toBe("up");
    expect(byId("engagement").direction).toBe("up");
    expect(getProtocol("nope")).toBeUndefined();
  });

  it("measure an SMR band as well as the standard ones", () => {
    expect(ANALYSIS_BANDS.map((b) => b.name)).toEqual([
      "delta",
      "theta",
      "alpha",
      "beta",
      "gamma",
      "smr",
    ]);
  });

  it("compute their metrics from absolute band powers", () => {
    const r = result(channel(powers));
    expect(protocolMetric(byId("tbr"), r)).toBeCloseTo(4 / 2); // theta / beta
    expect(protocolMetric(byId("smr"), r)).toBeCloseTo(1 / 4); // smr / theta
    expect(protocolMetric(byId("engagement"), r)).toBeCloseTo(2 / (8 + 4)); // beta / (alpha + theta)
  });

  it("averages powers across clean channels before taking ratios", () => {
    const r = result(channel({ ...powers, theta: 2 }), channel({ ...powers, theta: 6 }));
    expect(protocolMetric(byId("tbr"), r)).toBeCloseTo(4 / 2);
  });

  it("skips windows with artifacts such as blinks", () => {
    const blink = channel({ ...powers, delta: 400, theta: 40 }, "fair", true);
    expect(protocolMetric(byId("tbr"), result(channel(powers), blink))).toBeCloseTo(2);
    expect(protocolMetric(byId("tbr"), result(blink))).toBeNaN();
  });

  it("leaves poor channels out, and gives NaN when none is usable", () => {
    const loose = channel({ ...powers, beta: 100 }, "poor");
    expect(protocolMetric(byId("engagement"), result(channel(powers), loose))).toBeCloseTo(2 / 12);
    expect(protocolMetric(byId("engagement"), result(loose))).toBeNaN();
  });
});

describe("standardRelativePowers", () => {
  it("normalises over the five standard bands, ignoring the overlapping SMR band", () => {
    const relative = standardRelativePowers(powers);
    expect(relative.alpha).toBeCloseTo(8 / 20);
    expect(relative.smr).toBeUndefined();
    const sum = ["delta", "theta", "alpha", "beta", "gamma"].reduce(
      (a, b) => a + (relative[b] as number),
      0,
    );
    expect(sum).toBeCloseTo(1);
  });

  it("gives NaN without any power", () => {
    expect(standardRelativePowers({}).alpha).toBeNaN();
  });
});
