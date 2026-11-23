// もし乙骨憂太と鹿紫雲一が戦ったらどうなる?(マイクラ風ブロック・縦型ショート 60秒)
// すべて t(秒) の純関数として描画する。非商用のファン作品。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeOkkotsu, makeKashimo, makeRika, setPose, setRika, setTint, worldOf, PX } from './chars.js';
import { T, CAPS, HP, DUR } from './timeline.js';

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
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 600); scene.add(camera);
const hemi = new THREE.HemisphereLight(0x9aa8ff, 0x302a40, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffc890, 1.6); sun.position.set(-12, 22, 14); scene.add(sun);
const fxLight = new THREE.PointLight(0xffe070, 0, 26, 1.3); scene.add(fxLight);
const out2d = document.createElement('canvas'); out2d.width = W; out2d.height = H; document.body.appendChild(out2d);
const ctx2 = out2d.getContext('2d');

// ---------- 素材ヘルパー ----------
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
function floorPlane(g, tex, size = 400, y = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial({ map: tex })); m.rotation.x = -PI / 2; m.position.y = y; g.add(m); return m; }

// ---------- ステージA: 夕暮れの遊園地 ----------
const ENV = {}; const PARK = {};
(function () {
  const g = new THREE.Group(); ENV.A = { g, fog: [0xe0907a, 50, 190], hemi: [0xc0b8ff, 0x50404a, 1.05], sun: [0xffc08a, 1.7] };
  g.add(sky(0x241a52, 0xff8a58));
  floorPlane(g, ptex(16, noiseFill(['#4f8a3c', '#468036', '#5a9444', '#3f7430'], 3), 100), 400, -0.03);
  const tile = ptex(8, (x, n) => { x.fillStyle = '#b9a98f'; x.fillRect(0, 0, n, n); x.fillStyle = '#a39478'; x.fillRect(0, 0, n, 1); x.fillRect(0, 0, 1, n); x.fillStyle = '#c4b59c'; x.fillRect(3, 3, 2, 2); }, 40);
  floorPlane(g, tile, 90, 0);
  // 観覧車
  const fw = new THREE.Group(); fw.position.set(0, 0, -38); g.add(fw);
  const wheel = new THREE.Group(); wheel.position.y = 18; fw.add(wheel); PARK.wheel = wheel; PARK.gond = [];
  const rimM = lam(0xf4f4f8), spokeM = lam(0xd8d8e4);
  const NR = 30, RR = 15;
  for (let i = 0; i < NR; i++) { const a = (i / NR) * PI * 2; for (const z of [-0.9, 0.9]) { const m = new THREE.Mesh(BOX, rimM); m.scale.set(2 * PI * RR / NR + 0.1, 0.5, 0.5); m.position.set(Math.cos(a) * RR, Math.sin(a) * RR, z); m.rotation.z = a + PI / 2; wheel.add(m); } }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; const m = new THREE.Mesh(BOX, spokeM); m.scale.set(RR, 0.3, 0.3); m.position.set(Math.cos(a) * RR / 2, Math.sin(a) * RR / 2, 0); m.rotation.z = a; wheel.add(m); }
  const gc = [0xff4a4a, 0xffd84a, 0x4aa8ff, 0xff9a3a, 0x6aff8a];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; const gr = new THREE.Group(); gr.position.set(Math.cos(a) * RR, Math.sin(a) * RR, 0); const m = new THREE.Mesh(BOX, lam(gc[i % 5])); m.scale.set(2.2, 2.0, 2.0); m.position.y = -1.6; gr.add(m); box(gr, 2.4, 0.3, 2.2, 0, -0.6, 0, lam(0xffffff)); wheel.add(gr); PARK.gond.push(gr); }
  for (let i = 0; i < 60; i++) { const a = (i / 60) * PI * 2; const m = new THREE.Mesh(BOX, bas(i % 2 ? 0xffe08a : 0xff8ac0)); m.scale.setScalar(0.45); m.position.set(Math.cos(a) * (RR + 0.5), Math.sin(a) * (RR + 0.5), 1.2); wheel.add(m); }
  for (const sx of [-1, 1]) { for (const z of [-2.5, 2.5]) { const m = new THREE.Mesh(BOX, lam(0xe8e8f0)); const L = 19; m.scale.set(0.7, L, 0.7); m.position.set(sx * 5, L / 2 - 0.5, z); m.rotation.z = -sx * 0.27; fw.add(m); } }
  // ジェットコースター
  const rc = new THREE.Group(); rc.position.set(26, 0, 4); g.add(rc);
  for (let i = 0; i < 46; i++) { const z = -22 + i * 1.6; const y = 5 + 7 * (0.5 + 0.5 * Math.sin(z * 0.22)) + 2.5 * Math.sin(z * 0.5); const m = new THREE.Mesh(BOX, lam(0xe03030)); m.scale.set(2.2, 0.4, 1.9); m.position.set(Math.sin(z * 0.12) * 2.5, y, z); rc.add(m);
    if (i % 3 === 0) { box(rc, 0.4, y, 0.4, Math.sin(z * 0.12) * 2.5 - 0.9, 0, z, lam(0xf0f0f0)); box(rc, 0.4, y, 0.4, Math.sin(z * 0.12) * 2.5 + 0.9, 0, z, lam(0xf0f0f0)); } }
  // メリーゴーランド
  const cg = new THREE.Group(); cg.position.set(-19, 0, -6); g.add(cg); PARK.carousel = cg;
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.6, 8), lam(0xffd0e0)); plat.position.y = 0.3; cg.add(plat);
  box(cg, 0.6, 4.2, 0.6, 0, 0.6, 0, lam(0xf8f8f8));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 2.6, 8), lam(0xff5a8a)); roof.position.y = 5.8; cg.add(roof);
  const horses = new THREE.Group(); cg.add(horses); PARK.horses = horses;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; const h = new THREE.Group(); h.position.set(Math.cos(a) * 3.3, 0, Math.sin(a) * 3.3); h.rotation.y = -a; box(h, 0.12, 3.4, 0.12, 0, 0.6, 0, lam(0xffd860)); box(h, 0.6, 0.9, 1.5, 0, 1.4, 0, lam(i % 2 ? 0xffffff : 0xf0c8a0)); box(h, 0.5, 0.7, 0.5, 0, 2.1, 0.9, lam(0xffffff)); horses.add(h); }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; const m = new THREE.Mesh(BOX, bas(0xffe9a0)); m.scale.setScalar(0.3); m.position.set(Math.cos(a) * 5.1, 4.7, Math.sin(a) * 5.1); cg.add(m); }
  PARK.rubble = new THREE.Group(); PARK.rubble.visible = false; PARK.rubble.position.copy(cg.position); g.add(PARK.rubble);
  for (let i = 0; i < 18; i++) box(PARK.rubble, 0.8 + rnd(i) * 1.6, 0.5 + rnd(i * 2), 0.8 + rnd(i * 3) * 1.6, (rnd(i * 4) - 0.5) * 9, 0, (rnd(i * 5) - 0.5) * 9, lam(i % 2 ? 0x6a3a50 : 0x4a3a40));
  // テント・屋台・ゲート・街灯
  for (const [x, z, c] of [[16, -16, 0xe03a3a], [-9, -24, 0x3a7ae0], [19, -30, 0xe0a03a], [-26, -22, 0x8a3ae0]]) {
    box(g, 6, 2.4, 6, x, 0, z, lam(0xf6f6f6)); const cone = new THREE.Mesh(new THREE.ConeGeometry(5.2, 4, 4), lam(c)); cone.position.set(x, 4.4, z); cone.rotation.y = PI / 4; g.add(cone);
    box(g, 0.2, 1.5, 0.2, x, 6.4, z, lam(0x444444)); box(g, 1.2, 0.7, 0.1, x + 0.7, 7.3, z, bas(0xff4040));
  }
  for (const [x, z] of [[-12, 12], [12, 12], [-14, -2], [14, -4]]) { box(g, 3, 0.4, 2, x, 0, z, lam(0x8a5a30)); box(g, 3.4, 0.3, 2.4, x, 2.6, z, lam(0xff6a6a)); box(g, 0.2, 2.3, 0.2, x - 1.4, 0.3, z - 0.9, lam(0x8a5a30)); box(g, 0.2, 2.3, 0.2, x + 1.4, 0.3, z - 0.9, lam(0x8a5a30)); }
  box(g, 3, 10, 3, -9, 0, 36, lam(0xd04040)); box(g, 3, 10, 3, 9, 0, 36, lam(0xd04040)); box(g, 21, 2.2, 3, 0, 9.5, 36, lam(0xf8e060)); box(g, 14, 0.9, 0.3, 0, 10.2, 34.4, bas(0xffffff));
  for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2, d = 20 + (i % 2) * 2; const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.8; box(g, 0.25, 4.6, 0.25, x, 0, z, lam(0x2a2a30)); box(g, 0.7, 0.7, 0.7, x, 4.6, z, bas(0xffe8a0)); }
  for (let i = 0; i < 30; i++) { const a = rnd(i * 3.3) * PI * 2, d = 48 + rnd(i * 5.1) * 40; const x = Math.cos(a) * d, z = Math.sin(a) * d; box(g, 0.9, 4, 0.9, x, 0, z, lam(0x6a4426)); box(g, 4, 2, 4, x, 3.6, z, lam(0x3a7a2e)); box(g, 2.6, 2, 2.6, x, 5.4, z, lam(0x2f6a28)); }
  for (let i = 0; i < 14; i++) box(g, 10 + rnd(i) * 10, 1.2, 6 + rnd(i * 2) * 6, (rnd(i * 6) - 0.5) * 200, 42 + rnd(i * 7) * 14, -70 - rnd(i * 8) * 60, bas(0xffc8b8));
  scene.add(g);
})();
// ---------- ステージD: 真贋相愛(夜空と鏡と無数の刀) ----------
const DOM = {};
(function () {
  const g = new THREE.Group(); ENV.D = { g, fog: [0x1a0838, 40, 150], hemi: [0xb08aff, 0x201040, 1.0], sun: [0xd8c8ff, 1.2] };
  g.add(sky(0x03000f, 0x7a2a9a));
  const ft = ptex(4, (x) => { x.fillStyle = '#12081e'; x.fillRect(0, 0, 4, 4); x.fillStyle = '#4a2a80'; x.fillRect(0, 0, 4, 1); x.fillRect(0, 0, 1, 4); }, 90);
  floorPlane(g, ft);
  const N = 320; const blade = new THREE.InstancedMesh(BOX, bas(0xd0d8ff), N), guard = new THREE.InstancedMesh(BOX, bas(0xe0b040), N);
  const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler(), s = V3(), p = V3();
  for (let i = 0; i < N; i++) {
    const a = rnd(i * 2.3) * PI * 2, d = 5 + Math.pow(rnd(i * 3.7), 0.7) * 70; const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const floating = i % 4 === 0; const y = floating ? 3 + rnd(i * 5) * 14 : 0; const L = 2.2 + rnd(i * 7) * 3;
    e.set(floating ? PI + (rnd(i) - .5) * .5 : (rnd(i * 9) - .5) * 0.35, rnd(i * 11) * PI, (rnd(i * 13) - .5) * 0.35); qq.setFromEuler(e);
    const base = V3(x, y + (floating ? L : 0), z);
    const up = V3(0, 1, 0).applyQuaternion(qq);
    p.copy(base).addScaledVector(up, L / 2); s.set(0.16, L, 0.05); m.compose(p, qq, s); blade.setMatrixAt(i, m);
    p.copy(base).addScaledVector(up, -0.05); s.set(0.7, 0.1, 0.2); m.compose(p, qq, s); guard.setMatrixAt(i, m);
  }
  g.add(blade, guard);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; const mp = new THREE.Mesh(BOX, bas(0x8aa8ff, { transparent: true, opacity: 0.28 })); mp.scale.set(7, 16, 0.3); mp.position.set(Math.cos(a) * 42, 8, Math.sin(a) * 42); mp.lookAt(0, 8, 0); g.add(mp); }
  DOM.halo = new THREE.Group(); DOM.halo.position.y = 40; g.add(DOM.halo);
  for (let i = 0; i < 48; i++) { const a = (i / 48) * PI * 2; const c = new THREE.Mesh(BOX, bas(i % 2 ? 0xff8ac8 : 0x8ac8ff)); c.scale.setScalar(1.2); c.position.set(Math.cos(a) * 28, 0, Math.sin(a) * 28); DOM.halo.add(c); }
  const sp = []; for (let i = 0; i < 500; i++) { const a = rnd(i * 1.7) * PI * 2, el = 0.15 + rnd(i * 2.9) * 1.3; sp.push(Math.cos(a) * 150, 10 + Math.sin(el) * 120, Math.sin(a) * 150); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, color: 0xffffff, fog: false })));
  scene.add(g);
})();
Object.values(ENV).forEach(e => (e.g.visible = false));
function setEnv(k) {
  for (const n in ENV) ENV[n].g.visible = n === k;
  if (!k) { scene.fog = null; return; }
  const e = ENV[k]; scene.fog = new THREE.Fog(e.fog[0], e.fog[1], e.fog[2]);
  hemi.color.set(e.hemi[0]); hemi.groundColor.set(e.hemi[1]); hemi.intensity = e.hemi[2]; sun.color.set(e.sun[0]); sun.intensity = e.sun[1];
}

