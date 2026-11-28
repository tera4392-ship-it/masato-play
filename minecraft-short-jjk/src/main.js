// 五条悟 vs 宿儺(マイクラ風・縦1080x1920)。効果音は自作。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { T, PUR, tau, VID_DUR, END } from './timeline.js';
import { makeGojo, makeSukuna, setPose, worldOf, PX } from './chars.js';
import { buildWorld } from './world.js';

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
const fxLight = new THREE.PointLight(0xffffff, 0, 40, 1.3); scene.add(fxLight);
const out2d = document.createElement('canvas'); out2d.width = W; out2d.height = H; document.body.appendChild(out2d);
const ctx2 = out2d.getContext('2d');
const BOX = new THREE.BoxGeometry(1, 1, 1);
const bas = (c, extra = {}) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...extra });

// ---------- キャラ(五条悟・宿儺。マイクラ体型) ----------
const WORLD = buildWorld(scene); const ENV = WORLD.env; for (const n in ENV) ENV[n].g.visible = n === 'S';
{ const e = ENV.S; scene.fog = new THREE.Fog(e.fog[0], e.fog[1], e.fog[2]); hemi.color.set(e.hemi[0]); hemi.groundColor.set(e.hemi[1]); }
scene.remove(moonL); const sunL = new THREE.DirectionalLight(0x9ab0ff, 0.65); sunL.position.set(-12, 40, 20); scene.add(sunL);
const G = makeGojo(scene), S = makeSukuna(scene);
const PRE = {
  idle: { Rf: .05, Rab: .1, Lf: .05, Lab: .1 },
  walkA: { Rf: -.5, Lf: .5, lr: .6, ll: -.6, Rab: .1, Lab: .1, lean: .08 },
  walkB: { Rf: .5, Lf: -.5, lr: -.6, ll: .6, Rab: .1, Lab: .1, lean: .08 },
  guard: { Rf: 1.3, Rab: -.3, Lf: 1.3, Lab: -.3, lean: .25, lr: .4, ll: -.3 },
  hurt: { lean: -.8, Rf: -.6, Lf: -.6, Rab: .9, Lab: .9, lr: -.5, ll: .3, headP: -.5 },
  landing: { lean: .9, lr: 1.1, ll: .6, Rf: 1.0, Lf: .5, headP: -.2 },
  windS: { Rf: 2.5, Rab: .3, Lf: .3, Lab: .5, twist: .9, lean: -.2, lr: .5, ll: -.4 },
  slashS: { Rf: 1.5, Rab: 0, Lf: .2, Lab: .3, twist: -1.0, lean: .3, lr: .7, ll: -.6 },
  aimL: { Lf: 1.57, Lab: 0, Rf: .3, Rab: .4, lean: .12, lr: .3, ll: -.3, headP: -.1 },
  aimR: { Rf: 1.57, Rab: 0, Lf: .3, Lab: .4, lean: .12, lr: .3, ll: -.3, headP: -.1 },
  redwind: { Rf: -1.2, Lf: .6, lean: -.25, twist: .5, lr: -.5, ll: .5 },
  pulled: { lean: .9, Rf: 1.2, Lf: 1.6, Rab: .6, Lab: .4, lr: .9, ll: .6, headP: -.2 },
  punchR: { Rf: 1.57, Rab: 0, Lf: .6, Lab: .3, lean: .6, lr: .7, ll: -.6, twist: -.4 },
  punchL: { Lf: 1.57, Lab: 0, Rf: .6, Rab: .3, lean: .6, lr: -.6, ll: .7, twist: .4 },
  windR: { Rf: -1.0, Lf: .5, Lab: .3, lean: -.15, twist: .4, lr: -.4, ll: .4 },
  lunge: { lean: .9, lr: 1.0, ll: -.8, Rf: 1.0, Lf: -.7 },
  stagger: { lean: -.5, Rf: -.4, Lf: .5, lr: -.4, ll: .4, headP: -.4 },
  kick: { lr: 1.5, ll: -.3, lean: -.3, Rf: .9, Lf: .2, Lab: .6 },
  sideL: { lean: .3, twist: .6, Lab: .8, lr: .4, ll: -.4 },
  tumble1: { flip: -1.2, lean: -.2, Rf: -.8, Lf: -.8, Rab: .7, Lab: .7, lr: .4, ll: -.3 },
  tumble2: { flip: -3.0, lean: -.2, Rf: -.8, Lf: -.8, Rab: .7, Lab: .7, lr: .4, ll: -.3 },
  tumble3: { flip: -5.0, lean: -.2, Rf: -.8, Lf: -.8, Rab: .7, Lab: .7, lr: .4, ll: -.3 },
  flipaim: { flip: 3.14159, Lf: 1.57, Lab: 0, Rf: .4, Rab: .5, lean: .1, lr: .2, ll: -.2 },
  koF: { ko: -1, Rf: .1, Lf: .1, Rab: .4, Lab: .4 },
};
const POSEK = ['Rf', 'Rab', 'Lf', 'Lab', 'lr', 'll', 'lean', 'twist', 'headP', 'headY', 'ko', 'flip', 'spin', 'roll'];
const DEF = { Rf: .05, Rab: .1, Lf: .05, Lab: .1 };
function compile(keys) { let cur = { x: 0, y: 0, z: 0, yaw: 0 }; return keys.map(k => { const o = k[2] || {}; cur = { x: o.x ?? cur.x, y: o.y ?? cur.y, z: o.z ?? cur.z, yaw: o.yaw ?? cur.yaw }; const p = { ...DEF, ...PRE[k[1]] }; for (const n of POSEK) p[n] ??= 0; if (o.flip !== undefined) p.flip = o.flip; return { t: k[0], p, pos: { ...cur }, snap: o.e === 'snap' }; }); }
function evalActor(keys, t, bob) {
  let i = 0; while (i < keys.length - 1 && keys[i + 1].t <= t) i++; const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)]; const s = {}; const names = [...POSEK, 'x', 'y', 'z', 'yaw'];
  const val = (k, n) => (n === 'x' || n === 'y' || n === 'z' || n === 'yaw') ? k.pos[n] : k.p[n];
  if (a === b || b.snap) { for (const n of names) s[n] = val(a, n); }
  else { const h = b.t - a.t, u = clamp((t - a.t) / h), u2 = u * u, u3 = u2 * u; const prev = keys[i - 1], next = keys[i + 2]; const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    for (const n of names) { const p0 = val(a, n), p1 = val(b, n), sl = (p1 - p0) / h; let m0 = (prev && !a.snap) ? (p1 - val(prev, n)) / (b.t - prev.t) : sl; let m1 = (next && !next.snap) ? (val(next, n) - p0) / (next.t - a.t) : sl; m0 *= 0.85; m1 *= 0.85; if (m0 * sl < 0) m0 = 0; if (m1 * sl < 0) m1 = 0;
      let v = h00 * p0 + h10 * h * m0 + h01 * p1 + h11 * h * m1; const lo = Math.min(p0, p1), hi = Math.max(p0, p1), ex = 0.18 * (hi - lo); s[n] = Math.min(hi + ex, Math.max(lo - ex, v)); } }
  const br = Math.sin(t * 2.4 + bob) * 0.02; s.lean = (s.lean ?? 0) + br; s.Rf += br; s.Lf += br; return s; }
