// 呪術廻戦 二次創作 3Dショートアニメ「八頭、ひとつ分」(非商用ファン作品)
// すべて t(秒) の純関数として描画する(= 同じ t なら必ず同じ絵)。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1280, H = 720;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------- utils ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const rnd = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lin = t => t;
function kf(t, keys, ease = smooth) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      const u = ease(clamp((t - t0) / (t1 - t0)));
      return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], u)) : lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}
const shake = (t, a) => V3(
  (Math.sin(t * 47.3) + Math.sin(t * 31.7 + 1.3)) * 0.5 * a,
  (Math.sin(t * 53.1 + 2.1) + Math.sin(t * 37.9 + 0.4)) * 0.5 * a,
  (Math.sin(t * 41.7 + 4.2)) * 0.5 * a);

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b18);
scene.fog = new THREE.FogExp2(0x0b1226, 0.017);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 300);
scene.add(camera);

// ---------- materials ----------
const gm = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat);
gm.minFilter = gm.magFilter = THREE.NearestFilter; gm.needsUpdate = true;
const toon = (c, extra = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: gm, ...extra });
const outlineMat = th => new THREE.ShaderMaterial({
  side: THREE.BackSide, uniforms: { th: { value: th } },
  vertexShader: 'uniform float th; void main(){ gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*th,1.0);}',
  fragmentShader: 'void main(){gl_FragColor=vec4(0.015,0.0,0.03,1.0);}'
});
function mesh(geo, mat, ol = 0.03) {
  const m = new THREE.Mesh(geo, mat);
  if (ol) m.add(new THREE.Mesh(geo, outlineMat(ol)));
  return m;
}
const glow = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0x6f8fcf, 0x151a30, 1.1));
const moon = new THREE.DirectionalLight(0xb9ccff, 1.6); moon.position.set(-10, 20, 12); scene.add(moon);
const fxLight = new THREE.PointLight(0xff2040, 0, 14, 1.4); scene.add(fxLight);
const thLight = new THREE.PointLight(0x9fd0ff, 0, 18, 1.2); scene.add(thLight);

// ---------- stage ----------
function buildStage() {
  const g = new THREE.Group(); scene.add(g);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), toon(0x27384d));
  ground.rotation.x = -Math.PI / 2; g.add(ground);
  const path = new THREE.Mesh(new THREE.CircleGeometry(9, 40), toon(0x34455c));
  path.rotation.x = -Math.PI / 2; path.position.set(0.5, 0.01, 0.5); g.add(path);
  for (let i = 0; i < 26; i++) { // 瓦礫
    const s = 0.2 + rnd(i * 3.1) * 0.5;
    const r = mesh(new THREE.BoxGeometry(s, s * 0.7, s * 1.2), toon(0x3d4a60), 0.02);
    const a = rnd(i * 7.7) * Math.PI * 2, d = 6 + rnd(i * 5.3) * 8;
    r.position.set(Math.cos(a) * d + 1, s * 0.3, Math.sin(a) * d * 0.7);
    r.rotation.set(rnd(i) * 0.5, rnd(i * 2) * 3, rnd(i * 3) * 0.5); g.add(r);
  }
  // 校舎
  const wall = new THREE.Mesh(new THREE.BoxGeometry(70, 10, 1.2), toon(0x3a4059)); wall.position.set(0, 5, -15); g.add(wall);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(72, 0.8, 2.4), toon(0x252a40)); roof.position.set(0, 10.2, -15); g.add(roof);
  for (let r = 0; r < 2; r++) for (let c = -15; c <= 15; c++) {
    const lit = rnd(c * 9.1 + r * 3.3) > 0.82;
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.1), lit ? glow(0xffd48a) : new THREE.MeshBasicMaterial({ color: 0x0c1222 }));
    w.position.set(c * 2.2, 3.2 + r * 3.8, -14.35); g.add(w);
  }
  // 木のシルエット
  for (let i = 0; i < 14; i++) {
    const x = -34 + i * 5.2 + rnd(i) * 2, z = -11 - rnd(i * 4) * 3;
    for (let k = 0; k < 3; k++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.1 - k * 0.5, 3, 7), new THREE.MeshBasicMaterial({ color: 0x070d17 }));
      cone.position.set(x, 3.5 + k * 1.8, z); g.add(cone);
    }
  }
  // 月と星
  const m = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f0d8, fog: false }));
  m.position.set(-25, 34, -60); g.add(m);
  const sp = []; for (let i = 0; i < 400; i++) {
    const a = rnd(i * 1.7) * Math.PI * 2, e = 0.2 + rnd(i * 2.9) * 1.1;
    sp.push(Math.cos(a) * 120, 25 + Math.sin(e) * 70, Math.sin(a) * 120 - 40);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  g.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, color: 0xffffff, fog: false })));
}
buildStage();

function blobShadow(r) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.03; return m;
}