// ---------- キャラクター ----------
const O = makeOkkotsu(scene), K = makeKashimo(scene), R = makeRika(scene);
const CL = [0, 1, 2, 3].map(() => { const c = makeOkkotsu(scene); c.mats.forEach(m => { m.transparent = true; m.opacity = 0.7; }); return c; });
const PRE = {
  idle: { Rf: .05, Rab: .1, Lf: .05, Lab: .1 },
  sign: { Rf: 1.5, Rab: -.15, Lf: 1.5, Lab: -.15, lean: .05 },
  guard: { Rf: 1.3, Rab: -.3, Lf: 1.3, Lab: -.3, lean: .25, lr: .4, ll: -.3 },
  up: { Rf: 3.0, Rab: .1, Lf: .1, Lab: .2, lean: -.25, lr: .2, ll: -.2 },
  slash: { Rf: .5, Rab: .1, Lf: .1, Lab: .2, lean: .6, lr: .6, ll: -.4 },
  windR: { Rf: -.9, Lf: .5, Lab: .3, lean: -.1, twist: .3, lr: -.3, ll: .3 },
  windL: { Lf: -.9, Rf: .5, Rab: .3, lean: -.1, twist: -.3, lr: .3, ll: -.3 },
  punchR: { Rf: 1.57, Rab: 0, Lf: .5, Lab: .3, lean: .5, lr: .6, ll: -.5, twist: -.3 },
  punchL: { Lf: 1.57, Lab: 0, Rf: .5, Rab: .3, lean: .5, lr: -.5, ll: .6, twist: .3 },
  lunge: { lean: .7, lr: .9, ll: -.7, Rf: 1.0, Lf: -.6 },
  stagger: { lean: -.4, Rf: -.3, Lf: .4, lr: -.3, ll: .3, headP: -.3 },
  hurt: { lean: -.7, Rf: -.5, Lf: -.5, Rab: .8, Lab: .8, lr: -.4, ll: .2, headP: -.5 },
  kneel: { lr: 1.2, ll: -.5, lean: .3, Rf: .4, Lf: .4, headP: .3 },
  palms: { Rf: 1.57, Rab: -.1, Lf: 1.57, Lab: -.1, lean: .15, lr: .3, ll: -.3 },
  frozen: { Rf: .6, Rab: .5, Lf: .6, Lab: .5, lean: -.1, lr: .3, ll: -.3, headP: -.2 },
  roar: { Rf: .8, Rab: 1.0, Lf: .8, Lab: 1.0, lean: -.35, headP: -.6, lr: .2, ll: -.2 },
  ko: { ko: 1, Rf: .1, Lf: .1, Rab: .4, Lab: .4 },
  koF: { ko: -1, Rf: .1, Lf: .1, Rab: .4, Lab: .4 },
};
const POSEK = ['Rf', 'Rab', 'Lf', 'Lab', 'lr', 'll', 'lean', 'twist', 'headP', 'headY', 'ko'];
const DEF = { Rf: .05, Rab: .1, Lf: .05, Lab: .1 };
function compile(keys) {
  let cur = { x: 0, y: 0, z: 0, yaw: 0 };
  return keys.map(k => { const o = k[2] || {}; cur = { x: o.x ?? cur.x, y: o.y ?? cur.y, z: o.z ?? cur.z, yaw: o.yaw ?? cur.yaw }; const p = { ...DEF, ...PRE[k[1]] };
    for (const n of POSEK) p[n] ??= 0; return { t: k[0], p, pos: { ...cur }, snap: o.e === 'snap' }; });
}
function evalActor(keys, t, bob) {
  let i = 0; while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const u = a === b || b.snap ? 0 : smooth(clamp((t - a.t) / (b.t - a.t)));
  const s = {}; for (const n of POSEK) s[n] = lerp(a.p[n], b.p[n], u);
  for (const n of ['x', 'y', 'z', 'yaw']) s[n] = lerp(a.pos[n], b.pos[n], u);
  const br = Math.sin(t * 2.4 + bob) * 0.02; s.lean += br; s.Rf += br; s.Lf += br; return s;
}
const OK = compile([
  [0, 'idle', { x: 0, z: 5, yaw: PI }], [4.6, 'guard'], [6.1, 'guard', { z: 5.2 }], [6.4, 'stagger'], [6.8, 'guard'], [7.1, 'punchL'], [7.5, 'stagger', { z: 5.5 }], [7.9, 'guard'],
  [8.2, 'punchR'], [8.6, 'guard', { z: 6.0 }], [8.9, 'punchL'], [9.3, 'hurt', { z: 6.6 }], [10.0, 'stagger', { z: 7.0 }],
  [10.3, 'up', { z: 9.2, y: 1.2 }], [10.8, 'up', { y: 0 }], [11.8, 'guard'], [14.0, 'guard'], [14.6, 'idle'], [16.4, 'sign'], [17.7, 'sign'],
  [17.75, 'sign', { z: 5, e: 'snap' }], [19.4, 'up'], [19.8, 'slash'], [20.4, 'guard'], [22.0, 'idle'], [24.0, 'idle'],
  [24.6, 'lunge', { z: 3 }], [25.2, 'slash', { z: -1.2 }], [26.0, 'slash'], [27.0, 'guard'], [27.6, 'hurt'], [28.2, 'hurt', { z: 3.0, y: .6 }], [28.7, 'stagger', { z: 4, y: 0 }],
  [29.4, 'guard'], [29.5, 'hurt'], [29.99, 'hurt'], [30.0, 'hurt', { z: 4, e: 'snap' }], [31.0, 'kneel'], [33.0, 'kneel'], [33.5, 'up'], [35.8, 'up'], [36.5, 'guard'],
  [38.3, 'palms'], [41.5, 'palms'], [41.8, 'stagger', { z: 6.0 }], [43.6, 'stagger'], [44.8, 'idle', { z: 5.4 }], [46.4, 'idle'], [46.6, 'hurt'], [47.2, 'hurt'], [47.9, 'koF', { z: 5.0 }],
]);
const KK = compile([
  [0, 'idle', { x: 0, z: -5, yaw: 0 }], [4.7, 'windR'], [5.0, 'windR'], [5.9, 'lunge', { z: 3.7 }], [6.2, 'punchR', { z: 3.9 }], [6.7, 'punchR'], [7.1, 'windL', { z: 4.0 }], [7.4, 'punchL', { z: 4.2 }],
  [7.8, 'windR'], [8.1, 'punchR', { z: 4.7 }], [8.5, 'windL'], [8.9, 'punchL', { z: 5.1 }], [9.3, 'punchR', { z: 5.3 }], [9.9, 'guard', { z: 5.7 }], [10.6, 'stagger', { z: 5.0 }], [11.5, 'guard', { z: 4.8 }],
  [12.0, 'lunge', { z: 6.4 }], [12.6, 'windR', { z: 6.8 }], [12.8, 'hurt', { z: 6.6 }], [13.2, 'hurt', { z: 3.4, y: .4 }], [13.5, 'windR', { y: 0 }], [13.7, 'punchR', { z: 5.6 }], [14.2, 'guard', { z: 5.2 }],
  [14.6, 'up', { z: 3.5, y: 4.5 }], [15.3, 'up'], [16.2, 'idle', { y: 0 }], [17.0, 'guard'],
  [17.75, 'guard', { z: -3, e: 'snap' }], [19.6, 'guard'], [19.8, 'stagger'], [20.2, 'frozen'], [21.9, 'frozen'], [22.4, 'stagger'], [22.8, 'hurt'], [23.2, 'stagger'], [23.6, 'hurt'], [24.2, 'hurt'],
  [24.7, 'kneel'], [26.8, 'kneel'], [27.2, 'lunge', { z: -1.8 }], [27.6, 'punchR', { z: -1.9 }], [28.3, 'punchR'], [29.0, 'idle', { z: -1.5 }], [29.4, 'palms'], [29.99, 'palms'],
  [30.0, 'idle', { z: -3, e: 'snap' }], [36.0, 'idle'], [36.6, 'roar'], [38.3, 'roar'], [38.7, 'lunge'], [41.5, 'lunge'], [41.8, 'stagger', { z: -5 }], [43.6, 'stagger'],
  [44.99, 'idle', { z: -5, e: 'snap' }], [45.0, 'windR', { z: 6.75, yaw: PI, e: 'snap' }], [46.2, 'windR'], [46.5, 'punchR'], [47.5, 'punchR'], [48.5, 'stagger'], [51.0, 'kneel'], [53.2, 'kneel'],
]);
const RK = {
  vis: t => t >= T.rikaOn && t < 50.4,
  sc: t => kf(t, [[10.6, 0.1], [11.8, 1.6], [33.5, 1.6], [35.2, 2.3], [49.0, 2.3], [50.4, 0.05]]),
  jaw: t => kf(t, [[0, .55], [12.6, .9], [13, .5], [15.3, .55], [15.5, 1.1], [16.5, .55], [34, .55], [35, 1.2], [36, .7], [38.3, .7], [38.8, 1.2], [41.7, 1.2], [42, .5], [49, .5]]),
  z: t => kf(t, [[10.6, 11.8], [12.0, 11.8], [12.7, 9.9], [14.5, 11.8], [33.5, 11.8], [35.2, 12.8], [49, 12.8]]),
  arms: t => kf(t, [[10.6, [.1, .1, .35, .35, 0, 0]], [12.2, [-.6, .1, .2, .35, -.2, -.2]], [12.8, [1.5, .1, .05, .35, .1, .3]], [13.4, [.2, .1, .3, .35, 0, 0]], [13.6, [1.5, .1, .05, .35, .1, .3]], [14.5, [.2, .2, .4, .4, 0, 0]],
    [15.2, [.2, .2, .4, .4, 0, 0]], [15.4, [.6, .6, .7, .7, -.5, -.2]], [16.6, [.1, .1, .35, .35, 0, 0]], [34.6, [.1, .1, .35, .35, 0, 0]], [35.4, [1.0, 1.0, 1.0, 1.0, .3, .1]], [38.5, [.6, .6, .6, .6, -.5, -.1]],
    [40.0, [1.1, 1.1, .5, .5, .1, .2]], [41.7, [1.1, 1.1, .5, .5, .1, .2]], [42.0, [-.3, -.3, .8, .8, -.4, -.4]], [44.0, [.1, .1, .4, .4, 0, 0]]]),
};