const GK = compile([
  [0, 'idle', { x: 0, y: 0, z: -6, yaw: PI }], [3.3, 'idle'], [3.6, 'guard'], [4.9, 'guard'], [5.1, 'aimL'], [6.4, 'aimL'], [6.6, 'redwind'], [6.85, 'redwind'], [7.0, 'punchR'], [7.4, 'guard'], [8.0, 'guard'],
  [8.55, 'guard'], [8.8, 'sideL', { x: -0.4 }], [9.0, 'guard', { x: 0 }], [9.25, 'punchL'], [9.55, 'guard'], [9.78, 'windR'], [10.05, 'kick', { z: -5.6 }], [10.5, 'idle', { z: -6 }], [10.88, 'idle'], [10.89, 'idle', { e: 'snap' }],
  [11.38, 'idle', { e: 'snap' }], [11.4, 'flipaim', { x: 0, y: 2.6, z: -2.0, e: 'snap' }], [12.9, 'flipaim'], [13.6, 'landing', { y: 0.2 }], [14.4, 'idle', { y: 0 }], [END + 1, 'idle'],
]);
const SK = compile([
  [0, 'walkA', { x: 0, y: 0, z: 30, yaw: 0 }], [0.6, 'walkB', { z: 27 }], [1.2, 'walkA', { z: 24 }], [1.8, 'walkB', { z: 19 }], [2.4, 'walkA', { z: 13 }], [2.9, 'idle', { z: 10 }],
  [3.0, 'windS'], [3.12, 'slashS'], [3.6, 'idle'], [4.1, 'windS'], [4.2, 'slashS'], [4.4, 'windS'], [4.5, 'slashS'], [4.7, 'windS'], [4.8, 'slashS'], [5.3, 'idle'],
  [5.5, 'pulled', { z: 10 }], [6.1, 'pulled', { z: -3.3 }], [6.8, 'pulled', { z: -3.3 }], [7.0, 'hurt', { z: -3.3 }], [7.25, 'tumble1', { z: 2, y: 0.8 }], [7.7, 'tumble2', { z: 8.5, y: 1.2 }], [8.1, 'landing', { z: 12, y: 0 }],
  [8.3, 'lunge', { z: 4 }], [8.55, 'punchR', { z: -3.6 }], [8.8, 'guard'], [9.0, 'punchL'], [9.25, 'guard'], [9.4, 'kick'], [9.7, 'windR'], [9.8, 'punchR'], [10.05, 'hurt', { z: -3.5 }], [10.35, 'stagger', { z: 1 }], [10.8, 'stagger', { z: 4.8 }], [11.3, 'guard', { z: 5 }], [11.98, 'guard'],
  [12.22, 'hurt', { z: 6.2, y: 0.6 }], [12.5, 'tumble1', { z: 15, y: 1.4 }], [12.84, 'tumble2', { z: 25.5, y: 1.8 }], [13.3, 'tumble3', { z: 40, y: 1.4 }], [14.0, 'koF', { z: 52, y: 0 }], [END + 1, 'koF'],
]);
const bodyOf = (C, y = 0.45) => worldOf(C.torso, [0, y, 0]); const headOf = C => worldOf(C.headPivot, [0, 4 * PX, 0]); const handW = (C, side) => worldOf(side === 'R' ? C.armR : C.armL, [0, -12 * PX - 0.05, 0]);
// 無限(五条の周りの青い膜)
const infDome = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false, uniforms: { a: { value: 1 }, time: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: 'uniform float a,time; varying vec3 vN; varying vec3 vP; void main(){ float f=pow(1.0-abs(vN.z),2.2); float g=0.5+0.5*sin(vP.y*20.0+time*6.0)*sin(vP.x*16.0-time*4.0); vec3 c=vec3(0.45,0.8,1.0)*(0.05+f*0.9+g*0.1); gl_FragColor=vec4(c*a,1.0);}' })); infDome.visible = false; scene.add(infDome);
// 球(蒼・赫・茈)
const orbM = (c) => new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), bas(c)); const blueO = orbM(0x4aa8ff), redO = orbM(0xff3a30), purpleO = orbM(0xb060ff), purpleC = orbM(0xffffff); [blueO, redO, purpleO, purpleC].forEach(o => { o.visible = false; scene.add(o); });
// 穴・溝(紫が通った跡)
const HZ = 25.0, HD = 18;
const HM = new THREE.ShaderMaterial({ uniforms: {}, vertexShader: 'varying vec2 vU; void main(){ vU=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'varying vec2 vU; void main(){ float r=length(vU); vec3 c=mix(vec3(0.015,0.0,0.03),vec3(0.45,0.1,0.85),pow(r,4.0)); gl_FragColor=vec4(c,1.0);}' });
const holeF = new THREE.Mesh(new THREE.CircleGeometry(1, 40), HM); holeF.rotation.y = PI; holeF.position.set(0, 1.7, HZ - 1.0);
const holeR = new THREE.Mesh(new THREE.RingGeometry(0.86, 1.0, 40), new THREE.MeshBasicMaterial({ color: 0xb060ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); holeR.rotation.y = PI; holeR.position.set(0, 1.7, HZ - 1.02);
const holeB = new THREE.Mesh(new THREE.CircleGeometry(1, 40), HM); holeB.position.set(0, 1.7, HZ + HD + 0.08);
const trench = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 1), new THREE.MeshBasicMaterial({ color: 0x040006 }));
const trenchE = [0, 1].map(() => new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 1), new THREE.MeshBasicMaterial({ color: 0xa040ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
[holeF, holeR, holeB, trench, ...trenchE].forEach(o => { o.visible = false; scene.add(o); });
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
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false, uniforms: { rev: { value: 0 }, fade: { value: 1 }, tint: { value: new THREE.Vector3(0.3, 0.85, 1.0) } },
    vertexShader: 'attribute float aA; varying float vA; varying vec3 vP; void main(){ vA=aA; vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform float rev,fade; uniform vec3 tint; varying float vA; varying vec3 vP; void main(){ if(vA>rev) discard; float e=length(vP.xz); float core=smoothstep(0.7,1.0,e); vec3 c=mix(tint,vec3(1.0),core); float tail=smoothstep(0.0,0.5,vA+ (1.0-rev)*0.0); gl_FragColor=vec4(c*(0.55+0.7*core)*fade*tail,1.0);}' })); m.visible = false; m.frustumCulled = false; scene.add(m); return m; })();

