// 勇者 vs 岩の巨人(マイクラ風・縦1080x1920)。文字なし、効果音は自作。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { T, tau, VID_DUR, END } from './timeline.js';

const q = new URLSearchParams(location.search);
const SC = parseFloat(q.get('s') ?? '1');
const W = Math.round(1080 * SC), H = Math.round(1920 * SC);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const lin = t => t;
const rnd = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function kf(t, keys, ease = smooth) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; const u = ease(clamp((t - t0) / (t1 - t0)));
    return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], u)) : lerp(v0, v1, u);
  }
  return keys[keys.length - 1][1];
}
const shake = (t, a) => V3((Math.sin(t * 47.3) + Math.sin(t * 31.7 + 1.3)) * 0.5 * a, (Math.sin(t * 53.1 + 2.1) + Math.sin(t * 37.9 + 0.4)) * 0.5 * a, Math.sin(t * 41.7 + 4.2) * 0.5 * a);
const V = a => V3(a[0], a[1], a[2]);

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05060f);
scene.fog = new THREE.Fog(0x1a1430, 60, 330);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 900); scene.add(camera);
const hemi = new THREE.HemisphereLight(0x8090e0, 0x2a2038, 1.0); scene.add(hemi);
const moonL = new THREE.DirectionalLight(0xa0b8ff, 1.1); moonL.position.set(-20, 40, 30); scene.add(moonL);
const lavaL = new THREE.PointLight(0xff6a20, 0, 40, 1.4); lavaL.position.set(0, 3, -17); scene.add(lavaL);
const swordL = new THREE.PointLight(0x60d8ff, 0, 18, 1.4); scene.add(swordL);
const fxLight = new THREE.PointLight(0xffffff, 0, 40, 1.3); scene.add(fxLight);
const out2d = document.createElement('canvas'); out2d.width = W; out2d.height = H; document.body.appendChild(out2d);
const ctx2 = out2d.getContext('2d');
const BOX = new THREE.BoxGeometry(1, 1, 1);
const bas = (c, extra = {}) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...extra });

// ---------- ドット絵テクスチャ ----------
function pix(n, fn) { const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); fn(x, n); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t; }
const noiseTex = (cols, seed, n = 8, glow = null) => pix(n, (x, N) => { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { x.fillStyle = cols[Math.floor(rnd(i * 3.7 + j * 9.1 + seed) * cols.length)]; x.fillRect(i, j, 1, 1); } if (glow) glow(x, N); });
const lam = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, ...extra });