// ---------- エフェクト基盤 ----------
const tmpA = V3();
class Bolts {
  constructor(n = 560) { this.pool = []; this.i = 0; this.ax = V3(1, 0, 0);
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
  // 太い稲妻(本線+枝)
  thunder(a, b, w, seed, branches = 4, col = 0xfff2a0) {
    this.bolt(a, b, { n: 12, jit: Math.max(0.4, a.distanceTo(b) * 0.05), w: w * 2.4, color: col, seed }); this.bolt(a, b, { n: 12, jit: Math.max(0.4, a.distanceTo(b) * 0.05), w, color: 0xffffff, seed });
    for (let k = 0; k < branches; k++) { const f = 0.2 + rnd(seed + k * 3.1) * 0.7; const p = a.clone().lerp(b, f);
      const e = p.clone().add(V3((rnd(seed * 3 + k) - .5) * 6, (rnd(seed * 5 + k) - .5) * 5, (rnd(seed * 7 + k) - .5) * 6));
      this.bolt(p, e, { n: 5, jit: 0.4, w: w * 0.6, color: col, seed: seed + k * 11 }); }
  }
  ring(c, r, w, color, seed, N = 24, axis = 'z') {
    for (let i = 0; i < N; i++) { const a0 = (i / N) * PI * 2, a1 = ((i + 1) / N) * PI * 2;
      const f = a => axis === 'z' ? V3(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.z) : V3(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r);
      this.bolt(f(a0), f(a1), { n: 2, jit: 0.15, w, color, seed: seed + i }); }
  }
}
const bolts = new Bolts();

const PARTS = [];
function burst(t0, o, n, op = {}) {
  const { speed = 6, up = 2, life = 1.5, size = 0.3, g = 9, cols = [0xffffff], dir = null, spread = 1, seed = 1, tspan = 0, ground = true, rot = 4, shrink = true } = op;
  for (let i = 0; i < n; i++) {
    const r = k => rnd(seed * 91.7 + i * k);
    let v; if (dir) v = V3(dir[0] + (r(1.3) - .5) * spread, dir[1] + (r(2.3) - .5) * spread, dir[2] + (r(3.3) - .5) * spread).normalize().multiplyScalar(speed * (0.5 + r(4.3)));
    else { const a = r(1.7) * PI * 2, e = r(2.9) * 2 - 1; v = V3(Math.cos(a) * Math.sqrt(1 - e * e), e, Math.sin(a) * Math.sqrt(1 - e * e)).multiplyScalar(speed * (0.35 + r(3.9))); v.y += up * r(5.1); }
    const org = Array.isArray(o) ? V3(...o) : o.clone();
    PARTS.push({ t0: t0 + (tspan ? r(6.1) * tspan : 0), life: life * (0.7 + r(7.3) * 0.6), p: org.add(V3((r(8.1) - .5) * spread * .3, (r(8.7) - .5) * spread * .3, (r(9.3) - .5) * spread * .3)), v, g, size: size * 0.62 * (0.5 + r(10.3)), col: cols[Math.floor(r(11.3) * cols.length)], ground, rot, shrink, sp: r(12.1) * 3 });
  }
}
const NP = 3200;
const IM = new THREE.InstancedMesh(BOX, bas(0xffffff), NP); IM.frustumCulled = false; IM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(IM);
IM.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NP * 3), 3);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color(), _s = V3(), _p = V3();
function updateParts(t) {
  let n = 0;
  for (const p of PARTS) {
    const tau = t - p.t0; if (tau < 0 || tau > p.life || n >= NP) continue;
    _p.set(p.p.x + p.v.x * tau, p.p.y + p.v.y * tau - 0.5 * p.g * tau * tau, p.p.z + p.v.z * tau);
    const sc = p.size * (p.shrink ? (1 - Math.pow(tau / p.life, 3)) : 1);
    if (p.ground && _p.y < sc / 2) _p.y = sc / 2;
    _e.set(tau * p.rot + p.sp, tau * p.rot * 0.7, p.sp); _q.setFromEuler(_e); _s.setScalar(Math.max(sc, 1e-4));
    _m.compose(_p, _q, _s); IM.setMatrixAt(n, _m); _c.set(p.col); IM.setColorAt(n, _c); n++;
  }
  IM.count = n; IM.instanceMatrix.needsUpdate = true; IM.instanceColor.needsUpdate = true;
}
// ---- 粒子の登録 ----
const GOLD = [0xffe070, 0xfff6c0, 0xffffff, 0xffc030];
T.melee.forEach((tm, i) => burst(tm, [0, 1.5, 4.3 + i * 0.3], 22, { speed: 7, up: 2, life: 0.7, size: 0.2, g: 6, cols: GOLD, seed: 40 + i }));
burst(T.rikaOn, [0, 0.3, 11.8], 110, { speed: 7, up: 6, life: 1.6, size: 0.35, g: 8, cols: [0xffffff, 0xe0d8f0, 0xb8b6c4], seed: 51 });
burst(T.rikaHit, [0, 1.2, 6.9], 60, { speed: 9, up: 3, life: 1.3, size: 0.4, g: 8, cols: [0xd8d0c0, 0xa89a80, 0xffffff], seed: 52 });
burst(T.rikaHit2, [0, 1.4, 5.7], 40, { speed: 8, up: 3, life: 1.0, size: 0.3, g: 8, cols: GOLD, seed: 53 });
burst(T.strike, [0, 7, 11.8], 90, { speed: 10, up: 4, life: 1.4, size: 0.4, g: 6, cols: GOLD, seed: 54 });
burst(24.1, [0, 1.2, -3], 60, { speed: 9, up: 3, life: 1.0, size: 0.3, g: 8, cols: [0xffffff, 0x8ac8ff, 0xff8ac8], seed: 55 });
burst(T.oSlash, [0, 1.2, -2.5], 60, { speed: 9, up: 3, life: 1.0, size: 0.3, g: 8, cols: [0xffffff, 0x8ac8ff, 0xff8ac8], seed: 56 });
burst(T.kPunch, [0, 1.3, -0.5], 70, { speed: 10, up: 3, life: 1.2, size: 0.35, g: 8, cols: GOLD, seed: 57 });
burst(T.domainBreak, [0, 8, 0], 200, { speed: 1, up: 0, life: 1.8, size: 0.8, g: 12, cols: [0xff8ac8, 0x8ac8ff, 0xffffff, 0x6a3a9a], seed: 58, tspan: 0.4, spread: 34, rot: 2 });
for (let k = 0; k < 4; k++) burst(T.heal - 0.2 + k * 0.55, [0, 0.2, 4], 14, { speed: 0.6, up: 3.0, life: 1.8, size: 0.1, g: -0.5, cols: [0x40ff80, 0xa0ffc0, 0x30e070], seed: 60 + k, tspan: 0.5, ground: false, spread: 5 });
burst(T.full, [0, 4, 11.8], 120, { speed: 10, up: 4, life: 1.6, size: 0.5, g: 6, cols: [0xffffff, 0xffb0d8, 0xb8b6c4], seed: 65 });
for (let k = 0; k < 10; k++) burst(T.gold + k * 0.5, [0, 0.4, -3], 14, { speed: 1.5, up: 3, life: 1.2, size: 0.16, g: -1, cols: GOLD, seed: 70 + k, tspan: 0.5, ground: false, spread: 4 });
burst(T.clash, [0, 3.4, 2], 380, { speed: 19, up: 4, life: 3.2, size: 0.6, g: 5, cols: [0xff9a30, 0xffe070, 0xffffff, 0xff5a20, 0xff9ad0], seed: 80 });
burst(T.clash + 0.1, [0, 3, 2], 60, { speed: 1.0, up: 1, life: 3.4, size: 1.4, g: -0.5, cols: [0x3a3438, 0x2a2428, 0x4a4448], seed: 81, tspan: 0.8, ground: false, rot: 0.5 });
burst(T.clash, [-19, 1.5, -6], 100, { speed: 12, up: 6, life: 2.6, size: 0.7, g: 8, cols: [0xff5a8a, 0xffd860, 0xffffff, 0x8a5a30], seed: 82 });
burst(T.pierce, [0, 1.3, 5.9], 90, { speed: 11, up: 1, life: 1.4, size: 0.3, g: 6, cols: [0xff2030, 0xffffff, 0xffd860], seed: 83, dir: [0, 0.05, 1], spread: 0.6 });
burst(T.pierce, [0, 1.3, 4.4], 50, { speed: 12, up: 1, life: 1.2, size: 0.3, g: 6, cols: GOLD, seed: 84, dir: [0, 0.05, -1], spread: 0.5 });
burst(T.oFall, [0, 0.2, 5.0], 40, { speed: 4, up: 2, life: 1.2, size: 0.3, g: 6, cols: [0xd8d0c0, 0xa89a80], seed: 85 });
burst(T.rikaGone, [0, 5, 12.5], 170, { speed: 6, up: 3, life: 2.2, size: 0.5, g: 3, cols: [0xffffff, 0xe0d8f0, 0xffb0d8], seed: 86 });
for (let k = 0; k < 6; k++) burst(T.kCrumble + k * 0.25, [0, 1.0, 6.75], 14, { speed: 1.2, up: 1.5, life: 1.2, size: 0.2, g: 8, cols: [0x62e8d8, 0xf4f4f0, 0xffd060], seed: 90 + k, tspan: 0.25 });
burst(T.kBurst, [0, 1.0, 6.75], 200, { speed: 6, up: 5, life: 2.2, size: 0.4, g: 8, cols: [0x62e8d8, 0xf4f4f0, 0xffd060, 0xeec8aa, 0x3ab8b2], seed: 100 });