// ---------- 粒子の登録 ----------
const DUST = [0x5a5c68, 0x8a8c98, 0x3a3c48, 0xe8e8f0];
const GLASS = [0x16243e, 0x9ad0ff, 0xffe2a8, 0xffffff, 0x3a3e4c, 0xb060ff];
burst(T.shield, [0, 1.3, -4.4], 50, { speed: 5, up: 2, life: 1.0, size: 0.14, g: 0, cols: [0x9ad0ff, 0xffffff, 0xff4050], seed: 1, spread: 2, glowing: true });
burst(T.redHit, [0, 1.2, -3.3], 160, { speed: 10, up: 4, life: 1.6, size: 0.35, g: 9, cols: [0xff2030, 0x101010, 0xffffff, 0xffd060], seed: 2, spread: 2 });
burst(T.redHit, [0, 0.2, -3.3], 60, { speed: 6, up: 3, life: 1.4, size: 0.4, g: 9, cols: DUST, seed: 3, spread: 4 });
T.melee.forEach((tm, i) => burst(tm, [0, 1.3, -4.6], 40, { speed: 7, up: 2, life: 0.9, size: 0.15, g: 6, cols: [0xffffff, 0xffe070, 0xff3040], seed: 10 + i, spread: 1.5, glowing: true }));
burst(T.kick, [0, 0.3, -4.0], 70, { speed: 6, up: 3, life: 1.4, size: 0.4, g: 9, cols: DUST, seed: 20, spread: 3 });
for (let k = 0; k < 9; k++) { const zk = -1 + k * 2.6; burst(T.fire + (zk - PUR.z0) / PUR.v, [0, 0.2, zk], 36, { speed: 7, up: 8, life: 1.6, size: 0.45, g: 12, cols: [0x2a2c36, 0x1c1e26, 0x5a5c68, 0xe8e8f0, 0x20222c], seed: 300 + k, dir: [0, 1, 0], spread: 2.2 }); }
burst(T.hole, [0, 1.8, HZ - 0.3], 320, { speed: 15, up: 3, life: 2.2, size: 0.7, g: 9, cols: GLASS, seed: 330, dir: [0, 0.15, -1], spread: 1.8 });
burst(T.hole + 0.3, [0, 2, HZ + HD], 300, { speed: 20, up: 3, life: 2.4, size: 0.8, g: 9, cols: GLASS, seed: 331, dir: [0, 0.2, 1], spread: 2.0 });
burst(T.hole, [0, 5, HZ], 180, { speed: 9, up: 6, life: 2.6, size: 0.9, g: 8, cols: [0x16243e, 0x3a3e4c, 0x9ad0ff], seed: 332, spread: 6 });