// ---------- ブロック型キャラ(頭8³・胴・腕・脚) ----------
const PXs = 0.06;
function makeBlocky(sp) {
  const s = sp.scale ?? 1, p = PXs * s;
  const root = new THREE.Group(), hips = new THREE.Group(); root.add(hips); const legH = sp.legH * p; hips.position.y = legH;
  const mk = (w, h, d, mat, pivotTop = false) => { const m = new THREE.Mesh(BOX, mat); m.scale.set(w * p, h * p, d * p); m.position.y = pivotTop ? -h * p / 2 : h * p / 2; return m; };
  const mats = [];
  const legR = new THREE.Group(), legL = new THREE.Group(); hips.add(legR, legL); legR.position.set(-sp.legW * p / 2, 0, 0); legL.position.set(sp.legW * p / 2, 0, 0);
  legR.add(mk(sp.legW, sp.legH, sp.legD, sp.mLeg, true)); legL.add(mk(sp.legW, sp.legH, sp.legD, sp.mLeg, true));
  const torso = new THREE.Group(); hips.add(torso);
  const cutH = sp.cut ?? 0; // 胴の下側(切断面より下)は腰に残す
  let lowBody = null;
  if (cutH) { lowBody = mk(sp.bodyW, cutH, sp.bodyD, sp.mBody); hips.add(lowBody); const m2 = mk(sp.bodyW, sp.bodyH - cutH, sp.bodyD, sp.mBody); m2.position.y = (cutH + (sp.bodyH - cutH) / 2) * p; torso.add(m2); }
  else torso.add(mk(sp.bodyW, sp.bodyH, sp.bodyD, sp.mBody));
  let capUp = null, capLow = null;
  if (cutH) { const cm = bas(0xff7a20); capLow = new THREE.Mesh(BOX, cm); capLow.scale.set(sp.bodyW * p * 0.98, 0.04, sp.bodyD * p * 0.98); capLow.position.y = cutH * p + 0.01; hips.add(capLow); capLow.visible = false;
    capUp = new THREE.Mesh(BOX, cm); capUp.scale.copy(capLow.scale); capUp.position.y = cutH * p - 0.01; torso.add(capUp); capUp.visible = false; }
  const neck = new THREE.Group(); torso.add(neck); neck.position.y = sp.bodyH * p; const head = mk(sp.headS, sp.headS, sp.headS, sp.mHead); neck.add(head);
  const armR = new THREE.Group(), armL = new THREE.Group(); torso.add(armR, armL);
  const sx = (sp.bodyW / 2 + sp.armW / 2) * p; const sy = (sp.bodyH - sp.armW * 0.5) * p;
  armR.position.set(-sx, sy, 0); armL.position.set(sx, sy, 0); armR.add(mk(sp.armW, sp.armH, sp.armW, sp.mArm, true)); armL.add(mk(sp.armW, sp.armH, sp.armW, sp.mArm, true));
  scene.add(root);
  return { root, hips, torso, neck, head, armR, armL, legR, legL, legH, p, capUp, capLow, lowBody, armLen: sp.armH * p };
}
const POSEK = ['lean', 'twist', 'headP', 'Rf', 'Rab', 'Lf', 'Lab', 'lr', 'll', 'flip', 'roll', 'crouch'];
const PRE = {
  idle: { Rf: 0.08, Lf: -0.08, lr: 0.04, ll: -0.04 },
  gidle: { Rf: 0.15, Lf: 0.15, Rab: 0.12, Lab: 0.12, lean: 0.04, lr: 0.0, ll: 0.0 },
  groar: { Rf: 2.7, Lf: 2.7, Rab: 0.4, Lab: 0.4, headP: -0.5, lean: -0.25 },
  gwind: { Rf: 3.1, Lf: 1.0, Rab: 0.15, headP: -0.2, lean: -0.35, twist: 0.2 },
  gsmash: { Rf: 1.25, Lf: 0.7, Rab: 0.1, headP: 0.25, lean: 0.55, twist: -0.15, crouch: 0.2 },
  gswing: { Rf: 1.55, Lf: 1.6, Lab: 1.2, lean: 0.1, twist: 1.0, headP: 0.1 },
  gswing2: { Rf: 1.55, Lf: 1.6, Lab: 1.2, lean: 0.1, twist: -1.0, headP: 0.1 },
  gcut: { Rf: 1.0, Lf: 1.4, Rab: 0.5, Lab: 0.5, lean: -0.3, headP: -0.4 },
  ready: { Rf: 1.25, Rab: 0.12, Lf: 0.5, Lab: 0.3, lean: 0.16, headP: -0.1, lr: 0.5, ll: -0.4, crouch: 0.12 },
  charge: { Rf: 1.9, Rab: 0.2, Lf: 1.0, Lab: 0.5, lean: -0.12, headP: -0.2, lr: 0.3, ll: -0.2, crouch: 0.05 },
  crouch: { Rf: 0.9, Lf: 0.6, lean: 0.55, lr: 0.9, ll: 0.9, crouch: 0.5, headP: -0.2 },
  jump: { Rf: 2.5, Lf: 1.6, Lab: 0.4, lean: -0.1, lr: 1.1, ll: 0.1, headP: -0.2 },
  tuck: { Rf: 1.0, Lf: 0.8, lean: 0.35, lr: 1.2, ll: 1.2, headP: 0.1 },
  land: { Rf: 0.9, Lf: 0.3, lean: 0.55, lr: 0.7, ll: 0.5, crouch: 0.45, headP: 0.1 },
  run1: { Rf: -0.9, Lf: 1.5, Lab: 0.2, lean: 0.4, lr: 1.0, ll: -1.0, headP: -0.15 },
  run2: { Rf: 1.5, Rab: 0.2, Lf: -0.9, lean: 0.4, lr: -1.0, ll: 1.0, headP: -0.15 },
  slide: { Rf: 1.5, Lf: 0.4, lean: 1.1, lr: 1.5, ll: 0.3, crouch: 0.6, headP: -0.7 },
  rise: { Rf: 1.9, Rab: 0.3, Lf: 1.2, Lab: 0.6, lean: -0.15, lr: 0.5, ll: 0.1, headP: -0.2 },
  windup: { Rf: 1.5, Rab: 0.2, Lf: 1.2, Lab: 0.8, twist: 1.35, lean: 0.1, lr: 0.9, ll: 0.3, headP: -0.1 },
  slash: { Rf: 1.5, Rab: 0.2, Lf: 1.0, Lab: 1.0, twist: -1.4, lean: 0.25, lr: 0.3, ll: 0.8, headP: -0.1 },
  fall: { Rf: 1.0, Lf: 1.4, Lab: 0.5, lean: 0.3, lr: 0.6, ll: 0.8, headP: 0.1, twist: -0.6 },
  sheathe: { Rf: 0.7, Lf: 0.2, lean: 0.1, headP: 0.15 },
};
function compile(keys) { return keys.map(([t, n, o = {}]) => { const p = {}; for (const k of POSEK) p[k] = (PRE[n]?.[k]) ?? 0; return { t, p, pos: { x: o.x ?? 0, y: o.y ?? 0, z: o.z ?? 0, yaw: o.yaw ?? 0 }, snap: o.e === 'snap' }; }); }
function evalActor(keys, t, bob = 0) {
  let i = 0; while (i < keys.length - 1 && keys[i + 1].t <= t) i++; const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)]; const s = {}; const names = [...POSEK, 'x', 'y', 'z', 'yaw'];
  const val = (k, n) => (n === 'x' || n === 'y' || n === 'z' || n === 'yaw') ? k.pos[n] : k.p[n];
  if (a === b || b.snap) { for (const n of names) s[n] = val(a, n); }
  else {
    const h = b.t - a.t, u = clamp((t - a.t) / h), u2 = u * u, u3 = u2 * u; const prev = keys[i - 1], next = keys[i + 2]; const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    for (const n of names) { const p0 = val(a, n), p1 = val(b, n), sl = (p1 - p0) / h; let m0 = (prev && !a.snap) ? (p1 - val(prev, n)) / (b.t - prev.t) : sl; let m1 = (next && !next.snap) ? (val(next, n) - p0) / (next.t - a.t) : sl; m0 *= 0.85; m1 *= 0.85; if (m0 * sl < 0) m0 = 0; if (m1 * sl < 0) m1 = 0;
      let v = h00 * p0 + h10 * h * m0 + h01 * p1 + h11 * h * m1; const lo = Math.min(p0, p1), hi = Math.max(p0, p1), ex = 0.18 * (hi - lo); s[n] = Math.min(hi + ex, Math.max(lo - ex, v)); }
  }
  const br = Math.sin(t * 2.4 + bob) * 0.02; s.lean += br; s.Rf += br; s.Lf += br; return s;
}
function setPose(C, s) {
  C.root.position.set(s.x, s.y, s.z); C.root.rotation.y = s.yaw; C.hips.position.y = C.legH * (1 - s.crouch * 0.4); C.hips.rotation.set(s.flip, 0, s.roll);
  C.torso.rotation.set(s.lean, s.twist, 0); C.neck.rotation.x = s.headP; C.armR.rotation.set(s.Rf, 0, -s.Rab); C.armL.rotation.set(s.Lf, 0, s.Lab); C.legR.rotation.x = s.lr; C.legL.rotation.x = s.ll;
}
const worldOf = (obj, off = [0, 0, 0]) => obj.localToWorld(V3(...off));

// ---------- 勇者 ----------
const skin = ['#f2c8a0', '#eebf94', '#f6d0aa'];
const heroHead = [0, 1, 2, 3, 4, 5].map(f => lam(f === 5 ? pix(8, (x, n) => { x.fillStyle = '#f0c498'; x.fillRect(0, 0, 8, 8); x.fillStyle = '#2a2050'; x.fillRect(0, 0, 8, 2); x.fillRect(0, 0, 1, 4); x.fillRect(7, 0, 1, 4); x.fillStyle = '#e8403a'; x.fillRect(0, 2, 8, 1); x.fillStyle = '#ffffff'; x.fillRect(1, 4, 2, 1); x.fillRect(5, 4, 2, 1); x.fillStyle = '#30d8ff'; x.fillRect(2, 4, 1, 1); x.fillRect(5, 4, 1, 1); x.fillStyle = '#b8705a'; x.fillRect(3, 6, 2, 1); })
  : f === 2 ? noiseTex(['#2a2050', '#241a46', '#30265a'], 3) : noiseTex(f === 4 ? ['#2a2050', '#241a46', '#30265a'] : ['#f0c498', '#2a2050', '#2a2050', '#2a2050'], f + 7)));
