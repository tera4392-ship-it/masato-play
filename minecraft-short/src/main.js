// もしも宿儺とモジュロ虎杖が戦ったら(マイクラ風ブロック・縦型ショート)
// すべて t(秒) の純関数として描画する。非商用のファン作品。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeYuji, makeSukuna, setPose, setTint, worldOf, PX } from './chars.js';
import { T, CAPS, COUNTS, HP, DUR } from './timeline.js';

const q = new URLSearchParams(location.search);
const SC = parseFloat(q.get('s') ?? '1');
const W = Math.round(1080 * SC), H = Math.round(1920 * SC);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;

// ---------- utils ----------
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

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 600); scene.add(camera);
const hemi = new THREE.HemisphereLight(0x9aa8ff, 0x302a40, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffc890, 1.6); sun.position.set(-12, 22, 14); scene.add(sun);
const fxLight = new THREE.PointLight(0xff2040, 0, 22, 1.3); scene.add(fxLight);
const out2d = document.createElement('canvas'); out2d.width = W; out2d.height = H; document.body.appendChild(out2d);
const ctx2 = out2d.getContext('2d');

// ---------- テクスチャ/素材 ----------
function ptex(n, fn, rep) {
  const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); fn(x, n);
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const noiseFill = (cols, seed) => (x, n) => { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { x.fillStyle = cols[Math.floor(rnd(i * 7.3 + j * 13.1 + seed) * cols.length)]; x.fillRect(i, j, 1, 1); } };
const lam = (c, extra = {}) => new THREE.MeshLambertMaterial({ color: c, ...extra });
const bas = (c, extra = {}) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...extra });
const BOX = new THREE.BoxGeometry(1, 1, 1);
function box(g, w, h, d, x, y, z, mat) { const m = new THREE.Mesh(BOX, mat); m.scale.set(w, h, d); m.position.set(x, y + h / 2, z); g.add(m); return m; }
function sky(top, bot) {
  return new THREE.Mesh(new THREE.SphereGeometry(300, 16, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { t: { value: new THREE.Color(top) }, b: { value: new THREE.Color(bot) } },
    vertexShader: 'varying vec3 v; void main(){v=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform vec3 t,b; varying vec3 v; void main(){float h=clamp(v.y*1.5+0.08,0.,1.); gl_FragColor=vec4(mix(b,t,pow(h,.7)),1.0);}'
  }));
}
function floorPlane(g, tex, size = 400) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial({ map: tex })); m.rotation.x = -PI / 2; g.add(m); return m;
}

// ---------- ステージ(3種) ----------
const ENV = {};
// A: 夕暮れの荒野
(function () {
  const g = new THREE.Group(); ENV.A = { g, fog: [0xd88a78, 40, 170], hemi: [0xb8b0ff, 0x4a3a40, 1.0], sun: [0xffc08a, 1.7] };
  g.add(sky(0x2a1a58, 0xff9a60));
  floorPlane(g, ptex(16, noiseFill(['#4f8a3c', '#468036', '#5a9444', '#3f7430', '#4f8a3c'], 3), 100));
  const trunk = lam(0x6a4426), leaf = lam(0x3a7a2e), leaf2 = lam(0x2f6a28);
  for (let i = 0; i < 34; i++) {
    const a = rnd(i * 3.3) * PI * 2, d = 20 + rnd(i * 5.1) * 55, x = Math.cos(a) * d, z = Math.sin(a) * d - 5;
    box(g, 0.9, 4, 0.9, x, 0, z, trunk);
    box(g, 4, 2, 4, x, 3.6, z, i % 2 ? leaf : leaf2); box(g, 2.6, 2, 2.6, x, 5.4, z, leaf);
  }
  for (let i = 0; i < 16; i++) { // 丘
    const a = rnd(i * 9.7) * PI * 2, d = 70 + rnd(i * 4.4) * 60;
    box(g, 14 + rnd(i) * 20, 4 + rnd(i * 2) * 9, 14 + rnd(i * 3) * 20, Math.cos(a) * d, 0, Math.sin(a) * d - 5, lam(i % 3 ? 0x4a7c3a : 0x7a6a50));
  }
  for (let i = 0; i < 14; i++) box(g, 10 + rnd(i) * 10, 1.2, 6 + rnd(i * 2) * 6, (rnd(i * 6) - 0.5) * 200, 38 + rnd(i * 7) * 14, -60 - rnd(i * 8) * 60, bas(0xffc8b8));
  for (let i = 0; i < 40; i++) box(g, 0.5, 0.5, 0.5, (rnd(i * 2.2) - 0.5) * 30, 0, (rnd(i * 3.1) - 0.5) * 30, lam(rnd(i) > 0.5 ? 0x8a8a8a : 0x6a4a30)).scale.y = 0.3 + rnd(i) * 0.5;
  scene.add(g);
})();
// S: 宿儺の領域(骨と祠と血の海)
(function () {
  const g = new THREE.Group(); ENV.S = { g, fog: [0x300408, 30, 120], hemi: [0xff6a6a, 0x300808, 0.95], sun: [0xff8a7a, 1.0] };
  g.add(sky(0x08000a, 0x8a1018));
  floorPlane(g, ptex(16, noiseFill(['#5a0a10', '#6a0e14', '#4a080c', '#780f18', '#5a0a10'], 5), 100));
  const bone = lam(0xe8e2d0), dark = lam(0x2a1410), wood = lam(0x4a2018), roofm = lam(0x1a0c10);
  box(g, 16, 1.0, 12, 0, 0, -32, lam(0x241418)); box(g, 12, 0.6, 9, 0, 1.0, -32, lam(0x32181c));
  for (const [sx, sz] of [[-6, -29], [6, -29], [-6, -35], [6, -35]]) box(g, 1, 8, 1, sx, 1.6, sz, wood);
  box(g, 20, 0.9, 15, 0, 9.4, -32, roofm); box(g, 15, 0.9, 11, 0, 10.3, -32, roofm); box(g, 9, 0.9, 7, 0, 11.2, -32, roofm);
  box(g, 22, 0.5, 2, 0, 9.0, -24.8, lam(0x8a1018));
  const sk = box(g, 4, 3, 4, 0, 12.2, -32, bone); // 牛の頭蓋骨
  for (const sx of [-1, 1]) { box(g, 3.5, 0.8, 0.8, sx * 3.4, 14.2, -32, bone); box(g, 0.8, 2.5, 0.8, sx * 5, 14.2, -32, bone); box(g, 0.9, 0.9, 0.3, sx * 1.1, 13.2, -29.9, bas(0xff2030)); }
  for (const lx of [-8, -3, 3, 8]) box(g, 0.9, 0.9, 0.9, lx, 7.4, -24.5, bas(0xff3a30));
  for (let i = 0; i < 26; i++) { // 骨の柱と頭蓋骨
    const a = (i / 26) * PI * 2 + rnd(i) * 0.2, d = 24 + rnd(i * 3) * 18, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const h = 3 + rnd(i * 2) * 7; box(g, 1.1, h, 1.1, x, 0, z, bone); box(g, 1.7, 1.2, 1.7, x, h, z, bone);
    box(g, 0.5, 0.5, 0.2, x - 0.4, h + 0.4, z + 0.9, dark); box(g, 0.5, 0.5, 0.2, x + 0.4, h + 0.4, z + 0.9, dark);
  }
  for (let i = 0; i < 60; i++) box(g, 0.7 + rnd(i) * 1.2, 0.5, 0.7 + rnd(i * 2) * 1.2, (rnd(i * 4.4) - 0.5) * 70, 0, (rnd(i * 5.5) - 0.5) * 60 - 5, bone);
  scene.add(g);
})();
// Y: 虎杖の領域(赤い空と黒曜石の闘技場、拳の石碑、脈打つ黒い火花)
(function () {
  const g = new THREE.Group(); ENV.Y = { g, fog: [0xa83020, 40, 160], hemi: [0xffb080, 0x40202a, 1.0], sun: [0xffcf9a, 1.8] };
  g.add(sky(0x38061a, 0xff7a30));
  const ft = ptex(2, (x) => { x.fillStyle = '#1b1220'; x.fillRect(0, 0, 2, 2); x.fillStyle = '#2c2034'; x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 1, 1); }, 90);
  floorPlane(g, ft);
  const st = lam(0x14101a), fist = lam(0x3a3040);
  for (let i = 0; i < 16; i++) { // 拳の石碑
    const a = (i / 16) * PI * 2, d = 26, x = Math.cos(a) * d, z = Math.sin(a) * d;
    box(g, 2.2, 8, 2.2, x, 0, z, st);
    const f = box(g, 3.2, 2.2, 3.2, x, 8, z, fist);
    for (let k = 0; k < 4; k++) box(g, 0.7, 0.7, 1.4, x - 1.1 + k * 0.75, 8.9, z - Math.sign(z || 1) * 0.1, fist);
  }
  for (let i = 0; i < 24; i++) box(g, 0.6, 0.6, 0.6, (rnd(i * 3.3) - 0.5) * 60, 0, (rnd(i * 4.9) - 0.5) * 60, lam(0x241a2c)).scale.y = 0.5 + rnd(i);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(18, 20, 14), bas(0xff3a2a, { fog: false })); sunBall.position.set(0, 12, -150); g.add(sunBall);
  scene.add(g);
})();
Object.values(ENV).forEach(e => (e.g.visible = false));
function setEnv(k) {
  for (const n in ENV) ENV[n].g.visible = n === k;
  if (!k) { scene.fog = null; return; }
  const e = ENV[k]; scene.fog = new THREE.Fog(e.fog[0], e.fog[1], e.fog[2]);
  hemi.color.set(e.hemi[0]); hemi.groundColor.set(e.hemi[1]); hemi.intensity = e.hemi[2];
  sun.color.set(e.sun[0]); sun.intensity = e.sun[1];
}