// ---------- 状態 ----------
let flashW = 0, invert = 0, shakeAmp = 0, caBoost = 0, bd = null; const SPEED = [[T.redHit, 0.25], [T.fire, 0.3], [T.kick, 0.25], [T.pull, 0.3]];
function updateScene(t, tvid) {
  const ds = clamp((t - T.dawn) / 2.6); const sky = WORLD.anim.skyS.material.uniforms;
  sky.t.value.set(0x02030c).lerp(new THREE.Color(0x2a4a9a), smooth(ds)); sky.b.value.set(0x3a1f5a).lerp(new THREE.Color(0xffa070), smooth(ds));
  scene.fog.color.set(0x1a1030).lerp(new THREE.Color(0xc88a80), smooth(ds)); hemi.intensity = 0.95 + 0.4 * smooth(ds);
  WORLD.anim.blink.forEach(b => (b.m.visible = Math.sin(tvid * 3 + b.ph) > 0.2));
  WORLD.anim.cut.forEach(c => { c.up.position.copy(c.base0); c.up.rotation.set(0, 0, 0); c.up.visible = true; c.edge.visible = false; });
  setPose(G, evalActor(GK, t, 0)); setPose(S, evalActor(SK, t, 1.7));
  G.root.visible = !(t > T.tele + 0.02 && t < T.reappear - 0.01); G.shadow.visible = G.root.visible && G.root.position.y < 0.5; S.shadow.visible = S.root.position.y < 0.5;
}
function tipAt(t) { setPose(G, evalActor(GK, t, 0)); G.root.updateMatrixWorld(true); return handW(G, 'L'); }

