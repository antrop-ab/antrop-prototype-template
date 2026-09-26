// Färgmatematik för temaskriptet: hex <-> OKLCH och WCAG-kontrast.
// Inga beroenden, så att skriptet går att köra direkt efter en kloning.

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function parseHex(hex) {
  const m = String(hex).trim().replace(/^#/, "");
  const full = m.length === 3 ? [...m].map((c) => c + c).join("") : m;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`Ogiltig hexfärg: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToOklch([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c: C, h: H };
}

function oklchToLinear({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

export function inGamut(color) {
  return oklchToLinear(color).every((v) => v >= -0.0001 && v <= 1.0001);
}

/** Sänker kroman tills färgen ryms i sRGB. */
export function toGamut(color) {
  let c = color.c;
  while (c > 0 && !inGamut({ ...color, c })) c -= 0.002;
  return { ...color, c: Math.max(0, c) };
}

export function oklchToHex(color) {
  const rgb = oklchToLinear(toGamut(color)).map((v) => Math.round(clamp01(fromLinear(clamp01(v))) * 255));
  return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function luminance(color) {
  const [r, g, b] = oklchToLinear(toGamut(color)).map(clamp01);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export function css({ l, c, h }, alpha) {
  const f = (v, d) => Number(v.toFixed(d));
  const body = c < 0.0005 ? `${f(l, 3)} 0 0` : `${f(l, 3)} ${f(c, 3)} ${f(h, 1)}`;
  return alpha === undefined ? `oklch(${body})` : `oklch(${body} / ${alpha})`;
}

/** Justerar ljusheten tills kontrasten mot `against` är minst `min`. */
export function ensureContrast(color, against, min, direction) {
  let next = { ...color };
  for (let i = 0; i < 100 && contrast(next, against) < min; i++) {
    next = toGamut({ ...next, l: clamp01(next.l + direction * 0.01) });
  }
  return next;
}
