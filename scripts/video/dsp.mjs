// Liten ljudsyntes utan beroenden: oscillatorer, envelopes, filter, reverb och
// en WAV-skrivare. Används av audio.mjs för musik och ljudeffekter i promovideor.

export const SR = 48000;

/** Deterministisk slump, så att samma video alltid låter likadant. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
}

export const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

/** Stereobuss: två Float32Array. */
export function bus(seconds) {
  const n = Math.ceil(seconds * SR);
  return [new Float32Array(n), new Float32Array(n)];
}

export function mixInto(dst, src, at = 0, gain = 1, pan = 0) {
  const start = Math.round(at * SR);
  const [l, r] = src;
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < l.length; i++) {
    const j = start + i;
    if (j < 0) continue;
    if (j >= dst[0].length) break;
    dst[0][j] += l[i] * gl * Math.SQRT2;
    dst[1][j] += (r ?? l)[i] * gr * Math.SQRT2;
  }
}

/** Mono-buffer från en funktion av (i, t). */
export function render(seconds, fn) {
  const n = Math.max(1, Math.ceil(seconds * SR));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i, i / SR);
  return out;
}

export const stereo = (mono) => [mono, mono];

/** ADSR, tider i sekunder, gate = hur länge tonen hålls. */
export function adsr(t, gate, a, d, s, r) {
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < gate) return s;
  const rt = t - gate;
  if (rt >= r) return 0;
  const lvl = gate < a ? gate / a : gate < a + d ? 1 - (1 - s) * ((gate - a) / d) : s;
  return lvl * (1 - rt / r);
}

export const expDecay = (t, tau) => Math.exp(-t / tau);

/** Sågtand med polyBLEP (mindre vikning). */
export function saw(phase, dt) {
  let v = 2 * phase - 1;
  v -= polyBlep(phase, dt);
  return v;
}
export function square(phase, dt) {
  let v = phase < 0.5 ? 1 : -1;
  v += polyBlep(phase, dt);
  v -= polyBlep((phase + 0.5) % 1, dt);
  return v;
}
function polyBlep(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

/** Biquad-filter (RBJ). type: lowpass, highpass, bandpass. */
export class Biquad {
  constructor(type = "lowpass", freq = 1000, q = 0.707) {
    this.type = type;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(freq, q);
  }
  set(freq, q = this.q ?? 0.707) {
    this.q = q;
    const w = (2 * Math.PI * Math.min(freq, SR * 0.45)) / SR;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (this.type === "lowpass") [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
    else if (this.type === "highpass") [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
    else [b0, b1, b2] = [alpha, 0, -alpha];
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
  }
  process(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

export function filterBuffer(buf, type, freq, q = 0.707) {
  const f = new Biquad(type, freq, q);
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = f.process(buf[i]);
  return out;
}

/** Stereo ping-pong-delay. */
export function pingPong([l, r], time, feedback = 0.35, mix = 0.3, tone = 3500) {
  const d = Math.round(time * SR);
  const bl = new Float32Array(d);
  const br = new Float32Array(d);
  const fl = new Biquad("lowpass", tone);
  const fr = new Biquad("lowpass", tone);
  const ol = new Float32Array(l.length);
  const or = new Float32Array(r.length);
  let p = 0;
  for (let i = 0; i < l.length; i++) {
    const dl = bl[p];
    const dr = br[p];
    bl[p] = fl.process((l[i] + r[i]) * 0.5 + dr * feedback);
    br[p] = fr.process(dl * feedback);
    ol[i] = l[i] + dl * mix;
    or[i] = r[i] + dr * mix;
    p = (p + 1) % d;
  }
  return [ol, or];
}

/** Freeverb-liknande reverb. Returnerar bara den våta signalen. */
export function reverb([l, r], { size = 0.84, damp = 0.25, width = 1 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allps = [556, 441, 341, 225];
  const scale = SR / 44100;
  const make = (spread) => ({
    c: combs.map((n) => ({ buf: new Float32Array(Math.round((n + spread) * scale)), p: 0, store: 0 })),
    a: allps.map((n) => ({ buf: new Float32Array(Math.round((n + spread) * scale)), p: 0 })),
  });
  const chans = [make(0), make(23)];
  const out = [new Float32Array(l.length), new Float32Array(l.length)];
  for (let i = 0; i < l.length; i++) {
    const input = (l[i] + r[i]) * 0.015;
    for (let ch = 0; ch < 2; ch++) {
      const { c, a } = chans[ch];
      let acc = 0;
      for (const cf of c) {
        const y = cf.buf[cf.p];
        cf.store = y * (1 - damp) + cf.store * damp;
        cf.buf[cf.p] = input + cf.store * size;
        cf.p = (cf.p + 1) % cf.buf.length;
        acc += y;
      }
      for (const ap of a) {
        const b = ap.buf[ap.p];
        const y = -acc + b;
        ap.buf[ap.p] = acc + b * 0.5;
        ap.p = (ap.p + 1) % ap.buf.length;
        acc = y;
      }
      out[ch][i] = acc;
    }
  }
  if (width < 1) {
    for (let i = 0; i < l.length; i++) {
      const m = (out[0][i] + out[1][i]) / 2;
      out[0][i] = m + (out[0][i] - m) * width;
      out[1][i] = m + (out[1][i] - m) * width;
    }
  }
  return out;
}

export function writeWav(path, [l, r], writeFileSync) {
  const n = l.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, l[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, r[i])) * 32767), 46 + i * 4);
  }
  writeFileSync(path, buf);
}