// ---------- エフェクト ----------
function sparks(c, i, lf, cols) { for (let b = 0; b < 9; b++) { const dir = V3(rnd(b * 1.7 + i) - .5, rnd(b * 2.9 + i) - .3, rnd(b * 4.1 + i) - .5).normalize(); bolt(c, c.clone().addScaledVector(dir, (0.8 + rnd(b * 5) * 1.6)), { n: 3, jit: .15, w: 0.05 * lf + 0.01, color: cols[b % cols.length], seed: b + i * 9 }); } }
function updateFx(t, tvid, frame) {
  flashW = 0; invert = 0; shakeAmp = 0; caBoost = 0; fxLight.intensity = 0; gi = 0; si = 0; ri = 0;
  GLOWS.forEach(s => (s.visible = false)); SEGS.forEach(s => (s.visible = false)); RINGS.forEach(r => (r.visible = false)); crescent.visible = false; infDome.visible = false; [blueO, redO, purpleO, purpleC].forEach(o => (o.visible = false)); trench.visible = false; trenchE.forEach(m => (m.visible = false)); holeF.visible = holeR.visible = holeB.visible = false;
  G.root.updateMatrixWorld(true); S.root.updateMatrixWorld(true);
  const gb = bodyOf(G), sb = bodyOf(S), gz = G.root.position.z, sz = S.root.position.z;
  // ---- 宿儺の斬撃(解)→ 五条の無限に止められる ----
  { const d = t - (T.kai + 0.12); if (d >= 0 && d < 1.0) { const k = clamp(d / 0.55); const zc = 9 - 13.6 * k; crescent.visible = true; crescent.position.set(0, 1.25, zc + 3); crescent.rotation.set(0, PI / 2, 0); crescent.scale.set(3, 1, 3); crescent.material.uniforms.rev.value = clamp(d / 0.1); crescent.material.uniforms.fade.value = k < 1 ? 1 : 0; crescent.material.uniforms.tint.value.set(1.0, 0.18, 0.25); glow(V3(0, 1.25, zc), 2.4, 0xff4050, 0.5 * (k < 1 ? 1 : 0)); } }
  { const d = t - T.shield; if (d >= 0 && d < 1.6) { const c = V3(0, 1.3, -4.5); ringFx(c, 0.5 + 3.2 * easeOut(clamp(d / 0.5)), 0x9ad0ff, 0.9 * (1 - clamp(d / 0.5)), 'z'); if (d < 0.4) sparks(c, 1, 1 - d / 0.4, [0xffffff, 0x9ad0ff, 0xff4050]); flashW = Math.max(flashW, d < 0.04 ? 0.25 : 0); shakeAmp = Math.max(shakeAmp, 0.4 * (1 - clamp(d / 0.5))); } }
  if (t >= T.shield - 0.1 && t < 5.1) { let a = 0.35; for (const tm of [T.shield, 4.45, 4.75, 5.05]) { const d = t - tm; if (d >= 0 && d < 0.25) a = Math.max(a, 1.4 * (1 - d / 0.25)); } infDome.visible = true; infDome.position.set(G.root.position.x, 1.0, gz); infDome.scale.set(1.5, 1.5, 1.5); infDome.material.uniforms.a.value = a; infDome.material.uniforms.time.value = tvid; }
  // 連続の斬撃(止められる)
  for (const tm of [4.25, 4.55, 4.85]) { const d = t - tm; if (d >= 0 && d < 0.35) { const k = clamp(d / 0.2); for (let b = 0; b < 6; b++) { const y = 0.5 + rnd(b * 3.3 + tm) * 1.8, x = (rnd(b * 7.1 + tm) - .5) * 2.6; const z1 = 9 - 13.6 * k; seg(V3(x, y, z1 + 2.5), V3(x, y, z1), 0.07, b % 2 ? 0xffffff : 0xff3040, 1 - d / 0.35); }
      if (d > 0.18) { const c = V3((rnd(tm) - .5) * 1.2, 1.2, -4.5); ringFx(c, 0.4 + 2.2 * easeOut(clamp((d - 0.18) / 0.15)), 0x9ad0ff, 0.8 * (1 - clamp((d - 0.18) / 0.17)), 'z'); if (d < 0.26) sparks(c, 2, 1, [0xffffff, 0x9ad0ff]); shakeAmp = Math.max(shakeAmp, 0.3); } } }
  // ---- 蒼(引き寄せ)----
  if (t >= T.blue && t < T.red + 0.2) { const h = handW(G, 'L'); const g = smooth(clamp((t - T.blue) / 0.45)); const c = h.clone().add(V3(0, 0.1, 0.55)); blueO.visible = true; blueO.position.copy(c); blueO.scale.setScalar(0.12 + 0.5 * g); glow(c, (0.12 + 0.5 * g) * 6, 0x4aa8ff, 0.7); caBoost = 0.004 * g;
    if (t >= T.pull && t < 6.5) { const pts = []; for (let b = 0; b < 8; b++) { const a = rnd(b * 3.3 + frame) * PI * 2; const f = V3(sb.x + Math.cos(a) * 1.4, sb.y + Math.sin(a) * 1.4, sb.z + 1.2); bolt(f, c, { n: 5, jit: .3, w: 0.03, color: b % 2 ? 0xbfe0ff : 0x4aa8ff, seed: frame * 3 + b }); } shakeAmp = Math.max(shakeAmp, 0.25); } }
  // ---- 赫(吹き飛ばす)----
  if (t >= T.red && t < T.redHit + 0.15) { const h = handW(G, 'R'); const g = smooth(clamp((t - T.red) / 0.35)); redO.visible = true; redO.position.copy(h); redO.scale.setScalar(0.1 + 0.45 * g); glow(h, (0.1 + 0.45 * g) * 6, 0xff3a30, 0.7);
    for (let b = 0; b < 4; b++) bolt(h, h.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(0.5 * g)), { n: 3, jit: .1, w: 0.03, color: 0xff4a40, seed: frame * 3 + b }); }
  { const d = t - T.redHit; if (d >= 0 && d < 1.0) { const c = V3(0, 1.3, -3.3); const r = 0.4 + 2.2 * easeOut(clamp(d / 0.3)), op = 1 - smooth(clamp((d - 0.3) / 0.6)); glow(c, r * 3, 0xff2a20, 0.9 * op);
      for (let b = 0; b < 16; b++) { const dir = V3(rnd(b * 1.7) - .5, rnd(b * 2.9) - .5, rnd(b * 4.1) - .5).normalize(); bolt(c, c.clone().addScaledVector(dir, (2 + 5 * rnd(b * 5)) * easeOut(clamp(d / 0.2))), { n: 6, jit: .4, w: 0.12 * (1 - clamp(d / 1.0)) + 0.01, color: b % 2 ? 0xff2a20 : 0xffffff, seed: frame * 3 + b }); }
      ringFx(V3(0, 0.4, -3.3), 12 * easeOut(clamp(d / 0.6)), 0xff4a40, 0.8 * (1 - clamp(d / 0.6)), 'y'); ringFx(c, 9 * easeOut(clamp(d / 0.5)), 0xffffff, 0.6 * (1 - clamp(d / 0.5)), 'z');
      flashW = Math.max(flashW, d < 0.03 ? 0.55 : 0.1 * (1 - clamp(d / 0.6))); shakeAmp = Math.max(shakeAmp, 1.0 * (1 - clamp(d / 0.9))); if (d < 0.02) invert = 1; fxLight.color.set(0xff3a2a); fxLight.position.copy(c); fxLight.intensity = 60 * (1 - clamp(d / 0.8)); } }
  // ---- 肉弾戦 ----
  T.melee.forEach((tm, i) => { const d = t - tm; if (d < 0 || d > 0.25) return; const c = V3(0, 1.3, (gz + sz) / 2); const lf = 1 - d / 0.25; sparks(c, i, lf, [0xffffff, 0xffe070, 0xff3040]); ringFx(c, 0.5 + 1.5 * easeOut(d / 0.25), 0xffffff, 0.6 * lf, 'x'); flashW = Math.max(flashW, 0.12 * lf); shakeAmp = Math.max(shakeAmp, 0.4 * lf); if (i === 3 && d < 0.02) invert = 1; });
  { const d = t - T.kick; if (d >= 0 && d < 0.5) { const c = V3(0, 1.0, -4.2); ringFx(V3(0, 0.2, -4.2), 8 * easeOut(clamp(d / 0.4)), 0xffffff, 0.7 * (1 - d / 0.5), 'y'); flashW = Math.max(flashW, d < 0.04 ? 0.35 : 0); shakeAmp = Math.max(shakeAmp, 0.8 * (1 - d / 0.5)); } }
  // ---- 五条の瞬間移動 ----
  { const d = t - T.tele; if (d >= 0 && d < 0.5) { const a = V3(0, 1.4, -6.0), b = V3(0, 1.8, -2.0), life = 1 - d / 0.5; bolt(a, b, { n: 8, jit: .4, w: 0.14 * life + 0.01, color: 0xbfe0ff, seed: frame }); ringFx(V3(0, 1.0, -6.0), 4 * easeOut(clamp(d / 0.4)), 0xbfe0ff, 0.8 * life, 'y'); flashW = Math.max(flashW, d < 0.05 ? 0.3 : 0); }
    const d2 = t - T.reappear; if (d2 >= 0 && d2 < 0.5) { ringFx(V3(0, 1.5, -2.0), 5 * easeOut(clamp(d2 / 0.4)), 0xffffff, 0.8 * (1 - d2 / 0.5), 'y'); ringFx(V3(0, 2.6, -2.0), 3 * easeOut(clamp(d2 / 0.4)), 0xbfe0ff, 0.7 * (1 - d2 / 0.5), 'z'); flashW = Math.max(flashW, d2 < 0.05 ? 0.4 : 0.1 * (1 - d2 / 0.5)); shakeAmp = Math.max(shakeAmp, 0.4 * (1 - d2 / 0.5)); } }
  // ---- 蒼と赫を合わせて紫 ----
  if (t >= T.reappear && t < T.fire) { const hL = handW(G, 'L'); const f1 = smooth(clamp((t - 11.55) / 0.4)); const r = 0.6 * (1 - f1) + 0.03, a = (t - 11.55) * 14;
    for (const [mesh, sg, col] of [[blueO, 0, 0x4aa8ff], [redO, PI, 0xff3a30]]) { const pp = hL.clone().add(V3(Math.cos(a + sg) * r, Math.sin(a + sg) * r * 0.6, 0.35)); mesh.visible = true; mesh.position.copy(pp); mesh.scale.setScalar(0.12 + 0.1 * f1); glow(pp, 1.0, col, 0.7); }
    if (f1 > 0.7) { const pc = hL.clone().add(V3(0, 0, 0.35)); purpleO.visible = true; purpleO.position.copy(pc); purpleO.scale.setScalar(0.1 + 0.45 * smooth((f1 - 0.7) / 0.3)); glow(pc, 3, 0xb060ff, 0.9); } }
  // ---- 虚式「茈」 ----
  if (t >= T.fire) { const d = t - T.fire; const gy = 2.6, zf = PUR.z0 + PUR.v * d; const c = V3(0, gy + (1.5 - gy) * smooth(clamp(d / 0.3)), zf); const r = 0.4 + 4.4 * easeOut(clamp(d / 0.9)); const op = 1 - smooth(clamp((d - 1.9) / 0.8));
    if (op > 0.02) { purpleO.visible = true; purpleO.position.copy(c); purpleO.scale.setScalar(r); purpleC.visible = true; purpleC.position.copy(c); purpleC.scale.setScalar(r * 0.45); glow(c, r * 5 * op + 0.1, 0xb060ff, 0.8 * op); glow(c, r * 2.2 * op, 0xffffff, 0.6 * op); }
    const L = Math.min(40, zf - PUR.z0); seg(V3(0, c.y, c.z), V3(0, c.y, c.z - L), r * 1.3 * op, 0x8030e0, 0.55 * op); seg(V3(0, c.y, c.z), V3(0, c.y, c.z - L), r * 0.5 * op, 0xe0c0ff, 0.8 * op);
    for (let k = 0; k < 4; k++) { const dd = d - k * 0.1; if (dd > 0 && dd < 1.4) ringFx(V3(0, c.y, PUR.z0 + PUR.v * dd), 2 + dd * 3, k % 2 ? 0x7a30ff : 0xff70d0, 0.7 * (1 - clamp(dd / 1.4)), 'z'); }
    ringFx(V3(0, 0.3, PUR.z0 + 3), 18 * easeOut(clamp(d / 0.7)), 0xffffff, 0.9 * (1 - clamp(d / 0.7)), 'y');
    flashW = Math.max(flashW, d < 0.04 ? 0.7 : 0.12 * (1 - clamp(d / 0.6))); shakeAmp = Math.max(shakeAmp, 0.9 * (1 - clamp(d / 1.2))); if (d < 0.02) invert = 1; fxLight.color.set(0xb060ff); fxLight.position.copy(c); fxLight.intensity = 90 * (1 - clamp(d / 2.4)); caBoost = 0.01 * (1 - clamp(d / 0.8));
    const zEnd = Math.min(zf, HZ - 0.1), zS = PUR.z0 - 0.5, wr = 2 * Math.sqrt(Math.max(0, r * r - 2.25)) * 0.95;
    if (zEnd > zS && wr > 0.1) { trench.visible = true; trench.scale.set(wr, 1, zEnd - zS); trench.position.set(0, 0.07, (zEnd + zS) / 2); trenchE.forEach((m, i) => { m.visible = true; m.scale.set(0.22, 1, zEnd - zS); m.position.set((i ? 1 : -1) * wr / 2, 0.075, (zEnd + zS) / 2); m.material.opacity = 0.6 + 0.3 * Math.sin(tvid * 14 + i); }); } }
  { const dh = t - T.hole; if (dh >= 0) { const R = 5.3 * easeOut(clamp(dh / 0.25)); const gl = 0.45 + 0.55 * (1 - clamp(dh / 2.5)); holeF.visible = holeR.visible = holeB.visible = true; holeF.scale.setScalar(R); holeR.scale.setScalar(R * 1.08); holeR.material.opacity = gl; holeB.scale.setScalar(R);
      if (dh < 0.7) { const lf = 1 - dh / 0.7; for (let b = 0; b < 16; b++) { const a = rnd(b * 2.7) * PI * 2, l0 = R * (1.1 + 0.7 * rnd(b * 5.1)), l1 = l0 + (6 + 14 * rnd(b * 3.3)) * easeOut(clamp(dh / 0.2)); const o = V3(0, 1.7, HZ - 1.15); bolt(o.clone().add(V3(Math.cos(a) * l0, Math.sin(a) * l0, 0)), o.clone().add(V3(Math.cos(a) * l1, Math.sin(a) * l1, 0)), { n: 5, jit: 0.5, w: 0.1 * lf + 0.02, color: b % 2 ? 0xffffff : 0xb060ff, seed: frame * 3 + b }); }
        ringFx(V3(0, 1.7, HZ - 1.3), 30 * easeOut(clamp(dh / 0.6)), 0xd0a0ff, 0.8 * (1 - clamp(dh / 0.6)), 'z'); flashW = Math.max(flashW, dh < 0.04 ? 0.6 : 0.15 * lf); shakeAmp = Math.max(shakeAmp, 1.4 * lf); if (dh < 0.02) invert = 1; } } }
}