// ---------- キャラ ----------
const Y = makeYuji(scene), S = makeSukuna(scene);
const PRE = {
  idle: { Rf: .05, Rab: .1, Lf: .05, Lab: .1 },
  sign: { Rf: 1.5, Rab: -.15, Lf: 1.5, Lab: -.15, lean: .05 },
  strain: { Rf: 1.5, Rab: -.15, Lf: 1.5, Lab: -.15, lean: .15, lr: .2, ll: -.2 },
  guard: { Rf: 1.3, Rab: -.3, Lf: 1.3, Lab: -.3, lean: .25, lr: .4, ll: -.3 },
  up: { Rf: 3.0, Rab: .1, Lf: .1, Lab: .2, lean: -.25, lr: .2, ll: -.2 },
  slash: { Rf: .5, Rab: .1, Lf: .1, Lab: .2, lean: .6, lr: .6, ll: -.4 },
  bow: { Lf: 1.57, Lab: 0, Rf: 1.57, Rab: 1.4, lean: .1, lr: .3, ll: -.3 },
  release: { Lf: 1.57, Lab: 0, Rf: 1.57, Rab: .1, lean: .0, lr: .3, ll: -.3 },
  laugh: { lean: -.35, headP: -.5, Rf: .3, Lf: .3, Rab: .5, Lab: .5 },
  windR: { Rf: -.9, Lf: .5, Lab: .3, lean: -.1, twist: .3, lr: -.3, ll: .3 },
  windL: { Lf: -.9, Rf: .5, Rab: .3, lean: -.1, twist: -.3, lr: .3, ll: -.3 },
  punchR: { Rf: 1.57, Rab: 0, Lf: .5, Lab: .3, lean: .5, lr: .6, ll: -.5, twist: -.3 },
  punchL: { Lf: 1.57, Lab: 0, Rf: .5, Rab: .3, lean: .5, lr: -.5, ll: .6, twist: .3 },
  lunge: { lean: .7, lr: .9, ll: -.7, Rf: 1.0, Lf: -.6 },
  stagger: { lean: -.4, Rf: -.3, Lf: .4, lr: -.3, ll: .3, headP: -.3 },
  hurt: { lean: -.7, Rf: -.5, Lf: -.5, Rab: .8, Lab: .8, lr: -.4, ll: .2, headP: -.5 },
  kneel: { lr: 1.2, ll: -.5, lean: .3, Rf: .4, Lf: .4, headP: .3 },
  dodge: { lean: .5, Lab: 1.0, Rab: -.2, lr: .5, ll: -.4, twist: .4 },
  palms: { Rf: 1.57, Rab: -.1, Lf: 1.57, Lab: -.1, lean: .15, lr: .3, ll: -.3 },
  win: { Rf: 3.1, Rab: .2, Lf: .1, Lab: .3, lean: -.1, headP: -.2 },
  ko: { ko: 1, Rf: .1, Lf: .1, Rab: .4, Lab: .4 },
};
const POSEK = ['Rf', 'Rab', 'Lf', 'Lab', 'lr', 'll', 'lean', 'twist', 'headP', 'headY', 'ko'];
const DEF = { Rf: .05, Rab: .1, Lf: .05, Lab: .1 };
function compile(keys) { // 位置は前のキーを引き継ぐ
  let cur = { x: 0, y: 0, z: 0, yaw: 0 };
  return keys.map(k => { const o = k[2] || {}; cur = { x: o.x ?? cur.x, y: o.y ?? cur.y, z: o.z ?? cur.z, yaw: o.yaw ?? cur.yaw }; const p = { ...DEF, ...PRE[k[1]] };
    for (const n of POSEK) p[n] ??= 0; return { t: k[0], p, pos: { ...cur }, snap: o.e === 'snap' }; });
}
function evalActor(C, keys, t, bob) {
  let i = 0; while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  let u = a === b || b.snap ? 0 : smooth(clamp((t - a.t) / (b.t - a.t)));
  const s = {}; for (const n of POSEK) s[n] = lerp(a.p[n], b.p[n], u);
  for (const n of ['x', 'y', 'z', 'yaw']) s[n] = lerp(a.pos[n], b.pos[n], u);
  const br = Math.sin(t * 2.4 + bob) * 0.02; s.lean += br; s.Rf += br; s.Lf += br;
  return s;
}
const YK = compile([
  [0, 'idle', { x: 0, z: 5, yaw: PI }], [8.8, 'idle'], [9.6, 'sign'], [11.5, 'strain'], [26.4, 'strain'], [27.4, 'guard'],
  [28.8, 'kneel'], [33.0, 'kneel'], [34.2, 'guard'], [34.6, 'guard'], [34.9, 'hurt', { z: 5.8 }], [36.0, 'kneel', { z: 5.5 }], [41.0, 'kneel'],
  [43.4, 'guard'], [44.0, 'lunge', { z: -1.0 }], [44.6, 'windR', { z: -3.2 }], [45.0, 'punchR', { z: -3.75 }], [45.4, 'punchR'],
  [45.9, 'windL', { z: -4.0 }], [46.6, 'punchL', { z: -4.35 }], [47.0, 'punchL'], [47.6, 'windR', { z: -4.8 }], [48.2, 'punchR', { z: -5.25 }], [48.9, 'punchR'], [50.0, 'idle'],
  [53.95, 'idle', { z: 5, e: 'snap' }], [54.0, 'idle'], [54.8, 'palms'], [56.2, 'palms'], [57.4, 'idle'], [62.6, 'idle'],
  [63.0, 'dodge', { x: 1.8 }], [64.4, 'dodge'], [65.3, 'guard', { x: 0 }], [66.4, 'guard'],
  [66.7, 'hurt', { z: 5.8 }], [67.1, 'hurt', { z: 8.2, y: 1.2 }], [67.7, 'ko', { z: 11, y: 0 }], [69.0, 'ko'], [70.4, 'kneel', { z: 10 }], [71.2, 'sign', { z: 7 }],
  [72.5, 'strain'], [78.9, 'strain'], [78.95, 'strain', { z: 5, e: 'snap' }], [79.6, 'up'], [80.4, 'up'], [80.7, 'slash'], [82.6, 'slash'], [83.6, 'win'],
]);
const SKK = compile([
  [0, 'idle', { x: 0, z: -5, yaw: 0 }], [9.6, 'sign'], [11.5, 'strain'], [24.0, 'strain'], [25.6, 'up'], [26.4, 'up'], [26.7, 'slash'], [28.0, 'idle'],
  [31.0, 'idle'], [31.6, 'bow'], [33.9, 'bow'], [34.1, 'release'], [35.0, 'release'], [36.0, 'laugh'], [39.0, 'laugh'], [40.6, 'idle'], [44.6, 'idle'],
  [45.0, 'stagger', { z: -5.0 }], [45.4, 'stagger', { z: -5.6 }], [46.0, 'idle'], [46.6, 'stagger'], [47.0, 'stagger', { z: -6.5 }], [48.2, 'stagger'],
  [48.8, 'hurt', { z: -9, y: 1.2 }], [49.4, 'hurt', { z: -12, y: .2 }], [50.4, 'kneel', { y: 0 }], [53.95, 'kneel', { z: -12.4 }],
  [54.0, 'idle', { z: -5, e: 'snap' }], [58.0, 'idle'], [58.5, 'up'], [59.3, 'up'], [59.6, 'slash'], [61.0, 'idle'], [64.6, 'idle'],
  [64.8, 'windR', { z: -5 }], [66.3, 'lunge', { z: 3.3 }], [66.5, 'punchR', { z: 3.7 }], [67.2, 'punchR'], [68.6, 'stagger', { z: 3.0 }], [70.5, 'idle', { z: 1 }],
  [70.9, 'idle', { z: -5, e: 'snap' }], [71.2, 'sign'], [72.5, 'strain'], [78.9, 'strain'], [78.95, 'guard', { e: 'snap' }], [80.4, 'guard'],
  [80.7, 'stagger'], [81.4, 'hurt', { z: -6 }], [82.4, 'ko', { z: -6.6 }],
]);

