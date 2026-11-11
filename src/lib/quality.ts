/** Turning eegkit's per-channel quality assessment into something a person can act on. */
import type { ChannelQuality, ChannelResult, PipelineResult } from "eegkit";

export type QualityLevel = ChannelQuality["level"];

/**
 * Line-noise ratio above which eegkit starts lowering the quality score
 * (its internal `LINE_OK`), so naming it below this would be noise itself.
 */
export const LINE_NOISE_REASON = 0.1;

export interface QualityView {
  readonly level: QualityLevel | "unknown";
  /** Short labels for what is wrong, most fundamental first. Empty when clean. */
  readonly reasons: readonly string[];
  /** One line for the UI: the reasons, or a word for a clean signal. */
  readonly summary: string;
}

export function describeQuality(quality: ChannelQuality | undefined): QualityView {
  if (!quality) return { level: "unknown", reasons: [], summary: "Waiting for data" };
  const reasons: string[] = [];
  if (quality.flatline) {
    reasons.push("Flatline");
  } else {
    if (quality.clipped > 0) reasons.push("Clipping");
    if (quality.artifact) reasons.push("Artifact");
    if (quality.lineNoiseRatio > LINE_NOISE_REASON) reasons.push("Line noise");
  }
  const summary =
    reasons.length > 0 ? reasons.join(" · ") : quality.level === "good" ? "Clean" : "Noisy";
  return { level: quality.level, reasons, summary };
}

/** A channel counts as connected for training unless its quality is poor. */
export function isUsable(channel: ChannelResult): boolean {
  return channel.quality?.level !== "poor";
}

/**
 * A usable channel whose current window is also free of large artifacts
 * (blinks, movement). Feedback is computed only from these, the usual
 * artifact-rejection step, so a blink doesn't read as a drop in alpha.
 */
export function isClean(channel: ChannelResult): boolean {
  return isUsable(channel) && !channel.quality?.artifact;
}

export interface QualityGate {
  readonly status: "waiting" | "ready" | "blocked";
  readonly usable: number;
  readonly total: number;
  readonly message: string;
}

/** Whether training can start on this window, and what to tell the user. */
export function qualityGate(result: PipelineResult | undefined): QualityGate {
  if (!result) {
    return { status: "waiting", usable: 0, total: 0, message: "Collecting the first 2 seconds…" };
  }
  const total = result.channels.length;
  const usable = result.channels.filter(isUsable).length;
  if (usable === 0) {
    return {
      status: "blocked",
      usable,
      total,
      message: "No usable channel. Check that the electrodes touch the skin and sit still.",
    };
  }
  const message =
    usable === total
      ? "All channels look usable."
      : `${total - usable} of ${total} channels look poor and will be left out until they recover.`;
  return { status: "ready", usable, total, message };
}

/** Mean individual alpha peak across channels that found one, or NaN. */
export function meanPeakAlpha(result: PipelineResult | undefined): number {
  if (!result) return Number.NaN;
  const peaks = result.channels.map((c) => c.peakAlpha).filter(Number.isFinite);
  if (peaks.length === 0) return Number.NaN;
  return peaks.reduce((a, b) => a + b, 0) / peaks.length;
}
