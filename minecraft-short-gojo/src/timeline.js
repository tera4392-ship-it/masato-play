// 映像・音で共有するタイムライン(DOM非依存)
// 「アニメ時間 τ(秒)」で演出を書き、スピードランプ(WARP)で実際の映像時間 t に変換する。
export const END = 55.2; // τの終わり

// [τ開始, τ終了, 進む速さ(1=等速, <1=スロー)]  ヒットストップは極小区間+低速で表現
export const T = {
  jump: 6.0, launch: 10.6, clash: 11.6, land: 14.0, sealG: 14.5, sealY: 15.6, sealGdone: 15.3, sealYdone: 16.4, domG: 17.6, domY: 17.9, cut: 20.5, shatter: 20.8, interior: 21.0,
  slash2: 22.0, sever: 22.3, bf: [23.5, 24.2, 24.9, 25.6, 26.3], pierce: 27.2, poison: 27.8, spearOn: 29.8, cancel: 30.1,
  heal: 30.6, rush: 32.8, counter: 33.5, whiteEyes: 35.2, sealG2: 36.2, domG2: 37.5, sealY2: 37.8, failY: 38.8, kneel: 43.0, dawn: 46.0,
};
export const WARP = [
  [11.6, 12.4, 0.3], [22.2, 22.7, 0.3], [33.4, 33.7, 0.25],
  ...[23.5, 24.2, 24.9, 25.6, 26.3, 27.2].map(t => [t, t + 0.004, 0.04]),
  [T.sever, T.sever + 0.004, 0.04],
  [15.3, 15.4, 0.2], [16.4, 16.5, 0.2],
].sort((a, b) => a[0] - b[0]);

// 映像時間 t → アニメ時間 τ
export function tau(t) {
  let v = 0, a = 0;
  for (const [s0, s1, r] of WARP) {
    const free = s0 - a; if (t <= v + free) return a + (t - v);
    v += free; a = s0; const seg = (s1 - s0) / r; if (t <= v + seg) return a + (t - v) * r; v += seg; a = s1;
  }
  return a + (t - v);
}
// アニメ時間 τ → 映像時間 t(効果音の位置合わせ用)
export function tv(x) {
  let v = 0, a = 0;
  for (const [s0, s1, r] of WARP) {
    if (x <= s0) return v + (x - a); v += s0 - a; a = s0;
    if (x <= s1) return v + (x - a) / r; v += (s1 - s0) / r; a = s1;
  }
  return v + (x - a);
}
export const VID_DUR = tv(END);

// 効果音 [τ, 種類, 音量]
export const SE = [
  [0.0, 'wind', 0.7], [1.5, 'zap', 0.4], [2.8, 'wind', 0.5], [4.4, 'heart', 0.8], [5.0, 'heart', 0.8], [5.6, 'heart', 0.9],
  [6.0, 'crack', 1.2], [6.1, 'whoosh', 1.0], [7.8, 'charge', 1.0], [8.8, 'charge2', 1.0], [10.6, 'launch', 1.0],
  [11.6, 'mega', 1.6], [13.2, 'wind', 0.8], [14.0, 'impact', 1.3],
  [15.3, 'sealG', 1.1], [16.4, 'sealY', 1.1],
  [17.6, 'domain', 1.3], [17.9, 'domain', 1.3], [18.5, 'clash', 1.0], [19.5, 'clash', 1.1], [20.5, 'slash', 1.3], [20.8, 'shatter', 1.4],
  [21.7, 'charge', 0.8], [22.0, 'slash', 1.3], [22.3, 'sever', 1.2],
  [22.8, 'dash', 1.0], [23.5, 'bf', 1.0], [24.2, 'bf', 1.05], [24.9, 'bf', 1.1], [25.6, 'bf', 1.2], [26.3, 'bf', 1.5],
  [27.2, 'pierce', 1.4], [27.8, 'poison', 0.8], [29.8, 'spear', 1.0], [30.0, 'cancel', 1.5],
  [30.6, 'heal', 1.0], [32.8, 'dash', 1.0], [33.5, 'blue', 1.5], [34.3, 'fall', 1.0],
  [36.2, 'sealG', 0.8], [37.5, 'domainG', 1.5], [38.0, 'drone', 1.0], [43.5, 'fall', 0.8], [45.5, 'wind', 0.8], [48.0, 'dawn', 0.5],
];
