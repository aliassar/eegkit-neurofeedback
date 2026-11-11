/**
 * The demo source: synthetic EEG from eegkit whose band amplitudes can be
 * changed while it runs, so the neurofeedback loop can be tried without
 * hardware ("simulate relaxing").
 *
 * eegkit-react's `syntheticSource` fixes the band amplitudes when it is
 * created, and changing them would mean a new source, which reconnects and
 * restarts the baseline. So this implements eegkit-react's `EEGSource`
 * interface directly. The signal is the sum of one eegkit
 * `createSyntheticEEG` generator per band plus one for the background, all
 * from the same seed, so with every gain at 1 it is exactly eegkit's
 * default synthetic EEG; the gains scale each band on top of that.
 */
import { createSyntheticEEG, type StandardBandName, type SyntheticEEG } from "eegkit";
import type { EEGSource, SourceHandlers } from "eegkit-react";

export type BandGains = Readonly<Record<StandardBandName, number>>;

export type DemoStateId = "neutral" | "relaxed" | "focused";

export interface DemoState {
  readonly id: DemoStateId;
  readonly label: string;
  readonly description: string;
  readonly gains: BandGains;
}

const UNITY: BandGains = { delta: 1, theta: 1, alpha: 1, beta: 1, gamma: 1 };

/**
 * Caricatures of the patterns the protocols reward. Relaxed wakefulness
 * shows more alpha and less theta; focused attention shows less theta and
 * alpha and more beta. Real changes are smaller and slower.
 */
export const DEMO_STATES: Readonly<Record<DemoStateId, DemoState>> = {
  neutral: {
    id: "neutral",
    label: "Neutral",
    description: "eegkit's default synthetic EEG",
    gains: UNITY,
  },
  relaxed: {
    id: "relaxed",
    label: "Relaxed",
    description: "Alpha ×2, theta ×0.8",
    gains: { ...UNITY, alpha: 2, theta: 0.8 },
  },
  focused: {
    id: "focused",
    label: "Focused",
    description: "Theta ×0.6, alpha ×0.8, beta ×1.9",
    gains: { ...UNITY, theta: 0.6, alpha: 0.8, beta: 1.9 },
  },
};

const BANDS: readonly StandardBandName[] = ["delta", "theta", "alpha", "beta", "gamma"];

/** eegkit's documented default band amplitudes for `createSyntheticEEG`, in µV (not exported). */
const DEFAULT_AMPLITUDES: BandGains = { delta: 6, theta: 5, alpha: 10, beta: 4, gamma: 1.5 };

/** Time constant, in seconds, with which the gains follow a new target, as real states shift gradually. */
export const GAIN_TIME_CONSTANT = 4;

export interface DemoOptions {
  readonly sampleRate: number;
  readonly channels: number;
  /** Mains hum frequency to mix in (2 µV), like a real recording. */
  readonly mains?: 50 | 60;
  /** Blinks per minute. Default 6. */
  readonly blinkRate?: number;
  readonly seed?: number;
}

/** A synthetic EEG generator with adjustable band gains. */
export interface DemoGenerator {
  /** Next `samples` samples per channel, channel-major (µV). */
  next(samples: number): Float64Array[];
  /** Start moving the band gains towards `gains`. */
  setTarget(gains: BandGains): void;
  /** Current (moving) gains. */
  readonly gains: BandGains;
}

export function createDemoGenerator(options: DemoOptions): DemoGenerator {
  const { sampleRate, channels } = options;
  const seed = options.seed ?? 1;
  const silent = { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 };
  // Background, mains hum and blinks, without rhythms.
  const background = createSyntheticEEG({
    sampleRate,
    channels,
    seed,
    bands: silent,
    blinkRate: options.blinkRate ?? 6,
    ...(options.mains && options.mains < sampleRate / 2
      ? { lineNoise: { frequency: options.mains, amplitude: 2 } }
      : {}),
  });
  // One generator per band, with eegkit's default amplitude for that band and no noise.
  const bands: [StandardBandName, SyntheticEEG][] = BANDS.map((band) => [
    band,
    createSyntheticEEG({
      sampleRate,
      channels,
      seed,
      noise: 0,
      bands: { ...silent, [band]: DEFAULT_AMPLITUDES[band] },
    }),
  ]);
  const gains: Record<StandardBandName, number> = { ...UNITY };
  let target: BandGains = UNITY;
  const alpha = 1 - Math.exp(-1 / (GAIN_TIME_CONSTANT * sampleRate));

  return {
    next(samples) {
      const out = background.next(samples);
      const parts = bands.map(([band, generator]) => [band, generator.next(samples)] as const);
      for (let i = 0; i < samples; i++) {
        for (const band of BANDS) gains[band] += (target[band] - gains[band]) * alpha;
        for (const [band, chunk] of parts) {
          const g = gains[band];
          for (let c = 0; c < channels; c++) {
            const row = out[c] as Float64Array;
            row[i] = (row[i] as number) + g * ((chunk[c] as Float64Array)[i] as number);
          }
        }
      }
      return out;
    },
    setTarget(next) {
      target = next;
    },
    get gains() {
      return { ...gains };
    },
  };
}

export interface DemoSource extends EEGSource {
  /** Move the simulated brain state; takes effect gradually, without reconnecting. */
  setState(state: DemoStateId): void;
}

/**
 * A real-time `EEGSource` around {@link createDemoGenerator}. Like eegkit's
 * `startSyntheticStream`, it delivers whatever is due by the wall clock every
 * `chunkMs`, and drops the backlog after a pause instead of bursting.
 */
export function demoSource(
  options: { readonly sampleRate: number; readonly channels: readonly string[] } & Omit<
    DemoOptions,
    "sampleRate" | "channels"
  >,
  chunkMs = 40,
): DemoSource {
  let state: DemoStateId = "neutral";
  let active: DemoGenerator | undefined;
  const channelCount = options.channels.length;
  return {
    sampleRate: options.sampleRate,
    channels: options.channels,
    setState(next) {
      state = next;
      active?.setTarget(DEMO_STATES[next].gains);
    },
    connect({ onFrame, onStatus }: SourceHandlers) {
      const generator = createDemoGenerator({ ...options, channels: channelCount });
      generator.setTarget(DEMO_STATES[state].gains);
      active = generator;
      const start = Date.now();
      let delivered = 0;
      let stopped = false;
      const timer = setInterval(() => {
        const due = Math.floor(((Date.now() - start) * options.sampleRate) / 1000);
        const count = Math.min(due - delivered, Math.ceil(options.sampleRate));
        delivered = due;
        if (count <= 0) return;
        const chunk = generator.next(count);
        for (let i = 0; i < count && !stopped; i++) {
          const frame = new Float64Array(channelCount);
          for (let c = 0; c < channelCount; c++) {
            frame[c] = (chunk[c] as Float64Array)[i] as number;
          }
          onFrame(frame);
        }
      }, chunkMs);
      onStatus?.("open");
      return () => {
        stopped = true;
        clearInterval(timer);
        if (active === generator) active = undefined;
        onStatus?.("closed");
      };
    },
  };
}
