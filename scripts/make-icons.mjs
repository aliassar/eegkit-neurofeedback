// Renders the app icons (a glowing orb crossed by an EEG trace) into assets/.
// No image tools needed: pixels are computed here and written as PNG with zlib.
// Usage: node scripts/make-icons.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const BACKGROUND = [10, 14, 23];
const INNER = [125, 240, 214]; // mint
const OUTER = [109, 94, 252]; // violet

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};
const encodePng = (size, rgba) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

/** An alpha-like burst: a sine under a Gaussian envelope, in orb-radius units. */
const wave = (k) => 0.3 * Math.sin(k * 6.5) * Math.exp(-((k * 0.95) ** 2));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const smoothstep = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

/** @param {number} size @param {{ background: boolean, scale: number }} options */
function render(size, { background, scale }) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = 0.3 * scale;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // Centre-origin coordinates in [-0.5, 0.5].
      const x = (px + 0.5) / size - 0.5;
      const y = (py + 0.5) / size - 0.5;
      const r = Math.hypot(x, y);
      let color = background ? [...BACKGROUND] : [0, 0, 0];
      let alpha = background ? 1 : 0;
      const over = (c, a) => {
        const outA = a + alpha * (1 - a);
        if (outA > 0) color = color.map((v, i) => (c[i] * a + v * alpha * (1 - a)) / outA);
        alpha = outA;
      };
      // Soft halo.
      const halo = Math.exp(-(((r - radius) / (0.16 * scale)) ** 2)) * 0.35 * (r > radius ? 1 : 0);
      if (halo > 0) over(OUTER, halo);
      // Orb body with a radial gradient and an anti-aliased edge.
      const edge = 1 - smoothstep(radius - 1.5 / size, radius + 1.5 / size, r);
      if (edge > 0) {
        const t = Math.min(Math.hypot(x + 0.08 * scale, y + 0.1 * scale) / (radius * 1.3), 1);
        over(mix(INNER, OUTER, t ** 0.9), edge);
      }
      // EEG-like trace across the orb.
      const u = x / radius;
      const v = y / radius;
      if (Math.abs(u) < 1.6 && Math.abs(v) < 0.5) {
        // Exact distance to the curve by sampling it near this pixel.
        let dist = Number.POSITIVE_INFINITY;
        for (let k = u - 0.25; k <= u + 0.25; k += 0.004) {
          dist = Math.min(dist, Math.hypot(k - u, v - wave(k)));
        }
        const width = 0.045;
        const aa = 1.2 / (size * radius);
        const fade = 1 - smoothstep(1.1, 1.6, Math.abs(u));
        const ink = (1 - smoothstep(width - aa, width + aa, dist)) * fade;
        if (ink > 0) over([245, 248, 255], ink * 0.95);
      }
      const o = (py * size + px) * 4;
      rgba[o] = Math.round(color[0]);
      rgba[o + 1] = Math.round(color[1]);
      rgba[o + 2] = Math.round(color[2]);
      rgba[o + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, rgba);
}

const out = new URL("../assets/", import.meta.url);
writeFileSync(new URL("icon.png", out), render(1024, { background: true, scale: 1 }));
// Android adaptive icons are masked to the central ~66 %, so keep the orb smaller.
writeFileSync(new URL("adaptive-icon.png", out), render(1024, { background: false, scale: 0.72 }));
writeFileSync(new URL("favicon.png", out), render(64, { background: true, scale: 1.25 }));
console.log("Wrote assets/icon.png, assets/adaptive-icon.png and assets/favicon.png");
