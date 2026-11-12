/** Export of one child's data as CSV (one row per round / per focus check) or JSON. */
import { totalRounds } from "./focus-meter";
import type { Profile } from "./profiles";
import type { FocusCheckRecord, SessionRecord } from "./records";

/** Bump when the JSON shape changes. */
export const EXPORT_VERSION = 1;

/** Quotes a CSV field when needed (RFC 4180). Numbers keep up to 4 decimals; NaN is empty. */
export function csvField(value: string | number | boolean | null): string {
  if (value === null) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(Math.round(value * 10_000) / 10_000) : "";
  }
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const row = (fields: readonly (string | number | boolean | null)[]) =>
  fields.map(csvField).join(",");

export const SESSION_COLUMNS = [
  "child",
  "session_id",
  "started_at",
  "game",
  "protocol",
  "source",
  "baseline_s",
  "channels",
  "completed",
  "round",
  "duration_s",
  "focused_fraction",
  "longest_streak_s",
  "mean_score",
  "stars",
] as const;

/** One row per round, oldest session first. */
export function sessionsToCsv(profile: Profile, sessions: readonly SessionRecord[]): string {
  const lines = [SESSION_COLUMNS.join(",")];
  const ordered = [...sessions].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  for (const s of ordered) {
    s.rounds.forEach((r, i) => {
      lines.push(
        row([
          profile.name,
          s.id,
          s.startedAt,
          s.game,
          s.protocol,
          s.source,
          s.baselineSeconds,
          s.channels.join(" "),
          s.completed,
          i + 1,
          r.durationSeconds,
          r.focusedFraction,
          r.longestStreakSeconds,
          r.meanScore,
          r.stars,
        ]),
      );
    });
  }
  return `${lines.join("\r\n")}\r\n`;
}

export const CHECK_COLUMNS = [
  "child",
  "check_id",
  "started_at",
  "source",
  "duration_s",
  "go_trials",
  "nogo_trials",
  "hits",
  "omissions",
  "commissions",
  "mean_rt_ms",
  "rt_sd_ms",
  "protocol",
  "eeg_metric",
] as const;

export function focusChecksToCsv(profile: Profile, checks: readonly FocusCheckRecord[]): string {
  const lines = [CHECK_COLUMNS.join(",")];
  const ordered = [...checks].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  for (const c of ordered) {
    lines.push(
      row([
        profile.name,
        c.id,
        c.startedAt,
        c.source,
        c.durationSeconds,
        c.goTrials,
        c.noGoTrials,
        c.hits,
        c.omissions,
        c.commissions,
        c.meanRtMs,
        c.rtSdMs,
        c.protocol,
        c.eegMetric,
      ]),
    );
  }
  return `${lines.join("\r\n")}\r\n`;
}

/** Everything about one child, with per-session totals added for convenience. */
export function exportJson(
  profile: Profile,
  sessions: readonly SessionRecord[],
  checks: readonly FocusCheckRecord[],
  exportedAt: Date = new Date(),
): string {
  // JSON can't hold NaN; write null, which the app also reads back as NaN.
  const replacer = (_key: string, value: unknown) =>
    typeof value === "number" && !Number.isFinite(value) ? null : value;
  return JSON.stringify(
    {
      format: "eegkit-neurofeedback/child-export",
      version: EXPORT_VERSION,
      exportedAt: exportedAt.toISOString(),
      note: "Practice data from a neurofeedback game. Not a medical record or a diagnostic result.",
      profile,
      sessions: sessions.map((s) => ({ ...s, totals: totalRounds(s.rounds) })),
      focusChecks: checks,
    },
    replacer,
    2,
  );
}

/** `"Sam O'Neil"`, 2026-11-12 → `"sam-o-neil-2026-11-12"`. */
export function exportBaseName(profile: Profile, date: Date = new Date()): string {
  const slug =
    profile.name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "child";
  return `${slug}-${date.toISOString().slice(0, 10)}`;
}
