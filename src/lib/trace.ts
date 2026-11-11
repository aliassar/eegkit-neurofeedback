/** Geometry for drawing scrolling traces and simple line charts as SVG paths. */

const round = (v: number) => Math.round(v * 10) / 10;

/**
 * An SVG path for the newest samples of a scrolling trace. The newest sample
 * sits at the right edge; a buffer that isn't full yet starts part-way across.
 * Long buffers are reduced to a min/max pair per pixel column, so the path
 * stays small without hiding spikes.
 *
 * @param samples Oldest first, in µV.
 * @param capacity Samples that fill the full width.
 * @param microvolts Half-range: ±microvolts maps to the full height. Values beyond are clamped.
 */
export function tracePath(
  samples: ArrayLike<number>,
  capacity: number,
  width: number,
  height: number,
  microvolts: number,
): string {
  const n = Math.min(samples.length, capacity);
  if (n < 2 || width <= 0 || height <= 0 || capacity < 2) return "";
  const offset = samples.length - n;
  const mid = height / 2;
  const scale = mid / microvolts;
  const y = (v: number) => round(Math.min(Math.max(mid - v * scale, 0), height));
  const xOf = (i: number) => round(width - ((n - 1 - i) / (capacity - 1)) * width);

  const columns = Math.ceil(width);
  const parts: string[] = [];
  if (n <= columns * 2) {
    for (let i = 0; i < n; i++) {
      const v = samples[offset + i] as number;
      parts.push(`${i === 0 ? "M" : "L"}${xOf(i)} ${y(Number.isFinite(v) ? v : 0)}`);
    }
    return parts.join("");
  }
  const perColumn = (capacity - 1) / width;
  let i = 0;
  let boundary = 0;
  while (i < n) {
    boundary += perColumn;
    const end = Math.min(n, Math.max(i + 1, Math.round(boundary)));
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    let loAt = i;
    let hiAt = i;
    for (let k = i; k < end; k++) {
      const v = samples[offset + k] as number;
      if (!Number.isFinite(v)) continue;
      if (v < lo) {
        lo = v;
        loAt = k;
      }
      if (v > hi) {
        hi = v;
        hiAt = k;
      }
    }
    if (lo <= hi) {
      // Keep time order inside the column so the line doesn't zig-zag backwards.
      const [a, b] = loAt <= hiAt ? [lo, hi] : [hi, lo];
      const x = xOf(i);
      parts.push(`${parts.length === 0 ? "M" : "L"}${x} ${y(a)}L${x} ${y(b)}`);
    }
    i = end;
  }
  return parts.join("");
}

/**
 * Points for a line chart of 0–1 values across `width`, skipping NaN gaps
 * (each run of finite values becomes its own `M…L…` segment).
 */
export function seriesPath(values: readonly number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  let path = "";
  let pen = false;
  values.forEach((value, i) => {
    if (!Number.isFinite(value)) {
      pen = false;
      return;
    }
    const x = values.length > 1 ? i * step : width / 2;
    const yv = height - Math.min(Math.max(value, 0), 1) * height;
    path += `${pen ? "L" : "M"}${round(x)} ${round(yv)}`;
    pen = true;
  });
  return path;
}
