import type { ChannelResult, PipelineResult } from "eegkit";
import { describe, expect, it } from "vitest";
import { getProtocol, PROTOCOLS, type Protocol, protocolMetric } from "../src/lib/protocols";

function channel(
  bandPower: Record<string, number>,
  level: "good" | "fair" | "poor" = "good",
  artifact = false,
): ChannelResult {
  const total = Object.values(bandPower).reduce((a, b) => a + b, 0);
  return {
    label: "ch",
    bandPower,
    relativeBandPower: Object.fromEntries(
      Object.entries(bandPower).map(([band, value]) => [band, value / total]),
    ),
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
const powers = { delta: 4, theta: 4, alpha: 8, beta: 2, gamma: 2 };

describe("protocols", () => {
  it("have unique ids and can be looked up", () => {
    expect(new Set(PROTOCOLS.map((p) => p.id)).size).toBe(PROTOCOLS.length);
    expect(getProtocol("focus")?.direction).toBe("down");
    expect(getProtocol("nope")).toBeUndefined();
  });

  it("compute their metrics from averaged band powers", () => {
    const r = result(channel(powers));
    expect(protocolMetric(byId("relax"), r)).toBeCloseTo(8 / 20);
    expect(protocolMetric(byId("focus"), r)).toBeCloseTo(4 / 2); // theta/beta
    expect(protocolMetric(byId("calm"), r)).toBeCloseTo(8 / 4); // alpha/theta
  });

  it("averages powers across usable channels before taking ratios", () => {
    const r = result(channel({ ...powers, theta: 2 }), channel({ ...powers, theta: 6 }));
    expect(protocolMetric(byId("focus"), r)).toBeCloseTo(4 / 2);
  });

  it("skips windows with artifacts such as blinks", () => {
    const blink = channel({ ...powers, delta: 400 }, "fair", true);
    expect(protocolMetric(byId("relax"), result(channel(powers), blink))).toBeCloseTo(8 / 20);
    expect(protocolMetric(byId("relax"), result(blink))).toBeNaN();
  });

  it("leaves poor channels out, and gives NaN when none is usable", () => {
    const noisy = channel({ ...powers, alpha: 100 }, "poor");
    expect(protocolMetric(byId("calm"), result(channel(powers), noisy))).toBeCloseTo(2);
    expect(protocolMetric(byId("calm"), result(noisy))).toBeNaN();
  });
});
