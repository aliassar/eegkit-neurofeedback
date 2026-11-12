import {
  bandPowers,
  createSyntheticEEG,
  engagementIndex,
  STANDARD_BANDS,
  thetaBetaRatio,
  welch,
} from "eegkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDemoGenerator, DEMO_STATES, demoSource } from "../src/lib/demo-source";
import { SMR_BAND } from "../src/lib/protocols";

const SAMPLE_RATE = 256;

function powersOf(signal: Float64Array) {
  const spectrum = welch(signal, { sampleRate: SAMPLE_RATE, segmentLength: SAMPLE_RATE });
  return bandPowers(spectrum, [...STANDARD_BANDS, SMR_BAND]);
}

describe("createDemoGenerator", () => {
  it("equals eegkit's default synthetic EEG while all gains are 1 (without the SMR rhythm)", () => {
    const demo = createDemoGenerator({
      sampleRate: SAMPLE_RATE,
      channels: 2,
      blinkRate: 0,
      smrAmplitude: 0,
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

  it("follows a new state within a few seconds", () => {
    const demo = createDemoGenerator({ sampleRate: SAMPLE_RATE, channels: 1 });
    demo.setTarget(DEMO_STATES.focused.gains);
    demo.next(SAMPLE_RATE); // 1 s, two thirds of the time constant
    expect(demo.gains.beta).toBeGreaterThan(1.3);
    expect(demo.gains.beta).toBeLessThan(1.6);
    demo.next(SAMPLE_RATE * 10);
    expect(demo.gains.beta).toBeCloseTo(1.9, 2);
  });

  it("moves every protocol's metric the rewarded way when focused", () => {
    const neutral = createDemoGenerator({ sampleRate: SAMPLE_RATE, channels: 1, blinkRate: 0 });
    const focused = createDemoGenerator({ sampleRate: SAMPLE_RATE, channels: 1, blinkRate: 0 });
    focused.setTarget(DEMO_STATES.focused.gains);
    neutral.next(SAMPLE_RATE * 10);
    focused.next(SAMPLE_RATE * 10);
    const n = powersOf(neutral.next(SAMPLE_RATE * 8)[0] as Float64Array);
    const f = powersOf(focused.next(SAMPLE_RATE * 8)[0] as Float64Array);
    expect(thetaBetaRatio(f)).toBeLessThan(thetaBetaRatio(n) * 0.5);
    expect((f.smr as number) / (f.theta as number)).toBeGreaterThan(
      ((n.smr as number) / (n.theta as number)) * 2,
    );
    expect(engagementIndex(f)).toBeGreaterThan(engagementIndex(n) * 1.5);
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