// ---------- エフェクト基盤 ----------
const tmpA = V3();
class Bolts {
  constructor(n = 420) { this.pool = []; this.i = 0; this.ax = V3(1, 0, 0);
    for (let k = 0; k < n; k++) { const m = new THREE.Mesh(BOX, bas(0xffffff)); m.visible = false; m.frustumCulled = false; scene.add(m); this.pool.push(m); } }
  begin() { for (let k = 0; k < this.i; k++) this.pool[k].visible = false; this.i = 0; }
  seg(a, b, w, color) {
    if (this.i >= this.pool.length) return; const d = tmpA.subVectors(b, a); const len = d.length(); if (len < 1e-4) return;
    const m = this.pool[this.i++]; m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(this.ax, d.normalize()); m.scale.set(len, w, w); m.material.color.set(color); m.visible = true;
  }
  bolt(a, b, { n = 8, jit = 0.3, w = 0.04, color = 0xffffff, seed = 1 }) {
    const dir = b.clone().sub(a).normalize(); const p1 = dir.clone().cross(Math.abs(dir.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0)).normalize(), p2 = dir.clone().cross(p1);
    let prev = a.clone();
    for (let k = 1; k <= n; k++) { const p = a.clone().lerp(b, k / n);
      if (k < n) p.addScaledVector(p1, (rnd(seed * 7.1 + k * 3.3) - 0.5) * jit * 2).addScaledVector(p2, (rnd(seed * 5.3 + k * 1.9) - 0.5) * jit * 2);
      this.seg(prev, p, w, color); prev = p; }
  }
}
const bolts = new Bolts();