const heroBody = lam(noiseTex(['#2a62d8', '#2456c8', '#3270e8', '#2a62d8'], 11)); const heroArm = lam(noiseTex(['#2a62d8', '#2456c8', '#e8c040', '#2a62d8'], 12)); const heroLeg = lam(noiseTex(['#2a2c40', '#24263a', '#32344a', '#1c1e30'], 13));
const hero = makeBlocky({ scale: 1, legH: 12, legW: 4, legD: 4, bodyW: 8, bodyH: 12, bodyD: 4, headS: 8, armW: 4, armH: 12, mLeg: heroLeg, mBody: heroBody, mArm: heroArm, mHead: heroHead });
{ // 赤いマフラー(3節) と 剣
  const scarfM = bas(0xe8403a); hero.scarf = []; for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(BOX, scarfM); m.scale.set(0.34, 0.12, 0.34 - i * 0.04); hero.torso.add(m); hero.scarf.push(m); }
  const sw = new THREE.Group(); hero.armR.add(sw); sw.position.set(0, -12 * PXs, 0); sw.rotation.x = -0.35; hero.sword = sw;
  const hilt = new THREE.Mesh(BOX, bas(0x6a4a2a)); hilt.scale.set(0.07, 0.07, 0.3); hilt.position.z = -0.0; sw.add(hilt);
  const guard = new THREE.Mesh(BOX, bas(0xe8c040)); guard.scale.set(0.34, 0.07, 0.07); guard.position.z = -0.2; sw.add(guard);
  const blade = new THREE.Mesh(BOX, bas(0xa8f0ff)); blade.scale.set(0.07, 0.16, 1.25); blade.position.z = -0.84; sw.add(blade); hero.blade = blade;
  const core = new THREE.Mesh(BOX, bas(0xffffff)); core.scale.set(0.035, 0.18, 1.2); core.position.z = -0.84; sw.add(core);
  hero.tip = new THREE.Object3D(); hero.tip.position.z = -1.45; sw.add(hero.tip);
}
const HK = compile([
  [0, 'idle', { x: 0, y: 0, z: 3.6 }], [4.9, 'idle', { z: 3.6 }], [5.3, 'ready', { z: 3.0 }], [6.0, 'charge', { z: 2.2 }], [6.5, 'charge', { z: 1.8 }],
  [6.75, 'crouch', { z: 1.6 }], [6.95, 'jump', { y: 0.3, z: 0.2 }], [7.4, 'jump', { y: 3.4, z: -4.0 }], [7.8, 'land', { y: 0, z: -7.4 }], [8.1, 'land', { z: -7.6 }],
  [8.4, 'run1', { z: -7.8 }], [8.65, 'run2', { z: -9.3 }], [8.9, 'run1', { z: -10.8 }], [9.15, 'slide', { y: 0, z: -12.0 }], [9.7, 'slide', { z: -13.4 }],
  [10.3, 'crouch', { z: -13.6 }], [10.6, 'rise', { y: 2.2, z: -13.6 }], [11.0, 'rise', { y: 5.4, z: -13.2 }], [11.4, 'windup', { y: 6.2, z: -13.0 }], [11.95, 'windup', { y: 6.3, z: -13.0 }],
  [12.0, 'slash', { y: 6.3, z: -13.0 }], [12.5, 'slash', { y: 6.2, z: -13.2 }], [13.2, 'fall', { y: 4.0, z: -12.5 }], [14.1, 'land', { y: 0, z: -11.2 }], [14.8, 'sheathe', { y: 0, z: -11.2 }], [18.6, 'sheathe', { z: -11.2 }],
]);
// ---------- 岩の巨人 ----------
const stone = ['#6c7078', '#62666e', '#787c84', '#585c64', '#6c7078'];
const gBodyT = lam(pix(8, (x, n) => { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { x.fillStyle = stone[Math.floor(rnd(i * 3.7 + j * 9.1 + 5) * stone.length)]; x.fillRect(i, j, 1, 1); } x.fillStyle = '#4a8a3a'; x.fillRect(1, 0, 2, 1); x.fillRect(5, 1, 1, 1); x.fillStyle = '#ff7a20'; x.fillRect(3, 2, 1, 3); x.fillRect(4, 4, 2, 1); x.fillRect(2, 6, 3, 1); }), { emissive: 0xff5a10, emissiveIntensity: 0.12 });
const gStone = lam(noiseTex(stone, 21), { emissive: 0xff5a10, emissiveIntensity: 0.05 });
const gHeadMats = [0, 1, 2, 3, 4, 5].map(f => lam(f === 5 ? pix(8, (x, n) => { x.fillStyle = '#6c7078'; x.fillRect(0, 0, 8, 8); x.fillStyle = '#585c64'; x.fillRect(0, 0, 8, 1); x.fillRect(0, 5, 8, 1); x.fillStyle = '#ff9a20'; x.fillRect(1, 3, 2, 1); x.fillRect(5, 3, 2, 1); x.fillStyle = '#ffe080'; x.fillRect(1, 3, 1, 1); x.fillRect(6, 3, 1, 1); x.fillStyle = '#2a2c34'; x.fillRect(2, 6, 4, 1); }) : noiseTex(stone, 30 + f), f === 5 ? { emissive: 0xff7a20, emissiveIntensity: 0.55, emissiveMap: null } : { emissive: 0x401800, emissiveIntensity: 0.2 }));
const golem = makeBlocky({ scale: 4, legH: 11, legW: 6, legD: 6, bodyW: 12, bodyH: 14, bodyD: 7, cut: 5, headS: 7, armW: 5, armH: 17, mLeg: gStone, mBody: gBodyT, mArm: gStone, mHead: gHeadMats });
golem.root.position.set(0, -10, -17);
const GK = compile([
  [0, 'gidle', { x: 0, y: -10, z: -17, yaw: PI }], [3.0, 'gidle', { y: -10 }], [4.8, 'gidle', { y: 0 }], [5.0, 'groar', { y: 0 }], [5.9, 'groar', { y: 0 }], [6.15, 'gwind', { y: 0 }], [6.5, 'gwind', { y: 0 }],
  [6.58, 'gsmash', { y: 0 }], [7.3, 'gsmash', { y: 0 }], [8.3, 'gidle', { y: 0 }], [8.75, 'gswing', { y: 0 }], [9.15, 'gswing2', { y: 0 }], [9.7, 'gidle', { y: 0 }], [10.5, 'gcut', { y: 0 }], [12.0, 'gcut', { y: 0 }], [13.0, 'gcut', { y: 0 }],
].map(k => k));
GK.forEach(k => { k.pos.z = -17; k.pos.yaw = PI; });

// ---------- 地面・山・空 ----------
const WORLD = new THREE.Group(); scene.add(WORLD);
const grassT = pix(8, (x, n) => { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { x.fillStyle = ['#3a6a38', '#346232', '#40723c', '#2e5a2e'][Math.floor(rnd(i * 5.1 + j * 7.3) * 4)]; x.fillRect(i, j, 1, 1); } });
grassT.wrapS = grassT.wrapT = THREE.RepeatWrapping; grassT.repeat.set(220, 220);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(440, 440), lam(grassT)); ground.rotation.x = -PI / 2; WORLD.add(ground);
// 溶岩のひび(巨人の足元から放射)
const lavaMat = bas(0xff6a10); const lavaBits = [];
for (let r = 0; r < 14; r++) { let a = (r / 14) * PI * 2 + rnd(r) * 0.3, x = 0, z = -17; const len = 6 + rnd(r * 3.1) * 14; for (let k = 0; k < len; k++) { const st = 1 + rnd(r * 9 + k) * 0.7; a += (rnd(r * 5 + k * 2) - 0.5) * 0.7; x += Math.cos(a) * st; z += Math.sin(a) * st; const m = new THREE.Mesh(BOX, lavaMat); m.scale.set(0.5 - k * 0.012, 0.03, 0.5); m.position.set(x, 0.02, z); m.visible = false; WORLD.add(m); lavaBits.push({ m, d: k * 0.07 + r * 0.01 }); } }
// 山並み(奥)と周囲の崖
const NC = 5200; const terr = new THREE.InstancedMesh(BOX, new THREE.MeshLambertMaterial({ color: 0xffffff }), NC); let nc = 0; const tm = new THREE.Matrix4();
for (let i = -34; i <= 34; i++) for (let j = -64; j <= 16; j++) {
  const x = i * 3, z = j * 3; const dx = Math.abs(x), nearArena = dx < 30 && z > -75 && z < 40; if (nearArena || nc >= NC) continue;
  const ridge = 20 + 26 * Math.sin(i * 0.31 + 1.7) * Math.sin(j * 0.23) + 16 * Math.sin(i * 0.9 + j * 0.4) + 10 * rnd(i * 7 + j * 13);
  const far = clamp((-z - 60) / 100); const h = Math.max(1.5, (ridge * (0.25 + far * 1.1)) * (dx > 30 ? 1 : 0.6) + (z < -75 ? 12 * far : 0));
  tm.compose(V3(x, h / 2, z), new THREE.Quaternion(), V3(3, h, 3)); terr.setMatrixAt(nc, tm);
  const c = new THREE.Color(h > 38 ? 0xe8ecf4 : h > 22 ? 0x7a7e8c : h > 8 ? 0x4a5a48 : 0x365a34); c.offsetHSL(0, 0, (rnd(i * 3 + j) - 0.5) * 0.06); terr.setColorAt(nc, c); nc++; }
