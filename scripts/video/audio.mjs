// Musik och ljudeffekter för promovideor, syntetiserat från grunden.
//
// renderSoundtrack({ duration, music, cues }) returnerar en stereobuss.
//   music: { bpm, chords, sections: [{ start, end, energy }], drops: [t], end: t }
//     energy 0 = bara pad, 1 = + arpeggio, 2 = + trummor och bas, 3 = allt, tätare
//   cues:  [{ type, t, ...params }] från videons tidslinje, till exempel
//     { type: "whoosh", t: 4.2 }, { type: "type", t: 10.1 }, { type: "chime", t: 30 }
//
// Allt är deterministiskt: samma tidslinje ger samma ljud.

import {
  SR, rng, mtof, bus, mixInto, render, stereo, adsr, expDecay, saw, square,
  Biquad, filterBuffer, pingPong, reverb,
} from "./dsp.mjs";

// Fmaj7, G(add9), Am7, Em7: ljust, framåtlutat, lite drömskt.
const DEFAULT_CHORDS = [
  { bass: 41, notes: [53, 57, 60, 64] },
  { bass: 43, notes: [55, 59, 62, 69] },
  { bass: 45, notes: [57, 60, 64, 67] },
  { bass: 40, notes: [52, 55, 59, 62] },
];

