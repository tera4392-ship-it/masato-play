// 五条悟 vs 宿儺: 映像・音で共有するタイムライン
export const PUR = { z0: -2, v: 32 };
export const END = 17.4;
export const T = { kai: 3.1, shield: 3.75, multi: 4.15, blue: 5.2, pull: 5.5, red: 6.6, redHit: 7.0, melee: [8.6, 9.0, 9.4, 9.8], kick: 10.05, tele: 10.9, reappear: 11.4, fire: 12.0, hole: 12.84, dawn: 14.2 };
export const WARP = [
  [6.95, 7.2, 0.25], [11.7, 12.3, 0.25], [12.82, 13.0, 0.4],
  ...[8.6, 9.0, 9.4, 9.8].map(t => [t, t + 0.004, 0.04]),
].sort((a, b) => a[0] - b[0]);
export function tau(t) {
  let v = 0, a = 0;
  for (const [s0, s1, r] of WARP) { const free = s0 - a; if (t <= v + free) return a + (t - v); v += free; a = s0; const seg = (s1 - s0) / r; if (t <= v + seg) return a + (t - v) * r; v += seg; a = s1; }
  return a + (t - v);
}
export function tv(x) {
  let v = 0, a = 0;
  for (const [s0, s1, r] of WARP) { if (x <= s0) return v + (x - a); v += s0 - a; a = s0; if (x <= s1) return v + (x - a) / r; v += (s1 - s0) / r; a = s1; }
  return v + (x - a);
}
export const VID_DUR = tv(END);
export const SE = [
  [0.0, 'wind', 0.6], [1.0, 'step', 0.4], [1.8, 'step', 0.4], [2.5, 'drone', 0.7],
  [3.1, 'slash', 1.2], [3.1, 'whoosh', 0.9], [3.75, 'clash', 1.2], [4.15, 'slash', 0.9], [4.45, 'slash', 0.9], [4.75, 'slash', 1.0],
  [5.2, 'beam', 0.9], [5.5, 'whoosh', 1.1], [6.1, 'impact', 1.0], [6.6, 'charge', 1.0], [7.0, 'blue', 1.5], [7.0, 'hit', 1.3], [7.5, 'fall', 0.8],
  [8.3, 'dash', 1.0], [8.6, 'hit', 1.0], [9.0, 'hit', 0.9], [9.4, 'hit', 1.0], [9.8, 'hit', 1.1], [10.05, 'impact', 1.2],
  [10.9, 'zap', 1.1], [10.9, 'whoosh', 1.0], [11.4, 'impact', 1.1], [11.55, 'charge2', 1.1], [12.0, 'mega', 1.6], [12.2, 'rumble', 1.0], [12.84, 'shatter', 1.4], [12.84, 'impact', 1.6], [13.2, 'rumble', 0.9],
  [14.2, 'wind', 0.8], [15.0, 'dawn', 0.6],
];
