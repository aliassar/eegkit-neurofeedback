import { createSyntheticEEG, relativeBandPowers, welch } from "eegkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDemoGenerator, DEMO_STATES, demoSource } from "../src/lib/demo-source";

const SAMPLE_RATE = 256;

function relativeAlpha(signal: Float64Array): number {
  const spectrum = welch(signal, { sampleRate: SAMPLE_RATE, segmentLength: SAMPLE_RATE });
  return relativeBandPowers(spectrum).alpha as number;
}

describe("createDemoGenerator", () => {
  it("equals eegkit's default synthetic EEG while all gains are 1", () => {
    const demo = createDemoGenerator({
      sampleRate: SAMPLE_RATE,
      channels: 2,
      blinkRate: 0,
      seed: 7,
    });
    const reference = createSyntheticEEG({ sampleRate: SAMPLE_RATE, channels: 2, seed: 7 });
    const a = demo.next(1000);
    const b = reference.next(1000);
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < 1000; i++) {
        expect(a[c]?.[i]).toBeCloseTo(b[c]?.[i] as number, 9);
      }
    }
  });

  it("moves gradually towards a new state", () => {
    const demo = createDemoGenerator({ sampleRate: SAMPLE_RATE, channels: 1 });
    demo.setTarget(DEMO_STATES.relaxed.gains);
    demo.next(SAMPLE_RATE); // 1 s, a quarter of the time constant
    expect(demo.gains.alpha).toBeGreaterThan(1.1);
    expect(demo.gains.alpha).toBeLessThan(1.5);
    demo.next(SAMPLE_RATE * 30);
    expect(demo.gains.alpha).toBeCloseTo(2, 2);
  });

  it("raises relative alpha when relaxed", () => {
    const neutral = createDemoGenerator({ sampleRate: SAMPLE_RATE, channels: 1, blinkRate: 0 });
    const relaxed = createDemoGenerator({ sampleRate: SAMPLE_RATE, channels: 1, blinkRate: 0 });
    relaxed.setTarget(DEMO_STATES.relaxed.gains);
    neutral.next(SAMPLE_RATE * 30);
    relaxed.next(SAMPLE_RATE * 30);
    const n = relativeAlpha(neutral.next(SAMPLE_RATE * 8)[0] as Float64Array);
    const r = relativeAlpha(relaxed.next(SAMPLE_RATE * 8)[0] as Float64Array);
    expect(r).toBeGreaterThan(n * 1.4);
  });
});

describe("demoSource", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("streams frames in real time and reports its status", () => {
    vi.useFakeTimers();
    const source = demoSource({ sampleRate: SAMPLE_RATE, channels: ["Fz", "Cz"] });
    const frames: Float64Array[] = [];
    const statuses: string[] = [];
    const disconnect = source.connect({
      onFrame: (f) => frames.push(Float64Array.from(f)),
      onStatus: (s) => statuses.push(s),
    });
    vi.advanceTimersByTime(1000);
    expect(frames.length).toBeGreaterThan(SAMPLE_RATE * 0.9);
    expect(frames.length).toBeLessThanOrEqual(SAMPLE_RATE);
    expect(frames[0]?.length).toBe(2);
    source.setState("focused"); // doesn't throw while connected
    disconnect();
    const count = frames.length;
    vi.advanceTimersByTime(1000);
    expect(frames.length).toBe(count);
    expect(statuses).toEqual(["open", "closed"]);
  });
});