// ボクセル粒子(全部 t の関数)
const PARTS = [];
function burst(t0, o, n, op = {}) {
  const { speed = 6, up = 2, life = 1.5, size = 0.3, g = 9, cols = [0xff4030], dir = null, spread = 1, seed = 1, tspan = 0, ground = true, rot = 4, shrink = true } = op;
  for (let i = 0; i < n; i++) {
    const r = k => rnd(seed * 91.7 + i * k);
    let v; if (dir) { v = V3(dir[0] + (r(1.3) - .5) * spread, dir[1] + (r(2.3) - .5) * spread, dir[2] + (r(3.3) - .5) * spread).normalize().multiplyScalar(speed * (0.5 + r(4.3))); }
    else { const a = r(1.7) * PI * 2, e = r(2.9) * 2 - 1; v = V3(Math.cos(a) * Math.sqrt(1 - e * e), e, Math.sin(a) * Math.sqrt(1 - e * e)).multiplyScalar(speed * (0.35 + r(3.9))); v.y += up * r(5.1); }
    const org = Array.isArray(o) ? V3(...o) : o.clone();
    PARTS.push({ t0: t0 + (tspan ? r(6.1) * tspan : 0), life: life * (0.7 + r(7.3) * 0.6), p: org.add(V3((r(8.1) - .5) * spread * .3, (r(8.7) - .5) * spread * .3, (r(9.3) - .5) * spread * .3)), v, g, size: size * (0.5 + r(10.3)), col: cols[Math.floor(r(11.3) * cols.length)], ground, rot, shrink, sp: r(12.1) * 3 });
  }
}
const IM = new THREE.InstancedMesh(BOX, bas(0xffffff), 2600); IM.frustumCulled = false; IM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(IM);
IM.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(2600 * 3), 3);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color(), _s = V3(), _p = V3();
function updateParts(t) {
  let n = 0;
  for (const p of PARTS) {
    const tau = t - p.t0; if (tau < 0 || tau > p.life || n >= 2600) continue;
    _p.set(p.p.x + p.v.x * tau, p.p.y + p.v.y * tau - 0.5 * p.g * tau * tau, p.p.z + p.v.z * tau);
    let sc = p.size * (p.shrink ? (1 - Math.pow(tau / p.life, 3)) : 1);
    if (p.ground && _p.y < sc / 2) _p.y = sc / 2;
    _e.set(tau * p.rot + p.sp, tau * p.rot * 0.7, p.sp); _q.setFromEuler(_e); _s.setScalar(Math.max(sc, 1e-4));
    _m.compose(_p, _q, _s); IM.setMatrixAt(n, _m); _c.set(p.col); IM.setColorAt(n, _c); n++;
  }
  IM.count = n; IM.instanceMatrix.needsUpdate = true; if (IM.instanceColor) IM.instanceColor.needsUpdate = true;
}
// 粒子の登録
const YP = [0, 1, 5], SP = [0, 1, -5];
burst(T.slash1 + 0.7, [0, 3, 5], 110, { speed: 10, up: 4, life: 2.4, size: 0.9, g: 5, cols: [0xffa040, 0xff6020, 0x401010, 0xffd070], seed: 3 }); // 領域の破片
burst(T.boom, [0, 1.2, 5], 170, { speed: 9, up: 6, life: 2.4, size: 0.42, g: 8, cols: [0xff6a20, 0xffb030, 0xff3010, 0xffe070], seed: 4 });
burst(T.boom, [0, 1.5, 5], 90, { speed: 2.5, up: 1, life: 4.8, size: 1.3, g: -0.8, cols: [0x3a3438, 0x2a2428, 0x4a4448], seed: 5, tspan: 0.8, ground: false, shrink: true, rot: 0.5 }); // 煙
burst(T.boom + 0.3, [0, 1.2, 5], 70, { speed: 3, up: 2, life: 4.0, size: 1.0, g: -0.6, cols: [0x2a2428, 0x3a3438], seed: 6, ground: false, rot: 0.4 });
for (let k = 0; k < 4; k++) burst(T.rise - 0.2 + k * 0.6, [0, 0.2, 5.5], 14, { speed: 0.6, up: 3.0, life: 1.8, size: 0.09, g: -0.5, cols: [0x40ff80, 0xa0ffc0, 0x30e070], seed: 7 + k, tspan: 0.5, ground: false, spread: 4 });
for (let k = 0; k < 4; k++) burst(T.rise + 0.2 + k * 0.6, [0, 0.2, 5.5], 10, { speed: 0.4, up: 2.5, life: 1.6, size: 0.08, g: -0.4, cols: [0xff2030, 0xff7080], seed: 17 + k, tspan: 0.5, ground: false, spread: 4 });
const BFE = [[T.bf1, 1], [T.bf2, 2], [T.bf3, 3], [T.bfS, 4]];
burst(T.collapse, [0, 12, 0], 220, { speed: 0.6, up: 0, life: 3.4, size: 1.0, g: 8, cols: [0x5a0a10, 0xe8e2d0, 0x2a1410, 0x8a1018], seed: 21, tspan: 1.8, spread: 40, rot: 1.5 });
burst(T.blood, [0, 1.6, 3.8], 260, { speed: 20, up: 0.5, life: 2.2, size: 0.4, g: 3, cols: [0xff1030, 0xc00820, 0xff4050, 0x800010], seed: 22, dir: [0, 0.05, -1], spread: 0.45, tspan: 0.8, ground: true });
burst(T.kai, [0, 1.6, 2.0], 120, { speed: 12, up: 2, life: 1.6, size: 0.35, g: 5, cols: [0xff1030, 0xffffff, 0xff6070], seed: 23 });
burst(T.recover, [0, 0.3, 9], 40, { speed: 1, up: 3, life: 2.0, size: 0.14, g: -0.5, cols: [0x40ff80, 0xa0ffc0], seed: 24, tspan: 1.0, ground: false, spread: 4 });
burst(T.recover + 0.4, [0, 0.3, -5], 40, { speed: 1, up: 3, life: 2.0, size: 0.14, g: -0.5, cols: [0x40ff80, 0xa0ffc0], seed: 25, tspan: 1.0, ground: false, spread: 4 });
burst(T.kaiFinal, [0, 2.5, -5], 150, { speed: 14, up: 3, life: 2.0, size: 0.3, g: 6, cols: [0xfff6c0, 0xffd860, 0xffffff, 0xff9030], seed: 26 });
burst(82.4, [0, 0.9, -6.6], 140, { speed: 5, up: 4, life: 2.0, size: 0.35, g: 8, cols: [0xecc2a6, 0xb0202a, 0xf4f2ee, 0x101014], seed: 27 });
for (let k = 0; k < 14; k++) burst(79 + k * 0.5, [(rnd(k) - 0.5) * 16, 0.5, (rnd(k * 2) - 0.5) * 24 + 0], 8, { speed: 0.6, up: 4, life: 2.5, size: 0.3, g: -0.3, cols: [0x000000, 0x1a0010, 0x000000], seed: 30 + k, ground: false, spread: 6 }); // 黒い火花

