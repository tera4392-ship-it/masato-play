// 効果音をコードで合成して out/se.wav を作る(BGMは別。mux.sh で合成)
import fs from 'fs';
import { SE, VID_DUR as DUR, tv } from './src/timeline.js';
const SR = 44100, N = Math.floor(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 12345; const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
function lp(buf, f) { const k = Math.exp(-2 * Math.PI * f / SR); let y = 0; for (let i = 0; i < buf.length; i++) { y = (1 - k) * buf[i] + k * y; buf[i] = y; } return buf; }
function hp(buf, f) { const o = Float32Array.from(buf); lp(o, f); for (let i = 0; i < buf.length; i++) buf[i] -= o[i]; return buf; }
const gen = (dur, fn) => { const n = Math.floor(dur * SR); const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = fn(i / SR, i); return b; };
const noise = dur => gen(dur, () => rand());
const sine = (f0, f1, dur, d) => { let ph = 0; return gen(dur, t => { const f = f0 + (f1 - f0) * Math.min(1, t / dur); ph += 2 * Math.PI * f / SR; return Math.sin(ph) * env(t, 0.002, d); }); };
const sq = (f, dur, d) => gen(dur, t => (Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1) * 0.5 * env(t, 0.002, d));
const mulEnv = (b, a, d) => { for (let i = 0; i < b.length; i++) b[i] *= env(i / SR, a, d); return b; };
const mix = (...bs) => { const n = Math.max(...bs.map(b => b.length)); const o = new Float32Array(n); for (const b of bs) for (let i = 0; i < b.length; i++) o[i] += b[i]; return o; };
const scale = (b, g) => { for (let i = 0; i < b.length; i++) b[i] *= g; return b; };
const sweepNoise = (dur, f0, f1, d, a = 0.05) => { const n = noise(dur); const out = new Float32Array(n.length); let y = 0; for (let i = 0; i < n.length; i++) { const f = f0 + (f1 - f0) * (i / n.length); const k = Math.exp(-2 * Math.PI * f / SR); y = (1 - k) * n[i] + k * y; out[i] = y * env(i / SR, a, d) * 3; } return out; };

const crackle = (dur, dens, g = 0.6) => { const n = Math.floor(dur * SR); const b = new Float32Array(n); for (let i = 0; i < n; i++) if (Math.abs(rand()) > 1 - dens) { const l = Math.floor(rand() * 30 + 20); for (let j = 0; j < l && i + j < n; j++) b[i + j] += rand() * Math.exp(-j / 8) * g; } return hp(b, 700); };
const drive = (b, k) => { for (let i = 0; i < b.length; i++) b[i] = Math.tanh(b[i] * k); return b; };
const subRise = (f0, f1, dur, d) => { let ph = 0; return gen(dur, t => { const f = f0 + (f1 - f0) * (t / dur) * (t / dur); ph += 2 * Math.PI * f / SR; return Math.tanh(Math.sin(ph) * 2.2) * Math.min(1, t / 0.15) * Math.exp(-Math.max(0, t - dur + 0.2) / d); }); };
const SND = {
  drum: () => mix(scale(sine(110, 45, 0.7, 0.18), 1.0), scale(mulEnv(lp(noise(0.3), 800), 0.001, 0.05), 0.6)),
  wind: () => scale(sweepNoise(3, 300, 900, 1.2, 0.8), 0.5),
  step: () => scale(mulEnv(lp(noise(0.1), 1200), 0.001, 0.03), 1.0),
  sign: () => mix(scale(sine(500, 1100, 0.7, 0.3), 0.35), scale(hp(mulEnv(noise(0.6), 0.01, 0.15), 3000), 0.25)),
  domain: () => mix(scale(sine(60, 35, 2.0, 0.6), 1.2), scale(sweepNoise(1.8, 200, 3000, 0.5, 0.6), 0.5), scale(sine(220, 220, 1.5, 0.5), 0.15), scale(sine(331, 331, 1.5, 0.5), 0.1), scale(sine(442, 442, 1.5, 0.5), 0.08)),
  rumble: () => { const b = lp(noise(2.5), 120); for (let i = 0; i < b.length; i++) b[i] *= 5 * Math.min(1, i / SR / 0.3) * Math.exp(-i / SR / 1.2) * (0.7 + 0.3 * Math.sin(i / SR * 20)); return b; },
  clash: () => { const n = Math.floor(1.8 * SR); const b = new Float32Array(n); for (let i = 0; i < n; i++) if (Math.abs(rand()) > 0.985) { const l = Math.floor(rand() * 40 + 60); for (let j = 0; j < l && i + j < n; j++) b[i + j] += rand() * Math.exp(-j / 18) * 0.8; } return mix(hp(b, 800), scale(sine(70, 55, 1.8, 0.8), 0.5)); },
  slash: () => mix(scale(sweepNoise(0.5, 6000, 1500, 0.1, 0.01), 0.7), scale(sine(2400, 3200, 0.6, 0.15), 0.25), scale(sine(120, 60, 0.4, 0.1), 0.5)),
  shatter: () => { const n = Math.floor(1.6 * SR); const b = new Float32Array(n); for (let k = 0; k < 90; k++) { const st = Math.floor(rand() * 0.5 * SR + 0), f = 2500 + (rand() + 1) * 3000; for (let j = 0; j < 2000 && st + j < n; j++) b[st + j] += Math.sin(2 * Math.PI * f * j / SR) * Math.exp(-j / 260) * 0.12 * (1 - st / n); } return mix(b, scale(mulEnv(lp(noise(0.8), 2500), 0.001, 0.2), 0.7), scale(sine(90, 40, 0.8, 0.2), 0.6)); },
  fire: () => mix(scale(sweepNoise(1.2, 300, 2500, 0.6, 0.5), 0.7), scale(sine(80, 200, 1.0, 0.8), 0.3)),
  boom: () => mix(scale(sine(70, 28, 2.4, 0.7), 1.6), scale(mulEnv(lp(noise(2.0), 1500), 0.002, 0.5), 1.4), scale(mulEnv(hp(noise(0.4), 2000), 0.001, 0.08), 0.5)),
  heart: () => scale(sine(70, 45, 0.35, 0.09), 1.4),
  heal: () => { const o = new Float32Array(Math.floor(1.2 * SR)); [523, 659, 784, 1047, 1319].forEach((f, k) => { const b = scale(sine(f, f, 0.5, 0.12), 0.25); for (let i = 0; i < b.length; i++) o[i + Math.floor(k * 0.09 * SR)] += b[i]; }); return o; },
  rise: () => mix(scale(sine(180, 900, 1.2, 4), 0.3), scale(sweepNoise(1.2, 400, 5000, 4, 0.3), 0.25)),
  dash: () => scale(sweepNoise(0.5, 1200, 5000, 0.12, 0.02), 0.6),
  bf: () => mix(scale(sine(80, 30, 1.2, 0.3), 1.8), scale(mulEnv(hp(noise(0.25), 1500), 0.0005, 0.04), 1.0), scale(mulEnv(lp(noise(0.8), 600), 0.001, 0.2), 1.0), scale(sine(1800, 300, 0.3, 0.05), 0.4)),
  blood: () => mix(scale(sweepNoise(1.2, 700, 250, 0.4, 0.15), 1.0), scale(sine(90, 50, 0.9, 0.3), 0.7)),
  splash: () => scale(sweepNoise(0.7, 2500, 800, 0.18, 0.01), 0.8),
  whoosh: () => scale(sweepNoise(0.7, 500, 3500, 0.2, 0.2), 0.7),
  kai: () => mix(scale(sine(50, 22, 3.0, 0.9), 2.0), scale(mulEnv(lp(noise(2.5), 2500), 0.001, 0.6), 1.5), scale(sine(1800, 1200, 1.5, 0.4), 0.2), scale(sweepNoise(0.8, 8000, 800, 0.15, 0.01), 0.8)),
  fall: () => mix(scale(sine(65, 35, 0.6, 0.15), 1.4), scale(mulEnv(lp(noise(0.3), 500), 0.001, 0.08), 1.0)),
  win: () => { const o = new Float32Array(Math.floor(1.6 * SR)); [523, 659, 784, 1047].forEach((f, k) => { const b = scale(sq(f, 0.9, 0.3), 0.18); for (let i = 0; i < b.length; i++) o[i + Math.floor(k * 0.14 * SR)] += b[i]; }); return o; },

  thunder: () => mix(scale(mulEnv(hp(noise(0.25), 1200), 0.0005, 0.06), 1.2), scale(mulEnv(lp(noise(2.2), 400), 0.01, 0.7), 2.2), scale(sine(60, 30, 1.6, 0.5), 1.2)),
  zap: () => { const b = gen(0.35, (t) => { const saw = ((t * 140) % 1) * 2 - 1; return (saw * 0.5 + rand() * 0.5) * env(t, 0.002, 0.08); }); return scale(hp(b, 600), 0.7); },
  hit: () => mix(scale(sine(140, 50, 0.3, 0.07), 1.6), scale(mulEnv(hp(noise(0.12), 1500), 0.0005, 0.02), 1.0), scale(mulEnv(lp(noise(0.2), 900), 0.001, 0.05), 0.8)),
  rika: () => mix(scale(mulEnv(lp(noise(1.6), 300), 0.1, 0.5), 3), scale(sine(90, 55, 1.4, 0.5), 1.0), scale(sine(180, 120, 1.2, 0.4), 0.3)),
  curse: () => mix(scale(sine(110, 110, 1.0, 0.4), 0.5), scale(sine(165, 165, 1.0, 0.4), 0.4), scale(sine(222, 218, 1.0, 0.4), 0.3), scale(mulEnv(hp(noise(0.5), 2500), 0.01, 0.1), 0.3)),
  chain: () => { const o = new Float32Array(Math.floor(0.9 * SR)); for (let k = 0; k < 9; k++) { const b = scale(mulEnv(hp(noise(0.1), 2000), 0.0005, 0.02), 0.6); const off = Math.floor((k * 0.08 + rand() * 0.02) * SR); for (let i = 0; i < b.length && off + i < o.length; i++) o[off + i] += b[i]; } return o; },
  beam: () => mix(scale(sine(300, 900, 1.5, 4), 0.4), scale(sweepNoise(1.5, 500, 5000, 4, 0.8), 0.3), scale(sine(70, 90, 1.5, 4), 0.5)),
  mega: () => mix(scale(sine(60, 22, 3.0, 0.9), 2.2), scale(mulEnv(lp(noise(3.0), 2000), 0.002, 0.8), 1.8), scale(mulEnv(hp(noise(0.5), 1500), 0.0005, 0.1), 0.7), scale(sweepNoise(1.2, 6000, 600, 0.25, 0.01), 0.7)),
  pierce: () => mix(scale(sweepNoise(0.4, 7000, 2500, 0.07, 0.003), 0.9), scale(sine(120, 40, 0.8, 0.2), 1.6), scale(mulEnv(hp(noise(0.15), 1800), 0.0005, 0.03), 0.9)),
  crumble: () => { const o = new Float32Array(Math.floor(2.0 * SR)); for (let k = 0; k < 40; k++) { const b = scale(mulEnv(lp(noise(0.12), 1800), 0.001, 0.03), 0.6); const off = Math.floor(rand() * 0.5 * SR + (rand() + 1) * 0.75 * SR); for (let i = 0; i < b.length && off + i < o.length; i++) o[off + i] += b[i]; } return o; },

  heart: () => scale(sine(70, 45, 0.35, 0.09), 1.4),
  crack: () => mix(scale(mulEnv(hp(noise(0.6), 800), 0.001, 0.2), 1.0), scale(sine(90, 40, 0.8, 0.25), 1.2), scale(mulEnv(lp(noise(1.2), 1500), 0.002, 0.4), 1.0)),
  whoosh: () => scale(sweepNoise(0.9, 400, 4500, 0.25, 0.25), 0.8),
  launch: () => mix(scale(sweepNoise(0.8, 300, 5000, 0.2, 0.05), 0.9), scale(sine(60, 120, 0.8, 0.3), 0.8)),
  impact: () => mix(scale(sine(80, 28, 1.6, 0.5), 2.0), scale(mulEnv(lp(noise(1.2), 1200), 0.002, 0.3), 1.4), scale(mulEnv(hp(noise(0.3), 1500), 0.0005, 0.06), 0.8)),
  sever: () => mix(scale(sweepNoise(0.4, 6000, 2000, 0.07, 0.003), 0.9), scale(sine(150, 50, 0.6, 0.15), 1.4), scale(mulEnv(hp(noise(0.2), 2500), 0.0005, 0.04), 0.7)),
  cancel: () => mix(scale(sine(60, 22, 3.0, 0.9), 2.0), scale(mulEnv(lp(noise(2.5), 2500), 0.001, 0.6), 1.5), scale(sweepNoise(1.4, 9000, 600, 0.3, 0.01), 0.9), scale(sine(2000, 1000, 1.5, 0.3), 0.2)),
  dawn: () => scale(sweepNoise(4, 200, 900, 2.0, 1.5), 0.3),

  charge: () => mix(scale(sweepNoise(1.0, 200, 3500, 5, 0.9), 0.7), scale(subRise(40, 90, 1.0, 0.3), 1.3), scale(crackle(1.0, 0.004, 0.5), 0.8)),
  charge2: () => mix(scale(sweepNoise(1.8, 150, 4500, 6, 1.6), 0.8), scale(subRise(35, 85, 1.8, 0.4), 1.4), scale(crackle(1.8, 0.003, 0.4), 0.6), scale(mulEnv(lp(noise(0.5), 400), 0.001, 0.12), 0.0)),
  sealG: () => { const o = new Float32Array(Math.floor(1.0 * SR)); const click = (t0, g) => { const b = scale(mulEnv(hp(noise(0.06), 2500), 0.0005, 0.012), g); const off = Math.floor(t0 * SR); for (let i = 0; i < b.length; i++) o[off + i] += b[i]; };
    click(0.0, 1.0); click(0.07, 0.8); const hit = mix(scale(sine(90, 40, 0.5, 0.12), 1.6), scale(mulEnv(lp(noise(0.3), 800), 0.001, 0.07), 1.0), scale(sweepNoise(0.5, 7000, 2500, 0.1, 0.003), 0.6)); const off = Math.floor(0.12 * SR); for (let i = 0; i < hit.length; i++) o[off + i] += hit[i]; return o; },
  sealY: () => mix(scale(subRise(30, 45, 1.2, 0.3), 1.6), scale(crackle(1.2, 0.006, 0.7), 1.0), scale(mulEnv(lp(noise(0.6), 500), 0.001, 0.15), 1.4), scale(mulEnv(hp(noise(0.2), 2200), 0.0005, 0.04), 0.7)),
  spear: () => mix(scale(sweepNoise(0.5, 9000, 3000, 0.1, 0.002), 0.9), scale(mulEnv(hp(noise(0.25), 3000), 0.0005, 0.05), 0.9), scale(sine(110, 45, 0.7, 0.18), 1.4), scale(crackle(0.8, 0.003, 0.5), 0.5)),
  poison: () => { const o = new Float32Array(Math.floor(2.0 * SR)); for (let k = 0; k < 6; k++) { const b = scale(sine(70, 45, 0.3, 0.07), 1.0); const off = Math.floor((k * 0.33) * SR); for (let i = 0; i < b.length && off + i < o.length; i++) o[off + i] += b[i]; } return mix(o, scale(crackle(2.0, 0.002, 0.4), 0.6), scale(mulEnv(lp(noise(2.0), 250), 0.3, 0.8), 0.8)); },
  blue: () => mix(scale(sweepNoise(0.5, 400, 5000, 0.1, 0.4), 0.8), scale(sine(70, 25, 2.2, 0.5), 2.2), scale(mulEnv(lp(noise(1.5), 1500), 0.002, 0.4), 1.4)),
  domainG: () => mix(scale(subRise(30, 55, 3.5, 1.2), 2.0), scale(sweepNoise(3.0, 200, 6000, 1.0, 1.0), 0.7), scale(crackle(3.0, 0.002, 0.5), 0.6)),
  drone: () => { const b = lp(noise(6), 120); for (let i = 0; i < b.length; i++) b[i] *= 6 * Math.min(1, i / SR / 1.0) * Math.exp(-Math.max(0, i / SR - 4.5) / 0.6); return mix(b, scale(subRise(40, 42, 6, 0.8), 0.8)); },
  pop: () => scale(sq(880, 0.12, 0.05), 0.5),
};
for (const [t, type, g] of SE) {
  const f = SND[type]; if (!f) { console.warn('unknown', type); continue; }
  const b = f(); const o = Math.floor(tv(t) * SR); const pan = (type === 'step' ? (t * 7 % 1) - 0.5 : 0) * 0.4;
  for (let i = 0; i < b.length && o + i < N; i++) { L[o + i] += b[i] * g * (1 - pan); R[o + i] += b[i] * g * (1 + pan); }
}
// 全体にソフトクリップ + ノーマライズ
let pk = 0; for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 0.8); R[i] = Math.tanh(R[i] * 0.8); pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.9 / (pk || 1);
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
fs.writeFileSync('out/se.wav', buf); console.log('wrote out/se.wav', (buf.length / 1e6).toFixed(1) + 'MB');