// 領域の殻(展開の瞬間)
const shB = new THREE.Group();
shB.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: 0x8a5aff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })));
shB.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.005, 2), new THREE.MeshBasicMaterial({ color: 0xd8c8ff, wireframe: true, transparent: true, opacity: 0.7, toneMapped: false })));
shB.visible = false; scene.add(shB);
// 黒閃ではなく雷の衝撃球(貫通・激突用)
const orb = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, toneMapped: false }));
const orbC = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffc040, side: THREE.BackSide, transparent: true, depthWrite: false, toneMapped: false }));
orb.visible = orbC.visible = false; scene.add(orb, orbC);
const chargeA = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), bas(0xff9ad0)), chargeB = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), bas(0xffd040));
chargeA.visible = chargeB.visible = false; scene.add(chargeA, chargeB);

// 斬撃(解)
const SLASH = [];
function addSlash(t0, c, ang, len, w, col, dur = 0.5) { const d = V3(Math.cos(ang), Math.sin(ang), 0.25).normalize(); SLASH.push({ t0, dur, a: c.clone().addScaledVector(d, -len), b: c.clone().addScaledVector(d, len), w, col }); }
const KC = V3(0, 1.4, -3);
[[19.7, 0.4], [20.0, 2.4], [20.9, 1.3], [21.2, 3.6], [21.5, 5.3]].forEach(([tt, a], i) => addSlash(tt, KC, a, 6, 0.28, i % 2 ? 0xff8ac8 : 0x8ac8ff));
SLASH.push({ t0: T.oSlash, dur: 0.5, a: V3(-5, 4, -2.6), b: V3(5, -0.5, -2.2), w: 0.45, col: 0xff8ac8 });
SLASH.push({ t0: 1.0, dur: 0, a: V3(), b: V3(), w: 0, col: 0 });