// 領域の殻
function shell(col, wire) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })));
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.005, 2), new THREE.MeshBasicMaterial({ color: wire, wireframe: true, transparent: true, opacity: 0.55, toneMapped: false })));
  g.visible = false; scene.add(g); return g;
}
const shA = shell(0x8a0c18, 0xff3040), shB = shell(0xff8a30, 0xffd870);
function shellState(t) {
  let r = null;
  if (t >= T.domainOn && t < 31) {
    const wob = t > 14 && t < 20 ? Math.sin(t * 3.2) * 0.6 : 0;
    const rA = kf(t, [[11.5, 0.01], [14, 8], [20, 8], [24, 6.5], [28, 6.5], [31, 16]]) + wob;
    const rB = kf(t, [[11.5, 0.01], [14, 8], [20, 8], [24, 10], [27.2, 10]]) - wob;
    r = { cA: V3(0, 0, -5), cB: V3(0, 0, 5), rA, rB, aOn: true, bOn: t < 27.2 + 0.02 };
  } else if (t >= T.dom2 && t < 79) {
    r = { cA: V3(0, 0, -22), cB: V3(0, 0, 7), rA: kf(t, [[71.2, 0.01], [75, 30], [77, 28], [79, 24]]), rB: kf(t, [[71.2, 0.01], [75, 12], [77, 18], [79, 26]]), aOn: true, bOn: true };
  }
  return r;
}

// ---------- 黒閃・斬撃 ----------
const bfBlack = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0, transparent: true, depthWrite: false }));
const bfRed = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff1030, side: THREE.BackSide, transparent: true, toneMapped: false, depthWrite: false }));
scene.add(bfBlack, bfRed);
const SLASHES = [
  { t0: T.slash1, dur: 0.7, a: V3(-16, 11, -8), b: V3(16, -3, 18), w: 0.7, col: 0xff2030 },
  { t0: T.kai, dur: 0.6, a: V3(0, 1.7, -5.2), b: V3(0, 1.7, 16), w: 0.6, col: 0xff2030 },
  { t0: T.kai + 0.05, dur: 0.6, a: V3(-7, 7, 0), b: V3(7, -1, 12), w: 0.45, col: 0xff2030 },
  { t0: T.kaiFinal, dur: 1.0, a: V3(-45, 2.8, -5.5), b: V3(45, 2.8, -5.5), w: 1.0, col: 0xffc030 },
  { t0: T.kaiFinal, dur: 1.0, a: V3(0, -6, -5.5), b: V3(0, 18, -5.5), w: 0.8, col: 0xffc030 },
];

