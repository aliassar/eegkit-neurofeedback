/**
 * The token economy: stars from every round and badges for showing up. Badges
 * reward practice (sessions played, stars collected over time), never a
 * single session's score, so nothing a child sees depends on a "bad" day.
 */
import { GAMES } from "./games";
import type { SessionRecord } from "./records";

export interface Badge {
  readonly id: string;
  readonly title: string;
  /** Which picture to draw. */
  readonly icon: "star" | "balloon" | "flower" | "boat" | "medal" | "trophy";
}

const GAME_ICONS = { balloon: "balloon", garden: "flower", river: "boat" } as const;

export function totalStars(sessions: readonly SessionRecord[]): number {
  let stars = 0;
  for (const s of sessions) for (const r of s.rounds) stars += r.stars;
  return stars;
}

/** Badges earned so far, in the order they are usually earned. */
export function earnedBadges(sessions: readonly SessionRecord[]): Badge[] {
  const badges: Badge[] = [];
  const played = sessions.length;
  if (played >= 1) badges.push({ id: "first", title: "First Game", icon: "star" });
  for (const game of GAMES) {
    if (sessions.some((s) => s.game === game.id)) {
      badges.push({ id: `game-${game.id}`, title: game.badge, icon: GAME_ICONS[game.id] });
    }
  }
  if (played >= 5) badges.push({ id: "five", title: "Five Sessions", icon: "medal" });
  if (played >= 10) badges.push({ id: "ten", title: "Ten Sessions", icon: "medal" });
  const stars = totalStars(sessions);
  if (stars >= 50) badges.push({ id: "stars-50", title: "Star Collector", icon: "trophy" });
  if (stars >= 200) badges.push({ id: "stars-200", title: "Star Champion", icon: "trophy" });
  return badges;
}

/** Badges in `after` that weren't in `before`, to celebrate at the end of a session. */
export function newBadges(before: readonly Badge[], after: readonly Badge[]): Badge[] {
  const had = new Set(before.map((b) => b.id));
  return after.filter((b) => !had.has(b.id));
}

/** A warm line for the end of a session; it depends on effort, never on the score. */
export function celebrationMessage(roundsPlayed: number, seed: number): string {
  const lines = [
    "Great practice today!",
    "You kept going. Well done!",
    "Wonderful effort!",
    "You played like a star!",
  ];
  if (roundsPlayed === 0) return "Thanks for trying! See you next time.";
  return lines[Math.abs(Math.floor(seed)) % lines.length] as string;
}