// ---------- 状態更新 ----------
let flashW = 0, invert = 0, shakeAmp = 0, speedT = -9;
const envAt = t => (t >= T.domainIn && t < T.domainBreak ? 'D' : 'A');
const CLONE_T = [22.5, 22.8, 23.1, 23.4, 23.7];
function updateScene(t) {
  setEnv(envAt(t));
  PARK.wheel.rotation.z = t * 0.12; PARK.gond.forEach(gr => (gr.rotation.z = -t * 0.12)); PARK.horses.rotation.y = t * 0.8;
  const gone = t >= T.clash; PARK.carousel.visible = !gone; PARK.rubble.visible = gone;
  DOM.halo.rotation.y = t * 0.3;
  setPose(O, evalActor(OK, t, 0)); setPose(K, evalActor(KK, t, 1.7));
  // 鹿紫雲: 幻獣琥珀で金色に、崩壊で灰色に
  const gold = smooth(clamp((t - T.gold) / 0.6)) * (t < T.beamOn + 3.2 ? 1 : 1 - smooth(clamp((t - 41.8) / 1.0)) * 0.6);
  const ashf = smooth(clamp((t - T.kCrumble) / 1.2));
  if (ashf > 0) setTint(K, 0x707070, 0.8 * ashf); else if (gold > 0) setTint(K, 0xffd040, 0.55 * gold); else setTint(K, 0xffffff, 0);
  K.root.scale.setScalar(t > T.kBurst ? Math.max(0.0001, 1 - smooth(clamp((t - T.kBurst) / 0.15))) : 1 + 0.15 * gold);
  // 乙骨の治療・負傷の色
  setTint(O, 0x55ff88, t > T.heal && t < T.heal + 2.4 ? 0.25 * Math.sin((t - T.heal) / 2.4 * PI) : 0);
  // リカ
  const rv = RK.vis(t); const a = RK.arms(t);
  setRika(R, { x: 0, y: t >= T.full ? 0.1 : 0, z: RK.z(t), yaw: PI, sc: RK.sc(t), Rf: a[0], Lf: a[1], Rab: a[2], Lab: a[3], headP: a[4], lean: a[5] * 0.5, jaw: RK.jaw(t), tw: t, full: t >= T.full, vis: rv });
  R.halo.rotation.z = t * 0.5;
  // 分身
  const show = t >= 22.0 && t < 24.7; const p0 = KC.clone();
  CL.forEach((c, i) => {
    if (!show) { c.root.visible = false; return; }
    const ang = (i / 4) * PI * 2 + 0.6; let r = 3.4; let striking = false;
    for (let k = 0; k < CLONE_T.length; k++) if ((k % 4) === i) { const d = Math.abs(t - CLONE_T[k]); if (d < 0.25) { r = 3.4 - 2.0 * (1 - d / 0.25); striking = d < 0.12; } }
    const x = p0.x + Math.cos(ang) * r, z = -3 + Math.sin(ang) * r; const sp = smooth(clamp((t - 22.0) / 0.25));
    setPose(c, { ...PRE[striking ? 'slash' : 'windR'], x, z, yaw: Math.atan2(p0.x - x, -3 - z), vis: true });
    c.root.scale.setScalar(sp);
  });
  O.root.updateMatrixWorld(true); K.root.updateMatrixWorld(true); R.root.updateMatrixWorld(true);
}
const OHIT = [[T.melee[0], 0.35]];
function bodyOf(C, y = 0.45) { return worldOf(C.torso, [0, y, 0]); }
function updateFx(t) {
  bolts.begin(); flashW = 0; invert = 0; fxLight.intensity = 0; shakeAmp = 0; chargeA.visible = chargeB.visible = false;
  const frame = Math.floor(t * 24); const kb = bodyOf(K);
  // 鹿紫雲の体表の雷(幻獣琥珀ではさらに激しく)
  if (t > 1.2 && K.root.visible && t < T.kBurst) {
    const goldF = t >= T.gold && t < 43 ? 1 : 0; const n = (t > 36 && t < 37.3) ? 3 : 3 + goldF * 9;
    for (let b = 0; b < n; b++) { const e = kb.clone().add(V3(rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) * 1.4 - .6, rnd(frame * 7 + b) - .5).normalize().multiplyScalar(0.7 + goldF * 0.9 * rnd(b + frame)));
      bolts.bolt(kb, e, { n: 4, jit: .15, w: 0.035 + goldF * 0.03, color: goldF ? 0xffe070 : 0xcfe8ff, seed: frame * 9 + b }); }
  }
  // 突進の軌跡
  if (t > T.dash && t < 6.4) { const s0 = V3(0, 1.3, -5); const e = kb.clone();
    for (let b = 0; b < 3; b++) bolts.bolt(s0.clone().add(V3(0, b * 0.3 - 0.3, 0)), e.clone().add(V3(0, b * 0.3 - 0.3, 0)), { n: 10, jit: 0.3, w: 0.08, color: b ? 0xcfe8ff : 0xfff2a0, seed: frame * 5 + b });
    flashW = Math.max(flashW, t < 5.1 ? 0.2 : 0); }
  // 肉弾戦のヒット
  T.melee.forEach((tm, i) => { const d = t - tm; if (d < 0 || d > 0.2) return; const c = V3((rnd(i * 3) - .5) * 0.5, 1.5, 4.5 + i * 0.3);
    for (let b = 0; b < 8; b++) bolts.bolt(c, c.clone().add(V3((rnd(b + i * 7 + frame) - .5) * 2.4, (rnd(b * 2 + i) - .4) * 2, (rnd(b * 3 + i) - .5) * 2.4)), { n: 2, jit: .1, w: 0.06, color: 0xffffff, seed: b + i * 9 });
    flashW = Math.max(flashW, 0.1 * (1 - d / 0.2)); shakeAmp = Math.max(shakeAmp, 0.25 * (1 - d / 0.2)); });
  // リカ登場・衝撃波
  const ringAt = (t0, c, rmax, col, dur = 0.5) => { const d = t - t0; if (d < 0 || d > dur) return; const k = d / dur; bolts.ring(V3(c[0], c[1], c[2]), rmax * easeOut(k), 0.16 * (1 - k) + 0.03, col, frame * 7, 28, 'y'); };
  ringAt(T.rikaOn, [0, 0.3, 11.8], 8, 0xffffff, 0.7); ringAt(T.rikaHit, [0, 0.3, 6.8], 7, 0xffe070); ringAt(T.rikaHit2, [0, 0.3, 5.7], 6, 0xffe070); ringAt(T.full, [0, 0.3, 12], 14, 0xffb0d8, 0.8);
  ringAt(T.kPunch, [0, 0.3, -0.5], 7, 0xffe070); ringAt(T.pierce, [0, 0.3, 5.4], 7, 0xffd060); ringAt(T.oFall, [0, 0.3, 5.0], 5, 0xd8d0c0, 0.5);
  for (const tt of [T.rikaOn, T.rikaHit, T.rikaHit2, T.full, T.kPunch]) { const d = t - tt; if (d >= 0 && d < 0.4) { shakeAmp = Math.max(shakeAmp, 0.55 * (1 - d / 0.4)); flashW = Math.max(flashW, 0.08 * (1 - d / 0.4)); } }
  // 落雷(鹿紫雲→リカ)
  const rikaHead = worldOf(R.head, [0, 0.1, 0]);
  [[T.strike, rikaHead], [T.strike + 0.2, V3(0, 33, -37)], [T.oShock, bodyOf(O)], [36.2, V3(0, 1.3, -3)], [36.35, V3(3, 1, 4)]].forEach(([ts, target], i) => {
    const d = t - ts; if (d < 0 || d > 0.4) return; const life = 1 - d / 0.4; const top = V3(target.x + (rnd(i + 3) - .5) * 4, 42, target.z + (rnd(i + 5) - .5) * 4);
    for (let b = 0; b < 2; b++) bolts.thunder(top, target, 0.07 * (0.5 + life), frame * 3 + b + i * 17, 4);
    flashW = Math.max(flashW, d < 0.1 ? 0.28 : 0.05 * life); shakeAmp = Math.max(shakeAmp, 0.5 * life);
    fxLight.color.set(0xfff0a0); fxLight.position.copy(target); fxLight.intensity = 35 * life; });
  // 乙骨の領域展開(展開の殻)
  shB.visible = false;
  if (t >= T.domainOn && t < T.domainOn + 0.8) { const d = t - T.domainOn; shB.visible = true; shB.position.set(0, 0, 5); shB.scale.setScalar(0.5 + 55 * easeOut(clamp(d / 0.7))); shB.children[0].material.opacity = 0.35 * (1 - d / 0.8);
    flashW = Math.max(flashW, d < 0.1 ? 0.8 : 0.3 * (1 - d / 0.8)); shakeAmp = Math.max(shakeAmp, 0.4 * (1 - d / 0.8)); if (d < 0.1) invert = 1; }
  // 斬撃(解)
  for (const s of SLASH) { const d = t - s.t0; if (d < 0 || d > s.dur || s.dur === 0) continue; const k = d / s.dur; const grow = clamp(d / 0.06), w = s.w * Math.pow(1 - k, 1.4) * (0.4 + 0.6 * grow);
    const b = s.a.clone().lerp(s.b, grow); bolts.seg(s.a, b, w * 2.6, s.col); bolts.seg(s.a, b, w, 0xffffff); flashW = Math.max(flashW, d < 0.08 ? 0.3 : 0); shakeAmp = Math.max(shakeAmp, 0.35 * (1 - k)); }
  // 呪言(止まれ): 乙骨から鹿紫雲へ赤い輪が走る
  { const d = t - T.curse; if (d >= 0 && d < 0.9) for (let k = 0; k < 4; k++) { const dd = d - k * 0.1; if (dd < 0) continue; const z = lerp(4.5, -3, clamp(dd / 0.5)); bolts.ring(V3(0, 1.4, z), 0.9 + dd * 3.5, 0.11 * (1 - clamp(dd / 0.9)) + 0.02, k % 2 ? 0xff3347 : 0xffffff, frame + k, 22, 'z'); }
    if (t > T.curse + 0.4 && t < 22.0) { const ring = Math.sin(t * 20) * 0.1 + 0.9; bolts.ring(bodyOf(K), ring, 0.05, 0xff3347, frame, 18, 'z'); } }
  // 分身の斬撃
  CLONE_T.forEach((tt, k) => { const d = t - tt; if (d < 0 || d > 0.3) return; const i = k % 4; const ang = (i / 4) * PI * 2 + 0.6; const from = V3(Math.cos(ang) * 3.4, 1.3, -3 + Math.sin(ang) * 3.4); const to = V3(0, 1.4, -3).add(V3((rnd(k) - .5) * 0.8, (rnd(k * 2) - .5) * 0.6, 0));
    bolts.seg(from, to, 0.4 * (1 - d / 0.3) + 0.04, 0x8ac8ff); bolts.seg(from, to, 0.14 * (1 - d / 0.3), 0xffffff); shakeAmp = Math.max(shakeAmp, 0.3 * (1 - d / 0.3)); });
  // 領域崩壊
  if (t >= T.domainBreak && t < T.domainBreak + 0.5) { const d = t - T.domainBreak; flashW = Math.max(flashW, 0.8 * (1 - d / 0.5)); shakeAmp = Math.max(shakeAmp, 0.7 * (1 - d / 0.5)); if (d < 0.09) invert = 1; }
  // 純愛砲チャージと電磁波チャージ・ビーム・激突
  const mouthR = worldOf(R.head, [0, -0.12, 0.35]), mouthK = worldOf(K.head, [0, -0.12, 0.3]); const P = V3(0, 3.4, 2.0);
  if (t >= T.beamOn && t < T.clash) { const c = smooth(clamp((t - T.beamOn) / 1.5));
    chargeA.visible = chargeB.visible = true; chargeA.position.copy(mouthR); chargeA.scale.setScalar(0.2 + 1.3 * c * (1 + 0.1 * Math.sin(t * 40))); chargeB.position.copy(mouthK); chargeB.scale.setScalar(0.15 + 0.6 * c * (1 + 0.1 * Math.sin(t * 43)));
    for (let b = 0; b < 8; b++) { bolts.bolt(mouthR, mouthR.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(1.6 * c)), { n: 3, jit: .2, w: 0.05, color: 0xffc0e0, seed: frame + b });
      bolts.bolt(mouthK, mouthK.clone().add(V3(rnd(frame + b * 2) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(1.2 * c)), { n: 3, jit: .2, w: 0.05, color: 0xfff0a0, seed: frame + b * 3 }); }
    shakeAmp = Math.max(shakeAmp, 0.05 + 0.15 * c);
    if (t >= 40.6) { const g = clamp((t - 40.6) / 0.4); const mid = Math.max(0, t - 41.0); const w = 0.7 + 1.6 * mid;
      const eA = mouthR.clone().lerp(P, g), eB = mouthK.clone().lerp(P, g);
      bolts.seg(mouthR, eA, w * 1.8, 0xff7ac0); bolts.seg(mouthR, eA, w, 0xffffff); bolts.seg(mouthK, eB, w * 1.3, 0xffb020); bolts.seg(mouthK, eB, w * 0.7, 0xffffff);
      if (g >= 1) { orb.visible = orbC.visible = true; orb.position.copy(P); const r = 0.8 + 1.8 * mid + 0.15 * Math.sin(t * 50); orb.scale.setScalar(r); orbC.position.copy(P); orbC.scale.setScalar(r * 1.25); orb.material.opacity = 0.9; orbC.material.opacity = 0.7;
        for (let b = 0; b < 10; b++) bolts.bolt(P, P.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(3 + 3 * rnd(b))), { n: 5, jit: .4, w: 0.08, color: b % 2 ? 0xffe070 : 0xff9ad0, seed: frame * 7 + b });
        shakeAmp = Math.max(shakeAmp, 0.3 + 0.5 * mid); } }
    fxLight.color.set(0xffe090); fxLight.position.copy(P); fxLight.intensity = t >= 41 ? 30 * (t - 41) : 0;
  } else if (t >= T.clash && t < T.clash + 1.6) { const d = t - T.clash;
    orb.visible = orbC.visible = true; orb.position.copy(P); const r = 2.6 + 18 * easeOut(clamp(d / 1.4)); orb.scale.setScalar(r); orbC.position.copy(P); orbC.scale.setScalar(r * 1.08);
    const op = 1 - smooth(clamp((d - 0.4) / 1.2)); orb.material.opacity = op * 0.85; orbC.material.opacity = op;
    bolts.ring(V3(0, 0.3, 2), 30 * easeOut(clamp(d / 1.2)), 0.35 * (1 - clamp(d / 1.2)) + 0.03, 0xffffff, frame * 3, 36, 'y');
    for (let b = 0; b < 14; b++) { const dir = V3(rnd(b * 1.7) - .5, rnd(b * 2.9) - .5, rnd(b * 4.1) - .5).normalize(); bolts.bolt(P, P.clone().addScaledVector(dir, (5 + 9 * rnd(b * 5)) * easeOut(clamp(d / 0.4))), { n: 6, jit: .5, w: 0.14 * (1 - d / 1.6), color: b % 2 ? 0xffe070 : 0xff9ad0, seed: frame * 3 + b }); }
    flashW = Math.max(flashW, d < 0.1 ? 0.9 : 0.5 * (1 - clamp(d / 0.8))); shakeAmp = Math.max(shakeAmp, 1.0 * (1 - clamp(d / 1.4))); if (d < 0.09) invert = 1;
    fxLight.color.set(0xffe090); fxLight.position.copy(P); fxLight.intensity = 80 * (1 - clamp(d / 1.2));
  } else { orb.visible = orbC.visible = false; }
  // 乙骨を貫く貫手
  { const d = t - T.pierce; if (d >= 0 && d < 0.8) { const o = V3(0, 1.2, 5.4); const life = 1 - d / 0.8;
      for (let b = 0; b < 14; b++) { const dir = V3((rnd(b * 1.7) - .5) * 1.4, (rnd(b * 2.9) - .5) * 1.2, (rnd(b) > .5 ? 1 : -1) * (0.4 + rnd(b * 3.3))).normalize(); bolts.bolt(o, o.clone().addScaledVector(dir, (1.5 + 3 * rnd(b * 4.1)) * easeOut(clamp(d / 0.2))), { n: 5, jit: .25, w: 0.08 * life + 0.01, color: b % 3 ? 0xffe070 : 0xff2030, seed: frame * 3 + b }); }
      bolts.seg(V3(0, 1.3, 7), V3(0, 1.2, 3.2), 0.5 * life + 0.05, 0xffe070); bolts.seg(V3(0, 1.3, 7), V3(0, 1.2, 3.2), 0.2 * life, 0xffffff);
      flashW = Math.max(flashW, d < 0.09 ? 0.9 : 0.25 * life); shakeAmp = Math.max(shakeAmp, 0.6 * life); if (d < 0.09) invert = 1; fxLight.color.set(0xffe090); fxLight.position.copy(o); fxLight.intensity = 35 * life; } }
  // 瞬間移動(背後)
  { const d = t - T.blink; if (d >= 0 && d < 0.3) { bolts.bolt(V3(0, 1.4, -5), V3(0, 1.4, 6.75), { n: 14, jit: .5, w: 0.1 * (1 - d / 0.3), color: 0xfff2a0, seed: frame }); flashW = Math.max(flashW, 0.3 * (1 - d / 0.3)); } }
  // 鹿紫雲の崩壊
  if (t > T.kCrumble && t < T.kBurst) { shakeAmp = Math.max(shakeAmp, 0.15); }
  if (t >= T.kBurst && t < T.kBurst + 0.4) { const d = t - T.kBurst; flashW = Math.max(flashW, 0.5 * (1 - d / 0.4)); shakeAmp = Math.max(shakeAmp, 0.5 * (1 - d / 0.4)); }
  // 勝敗後の静寂: 観覧車は動いたまま
  speedT = t;
}