terr.count = nc; terr.instanceMatrix.needsUpdate = true; terr.instanceColor.needsUpdate = true; WORLD.add(terr);
// 木
const trunkM = lam(noiseTex(['#5a3a22', '#4a2e1a', '#6a4528'], 41)), leafM = lam(noiseTex(['#2a6a30', '#246028', '#30742c', '#1e5424'], 42));
for (let i = 0; i < 90; i++) { const a = rnd(i * 3.7) * PI * 2, d = 24 + rnd(i * 5.9) * 40; const x = Math.cos(a) * d * 0.9, z = -17 + Math.sin(a) * d; if (Math.abs(x) < 8 && z > -40 && z < 14) continue;
  const tr = new THREE.Mesh(BOX, trunkM); tr.scale.set(0.6, 3, 0.6); tr.position.set(x, 1.5, z); WORLD.add(tr);
  for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(BOX, leafM); const s = 3.2 - k * 0.9; l.scale.set(s, 1.3, s); l.position.set(x, 3.4 + k * 1.1, z); WORLD.add(l); } }
// 空(夜→夜明け)
const skyU = { ds: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 20), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
  fragmentShader: `uniform float ds; varying vec3 vP; float h(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
  void main(){ float y=clamp(vP.y,-0.1,1.0); vec3 nt=mix(vec3(0.06,0.09,0.2),vec3(0.01,0.02,0.07),pow(y,0.6)); nt=mix(nt,vec3(0.2,0.12,0.3),pow(1.0-y,4.0)*0.6);
    vec3 dt=mix(vec3(1.0,0.62,0.38),vec3(0.16,0.28,0.6),pow(y,0.5)); vec3 c=mix(nt,dt,ds);
    vec3 g=floor(vP*220.0); float st=step(0.9972,h(g))*(1.0-ds)*smoothstep(0.05,0.4,vP.y); c+=vec3(st);
    vec3 md=normalize(vec3(-0.35,0.42,-0.84)); float m=smoothstep(0.994,0.9965,dot(vP,md)); c=mix(c,vec3(1.0,0.97,0.85),m*(1.0-ds)); c+=vec3(0.5,0.6,1.0)*pow(max(dot(vP,md),0.0),60.0)*0.35*(1.0-ds);
    vec3 sd=normalize(vec3(0.05,mix(-0.05,0.16,ds),-0.99)); float s=smoothstep(0.9975,0.9985,dot(vP,sd)); c=mix(c,vec3(1.0,0.95,0.8),s*ds); c+=vec3(1.0,0.6,0.3)*pow(max(dot(vP,sd),0.0),24.0)*0.7*ds; gl_FragColor=vec4(c,1.0);} ` }));
scene.add(sky);

// ---------- エフェクト基盤 ----------
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const GLOWS = Array.from({ length: 40 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false })); s.visible = false; scene.add(s); return s; }); let gi = 0;
const glow = (p, size, col, a = 1) => { if (gi >= GLOWS.length || a <= 0.01) return; const s = GLOWS[gi++]; s.visible = true; s.position.copy(p); s.scale.setScalar(size); s.material.color.set(col); s.material.opacity = Math.min(1, a); };
const SEGS = Array.from({ length: 220 }, () => { const m = new THREE.Mesh(BOX, bas(0xffffff, { transparent: true })); m.visible = false; scene.add(m); return m; }); let si = 0;
function seg(a, b, w, col, op = 1) { if (si >= SEGS.length) return; const m = SEGS[si++]; const d = b.clone().sub(a); const len = d.length(); if (len < 1e-4) return; m.visible = true; m.material.color.set(col); m.material.opacity = op; m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(w, w, len); m.lookAt(b); }
function bolt(a, b, o) { const { n = 4, jit = 0.2, w = 0.05, color = 0xffffff, seed = 0 } = o; let prev = a.clone(); for (let i = 1; i <= n; i++) { const p = a.clone().lerp(b, i / n); if (i < n) p.add(V3((rnd(seed + i * 3.1) - .5) * jit, (rnd(seed + i * 5.3) - .5) * jit, (rnd(seed + i * 7.7) - .5) * jit)); seg(prev, p, w, color); prev = p; } }
const RINGS = Array.from({ length: 12 }, () => { const m = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); m.visible = false; scene.add(m); return m; }); let ri = 0;
function ringFx(c, r, col, op, axis = 'y') { if (ri >= RINGS.length || op <= 0.01 || r < 0.01) return; const m = RINGS[ri++]; m.visible = true; m.position.copy(c); m.scale.setScalar(r); m.rotation.set(axis === 'y' ? -PI / 2 : 0, 0, 0); m.material.color.set(col); m.material.opacity = op; }
// 破片(決定的な物理)
const NP = 2600; const PARTS = [];
const partsL = new THREE.InstancedMesh(BOX, new THREE.MeshLambertMaterial({ color: 0xffffff }), NP), partsG = new THREE.InstancedMesh(BOX, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), NP);
[partsL, partsG].forEach(m => { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); });
function burst(t0, o, n, op = {}) {
  const { speed = 6, up = 2, life = 1.8, size = 0.3, g = 9, cols = [0xffffff], dir = null, spread = 1, seed = 1, tspan = 0, glowing = false, shrink = true } = op;
  for (let i = 0; i < n; i++) { const r = k => rnd(seed * 91.7 + i * k); let v;
    if (dir) v = V3(dir[0] + (r(1.3) - .5) * spread, dir[1] + (r(2.3) - .5) * spread, dir[2] + (r(3.3) - .5) * spread).normalize().multiplyScalar(speed * (0.4 + r(4.3)));
    else { const a = r(1.7) * PI * 2, e = r(2.9) * 2 - 1; v = V3(Math.cos(a) * Math.sqrt(1 - e * e), e, Math.sin(a) * Math.sqrt(1 - e * e)).multiplyScalar(speed * (0.3 + r(3.9))); v.y += up * r(5.1); }
    const org = Array.isArray(o) ? V3(...o) : o.clone(); PARTS.push({ t0: t0 + (tspan ? r(6.1) * tspan : 0), life: life * (0.7 + r(7.3) * 0.6), p: org.add(V3((r(8.1) - .5) * spread * .3, (r(8.7) - .5) * spread * .3, (r(9.3) - .5) * spread * .3)), v, g, size: size * (0.4 + r(10.3)), col: cols[Math.floor(r(11.3) * cols.length)], glow: glowing, shrink, sp: r(12.1) * 3 }); } }
