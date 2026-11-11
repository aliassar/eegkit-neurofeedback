import { describe, expect, it } from "vitest";
import { formatDuration, formatPercent, parseSessions, summarizeSession } from "../src/lib/session";

describe("summarizeSession", () => {
  it("weights each score by how long it held", () => {
    // 0.2 for 1 s, 0.8 for 3 s.
    const summary = summarizeSession(
      [
        { t: 0, score: 0.2 },
        { t: 1000, score: 0.8 },
      ],
      4000,
      0.6,
    );
    expect(summary.durationSeconds).toBe(4);
    expect(summary.meanScore).toBeCloseTo(0.65);
    expect(summary.rewardFraction).toBeCloseTo(0.75);
    expect(summary.series).toEqual([0.2, 0.8, 0.8, 0.8]);
    expect(summary.seriesStepSeconds).toBe(1);
  });

  it("is unaffected by duplicate samples from extra renders", () => {
    const once = summarizeSession(
      [
        { t: 0, score: 0.5 },
        { t: 2000, score: 0.9 },
      ],
      3000,
      0.6,
    );
    const twice = summarizeSession(
      [
        { t: 0, score: 0.5 },
        { t: 700, score: 0.5 },
        { t: 2000, score: 0.9 },
        { t: 2500, score: 0.9 },
      ],
      3000,
      0.6,
    );
    expect(twice.meanScore).toBeCloseTo(once.meanScore);
    expect(twice.rewardFraction).toBeCloseTo(once.rewardFraction);
  });

  it("leaves signal gaps out of the mean and the reward zone", () => {
    const summary = summarizeSession(
      [
        { t: 0, score: 0.8 },
        { t: 1000, score: Number.NaN },
        { t: 3000, score: 0.4 },
      ],
      4000,
      0.6,
    );
    expect(summary.durationSeconds).toBe(4);
    expect(summary.meanScore).toBeCloseTo(0.6);
    expect(summary.rewardFraction).toBeCloseTo(0.5);
    expect(summary.series[1]).toBeNaN();
  });

  it("measures time from the first sample", () => {
    const summary = summarizeSession([{ t: 5000, score: 1 }], 7000, 0.6);
    expect(summary.durationSeconds).toBe(2);
    expect(summary.rewardFraction).toBe(1);
  });

  it("caps the chart at maxPoints buckets", () => {
    const samples = Array.from({ length: 600 }, (_, i) => ({ t: i * 1000, score: (i % 10) / 10 }));
    const summary = summarizeSession(samples, 600_000, 0.6, 120);
    expect(summary.series.length).toBeLessThanOrEqual(120);
    expect(summary.seriesStepSeconds).toBe(5);
    expect(summary.meanScore).toBeCloseTo(0.45);
  });

  it("returns an empty summary without samples", () => {
    const summary = summarizeSession([], 1000, 0.6);
    expect(summary.durationSeconds).toBe(0);
    expect(summary.meanScore).toBeNaN();
    expect(summary.series).toEqual([]);
  });
});

describe("parseSessions", () => {
  const good = {
    id: "a",
    protocol: "relax",
    startedAt: "2026-11-01T10:00:00.000Z",
    source: "demo",
    baselineSeconds: 30,
    channels: ["Fz"],
    durationSeconds: 300,
    meanScore: 0.6,
    rewardFraction: 0.4,
    series: [0.5, null, 0.7],
    seriesStepSeconds: 3,
  };

  it("restores valid sessions newest first and NaN gaps from null", () => {
    const later = { ...good, id: "b", startedAt: "2026-11-02T10:00:00.000Z", meanScore: null };
    const sessions = parseSessions(JSON.stringify([good, later]));
    expect(sessions.map((s) => s.id)).toEqual(["b", "a"]);
    expect(sessions[0]?.meanScore).toBeNaN();
    expect(sessions[1]?.series[1]).toBeNaN();
  });

  it("drops malformed entries and survives broken JSON", () => {
    const bad = [{ ...good, protocol: "levitate" }, { ...good, startedAt: "yesterday" }, null, 3];
    expect(parseSessions(JSON.stringify(bad))).toEqual([]);
    expect(parseSessions("not json")).toEqual([]);
    expect(parseSessions(JSON.stringify({}))).toEqual([]);
  });
});

describe("formatting", () => {
  it("formats durations", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3725)).toBe("1:02:05");
  });

  it("formats percentages", () => {
    expect(formatPercent(0.734)).toBe("73%");
    expect(formatPercent(Number.NaN)).toBe("–");
  });
});