// ---------- カメラ ----------
const UP = V3(0, 1, 0), UPZ = V3(0, 0, -1);
const head = C => worldOf(C.head, [0, 0, 0]);
function orbit(c, r, h, a0, a1, t, t0, t1) { const a = lerp(a0, a1, clamp((t - t0) / (t1 - t0))); return V3(c.x + Math.sin(a) * r, h, c.z + Math.cos(a) * r); }
function shot(t) {
  if (q.has('cam')) { const c = q.get('cam').split(',').map(Number); camera.up.set(0, 1, 0); camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]); camera.fov = c[6] || 50; camera.updateProjectionMatrix(); return; }
  let p, l, fov = 50, up = UP.clone(), roll = 0, sh = 0;
  const oh = head(O), kh = head(K), op = O.root.position, kp = K.root.position, rh = head(R);
  if (t < 2.5) { p = V(kf(t, [[0, [8, 32, 34]], [2.5, [3, 2.4, 14]]], easeOut)); l = V3(0, 3, -6); fov = 55; }
  else if (t < 3.75) { p = orbit(V3(0, 0, 5), 4.6, 1.7, 0.2, 1.7, t, 2.5, 3.75); l = V3(0, 1.4, 5); fov = 50; sh = 0.015; roll = 0.06; }
  else if (t < 5.0) { p = orbit(V3(0, 0, -5), 4.6, 1.7, 2.9, 4.4, t, 3.75, 5.0); l = V3(0, 1.4, -5); fov = 50; sh = 0.015; roll = -0.06; }
  else if (t < 5.9) { p = kp.clone().add(V3(1.8, 1.4, -3.2)); l = kp.clone().add(V3(0, 1.2, 4)); fov = 66; sh = 0.08; }
  else if (t < 7.0) { p = V3(6.2, 1.8, 4.2); l = V3(0, 1.5, 4.2); fov = 44; sh = 0.04; }
  else if (t < 10.0) { const cz = (op.z + kp.z) / 2; const i = Math.floor((t - 7.0) / 0.5) % 6; const L = [[3.8, 1.3, cz + 3.4, 0, 1.5, cz], [-4.4, 1.8, cz - 0.6, 0, 1.5, cz], [1.4, 2.2, kp.z - 3.4, op.x, 1.6, op.z], [-1.2, 2.1, op.z + 3.4, kp.x, 1.6, kp.z], [2.0, 9, cz + 2.0, 0, 0.5, cz], [5.8, 1.6, cz + 3.2, 0, 1.5, cz]][i];
    p = V3(L[0], L[1], L[2]); l = V3(L[3], L[4], L[5]); fov = [52, 48, 42, 42, 55, 48][i]; sh = 0.1; roll = (i % 2 ? 0.08 : -0.08); }
  else if (t < 12.0) { p = V3(3.0, 0.5, 6.8); l = V(kf(t, [[10, [0, 1.8, 9.5]], [11.2, [0, 3.5, 11.8]], [12, [0, 6.5, 11.8]]], lin)); fov = 64; sh = 0.06; }
  else if (t < 14.5) { p = V3(9.0, 2.4, kp.z + 1.0); l = V3(0, 2.2, 7.0); fov = 52; sh = 0.07; roll = -0.06; }
  else if (t < 15.35) { p = V3(13, 13, 0); l = V3(0, 4, 9); fov = 60; sh = 0.05; }
  else if (t < 17.0) { p = rh.clone().add(V3(3.2, 0.6, -3.8)); l = rh.clone(); fov = 56; sh = 0.08; }
  else if (t < 19.5) { p = V(kf(t, [[17, [0.5, 1.8, 9.2]], [17.8, [0.4, 1.8, 7.6]], [19.5, [0.4, 1.9, 6.4]]], lin)); l = V3(0, 1.4, 3); fov = 58; roll = 0.2 * Math.sin(t * 3); sh = 0.05; }
  else if (t < 22.0) { p = orbit(V3(0, 0, -3), 6.5, 2.0, 0.0, 1.8, t, 19.5, 22.0); l = V3(0, 1.4, -3); fov = 48; sh = 0.04; }
  else if (t < 24.6) { p = orbit(V3(0, 0, -3), 7.5, 2.6, 0, PI * 2, t, 22.0, 24.6); l = V3(0, 1.3, -3); fov = 56; sh = 0.04; roll = 0.1; }
  else if (t < 27.0) { p = V(kf(t, [[24.6, [1, 14, -1]], [25.1, [1.5, 5, 3.5]], [27, [2.5, 3.2, 3.5]]], easeOut)); l = V3(0, 1.2, -2); fov = 52; sh = 0.05; }
  else if (t < 28.1) { p = kp.clone().add(V3(0.5, 1.9, -2.0)); l = oh.clone(); fov = 48; sh = 0.05; }
  else if (t < 29.0) { p = oh.clone().add(V3(0.7, 0.1, -1.7)); l = oh.clone(); fov = 40; sh = 0.1; roll = 0.12; }
  else if (t < 31.0) { p = V(kf(t, [[29, [1.0, 1.6, 2.6]], [31, [10, 5, 14]]], easeOut)); l = V3(0, 1.5, 3.5); fov = 56; sh = 0.04; }
  else if (t < 33.5) { p = V(kf(t, [[31, [0.6, 1.0, 1.3]], [33.5, [4.5, 1.7, 0.2]]], lin)); l = V(kf(t, [[31, [0, 1.0, 4]], [33.5, [0, 1.3, 4]]], lin)); fov = 44; }
  else if (t < 36.0) { p = V3(2.6, 0.3, 6.2); l = rh.clone().add(V3(0, -0.5, 0)); fov = 72; roll = -0.15; sh = 0.1; }
  else if (t < 38.5) { p = t < 37.2 ? kh.clone().add(V3(0.4, 0.5, 2.6)) : V(kf(t, [[37.2, [2.4, 2.2, 1.0]], [38.5, [3.4, 2.5, 3.0]]], lin)); l = t < 37.2 ? kh.clone().add(V3(0, 0.1, 0)) : V3(0, 2.0, -3); fov = t < 37.2 ? 40 : 54; sh = 0.08; }
  else if (t < 39.8) { p = worldOf(R.head, [0, 0, 0]).add(V3(3.4, 1.0, -4.0)); l = worldOf(R.head, [0, -0.1, 0.3]); fov = 50; sh = 0.1; }
  else if (t < 41.0) { p = kh.clone().add(V3(-1.8, 0.1, 0.9)); l = kh.clone().add(V3(0, -0.1, 0.5)); fov = 46; sh = 0.12; roll = 0.1; }
  else if (t < 43.5) { p = V(kf(t, [[41, [9, 4.5, 3]], [41.6, [8.5, 4.2, 3.2]], [43.5, [6.5, 3.4, 3.8]]], lin)); l = V3(0, 3.4, 2); fov = 56; sh = 0.04; }
  else if (t < 46.0) { p = V(kf(t, [[43.5, [0.8, 2.4, 10.0]], [46, [0.9, 1.9, 8.7]]], lin)); l = V3(0, 1.6, 3); fov = 52; sh = 0.03; }
  else if (t < 48.5) { p = V3(3.4, 1.3, 5.9); l = V3(0, 1.25, 5.3); fov = 38; sh = 0.12; }
  else if (t < 51.0) { p = V(kf(t, [[48.5, [5, 2, 11]], [51, [9, 5, 17]]], lin)); l = V3(0, 0.6, 5.0); fov = 52; }
  else if (t < 54.0) { p = t < 52.5 ? kh.clone().add(V3(-0.3, 0.1, -1.4)) : V3(3.2, 1.8, 3.4); l = t < 52.5 ? kh.clone() : V3(0, 1.0, 6.75); fov = 44; sh = 0.04; }
  else { p = V(kf(t, [[54, [-4, 3, 24]], [60, [-3, 24, 19]]], lin)); l = V3(0, 3, -6); fov = 55; }
  const total = Math.max(sh, shakeAmp);
  camera.up.copy(up).applyAxisAngle(V3(0, 0, 1), roll === 0 ? 0 : roll);
  if (up.z !== 0) camera.up.copy(up);
  camera.position.copy(p).add(shake(t, total)); camera.lookAt(l); camera.fov = fov; camera.updateProjectionMatrix();
}