const dummy = new THREE.Object3D(), col = new THREE.Color();
function updateParts(t) { let a = 0, b = 0; for (const p of PARTS) { const dt = t - p.t0; if (dt < 0 || dt > p.life) continue; const half = p.size / 2;
    let y = p.p.y + p.v.y * dt - 0.5 * p.g * dt * dt, x = p.p.x + p.v.x * dt, z = p.p.z + p.v.z * dt;
    if (p.g > 0 && y < half) { const d2 = p.v.y * p.v.y + 2 * p.g * (p.p.y - half); const th = (p.v.y + Math.sqrt(Math.max(0, d2))) / p.g; x = p.p.x + p.v.x * th * 0.6; z = p.p.z + p.v.z * th * 0.6; y = half; }
    const k = p.shrink ? 1 - smooth(clamp((dt - p.life * 0.6) / (p.life * 0.4))) : 1; dummy.position.set(x, y, z); dummy.rotation.set(dt * p.sp, dt * p.sp * 0.7, 0); dummy.scale.setScalar(p.size * k); dummy.updateMatrix(); col.set(p.col);
    if (p.glow) { if (b >= NP) continue; partsG.setMatrixAt(b, dummy.matrix); partsG.setColorAt(b, col); b++; } else { if (a >= NP) continue; partsL.setMatrixAt(a, dummy.matrix); partsL.setColorAt(a, col); a++; } }
  partsL.count = a; partsG.count = b; partsL.instanceMatrix.needsUpdate = partsG.instanceMatrix.needsUpdate = true; if (partsL.instanceColor) partsL.instanceColor.needsUpdate = true; if (partsG.instanceColor) partsG.instanceColor.needsUpdate = true; }
// 三日月の斬撃(水平)
const crescent = (() => { const N = 48, pos = [], aA = [], idx = []; for (let i = 0; i <= N; i++) { const u = i / N, a = -1.25 + u * 2.5, w = Math.sin(u * PI) ** 0.7; const ro = 1, ri = 1 - 0.34 * w; for (const r of [ro, ri]) { pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); aA.push(u); } if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(aA, 1)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false, uniforms: { rev: { value: 0 }, fade: { value: 1 } },
    vertexShader: 'attribute float aA; varying float vA; varying vec3 vP; void main(){ vA=aA; vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform float rev,fade; varying float vA; varying vec3 vP; void main(){ if(vA>rev) discard; float e=length(vP.xz); float core=smoothstep(0.7,1.0,e); vec3 c=mix(vec3(0.3,0.85,1.0),vec3(1.0),core); float tail=smoothstep(0.0,0.5,vA+ (1.0-rev)*0.0); gl_FragColor=vec4(c*(0.55+0.7*core)*fade*tail,1.0);}' })); m.visible = false; m.frustumCulled = false; scene.add(m); return m; })();

// ---------- 粒子の登録 ----------
const DUST = [0x8a8068, 0x6a6048, 0x4a4030, 0x3a6a38];
const LAVAC = [0xff7a20, 0xff4a10, 0xffc040, 0x2a2420];
burst(T.rise + 0.1, [0, 0.2, -17], 130, { speed: 5, up: 6, life: 2.2, size: 0.55, g: 9, cols: DUST, seed: 1, spread: 8, tspan: 1.7 });
burst(T.rise + 0.3, [0, 0.4, -17], 90, { speed: 3, up: 5, life: 2.0, size: 0.3, g: 6, cols: LAVAC, seed: 2, spread: 8, tspan: 1.5, glowing: true });
burst(T.roar, [0, 0.3, -17], 100, { speed: 8, up: 3, life: 1.6, size: 0.5, g: 9, cols: DUST, seed: 3, spread: 6 });
burst(T.smash, [0, 0.3, -12.8], 220, { speed: 11, up: 7, life: 2.0, size: 0.6, g: 11, cols: [...DUST, 0x6c7078], seed: 4, spread: 4 });
burst(T.smash, [0, 0.4, -12.8], 80, { speed: 8, up: 8, life: 1.6, size: 0.25, g: 8, cols: LAVAC, seed: 5, spread: 4, glowing: true });
burst(T.land1, [0, 0.2, -7.6], 70, { speed: 5, up: 3, life: 1.4, size: 0.4, g: 9, cols: DUST, seed: 6, spread: 3 });
burst(T.swing + 0.2, [0, 0.2, -12.5], 60, { speed: 6, up: 2, life: 1.4, size: 0.4, g: 9, cols: DUST, seed: 7, spread: 3 });
burst(T.boom, [0, 6, -17], 420, { speed: 20, up: 6, life: 2.8, size: 0.85, g: 9, cols: [0x6c7078, 0x585c64, 0x787c84, 0x2a2c34, 0xff7a20], seed: 8, spread: 3 });
burst(T.boom, [0, 6, -17], 300, { speed: 17, up: 8, life: 2.4, size: 0.35, g: 7, cols: LAVAC, seed: 9, spread: 3, glowing: true });
burst(T.boom, [0, 1, -17], 150, { speed: 10, up: 5, life: 2.2, size: 0.5, g: 9, cols: DUST, seed: 10, spread: 6 });
burst(T.land, [0, 0.2, -11.2], 60, { speed: 5, up: 3, life: 1.4, size: 0.35, g: 9, cols: DUST, seed: 11, spread: 3 });
burst(0, [0, 1, -10], 240, { speed: 2.5, up: 4, life: 5.5, size: 0.1, g: -0.4, cols: LAVAC, seed: 12, spread: 80, tspan: 18, glowing: true, shrink: true });
burst(T.boom + 0.1, [0, 4, -17], 200, { speed: 4, up: 9, life: 4.5, size: 0.12, g: -0.6, cols: LAVAC, seed: 13, spread: 14, tspan: 2.5, glowing: true });

