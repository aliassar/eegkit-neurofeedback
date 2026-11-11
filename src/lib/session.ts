/** Training session statistics and the stored session history. */
import type { ProtocolId } from "./protocols";
import { getProtocol } from "./protocols";
import type { SourceKind } from "./settings";

/** One feedback score, `t` milliseconds after training started. */
export interface ScoreSample {
  readonly t: number;
  readonly score: number;
}

export interface SessionSummary {
  readonly durationSeconds: number;
  /** Time-weighted mean score, 0–1, over the time with signal (NaN without any). */
  readonly meanScore: number;
  /** Fraction of the time with signal that the score was at or above the threshold, 0–1. */
  readonly rewardFraction: number;
  /** Mean score per `seriesStepSeconds` bucket, for the chart. */
  readonly series: readonly number[];
  readonly seriesStepSeconds: number;
}

/**
 * Summarises a session from its score samples. Each sample holds until the
 * next one (the last until `endT`), so the result doesn't depend on how often
 * the screen re-rendered. A NaN score marks a gap (signal lost): that time
 * counts towards the duration but not towards the mean or the reward zone.
 * Samples must be in time order.
 */
export function summarizeSession(
  samples: readonly ScoreSample[],
  endT: number,
  threshold: number,
  maxPoints = 120,
): SessionSummary {
  const first = samples[0];
  if (!first || !(endT > first.t)) {
    return {
      durationSeconds: 0,
      meanScore: Number.NaN,
      rewardFraction: 0,
      series: [],
      seriesStepSeconds: 1,
    };
  }
  const start = first.t;
  const durationMs = endT - start;
  const step = Math.max(1, Math.ceil(durationMs / 1000 / maxPoints)) * 1000;
  const buckets = Math.ceil(durationMs / step);
  const bucketSum = new Float64Array(buckets);
  const bucketTime = new Float64Array(buckets);
  let weighted = 0;
  let rewarded = 0;
  let valid = 0;

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i] as ScoreSample;
    const from = Math.max(sample.t, start);
    const to = Math.min(samples[i + 1]?.t ?? endT, endT);
    if (!(to > from) || !Number.isFinite(sample.score)) continue;
    const span = to - from;
    valid += span;
    weighted += sample.score * span;
    if (sample.score >= threshold) rewarded += span;
    // Spread the span over the chart buckets it covers.
    let t = from;
    while (t < to) {
      const b = Math.min(Math.floor((t - start) / step), buckets - 1);
      const bucketEnd = Math.min(start + (b + 1) * step, to);
      const part = Math.max(bucketEnd - t, 0);
      bucketSum[b] = (bucketSum[b] as number) + sample.score * part;
      bucketTime[b] = (bucketTime[b] as number) + part;
      if (bucketEnd <= t) break;
      t = bucketEnd;
    }
  }
  const series = Array.from(bucketSum, (sum, b) => {
    const time = bucketTime[b] as number;
    return time > 0 ? Math.round((sum / time) * 1000) / 1000 : Number.NaN;
  });
  return {
    durationSeconds: Math.round(durationMs / 1000),
    meanScore: valid > 0 ? weighted / valid : Number.NaN,
    rewardFraction: valid > 0 ? rewarded / valid : 0,
    series,
    seriesStepSeconds: step / 1000,
  };
}

export interface SessionRecord extends SessionSummary {
  readonly id: string;
  readonly protocol: ProtocolId;
  /** ISO timestamp of when training (after the baseline) started. */
  readonly startedAt: string;
  readonly source: SourceKind;
  readonly baselineSeconds: number;
  readonly channels: readonly string[];
}

/** How many sessions to keep; the oldest are dropped. */
export const MAX_SESSIONS = 200;

const isNumber = (v: unknown): v is number => typeof v === "number";

/** Reads the stored history, dropping malformed entries. Never throws. Newest first. */
export function parseSessions(json: string | null | undefined): SessionRecord[] {
  if (!json) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const sessions: SessionRecord[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (
      typeof r.id !== "string" ||
      typeof r.protocol !== "string" ||
      !getProtocol(r.protocol) ||
      typeof r.startedAt !== "string" ||
      Number.isNaN(Date.parse(r.startedAt)) ||
      (r.source !== "demo" && r.source !== "websocket") ||
      !isNumber(r.durationSeconds) ||
      !isNumber(r.rewardFraction) ||
      !isNumber(r.seriesStepSeconds) ||
      !Array.isArray(r.series)
    ) {
      continue;
    }
    sessions.push({
      id: r.id,
      protocol: r.protocol as ProtocolId,
      startedAt: r.startedAt,
      source: r.source,
      baselineSeconds: isNumber(r.baselineSeconds) ? r.baselineSeconds : 0,
      channels: Array.isArray(r.channels)
        ? r.channels.filter((c): c is string => typeof c === "string")
        : [],
      durationSeconds: r.durationSeconds,
      // JSON turns NaN into null.
      meanScore: isNumber(r.meanScore) ? r.meanScore : Number.NaN,
      rewardFraction: r.rewardFraction,
      series: r.series.map((v) => (isNumber(v) ? v : Number.NaN)),
      seriesStepSeconds: r.seriesStepSeconds,
    });
  }
  return sessions
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
    .slice(0, MAX_SESSIONS);
}

/** `65` → `"1:05"`, `3725` → `"1:02:05"`. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = String(s % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

/** `0.734` → `"73%"`; NaN → `"–"`. */
export function formatPercent(fraction: number): string {
  return Number.isFinite(fraction) ? `${Math.round(fraction * 100)}%` : "–";
}