// ---------- ポスト ----------
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.5, 0.55, 0.85); composer.addPass(bloom);
composer.addPass(new OutputPass());
const post = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uSat: { value: 1 }, uFlash: { value: 0 }, uInv: { value: 0 }, uFade: { value: 0 }, uCA: { value: 0.0007 }, uAsp: { value: W / H }, uC: { value: new THREE.Vector2(.5, .5) }, uR: { value: 0 }, uStr: { value: 0 }, uVig: { value: 0.45 } },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uSat,uFlash,uInv,uFade,uCA,uAsp,uR,uStr,uVig; uniform vec2 uC; varying vec2 vUv;
  void main(){ vec2 uv=vUv; vec2 d=uv-uC; d.x*=uAsp; float r=length(d); float ring=exp(-pow((r-uR)/0.09,2.0))*uStr;
    vec2 dir=normalize(d+1e-5); dir.x/=uAsp; uv+=dir*ring*0.07; vec2 ca=dir*(uCA+ring*0.01)*(0.5+r);
    vec3 col; col.r=texture2D(tDiffuse,uv+ca).r; col.g=texture2D(tDiffuse,uv).g; col.b=texture2D(tDiffuse,uv-ca).b;
    float l=dot(col,vec3(.299,.587,.114)); col=mix(vec3(l),col,uSat); col=mix(col,vec3(1.0-l*1.1),uInv); col+=uFlash;
    float v=1.0-smoothstep(0.5,1.1,length((vUv-.5)*vec2(1.0,.6))); col*=mix(1.0,v,uVig); col*=1.0-uFade; gl_FragColor=vec4(col,1.0);} `
});
composer.addPass(post);
const CASH = [[T.clash, V3(0, 3.4, 2)], [T.pierce, V3(0, 1.2, 5)], [T.domainBreak, V3(0, 3, 0)], [T.oShock, V3(0, 1.4, 4)], [T.strike, V3(0, 6, 11)]];
function updatePost(t) {
  const u = post.uniforms;
  u.uSat.value = 1; u.uInv.value = invert; u.uFlash.value = flashW * (invert ? 0 : 1);
  u.uFade.value = kf(t, [[0, 1], [0.3, 0], [58.8, 0], [60, 1]], lin);
  u.uCA.value = 0.0007; u.uStr.value = 0;
  for (const [tc, pos] of CASH) { const d = t - tc; if (d >= 0 && d < 0.8) { const sp = pos.clone().project(camera); u.uC.value.set(sp.x * .5 + .5, sp.y * .5 + .5); u.uR.value = d * 1.4; u.uStr.value = 1.0 * (1 - d / 0.8); u.uCA.value = 0.0007 + 0.01 * (1 - d / 0.8); } }
  bloom.strength = 0.5 + Math.min(0.7, flashW * 0.7);
}

// ---------- 2Dオーバーレイ ----------
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
    let size = { say: 78, tech: 98 }[kind] * SC;
    c.font = `900 ${size}px ${FONT}`; const widest = Math.max(...lines.map(l => c.measureText(l).width)); const maxW = W * 0.92; if (widest > maxW) size *= maxW / widest;
    const pop = age < 0.2 ? lerp(1.5, 1, easeOut(age / 0.2)) : 1; const alpha = Math.min(1, age / 0.06) * Math.min(1, rem / 0.1);
    const cy = H * 0.215, lh = size * 1.25, y0 = cy - ((lines.length - 1) * lh) / 2;
    c.save(); c.globalAlpha = alpha; c.translate(W / 2, cy); c.scale(pop, pop); c.translate(-W / 2, -cy);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${size}px ${FONT}`;
    lines.forEach((ln, i) => { const y = y0 + i * lh;
      if (kind === 'tech') { c.shadowColor = '#ffb020'; c.shadowBlur = 30 * SC; strokeText(c, ln, W / 2, y, '#fff2a0', '#e8501a', 10 * SC, 9 * SC); c.shadowBlur = 0; }
      else strokeText(c, ln, W / 2, y, '#fff', '#000', 16 * SC, 0); });
    c.restore();
  }
  // 大きな一言(雷・止まれ)
  for (const [tc, s, col, dur] of [[T.strike, '雷', '#ffe14a', 0.8], [T.curse, '止まれ', '#ff3347', 1.0], [T.clash, '激突', '#ffe14a', 0.8], [T.pierce, '貫', '#ff3347', 0.7]]) {
    const age = t - tc; if (age < 0 || age > dur) continue; const pop = age < 0.12 ? lerp(2.0, 1, easeOut(age / 0.12)) : 1; const a = 1 - clamp((age - dur * 0.6) / (dur * 0.4));
    c.save(); c.globalAlpha = a; c.translate(W / 2, H * 0.44); c.scale(pop, pop); c.rotate(-0.08); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${(s.length > 2 ? 300 : 440) * SC}px ${FONT}`;
    c.shadowColor = col; c.shadowBlur = 60 * SC; strokeText(c, s, 0, 0, col, '#fff', 18 * SC, 14 * SC); c.restore();
  }
}
const SPEED = [[5.0, 0.9], [6.2, 0.15], [7.2, 0.12], [7.9, 0.12], [8.6, 0.12], [9.3, 0.2], [12.8, 0.2], [T.strike, 0.25], [T.domainOn, 0.3], [T.kPunch, 0.2], [T.oShock, 0.25], [T.full, 0.5], [T.gold, 0.5], [T.clash, 0.5], [T.blink, 0.3], [T.pierce, 0.4], [T.domainBreak, 0.3]];
function drawSpeed(c, t) {
  for (const [ts, dur] of SPEED) { const d = t - ts; if (d < 0 || d > dur) continue; const k = d / dur; const fr = Math.floor(t * 24);
    c.save(); c.translate(W / 2, H * 0.5); c.strokeStyle = '#fff'; c.lineCap = 'round';
    for (let i = 0; i < 70; i++) { const a = rnd(i * 3.1 + fr) * PI * 2, r0 = (0.28 + rnd(i * 1.9 + fr * 0.3) * 0.2) * H, r1 = H * (0.7 + rnd(i * 7.3) * 0.2);
      c.globalAlpha = 0.55 * (1 - k); c.lineWidth = (2 + rnd(i * 5.5) * 6) * SC; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 0.9); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); }
    c.restore(); }
}
const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
function drawHearts(c, x, y, hp, px) {
  for (let i = 0; i < 10; i++) { const v = clamp(hp - i * 2, 0, 2); const hx = x + i * px * 9.2;
    for (let r = 0; r < 6; r++) for (let k = 0; k < 7; k++) if (HEART[r][k] === 'X') { const full = v >= 2 || (v > 0 && v < 2 && k < 3.5 * v);
      c.fillStyle = '#000'; c.fillRect(hx + k * px - px * 0.35, y + r * px - px * 0.35, px * 1.7, px * 1.7); c.fillStyle = full ? (r < 2 && k < 3 ? '#ff7a8a' : '#e0192e') : '#3a2a30'; c.fillRect(hx + k * px, y + r * px, px, px); } }
}
function drawHud(c, t) {
  const hp = kf(t, HP.map(h => [h[0], [h[1], h[2]]]), smooth); const px = 5.6 * SC, x0 = 245 * SC;
  c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = `900 ${42 * SC}px ${FONT}`;
  strokeText(c, '乙骨', 40 * SC, 1432 * SC, '#e8f0ff', '#000', 8 * SC, 0); drawHearts(c, x0, 1415 * SC, hp[0], px);
  strokeText(c, '鹿紫雲', 40 * SC, 1498 * SC, '#d8fff6', '#000', 8 * SC, 0); drawHearts(c, x0, 1481 * SC, hp[1], px);
}

// ---------- 1フレーム ----------
function renderAt(t) {
  updateScene(t); updateFx(t); updateParts(t); shot(t); updatePost(t);
  composer.render();
  ctx2.drawImage(renderer.domElement, 0, 0, W, H);
  drawSpeed(ctx2, t); drawHud(ctx2, t); drawCaptions(ctx2, t);
}
window.renderAt = renderAt;
window.frameDataURL = () => out2d.toDataURL('image/jpeg', 0.93);
window.READY = true;
if (q.has('t')) renderAt(parseFloat(q.get('t')));
else if (!q.has('render')) { const t0 = parseFloat(q.get('from') ?? '0'), s = performance.now(); (function loop() { const t = (t0 + (performance.now() - s) / 1000) % DUR; renderAt(t); requestAnimationFrame(loop); })(); }