// ---------- humanoid ----------
function humanoid(o) {
  const P = {}; const root = new THREE.Group(); P.root = root;
  root.add(blobShadow(0.5));
  const hips = new THREE.Group(); hips.position.y = 0.92; root.add(hips); P.hips = hips;
  hips.add(mesh(new THREE.BoxGeometry(0.4, 0.22, 0.24), toon(o.bottom)));
  const torso = new THREE.Group(); torso.position.y = 0.05; hips.add(torso); P.torso = torso;
  const chest = mesh(new THREE.BoxGeometry(0.5, 0.62, 0.28), toon(o.top)); chest.position.y = 0.36; torso.add(chest);
  const collar = mesh(new THREE.BoxGeometry(0.54, 0.1, 0.32), toon(o.accent)); collar.position.y = 0.64; torso.add(collar);
  const head = new THREE.Group(); head.position.y = 0.72; torso.add(head); P.head = head;
  const skull = mesh(new THREE.SphereGeometry(0.19, 16, 12), toon(o.skin)); skull.position.y = 0.2; head.add(skull);
  const hm = toon(o.hair);
  for (let i = 0; i < o.spikes; i++) {
    const a = rnd(i * 2.3 + o.seed) * Math.PI * 2, e = 0.15 + rnd(i * 3.7 + o.seed) * 0.85;
    const dir = V3(Math.cos(a) * (1 - e) * 0.9, e, Math.sin(a) * (1 - e) * 0.9).normalize();
    const c = mesh(new THREE.ConeGeometry(0.075, 0.2 + rnd(i + o.seed) * 0.1, 5), hm, 0.015);
    c.position.copy(dir).multiplyScalar(0.17).add(V3(0, 0.2, 0));
    c.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); head.add(c);
  }
  for (let i = 0; i < 4; i++) { // 前髪
    const c = mesh(new THREE.ConeGeometry(0.06, 0.18, 5), hm, 0.012);
    c.position.set(-0.12 + i * 0.08, 0.33, 0.14); c.rotation.x = Math.PI * 0.8; head.add(c);
  }
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0x10101a }));
    e.position.set(sx * 0.07, 0.2, 0.185); head.add(e);
  }
  function arm(sx) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.33, 0.55, 0); torso.add(sh);
    const up = mesh(new THREE.CapsuleGeometry(0.065, 0.26, 4, 8), toon(o.top)); up.position.y = -0.17; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.34; sh.add(el);
    const fo = mesh(new THREE.CapsuleGeometry(0.058, 0.22, 4, 8), toon(o.skin)); fo.position.y = -0.15; el.add(fo);
    const fist = mesh(new THREE.SphereGeometry(0.085, 10, 8), toon(o.skin)); fist.position.y = -0.33; el.add(fist);
    return { sh, el, fist };
  }
  function leg(sx) {
    const hp = new THREE.Group(); hp.position.set(sx * 0.13, -0.1, 0); hips.add(hp);
    const th = mesh(new THREE.CapsuleGeometry(0.085, 0.3, 4, 8), toon(o.bottom)); th.position.y = -0.2; hp.add(th);
    const kn = new THREE.Group(); kn.position.y = -0.41; hp.add(kn);
    const sn = mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 8), toon(o.bottom)); sn.position.y = -0.2; kn.add(sn);
    const ft = mesh(new THREE.BoxGeometry(0.14, 0.09, 0.28), toon(0x15151f), 0.02); ft.position.set(0, -0.4, 0.06); kn.add(ft);
    return { hp, kn };
  }
  P.R = arm(-1); P.L = arm(1); P.lgR = leg(-1); P.lgL = leg(1);
  scene.add(root); return P;
}
// pose: 前方=+z。腕 fwd>0 で前に上がる、bend>0 で肘が曲がる。
function pose(P, s) {
  const d = (k, v) => s[k] ?? v;
  P.root.position.set(d('x', 0), d('y', 0), d('z', 0));
  P.root.rotation.y = d('yaw', 0);
  P.hips.position.y = 0.92 - d('crouch', 0);
  P.torso.rotation.set(d('lean', 0), d('twist', 0), 0);
  P.head.rotation.x = d('headP', 0);
  const [rf, rb] = d('R', [0.1, 0.2]), [lf, lb] = d('L', [0.1, 0.2]);
  P.R.sh.rotation.set(-rf, 0, -d('Rab', 0.08)); P.R.el.rotation.x = -rb;
  P.L.sh.rotation.set(-lf, 0, d('Lab', 0.08)); P.L.el.rotation.x = -lb;
  const [lr, ll] = d('legs', [0, 0]); // 前に出す量(rad)
  P.lgR.hp.rotation.x = -lr; P.lgR.kn.rotation.x = Math.max(0, -lr) * 1.3 + d('kneeR', 0);
  P.lgL.hp.rotation.x = -ll; P.lgL.kn.rotation.x = Math.max(0, -ll) * 1.3 + d('kneeL', 0);
  P.root.visible = d('vis', true);
}

// ---------- 鵺 ----------
function buildNue() {
  const g = new THREE.Group(); const N = {};
  const body = mesh(new THREE.SphereGeometry(0.45, 14, 10), toon(0x4d5578), 0.03); body.scale.set(1, 0.9, 1.6); g.add(body);
  const head = new THREE.Group(); head.position.set(0, 0.2, 0.75); g.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.28, 12, 10), toon(0xe9e3d2), 0.025));
  const beak = mesh(new THREE.ConeGeometry(0.1, 0.3, 6), toon(0xd9a441), 0.015); beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.04, 0.3); head.add(beak);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glow(0xffe14a)); e.position.set(sx * 0.12, 0.07, 0.2); head.add(e); }
  for (let i = 0; i < 5; i++) { // 背の稲妻の突起
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 4), glow(0xfff08a)); c.position.set((i - 2) * 0.01, 0.4, 0.5 - i * 0.28); c.rotation.x = -0.4; g.add(c);
  }
  for (let i = 0; i < 3; i++) { const t = mesh(new THREE.BoxGeometry(0.12, 0.04, 1.2), toon(0x4d5578), 0.02); t.position.set((i - 1) * 0.22, 0, -1.3); t.rotation.y = (i - 1) * 0.18; g.add(t); }
  N.wings = [];
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.3, 0.2, 0.1); g.add(sh);
    const f1 = mesh(new THREE.BoxGeometry(1.3, 0.05, 0.9), toon(0x3c4366), 0.02); f1.position.x = sx * 0.65; sh.add(f1);
    const el = new THREE.Group(); el.position.x = sx * 1.3; sh.add(el);
    const f2 = mesh(new THREE.BoxGeometry(1.2, 0.05, 0.75), toon(0x59628c), 0.02); f2.position.x = sx * 0.6; el.add(f2);
    const f3 = mesh(new THREE.BoxGeometry(0.7, 0.05, 0.5), toon(0xe9e3d2), 0.02); f3.position.x = sx * 1.5; f3.position.z = -0.1; el.add(f3);
    N.wings.push({ sh, el, sx });
  }
  g.add(blobShadow(0.8)); g.children[g.children.length - 1].visible = false;
  scene.add(g); N.g = g; return N;
}

