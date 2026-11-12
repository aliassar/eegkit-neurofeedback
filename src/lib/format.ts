/** Small formatting helpers for the grown-up screens. */

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

/** Mean of the finite values, or NaN. */
export function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? finite.reduce((a, b) => a + b, 0) / finite.length : Number.NaN;
}