// ---------- 状態 ----------
let flashW = 0, invert = 0, shakeAmp = 0, caBoost = 0, bd = null; const SPEED = [[T.smash, 0.25], [T.jump + 0.1, 0.3], [T.dash, 0.35], [T.leap, 0.4], [T.slash, 0.2]];
function updateScene(t, tvid) {
  const ds = clamp((t - T.dawn) / 2.6); skyU.ds.value = smooth(ds);
  scene.fog.color.set(0x1a1430).lerp(new THREE.Color(0xd09070), smooth(ds)); hemi.intensity = 0.95 + 0.55 * smooth(ds); moonL.intensity = 1.1 - 0.7 * smooth(ds);
  hemi.color.set(0x8090e0).lerp(new THREE.Color(0xffd8b0), smooth(ds));
  // 巨人の地面のひび
  const lg = clamp((t - T.rise) / 1.6); lavaBits.forEach(b => { b.m.visible = lg > b.d * 1.2; });
  const hp = evalActor(HK, t, 0), gp = evalActor(GK, t, 1.7);
  // 巨人: 起き上がり
  if (t < T.riseDone) gp.y = -10 + 10 * easeOut(clamp((t - T.rise) / (T.riseDone - T.rise))); if (t >= T.rise && t < T.riseDone) { gp.x += (rnd(Math.floor(tvid * 30)) - .5) * 0.18; gp.z += (rnd(Math.floor(tvid * 30) + 9) - .5) * 0.18; }
  // 切断後に上半身がずれ落ちる
  setPose(hero, hp); setPose(golem, gp);
  const hit = t - T.slash; golem.capUp.visible = golem.capLow.visible = hit >= 0;
  if (hit >= 0) { const e = easeOut(clamp(hit / 0.8)); const f = Math.max(0, hit - 0.5); golem.torso.position.set(2.2 * e + 4 * f * f, 0.4 * e + 1.2 * e * e - 2.0 * f * f * 0, 0.6 * e); golem.torso.rotation.z = -0.35 * e - 0.4 * f; golem.torso.rotation.x += 0.0; golem.hips.rotation.z = 0; golem.torso.position.y = 0.35 * e + 0.0; }
  else golem.torso.position.set(0, 0, 0);
  golem.root.visible = t < T.boom; golem.head.material[5].emissiveIntensity = 0.25 + 0.5 * clamp((t - T.rise) / 1.8) + 0.3 * (t > T.roar && t < T.roar + 1 ? 1 : 0);
  gBodyT.emissiveIntensity = 0.12 + 0.5 * clamp((t - T.rise) / 1.8);
  lavaL.intensity = 40 * clamp((t - T.rise) / 1.8) * (t < T.boom ? 1 : Math.max(0, 1 - (t - T.boom) * 2)); lavaL.position.set(0, 3 + Math.max(0, gp.y), -15.5);
  // マフラーのなびき
  hero.torso.updateMatrixWorld(true); const v = clamp((Math.abs(hp.z - HK[0].pos.z) > 0.01 ? 1 : 0)); const tvx = Math.min(1, 0.4 + (t > T.jump ? 0.6 : 0));
  hero.scarf.forEach((m, i) => { m.position.set(0, 12 * PXs - 0.05, 0.12 + i * 0.3); m.rotation.x = 0.2 + Math.sin(tvid * 9 + i * 0.9) * 0.18 * tvx * (i + 1) * 0.5 + (t > T.jump ? 0.15 : 0); m.position.y += -Math.sin(tvid * 7 + i) * 0.04 * (i + 1) - i * 0.03; });
}
function tipAt(t) { setPose(hero, evalActor(HK, t, 0)); hero.root.updateMatrixWorld(true); return worldOf(hero.tip); }

