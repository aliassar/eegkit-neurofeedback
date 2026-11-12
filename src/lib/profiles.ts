/** Child profiles: each child has a name, a buddy (avatar) and their own training plan. */
import { DEFAULT_PROTOCOL, getProtocol, type ProtocolId } from "./protocols";
import { oneOf } from "./settings";

/** Number of buddy designs; see the Buddy component. */
export const AVATAR_COUNT = 6;
export const ROUND_CHOICES = [2, 3, 4, 5] as const;
export const ROUND_SECONDS_CHOICES = [60, 90, 120, 180] as const;
export const BASELINE_CHOICES = [20, 30, 60] as const;
export const MAX_NAME_LENGTH = 20;

export interface Profile {
  readonly id: string;
  readonly name: string;
  /** Index of the buddy design, 0 … AVATAR_COUNT − 1. */
  readonly avatar: number;
  readonly protocol: ProtocolId;
  /** Rounds per session. */
  readonly rounds: number;
  readonly roundSeconds: number;
  /** Length of the resting baseline at the start of each session. */
  readonly baselineSeconds: number;
  readonly createdAt: string;
}

export const DEFAULT_PLAN = {
  protocol: DEFAULT_PROTOCOL,
  rounds: 4,
  roundSeconds: 120,
  baselineSeconds: 30,
} as const;

/** Returns an error message, or null when the name is fine. */
export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Enter a first name or nickname";
  if (trimmed.length > MAX_NAME_LENGTH) return `At most ${MAX_NAME_LENGTH} characters`;
  return null;
}

/** A short random id, unique enough for records on one device. */
export function newId(now: number = Date.now()): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createProfile(
  name: string,
  avatar: number,
  now: Date = new Date(),
  id: string = newId(now.getTime()),
): Profile {
  return {
    id,
    name: name.trim().slice(0, MAX_NAME_LENGTH),
    avatar: ((Math.round(avatar) % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT,
    ...DEFAULT_PLAN,
    createdAt: now.toISOString(),
  };
}

/** Reads stored profiles, dropping malformed ones and defaulting bad plan fields. Never throws. */
export function parseProfiles(json: string | null | undefined): Profile[] {
  if (!json) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const profiles: Profile[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (item === null || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.id !== "string" || seen.has(r.id)) continue;
    if (typeof r.name !== "string" || validateName(r.name) !== null) continue;
    seen.add(r.id);
    profiles.push({
      id: r.id,
      name: r.name.trim(),
      avatar:
        typeof r.avatar === "number" && Number.isInteger(r.avatar) && r.avatar >= 0
          ? r.avatar % AVATAR_COUNT
          : 0,
      protocol:
        typeof r.protocol === "string" && getProtocol(r.protocol)
          ? (r.protocol as ProtocolId)
          : DEFAULT_PLAN.protocol,
      rounds: oneOf(r.rounds, ROUND_CHOICES, DEFAULT_PLAN.rounds),
      roundSeconds: oneOf(r.roundSeconds, ROUND_SECONDS_CHOICES, DEFAULT_PLAN.roundSeconds),
      baselineSeconds: oneOf(r.baselineSeconds, BASELINE_CHOICES, DEFAULT_PLAN.baselineSeconds),
      createdAt:
        typeof r.createdAt === "string" && !Number.isNaN(Date.parse(r.createdAt))
          ? r.createdAt
          : new Date(0).toISOString(),
    });
  }
  return profiles;
}