// ---------- 玉犬・渾(白と黒が合体した大型の式神) ----------
function buildDog() {
  const g = new THREE.Group(); const D = {};
  g.add(blobShadow(1.0));
  const body = mesh(new THREE.SphereGeometry(0.5, 14, 10), toon(0xf1f1f6), 0.03); body.position.y = 1.0; body.scale.set(0.9, 0.85, 1.7); g.add(body);
  const patch = mesh(new THREE.SphereGeometry(0.5, 14, 10), toon(0x15151f), 0.0); patch.position.set(0, 1.04, -0.3); patch.scale.set(0.95, 0.88, 1.0); g.add(patch);
  const head = new THREE.Group(); head.position.set(0, 1.35, 0.85); g.add(head); D.head = head;
  head.add(mesh(new THREE.SphereGeometry(0.33, 12, 10), toon(0xf1f1f6), 0.03));
  const snout = mesh(new THREE.BoxGeometry(0.3, 0.24, 0.45), toon(0xf1f1f6), 0.02); snout.position.set(0, -0.08, 0.38); head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0x050508 })); nose.position.set(0, -0.0, 0.62); head.add(nose);
  for (const sx of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.13, 0.36, 5), toon(0x15151f), 0.02); ear.position.set(sx * 0.2, 0.34, -0.02); ear.rotation.z = -sx * 0.3; head.add(ear);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), glow(0xffd23a)); e.position.set(sx * 0.14, 0.1, 0.28); head.add(e);
  }
  const tail = mesh(new THREE.CapsuleGeometry(0.07, 0.6, 4, 6), toon(0x15151f), 0.02); tail.position.set(0, 1.25, -1.05); tail.rotation.x = -0.9; g.add(tail);
  D.legs = [];
  for (const [sx, sz] of [[-1, 0.6], [1, 0.6], [-1, -0.6], [1, -0.6]]) {
    const hp = new THREE.Group(); hp.position.set(sx * 0.28, 0.85, sz); g.add(hp);
    const l = mesh(new THREE.CapsuleGeometry(0.1, 0.55, 4, 8), toon(sz > 0 ? 0xf1f1f6 : 0x15151f), 0.025); l.position.y = -0.4; hp.add(l);
    D.legs.push(hp);
  }
  scene.add(g); D.g = g; return D;
}

// ---------- ヤマタノオロチ型の呪霊(首3本) ----------
const OB = V3(5, 0, 0); // 本体の中心
const NECKS = [
  { z: -1.5, reach: 3.3, H: 4.6, ph: 0.0, eye: 0xff2a3a },
  { z: 0.0, reach: 3.0, H: 5.7, ph: 2.1, eye: 0xffc820 },
  { z: 1.5, reach: 3.6, H: 4.4, ph: 4.2, eye: 0x35e6ff },
];
const NSEG = 20;
const IMPACT = V3(2.9, 1.3, 0);
const tI = 53.0; // 黒閃のヒット時刻
const O = { necks: [] };
(function buildOrochi() {
  const g = new THREE.Group(); scene.add(g); O.g = g;
  const bodyM = mesh(new THREE.SphereGeometry(1, 20, 14), toon(0x33204f), 0.04); bodyM.scale.set(2.4, 1.5, 2.1); bodyM.position.set(OB.x, 1.0, 0); g.add(bodyM); O.body = bodyM;
  for (let i = 0; i < 6; i++) { const c = mesh(new THREE.ConeGeometry(0.28, 0.9, 5), toon(0x4b2f70), 0.02); c.position.set(OB.x + 0.8 - i * 0.4, 2.45 - Math.abs(i - 2.5) * 0.15, (i % 2 - 0.5) * 1.1); c.rotation.z = 0.1; bodyM.parent.add(c); c.userData.sp = true; }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10), glow(0xff3a5a)); core.position.copy(IMPACT).add(V3(0.1, 0, 0)); g.add(core); O.core = core;
  O.spikes = g.children.filter(c => c.userData.sp);
  O.stripe = [toon(0x3a2458), toon(0x2b1a45)];
  const segG = new THREE.SphereGeometry(1, 12, 9);
  const jawG = new THREE.BoxGeometry(0.5, 0.14, 0.9);
  NECKS.forEach((n, ni) => {
    const segs = [];
    for (let i = 0; i < NSEG; i++) { const m = mesh(segG, O.stripe[i % 2], 0.035); g.add(m); segs.push(m); }
    const head = new THREE.Group(); g.add(head);
    const sk = mesh(new THREE.SphereGeometry(0.5, 14, 10), toon(0x442a66), 0.04); sk.scale.set(0.95, 0.7, 1.35); head.add(sk);
    const sn = mesh(new THREE.BoxGeometry(0.55, 0.3, 0.8), toon(0x3a2458), 0.03); sn.position.set(0, -0.1, 0.85); head.add(sn);
    const jaw = mesh(jawG, toon(0x2b1a45), 0.025); jaw.position.set(0, -0.36, 0.78); head.add(jaw);
    for (const sx of [-1, 1]) {
      const horn = mesh(new THREE.ConeGeometry(0.1, 0.8, 5), toon(0xd9d3c4), 0.02); horn.position.set(sx * 0.3, 0.45, -0.35); horn.rotation.x = -0.9; horn.rotation.z = -sx * 0.25; head.add(horn);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), glow(n.eye)); eye.position.set(sx * 0.33, 0.14, 0.42); head.add(eye); (n.eyes ??= []).push(eye);
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 4), new THREE.MeshBasicMaterial({ color: 0xf2efe6 })); fang.position.set(sx * 0.2, -0.28, 1.15); fang.rotation.x = Math.PI; head.add(fang);
    }
    O.necks.push({ segs, head, jaw, cfg: n });
  });
})();
const tmpA = V3(), tmpB = V3();
function neckPoint(n, u, t, out) {
  const amp = O.amp(t), ph = n.ph;
  let x = OB.x - 0.4 - n.reach * u * u;
  let y = 1.3 + n.H * Math.sin(u * Math.PI * 0.5) - 1.3 * u * u * u;
  let z = n.z + n.z * 0.3 * u + amp * Math.sin(ph + t * 1.6 + u * 3.0) * u * 0.8;
  y += amp * 0.3 * Math.sin(ph + t * 1.2 + u * 2.0) * u;
  const fl = O.flinch(n, t);
  x += fl * 1.3 * u; y -= fl * 0.9 * u;
  return out.set(x, y, z);
}
O.amp = t => kf(t, [[0, 0.5], [36, 0.5], [38, 1.3], [41, 1.0], [48, 0.6], [52.5, 0.3], [53, 0.1]]);
const STRIKES = [[19.6, 0], [20.6, 1], [21.6, 2], [22.9, 0], [23.8, 1], [24.5, 2]];
const HITS = [[30.6, 2], [33.0, 1], [33.8, 0], [34.6, 1], [35.4, 2]];
O.flinch = (n, t) => {
  const idx = NECKS.indexOf(n); let f = 0;
  for (const [ts, i] of [...STRIKES, ...HITS]) if (i === idx && t > ts) { const d = t - ts; f += 0.8 * Math.exp(-d * 3.5) * Math.cos(d * 14); }
  return f;
};
function updateOrochi(t) {
  const dtI = t - tI;
  // 本体
  const bodyS = dtI < 1.5 ? 1 : 1 - smooth(clamp((dtI - 1.5) / 3.2));
  const bs = Math.max(bodyS, 0.0001);
  O.body.scale.set(2.4 * bs, 1.5 * bs, 2.1 * bs);
  O.body.position.y = 1.0 * bs + (1 - bs) * 0.2;
  const quake = dtI > 0 && dtI < 3 ? shake(t, 0.05 * (dtI < 1 ? 1 : bs)) : V3();
  O.body.position.add(quake);
  O.spikes.forEach(s => s.scale.setScalar(bs));
  const open = smooth(clamp((t - 39) / 2));
  O.core.visible = dtI < 0.02 && bs > 0.2;
  O.core.scale.setScalar(0.5 + 0.5 * open + 0.08 * Math.sin(t * 9));
  O.necks.forEach((N, ni) => {
    const n = N.cfg;
    const tdBase = tI + 0.45 + ni * 0.25;
    // 首の各節
    for (let i = 0; i < NSEG; i++) {
      const u = i / (NSEG - 1);
      const td = tdBase + (NSEG - 1 - i) * 0.03; // 先端から崩れる
      const tt = Math.min(t, td);
      neckPoint(n, u, tt, tmpA);
      const r = lerp(0.46, 0.27, u);
      let sc = r;
      if (t > td) {
        const tau = t - td, k = ni * 20 + i;
        tmpA.x += (rnd(k * 1.3) - 0.5) * 3 * tau + 0.5 * tau;
        tmpA.z += (rnd(k * 2.1) - 0.5) * 3 * tau;
        tmpA.y = Math.max(0.25, tmpA.y + (rnd(k * 3.7) * 2.2) * tau - 4.0 * tau * tau);
        sc = r * (1 - smooth(clamp((tau - 0.3) / 2.6)));
      }
      N.segs[i].position.copy(tmpA); N.segs[i].scale.setScalar(Math.max(sc, 0.0001));
    }
    // 頭
    const tdH = tdBase + 0.0, tth = Math.min(t, tdH);
    neckPoint(n, 1.0, tth, tmpA); neckPoint(n, 0.97, tth, tmpB);
    const tan = tmpA.clone().sub(tmpB).normalize();
    // 頭は先端の少し先へ。向きは進行方向からやや下(敵=虎杖を見る)
    N.head.position.copy(tmpA).addScaledVector(tan, 0.35);
    N.head.lookAt(N.head.position.clone().add(tan).add(V3(-0.2, -0.55, 0)));
    N.jaw.rotation.x = 0.15 + 0.2 * Math.sin(t * 2 + n.ph) + (t > tdH - 0.1 && t < tdH + 0.3 ? 0.5 : 0);
    let hs = 1;
    if (t > tdH) { const tau = t - tdH; N.head.position.x += 0.5 * tau + (rnd(ni + 9) - 0.5) * 2 * tau; N.head.position.y = Math.max(0.4, N.head.position.y - 4.0 * tau * tau + 1.5 * tau); hs = 1 - smooth(clamp((tau - 0.3) / 2.6)); N.head.rotation.z += tau * 2; }
    N.head.scale.setScalar(Math.max(hs, 0.0001));
    n.eyes.forEach(e => { e.scale.setScalar(1 + 0.3 * Math.sin(t * 6 + n.ph)); });
  });
}