export function renderSoundtrack({ duration, music = {}, cues = [] }) {
  const bpm = music.bpm ?? 112;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const chords = music.chords ?? DEFAULT_CHORDS;
  const sections = music.sections ?? [{ start: 0, end: duration, energy: 2 }];
  const end = music.end ?? duration;
  const energyAt = (t) => sections.find((s) => t >= s.start && t < s.end)?.energy ?? -1;
  const chordAt = (t) => chords[Math.floor(Math.max(0, t) / bar) % chords.length];

  const musicBus = bus(duration + 3); // trummor och nedslag
  const harmBus = bus(duration + 3); // pad, arpeggio och bas: pumpar med baskaggen
  const sendBus = bus(duration + 3); // till reverb
  const sfxBus = bus(duration + 3);
  const kicks = [];

  // Pad: en ackordton per takt, tre lätt ostämda sågtänder genom ett mjukt lågpass.
  for (let t = 0; t < end; t += bar) {
    if (energyAt(t) < 0) continue;
    const c = chordAt(t);
    const gate = Math.min(bar, end - t);
    c.notes.forEach((n, k) => {
      const buf = padVoice(mtof(n), gate + 0.05, 1.6, k);
      mixInto(harmBus, buf, t, 0.075, k % 2 ? 0.45 : -0.45);
      mixInto(sendBus, buf, t, 0.05, k % 2 ? 0.45 : -0.45);
    });
  }

  // Arpeggio: sextondelar över ackordtonerna, med ping-pong-delay.
  const arp = bus(duration + 3);
  const pattern = [0, 2, 1, 3, 2, 4, 1, 3];
  for (let i = 0, t = 0; t < end; i++, t = i * (beat / 4)) {
    const e = energyAt(t);
    if (e < 1) continue;
    if (e === 1 && i % 2) continue; // åttondelar när det är lugnt
    const c = chordAt(t);
    const tones = [...c.notes, c.notes[0] + 12, c.notes[1] + 12].map((n) => n + 12);
    const n = tones[pattern[i % pattern.length] % tones.length];
    const accent = i % 4 === 0 ? 1 : 0.7;
    mixInto(arp, pluck(mtof(n), e >= 3 ? 0.16 : 0.22), t, 0.06 * accent, (i % 2 ? 0.3 : -0.3));
  }
  const arpWet = pingPong(arp, beat * 0.75, 0.38, 0.35);
  mixInto(harmBus, arpWet, 0, 1);
  mixInto(sendBus, arpWet, 0, 0.6);

  // Trummor och bas.
  for (let i = 0, t = 0; t < end; i++, t = i * (beat / 2)) {
    const e = energyAt(t);
    const onBeat = i % 2 === 0;
    const beatIdx = Math.floor(i / 2) % 4;
    if (e >= 2 && onBeat) {
      mixInto(musicBus, stereo(kick()), t, 0.4);
      kicks.push(t);
    }
    if (e === 1 && onBeat && beatIdx === 0) {
      mixInto(musicBus, stereo(kick(0.6)), t, 0.35);
      kicks.push(t);
    }
    if (e >= 2 && !onBeat) mixInto(musicBus, stereo(hat(0.035, i)), t, 0.08, 0.25);
    if (e >= 3 && onBeat) mixInto(musicBus, stereo(hat(0.02, i + 7)), t + beat / 4, 0.045, -0.25);
    if (e >= 2 && onBeat && (beatIdx === 1 || beatIdx === 3)) {
      const c = clap(i);
      mixInto(musicBus, stereo(c), t, 0.11);
      mixInto(sendBus, stereo(c), t, 0.2);
    }
    if (e >= 2 && onBeat) {
      const c = chordAt(t);
      const len = e >= 3 ? beat * 0.9 : beat;
      mixInto(harmBus, stereo(bassVoice(mtof(c.bass), len)), t, 0.2);
    }
  }

  // Risers före varje drop, och ett nedslag på droppen.
  for (const d of music.drops ?? []) {
    mixInto(musicBus, riser(Math.min(d, bar * 2)), d - Math.min(d, bar * 2), 0.12);
    const hit = impact();
    mixInto(musicBus, hit, d, 0.26);
    mixInto(sendBus, hit, d, 0.25);
  }
  // Slutackord.
  if (music.end) {
    const c = chords[0];
    [...c.notes, c.notes[0] + 12, c.bass + 12].forEach((n, k) => {
      const buf = padVoice(mtof(n), 1.6, 2.4, k);
      mixInto(harmBus, buf, music.end, 0.06, k % 2 ? 0.4 : -0.4);
      mixInto(sendBus, buf, music.end, 0.08);
    });
    const hit = impact(0.8);
    mixInto(musicBus, hit, music.end, 0.22);
    mixInto(sendBus, hit, music.end, 0.25);
  }

  // Sidechain: allt musikaliskt utom trummorna pumpar med baskaggen.
  const duck = new Float32Array(musicBus[0].length).fill(1);
  for (const k of kicks) {
    const s = Math.round(k * SR);
    for (let i = 0; i < SR * 0.3 && s + i < duck.length; i++) {
      duck[s + i] = Math.min(duck[s + i], 1 - 0.45 * Math.exp(-i / SR / 0.09));
    }
  }
  for (const ch of [0, 1]) {
    for (let i = 0; i < duck.length; i++) {
      musicBus[ch][i] += harmBus[ch][i] * duck[i];
      sendBus[ch][i] *= 0.6 + 0.4 * duck[i];
    }
  }

  // Ljudeffekter.
  const random = rng(7);
  for (const c of cues) {
    const fx = SFX[c.type];
    if (!fx) continue;
    const { buf, gain = 1, pan = 0, send = 0.2 } = fx(c, random);
    mixInto(sfxBus, buf, c.t, gain * (c.gain ?? 1), c.pan ?? pan);
    mixInto(sendBus, buf, c.t, gain * send * (c.gain ?? 1), c.pan ?? pan);
  }

  // Mix och master.
  const wet = reverb(sendBus, { size: 0.86, damp: 0.3 });
  const master = bus(duration);
  const n = master[0].length;
  const fadeOutStart = music.fadeOut ?? duration - 1.5;
  const hp = [new Biquad("highpass", 28), new Biquad("highpass", 28)];
  let peak = 0;
  for (const ch of [0, 1]) {
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let x = musicBus[ch][i] + sfxBus[ch][i] + wet[ch][i] * 0.9;
      x = hp[ch].process(x);
      const fade = Math.min(1, t / 0.15) * (t > fadeOutStart ? Math.max(0, 1 - (t - fadeOutStart) / (duration - fadeOutStart)) : 1);
      x = Math.tanh(x * 1.4) / Math.tanh(1.4);
      master[ch][i] = x * fade;
      peak = Math.max(peak, Math.abs(master[ch][i]));
    }
  }
  const norm = 0.89 / (peak || 1);
  for (const ch of [0, 1]) for (let i = 0; i < n; i++) master[ch][i] *= norm;
  return master;
}

