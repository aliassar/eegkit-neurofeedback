/**
 * The engine shared by every game: it turns the attention score into focused
 * time, streaks and stars. The game screen calls {@link stepFocus} on a fixed
 * tick (about 4 times a second) while a round runs; while the signal is bad
 * the round is paused and not stepped at all, so that time counts for nothing.
 */

/** Seconds of focused play that earn one star. */
export const SECONDS_PER_STAR = 8;
/** Extra star for finishing a round, so no round ends empty-handed. */
export const FINISH_BONUS = 1;

export interface FocusMeter {
  /** Seconds of play so far. */
  elapsed: number;
  /** Seconds with the score at or above the threshold. */
  focused: number;
  /** Current run of focused seconds. */
  streak: number;
  longestStreak: number;
  /** Time integral of the score, for the mean. */
  scoreTime: number;
  /** Progress towards the next star, 0–1. */
  progress: number;
  /** Stars earned through focus (the finishing bonus is added in the summary). */
  stars: number;
  /** Mean score per whole second of play, for charts. */
  series: number[];
  bucketSum: number;
  bucketTime: number;
}

export function createFocusMeter(): FocusMeter {
  return {
    elapsed: 0,
    focused: 0,
    streak: 0,
    longestStreak: 0,
    scoreTime: 0,
    progress: 0,
    stars: 0,
    series: [],
    bucketSum: 0,
    bucketTime: 0,
  };
}

export interface StepOptions {
  readonly threshold: number;
  readonly secondsPerStar?: number;
}

/**
 * Advances the meter by `dt` seconds at a constant `score`, in place.
 * Returns how many stars were earned in this step (usually 0 or 1).
 */
export function stepFocus(
  meter: FocusMeter,
  dt: number,
  score: number,
  { threshold, secondsPerStar = SECONDS_PER_STAR }: StepOptions,
): number {
  if (!(dt > 0) || !Number.isFinite(score)) return 0;
  const s = Math.min(Math.max(score, 0), 1);
  meter.elapsed += dt;
  meter.scoreTime += s * dt;

  let earned = 0;
  if (s >= threshold) {
    meter.focused += dt;
    meter.streak += dt;
    meter.longestStreak = Math.max(meter.longestStreak, meter.streak);
    meter.progress += dt / secondsPerStar;
    while (meter.progress >= 1) {
      meter.progress -= 1;
      meter.stars += 1;
      earned += 1;
    }
  } else {
    meter.streak = 0;
  }

  // Per-second chart buckets; a step that crosses a second boundary is split.
  let remaining = dt;
  while (remaining > 0) {
    const room = 1 - meter.bucketTime;
    const part = Math.min(room, remaining);
    meter.bucketSum += s * part;
    meter.bucketTime += part;
    remaining -= part;
    if (meter.bucketTime >= 1 - 1e-9) {
      meter.series.push(Math.round(meter.bucketSum * 1000) / 1000);
      meter.bucketSum = 0;
      meter.bucketTime = 0;
    }
  }
  return earned;
}

export interface RoundSummary {
  readonly durationSeconds: number;
  /** Fraction of play time with the score at or above the threshold, 0–1. */
  readonly focusedFraction: number;
  readonly longestStreakSeconds: number;
  /** Time-weighted mean score, 0–1 (NaN for an empty round). */
  readonly meanScore: number;
  /** Stars from focus plus the finishing bonus. */
  readonly stars: number;
  /** Mean score per second. */
  readonly series: readonly number[];
}

const round1 = (v: number) => Math.round(v * 10) / 10;

export function summarizeRound(meter: FocusMeter, finished: boolean): RoundSummary {
  const t = meter.elapsed;
  const series =
    meter.bucketTime > 0.25
      ? [...meter.series, Math.round((meter.bucketSum / meter.bucketTime) * 1000) / 1000]
      : [...meter.series];
  return {
    durationSeconds: round1(t),
    focusedFraction: t > 0 ? meter.focused / t : 0,
    longestStreakSeconds: round1(meter.longestStreak),
    meanScore: t > 0 ? meter.scoreTime / t : Number.NaN,
    stars: meter.stars + (finished ? FINISH_BONUS : 0),
    series,
  };
}

export interface SessionTotals {
  readonly durationSeconds: number;
  readonly focusedFraction: number;
  readonly longestStreakSeconds: number;
  readonly meanScore: number;
  readonly stars: number;
}

/** Totals over a session's rounds, weighted by each round's duration. */
export function totalRounds(rounds: readonly RoundSummary[]): SessionTotals {
  let duration = 0;
  let focused = 0;
  let scoreTime = 0;
  let stars = 0;
  let longest = 0;
  for (const r of rounds) {
    duration += r.durationSeconds;
    focused += r.focusedFraction * r.durationSeconds;
    if (Number.isFinite(r.meanScore)) scoreTime += r.meanScore * r.durationSeconds;
    stars += r.stars;
    longest = Math.max(longest, r.longestStreakSeconds);
  }
  return {
    durationSeconds: round1(duration),
    focusedFraction: duration > 0 ? focused / duration : 0,
    longestStreakSeconds: longest,
    meanScore: duration > 0 ? scoreTime / duration : Number.NaN,
    stars,
  };
}
