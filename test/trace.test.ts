import { describe, expect, it } from "vitest";
import { seriesPath, tracePath } from "../src/lib/trace";

const points = (path: string) =>
  [...path.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m): [number, number] => [
    Number(m[1]),
    Number(m[2]),
  ]);

describe("tracePath", () => {
  it("anchors the newest sample at the right edge", () => {
    const p = points(tracePath([0, 50, -50], 5, 100, 40, 50));
    expect(p).toEqual([
      [50, 20],
      [75, 0],
      [100, 40],
    ]);
  });

  it("clamps values beyond the scale", () => {
    const p = points(tracePath([500, -500], 2, 10, 20, 50));
    expect(p.map(([, y]) => y)).toEqual([0, 20]);
  });

  it("decimates long buffers but keeps spikes", () => {
    const samples = new Float64Array(5000);
    samples[2500] = 40;
    const p = points(tracePath(samples, 5000, 100, 100, 50));
    expect(p.length).toBeLessThanOrEqual(202);
    expect(Math.min(...p.map(([, y]) => y))).toBe(10);
  });

  it("returns nothing to draw for fewer than two samples", () => {
    expect(tracePath([1], 10, 100, 100, 50)).toBe("");
  });
});

describe("seriesPath", () => {
  it("maps 0–1 to the height and splits at NaN gaps", () => {
    expect(seriesPath([0, 1, Number.NaN, 0.5], 30, 10)).toBe("M0 10L10 0M30 5");
  });
});