// --- Instrument --------------------------------------------------------------

function padVoice(freq, gate, release, seed) {
  const len = gate + release;
  const detune = [-0.12, 0, 0.11];
  const phases = [0, 0.33, 0.66].map((p) => (p + seed * 0.17) % 1);
  const lp = new Biquad("lowpass", 900, 0.6);
  return stereo(render(len, (i, t) => {
    let v = 0;
    detune.forEach((d, k) => {
      const f = freq * 2 ** (d / 12);
      phases[k] = (phases[k] + f / SR) % 1;
      v += saw(phases[k], f / SR);
    });
    if (i % 64 === 0) lp.set(700 + 500 * (0.5 + 0.5 * Math.sin(t * 0.7 + seed)), 0.6);
    return lp.process(v / 3) * adsr(t, gate, 0.5, 0.6, 0.75, release);
  }));
}

function pluck(freq, decay) {
  let p1 = 0;
  let p2 = 0.25;
  const lp = new Biquad("lowpass", 5000, 1.1);
  return stereo(render(decay * 5, (i, t) => {
    p1 = (p1 + freq / SR) % 1;
    p2 = (p2 + (freq * 1.003) / SR) % 1;
    if (i % 32 === 0) lp.set(600 + 3600 * expDecay(t, 0.05), 1.1);
    const v = saw(p1, freq / SR) * 0.6 + square(p2, (freq * 1.003) / SR) * 0.4;
    return lp.process(v) * expDecay(t, decay) * Math.min(1, t / 0.002);
  }));
}

function bassVoice(freq, len) {
  let p = 0;
  let p2 = 0;
  const lp = new Biquad("lowpass", 220, 0.8);
  return render(len + 0.05, (i, t) => {
    p = (p + freq / SR) % 1;
    p2 = (p2 + (freq * 2) / SR) % 1;
    const v = Math.sin(2 * Math.PI * p) * 0.9 + lp.process(saw(p2, (freq * 2) / SR)) * 0.25;
    return Math.tanh(v * 1.3) * adsr(t, len, 0.005, 0.15, 0.7, 0.05);
  });
}

function kick(level = 1) {
  let p = 0;
  const r = rng(3);
  return render(0.45, (i, t) => {
    const f = 46 + 110 * Math.exp(-t / 0.035);
    p += f / SR;
    const body = Math.sin(2 * Math.PI * p) * expDecay(t, 0.22);
    const click = t < 0.003 ? r() * (1 - t / 0.003) * 0.5 : 0;
    return Math.tanh((body + click) * 1.6) * level;
  });
}

function hat(decay, seed) {
  const r = rng(11 + seed);
  const hp = new Biquad("highpass", 7500, 0.7);
  return render(decay * 5, (i, t) => hp.process(r()) * expDecay(t, decay));
}

function clap(seed) {
  const r = rng(21 + seed);
  const bp = new Biquad("bandpass", 1300, 0.9);
  return render(0.35, (i, t) => {
    const bursts = [0, 0.011, 0.022].reduce((a, o) => a + (t >= o ? expDecay(t - o, 0.006) : 0), 0);
    return bp.process(r()) * (bursts * 0.6 + (t > 0.022 ? expDecay(t - 0.022, 0.11) : 0));
  });
}

function riser(len) {
  const r = rng(31);
  const bp = new Biquad("bandpass", 400, 1.2);
  let p = 0;
  return stereo(render(len, (i, t) => {
    const x = t / len;
    if (i % 32 === 0) bp.set(300 * 2 ** (x * 5), 1.4);
    const f = 110 * 2 ** (x * 2);
    p = (p + f / SR) % 1;
    return (bp.process(r()) * 0.8 + saw(p, f / SR) * 0.08 * x) * x * x;
  }));
}

function impact(level = 1) {
  let p = 0;
  const r = rng(41);
  const lp = new Biquad("lowpass", 1800);
  return stereo(render(2.2, (i, t) => {
    const f = 34 + 60 * Math.exp(-t / 0.06);
    p += f / SR;
    const boom = Math.sin(2 * Math.PI * p) * expDecay(t, 0.7);
    const air = lp.process(r()) * expDecay(t, 0.18) * 0.5;
    return Math.tanh((boom + air) * 1.4) * level;
  }));
}

