/**
 * Attention-training protocols. Each one reduces an analysis window to one
 * number and says which direction is rewarded; eegkit-react's
 * `useNeurofeedback` turns that into a 0–1 score against the child's own
 * resting baseline. No protocol uses absolute thresholds: the ratios vary a
 * lot between people, headsets and electrode positions.
 *
 * See the README for the rationale and the literature caveats.
 */
import {
  type Band,
  type BandPowers,
  bandRatio,
  engagementIndex,
  type PipelineResult,
  STANDARD_BANDS,
  thetaBetaRatio,
} from "eegkit";
import { isClean } from "./quality";

/** Sensorimotor rhythm, the target of SMR training (usually at C3, Cz or C4). */
export const SMR_BAND: Band = { name: "smr", low: 12, high: 15 };

/**
 * Bands the pipeline measures: the five standard bands plus SMR. SMR overlaps
 * alpha and beta, so eegkit's relative band powers (which divide by the sum of
 * all bands) are distorted; use absolute powers and ratios, or
 * {@link standardRelativePowers}.
 */
export const ANALYSIS_BANDS: readonly Band[] = [...STANDARD_BANDS, SMR_BAND];

/** Relative power over the five standard (non-overlapping) bands only. */
export function standardRelativePowers(absolute: BandPowers): BandPowers {
  let total = 0;
  for (const band of STANDARD_BANDS) total += absolute[band.name] ?? 0;
  const relative: BandPowers = {};
  for (const band of STANDARD_BANDS) {
    relative[band.name] = total > 0 ? (absolute[band.name] ?? 0) / total : Number.NaN;
  }
  return relative;
}

export type ProtocolId = "tbr" | "smr" | "engagement";

export interface Protocol {
  readonly id: ProtocolId;
  readonly name: string;
  /** What is trained, in a few words. */
  readonly goal: string;
  readonly direction: "up" | "down";
  readonly description: string;
  /** Where the active electrode usually goes. */
  readonly placement: string;
  /** The trained quantity from absolute band powers averaged over clean channels. */
  readonly compute: (absolute: BandPowers) => number;
}

export const PROTOCOLS: readonly Protocol[] = [
  {
    id: "tbr",
    name: "Theta/Beta",
    goal: "Lower theta/beta ratio",
    direction: "down",
    description:
      "The classic ADHD neurofeedback protocol. The game rewards moments when the theta/beta ratio is below the child's own resting level.",
    placement: "Cz (or Fz and Cz), referenced to an earlobe or mastoid",
    compute: (absolute) => thetaBetaRatio(absolute),
  },
  {
    id: "smr",
    name: "SMR",
    goal: "Raise SMR (12–15 Hz) over theta",
    direction: "up",
    description:
      "Sensorimotor-rhythm training rewards calm, still attention: more 12–15 Hz activity relative to theta than at rest.",
    placement: "Cz (or C3/C4), referenced to an earlobe or mastoid",
    compute: (absolute) => bandRatio(absolute, "smr", "theta"),
  },
  {
    id: "engagement",
    name: "Engagement",
    goal: "Raise beta / (alpha + theta)",
    direction: "up",
    description:
      "The engagement index of Pope et al. (1995) rises with task engagement. The game rewards values above the child's resting level.",
    placement: "Cz or Pz, referenced to an earlobe or mastoid",
    compute: (absolute) => engagementIndex(absolute),
  },
];

export const DEFAULT_PROTOCOL: ProtocolId = "tbr";

export function getProtocol(id: string): Protocol | undefined {
  return PROTOCOLS.find((p) => p.id === id);
}

/** Score at or above which a moment counts as focused (z ≈ +0.4 against the baseline). */
export const FOCUS_THRESHOLD = 0.6;

function average(powers: readonly BandPowers[]): BandPowers {
  const sum: BandPowers = {};
  for (const p of powers) {
    for (const [band, value] of Object.entries(p)) sum[band] = (sum[band] ?? 0) + value;
  }
  for (const band of Object.keys(sum)) sum[band] = (sum[band] as number) / powers.length;
  return sum;
}

/**
 * The protocol's metric for one window, from absolute band powers averaged
 * over the channels that are usable and artifact-free in that window. NaN
 * (which `useNeurofeedback` skips, holding the last score) when there are
 * none, so a blink or a loose electrode pauses feedback instead of
 * corrupting it or the baseline.
 */
export function protocolMetric(protocol: Protocol, result: PipelineResult): number {
  const channels = result.channels.filter(isClean);
  if (channels.length === 0) return Number.NaN;
  return protocol.compute(average(channels.map((c) => c.bandPower)));
}