// ---------- カメラ ----------
function shot(t, tvid) {
  bd = null; if (q.has('cam')) { const c = q.get('cam').split(',').map(Number); camera.position.set(c[0], c[1], c[2]); camera.up.set(0, 1, 0); camera.lookAt(c[3], c[4], c[5]); camera.fov = c[6] || 50; camera.updateProjectionMatrix(); return; }
  let p, l, fov = 50, roll = 0, sh = 0; const gp = G.root.position, sp = S.root.position, gb = bodyOf(G), sb = bodyOf(S), gh = headOf(G), sh2 = headOf(S); const mid = gb.clone().lerp(sb, 0.5);
  if (t < 3.0) { p = V(kf(t, [[0, [3.5, 12, -24]], [3, [0.3, 2.4, -12.0]]], easeOut)); l = V(kf(t, [[0, [0, 1.2, 2]], [3, [0, 1.6, 6]]], easeOut)); fov = kf(t, [[0, 52], [3, 44]], easeOut); sh = 0.01; roll = kf(t, [[0, 0.1], [3, 0]], easeOut); }
  else if (t < 3.45) { p = V3(sp.x - 1.5, 1.7, sp.z - 2.6); l = sh2.clone(); fov = 40; sh = 0.03; roll = 0.06; }
  else if (t < 3.75) { p = V3(1.2, 1.7, -10.6); l = V3(0, 1.3, 1.5); fov = 42; sh = 0.04; roll = -0.05; }
  else if (t < 4.15) { p = V3(1.7, 1.6, -3.1); l = V3(0, 1.4, -5.8); fov = 42; sh = 0.04; roll = 0.08; }
  else if (t < 5.0) { p = V3(2.2, 2.4, -9.8); l = V3(0, 1.4, 1.5); fov = 46; sh = 0.04; roll = -0.05; }
  else if (t < 5.5) { p = V3(-2.5, 1.9, -9.6); l = V3(0, 1.5, -5.0); fov = 38; sh = 0.015; }
  else if (t < 6.4) { p = V3(3.0, 2.0, -10.6); l = V3(0, 1.5, 0.5); fov = 44; sh = 0.04; roll = 0.07; }
  else if (t < 6.95) { p = V3(1.6, 1.5, -8.2); l = V3(0, 1.4, -5.2); fov = 36; sh = 0.01; }
  else if (t < 7.6) { p = V3(5.5, 1.8, -1.5); l = V3(0, 1.3, -3.4); fov = 50; sh = 0.05; roll = -0.1; }
  else if (t < 8.3) { p = V3(7, 2.6, sp.z - 6); l = V3(0, 1.4, sp.z); fov = 50; sh = 0.04; roll = 0.06; }
  else if (t < 9.4) { p = V3(5.2, 1.6, mid.z + 0.3); l = mid.clone(); fov = 50; sh = 0.03; roll = 0.06; }
  else if (t < 10.05) { p = mid.clone().add(V3(-4.2, -0.3, 0.8)); l = mid.clone(); fov = 46; sh = 0.04; roll = -0.1; }
  else if (t < T.tele) { p = V3(5.0, 2.0, mid.z - 3.8); l = mid.clone(); fov = 50; sh = 0.04; roll = 0.06; }
  else if (t < T.reappear) { p = V3(16, 2.6, -3.0); l = V3(0, 1.4, -3.0); fov = 60; sh = 0.2; roll = 0.12; }
  else if (t < 12.3) { const k = clamp((t - T.reappear) / 0.8); p = V3(2.0 - 0.3 * k, 0.3, sp.z + 3.2 - 0.9 * k); l = V3(0, 2.3, -2.0); fov = 50 - 4 * k; sh = 0.02 + 0.2 * clamp((t - T.fire) / 0.15); roll = -0.06; }
  else if (t < 12.62) { const zf = PUR.z0 + PUR.v * (t - T.fire); p = V3(12, 2.2, zf + 1); l = V3(0, 1.8, zf + 5); fov = 46; sh = 0.12; roll = 0.08; }
  else if (t < T.hole) { p = V3(8, 2.2, 10); l = V3(0, 2.2, HZ); fov = 46; sh = 0.08; roll = -0.05; }
  else if (t < 13.9) { const k = clamp((t - T.hole) / 1.0); p = V3(8 + k, 2.2 + 0.8 * k, 12); l = V3(0, 2.8, HZ); fov = 46 - 4 * k; sh = 0.04; roll = -0.05; }
  else if (t < T.dawn) { p = V3(3.2, 3.4, -7.0); l = V3(0, 3.0, HZ); fov = 36; sh = 0.02; }
  else { const e = T.dawn; p = V(kf(t, [[e, [3.2, 3.4, -7]], [END, [0, 95, 5]]], smooth)); l = V(kf(t, [[e, [0, 3, HZ]], [END, [0, 4, 20]]], lin)); fov = 55; sh = 0.01; }
  const total = Math.max(sh, shakeAmp); camera.up.set(0, 1, 0); camera.position.copy(p).add(shake(tvid, total)); camera.lookAt(l);
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