// ---------- 状態更新 ----------
let flashW = 0, invert = 0, bfD = -1, bfPos = V3(), shakeAmp = 0;
function envAt(t) { if (t < 0.01 || t >= 86) return null; if (t >= 31 && t < T.collapse) return 'S'; if (t >= 79) return 'Y'; return 'A'; }
function updateScene(t) {
  const k = envAt(t); setEnv(k);
  setPose(Y, evalActor(Y, YK, t, 0)); setPose(S, evalActor(S, SKK, t, 1.7));
  Y.root.visible = S.root.visible = k !== null;
  // 煤(フーガ直撃後)と回復
  const soot = t < T.boom ? 0 : t < T.rise ? 0.75 : 0.75 * (1 - smooth(clamp((t - T.rise) / 2.4)));
  setTint(Y, 0x303030, soot); setTint(S, 0xffffff, 0);
  if (t > 82.4) S.root.scale.setScalar(Math.max(0.0001, 1 - smooth(clamp((t - 82.4) / 0.5)))); else S.root.scale.setScalar(1);
  // 拳の位置など
  Y.root.updateMatrixWorld(true); S.root.updateMatrixWorld(true);
}
function updateFx(t) {
  bolts.begin(); flashW = 0; invert = 0; fxLight.intensity = 0; shakeAmp = 0; bfD = -1;
  const frame = Math.floor(t * 24);
  // 領域の殻
  shA.visible = shB.visible = false;
  const ss = shellState(t);
  if (ss) {
    if (ss.aOn) { shA.visible = true; shA.position.copy(ss.cA); shA.scale.setScalar(ss.rA); shA.position.y = 0; }
    if (ss.bOn) { shB.visible = true; shB.position.copy(ss.cB); shB.scale.setScalar(ss.rB); shB.position.y = 0; }
    if (ss.aOn && ss.bOn) { // 交線に稲妻
      const dC = ss.cB.z - ss.cA.z, x = (dC * dC + ss.rA * ss.rA - ss.rB * ss.rB) / (2 * dC), rr = Math.sqrt(Math.max(0, ss.rA * ss.rA - x * x));
      const zc = ss.cA.z + x; const N = 22;
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * PI * 2, a1 = ((i + 1) / N) * PI * 2;
        const p0 = V3(Math.cos(a0) * rr, Math.sin(a0) * rr, zc), p1 = V3(Math.cos(a1) * rr, Math.sin(a1) * rr, zc);
        bolts.bolt(p0, p1, { n: 2, jit: 0.5, w: 0.18, color: i % 2 ? 0xffb050 : 0xff3040, seed: frame * 3 + i });
      }
      for (let i = 0; i < 8; i++) { const a = rnd(frame + i) * PI * 2; const p = V3(Math.cos(a) * rr, Math.sin(a) * rr, zc);
        bolts.bolt(p, p.clone().add(V3((rnd(frame * 3 + i) - .5) * 5, (rnd(frame * 5 + i) - .5) * 5, (rnd(frame * 7 + i) - .5) * 5)), { n: 3, jit: .3, w: 0.08, color: 0xffffff, seed: frame + i }); }
      shakeAmp = Math.max(shakeAmp, 0.05);
    }
    if (t > T.slash1 + 0.6 && t < 28) { flashW = 0; }
  }
  // 斬撃
  for (const s of SLASHES) {
    const d = t - s.t0; if (d < 0 || d > s.dur) continue; const k = d / s.dur;
    const grow = clamp(d / 0.08), w = s.w * Math.pow(1 - k, 1.6) * (0.4 + 0.6 * grow);
    const b = s.a.clone().lerp(s.b, grow);
    bolts.seg(s.a, b, w * 2.4, s.col); bolts.seg(s.a, b, w, 0xffffff);
    flashW = Math.max(flashW, d < 0.1 ? 0.5 : 0.18 * (1 - k)); shakeAmp = Math.max(shakeAmp, 0.4 * (1 - k));
    if (s.t0 === T.kaiFinal) fxLight.intensity = 80 * (1 - k);
  }
  // 虎杖の拳に黒い火花
  const chargeOn = (t > 41.5 && t < T.bf1) || (t > 47.2 && t < T.bf3) || (t > 79.2 && t < T.kaiFinal);
  if (chargeOn) { const f = worldOf(Y.armR, [0, -12 * PX, 0]);
    for (let b = 0; b < 6; b++) { const e = f.clone().add(V3(rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5, rnd(frame * 7 + b) - .5).normalize().multiplyScalar(0.3 + 0.5 * rnd(b + frame)));
      bolts.bolt(f, e, { n: 3, jit: .1, w: 0.05, color: 0xff1a38, seed: frame * 9 + b }); bolts.bolt(f, e, { n: 3, jit: .1, w: 0.02, color: 0x000000, seed: frame * 9 + b }); } }
  // 宿儺の黒閃チャージ
  if (t > 64.8 && t < T.bfS) { const f = worldOf(S.armR, [0, -12 * PX, 0]);
    for (let b = 0; b < 5; b++) { const e = f.clone().add(V3(rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5, rnd(frame * 7 + b) - .5).normalize().multiplyScalar(0.3 + 0.4 * rnd(b + frame)));
      bolts.bolt(f, e, { n: 3, jit: .1, w: 0.05, color: 0xff1a38, seed: frame * 9 + b }); bolts.bolt(f, e, { n: 3, jit: .1, w: 0.02, color: 0x000000, seed: frame * 9 + b }); } }
  // 黒閃ヒット
  bfBlack.visible = bfRed.visible = false;
  for (const [tb, idx] of BFE) {
    const d = t - tb; if (d < 0 || d > 1.1) continue;
    const pos = idx === 4 ? worldOf(Y.torso, [0, 0.35, 0.1]) : worldOf(S.torso, [0, 0.35, 0.1]);
    const big = idx === 3 || idx === 4 ? 1.35 : 1.0; bfD = d; bfPos.copy(pos);
    const r = (0.2 + 1.1 * easeOut(clamp(d / 0.3))) * big, op = 1 - smooth(clamp((d - 0.3) / 0.6));
    bfBlack.position.copy(pos); bfBlack.scale.setScalar(r); bfBlack.material.opacity = op * 0.92; bfBlack.visible = true;
    bfRed.position.copy(pos); bfRed.scale.setScalar(r * 1.1); bfRed.material.opacity = op; bfRed.visible = true;
    const life = 1 - clamp(d / 0.8);
    for (let b = 0; b < 14; b++) { const a = rnd(b * 1.7 + idx) * PI * 2, e = (rnd(b * 2.9) - .5) * 2.2;
      const dir = V3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)).normalize();
      const to = pos.clone().addScaledVector(dir, (1.0 + rnd(b * 4.1) * 3.4) * easeOut(clamp(d / 0.22)) * big); const seed = b * 13 + frame + idx * 5;
      bolts.bolt(pos, to, { n: 6, jit: .3, w: 0.1 * life + .02, color: 0xff1030, seed }); bolts.bolt(pos, to, { n: 6, jit: .3, w: 0.045 * life + .01, color: 0x000000, seed }); }
    fxLight.position.copy(pos); fxLight.intensity = 90 * Math.max(0, 1 - d * 2.2);
    invert = d < 0.09 ? 1 : 0; shakeAmp = Math.max(shakeAmp, d < 0.5 ? 0.35 * (1 - d / 0.5) * big : 0);
    burst; // (粒子はモジュール初期化時に登録)
  }
  // フーガ(炎の矢)
  if (t > 32.2 && t < T.boom) {
    const k = t < T.fuga ? 0 : clamp((t - T.fuga) / (T.boom - T.fuga));
    const f = V3(0.0, 1.5, -3.6).lerp(V3(0, 1.5, 4.6), k); const grow = smooth(clamp((t - 32.2) / 1.8));
    const dirv = V3(0, 0, 1);
    for (let i = 0; i < 18; i++) { const o = rnd(i * 2.1 + frame) * 0.5 * grow;
      const p = f.clone().addScaledVector(dirv, -i * 0.3 * grow).add(V3((rnd(i + frame * 3) - .5) * o, (rnd(i * 5 + frame) - .5) * o, 0));
      const m = bolts.pool[bolts.i]; if (m) { bolts.seg(p, p.clone().add(V3(0, 0, 0.32 * grow + 0.01)), (0.5 - i * 0.02) * grow + 0.02, i < 4 ? 0xffe890 : i < 10 ? 0xff9a30 : 0xff4a18); } }
    fxLight.position.copy(f); fxLight.color.set(0xff8030); fxLight.intensity = 50 * grow;
    flashW = Math.max(flashW, t > T.fuga ? 0.1 : 0);
  } else fxLight.color.set(0xff2040);
  if (t >= T.boom && t < T.boom + 0.6) { const d = t - T.boom; flashW = Math.max(flashW, d < 0.08 ? 0.9 : 0.5 * (1 - d / 0.6)); shakeAmp = Math.max(shakeAmp, 0.6 * (1 - d / 0.6)); fxLight.color.set(0xff9040); fxLight.position.set(0, 2, 5); fxLight.intensity = 120 * (1 - d / 0.6); }
  // 領域崩壊・最終の一撃での演出
  if (t >= T.collapse && t < T.collapse + 0.5) { const d = t - T.collapse; flashW = Math.max(flashW, 0.7 * (1 - d / 0.5)); shakeAmp = Math.max(shakeAmp, 0.5 * (1 - d / 0.5)); }
  if (t > T.kaiFinal && t < T.kaiFinal + 0.1) flashW = Math.max(flashW, 0.7);
  // 領域展開の一瞬の閃光
  for (const tt of [T.domainOn, T.dom2]) if (t >= tt && t < tt + 0.4) { flashW = Math.max(flashW, 0.5 * (1 - (t - tt) / 0.4)); shakeAmp = Math.max(shakeAmp, 0.3); }
  // 勝利の光(光の筋)
  if (t > 83.2 && t < 86) { const f = Y.root.position.clone().add(V3(0, 1, 0));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2 + t * 0.4; const e = f.clone().add(V3(Math.cos(a) * 6, 4 + Math.sin(a * 2) * 2, Math.sin(a) * 6)); bolts.seg(f, e, 0.06, 0xffe890); } }
}

