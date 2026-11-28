// 勇者 vs 岩の巨人: 映像・音で共有するタイムライン
export const END = 18.6;
export const T = { rise: 3.0, riseDone: 4.8, roar: 5.0, charge: 5.4, smash: 6.55, jump: 6.9, land1: 7.8, dash: 8.4, swing: 9.0, leap: 10.3, windup: 11.2, slash: 12.0, boom: 12.9, land: 14.1, sheathe: 15.2, dawn: 15.6 };
export const WARP = [
  [6.5, 6.58, 0.15], [7.0, 7.4, 0.5], [11.4, 11.95, 0.5], [11.95, 12.0, 0.1], [12.0, 12.04, 0.04], [12.04, 12.8, 0.3], [12.8, 13.0, 0.5],
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
// 効果音 [τ, 種類, 音量]
export const SE = [
  [0.0, 'wind', 0.6], [2.0, 'drone', 0.6], [3.0, 'rumble', 1.2], [4.0, 'crack', 1.0], [4.7, 'impact', 1.4], [5.0, 'boom', 1.2], [5.4, 'charge', 1.0], [6.0, 'charge2', 0.9],
  [6.55, 'impact', 1.6], [6.55, 'crack', 1.2], [6.9, 'whoosh', 1.0], [7.8, 'impact', 0.8], [8.4, 'dash', 1.0], [9.0, 'whoosh', 1.1], [9.2, 'slash', 0.7], [10.3, 'launch', 1.0],
  [11.2, 'charge2', 1.1], [12.0, 'mega', 1.5], [12.0, 'slash', 1.5], [12.1, 'crack', 1.3], [12.9, 'shatter', 1.5], [12.9, 'boom', 1.6], [13.5, 'rumble', 0.8],
  [14.1, 'impact', 0.9], [15.2, 'win', 0.5], [15.6, 'wind', 0.8], [16.5, 'dawn', 0.6],
];