// ---------- 雷・黒閃のエフェクト用 ----------
class Bolts {
  constructor(n = 320) {
    this.pool = []; const g = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); m.visible = false; m.frustumCulled = false; scene.add(m); this.pool.push(m); }
    this.i = 0; this.ax = V3(1, 0, 0);
  }
  begin() { for (let k = 0; k < this.i; k++) this.pool[k].visible = false; this.i = 0; }
  seg(a, b, w, color) {
    if (this.i >= this.pool.length) return;
    const d = tmpA.subVectors(b, a); const len = d.length(); if (len < 1e-4) return;
    const m = this.pool[this.i++];
    m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(this.ax, d.normalize());
    m.scale.set(len, w, w); m.material.color.set(color); m.visible = true;
  }
  bolt(a, b, { n = 8, jit = 0.3, w = 0.04, color = 0xffffff, seed = 1 }) {
    const dir = b.clone().sub(a).normalize();
    const p1 = dir.clone().cross(Math.abs(dir.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0)).normalize(), p2 = dir.clone().cross(p1);
    let prev = a.clone();
    for (let k = 1; k <= n; k++) {
      const p = a.clone().lerp(b, k / n);
      if (k < n) p.addScaledVector(p1, (rnd(seed * 7.1 + k * 3.3) - 0.5) * jit * 2).addScaledVector(p2, (rnd(seed * 5.3 + k * 1.9) - 0.5) * jit * 2);
      this.seg(prev, p, w, color); prev = p;
    }
  }
}
const bolts = new Bolts();
const dust = []; // 粉塵
{
  const g = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(g, toon(i % 3 ? 0x5a5470 : 0x2a2440, { fog: true })); m.visible = false; scene.add(m); dust.push(m); }
}
// 黒い球(黒閃の核)と赤い縁
const bfBlack = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthWrite: false }));
const bfRed = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0xff1030, side: THREE.BackSide, transparent: true, toneMapped: false, depthWrite: false }));
bfBlack.visible = bfRed.visible = false; scene.add(bfBlack, bfRed);

// ---------- キャラクター ----------
const yuji = humanoid({ skin: 0xf0c9a2, hair: 0xe0788c, top: 0x1d2c52, bottom: 0x1d2c52, accent: 0xb3283a, spikes: 26, seed: 1 });
const megumi = humanoid({ skin: 0xefc9a8, hair: 0x1a1b2c, top: 0x232f50, bottom: 0x232f50, accent: 0x6b7aa8, spikes: 40, seed: 7 });
const nue = buildNue();
const dog = buildDog();

