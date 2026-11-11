/**
 * Training protocols. Each one reduces an analysis window to a single number
 * and says which direction is rewarded; eegkit-react's `useNeurofeedback`
 * turns that into a 0–1 score against the user's own baseline.
 *
 * See the README for the rationale and the literature caveats.
 */
import { alphaThetaRatio, type BandPowers, type PipelineResult, thetaBetaRatio } from "eegkit";
import type { DemoStateId } from "./demo-source";
import { isClean } from "./quality";

export type ProtocolId = "relax" | "focus" | "calm";

export interface Protocol {
  readonly id: ProtocolId;
  readonly name: string;
  /** What is trained, in a few words. */
  readonly goal: string;
  /** Name of the trained quantity, for display. */
  readonly metricName: string;
  readonly direction: "up" | "down";
  readonly description: string;
  /** What to do during the session. */
  readonly instruction: string;
  /** Where the electrodes usually go for this protocol. */
  readonly placement: string;
  /** The simulated state that "succeeds" at this protocol in the demo. */
  readonly demoState: DemoStateId;
  /** The trained quantity from band powers averaged over usable channels. */
  readonly compute: (powers: { absolute: BandPowers; relative: BandPowers }) => number;
}

export const PROTOCOLS: readonly Protocol[] = [
  {
    id: "relax",
    name: "Relax",
    goal: "Raise alpha",
    metricName: "Relative alpha (8–13 Hz)",
    direction: "up",
    description:
      "Alpha rhythm grows when you let go of effort and settle into relaxed wakefulness. The orb brightens as your alpha share rises above your baseline.",
    instruction: "Sit comfortably, soften your gaze on the orb and let your breathing slow down.",
    placement: "Back of the head (Pz, O1, O2), where alpha is strongest",
    demoState: "relaxed",
    compute: ({ relative }) => relative.alpha ?? Number.NaN,
  },
  {
    id: "focus",
    name: "Focus",
    goal: "Lower theta/beta",
    metricName: "Theta/beta ratio",
    direction: "down",
    description:
      "The theta/beta ratio tends to fall during sustained, alert attention. The orb brightens as your ratio drops below your baseline.",
    instruction: "Keep your eyes on the orb and hold a calm, steady focus on it.",
    placement: "Top of the head (Cz or Fz)",
    demoState: "focused",
    compute: ({ absolute }) => thetaBetaRatio(absolute),
  },
  {
    id: "calm",
    name: "Calm",
    goal: "Raise alpha/theta",
    metricName: "Alpha/theta ratio",
    direction: "up",
    description:
      "Rewards calm alertness: more alpha, without sliding into the theta of drowsiness. The orb brightens as the ratio rises above your baseline.",
    instruction: "Stay relaxed but awake. If you notice yourself drifting off, gently re-focus.",
    placement: "Centre or back of the head (Cz, Pz)",
    demoState: "relaxed",
    compute: ({ absolute }) => alphaThetaRatio(absolute),
  },
];

export function getProtocol(id: string): Protocol | undefined {
  return PROTOCOLS.find((p) => p.id === id);
}

/** Score at or above which a moment counts as "in the reward zone" (z ≈ +0.4 vs baseline). */
export const REWARD_THRESHOLD = 0.6;

function average(powers: readonly BandPowers[]): BandPowers {
  const sum: BandPowers = {};
  for (const p of powers) {
    for (const [band, value] of Object.entries(p)) sum[band] = (sum[band] ?? 0) + value;
  }
  for (const band of Object.keys(sum)) sum[band] = (sum[band] as number) / powers.length;
  return sum;
}

/**
 * The protocol's metric for one window, averaged over the channels that are
 * usable and artifact-free in that window. NaN (which `useNeurofeedback`
 * skips, holding the last score) when there are none, so a blink or a loose
 * electrode pauses feedback instead of corrupting it or the baseline.
 */
export function protocolMetric(protocol: Protocol, result: PipelineResult): number {
  const channels = result.channels.filter(isClean);
  if (channels.length === 0) return Number.NaN;
  return protocol.compute({
    absolute: average(channels.map((c) => c.bandPower)),
    relative: average(channels.map((c) => c.relativeBandPower)),
  });
}