// ---------- カメラ ----------
const UP = V3(0, 1, 0), UPZ = V3(0, 0, -1);
function head(C) { return worldOf(C.headPivot, [0, 4 * PX, 0]); }
function shot(t) {
  let p, l, fov = 50, up = UP, sh = 0;
  const yh = head(Y), sh_ = head(S), yp = Y.root.position, sp = S.root.position;
  const mid = (yp.z + sp.z) / 2;
  if (t < 4) { p = V3(0, -500, 0); l = V3(0, -501, 1); }
  else if (t < 9) { p = V(kf(t, [[4, [2.4, 3.0, 11.5]], [9, [1.4, 2.4, 9.0]]], lin)); l = V3(0, 1.8, -3); fov = 55; }
  else if (t < 11.5) { p = yh.clone().add(V3(0.5 + 0.1 * (t - 9), 0.1, -2.6)); l = yh.clone().add(V3(0, -0.1, 0)); fov = 32; sh = 0.015 * (t - 9); }
  else if (t < 14) { p = V3(17, 5, 0); l = V3(0, 3, 0); fov = 58; sh = 0.08; }
  else if (t < 24) { p = V3(0, 44, 0.01); l = V3(0, 0, 0); up = UPZ; fov = 50; sh = 0.04; }
  else if (t < 26.3) { p = sh_.clone().add(V3(-1.4, -0.6, 2.4)); l = sh_.clone().add(V3(0, -0.1, 0)); fov = 36; sh = 0.02 * (t - 24); }
  else if (t < 28) { p = V3(9, 3, 2); l = V3(0, 2.0, 0.5); fov = 55; }
  else if (t < 31) { p = V(kf(t, [[28, [12, 5, 14]], [31, [16, 7, 17]]], lin)); l = V3(0, 3, 1); fov = 62; sh = 0.1; }
  else if (t < 33.8) { p = V3(-3.2, 1.5, -2.0); l = sh_.clone().add(V3(0.3, -0.1, 0.4)); fov = 46; sh = 0.02; }
  else if (t < 36) { p = V(kf(t, [[33.8, [2.2, 2.4, 12.5]], [36, [3.0, 2.8, 13.5]]], lin)); l = V3(0, 1.6, 2); fov = 56; }
  else if (t < 39) { p = sh_.clone().add(V3(0.2, 0.05, 2.1)); l = sh_.clone().add(V3(0, 0, 0)); fov = 34; sh = 0.015; }
  else if (t < 41.5) { p = V3(2.2, 1.8, 9.0); l = V3(0, 1.0, 5.4); fov = 50; }
  else if (t < 44) { p = yh.clone().add(V3(0.5, 0.15, -2.1)); l = yh.clone().add(V3(0, -0.1, 0)); fov = 33; sh = 0.02; }
  else if (t < 50) { const bz = (Math.min(yp.z, 0) + sp.z) / 2; p = V(kf(t, [[44, [5.5, 2.2, 3]], [45, [4.2, 1.9, -2.6]], [48, [4.4, 1.9, -4.2]], [50, [8, 4, -6]]], lin)); l = V3(0, 1.4, Math.min(bz, 1) - 0.4); fov = 46; sh = 0.03; }
  else if (t < 54) { p = V3(15, 6, 12); l = V3(0, 4, -4); fov = 58; sh = 0.1; }
  else if (t < 58) { p = V3(1.2, 1.5, 8.6); l = V3(0, 1.7, -3); fov = 52; sh = 0.015; }
  else if (t < 62) { p = V3(8.5, 2.6, 1.0); l = V3(0, 1.8, 0.8); fov = 58; }
  else if (t < 65) { p = yh.clone().add(V3(2.4, 0.2, -2.6)); l = yh.clone().add(V3(0, -0.4, 0)); fov = 42; sh = 0.02; }
  else if (t < 68) { p = V3(5.8, 1.9, 4.0); l = V3(0, 1.5, 4.5); fov = 52; sh = 0.03; }
  else if (t < 71) { p = V3(9, 7, 17); l = V3(0, 0.5, 4); fov = 58; }
  else if (t < 79) { p = V3(0, 92, -10); l = V3(0, 0, -10); up = UPZ; fov = 50; sh = 0.05; }
  else if (t < 80.4) { p = V3(1.0, 1.4, 8.8); l = V3(0, 2.8, -4); fov = 56; sh = 0.02; }
  else if (t < 83) { p = V3(-5.6, 2.2, 2.2); l = V3(0, 1.4, -5.8); fov = 52; sh = 0.04; }
  else if (t < 86) { p = yp.clone().add(V3(0.4, 0.6, -3.2)); l = yp.clone().add(V3(0, 1.9, 0)); fov = 56; }
  else { p = V3(0, -500, 0); l = V3(0, -501, 1); }
  // 衝撃時の揺れ
  const total = Math.max(sh, shakeAmp);
  camera.up.copy(up); camera.position.copy(p).add(shake(t, total)); camera.lookAt(l); camera.fov = fov; camera.updateProjectionMatrix();
}
function V(a) { return V3(a[0], a[1], a[2]); }