const YUJI_BASE = { yaw: Math.PI / 2, z: -0.33 };
const GUARD = { R: [0.85, 1.7], L: [0.7, 1.8], Rab: 0.15, Lab: 0.1, crouch: 0.08, lean: 0.08, legs: [-0.25, 0.3], kneeR: 0.2 };
let yujiHold = null; // 黒閃ヒット時の位置(拳がIMPACTに届くよう自動計算)
function yujiPunchPose() { return { R: [1.52, 0.05], L: [0.3, 2.0], Rab: 0.0, Lab: 0.3, crouch: 0.32, lean: 0.5, twist: -0.25, legs: [-0.7, 0.55], kneeR: 0.15, kneeL: 0.5, ...YUJI_BASE }; }
function solveYujiHold() {
  let x = 1.5, z = YUJI_BASE.z, y = 0;
  for (let k = 0; k < 6; k++) {
    pose(yuji, { ...yujiPunchPose(), x, y, z });
    yuji.root.updateMatrixWorld(true);
    const f = yuji.R.fist.getWorldPosition(V3());
    x += IMPACT.x - f.x; y += IMPACT.y - f.y; z += IMPACT.z - f.z;
  }
  return { x, y, z };
}
yujiHold = solveYujiHold();

function updateYuji(t) {
  const hx = yujiHold.x, hy = yujiHold.y, hz = yujiHold.z;
  const x = kf(t, [[0, -1.8], [42, -1.8], [47, -1.0], [51.5, -0.8], [53.0, hx], [57, hx], [63, hx - 0.5]]);
  const z = kf(t, [[0, YUJI_BASE.z], [51.5, YUJI_BASE.z], [53.0, hz], [57, hz], [63, YUJI_BASE.z]]);
  const y = kf(t, [[51.5, 0], [53, hy], [57, hy], [62, 0]]);
  const punch = smooth(clamp((t - 52.2) / 0.7)) * (1 - smooth(clamp((t - 57) / 3)));
  const coil = smooth(clamp((t - 42) / 6));
  const bob = Math.sin(t * 2.2) * 0.02;
  const R = kf(t, [[0, GUARD.R], [42, GUARD.R], [48, [-0.55, 1.25]], [52.2, [-0.55, 1.25]], [52.9, [1.52, 0.05]], [57, [1.52, 0.05]], [61, [0.7, 1.5]]]);
  const L = kf(t, [[0, GUARD.L], [48, [0.9, 1.6]], [52.2, [0.9, 1.6]], [52.9, [0.3, 2.0]], [57, [0.3, 2.0]], [61, GUARD.L]]);
  const lean = kf(t, [[0, 0.08], [48, -0.18], [52.2, -0.18], [52.9, 0.5], [57, 0.5], [61, 0.1]]);
  const crouch = kf(t, [[0, 0.08], [48, 0.22], [52.2, 0.22], [52.9, 0.32], [57, 0.32], [61, 0.08]]);
  const twist = kf(t, [[48, 0.3], [52.2, 0.3], [52.9, -0.25], [57, -0.25], [61, 0]]);
  pose(yuji, { ...YUJI_BASE, x, y, z, R, L, lean, crouch: crouch + bob, twist, Rab: 0.1, Lab: 0.15, legs: [lerp(-0.25, -0.7, punch), lerp(0.3, 0.55, punch)], kneeR: 0.2, kneeL: lerp(0, 0.5, punch) });
  yuji.root.updateMatrixWorld(true);
}
function updateMegumi(t) {
  const dash = kf(t, [[30.5, 0], [32.2, 1], [36.6, 1], [38.8, 0]]);
  const x = lerp(-3.2, 2.4, dash) + (t > 45 ? -0.2 : 0), z = lerp(1.7, 2.2, dash);
  const sign = smooth(clamp((t - 14) / 0.7)) * (1 - smooth(clamp((t - 18.5) / 0.7)));
  // 打撃: 33〜36 で左右交互の突き
  let R = [0.9, 1.8], L = [0.8, 1.9];
  if (t > 33 && t < 36.4) {
    const ph = (t - 33) * 2.2; const a = Math.sin(ph * Math.PI), b = Math.sin((ph + 0.5) * Math.PI);
    R = [0.9 + 0.65 * Math.max(0, a), 1.8 - 1.7 * Math.max(0, a)]; L = [0.8 + 0.7 * Math.max(0, b), 1.9 - 1.8 * Math.max(0, b)];
  }
  R = [lerp(R[0], 1.2, sign), lerp(R[1], 1.0, sign)]; L = [lerp(L[0], 1.2, sign), lerp(L[1], 1.0, sign)];
  pose(megumi, { x, z, yaw: Math.PI / 2 - 0.1, R, L, Rab: lerp(0.15, -0.3, sign), Lab: lerp(0.15, -0.3, sign), lean: 0.12 + dash * 0.1, crouch: 0.1, legs: [-0.3 - dash * 0.3, 0.3 + dash * 0.2], kneeR: 0.3 });
}
function updateNue(t) {
  const g = nue.g;
  g.visible = t > 15.0;
  const sp = smooth(clamp((t - 15) / 1.2));
  const a = (t - 19) * 0.5;
  const orbit = smooth(clamp((t - 25) / 4));
  const hover = V3(0.3, 7.2, 0.2);
  const spawn = V3(-3.4, 1.8, 2.2);
  const rise = smooth(clamp((t - 16) / 3));
  const orb = V3(5 * Math.cos(a), 7.4 + 0.6 * Math.sin(2 * a), 4 * Math.sin(a));
  const base = spawn.clone().lerp(hover, rise);
  g.position.copy(base).lerp(orb, orbit);
  const v = V3(-Math.sin(a), 0, Math.cos(a) * 0.8);
  const yaw = orbit > 0.5 ? Math.atan2(v.x, v.z) : Math.PI / 2;
  g.rotation.y = yaw; g.rotation.z = orbit * -0.25;
  g.scale.setScalar(Math.max(sp, 0.0001) * 1.2);
  const flap = Math.sin(t * 9) * 0.5 + 0.2;
  nue.wings.forEach(w => { w.sh.rotation.z = w.sx * flap; w.el.rotation.z = w.sx * flap * 0.6; });
}
function updateDog(t) {
  const g = dog.g;
  g.visible = t > 25 && t < 99;
  const run1 = clamp((t - 25.2) / 4.8);          // 突進
  const back = clamp((t - 36.5) / 3.0);          // 退く
  let x, z, yaw;
  if (t < 30) { x = lerp(-3.6, 1.9, smooth(run1)); z = lerp(1.0, -0.9, smooth(run1)); yaw = Math.PI / 2 - 0.1; }
  else if (t < 36.5) { x = 1.9 + Math.sin((t - 30) * 3) * 0.1; z = -0.9; yaw = Math.PI / 2 - 0.05; }
  else { x = lerp(1.9, -1.9, smooth(back)); z = lerp(-0.9, 3.0, smooth(back)); yaw = lerp(Math.PI / 2 - 0.05, Math.PI / 2 - 0.3, smooth(back)); }
  const moving = (t > 25.2 && t < 30) || (t > 36.5 && t < 39.5);
  const ph = t * 12;
  g.position.set(x, 0, z); g.rotation.y = yaw;
  const bite = t > 30 && t < 36.5;
  const sp = smooth(clamp((t - 25) / 0.4));
  g.scale.setScalar(Math.max(sp, 0.0001));
  const jump = bite ? Math.max(0, Math.sin((t - 30) * 5)) * 0.7 : 0;
  g.position.y = jump + (moving ? Math.abs(Math.sin(ph)) * 0.15 : 0);
  dog.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(ph + (i % 2) * Math.PI + (i > 1 ? 0.8 : 0)) * 0.7 : 0; });
  dog.head.rotation.x = bite ? -0.4 + 0.25 * Math.sin(t * 14) : 0;
  dog.head.position.y = 1.35 + (bite ? 0.2 : 0);
}