// ---------- エフェクト ----------
function updateFx(t, tvid, frame) {
  flashW = 0; invert = 0; shakeAmp = 0; caBoost = 0; fxLight.intensity = 0; gi = 0; si = 0; ri = 0;
  GLOWS.forEach(s => (s.visible = false)); SEGS.forEach(s => (s.visible = false)); RINGS.forEach(r => (r.visible = false)); crescent.visible = false;
  hero.root.updateMatrixWorld(true); const tipW = worldOf(hero.tip), bladeC = worldOf(hero.blade); const gC = V3(0, 5.5, -17);
  // 起き上がり: 揺れ
  if (t > T.rise && t < T.riseDone) { shakeAmp = Math.max(shakeAmp, 0.18 * Math.sin(clamp((t - T.rise) / (T.riseDone - T.rise)) * PI) + 0.05); }
  if (t >= T.rise && t < T.riseDone + 0.3) { for (let b = 0; b < 8; b++) { const a = rnd(b * 3.1 + frame) * PI * 2; const base = V3(Math.cos(a) * 3.2, 0.2, -17 + Math.sin(a) * 3.2); bolt(base, base.clone().add(V3(0, 1.5 + rnd(b + frame) * 3, 0)), { n: 3, jit: 0.3, w: 0.07, color: 0xff7a20, seed: frame * 3 + b }); } glow(V3(0, 0.5, -17), 12 * clamp((t - T.rise) / 1.8), 0xff5a10, 0.5); }
  // 咆哮
  { const d = t - T.roar; if (d >= 0 && d < 1.0) { ringFx(V3(0, 0.1, -17), 3 + 18 * easeOut(d / 1.0), 0xffb060, 0.8 * (1 - d), 'y'); shakeAmp = Math.max(shakeAmp, 0.35 * (1 - d)); flashW = Math.max(flashW, d < 0.05 ? 0.18 : 0); } }
  // 勇者の剣のチャージ
  if (t > T.charge && t < T.smash + 0.3) { const g = smooth(clamp((t - T.charge) / 1.0)); glow(tipW, 0.8 + 1.6 * g, 0x70e0ff, 0.9); glow(bladeC, 1.0 + 1.0 * g, 0xffffff, 0.6); swordL.intensity = 18 * g; swordL.position.copy(bladeC);
    for (let b = 0; b < 4; b++) bolt(bladeC, bladeC.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(0.5 + 0.7 * g)), { n: 3, jit: 0.1, w: 0.025, color: 0x9ad8ff, seed: frame * 3 + b }); }
  else if (t >= T.smash + 0.3 && t < T.windup) { swordL.intensity = 4; swordL.position.copy(bladeC); glow(tipW, 1.2, 0x70e0ff, 0.6); } else if (t < T.charge) swordL.intensity = 0;
  // 巨人の叩きつけ
  { const d = t - T.smash; if (d >= 0 && d < 1.4) { const c = V3(0, 0.2, -12.8); const k = easeOut(clamp(d / 1.0)); ringFx(c, 1 + 26 * k, 0xffc080, 0.9 * (1 - clamp(d / 1.0)), 'y'); ringFx(c, 0.6 + 14 * k, 0xffffff, 0.7 * (1 - clamp(d / 0.5)), 'y');
      for (let b = 0; b < 10; b++) { const a = (b / 10) * PI * 2 + rnd(b) * 0.3; const e = c.clone().add(V3(Math.cos(a) * 14 * k, 0.1, Math.sin(a) * 14 * k)); bolt(c, e, { n: 6, jit: 0.5, w: 0.12 * (1 - d / 1.4), color: 0xff7a20, seed: b * 7 }); }
      flashW = Math.max(flashW, d < 0.05 ? 0.55 : 0.1 * (1 - d / 0.6)); shakeAmp = Math.max(shakeAmp, 1.0 * (1 - clamp(d / 1.2))); if (d < 0.025) invert = 1; fxLight.color.set(0xff8030); fxLight.position.copy(c).add(V3(0, 1.5, 0)); fxLight.intensity = 80 * (1 - clamp(d / 0.9)); } }
  // 跳躍・着地・ダッシュ
  { const d = t - T.land1; if (d >= 0 && d < 0.7) { ringFx(V3(0, 0.1, -7.6), 1 + 7 * easeOut(d / 0.7), 0xffffff, 0.6 * (1 - d / 0.7), 'y'); shakeAmp = Math.max(shakeAmp, 0.3 * (1 - d / 0.7)); } }
  if ((t > T.jump && t < T.land1) || (t > T.dash && t < T.dash + 1.3) || (t > T.leap && t < T.windup)) { const a0 = t > T.leap ? 0.5 : 0.35; const pts = []; for (let k = 0; k < 10; k++) pts.push(tipAt(Math.max(0, t - k * 0.04))); setPose(hero, evalActor(HK, t, 0)); hero.root.updateMatrixWorld(true);
    for (let k = 1; k < 10; k++) seg(pts[k - 1], pts[k], 0.1 * (1 - k / 10) + 0.01, 0x9ae8ff, 1 - k / 10); }
  // 巨人の薙ぎ払い
  { const d = t - T.swing; if (d >= 0 && d < 0.9) { const c = V3(0, 1.0, -17); ringFx(V3(0, 0.1, -14), 2 + 8 * easeOut(d / 0.9), 0xffd0a0, 0.5 * (1 - d / 0.9), 'y'); shakeAmp = Math.max(shakeAmp, 0.3 * Math.sin(d / 0.9 * PI)); } }
  // 溜め→斬撃
  if (t >= T.windup && t < T.slash) { const g = smooth(clamp((t - T.windup) / 0.8)); glow(tipW, 1.0 + 1.8 * g, 0x70e0ff, 0.9); glow(bladeC, 1.2 + 1.2 * g, 0xffffff, 0.5); swordL.intensity = 22 * g; swordL.position.copy(bladeC); caBoost = 0.003 * g; shakeAmp = Math.max(shakeAmp, 0.05 + 0.1 * g);
    for (let b = 0; b < 6; b++) bolt(bladeC, bladeC.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(1.0 + 1.8 * g)), { n: 3, jit: 0.2, w: 0.04, color: b % 2 ? 0xffffff : 0x70e0ff, seed: frame * 3 + b }); }
  { const d = t - T.slash; if (d >= 0 && d < 1.6) { const rev = clamp(d / 0.08), fade = 1 - smooth(clamp((d - 0.25) / 1.2)); const hc = V3(0, 6.3, -13.0);
      crescent.visible = true; crescent.position.set(0, 5.8, -3.0); crescent.rotation.set(0.0, PI / 2, 0.0); crescent.scale.set(14 + 3 * easeOut(clamp(d / 0.4)), 1, 14 + 3 * easeOut(clamp(d / 0.4))); crescent.material.uniforms.rev.value = rev; crescent.material.uniforms.fade.value = fade;
      glow(V3(0, 5.7, -17), 5 * fade, 0x80e8ff, 0.45 * fade); swordL.intensity = 20 * fade; swordL.position.set(0, 6, -15);
      if (d < 0.5) { const pts = []; for (let k = 0; k < 12; k++) pts.push(tipAt(Math.max(T.windup, t - k * 0.02))); setPose(hero, evalActor(HK, t, 0)); hero.root.updateMatrixWorld(true); for (let k = 1; k < 12; k++) seg(pts[k - 1], pts[k], 0.22 * (1 - k / 12) + 0.02, k % 2 ? 0xffffff : 0x8aeaff, 1 - k / 12); }
      for (let b = 0; b < 7; b++) { const x = (rnd(b * 3.3) - .5) * 5.5, a = V3(x, 5.7, -17 + (rnd(b * 5) - .5) * 1.5); bolt(a, a.clone().add(V3((rnd(b + frame) - .5) * 4, (rnd(b * 3 + frame) - .5) * 2, (rnd(b * 5 + frame) - .5) * 4)), { n: 4, jit: .3, w: 0.07 * fade, color: b % 2 ? 0xffffff : 0xffb040, seed: frame * 3 + b }); }
      flashW = Math.max(flashW, d < 0.04 ? 0.45 : 0.04 * (1 - clamp(d / 0.4))); shakeAmp = Math.max(shakeAmp, 0.9 * (1 - clamp(d / 1.0))); if (d < 0.02) invert = 1; caBoost = 0.008 * (1 - clamp(d / 0.6)); fxLight.color.set(0x90e8ff); fxLight.position.set(0, 6, -15); fxLight.intensity = 30 * (1 - clamp(d / 1.0)); } }
  // 大爆発
  { const d = t - T.boom; if (d >= 0 && d < 1.5) { const c = V3(0, 5.5, -17); const k = easeOut(clamp(d / 0.8)); ringFx(c, 2 + 30 * k, 0xffd090, 0.9 * (1 - clamp(d / 0.8)), 'z'); ringFx(V3(0, 0.2, -17), 2 + 36 * k, 0xff9a40, 0.8 * (1 - clamp(d / 1.0)), 'y'); ringFx(c, 1 + 18 * k, 0xffffff, 0.7 * (1 - clamp(d / 0.4)), 'y');
      glow(c, 22 * (1 - clamp(d / 1.1)), 0xff8a30, 0.9); glow(c, 10 * (1 - clamp(d / 0.5)), 0xffffff, 0.9); for (let b = 0; b < 16; b++) { const dir = V3(rnd(b * 1.7) - .5, rnd(b * 2.9) - .3, rnd(b * 4.1) - .5).normalize(); bolt(c, c.clone().addScaledVector(dir, (3 + 9 * rnd(b * 5)) * easeOut(clamp(d / 0.3))), { n: 5, jit: .6, w: 0.18 * (1 - clamp(d / 1.0)) + 0.01, color: b % 2 ? 0xff7a20 : 0xffe0a0, seed: frame * 3 + b }); }
      flashW = Math.max(flashW, d < 0.04 ? 0.8 : 0.2 * (1 - clamp(d / 0.7))); shakeAmp = Math.max(shakeAmp, 1.2 * (1 - clamp(d / 1.3))); if (d < 0.02) invert = 1; fxLight.color.set(0xff8a30); fxLight.position.copy(c); fxLight.intensity = 140 * (1 - clamp(d / 1.2)); caBoost = 0.01 * (1 - clamp(d / 0.8)); } }
  { const d = t - T.land; if (d >= 0 && d < 0.7) { ringFx(V3(0, 0.1, -11.2), 1 + 6 * easeOut(d / 0.7), 0xffffff, 0.5 * (1 - d / 0.7), 'y'); shakeAmp = Math.max(shakeAmp, 0.3 * (1 - d / 0.7)); } }
  // 夜明けの光
  if (t > T.dawn) { glow(V3(0, 12 + 18 * clamp((t - T.dawn) / 3), -300), 140, 0xffa860, 0.5 * clamp((t - T.dawn) / 2)); }
}

