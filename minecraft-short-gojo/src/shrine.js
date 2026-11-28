// 領域展開「伏魔御廚子」の祠(参考画像: 二重の反り屋根+牛の角+牙の並ぶ巨大な口+頭蓋骨の山+黒い枯れ木の柱+青緑の水面に映る)
import * as THREE from 'three';
const PI = Math.PI;
const rnd = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const BOX = new THREE.BoxGeometry(1, 1, 1);
const lam = (c, e = 0x000000) => new THREE.MeshLambertMaterial({ color: c, emissive: e });
const bas = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
function box(g, w, h, d, x, y, z, mat, ry = 0) { const m = new THREE.Mesh(BOX, mat); m.scale.set(w, h, d); m.position.set(x, y + h / 2, z); m.rotation.y = ry; g.add(m); return m; }

export function buildShrine() {
  const g = new THREE.Group();
  const M = {
    stone: lam(0x2a2630, 0x0a0a10), stone2: lam(0x3a3440, 0x120e16), red: lam(0xb02a1a, 0x4a0e08), redGlow: new THREE.MeshBasicMaterial({ color: 0xff6a2a, toneMapped: false }),
    gold: lam(0xc8a040, 0x5a4010), dark: lam(0x1a1418, 0x08060a), tile: lam(0x2c3446, 0x10141e), tile2: lam(0x3a4660, 0x141a28),
    bone: lam(0xe6e0cc, 0x4a4638), boneD: lam(0x9a9480, 0x2a2820), tip: lam(0x1a1814, 0x050404), tooth: lam(0xf2eedc, 0x5a5648), mouth: new THREE.MeshBasicMaterial({ color: 0x4a0612, toneMapped: false }),
    lip: lam(0x8a1a22, 0x3a0a0e), tongue: lam(0xc02a3a, 0x5a0a14), eye: lam(0xf4efdc, 0x6a6650), pupil: lam(0x080406),
  };
  // ---- 基壇(3段) ----
  box(g, 40, 1.4, 34, 0, 0, 0, M.stone); box(g, 35, 1.1, 29, 0, 1.4, 0, M.stone2); box(g, 31, 0.9, 25, 0, 2.5, 0, M.stone);
  for (let i = 0; i < 9; i++) box(g, 9, 0.5, 1.0, 0, 0.5 * i * 0.3, 17.5 + (8 - i) * 0.9 - 4, M.stone2); // 正面の階段
  const BASE = 3.4;
  // ---- 柱(赤い漆+橙の光の筋) ----
  const pillars = [[-13.5, 9.5], [-4.8, 9.5], [4.8, 9.5], [13.5, 9.5], [-13.5, -9.5], [-4.8, -9.5], [4.8, -9.5], [13.5, -9.5]];
  const PH = 13;
  pillars.forEach(([x, z]) => { box(g, 1.7, PH, 1.7, x, BASE, z, M.red); for (const s of [-1, 1]) { box(g, 0.18, PH - 1, 0.18, x + s * 0.9, BASE + 0.5, z + 0.9, M.redGlow); box(g, 0.18, PH - 1, 0.18, x + s * 0.9, BASE + 0.5, z - 0.9, M.redGlow); }
    box(g, 2.4, 0.8, 2.4, x, BASE, z, M.gold); box(g, 2.6, 1.0, 2.6, x, BASE + PH, z, M.gold); }); // 台座と柱頭
  // ---- 梁・斗栱(組物) ----
  box(g, 33, 1.6, 2.4, 0, BASE + PH + 1, 9.5, M.red); box(g, 33, 1.6, 2.4, 0, BASE + PH + 1, -9.5, M.red); for (const x of [-15.5, 15.5]) box(g, 2.4, 1.6, 21, x, BASE + PH + 1, 0, M.red);
  for (let i = -7; i <= 7; i++) { box(g, 1.6, 1.2, 1.6, i * 2.1, BASE + PH + 2.6, 10.2, M.gold); box(g, 2.2, 0.6, 2.2, i * 2.1, BASE + PH + 3.8, 10.2, M.dark); }
  const TOP = BASE + PH + 4.6;
  // ---- 屋根 第1層(反り上がった軒) ----
  for (let i = 0; i < 8; i++) { const w = 46 - i * 4.8, d = 40 - i * 4.4, y = TOP + i * 1.15; box(g, w, 1.15, d, 0, y, 0, i % 2 ? M.tile2 : M.tile); box(g, w + 0.3, 0.3, d + 0.3, 0, y + 1.0, 0, M.gold); }
  // 軒の反り(四隅が持ち上がる)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 5; k++) box(g, 4.5 - k * 0.5, 1.0, 4.5 - k * 0.5, sx * (22 - k * 0.5), TOP + 0.4 + k * 0.9, sz * (19.2 - k * 0.45), M.tile2);
  // ---- 上層の壁と屋根 ----
  const UP = TOP + 9.2;
  box(g, 21, 5, 17, 0, UP, 0, M.red); for (let i = -4; i <= 4; i++) box(g, 0.5, 4.6, 0.3, i * 2.2, UP + 0.2, 8.7, M.redGlow);
  for (let i = 0; i < 7; i++) { const w = 29 - i * 3.9, d = 24 - i * 3.3, y = UP + 5 + i * 1.1; box(g, w, 1.1, d, 0, y, 0, i % 2 ? M.tile2 : M.tile); box(g, w + 0.3, 0.3, d + 0.3, 0, y + 1.0, 0, M.gold); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 4; k++) box(g, 3.6 - k * 0.5, 1.0, 3.6 - k * 0.5, sx * (14.5 - k * 0.5), UP + 5.2 + k * 0.9, sz * (12 - k * 0.45), M.tile2);
  const RIDGE = UP + 5 + 7 * 1.1;
  box(g, 7, 1.4, 6, 0, RIDGE, 0, M.gold);
  // ---- 牛の角(三日月): 円弧に沿ってブロックを並べる ----
  function horn(px, py, pz, dirx, dirz, len, rad, thick, tilt = 0) { // dir: 水平の向き。上へ反り上がり、先端は内側へ巻く
    const N = 12; for (let i = 0; i < N; i++) { const a = (i / (N - 1)) * 1.9; const t = thick * (1 - 0.82 * (i / N)); const rx = Math.sin(a) * rad, ry = (1 - Math.cos(a)) * rad * 1.1; // 外へ→上へ
      const m = new THREE.Mesh(BOX, i > N - 3 ? M.tip : (i > N * 0.55 ? M.boneD : M.bone)); m.scale.set(t, t, len / N * 1.5); m.position.set(px + dirx * rx, py + ry, pz + dirz * rx);
      m.rotation.set(0, Math.atan2(dirx, dirz), 0); m.rotateX(-a * 0.9 + tilt); g.add(m); } }
  // 棟の上の巨大な角(クラスター)
  [[-3.2, 0], [-1.6, 1], [0, 0.2], [1.6, 1], [3.2, 0]].forEach(([x, z], i) => { horn(x, RIDGE + 1.4, 0.4 * (i - 2), x < 0 ? -1 : (x > 0 ? 1 : 0.3), 0.0, 12 + (i % 2) * 4, 6.5 + (i % 3) * 1.2, 2.1); });
  horn(0, RIDGE + 1.4, -1, 0, -1, 14, 7, 2.2); horn(0, RIDGE + 1.4, 1, 0, 1, 14, 7, 2.2);
  // 屋根の四隅・軒先の角
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { horn(sx * 21, TOP + 4.2, sz * 18.3, sx, 0, 12, 7, 1.8); horn(sx * 14, UP + 8.2, sz * 11.5, sx, 0, 10, 5.5, 1.5); }
  // ---- 正面: 巨大な口(牙)と、左右の目玉・牙の口 ----
  const FZ = 10.6;
  box(g, 8.2, 11, 1.2, 0, BASE + 0.8, FZ - 1.4, M.mouth); // 口の中(暗い赤が光る)
  box(g, 8.8, 1.2, 1.8, 0, BASE + 0.1, FZ - 0.2, M.lip); box(g, 8.8, 1.4, 1.8, 0, BASE + PH - 1.0, FZ - 0.2, M.lip); // 唇
  box(g, 6, 0.8, 1.4, 0, BASE + 1.0, FZ - 0.4, M.tongue);
  for (let i = 0; i < 11; i++) { const x = -4 + i * 0.8; const h = 1.8 + rnd(i * 3.1) * 1.4; box(g, 0.62, h, 0.7, x, BASE + 1.3, FZ + 0.1, M.tooth); box(g, 0.62, 1.8 + rnd(i * 5.3) * 1.6, 0.7, x, BASE + PH - 0.8 - (1.8 + rnd(i * 5.3) * 1.6), FZ + 0.1, M.tooth); }
  for (const sx of [-1, 1]) { // 左右の口: 丸く開いた口。暗い赤の口の中、分厚い唇の輪、内向きにびっしり並ぶ牙、舌
    const mx = sx * 9.15, my = BASE + 6.6; const mg = new THREE.Group(); mg.position.set(mx, my, FZ - 0.3); mg.scale.set(0.92, 1.35, 1); g.add(mg);
    const inside = new THREE.Mesh(new THREE.CircleGeometry(2.9, 28), M.mouth); inside.position.z = -0.3; mg.add(inside); // 口の中
    const throat = new THREE.Mesh(new THREE.CircleGeometry(1.7, 24), new THREE.MeshBasicMaterial({ color: 0x14020a, toneMapped: false })); throat.position.z = -0.25; mg.add(throat);
    const tg = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12), M.tongue); tg.scale.set(1.5, 0.75, 0.5); tg.position.set(0, -1.35, 0.1); mg.add(tg); // 舌
    for (let k = 0; k < 28; k++) { const a = (k / 28) * PI * 2; const m = new THREE.Mesh(BOX, M.lip); m.scale.set(1.25, 1.25, 1.2); m.position.set(Math.cos(a) * 3.45, Math.sin(a) * 3.45, 0.1); m.rotation.z = a; mg.add(m); } // 唇
    for (let k = 0; k < 22; k++) { const a = (k / 22) * PI * 2 + 0.06; if (Math.abs(Math.cos(a)) > 0.86) continue; // 口の両端は唇だけ。牙は上と下の弧に並べる
      const L = 1.5 + rnd(k * 3.7 + sx) * 0.9; const m = new THREE.Mesh(BOX, M.tooth); m.scale.set(0.78, L, 0.7); m.position.set(Math.cos(a) * (2.95 - L / 2 + 0.15), Math.sin(a) * (2.95 - L / 2 + 0.15), 0.4); m.rotation.z = a - PI / 2; mg.add(m); }
    const cheek = new THREE.Mesh(BOX, M.lip); cheek.scale.set(0.1, 0.1, 0.1); mg.add(cheek);
  }
  // ---- 頭蓋骨の山(牛の頭蓋骨+角) ----
  function skull(x, y, z, ry, s = 1) {
    const sg = new THREE.Group(); sg.position.set(x, y, z); sg.rotation.y = ry; sg.scale.setScalar(s);
    box(sg, 1.5, 1.1, 1.9, 0, 0, 0, M.bone); box(sg, 1.0, 0.8, 1.2, 0, 0.05, 1.4, M.bone); box(sg, 1.3, 0.35, 0.6, 0, 0.9, 0.4, M.boneD);
    box(sg, 0.45, 0.45, 0.2, -0.45, 0.55, 0.96, M.dark); box(sg, 0.45, 0.45, 0.2, 0.45, 0.55, 0.96, M.dark); box(sg, 0.22, 0.28, 0.2, -0.22, 0.2, 2.02, M.dark); box(sg, 0.22, 0.28, 0.2, 0.22, 0.2, 2.02, M.dark);
    for (const sx of [-1, 1]) { for (let i = 0; i < 5; i++) { const a = i * 0.45; box(sg, 0.4 - i * 0.05, 0.4 - i * 0.05, 0.8, sx * (0.9 + Math.sin(a) * 1.3 + i * 0.1), 0.9 + (1 - Math.cos(a)) * 1.2, 0.2 - i * 0.05, i > 3 ? M.tip : M.bone).rotation.z = -sx * a * 0.6; } }
    g.add(sg); return sg;
  }
  for (let i = 0; i < 120; i++) { const a = rnd(i * 2.3) * PI * 2; const r = 21 + rnd(i * 5.1) * 7 + (rnd(i * 3.3) < 0.3 ? 5 : 0); const x = Math.cos(a) * r * 1.02, z = Math.sin(a) * r * 0.86; if (Math.abs(x) < 6 && z > 14) continue; skull(x, rnd(i * 7.7) * 1.8, z, a + PI / 2 + (rnd(i) - 0.5) * 1.2, 0.9 + rnd(i * 9) * 0.7); }
  for (let i = 0; i < 40; i++) skull((rnd(i * 4.4) - 0.5) * 34, BASE + 0.1 + rnd(i) * 0.4, 12.6 + rnd(i * 6.1) * 3.5, (rnd(i * 8.1) - 0.5) * 1.5, 0.7); // 正面の段にも
  // ---- 四隅の黒い枯れ木の柱 ----
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * 19.5, z = sz * 16.5; box(g, 0.9, 17, 0.9, x, 0, z, M.dark);
    for (let b = 0; b < 14; b++) { const h = 5 + rnd(b * 3.7 + sx) * 11, a = rnd(b * 5.1 + sz) * PI * 2, L = 3 + rnd(b * 2.9) * 5; const m = box(g, 0.28, 0.28, L, x + Math.cos(a) * L * 0.4, h, z + Math.sin(a) * L * 0.4, M.dark); m.rotation.y = -a + PI / 2; m.rotation.x = -0.5; } }
  // ---- 軒先から吊るされた頭蓋骨 ----
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const x = sx * (8 + k * 6.5), z = 20.6; box(g, 0.1, 5, 0.1, x, TOP - 4, z, M.dark); skull(x, TOP - 6.6, z, PI, 0.9); }
  g.userData = { roofTop: RIDGE + 1.4, frontZ: FZ, base: BASE };
  return g;
}

// 空: 赤黒い雷雲(流れる血管のような赤い筋)
export function shrineSky() {
  return new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { time: { value: 0 } },
    vertexShader: 'varying vec3 v; void main(){ v=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform float time; varying vec3 v; float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);} float n(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    void main(){ vec2 uv=vec2(atan(v.x,v.z)*1.6, v.y*3.0); float a=0.0; for(int i=0;i<5;i++){ a+=n(uv*(1.0+float(i)*1.7)+vec2(time*0.03*float(i+1),float(i)*7.1))/(1.0+float(i)); }
      float ridge=1.0-abs(a-0.9)*3.2; ridge=clamp(ridge,0.,1.); float hz=clamp(1.0-abs(v.y)*1.1,0.,1.);
      vec3 base=mix(vec3(0.02,0.0,0.01),vec3(0.35,0.03,0.05),hz*0.8); vec3 veins=vec3(0.95,0.12,0.14)*pow(ridge,2.0)*(0.35+hz); gl_FragColor=vec4(base+veins,1.0);} ` }));
}
