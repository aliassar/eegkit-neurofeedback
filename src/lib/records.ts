/** Stored training sessions and focus checks, per child. */

import type { RoundSummary } from "./focus-meter";
import { type GameId, getGame } from "./games";
import { getProtocol, type ProtocolId } from "./protocols";
import type { SourceKind } from "./settings";

export interface SessionRecord {
  readonly id: string;
  readonly profileId: string;
  readonly game: GameId;
  readonly protocol: ProtocolId;
  /** ISO time the first round started. */
  readonly startedAt: string;
  readonly source: SourceKind;
  readonly baselineSeconds: number;
  readonly channels: readonly string[];
  readonly rounds: readonly RoundSummary[];
  /** True when the child finished every planned round. */
  readonly completed: boolean;
}

export interface FocusCheckRecord {
  readonly id: string;
  readonly profileId: string;
  readonly startedAt: string;
  readonly source: SourceKind | null;
  readonly durationSeconds: number;
  readonly goTrials: number;
  readonly noGoTrials: number;
  /** Go trials with a response. */
  readonly hits: number;
  /** Go trials without a response. */
  readonly omissions: number;
  /** No-go trials with a response. */
  readonly commissions: number;
  /** Mean and standard deviation of hit reaction times, ms (NaN without hits). */
  readonly meanRtMs: number;
  readonly rtSdMs: number;
  /** Protocol whose metric was recorded, or null without EEG. */
  readonly protocol: ProtocolId | null;
  /** Mean of the protocol's metric during the task (e.g. the theta/beta ratio), or NaN. */
  readonly eegMetric: number;
}

const isNum = (v: unknown): v is number => typeof v === "number";
/** JSON turns NaN into null; read it back as NaN. */
const num = (v: unknown): number => (isNum(v) ? v : Number.NaN);
const parseArray = (json: string | null | undefined): unknown[] => {
  if (!json) return [];
  try {
    const raw: unknown = JSON.parse(json);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};
const validDate = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));
const newestFirst = <T extends { startedAt: string }>(a: T, b: T) =>
  Date.parse(b.startedAt) - Date.parse(a.startedAt);

function parseRound(v: unknown): RoundSummary | null {
  if (v === null || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  if (!isNum(r.durationSeconds) || !isNum(r.focusedFraction) || !isNum(r.stars)) return null;
  return {
    durationSeconds: r.durationSeconds,
    focusedFraction: r.focusedFraction,
    longestStreakSeconds: isNum(r.longestStreakSeconds) ? r.longestStreakSeconds : 0,
    meanScore: num(r.meanScore),
    stars: r.stars,
    series: Array.isArray(r.series) ? r.series.map(num) : [],
  };
}

/** Reads stored sessions, dropping malformed ones. Never throws. Newest first. */
export function parseSessions(json: string | null | undefined): SessionRecord[] {
  const out: SessionRecord[] = [];
  for (const item of parseArray(json)) {
    if (item === null || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (
      typeof r.id !== "string" ||
      typeof r.profileId !== "string" ||
      typeof r.game !== "string" ||
      !getGame(r.game) ||
      typeof r.protocol !== "string" ||
      !getProtocol(r.protocol) ||
      !validDate(r.startedAt) ||
      (r.source !== "demo" && r.source !== "websocket") ||
      !Array.isArray(r.rounds)
    ) {
      continue;
    }
    const rounds = r.rounds.map(parseRound).filter((x): x is RoundSummary => x !== null);
    if (rounds.length === 0) continue;
    out.push({
      id: r.id,
      profileId: r.profileId,
      game: r.game as GameId,
      protocol: r.protocol as ProtocolId,
      startedAt: r.startedAt,
      source: r.source,
      baselineSeconds: isNum(r.baselineSeconds) ? r.baselineSeconds : 0,
      channels: Array.isArray(r.channels)
        ? r.channels.filter((c): c is string => typeof c === "string")
        : [],
      rounds,
      completed: r.completed === true,
    });
  }
  return out.sort(newestFirst);
}

/** Reads stored focus checks, dropping malformed ones. Never throws. Newest first. */
export function parseFocusChecks(json: string | null | undefined): FocusCheckRecord[] {
  const out: FocusCheckRecord[] = [];
  for (const item of parseArray(json)) {
    if (item === null || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (
      typeof r.id !== "string" ||
      typeof r.profileId !== "string" ||
      !validDate(r.startedAt) ||
      !isNum(r.goTrials) ||
      !isNum(r.noGoTrials) ||
      !isNum(r.hits) ||
      !isNum(r.omissions) ||
      !isNum(r.commissions)
    ) {
      continue;
    }
    out.push({
      id: r.id,
      profileId: r.profileId,
      startedAt: r.startedAt,
      source: r.source === "demo" || r.source === "websocket" ? r.source : null,
      durationSeconds: isNum(r.durationSeconds) ? r.durationSeconds : 0,
      goTrials: r.goTrials,
      noGoTrials: r.noGoTrials,
      hits: r.hits,
      omissions: r.omissions,
      commissions: r.commissions,
      meanRtMs: num(r.meanRtMs),
      rtSdMs: num(r.rtSdMs),
      protocol:
        typeof r.protocol === "string" && getProtocol(r.protocol)
          ? (r.protocol as ProtocolId)
          : null,
      eegMetric: num(r.eegMetric),
    });
  }
  return out.sort(newestFirst);
}