// ---------- ポスト ----------
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 0.88); composer.addPass(bloom);
composer.addPass(new OutputPass());
const post = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uSat: { value: 1 }, uFlash: { value: 0 }, uInv: { value: 0 }, uFade: { value: 0 }, uCA: { value: 0.0006 }, uAsp: { value: W / H }, uC: { value: new THREE.Vector2(.5, .5) }, uR: { value: 0 }, uStr: { value: 0 }, uVig: { value: 0.45 } },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uSat,uFlash,uInv,uFade,uCA,uAsp,uR,uStr,uVig; uniform vec2 uC; varying vec2 vUv;
  void main(){ vec2 uv=vUv; vec2 d=uv-uC; d.x*=uAsp; float r=length(d); float ring=exp(-pow((r-uR)/0.09,2.0))*uStr;
    vec2 dir=normalize(d+1e-5); dir.x/=uAsp; uv+=dir*ring*0.07; vec2 ca=dir*(uCA+ring*0.01)*(0.5+r);
    vec3 col; col.r=texture2D(tDiffuse,uv+ca).r; col.g=texture2D(tDiffuse,uv).g; col.b=texture2D(tDiffuse,uv-ca).b;
    float l=dot(col,vec3(.299,.587,.114)); col=mix(vec3(l),col,uSat); col=mix(col,vec3(1.0-l*1.1),uInv); col+=uFlash;
    float v=1.0-smoothstep(0.5,1.1,length((vUv-.5)*vec2(1.0,.6))); col*=mix(1.0,v,uVig); col*=1.0-uFade; gl_FragColor=vec4(col,1.0);} `
});
composer.addPass(post);
function updatePost(t) {
  const u = post.uniforms;
  u.uSat.value = kf(t, [[T.boom - 2, 1], [T.boom - 0.01, 1], [T.boom + 0.2, 1], [T.rise, 0.7], [T.rise + 2.4, 1]]);
  if (t > 82.3 && t < 83) u.uSat.value = 1;
  u.uInv.value = invert; u.uFlash.value = flashW * (invert ? 0 : 1);
  u.uFade.value = kf(t, [[0, 1], [0.35, 0], [3.5, 0], [4.0, 1], [4.01, 0], [8.8, 0], [9.0, 0], [85.7, 0], [86.2, 1], [86.4, 1], [86.9, 0], [89.5, 0], [90, 1]], lin);
  if (t < 4) u.uFade.value = kf(t, [[0, 1], [0.35, 0], [3.4, 0], [4.0, 1]], lin);
  if (t >= 4 && t < 4.6) u.uFade.value = 0;
  if (t >= 86) u.uFade.value = kf(t, [[86, 1], [86.5, 0], [89.3, 0], [90, 1]], lin);
  if (bfD >= 0 && bfD < 1) { const sp = bfPos.clone().project(camera); u.uC.value.set(sp.x * .5 + .5, sp.y * .5 + .5); u.uR.value = bfD * 1.4; u.uStr.value = 1.2 * (1 - clamp(bfD / 0.8)); u.uCA.value = 0.0006 + 0.012 * (1 - clamp(bfD / 0.6)); }
  else { u.uStr.value = 0; u.uCA.value = 0.0006; }
  bloom.strength = 0.45 + (bfD >= 0 && bfD < 0.5 ? 0.6 * (1 - bfD * 2) : 0);
}

// ---------- 2Dオーバーレイ(テロップ/HP) ----------
const FONT = '"IPAGothic","Noto Sans CJK JP",sans-serif';
function strokeText(c, txt, x, y, fill, stroke, lw, outer) {
  c.lineJoin = 'round'; c.miterLimit = 2;
  if (outer) { c.lineWidth = lw + outer * 2; c.strokeStyle = '#000'; c.strokeText(txt, x, y); }
  c.lineWidth = lw; c.strokeStyle = stroke; c.strokeText(txt, x, y); c.fillStyle = fill; c.fillText(txt, x, y);
}
function drawCaptions(c, t) {
  for (const [t0, t1, text, kind] of CAPS) {
    if (t < t0 || t >= t1) continue;
    const age = t - t0, rem = t1 - t; const lines = text.split('\n');
    let size = { title: 108, say: 76, tech: 96, end: 84 }[kind] * SC;
    c.font = `900 ${size}px ${FONT}`; const widest = Math.max(...lines.map(l => c.measureText(l).width));
    const maxW = W * 0.92; if (widest > maxW) size *= maxW / widest;
    const pop = age < 0.22 ? lerp(1.4, 1, easeOut(age / 0.22)) : 1; const alpha = Math.min(1, age / 0.08) * Math.min(1, rem / 0.15);
    const cy = (kind === 'title' || kind === 'end') ? H * 0.5 : H * 0.215, lh = size * 1.25, y0 = cy - ((lines.length - 1) * lh) / 2;
    c.save(); c.globalAlpha = alpha; c.translate(W / 2, cy); c.scale(pop, pop); c.translate(-W / 2, -cy);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${size}px ${FONT}`;
    lines.forEach((ln, i) => {
      const y = y0 + i * lh;
      if (kind === 'tech') { c.shadowColor = '#ff1030'; c.shadowBlur = 30 * SC; strokeText(c, ln, W / 2, y, '#ff3347', '#fff', 10 * SC, 9 * SC); c.shadowBlur = 0; }
      else if (kind === 'title') { c.shadowColor = '#ff1030'; c.shadowBlur = 40 * SC; strokeText(c, ln, W / 2, y, i === 2 ? '#ff3347' : '#fff', '#000', 12 * SC, 0); c.shadowBlur = 0; }
      else if (kind === 'end') strokeText(c, ln, W / 2, y, i === 2 ? '#ffe14a' : '#fff', '#000', 14 * SC, 0);
      else strokeText(c, ln, W / 2, y, '#fff', '#000', 16 * SC, 0);
    });
    c.restore();
  }
  for (const [tc, n] of COUNTS) { // 黒閃カウント
    const age = t - tc; if (age < 0 || age > 0.9) continue; const pop = age < 0.15 ? lerp(1.8, 1, easeOut(age / 0.15)) : 1; const a = 1 - clamp((age - 0.6) / 0.3);
    c.save(); c.globalAlpha = a; c.translate(W / 2, H * 0.42); c.scale(pop, pop); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${420 * SC}px ${FONT}`;
    c.shadowColor = '#ff1030'; c.shadowBlur = 60 * SC; strokeText(c, n, 0, 0, '#ff2a40', '#fff', 18 * SC, 14 * SC); c.restore();
  }
}
const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
function drawHearts(c, x, y, hp, px) {
  for (let i = 0; i < 10; i++) {
    const v = clamp(hp - i * 2, 0, 2); const hx = x + i * px * 9.2;
    for (let r = 0; r < 6; r++) for (let k = 0; k < 7; k++) if (HEART[r][k] === 'X') {
      const full = v >= 2 || (v === 1 && k < 3.5) || (v > 0 && v < 2 && k < 3.5 * v);
      c.fillStyle = '#000'; c.fillRect(hx + k * px - px * 0.35, y + r * px - px * 0.35, px * 1.7, px * 1.7);
      c.fillStyle = full ? (r < 2 && k < 3 ? '#ff7a8a' : '#e0192e') : '#3a2a30'; c.fillRect(hx + k * px, y + r * px, px, px);
    }
  }
}
function drawHud(c, t) {
  if (t < 4 || t >= 86) return;
  const hp = kf(t, HP.map(h => [h[0], [h[1], h[2]]]), smooth);
  const px = 5.6 * SC, x0 = 215 * SC;
  c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = `900 ${42 * SC}px ${FONT}`;
  strokeText(c, '宿儺', 40 * SC, 1432 * SC, '#ffd0d0', '#000', 8 * SC, 0); drawHearts(c, x0, 1415 * SC, hp[0], px);
  strokeText(c, '虎杖', 40 * SC, 1498 * SC, '#ffd0e4', '#000', 8 * SC, 0); drawHearts(c, x0, 1481 * SC, hp[1], px);
}
function drawBars(c, t) { // 黒閃の一瞬だけ黒帯(漫画的演出)
  for (const [tb] of BFE) { const d = t - tb; if (d >= 0 && d < 0.09) { c.fillStyle = '#000'; c.globalAlpha = 0.0; c.fillRect(0, 0, 0, 0); c.globalAlpha = 1; } }
}

// ---------- 1フレーム ----------
function renderAt(t) {
  updateScene(t); updateFx(t); updateParts(t); shot(t); updatePost(t);
  composer.render();
  ctx2.drawImage(renderer.domElement, 0, 0, W, H);
  drawHud(ctx2, t); drawCaptions(ctx2, t);
}
window.renderAt = renderAt;
window.frameDataURL = () => out2d.toDataURL('image/jpeg', 0.93);
window.READY = true;
if (q.has('t')) renderAt(parseFloat(q.get('t')));
else if (!q.has('render')) { const t0 = parseFloat(q.get('from') ?? '0'), s = performance.now(); (function loop() { const t = (t0 + (performance.now() - s) / 1000) % DUR; renderAt(t); requestAnimationFrame(loop); })(); }