// ---------- 演出(雷・黒閃・粉塵) ----------
function headPos(ni, t) {
  const N = O.necks[ni]; return N.head.position.clone();
}
let flashW = 0; // 画面の白フラッシュ
function updateFx(t) {
  bolts.begin(); flashW = 0; thLight.intensity = 0; fxLight.intensity = 0;
  const frame = Math.floor(t * 24);
  // --- 鵺の雷 ---
  for (const [ts, ni] of STRIKES) {
    const d = t - ts; if (d < 0 || d > 0.5) continue;
    const hp = headPos(ni, t), from = nue.g.position.clone();
    const life = 1 - d / 0.5;
    for (let b = 0; b < 3; b++) {
      bolts.bolt(from, hp, { n: 9, jit: 0.5 * life + 0.15, w: 0.07 * (1 + life) , color: b === 0 ? 0xffffff : 0x8fc8ff, seed: frame * 3 + b + ni * 17 });
    }
    for (let b = 0; b < 5; b++) { // 枝
      const e = hp.clone().add(V3((rnd(frame + b) - 0.5) * 3, (rnd(frame * 2 + b) - 0.5) * 2, (rnd(frame * 3 + b) - 0.5) * 3));
      bolts.bolt(hp, e, { n: 4, jit: 0.2, w: 0.03, color: 0xbfe0ff, seed: frame * 11 + b });
    }
    flashW = Math.max(flashW, d < 0.12 ? 0.35 : 0.08 * life);
    thLight.position.copy(hp); thLight.intensity = 90 * life;
  }
  // --- 鵺の体表のスパーク ---
  if (t > 17) for (let b = 0; b < 3; b++) {
    const c = nue.g.position.clone(); const e = c.clone().add(V3((rnd(frame + b * 5) - 0.5) * 2.5, (rnd(frame * 2 + b) - 0.5) * 1.2, (rnd(frame * 3 + b * 2) - 0.5) * 2.5));
    bolts.bolt(c, e, { n: 3, jit: 0.15, w: 0.025, color: 0xfff08a, seed: frame * 5 + b });
  }
  // --- 伏黒/玉犬のヒット火花 ---
  for (const [ts] of HITS) {
    const d = t - ts; if (d < 0 || d > 0.18) continue;
    const c = V3(3.2, 1.2 + rnd(ts) * 0.8, 1.6 + rnd(ts * 2) * 0.6);
    for (let b = 0; b < 6; b++) {
      const e = c.clone().add(V3((rnd(b + ts) - 0.5) * 1.6, (rnd(b * 2 + ts) - 0.2) * 1.2, (rnd(b * 3 + ts) - 0.5) * 1.6));
      bolts.bolt(c, e, { n: 2, jit: 0.1, w: 0.03, color: 0xffffff, seed: b + ts });
    }
  }
  // --- 虎杖の拳の黒い火花(チャージ) ---
  if (t > 43.5 && t < tI + 0.6) {
    const charge = smooth(clamp((t - 43.5) / 9));
    const fist = yuji.R.fist.getWorldPosition(V3());
    const n = Math.floor(2 + charge * 9);
    for (let b = 0; b < n; b++) {
      const e = fist.clone().add(V3((rnd(frame * 3 + b) - 0.5), (rnd(frame * 5 + b) - 0.5), (rnd(frame * 7 + b) - 0.5)).normalize().multiplyScalar(0.25 + charge * 0.5 * rnd(b + frame)));
      bolts.bolt(fist, e, { n: 3, jit: 0.1, w: 0.03 + charge * 0.02, color: 0xff1a38, seed: frame * 9 + b });
      bolts.bolt(fist, e, { n: 3, jit: 0.1, w: 0.014, color: 0x000000, seed: frame * 9 + b });
    }
    fxLight.position.copy(fist).add(V3(0.2, 0.1, 0.3)); fxLight.intensity = 1.2 * charge;
  }
  // --- 黒閃 ---
  const d = t - tI;
  bfBlack.visible = bfRed.visible = false;
  if (d >= 0 && d < 1.2) {
    const r = 0.25 + 1.25 * easeOut(clamp(d / 0.35));
    const op = 1 - smooth(clamp((d - 0.35) / 0.6));
    bfBlack.position.copy(IMPACT); bfBlack.scale.setScalar(r); bfBlack.material.opacity = op * 0.92; bfBlack.visible = true;
    bfRed.position.copy(IMPACT); bfRed.scale.setScalar(r * 1.07); bfRed.material.opacity = op; bfRed.visible = true;
    const life = 1 - clamp(d / 0.9);
    for (let b = 0; b < 16; b++) {
      const a = rnd(b * 1.7) * Math.PI * 2, e = (rnd(b * 2.9) - 0.5) * 2.2;
      const dir = V3(Math.cos(a) * Math.cos(e) * -0.6 - 0.2, Math.sin(e) * 0.9, Math.sin(a) * Math.cos(e)).normalize();
      const len = (1.2 + rnd(b * 4.1) * 4.0) * easeOut(clamp(d / 0.25));
      const to = IMPACT.clone().addScaledVector(dir, len);
      const seed = b * 13 + Math.floor(t * 24);
      bolts.bolt(IMPACT, to, { n: 7, jit: 0.35, w: 0.12 * life + 0.02, color: 0xff1030, seed });
      bolts.bolt(IMPACT, to, { n: 7, jit: 0.35, w: 0.05 * life + 0.01, color: 0x000000, seed });
    }
    fxLight.position.copy(IMPACT); fxLight.intensity = 45 * Math.max(0, 1 - d * 2.2);
    flashW = Math.max(flashW, d < 0.06 ? 0.9 : 0);
  }
  // --- 粉塵・破片 ---
  dust.forEach((m, i) => {
    if (d < 0.1) { m.visible = false; return; }
    const tau = d - 0.1, a = rnd(i * 1.3) * Math.PI * 2, sp = 2 + rnd(i * 2.7) * 6;
    const p = IMPACT.clone().add(V3(0.2, -0.3, 0));
    const vx = Math.cos(a) * sp * 0.8 - 1.2, vz = Math.sin(a) * sp, vy = 1 + rnd(i * 4.4) * 5;
    p.x += vx * tau; p.z += vz * tau; p.y += vy * tau - 5 * tau * tau;
    if (p.y < 0.1) { p.y = 0.1; }
    const s = (0.1 + rnd(i * 6.1) * 0.35) * (1 - smooth(clamp((tau - 0.8) / 2.5)));
    m.position.copy(p); m.scale.setScalar(Math.max(s, 0.0001)); m.rotation.set(tau * 4 + i, tau * 3, i); m.visible = s > 0.002 && d < 5;
  });
}