// ---------- カメラ ----------
function shot(t, tvid) {
  bd = null; if (q.has('cam')) { const c = q.get('cam').split(',').map(Number); camera.position.set(c[0], c[1], c[2]); camera.up.set(0, 1, 0); camera.lookAt(c[3], c[4], c[5]); camera.fov = c[6] || 50; camera.updateProjectionMatrix(); return; }
  let p, l, fov = 50, roll = 0, sh = 0; const hp = hero.root.position, gp = golem.root.position; const hh = V3(hp.x, hp.y + 1.5, hp.z); const gh = V3(0, 7.2 + Math.max(0, gp.y), -17);
  if (t < 3.0) { p = V(kf(t, [[0, [1.4, 9, 14]], [3, [0.5, 1.9, 9.4]]], easeOut)); l = V(kf(t, [[0, [0, 1.0, -2]], [3, [0, 2.4, -10]]], easeOut)); fov = kf(t, [[0, 52], [3, 46]], easeOut); sh = 0.01; roll = kf(t, [[0, 0.12], [3, 0]], easeOut); }
  else if (t < 4.8) { p = V(kf(t, [[3, [1.5, 0.7, 6.2]], [4.8, [1.2, 0.9, 5.4]]], lin)); l = V(kf(t, [[3, [0, 1.0, -17]], [4.8, [0, 4.5, -17]]], smooth)); fov = 58; sh = 0.04; roll = -0.05; }
  else if (t < 5.8) { p = V(kf(t, [[4.8, [2.8, 1.3, -6.0]], [5.8, [1.6, 1.8, -7.0]]], lin)); l = gh.clone().add(V3(0, -0.6, 0)); fov = 56; sh = 0.03; roll = 0.07; }
  else if (t < 6.5) { p = V3(hp.x - 1.7, 1.5, hp.z - 2.9); l = V3(hp.x, 1.3, hp.z + 0.1); fov = 38; sh = 0.012; }
  else if (t < 7.4) { p = V3(10.5, 3, -1.0); l = V3(0, 2.6, -8.5); fov = 62; sh = 0.04; roll = -0.06; }
  else if (t < 8.4) { p = V3(hp.x + 3.4, hp.y + 1.2, hp.z + 3.2); l = V3(hp.x, hp.y + 1.0, hp.z - 1.5); fov = 50; sh = 0.04; roll = 0.1; }
  else if (t < 10.3) { p = V3(6.5, 1.5, hp.z + 0.5); l = V3(0, 1.3, hp.z - 1.5); fov = 52; sh = 0.04; roll = -0.1; }
  else if (t < 11.4) { p = V3(1.2, 0.6, -6.8); l = V3(0, hp.y + 0.8, -14.8); fov = 50; sh = 0.03; roll = kf(t, [[10.3, 0.12], [11.4, -0.04]], smooth); }
  else if (t < T.slash) { p = V3(hp.x - 2.6, hp.y + 0.2, hp.z - 1.0); l = V3(hp.x, hp.y + 0.7, hp.z); fov = 36; sh = 0.015; }
  else if (t < 12.9) { p = V3(7.5, 12, -6.5); l = V3(0, 5.6, -16); fov = 52; sh = 0.05; roll = 0.06; }
  else if (t < T.land) { p = V(kf(t, [[12.9, [-10, 3, -5]], [T.land, [-12, 2.5, -4]]], lin)); l = V3(0, 6.0, -17); fov = 62; sh = 0.04; roll = -0.08; }
  else if (t < T.dawn) { p = V(kf(t, [[T.land, [0.0, 2.0, -3.6]], [T.dawn, [0.0, 2.0, -4.0]]], lin)); l = V3(0, 2.2, -14); fov = 44; sh = 0.012; }
  else { p = V(kf(t, [[T.dawn, [0.0, 2.0, -4.0]], [END, [7, 16, 2]]], smooth)); l = V(kf(t, [[T.dawn, [0, 2.2, -14]], [END, [0, 4, -26]]], smooth)); fov = kf(t, [[T.dawn, 44], [END, 56]], smooth); sh = 0.008; }
  const total = Math.max(sh, shakeAmp); camera.up.set(0, 1, 0); camera.position.copy(p).add(shake(tvid, total)); camera.lookAt(l); camera.up.set(0, 1, 0);
  if (roll) { const fwd = l.clone().sub(p).normalize(); camera.up.applyAxisAngle(fwd, roll); camera.lookAt(l); } camera.fov = fov; camera.updateProjectionMatrix();
}

// ---------- ポスト ----------
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera)); const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 0.8); composer.addPass(bloom); composer.addPass(new OutputPass());
const post = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uFlash: { value: 0 }, uInv: { value: 0 }, uFade: { value: 0 }, uCA: { value: 0.0007 }, uVig: { value: 0.4 } },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float uFlash,uInv,uFade,uCA,uVig; varying vec2 vUv; void main(){ vec2 d=vUv-.5; vec2 ca=d*uCA*(0.5+length(d))*6.0; vec3 col; col.r=texture2D(tDiffuse,vUv+ca).r; col.g=texture2D(tDiffuse,vUv).g; col.b=texture2D(tDiffuse,vUv-ca).b; float l=dot(col,vec3(.299,.587,.114)); col=mix(col,vec3(1.0-l*1.1),uInv); col+=uFlash; float v=1.0-smoothstep(0.5,1.1,length(d*vec2(1.0,.6))); col*=mix(1.0,v,uVig); col*=1.0-uFade; gl_FragColor=vec4(col,1.0);}' });
composer.addPass(post);
function updatePost(t, tvid) { const u = post.uniforms; u.uInv.value = invert; u.uFlash.value = flashW * (invert ? 0 : 1); u.uFade.value = kf(tvid, [[0, 1], [0.3, 0], [VID_DUR - 1.0, 0], [VID_DUR, 1]], lin); u.uCA.value = 0.0007 + caBoost; bloom.strength = 0.5 + Math.min(0.9, flashW * 0.8); }
function drawSpeed(c, t, tvid) { for (const [ts, dur] of SPEED) { const d = t - ts; if (d < 0 || d > dur) continue; const k = d / dur, fr = Math.floor(tvid * 24); c.save(); c.translate(W / 2, H * 0.5); c.strokeStyle = '#fff'; c.lineCap = 'round';
    for (let i = 0; i < 60; i++) { const a = rnd(i * 3.1 + fr) * PI * 2, r0 = (0.28 + rnd(i * 1.9 + fr * 0.3) * 0.2) * H, r1 = H * (0.7 + rnd(i * 7.3) * 0.2); c.globalAlpha = 0.45 * (1 - k); c.lineWidth = (2 + rnd(i * 5.5) * 6) * SC; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 0.9); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); } c.restore(); } }
let lastF = -1;
function renderAt(tvid) { const t = tau(tvid); const frame = Math.floor(tvid * 60); updateScene(t, tvid); updateFx(t, tvid, frame); updateParts(t); shot(t, tvid); updatePost(t, tvid); composer.render(); ctx2.drawImage(renderer.domElement, 0, 0, W, H); drawSpeed(ctx2, t, tvid); }
window.renderAt = renderAt; window.frameDataURL = () => out2d.toDataURL('image/jpeg', 0.93); window.VID_DUR = VID_DUR; window.READY = true;
if (q.has('t')) renderAt(parseFloat(q.get('t')));