function bell(freq, decay = 1.1, index = 2.2) {
  let pc = 0;
  let pm = 0;
  return render(decay * 4, (i, t) => {
    pm = (pm + (freq * 3.5) / SR) % 1;
    const mod = Math.sin(2 * Math.PI * pm) * index * expDecay(t, decay * 0.35);
    pc = (pc + freq / SR) % 1;
    return Math.sin(2 * Math.PI * pc + mod) * expDecay(t, decay) * Math.min(1, t / 0.002);
  });
}

// --- Ljudeffekter ------------------------------------------------------------

const SFX = {
  // Tangenttryck när text skrivs.
  type: (c, random) => {
    const r = rng(Math.floor((random() + 1) * 1e6));
    const bp = new Biquad("bandpass", 2600 + random() * 1600, 1.4);
    const buf = render(0.05, (i, t) => bp.process(r()) * expDecay(t, 0.006) + Math.sin(2 * Math.PI * 180 * t) * expDecay(t, 0.008) * 0.3);
    return { buf: stereo(buf), gain: 0.22 + random() * 0.06, pan: random() * 0.25, send: 0.05 };
  },
  // Klick på en knapp i gränssnittet.
  click: () => {
    const r = rng(5);
    const buf = render(0.08, (i, t) => Math.sin(2 * Math.PI * (1500 - 600 * Math.min(1, t / 0.02)) * t) * expDecay(t, 0.018) * 0.8 + r() * expDecay(t, 0.002) * 0.3);
    return { buf: stereo(buf), gain: 0.35, send: 0.1 };
  },
  // Något dyker upp.
  pop: (c) => {
    const f = c.freq ?? 880;
    const buf = render(0.25, (i, t) => Math.sin(2 * Math.PI * f * (1 + 0.5 * Math.exp(-t / 0.03)) * t) * expDecay(t, 0.07));
    return { buf: stereo(buf), gain: 0.18, send: 0.25 };
  },
  // Bock eller liten bekräftelse.
  tick: (c) => ({ buf: stereo(bell(c.freq ?? 1760, 0.18, 1.2)), gain: 0.14, send: 0.3 }),
  // Övergång mellan scener.
  whoosh: (c) => {
    const len = c.dur ?? 0.7;
    const r = rng(77);
    const bp = new Biquad("bandpass", 400, 1.1);
    const l = new Float32Array(Math.ceil(len * SR));
    const rr = new Float32Array(l.length);
    for (let i = 0; i < l.length; i++) {
      const x = i / l.length;
      if (i % 32 === 0) bp.set(350 * 2 ** (Math.sin(x * Math.PI) * 3.2), 1.2);
      const v = bp.process(r()) * Math.sin(x * Math.PI) ** 2;
      l[i] = v * (1 - x);
      rr[i] = v * x;
    }
    return { buf: [l, rr], gain: 0.5, send: 0.35 };
  },
  // Lyckat: två klockor i en ters.
  chime: () => {
    const a = bell(mtof(88), 1.3);
    const b = bell(mtof(95), 1.3);
    const out = new Float32Array(a.length + SR * 0.12);
    a.forEach((v, i) => (out[i] += v));
    b.forEach((v, i) => (out[i + Math.round(SR * 0.12)] += v * 0.8));
    return { buf: stereo(out), gain: 0.2, send: 0.6 };
  },
  // AI: glittrande arpeggio.
  shimmer: () => {
    const notes = [81, 84, 88, 91, 96];
    const out = new Float32Array(SR * 2);
    notes.forEach((n, k) => bell(mtof(n), 0.7, 0.9).forEach((v, i) => {
      const j = i + Math.round(k * 0.05 * SR);
      if (j < out.length) out[j] += v * (1 - k * 0.12);
    }));
    return { buf: stereo(out), gain: 0.12, send: 0.7 };
  },
  // Stort nedslag, t.ex. när logotypen visas.
  impact: () => ({ buf: impact(), gain: 0.3, send: 0.4 }),
  riser: (c) => ({ buf: riser(c.dur ?? 2), gain: 0.14, send: 0.3 }),
};