// ---------- カメラ(カットごと) ----------
const lookTarget = V3();
const V = (a) => V3(a[0], a[1], a[2]);
function cameraAt(t) {
  let p, l, fov = 40, sh = 0;
  const yh = yuji.R.fist.getWorldPosition(V3());
  const yHead = yuji.head.getWorldPosition(V3());
  const mHead = megumi.head.getWorldPosition(V3());
  if (t < 5) { p = V(kf(t, [[0, [-12, 2.4, 10]], [5, [-8.5, 2.1, 7]]], lin)); l = V3(2, 3, 0); fov = 40; }
  else if (t < 10) { p = V(kf(t, [[5, [-1, 0.4, 5]], [10, [0.5, 0.5, 4.5]]], lin)); l = V(kf(t, [[5, [5, 2.5, 0]], [10, [4.5, 5.5, 0]]], lin)); fov = 52; }
  else if (t < 14) { p = V(kf(t, [[10, [-6.5, 1.8, 3.5]], [14, [-5.6, 1.7, 3.0]]], lin)); l = V3(2, 2.6, 0); fov = 36; }
  else if (t < 19) { p = V(kf(t, [[14, [-2.4, 1.4, 4.2]], [16, [-2.6, 1.4, 3.9]], [19, [-1.8, 1.2, 3.6]]], lin)); l = V(kf(t, [[14, [-3.2, 1.3, 2.0]], [16.5, [-3.2, 1.6, 2.0]], [19, [0, 6.5, 0]]])); fov = 38; }
  else if (t < 25) { p = V(kf(t, [[19, [-1, 0.6, 3.5]], [25, [0.8, 0.8, 3.2]]], lin)); l = V(kf(t, [[19, [2, 5.0, 0]], [25, [2.4, 5.4, 0]]], lin)); fov = 46; sh = 0.03; }
  else if (t < 31) { p = V(kf(t, [[25, [-4.5, 1.0, 4.0]], [31, [0.2, 1.2, 4.0]]], lin)); l = V(kf(t, [[25, [-2.5, 1.0, 1.5]], [31, [2.6, 1.2, -0.5]]], lin)); fov = 42; sh = 0.02; }
  else if (t < 37) { p = V(kf(t, [[31, [-0.3, 2.0, 5.2]], [37, [0.8, 2.0, 5.4]]], lin)); l = V(kf(t, [[31, [2.4, 1.3, 1.2]], [37, [2.8, 1.4, 1.4]]], lin)); fov = 40; sh = 0.04; }
  else if (t < 42) { p = V(kf(t, [[37, [-1, 9.5, 8]], [42, [-0.8, 8.2, 8.5]]], lin)); l = V3(3, 2.4, 0); fov = 46; }
  else if (t < 45) { // 虎杖の顔
    p = yHead.clone().add(V3(1.25, 0.22, 0.35)); l = yHead.clone().add(V3(0, 0.2, 0)); fov = 26;
    p = p.add(V3(0, 0, 0)); }
  else if (t < 48) { p = yh.clone().add(V3(0.55, 0.25, 1.0)); l = yh.clone(); fov = 32; }
  else if (t < 52) { p = V(kf(t, [[48, [-0.6, 1.2, 4.4]], [52, [0.9, 1.2, 4.0]]], lin)); l = V(kf(t, [[48, [0.4, 1.1, 0]], [52, [1.4, 1.1, 0]]], lin)); fov = 36; }
  else if (t < 55) {
    const dd = t - tI;
    p = IMPACT.clone().add(V(kf(t, [[52, [-2.9, 0.7, 3.0]], [53, [-2.5, 0.5, 2.6]], [55, [-2.2, 0.4, 2.3]]], lin)));
    l = IMPACT.clone().add(V3(-0.2, 0, 0)); fov = 34;
    sh = dd > 0 && dd < 0.6 ? 0.22 * (1 - dd / 0.6) : 0.006;
  }
  else if (t < 63) { p = V(kf(t, [[55, [1.4, 1.5, 2.4]], [56.2, [-5, 2.6, 8]], [63, [-7, 3.2, 9.5]]], easeOut)); l = V(kf(t, [[55, [3.0, 1.4, 0]], [58, [4, 2.8, 0]]])); fov = 40; sh = t < 56 ? 0.1 * (56 - t) : 0; }
  else if (t < 70) { p = V(kf(t, [[63, [-1, 10, 4]], [70, [-1, 5.2, 4.6]]], lin)); l = V(kf(t, [[63, [-1, 0, 1]], [70, [-0.5, 1.2, 1]]], lin)); fov = 44; }
  else { p = V3(0, -500, 0); l = V3(0, -501, 1); fov = 40; }
  camera.position.copy(p).add(shake(t, sh)); camera.lookAt(l); camera.fov = fov; camera.updateProjectionMatrix();
  return { p, l };
}

