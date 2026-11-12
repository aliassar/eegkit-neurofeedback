import type { RoundSummary } from "../src/lib/focus-meter";
import { createProfile } from "../src/lib/profiles";
import type { FocusCheckRecord, SessionRecord } from "../src/lib/records";

export const profile = createProfile("Sam O'Neil", 1, new Date("2026-11-01T09:00:00Z"), "kid-1");

export const round = (overrides: Partial<RoundSummary> = {}): RoundSummary => ({
  durationSeconds: 120,
  focusedFraction: 0.5,
  longestStreakSeconds: 14.5,
  meanScore: 0.61,
  stars: 8,
  series: [0.5, 0.7],
  ...overrides,
});

export const session = (overrides: Partial<SessionRecord> = {}): SessionRecord => ({
  id: "s1",
  profileId: "kid-1",
  game: "balloon",
  protocol: "tbr",
  startedAt: "2026-11-10T16:00:00.000Z",
  source: "demo",
  baselineSeconds: 30,
  channels: ["Cz"],
  rounds: [round()],
  completed: true,
  ...overrides,
});

export const check = (overrides: Partial<FocusCheckRecord> = {}): FocusCheckRecord => ({
  id: "c1",
  profileId: "kid-1",
  startedAt: "2026-11-11T16:00:00.000Z",
  source: "demo",
  durationSeconds: 150,
  goTrials: 45,
  noGoTrials: 15,
  hits: 42,
  omissions: 3,
  commissions: 4,
  meanRtMs: 480,
  rtSdMs: 110,
  protocol: "tbr",
  eegMetric: 2.4,
  ...overrides,
});
