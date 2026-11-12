/**
 * The Focus check: a short go/no-go task without feedback. A sun appears most
 * of the time (tap it), a moon sometimes (don't tap). Reaction time, missed
 * suns (omissions) and tapped moons (commissions) are recorded so grown-ups
 * can follow change over weeks. It is a practice measure, not a diagnostic
 * test: there are no norms behind it.
 */

export type TrialKind = "go" | "nogo";

export interface FocusCheckPlan {
  readonly trials: readonly TrialKind[];
  /** How long each picture stays on screen, ms. */
  readonly stimulusMs: number;
  /** Blank gap after each picture, ms, one per trial (jittered so taps can't be timed). */
  readonly gapsMs: readonly number[];
}

export const STIMULUS_MS = 1000;
export const TRIALS = 60;
export const NOGO_SHARE = 0.25;
/** Responses faster than this can't be reactions to the picture. */
export const ANTICIPATION_MS = 150;

/** mulberry32, so a seed gives the same plan on every engine. */
function rng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A randomised plan: `trials` pictures, a quarter of them moons, never two
 * moons in a row and never in the first three (so the child gets going), with
 * gaps of 1000–1600 ms. About 2½ minutes at the defaults.
 */
export function makePlan(seed: number, trials = TRIALS, nogoShare = NOGO_SHARE): FocusCheckPlan {
  const random = rng(seed);
  const nogoCount = Math.round(trials * nogoShare);
  // Place no-go trials in slots 3 … trials−1 with at least one go between them.
  const kinds: TrialKind[] = Array.from({ length: trials }, () => "go");
  const candidates = Array.from({ length: Math.max(0, trials - 3) }, (_, i) => i + 3);
  let placed = 0;
  while (placed < nogoCount && candidates.length > 0) {
    const pick = Math.floor(random() * candidates.length);
    const slot = candidates[pick] as number;
    candidates.splice(pick, 1);
    if (kinds[slot - 1] === "nogo" || kinds[slot + 1] === "nogo") continue;
    kinds[slot] = "nogo";
    placed++;
  }
  const gapsMs = kinds.map(() => 1000 + Math.round(random() * 600));
  return { trials: kinds, stimulusMs: STIMULUS_MS, gapsMs };
}

export interface TrialResult {
  readonly kind: TrialKind;
  /** Time from picture onset to the first tap, or null for no tap. */
  readonly rtMs: number | null;
}

export interface FocusCheckScore {
  readonly goTrials: number;
  readonly noGoTrials: number;
  readonly hits: number;
  readonly omissions: number;
  readonly commissions: number;
  /** Over hits slower than {@link ANTICIPATION_MS}; NaN without any. */
  readonly meanRtMs: number;
  readonly rtSdMs: number;
}

export function scoreFocusCheck(results: readonly TrialResult[]): FocusCheckScore {
  let goTrials = 0;
  let noGoTrials = 0;
  let hits = 0;
  let commissions = 0;
  const rts: number[] = [];
  for (const r of results) {
    if (r.kind === "go") {
      goTrials++;
      if (r.rtMs !== null) {
        hits++;
        if (r.rtMs >= ANTICIPATION_MS) rts.push(r.rtMs);
      }
    } else {
      noGoTrials++;
      if (r.rtMs !== null) commissions++;
    }
  }
  const mean = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : Number.NaN;
  const sd =
    rts.length > 1
      ? Math.sqrt(rts.reduce((a, b) => a + (b - mean) ** 2, 0) / (rts.length - 1))
      : Number.NaN;
  return {
    goTrials,
    noGoTrials,
    hits,
    omissions: goTrials - hits,
    commissions,
    meanRtMs: Math.round(mean),
    rtSdMs: Math.round(sd),
  };
}