// ---------- タイトル ----------
const titleCv = document.createElement('canvas'); titleCv.width = 1600; titleCv.height = 400;
{
  const c = titleCv.getContext('2d');
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '900 190px "IPAGothic","Noto Sans CJK JP",sans-serif';
  c.shadowColor = '#ff1030'; c.shadowBlur = 40; c.fillStyle = '#ff2a45'; c.fillText('八頭、ひとつ分', 800, 190);
  c.shadowBlur = 0; c.font = '40px "IPAGothic",sans-serif'; c.fillStyle = '#cfcfd8'; c.fillText('呪術廻戦 二次創作 3Dアニメ(非商用)', 800, 350);
}
const titleTex = new THREE.CanvasTexture(titleCv); titleTex.colorSpace = THREE.SRGBColorSpace;
const titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.3125), new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, depthTest: false, toneMapped: false, fog: false }));
titleMesh.position.set(0, 0, -1.0); titleMesh.renderOrder = 999; titleMesh.visible = false; camera.add(titleMesh);

// ---------- ポストプロセス ----------
const composer = new EffectComposer(renderer);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.5, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const post = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uSat: { value: 1 }, uFlash: { value: 0 }, uInv: { value: 0 }, uFade: { value: 0 }, uCA: { value: 0.0008 }, uAsp: { value: W / H }, uC: { value: new THREE.Vector2(.5, .5) }, uR: { value: 0 }, uStr: { value: 0 }, uVig: { value: 0.5 } },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uSat,uFlash,uInv,uFade,uCA,uAsp,uR,uStr,uVig; uniform vec2 uC; varying vec2 vUv;
  void main(){
    vec2 uv=vUv; vec2 d=uv-uC; d.x*=uAsp; float r=length(d);
    float ring=exp(-pow((r-uR)/0.09,2.0))*uStr;
    vec2 dir=normalize(d+1e-5); dir.x/=uAsp;
    uv+=dir*ring*0.07;
    vec2 ca=dir*(uCA+ring*0.01)*(0.5+r);
    vec3 col; col.r=texture2D(tDiffuse,uv+ca).r; col.g=texture2D(tDiffuse,uv).g; col.b=texture2D(tDiffuse,uv-ca).b;
    float l=dot(col,vec3(.299,.587,.114)); col=mix(vec3(l),col,uSat);
    col=mix(col,vec3(1.0-l*1.1),uInv);
    col+=uFlash;
    float v=1.0-smoothstep(0.45,1.05,length((vUv-.5)*vec2(1.0,.85)));
    col*=mix(1.0,v,uVig);
    col*=1.0-uFade;
    gl_FragColor=vec4(col,1.0);
  }`
});
composer.addPass(post);

function updatePost(t, camInfo) {
  const u = post.uniforms, d = t - tI;
  // 彩度: 溜め(42〜52.5)で落とし、黒閃で戻す
  u.uSat.value = kf(t, [[41.5, 1], [44, 0.15], [52.8, 0.1], [53.05, 1.0], [54.5, 1]]);
  u.uInv.value = d >= 0 && d < 0.09 ? 1 : 0;
  u.uFlash.value = flashW * (d >= 0 && d < 0.09 ? 0 : 1);
  u.uFade.value = kf(t, [[0, 1], [0.8, 0], [68.8, 0], [70.4, 1], [70.8, 1], [71.8, 0], [73.8, 0], [75, 1]], lin);
  // 衝撃波
  if (d >= 0 && d < 1.0) {
    const sp = IMPACT.clone().project(camera);
    u.uC.value.set(sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5);
    u.uR.value = d * 1.4; u.uStr.value = 1.2 * (1 - clamp(d / 0.8)); u.uCA.value = 0.0008 + 0.012 * (1 - clamp(d / 0.6));
  } else { u.uStr.value = 0; u.uCA.value = 0.0008; }
  // 雷の瞬間は少し色収差
  for (const [ts] of STRIKES) if (t - ts > 0 && t - ts < 0.15) u.uCA.value = 0.004;
  u.uVig.value = 0.55;
  bloom.strength = 0.55 + (d >= 0 && d < 0.5 ? 0.7 * (1 - d * 2) : 0);
}

// ---------- 1フレーム描画 ----------
function renderAt(t) {
  updateOrochi(t); updateMegumi(t); updateYuji(t); updateNue(t); updateDog(t);
  // 頭の位置はOrochi更新後に必要
  const info = cameraAt(t);
  updateFx(t);
  const ttl = t >= 70.8; titleMesh.visible = ttl;
  scene.background.set(ttl ? 0x000000 : 0x070b18);
  updatePost(t, info);
  composer.render();
}
window.renderAt = renderAt;
window.frameDataURL = () => renderer.domElement.toDataURL('image/jpeg', 0.95);
window.READY = true;

// ブラウザで直接開いたときのプレビュー(?t=秒 で静止、なければ再生)
const q = new URLSearchParams(location.search);
if (q.has('t')) renderAt(parseFloat(q.get('t')));
else if (!q.has('render')) {
  const t0 = parseFloat(q.get('from') ?? '0'); const s = performance.now();
  const hud = document.getElementById('hud');
  (function loop() { const t = t0 + (performance.now() - s) / 1000; renderAt(t); hud.textContent = t.toFixed(2) + 's'; requestAnimationFrame(loop); })();
}
