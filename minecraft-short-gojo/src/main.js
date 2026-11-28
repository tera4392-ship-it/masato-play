// もしも五条悟とモジュロ虎杖が戦ったら(マイクラ風・縦型ショート 約60秒・字幕/ライフなし)
// 演出はアニメ時間 τ で記述し、スピードランプ(WARP)で映像時間に変換する。非商用のファン作品。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeYuji, makeGojo, makeLimb, addWhiteEyes, addHands, setHand, makeSpear, setPose, setTint, worldOf, PX } from './chars.js';
import { buildWorld } from './world.js';
import { T, PUR, tau, VID_DUR, END } from './timeline.js';

const q = new URLSearchParams(location.search);
const SC = parseFloat(q.get('s') ?? '1');
const W = Math.round(1080 * SC), H = Math.round(1920 * SC);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
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
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 700); scene.add(camera);
const hemi = new THREE.HemisphereLight(0x9aa8ff, 0x302a40, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffc890, 1.6); sun.position.set(-12, 40, 20); scene.add(sun);
const fxLight = new THREE.PointLight(0xffffff, 0, 30, 1.3); scene.add(fxLight);
const out2d = document.createElement('canvas'); out2d.width = W; out2d.height = H; document.body.appendChild(out2d);
const ctx2 = out2d.getContext('2d');
const BOX = new THREE.BoxGeometry(1, 1, 1);
const bas = (c, extra = {}) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...extra });

const WORLD = buildWorld(scene); const ENV = WORLD.env;
function setEnv(k) {
  for (const n in ENV) ENV[n].g.visible = n === k;
  if (!k) { scene.fog = null; return; }
  const e = ENV[k]; scene.fog = new THREE.Fog(e.fog[0], e.fog[1], e.fog[2]);
  hemi.color.set(e.hemi[0]); hemi.groundColor.set(e.hemi[1]); hemi.intensity = e.hemi[2]; sun.color.set(e.sun[0]); sun.intensity = e.sun[1];
}

// ---------- キャラクター ----------
const G = makeGojo(scene), Y = makeYuji(scene);
addWhiteEyes(Y); addHands(G); addHands(Y);
const ghostsG = [0, 1, 2].map(() => makeGojo(scene)), ghostsY = [0, 1, 2].map(() => makeYuji(scene));
[[ghostsG, 0x60b0ff], [ghostsY, 0xff3040]].forEach(([arr, col]) => arr.forEach((c, i) => { c.root.visible = false; c.shadow.visible = false; c.mats.forEach(m => { m.transparent = true; m.opacity = [0.4, 0.25, 0.14][i]; m.depthWrite = false; m.color.set(col); m.emissive.set(col); m.emissiveIntensity = 0.5; }); }));
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(9, 14), new THREE.MeshBasicMaterial({ color: 0x03040a })); backdrop.visible = false; scene.add(backdrop); let bdOn = false;
const handLight = new THREE.PointLight(0xdfeaff, 0, 6, 1.5); scene.add(handLight);
const auraY = makeYuji(scene); auraY.mats.forEach(m => { m.transparent = true; m.opacity = 0.5; m.depthWrite = false; m.blending = THREE.AdditiveBlending; m.color.set(0xffe8a0); m.emissive.set(0xffd060); }); auraY.root.visible = false; auraY.shadow.visible = false; // 領域展延(体を包む光)
const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false, uniforms: { a: { value: 1 }, time: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: 'uniform float a,time; varying vec3 vN; varying vec3 vP; void main(){ float f=pow(1.0-abs(vN.z),2.4); float g=0.5+0.5*sin(vP.y*22.0+time*3.0)*sin(vP.x*17.0-time*2.0+vP.z*9.0); vec3 c=vec3(1.0,0.92,0.6)*(0.035+f*0.85+g*0.05); gl_FragColor=vec4(c*a,1.0);}' })); dome.visible = false; scene.add(dome); // 新陰流簡易領域
const HZ = 25.0; const HD = 18; // ビルの手前の壁面と奥行き
const HZ_=0; // 貫通されるビルの手前の壁面
const holeF = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.ShaderMaterial({ uniforms: {}, vertexShader: 'varying vec2 vU; void main(){ vU=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'varying vec2 vU; void main(){ float r=length(vU); vec3 c=mix(vec3(0.015,0.0,0.03),vec3(0.45,0.1,0.85),pow(r,4.0)); gl_FragColor=vec4(c,1.0);}' })); holeF.rotation.y = PI; holeF.position.set(0, 1.7, HZ - 1.0);
const holeR = new THREE.Mesh(new THREE.RingGeometry(0.86, 1.0, 40), new THREE.MeshBasicMaterial({ color: 0xb060ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); holeR.rotation.y = PI; holeR.position.set(0, 1.7, HZ - 1.02);
const holeB = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.ShaderMaterial({ uniforms: {}, vertexShader: 'varying vec2 vU; void main(){ vU=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'varying vec2 vU; void main(){ float r=length(vU); vec3 c=mix(vec3(0.015,0.0,0.03),vec3(0.45,0.1,0.85),pow(r,4.0)); gl_FragColor=vec4(c,1.0);}' })); holeB.position.set(0, 1.7, HZ + HD + 0.08);
const trench = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 1), new THREE.MeshBasicMaterial({ color: 0x040006 }));
const trenchE = [0, 1].map(() => new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 1), new THREE.MeshBasicMaterial({ color: 0xa040ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
[holeF, holeR, holeB, trench, ...trenchE].forEach(o => { o.visible = false; scene.add(o); });
const flyingArm = makeLimb(scene, G.paint); const spear = makeSpear(scene);

const PRE = {
  idle: { Rf: .05, Rab: .1, Lf: .05, Lab: .1 },
  guard: { Rf: 1.3, Rab: -.3, Lf: 1.3, Lab: -.3, lean: .25, lr: .4, ll: -.3 },
  crouch: { Rf: -.8, Lf: -.8, lean: .7, lr: .9, ll: .5, headP: -.2 },
  fly: { lean: .9, Rf: -1.3, Lf: -1.3, lr: .6, ll: -.5, flip: .25 },
  up: { Rf: 3.0, Rab: .1, Lf: .1, Lab: .2, lean: -.3, lr: .2, ll: -.2 },
  slashY: { Rf: .3, Rab: .1, Lf: .1, Lab: .2, lean: 1.0, lr: .9, ll: -.7, twist: -.6 },
  aimL: { Lf: 1.57, Lab: 0, Rf: .3, Rab: .4, lean: .15, lr: .3, ll: -.3, headP: -.1 },
  hurt: { lean: -.8, Rf: -.6, Lf: -.6, Rab: .9, Lab: .9, lr: -.5, ll: .3, headP: -.5 },
  landing: { lean: .9, lr: 1.1, ll: .6, Rf: 1.0, Lf: .5, headP: -.2 },
  sealG: { Rf: 1.95, Rab: -.15, Lf: 1.2, Lab: -.35 },
  sealL: { Lf: 1.95, Lab: -.15, Rf: .05, Rab: .1 },
  sealY: { Rf: 1.3, Rab: -.5, Lf: 1.3, Lab: -.5, lean: .1 },
  sealYopen: { Rf: 1.0, Rab: .5, Lf: 1.0, Lab: .5, lean: .1, lr: .3, ll: -.3 },
  strain: { Rf: 1.5, Rab: -.15, Lf: 1.5, Lab: -.15, lean: .15, lr: .2, ll: -.2 },
  windR: { Rf: -1.0, Lf: .5, Lab: .3, lean: -.15, twist: .4, lr: -.4, ll: .4 },
  windL: { Lf: -1.0, Rf: .5, Rab: .3, lean: -.15, twist: -.4, lr: .4, ll: -.4 },
  punchR: { Rf: 1.57, Rab: 0, Lf: .6, Lab: .3, lean: .6, lr: .7, ll: -.6, twist: -.4 },
  punchL: { Lf: 1.57, Lab: 0, Rf: .6, Rab: .3, lean: .6, lr: -.6, ll: .7, twist: .4 },
  lunge: { lean: .9, lr: 1.0, ll: -.8, Rf: 1.0, Lf: -.7 },
  stagger: { lean: -.5, Rf: -.4, Lf: .5, lr: -.4, ll: .4, headP: -.4 },
  kneel: { lr: 1.3, ll: -.5, lean: .35, Rf: .4, Lf: .4, headP: .4 },
  palms: { Rf: 1.57, Rab: -.1, Lf: 1.57, Lab: -.1, lean: .2, lr: .4, ll: -.4 },
  frozen: { Rf: .7, Rab: .6, Lf: .7, Lab: .6, lean: -.1, lr: .3, ll: -.3, headP: -.25 },
  dazed: { lean: -.2, headP: -.3, Rf: .2, Lf: .1, Rab: .45, Lab: .45, lr: .1, ll: -.1 },
  tumble1: { flip: -1.2, lean: -.2, Rf: -.8, Lf: -.8, Rab: .7, Lab: .7, lr: .4, ll: -.3 },
  tumble2: { flip: -3.0, lean: -.2, Rf: -.8, Lf: -.8, Rab: .7, Lab: .7, lr: .4, ll: -.3 },
  tumble3: { flip: -5.0, lean: -.2, Rf: -.8, Lf: -.8, Rab: .7, Lab: .7, lr: .4, ll: -.3 },
  spearL: { Lf: 2.5, Lab: .1, Rf: .05, Rab: .1, lean: -.1, lr: .2, ll: -.2 },
  thrust: { Lf: 1.5, Lab: 0, lean: 1.0, lr: 1.0, ll: -.7, twist: .4 },
  koF: { ko: -1, Rf: .1, Lf: .1, Rab: .4, Lab: .4 },
  iai: { Rf: 1.0, Rab: .3, Lf: .6, Lab: .3, lean: .25, lr: .8, ll: -.8, headP: .1 },
  kick: { lr: 1.5, ll: -.3, lean: -.3, Rf: .9, Lf: .2, Lab: .6 },
  sideL: { lean: .3, twist: .6, Lab: .8, lr: .4, ll: -.4 },
  pulled: { lean: .9, Rf: 1.2, Lf: 1.6, Rab: .6, Lab: .4, lr: .9, ll: .6, headP: -.2 },
  redwind: { Rf: -1.2, Lf: .6, lean: -.25, twist: .5, lr: -.5, ll: .5 },
  flipaim: { flip: 3.14159, Lf: 1.57, Lab: 0, Rf: .4, Rab: .5, lean: .1, lr: .2, ll: -.2 },
};
const POSEK = ['Rf', 'Rab', 'Lf', 'Lab', 'lr', 'll', 'lean', 'twist', 'headP', 'headY', 'ko', 'flip', 'spin', 'roll'];
const DEF = { Rf: .05, Rab: .1, Lf: .05, Lab: .1 };
function compile(keys) {
  let cur = { x: 0, y: 0, z: 0, yaw: 0 };
  return keys.map(k => { const o = k[2] || {}; cur = { x: o.x ?? cur.x, y: o.y ?? cur.y, z: o.z ?? cur.z, yaw: o.yaw ?? cur.yaw }; const p = { ...DEF, ...PRE[k[1]] };
    for (const n of POSEK) p[n] ??= 0; if (o.flip !== undefined) p.flip = o.flip; if (o.spin !== undefined) p.spin = o.spin; return { t: k[0], p, pos: { ...cur }, snap: o.e === 'snap' }; });
}
function evalActor(keys, t, bob) {
  // 滑らかな曲線補間(Catmull-Rom): キーフレームごとに止まらず、速度が途切れない=ヌルヌル動く。スナップ(瞬間移動)は補間しない。
  let i = 0; while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const s = {};
  const names = [...POSEK, 'x', 'y', 'z', 'yaw'];
  const val = (k, n) => (n === 'x' || n === 'y' || n === 'z' || n === 'yaw') ? k.pos[n] : k.p[n];
  if (a === b || b.snap) { for (const n of names) s[n] = val(a, n); }
  else {
    const h = b.t - a.t, u = clamp((t - a.t) / h), u2 = u * u, u3 = u2 * u; const prev = keys[i - 1], next = keys[i + 2];
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    for (const n of names) {
      const p0 = val(a, n), p1 = val(b, n), sl = (p1 - p0) / h;
      let m0 = (prev && !a.snap) ? (p1 - val(prev, n)) / (b.t - prev.t) : sl;
      let m1 = (next && !next.snap) ? (val(next, n) - p0) / (next.t - a.t) : sl;
      m0 *= 0.85; m1 *= 0.85;
      if (m0 * sl < 0) m0 = 0; if (m1 * sl < 0) m1 = 0; // 反対向きに膨らまない(行き過ぎ防止)
      let v = h00 * p0 + h10 * h * m0 + h01 * p1 + h11 * h * m1; const lo = Math.min(p0, p1), hi = Math.max(p0, p1), ex = 0.18 * (hi - lo);
      s[n] = Math.min(hi + ex, Math.max(lo - ex, v));
    }
  }
  const br = Math.sin(t * 2.4 + bob) * 0.02; s.lean += br; s.Rf += br; s.Lf += br; return s;
}
// 五条(yaw 0, 北側)
const GK = compile([
  [0, 'idle', { x: 0, y: 30, z: -28, yaw: 0 }], [5.6, 'idle'], [5.95, 'crouch'], [6.0, 'crouch'], [6.7, 'fly', { y: 40, z: -17 }], [7.5, 'fly', { y: 34, z: -6 }], [8.2, 'aimL'], [10.6, 'aimL'], [11.6, 'aimL'],
  [12.0, 'hurt', { y: 35, z: -8 }], [12.5, 'tumble1', { y: 34, z: -9 }], [13.2, 'fly', { y: 18, z: -7 }], [13.9, 'landing', { y: 0, z: -4 }], [14.4, 'landing'], [14.5, 'sealG'], [17.6, 'sealG'],
  [17.65, 'strain'], [20.5, 'strain'], [20.8, 'hurt'], [21.4, 'stagger'], [22.0, 'guard'], [22.3, 'hurt'], [22.8, 'stagger'],
  [23.5, 'stagger', { z: -4.0 }], [23.7, 'hurt', { z: -4.7 }], [24.2, 'stagger'], [24.4, 'hurt', { z: -5.4 }], [24.9, 'stagger'], [25.1, 'hurt', { z: -6.1 }], [25.6, 'stagger'], [25.8, 'hurt', { z: -6.8 }],
  [26.3, 'stagger'], [26.5, 'hurt', { z: -7.4 }], [27.0, 'stagger'], [27.2, 'hurt'], [27.6, 'frozen'], [29.6, 'frozen'], [29.8, 'spearL'], [30.0, 'thrust'], [30.5, 'idle'], [32.9, 'guard'], [33.3, 'windL'], [33.5, 'punchL'], [34.1, 'punchL'], [34.8, 'idle'],
  [36.0, 'idle'], [36.2, 'sealL'], [37.5, 'sealL'], [37.95, 'idle'],
  [38.9, 'idle', { z: -7.4 }], [39.3, 'lunge', { z: -4.0 }], [39.75, 'windR', { z: 1.2 }],
  [39.9, 'punchR', { z: 1.6 }], [40.2, 'guard'], [40.45, 'sideL', { x: -0.5 }], [40.75, 'guard', { x: 0 }],
  [41.0, 'punchL', { z: 1.7 }], [41.3, 'guard'], [41.55, 'windR'], [42.0, 'kick', { z: 1.8 }], [42.3, 'guard'],
  [42.6, 'hurt', { z: 1.0 }], [42.9, 'guard', { z: 1.4 }], [43.2, 'punchR', { z: 1.8 }], [43.45, 'guard'], [43.7, 'punchR', { z: 1.7 }],
  [44.0, 'stagger', { z: 0.2 }], [44.3, 'aimL', { z: -3.0 }], [45.0, 'aimL'], [45.12, 'redwind', { z: -2.8 }], [45.35, 'punchR', { z: -1.75 }], [45.9, 'punchR'], [46.4, 'idle', { z: -3 }],
  [51.0, 'idle'], [51.73, 'idle', { e: 'snap' }], [51.74, 'flipaim', { x: 0, y: 2.6, z: 3.6, yaw: PI, e: 'snap' }], [53.0, 'flipaim'], [53.6, 'landing', { y: 0.2, z: 3.6, yaw: 0 }], [54.4, 'idle', { y: 0 }], [59, 'idle'],
]);
// 虎杖(yaw π, 南側)
const YK = compile([
  [0, 'idle', { x: 0, y: 30, z: 28, yaw: PI }], [4.0, 'guard'], [5.6, 'guard'], [5.95, 'crouch'], [6.0, 'crouch'], [6.7, 'fly', { y: 40, z: 17 }], [7.5, 'fly', { y: 34, z: 6 }], [7.9, 'up'], [10.5, 'up'], [10.6, 'slashY'], [11.0, 'slashY'],
  [12.0, 'hurt', { y: 35, z: 8 }], [12.5, 'tumble1', { y: 34, z: 9 }], [13.2, 'fly', { y: 18, z: 7 }], [13.9, 'landing', { y: 0, z: 4 }], [14.4, 'landing'], [15.5, 'idle'], [15.6, 'sealYopen'], [16.4, 'sealY'], [17.9, 'sealY'], [17.95, 'strain'],
  [19.8, 'strain'], [20.2, 'up'], [20.5, 'slashY'], [21.2, 'idle'], [21.7, 'up'], [22.0, 'slashY'], [22.4, 'lunge', { z: 3 }], [22.9, 'windR', { z: -1.5 }],
  [23.5, 'punchR', { z: -2.7 }], [23.8, 'punchR'], [24.0, 'windL'], [24.2, 'punchL', { z: -3.4 }], [24.5, 'punchL'], [24.7, 'windR'], [24.9, 'punchR', { z: -4.1 }], [25.2, 'punchR'], [25.4, 'windL'], [25.6, 'punchL', { z: -4.8 }],
  [25.9, 'punchL'], [26.0, 'windR'], [26.3, 'punchR', { z: -5.5 }], [26.8, 'punchR'], [27.0, 'palms', { z: -6.1 }], [27.6, 'palms'], [28.4, 'guard'], [29.9, 'guard'], [30.1, 'hurt', { z: -5.4 }], [30.5, 'stagger', { z: -3 }], [31.5, 'guard', { z: -2.5 }],
  [32.5, 'windR'], [33.2, 'lunge', { z: -5.0 }], [33.5, 'punchR', { z: -6.1 }], [33.7, 'tumble1', { z: -5.5, y: 0.8 }], [34.1, 'tumble2', { z: -1, y: 1.6 }], [34.6, 'tumble3', { z: 3, y: 1.2 }], [35.0, 'dazed', { z: 4.2, y: 0 }], [37.6, 'dazed'],
  [37.95, 'iai', { z: 3.6 }], [38.7, 'iai'], [38.85, 'guard'], [39.6, 'guard', { z: 3.1 }],
  [39.9, 'guard', { z: 3.35 }], [40.2, 'guard', { z: 3.1 }], [40.45, 'punchL', { z: 3.0 }], [40.8, 'guard'], [41.0, 'guard', { z: 3.3 }], [41.3, 'windR'],
  [41.5, 'kick', { z: 3.1 }], [41.85, 'guard'], [42.0, 'sideL', { x: 0.4 }], [42.3, 'guard', { x: 0 }], [42.6, 'punchR', { z: 3.0 }], [42.9, 'guard'],
  [43.2, 'stagger', { z: 3.5 }], [43.5, 'guard', { z: 3.2 }], [43.7, 'punchR', { z: 3.2 }], [44.0, 'stagger', { z: 4.4 }], [44.3, 'guard'],
  [44.7, 'pulled', { z: 4.2 }], [45.0, 'pulled', { z: 0.3 }], [45.3, 'pulled', { z: -1.6, y: 0 }],
  [45.4, 'hurt', { z: -1.5 }], [45.65, 'tumble1', { z: 2.5, y: 1.4 }], [46.0, 'tumble3', { z: 7.5, y: 0.9 }], [46.35, 'kneel', { z: 9.0, y: 0 }],
  [46.45, 'sealY', { z: 9.0 }], [47.4, 'sealY'], [47.55, 'frozen'], [48.2, 'frozen'], [48.5, 'kneel'], [49.9, 'kneel'], [50.4, 'guard'], [51.9, 'guard'],
  [52.45, 'hurt', { z: 9.2 }], [52.55, 'tumble1', { z: 10.8, y: 1.2 }], [52.8, 'tumble2', { z: 18, y: 2.2 }], [53.05, 'tumble3', { z: 25.6, y: 2.0 }], [53.35, 'tumble1', { z: 38, y: 1.8 }], [53.8, 'tumble2', { z: 50, y: 1.2 }], [54.4, 'ko', { z: 56, y: 0 }], [60, 'ko'],
]);

// ---------- エフェクト基盤 ----------
const tmpA = V3();
class Bolts {
  constructor(n = 700) { this.pool = []; this.i = 0; this.ax = V3(1, 0, 0);
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
  circle(c, r, w, color, N = 40, axis = 'y', rot = 0) {
    for (let i = 0; i < N; i++) { const a0 = rot + (i / N) * PI * 2, a1 = rot + ((i + 1) / N) * PI * 2; const f = a => axis === 'y' ? V3(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r) : V3(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.z); this.seg(f(a0), f(a1), w, color); }
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
    PARTS.push({ t0: t0 + (tspan ? r(6.1) * tspan : 0), life: life * (0.7 + r(7.3) * 0.6), p: org.add(V3((r(8.1) - .5) * spread * .3, (r(8.7) - .5) * spread * .3, (r(9.3) - .5) * spread * .3)), v, g, size: size * 0.7 * (0.5 + r(10.3)), col: cols[Math.floor(r(11.3) * cols.length)], ground, rot, shrink, sp: r(12.1) * 3 });
  }
}
const NP = 3600;
const IM = new THREE.InstancedMesh(BOX, bas(0xffffff), NP); IM.frustumCulled = false; IM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(IM);
IM.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NP * 3), 3);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color(), _s = V3(), _p = V3();
function updateParts(t) {
  let n = 0;
  for (const p of PARTS) {
    const tt = t - p.t0; if (tt < 0 || tt > p.life || n >= NP) continue;
    _p.set(p.p.x + p.v.x * tt, p.p.y + p.v.y * tt - 0.5 * p.g * tt * tt, p.p.z + p.v.z * tt);
    const sc = p.size * (p.shrink ? (1 - Math.pow(tt / p.life, 3)) : 1);
    if (p.ground && _p.y < sc / 2) _p.y = sc / 2;
    _e.set(tt * p.rot + p.sp, tt * p.rot * 0.7, p.sp); _q.setFromEuler(_e); _s.setScalar(Math.max(sc, 1e-4));
    _m.compose(_p, _q, _s); IM.setMatrixAt(n, _m); _c.set(p.col); IM.setColorAt(n, _c); n++;
  }
  IM.count = n; IM.instanceMatrix.needsUpdate = true; IM.instanceColor.needsUpdate = true;
}
// ---- 粒子の登録 ----
const GOLD = [0xffe070, 0xfff6c0, 0xffffff, 0xffc030], GLASS = [0xdde8ff, 0xffffff, 0x9ad0ff, 0xa060ff];
burst(T.jump, [0, 30, -28], 70, { speed: 8, up: 5, life: 1.8, size: 0.7, g: 9, cols: [0x6a6c78, 0x3a3c48, 0x8a8c98], seed: 1 });
burst(T.jump, [0, 30, 28], 70, { speed: 8, up: 5, life: 1.8, size: 0.7, g: 9, cols: [0x6a6c78, 0x3a3c48, 0x8a8c98], seed: 2 });
burst(T.clash, [0, 34, -0.4], 90, { speed: 30, up: 0, life: 3.0, size: 0.35, g: 8, cols: GLASS, seed: 4, ground: false });
burst(T.land, [0, 0.2, -4], 70, { speed: 8, up: 4, life: 1.4, size: 0.5, g: 9, cols: [0x5a5c68, 0x3a3c48, 0x8a8c98], seed: 5 });
burst(T.land, [0, 0.2, 4], 70, { speed: 8, up: 4, life: 1.4, size: 0.5, g: 9, cols: [0x5a5c68, 0x3a3c48, 0x8a8c98], seed: 6 });
burst(T.shatter, [0, 6, -4], 240, { speed: 15, up: 5, life: 2.4, size: 0.9, g: 8, cols: [0x3a5aff, 0x9ad0ff, 0xffffff, 0x101030], seed: 7, ground: false });
burst(T.sever, [-0.36, 1.4, -4], 60, { speed: 7, up: 4, life: 1.4, size: 0.3, g: 8, cols: [0xf2d0b8, 0x16161c, 0xffffff, 0x9ad0ff], seed: 8 });
T.bf.forEach((tb, i) => burst(tb, [0, 1.4, -4.0 - i * 0.7], 70 + i * 20, { speed: 10 + i * 2, up: 4, life: 1.3, size: 0.4, g: 8, cols: [0xff2030, 0x101010, 0xffffff, 0xffd060], seed: 10 + i }));
burst(T.pierce, [0, 1.3, -8.4], 110, { speed: 12, up: 1, life: 1.5, size: 0.35, g: 6, cols: [0xff2030, 0xffffff, 0x101010], seed: 20, dir: [0, 0.05, -1], spread: 0.7 });
for (let k = 0; k < 6; k++) burst(T.poison + k * 0.35, [0, 0.9, -7.4], 14, { speed: 0.8, up: 2.6, life: 1.6, size: 0.14, g: -0.5, cols: [0x8a3aa8, 0x3aa860, 0xb060e0], seed: 30 + k, ground: false, spread: 4 });
burst(T.cancel, [0, 6, -6], 260, { speed: 18, up: 5, life: 2.4, size: 0.9, g: 8, cols: [0xff3a2a, 0x101010, 0xffffff, 0xff9a30], seed: 40, ground: false });
for (let k = 0; k < 6; k++) burst(T.heal + k * 0.35, [0, 0.2, -7.4], 16, { speed: 0.7, up: 3.0, life: 1.8, size: 0.12, g: -0.5, cols: [0x40ff80, 0xa0ffc0, 0x30e070], seed: 50 + k, ground: false, spread: 4 });
burst(T.counter, [0, 1.4, -6.1], 170, { speed: 15, up: 4, life: 2.0, size: 0.5, g: 6, cols: [0x4aa8ff, 0xffffff, 0x101010, 0x9ad0ff, 0xff2030], seed: 60 });
burst(T.whiteEyes - 0.2, [0, 0.2, 4.2], 50, { speed: 6, up: 3, life: 1.4, size: 0.35, g: 9, cols: [0x5a5c68, 0x8a8c98, 0x3a3c48], seed: 61 });
for (let k = 0; k < 9; k++) { const zk = 7 + k * 2.1; burst(T.purpleFire + (zk - PUR.z0) / PUR.v, [0, 0.2, zk], 36, { speed: 7, up: 8, life: 1.6, size: 0.45, g: 12, cols: [0x2a2c36, 0x1c1e26, 0x5a5c68, 0xe8e8f0, 0x20222c], seed: 300 + k, dir: [0, 1, 0], spread: 2.2 }); }
burst(T.hole, [0, 1.8, HZ - 0.3], 320, { speed: 15, up: 3, life: 2.2, size: 0.7, g: 9, cols: [0x16243e, 0x9ad0ff, 0xffe2a8, 0xffffff, 0x3a3e4c, 0xb060ff], seed: 330, dir: [0, 0.15, -1], spread: 1.8 });
burst(T.hole + 0.3, [0, 2, HZ + HD], 300, { speed: 20, up: 3, life: 2.4, size: 0.8, g: 9, cols: [0x16243e, 0x9ad0ff, 0xffe2a8, 0xffffff, 0x3a3e4c, 0xb060ff], seed: 331, dir: [0, 0.2, 1], spread: 2.0 });
burst(T.hole, [0, 5, HZ], 180, { speed: 9, up: 6, life: 2.6, size: 0.9, g: 8, cols: [0x16243e, 0x3a3e4c, 0x9ad0ff], seed: 332, spread: 6 });
burst(T.kneel, [0, 0.2, 9.0], 40, { speed: 4, up: 2, life: 1.4, size: 0.3, g: 9, cols: [0x5a5c68, 0x8a8c98], seed: 62 });
for (let k = 0; k < 14; k++) burst(T.interior + k * 0.65, [(rnd(k) - 0.5) * 18, 0.4, (rnd(k * 2) - 0.5) * 22], 8, { speed: 0.6, up: 4, life: 2.5, size: 0.3, g: -0.3, cols: [0x000000, 0x1a0010], seed: 70 + k, ground: false, spread: 6 });


// 領域の殻(外から見る): 黒い外郭。縁だけがうっすら光り、表面に弱い模様が流れる
function shell(rim, pat, kind) {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    uniforms: { a: { value: 1.0 }, rim: { value: new THREE.Color(rim) }, pat: { value: new THREE.Color(pat) }, time: { value: 0 }, kind: { value: kind } },
    vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform float a,time,kind; uniform vec3 rim,pat; varying vec3 vN; varying vec3 vP; float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);} void main(){ float f=pow(1.0-abs(vN.z),5.0); vec3 c=vec3(0.0,0.0,0.002)+rim*f*0.55; if(kind<0.5){ float s=step(0.992,h(floor(vP*22.0))); c+=pat*s*(0.5+0.5*sin(time*4.0+h(floor(vP*22.0))*20.0))*0.8; } else { float v=0.5+0.5*sin(vP.y*14.0+sin(vP.x*9.0+time*2.0)*2.0); c+=pat*pow(v,12.0)*0.14*(0.4+f); } gl_FragColor=vec4(c,a);}' });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat); g.add(m); g.visible = false; scene.add(g); return g;
}
const shA = shell(0x6aa8ff, 0xbfe0ff, 0), shB = shell(0xff3a30, 0xff5a40, 1), shF = shell(0xff2030, 0xff4a40, 1);
const ball = (c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), bas(c, { transparent: true })); m.visible = false; scene.add(m); return m; };
const bfBlack = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0, transparent: true, depthWrite: false }));
const bfRed = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff1030, side: THREE.BackSide, transparent: true, toneMapped: false, depthWrite: false }));
bfBlack.visible = bfRed.visible = false; scene.add(bfBlack, bfRed);
const blueFist = ball(0x4aa8ff);
// ===== 滑らかな発光表現(ブロックを感じさせない): 球シェーダー / 尾のリボン / 光の輪 / 柔らかい粒子 =====
function orbMesh(core, rim, swirl, additive = false) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 54), new THREE.ShaderMaterial({
    transparent: additive, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { time: { value: 0 }, a: { value: 1 }, core: { value: new THREE.Color(core) }, rim: { value: new THREE.Color(rim) }, swirl: { value: new THREE.Color(swirl) } },
    vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform float time,a; uniform vec3 core,rim,swirl; varying vec3 vN; varying vec3 vP; void main(){ float f=pow(1.0-abs(vN.z),2.0); float s=0.5+0.5*sin(vP.y*9.0+time*6.0+2.0*sin(vP.x*7.0-time*4.0)+vP.z*5.0); float s2=0.5+0.5*sin(vP.x*13.0-time*9.0+vP.y*4.0); vec3 c=core+rim*f*1.8+swirl*s*f*0.9+swirl*s2*0.25*(0.3+f)+swirl*pow(f,4.0)*1.6; gl_FragColor=vec4(c*a, a);}',
    toneMapped: false
  }));
  m.visible = false; scene.add(m); return m;
}
const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(0.6, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const halo = (col) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: col, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })); sp.visible = false; scene.add(sp); return sp; };
class Ribbon {
  constructor(n, color, sym = false) { this.n = n; this.sym = sym; const g = new THREE.BufferGeometry(); this.pos = new Float32Array(n * 6); this.al = new Float32Array(n * 2);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('a', new THREE.BufferAttribute(this.al, 1)); const idx = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { c: { value: new THREE.Color(color) } },
      vertexShader: 'attribute float a; varying float va; void main(){va=a; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'uniform vec3 c; varying float va; void main(){gl_FragColor=vec4(c*va,va);}', toneMapped: false }));
    this.mesh.frustumCulled = false; this.mesh.visible = false; scene.add(this.mesh); }
  set(pts, w, flat = false) { const n = this.n; this.mesh.visible = true; const cp = camera.position;
    for (let i = 0; i < n; i++) { const p = pts[Math.min(i, pts.length - 1)], a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)];
      const f = this.sym ? Math.sin(Math.PI * i / (n - 1)) : 1 - i / (n - 1); const tg = b.clone().sub(a); const side = tg.cross(flat ? V3(0, 1, 0) : cp.clone().sub(p)).normalize().multiplyScalar(w * f);
      this.pos.set([p.x + side.x, p.y + side.y, p.z + side.z, p.x - side.x, p.y - side.y, p.z - side.z], i * 6); this.al[i * 2] = this.al[i * 2 + 1] = f * f; }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.a.needsUpdate = true; }
}
// 光の輪(滑らかなリング)プール
const RINGS = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.955, 1.0, 128), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.visible = false; scene.add(m); RINGS.push(m); }
let ringI = 0;
function ringFx(c, r, col, op, axis = 'z') { if (ringI >= RINGS.length || op <= 0.01) return; const m = RINGS[ringI++]; m.visible = true; m.position.copy(c); m.scale.setScalar(Math.max(r, 0.01)); m.material.color.set(col); m.material.opacity = op; m.rotation.set(axis === 'y' ? -PI / 2 : 0, 0, 0); }
// 柔らかい粒子(丸く光る点。ブロックではない)
const SOFT = [];
function soft(t0, o, n, op = {}) {
  const { speed = 6, life = 1.2, size = 0.35, cols = [0xffffff], seed = 1, tspan = 0, inward = 0, g = 0, spread = 0 } = op;
  for (let i = 0; i < n; i++) { const r = k => rnd(seed * 57.3 + i * k); const a = r(1.7) * PI * 2, e = r(2.9) * 2 - 1; const dir = V3(Math.cos(a) * Math.sqrt(1 - e * e), e, Math.sin(a) * Math.sqrt(1 - e * e));
    const c = Array.isArray(o) ? V3(...o) : o.clone(); let p0 = c.clone().add(V3((r(3.1) - .5) * spread, (r(4.3) - .5) * spread, (r(5.9) - .5) * spread)), v;
    if (inward) { p0 = c.clone().addScaledVector(dir, inward); v = dir.clone().multiplyScalar(-inward / life); } else v = dir.multiplyScalar(speed * (0.3 + r(6.7)));
    SOFT.push({ t0: t0 + (tspan ? r(7.9) * tspan : 0), life: life * (0.7 + r(8.3) * 0.6), p: p0, v, size: size * (0.5 + r(9.1)), col: new THREE.Color(cols[Math.floor(r(10.7) * cols.length)]), g }); }
}
const NS = 4200; const softGeo = new THREE.BufferGeometry(); const sPos = new Float32Array(NS * 3), sCol = new Float32Array(NS * 3), sSize = new Float32Array(NS);
softGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); softGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3)); softGeo.setAttribute('size', new THREE.BufferAttribute(sSize, 1));
const softMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, uniforms: { sc: { value: 800 } },
  vertexShader: 'attribute vec3 color; attribute float size; uniform float sc; varying vec3 vC; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*sc/max(-mv.z,0.1); gl_Position=projectionMatrix*mv;}',
  fragmentShader: 'varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5)*2.0; float a=smoothstep(1.0,0.0,d); a=a*a; gl_FragColor=vec4(vC*a,a);}' });
const softPts = new THREE.Points(softGeo, softMat); softPts.frustumCulled = false; scene.add(softPts);
function updateSoft(t) {
  let n = 0; softMat.uniforms.sc.value = H / (2 * Math.tan(camera.fov * PI / 360));
  for (const p of SOFT) { const tt = t - p.t0; if (tt < 0 || tt > p.life || n >= NS) continue; const k = tt / p.life; const f = Math.sin(Math.min(1, k * 1.0) * PI) * 0.8 + (1 - k) * 0.2;
    sPos[n * 3] = p.v.x * tt + p.p.x; sPos[n * 3 + 1] = p.v.y * tt + p.p.y - 0.5 * p.g * tt * tt; sPos[n * 3 + 2] = p.v.z * tt + p.p.z; sCol[n * 3] = p.col.r * f; sCol[n * 3 + 1] = p.col.g * f; sCol[n * 3 + 2] = p.col.b * f; sSize[n] = p.size * (0.6 + 0.8 * f); n++; }
  softGeo.setDrawRange(0, n); ['position', 'color', 'size'].forEach(k => (softGeo.attributes[k].needsUpdate = true));
}
let lensS = 0, lensC = V3(), lensR = 0.3;
const lensSet = (pos, r, s) => { lensC.copy(pos); lensR = r; lensS = s; };
const blueO = orbMesh(0x0a1a40, 0x3a8aff, 0x9ad8ff), redO = orbMesh(0x3a0608, 0xff3a30, 0xffa090), purple = orbMesh(0x07000f, 0xa040ff, 0xff70d0), fire = orbMesh(0xff8a30, 0xff5a20, 0xffc070, true);
const haloB = halo(0x4a8aff), haloR = halo(0xff3a30), haloP = halo(0x9a40ff), haloE = halo(0xffb060);
const ribB = new Ribbon(24, 0x6ab0ff), ribR = new Ribbon(24, 0xff5040), ribP = new Ribbon(28, 0x9a40ff);
const CRES = [0, 1, 2, 3].map(() => ({ a: new Ribbon(56, 0xff2a40, true), b: new Ribbon(56, 0xffffff, true), c: new Ribbon(56, 0xff8aa0, true) }));
// 二重の三日月(社長の指定): 両端が鋭く、中央が太い。外側の大弧(赤)+内側の弧(白)+薄い第二の弧
function crescentFx(i, c, R, span, w, tilt = 0, yaw = 0, col = 0xff2a40, flat = false) {
  const cr = CRES[i]; cr.a.mesh.material.uniforms.c.value.set(col);
  if (flat) { // 水平に寝た三日月(解): 凸側が進行方向(-z)。両端は後ろへ流れる
    const mkh = (RR, dy) => { const pts = []; for (let k = 0; k < 56; k++) { const ph = lerp(-span, span, k / 55); const lx = RR * Math.sin(ph), lz = RR * (1 - Math.cos(ph)) * 0.8; pts.push(V3(c.x + lx * Math.cos(yaw) + lz * Math.sin(yaw), c.y + dy + lx * Math.sin(tilt) * 0.2, c.z - lx * Math.sin(yaw) + lz * Math.cos(yaw))); } return pts; };
    cr.a.set(mkh(R, 0), w, true); cr.b.set(mkh(R * 0.95, -0.02 * R), w * 0.5, true); cr.c.set(mkh(R * 0.84, -0.05 * R), w * 0.55, true); return; }
  const mk = (RR, dy, dz) => { const pts = []; for (let k = 0; k < 56; k++) { const ph = lerp(-span, span, k / 55); const lx = RR * Math.sin(ph), ly = RR * (Math.cos(ph) - 1) + dy, lz = RR * (1 - Math.cos(ph)) * 0.45 + dz;
      const x1 = lx * Math.cos(tilt) - ly * Math.sin(tilt), y1 = lx * Math.sin(tilt) + ly * Math.cos(tilt); pts.push(V3(c.x + x1 * Math.cos(yaw) + lz * Math.sin(yaw), c.y + y1, c.z - x1 * Math.sin(yaw) + lz * Math.cos(yaw))); } return pts; };
  cr.a.set(mk(R, 0, 0), w); cr.b.set(mk(R * 0.97, -R * 0.015, 0.05), w * 0.45); cr.c.set(mk(R * 0.88, -R * 0.09, -0.15), w * 0.55);
}

for (const sx of [-1, 1]) soft(T.bldCut, [sx * 19, 41, 4], 160, { speed: 8, life: 1.4, size: 0.5, cols: [0xff6a60, 0xffffff, 0xffd0c0], seed: 130 + sx, spread: 14 });
// 紫・激突まわりの粒子(柔らかい光の粒)
soft(8.9, [0, 34.6, -5], 220, { inward: 4.2, life: 1.0, size: 0.28, cols: [0x6ab0ff, 0xff5040, 0xc070ff, 0xffffff], seed: 101, tspan: 0.95 });
soft(9.95, [0, 34.6, -5], 220, { speed: 9, life: 1.1, size: 0.32, cols: [0xc070ff, 0xff70d0, 0xffffff, 0x7a30ff], seed: 102 });
for (let k = 0; k < 18; k++) soft(T.launch + k * 0.056, [0, 34.6, -5 + k * 0.26], 12, { speed: 2.6, life: 1.3, size: 0.3, cols: [0xc070ff, 0xff70d0, 0x7a30ff], seed: 110 + k, spread: 1.2 });
soft(T.clash, [0, 34, -0.4], 700, { speed: 34, life: 3.2, size: 0.8, cols: [0xffa040, 0xffe070, 0xffffff, 0xc070ff, 0xff70d0], seed: 120 });
soft(T.clash, [0, 34, -0.4], 260, { speed: 12, life: 2.8, size: 1.4, cols: [0xff7a30, 0xffb060, 0xd0508a], seed: 121 });



// ---------- 状態 ----------
let flashW = 0, invert = 0, shakeAmp = 0, shockT = -9, shockPos = V3(), bfD = -1, bfPos = V3();
const bodyOf = (C, y = 0.45) => worldOf(C.torso, [0, y, 0]);
const head = C => worldOf(C.head, [0, 0, 0]);
const handW = (C, side) => worldOf(side === 'R' ? C.armR : C.armL, [0, -12 * PX - 0.05, 0]);
function envAt(t) { if (t >= T.interior && t < T.cancel) return 'K'; if (t >= T.domG2 + 0.35 && t < T.domEnd) return 'G'; return 'S'; }
function armState(t) { // 切断された腕の弾道
  const d = t - T.sever; if (d < 0) return null;
  const o = V3(-0.36, 1.44, -4), v = V3(-4.5, 5.5, -3.5); const p = o.clone().addScaledVector(v, d); p.y -= 0.5 * 9 * d * d; if (p.y < 0.15) { p.y = 0.15; }
  const dd = Math.min(d, 1.0); return { p, rx: dd * 9, rz: dd * 6 };
}
function updateScene(t, tvid) {
  const env = q.get('env') || envAt(t); setEnv(env);
  const ds = clamp((t - T.dawn) / 6); const sky = WORLD.anim.skyS.material.uniforms;
  sky.t.value.set(0x02030c).lerp(new THREE.Color(0x2a4a9a), smooth(ds)); sky.b.value.set(0x3a1f5a).lerp(new THREE.Color(0xffa070), smooth(ds));
  if (env === 'S') { ENV.S.g.visible = true; scene.fog.color.set(0x1a1030).lerp(new THREE.Color(0xc88a80), smooth(ds)); hemi.intensity = 0.95 + 0.4 * smooth(ds); }
  WORLD.anim.skyG.material.uniforms.time.value = t;
  WORLD.anim.skyK.material.uniforms.time.value = tvid;
  WORLD.anim.blink.forEach(b => (b.m.visible = Math.sin(tvid * 3 + b.ph) > 0.2));
  WORLD.anim.cut.forEach(c => { const tt = t - T.bldCut; const sx = c.sx;
    if (tt < 0) { c.up.position.copy(c.base0); c.up.rotation.set(0, 0, 0); c.up.visible = true; c.edge.visible = false; return; }
    const e = easeOut(clamp(tt / 0.7)), fall = Math.max(0, tt - 0.7);
    c.up.position.set(c.base0.x - sx * (7 * e + 9 * fall * fall), c.base0.y + 0.5 * e - 16 * fall * fall, c.base0.z); c.up.rotation.set(0, 0, sx * (0.16 * e + 0.55 * fall));
    c.up.visible = c.up.position.y > -70; c.edge.visible = tt < 0.7; });
  WORLD.anim.screens.forEach((m, i) => m.material.color.setHSL((t * 0.15 + i * 0.27) % 1, 0.9, 0.42 * (1 - 0.7 * smooth(ds))));
  // 星の流れ(五条の領域)
  if (env === 'G') { const st = WORLD.anim.streaks; const m = new THREE.Matrix4(), s = V3(0.06, 0.06, 9), p = V3(), qq = new THREE.Quaternion();
    for (let i = 0; i < 320; i++) { const x = (rnd(i * 3.1) - 0.5) * 80, y = rnd(i * 5.3) * 32, z0 = rnd(i * 7.7) * 160; const z = ((z0 + t * 70) % 160) - 80; p.set(x, y, z); m.compose(p, qq, s); st.setMatrixAt(i, m); }
    st.instanceMatrix.needsUpdate = true; st.instanceColor.needsUpdate = true; }
  const sg = evalActor(GK, t, 0), sy = evalActor(YK, t, 1.7);
  setPose(G, sg); setPose(Y, sy);
  G.armR.visible = t < T.sever; // 右腕は切断される
  const trem = t > T.poison && t < T.spearOn ? 0.035 : 0; if (trem) G.root.position.add(V3((rnd(Math.floor(tvid * 30)) - .5) * trem, 0, (rnd(Math.floor(tvid * 30) + 9) - .5) * trem));
  const pz = clamp((t - T.poison) / 0.4) * (t < T.heal + 1.6 ? 1 : 1 - smooth(clamp((t - T.heal - 1.6) / 1.0)));
  setTint(G, 0x8a4aa8, 0.55 * pz);
  Y.whiteEyes.visible = (t >= T.whiteEyes && t < 37.6) || (t >= T.muku && t < T.yDown + 0.5);
  G.root.visible = !(t > T.tele + 0.02 && t < T.reappear - 0.01); // 瞬間移動の間は姿が消える
  setTint(Y, 0x55ff88, t > T.reverse && t < T.reverse + 1.4 ? 0.3 * Math.sin((t - T.reverse) / 1.4 * PI) : 0);
  const uG = clamp((t - 14.6) / 0.7), uG2 = clamp((t - 36.3) / 0.7);
  setHand(G.handR, t > 14.5 && t < 17.7 ? 'cross' : 'none', tvid, uG); setHand(G.handL, t > 14.5 && t < 17.7 ? 'cup' : (t > 36.2 && t < 37.8 ? 'cross' : 'none'), tvid, t > 14.5 && t < 17.7 ? 1 : uG2);
  const yS = (t > 15.6 && t < 18.0) || (t > T.yDomSeal && t < 47.5); setHand(Y.handR, yS ? 'fist' : 'none', tvid); setHand(Y.handL, yS ? 'fist' : 'none', tvid);
  // 腕・槍
  const as = armState(t); flyingArm.visible = !!as && t < 31; if (as) { flyingArm.position.copy(as.p); flyingArm.rotation.set(as.rx, 0.5, as.rz); }
  // 残像
  const spd = (keys, tt) => { const a = evalActor(keys, tt, 0), b = evalActor(keys, tt - 0.07, 0); return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); };
  [[ghostsG, GK, sg], [ghostsY, YK, sy]].forEach(([arr, keys, s0]) => { const sp = spd(keys, t); arr.forEach((c, i) => { const on = sp > 0.5 && env !== 'G'; c.root.visible = on; if (on) setPose(c, evalActor(keys, t - 0.055 * (i + 1), i)); }); });
  if (ghostsG[0].root.visible) ghostsG.forEach(c => c.armR.visible = t < T.sever);
  [G, Y, ...ghostsG, ...ghostsY].forEach(c => c.root.updateMatrixWorld(true));
}

// 天逆鉾
function updateSpear(t) {
  spear.visible = t >= T.spearOn && t < 30.9; if (!spear.visible) return;
  const h = handW(G, 'L'); const thr = clamp((t - 30.0) / 0.12);
  spear.position.copy(h).add(V3(0.1, 0.1, 0.2 + 0.7 * thr)); spear.rotation.set(PI / 2 - 0.5 * thr, 0, 0);
}

// ---------- エフェクト ----------
function crescent(c, R, span, w, col, seed, frame) {
  const N = 16; let prev = null;
  for (let i = 0; i <= N; i++) { const ph = lerp(-span, span, i / N); const p = V3(c.x + R * Math.sin(ph), c.y + R * (Math.cos(ph) - 1), c.z + R * (1 - Math.cos(ph)) * 0.45 + (rnd(i + seed + frame) - .5) * 0.2);
    if (prev) { bolts.seg(prev, p, w * 2.4, col); bolts.seg(prev, p, w, 0xffffff); } prev = p; }
}

// 証印の紋様(光の線): 五条=円+交差した二本線(指の交差) / 虎杖=円+合わせた拳(菱形)+放射の棘
function sigil(kind, c, r, w, t, axis) {
  const rot = t * 0.5;
  if (kind === 'G') { const col = 0x9ad0ff;
    bolts.circle(c, r, w, col, 56, axis, rot); bolts.circle(c, r * 0.62, w * 0.7, 0xffffff, 40, axis, -rot);
    for (const s of [-1, 1]) { const a = rot + s * 0.62 + PI / 2; const d = (x) => axis === 'y' ? V3(Math.cos(a) * x, 0, Math.sin(a) * x) : V3(Math.cos(a) * x, Math.sin(a) * x, 0); bolts.seg(c.clone().add(d(-r * 0.95)), c.clone().add(d(r * 0.95)), w * 1.3, 0xffffff); }
    for (let k = 0; k < 8; k++) { const a = rot * 0.5 + (k / 8) * PI * 2; const d = (x) => axis === 'y' ? V3(Math.cos(a) * x, 0, Math.sin(a) * x) : V3(Math.cos(a) * x, Math.sin(a) * x, 0); bolts.seg(c.clone().add(d(r * 1.0)), c.clone().add(d(r * 1.12)), w * 1.1, col); }
  } else { const col = 0xff2a40;
    bolts.circle(c, r, w * 1.2, col, 56, axis, -rot); bolts.circle(c, r * 0.7, w * 0.8, 0x000000, 44, axis, rot);
    const dm = (x, a) => axis === 'y' ? V3(Math.cos(a) * x, 0, Math.sin(a) * x) : V3(Math.cos(a) * x, Math.sin(a) * x, 0);
    for (let k = 0; k < 4; k++) { const a0 = rot + (k / 4) * PI * 2, a1 = rot + ((k + 1) / 4) * PI * 2; bolts.seg(c.clone().add(dm(r * 0.62, a0)), c.clone().add(dm(r * 0.62, a1)), w * 1.4, 0xffffff); }
    for (let k = 0; k < 8; k++) { const a = -rot + (k / 8) * PI * 2; bolts.seg(c.clone().add(dm(r * 1.0, a)), c.clone().add(dm(r * (k % 2 ? 1.18 : 1.32), a)), w * 1.4, k % 2 ? col : 0x000000); }
  }
}
function sigils(t, frame) {
  // 五条: 手元で記号が完成(14.95〜)、足元から外へ拡がる(15.4〜17.6)
  if (t > T.sealGdone - 0.1 && t < 17.7) { const h = handW(G, 'R').add(V3(0, 0.0, 0.0)); const k = clamp((t - T.sealGdone) / 0.35); sigil('G', h.clone().add(V3(0, 0.35, 0.25)), 0.3 + 0.25 * easeOut(k), 0.012 + 0.01 * (1 - k), t, 'z'); }
  if (t > T.sealGdone + 0.1 && t < 17.7) { const k = clamp((t - T.sealGdone - 0.1) / 1.6); sigil('G', V3(0, 0.06, -4), 1.0 + 9 * easeOut(k), 0.12 * (1 - 0.3 * k), t, 'y'); }
  // 虎杖: 拳を合わせて完成(16.4〜)、足元から拡がる
  if (t > T.sealYdone - 0.1 && t < 18.0) { const h = handW(Y, 'R').add(handW(Y, 'L')).multiplyScalar(0.5); const k = clamp((t - T.sealYdone) / 0.35); sigil('Y', h.clone().add(V3(0, 0.35, -0.25)), 0.3 + 0.25 * easeOut(k), 0.012 + 0.01 * (1 - k), t, 'z'); }
  if (t > T.sealYdone + 0.1 && t < 18.0) { const k = clamp((t - T.sealYdone - 0.1) / 1.5); sigil('Y', V3(0, 0.06, 4), 1.0 + 10 * easeOut(k), 0.14 * (1 - 0.3 * k), t, 'y'); }
  // 完成の瞬間の閃光
  for (const [tt, col] of [[T.sealGdone, 0xaad0ff], [T.sealYdone, 0xff2a40]]) { const d = t - tt; if (d >= 0 && d < 0.3) { flashW = Math.max(flashW, 0.25 * (1 - d / 0.3)); shakeAmp = Math.max(shakeAmp, 0.2 * (1 - d / 0.3)); } }
}

let caBoost = 0;
function lateFx(t, tvid, frame) {
  caBoost = 0; dome.visible = false; auraY.root.visible = false; trench.visible = false; trenchE.forEach(m => (m.visible = false)); holeF.visible = holeR.visible = holeB.visible = false;
  const yp = Y.root.position, gp = G.root.position, yb = bodyOf(Y), gb2 = bodyOf(G);
  // ---- 新陰流簡易領域(金色のドームと足元の紋)+ 領域展延(体を包む光) ----
  if (t >= T.simple && t < T.redHit) {
    const k = smooth(clamp((t - T.simple) / 0.7)); const R = 3.3 * k;
    dome.visible = true; dome.position.set(yp.x, 0, yp.z); dome.scale.setScalar(Math.max(R, 0.01)); dome.material.uniforms.time.value = tvid;
    const c = V3(yp.x, 0.07, yp.z); bolts.circle(c, R, 0.07, 0xffe8a0, 48, 'y', t * 0.4); bolts.circle(c, R * 0.72, 0.04, 0xffffff, 40, 'y', -t * 0.5);
    for (let k2 = 0; k2 < 8; k2++) { const a = t * 0.4 + (k2 / 8) * PI * 2; bolts.seg(c.clone().add(V3(Math.cos(a) * R * 0.3, 0, Math.sin(a) * R * 0.3)), c.clone().add(V3(Math.cos(a) * R * 0.98, 0, Math.sin(a) * R * 0.98)), 0.03, 0xffe8a0); }
    const d0 = t - T.simple; if (d0 >= 0 && d0 < 0.6) { ringFx(c, 8 * easeOut(d0 / 0.6), 0xffe8a0, 0.8 * (1 - d0 / 0.6), 'y'); flashW = Math.max(flashW, 0.25 * (1 - d0 / 0.6)); shakeAmp = Math.max(shakeAmp, 0.3 * (1 - d0 / 0.6)); }
    // 領域無量空処の筋がドームにぶつかって弾ける
    for (let b = 0; b < 4; b++) { const a = rnd(frame * 3 + b) * PI * 2, rr = 3.35; const e = V3(yp.x + Math.cos(a) * rr, 0.6 + rnd(frame + b * 7) * 2.4, yp.z + Math.sin(a) * rr); bolts.bolt(e.clone().add(V3((rnd(b + frame) - .5) * 3, 0.5 + rnd(b * 5 + frame) * 2, (rnd(b * 3 + frame) - .5) * 3)), e, { n: 3, jit: .15, w: 0.02, color: b % 2 ? 0xbfe0ff : 0xffe8a0, seed: frame * 3 + b }); }
  }
  if (t >= T.amp && t < T.redHit) { auraY.root.visible = true; setPose(auraY, evalActor(YK, t, 1.7)); auraY.root.scale.setScalar(1.09 + 0.02 * Math.sin(tvid * 9)); auraY.mats.forEach(m => (m.opacity = 0.42 + 0.12 * Math.sin(tvid * 11)));
    auraY.root.updateMatrixWorld(true); const k = clamp((t - T.amp) / 0.4); const f = yb.clone(); for (let b = 0; b < 6; b++) { const e = f.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .3, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(0.7)); bolts.bolt(f, e, { n: 3, jit: .1, w: 0.02, color: 0xffe8a0, seed: frame * 3 + b }); } }
  // ---- 肉弾戦のヒット(金と白の火花・ドームの波紋) ----
  T.melee2.forEach((tm, i) => { const d = t - tm; if (d < 0 || d > 0.25) return; const c = yb.clone().lerp(gb2, 0.5); const lf = 1 - d / 0.25;
    for (let b = 0; b < 9; b++) { const dir = V3(rnd(b * 1.7 + i) - .5, rnd(b * 2.9 + i) - .3, rnd(b * 4.1 + i) - .5).normalize(); bolts.bolt(c, c.clone().addScaledVector(dir, (0.8 + rnd(b * 5) * 1.6) * easeOut(clamp(d / 0.1))), { n: 3, jit: .15, w: 0.05 * lf + 0.01, color: b % 2 ? 0xffffff : 0xffe070, seed: frame * 3 + b + i * 9 }); }
    if (t < T.redHit) ringFx(V3(yp.x, 0.5, yp.z), 3.3 * (0.8 + 0.4 * lf), 0xffe8a0, 0.5 * lf, 'y');
    flashW = Math.max(flashW, 0.12 * lf); shakeAmp = Math.max(shakeAmp, (i === 7 ? 0.8 : 0.3) * lf); if (i === 7 && d < 0.02) invert = 1; });
  // ---- 蒼(引き寄せ)→ 赫(赤いパンチ) ----
  if (t >= T.blueOn && t < T.redHit + 0.1) { const fh = handW(G, 'L'); const g = smooth(clamp((t - T.blueOn) / 0.4)); const c = fh.clone().add(V3(0, 0.15, 0.55));
    blueO.visible = true; blueO.position.copy(c); blueO.scale.setScalar(0.12 + 0.55 * g); blueO.material.uniforms.time.value = tvid; haloB.visible = true; haloB.position.copy(c); haloB.scale.setScalar((0.12 + 0.55 * g) * 7);
    lensSet(c, 0.34, 0.15 + 0.35 * g); caBoost = 0.004 * g;
    if (t >= T.pull) { const pts = []; for (let k = 0; k < 24; k++) pts.push(yb.clone().lerp(c, k / 23).add(V3((rnd(k + frame) - .5) * 0.18, (rnd(k * 3 + frame) - .5) * 0.18, 0))); ribB.set(pts, 0.32 * (1 - clamp((t - T.redHit) / 0.1))); shakeAmp = Math.max(shakeAmp, 0.25); } }
  if (t >= 45.0 && t < T.redHit + 0.15) { const fr = handW(G, 'R'); const g = smooth(clamp((t - 45.0) / 0.35)); redO.visible = true; redO.position.copy(fr); redO.scale.setScalar(0.1 + 0.5 * g); redO.material.uniforms.time.value = tvid; haloR.visible = true; haloR.position.copy(fr); haloR.scale.setScalar((0.1 + 0.5 * g) * 7);
    for (let b = 0; b < 5; b++) bolts.bolt(fr, fr.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(0.5 * g)), { n: 3, jit: .1, w: 0.03, color: 0xff4a40, seed: frame * 3 + b }); }
  { const d = t - T.redHit; if (d >= 0 && d < 1.1) { const pos = yb.clone(); bfD = d; bfPos.copy(pos); const r = 0.4 + 2.4 * easeOut(clamp(d / 0.3)), op = 1 - smooth(clamp((d - 0.4) / 0.6));
      bfBlack.position.copy(pos); bfBlack.scale.setScalar(r * 0.7); bfBlack.material.opacity = op * 0.9; bfBlack.visible = true; bfRed.material.color.set(0xff2a20); bfRed.position.copy(pos); bfRed.scale.setScalar(r); bfRed.material.opacity = op; bfRed.visible = true;
      for (let b = 0; b < 18; b++) { const dir = V3(rnd(b * 1.7) - .5, rnd(b * 2.9) - .5, rnd(b * 4.1) - .5).normalize(); bolts.bolt(pos, pos.clone().addScaledVector(dir, (2 + 5 * rnd(b * 5)) * easeOut(clamp(d / 0.2))), { n: 6, jit: .4, w: 0.12 * (1 - clamp(d / 1.0)) + 0.01, color: b % 2 ? 0xff2a20 : 0xffffff, seed: frame * 3 + b }); }
      ringFx(V3(pos.x, 0.5, pos.z), 12 * easeOut(clamp(d / 0.6)), 0xff4a40, 0.8 * (1 - clamp(d / 0.6)), 'y'); ringFx(pos, 9 * easeOut(clamp(d / 0.5)), 0xffffff, 0.6 * (1 - clamp(d / 0.5)), 'z');
      flashW = Math.max(flashW, d < 0.03 ? 0.6 : 0.12 * (1 - clamp(d / 0.6))); shakeAmp = Math.max(shakeAmp, 1.0 * (1 - clamp(d / 0.9))); if (d < 0.02) invert = 1; fxLight.color.set(0xff3a2a); fxLight.position.copy(pos); fxLight.intensity = 60 * (1 - clamp(d / 0.8)); } }
  if (t >= T.redHit && t < T.redHit + 1.2) { const d = t - T.redHit; if (d < 0.1) for (const sx of [0]) { /* 簡易領域が砕ける */ const c = V3(yp.x, 0.5, 3); } }
  // ---- 虎杖の領域展開(無量空処に押し潰される)→ 脳に情報が流れ込む ----
  { const d = t - T.yDomShell; if (d >= 0 && d < 1.0) { shF.visible = true; shF.position.set(yp.x, 0, yp.z); shF.scale.setScalar(Math.max(0.05, 0.4 + 6 * easeOut(clamp(d / 0.45)))); shF.children[0].material.uniforms.a.value = d < 0.45 ? 1 : 1 - smooth(clamp((d - 0.45) / 0.5));
      if (d >= 0.45) for (let b = 0; b < 14; b++) { const a = rnd(b * 2.3 + frame) * PI * 2, e = (rnd(b * 5.1) - .5) * 2; const base = V3(yp.x + Math.cos(a) * 6 * Math.cos(e), 3 + Math.sin(e) * 6, yp.z + Math.sin(a) * 6 * Math.cos(e)); bolts.bolt(base, base.clone().add(V3((rnd(b + frame) - .5) * 4, (rnd(b * 3 + frame) - .5) * 4, (rnd(b * 5 + frame) - .5) * 4)), { n: 4, jit: .3, w: 0.05, color: b % 2 ? 0xbfe0ff : 0xff3a30, seed: frame * 3 + b }); }
      shakeAmp = Math.max(shakeAmp, 0.3); } }
  if (t >= T.muku && t < T.yDown + 0.3) { caBoost = 0.012 + 0.008 * Math.sin(tvid * 40); for (let b = 0; b < 8; b++) { const a = rnd(b * 3.3 + frame) * PI * 2; const from = V3(yp.x + Math.cos(a) * (6 + rnd(b) * 6), 1 + rnd(b * 5 + frame) * 7, yp.z + Math.sin(a) * (6 + rnd(b) * 6)); bolts.bolt(from, yb, { n: 6, jit: .3, w: 0.025, color: b % 3 ? 0xbfe0ff : 0xffffff, seed: frame * 3 + b }); } flashW = Math.max(flashW, 0.04 + 0.04 * Math.sin(tvid * 30)); }
  // ---- 反転術式(緑の回復) ----
  if (t >= T.reverse && t < T.reverse + 1.3) { const d = t - T.reverse; ringFx(V3(yp.x, 0.2, yp.z), 5 * easeOut(clamp(d / 1.0)), 0x50ff90, 0.6 * (1 - clamp(d / 1.0)), 'y'); }
  // ---- 五条の瞬間移動 ----
  { const d = t - T.tele; if (d >= 0 && d < 0.55) { const a = V3(0, 1.4, -3.0), b = V3(0, 1.8, 3.6); const life = 1 - d / 0.55; bolts.bolt(a, b, { n: 14, jit: .5, w: 0.14 * life + 0.01, color: 0xbfe0ff, seed: frame }); bolts.bolt(a, b, { n: 14, jit: .5, w: 0.06 * life, color: 0xffffff, seed: frame + 3 });
      ringFx(V3(0, 1.0, -3.0), 4 * easeOut(clamp(d / 0.4)), 0xbfe0ff, 0.8 * life, 'y'); flashW = Math.max(flashW, d < 0.05 ? 0.35 : 0); }
    const d2 = t - T.reappear; if (d2 >= 0 && d2 < 0.5) { ringFx(V3(0, 1.5, 3.6), 5 * easeOut(clamp(d2 / 0.4)), 0xffffff, 0.8 * (1 - d2 / 0.5), 'y'); ringFx(V3(0, 2.6, 3.6), 3 * easeOut(clamp(d2 / 0.4)), 0xbfe0ff, 0.7 * (1 - d2 / 0.5), 'z'); flashW = Math.max(flashW, d2 < 0.05 ? 0.4 : 0.1 * (1 - d2 / 0.5)); shakeAmp = Math.max(shakeAmp, 0.4 * (1 - d2 / 0.5)); } }
  // ---- 体を縦に反転して、至近距離から紫を体に叩き込む ----
  if (t >= T.reappear && t < T.purpleFire + 2.0) {
    const hL = handW(G, 'L'); const f1 = smooth(clamp((t - 51.85) / 0.45)); const fired = t >= T.purpleFire;
    if (!fired) { const r = 0.6 * (1 - f1) + 0.03, a = (t - 51.85) * 14; for (const [mesh, hl, sg] of [[blueO, haloB, 1], [redO, haloR, -1]]) { const pp = hL.clone().add(V3(Math.cos(a + (sg > 0 ? 0 : PI)) * r, Math.sin(a + (sg > 0 ? 0 : PI)) * r * 0.6, 0.35)); mesh.visible = true; mesh.position.copy(pp); mesh.scale.setScalar(0.12 + 0.1 * f1); mesh.material.uniforms.time.value = tvid; hl.visible = true; hl.position.copy(pp); hl.scale.setScalar(1.2); }
      if (f1 > 0.7) { const pc = hL.clone().add(V3(0, 0, 0.35)); purple.visible = true; purple.position.copy(pc); purple.scale.setScalar(0.1 + 0.45 * smooth((f1 - 0.7) / 0.3)); purple.material.uniforms.time.value = tvid; haloP.visible = true; haloP.position.copy(pc); haloP.scale.setScalar(2.4); lensSet(pc, 0.3, 0.3); } }
    else { const d = t - T.purpleFire; const gy = 2.6, zf = PUR.z0 + PUR.v * d; const c = V3(0, gy + (1.5 - gy) * smooth(clamp(d / 0.3)), zf); const r = 0.4 + 4.4 * easeOut(clamp(d / 0.9)); const op = 1 - smooth(clamp((d - 1.9) / 0.8));
      purple.visible = op > 0.02; purple.position.copy(c); purple.scale.setScalar(r); purple.material.uniforms.time.value = tvid; haloP.visible = true; haloP.position.copy(c); haloP.scale.setScalar(r * 5 * op + 0.1); lensSet(c, 0.34, 0.45 * op);
      const pts = []; for (let k = 0; k < 28; k++) pts.push(V3(0, c.y, c.z - 1.5 - k * 2.4)); ribP.set(pts, r * 0.9 * op);
      for (let k = 0; k < 4; k++) { const dd = d - k * 0.1; if (dd > 0 && dd < 1.4) ringFx(V3(0, c.y, PUR.z0 + PUR.v * dd), 2 + dd * 3, k % 2 ? 0x7a30ff : 0xff70d0, 0.7 * (1 - clamp(dd / 1.4)), 'z'); }
      ringFx(V3(0, 0.3, PUR.z0 + 3), 18 * easeOut(clamp(d / 0.7)), 0xffffff, 0.9 * (1 - clamp(d / 0.7)), 'y');
      flashW = Math.max(flashW, d < 0.04 ? 0.7 : 0.12 * (1 - clamp(d / 0.6))); shakeAmp = Math.max(shakeAmp, 0.9 * (1 - clamp(d / 1.2))); if (d < 0.02) invert = 1; fxLight.color.set(0xb060ff); fxLight.position.copy(c); fxLight.intensity = 90 * (1 - clamp(d / 2.4)); caBoost = 0.01 * (1 - clamp(d / 0.8));
      // アスファルトに刻まれる溝(通過した跡が残る)
      const zEnd = Math.min(zf, HZ - 0.1), zS = PUR.z0 - 0.5, wr = 2 * Math.sqrt(Math.max(0, r * r - 2.25)) * 0.95;
      if (zEnd > zS && wr > 0.1) { trench.visible = true; trench.scale.set(wr, 1, zEnd - zS); trench.position.set(0, 0.07, (zEnd + zS) / 2); trenchE.forEach((m, i) => { m.visible = true; m.scale.set(0.22, 1, zEnd - zS); m.position.set((i ? 1 : -1) * wr / 2, 0.075, (zEnd + zS) / 2); m.material.opacity = 0.6 + 0.3 * Math.sin(tvid * 14 + i); }); } } }
  // ---- ビルに穴が空く(着弾後は残る) ----
  { const dh = t - T.hole; if (dh >= 0) { const R = 5.3 * easeOut(clamp(dh / 0.25)); const glow = 0.45 + 0.55 * (1 - clamp(dh / 2.5));
      holeF.visible = holeR.visible = holeB.visible = true; holeF.scale.setScalar(R); holeR.scale.setScalar(R * 1.08); holeR.material.opacity = glow; holeB.scale.setScalar(R);
      if (dh < 0.7) { const lf = 1 - dh / 0.7; for (let b = 0; b < 16; b++) { const a = rnd(b * 2.7) * PI * 2, l0 = R * (1.1 + 0.7 * rnd(b * 5.1)), l1 = l0 + (6 + 14 * rnd(b * 3.3)) * easeOut(clamp(dh / 0.2)); const o = V3(0, 1.7, HZ - 0.15);
          bolts.bolt(o.clone().add(V3(Math.cos(a) * l0, Math.sin(a) * l0, 0)), o.clone().add(V3(Math.cos(a) * l1, Math.sin(a) * l1, 0)), { n: 5, jit: 0.5, w: 0.1 * lf + 0.02, color: b % 2 ? 0xffffff : 0xb060ff, seed: frame * 3 + b }); }
        ringFx(V3(0, 1.7, HZ - 0.3), 30 * easeOut(clamp(dh / 0.6)), 0xd0a0ff, 0.8 * (1 - clamp(dh / 0.6)), 'z');
        flashW = Math.max(flashW, dh < 0.04 ? 0.6 : 0.15 * lf); shakeAmp = Math.max(shakeAmp, 1.4 * lf); if (dh < 0.02) invert = 1; } } }
  // ---- 領域の崩壊 ----
  { const d = t - T.domEnd; if (d >= 0 && d < 0.5) { flashW = Math.max(flashW, 0.8 * (1 - d / 0.5)); shakeAmp = Math.max(shakeAmp, 0.5 * (1 - d / 0.5)); if (d < 0.05) invert = 1; } }
}
function updateFx(t, tvid) {
  bolts.begin(); flashW = 0; invert = 0; fxLight.intensity = 0; shakeAmp = 0; bfD = -1;
  shA.visible = shB.visible = shF.visible = false; [purple, blueO, redO, fire, haloB, haloR, haloP, haloE, ribB.mesh, ribR.mesh, ribP.mesh, ...CRES.flatMap(c => [c.a.mesh, c.b.mesh, c.c.mesh])].forEach(o => (o.visible = false)); ringI = 0; RINGS.forEach(r => (r.visible = false)); lensS = 0; bfBlack.visible = bfRed.visible = blueFist.visible = false;
  const frame = Math.floor(tvid * 24);
  const hit = (tt, dur = 0.5) => { const d = t - tt; return d >= 0 && d < dur ? d : -1; };
  // 屋上の亀裂・跳躍
  { const d = hit(T.jump, 0.6); if (d >= 0) { bolts.ring(V3(0, 30.1, -28), 11 * easeOut(d / 0.6), 0.25 * (1 - d / 0.6) + 0.03, 0xffffff, frame, 26, 'y'); bolts.ring(V3(0, 30.1, 28), 11 * easeOut(d / 0.6), 0.25 * (1 - d / 0.6) + 0.03, 0xffffff, frame + 9, 26, 'y'); shakeAmp = Math.max(shakeAmp, 0.5 * (1 - d / 0.6)); } }
  // 虎杖: 巨大な解(溜め→発射)
  if (t >= 7.8 && t < T.clash + 0.1) {
    const g = smooth(clamp((t - 7.8) / 2.8)); const launched = t >= T.launch; const zc = launched ? 5 - (t - T.launch) * 5.4 : 5;
    const R = 0, span = 0;
    crescentFx(0, V3(0, 35.5 + 1.0 * g, zc), lerp(4, 30, Math.pow(g, 0.8)), lerp(0.6, 1.15, g), 0.3 + 2.6 * g, 0.2 * Math.sin(t * 2), 0, 0xff2a40, true);
    if (!launched) { const f = handW(Y, 'R'); for (let b = 0; b < 4; b++) bolts.bolt(f, f.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).multiplyScalar(2.2)), { n: 3, jit: .15, w: 0.05, color: 0xff2a40, seed: frame * 7 + b }); }
    shakeAmp = Math.max(shakeAmp, 0.08 + 0.1 * g);
  }
  // 五条: 蒼と赫が螺旋で引き合い→空気が歪み→合体の一瞬(止まる)→黒紫の球(茈)→発射
  { const gc = V3(0, 34.6, -5), tA = 8.8, tM = 9.95, tF = T.launch;
    if (t >= tA && t < tM + 0.1) {
      const g1 = smooth(clamp((t - tA) / (tM - tA)));
      const orbPos = (tt, sgn) => { const gg = smooth(clamp((tt - tA) / (tM - tA))); const r = 2.7 * Math.pow(1 - gg, 1.3) + 0.04; const a = (tt - tA) * 9.5 * (0.45 + gg) + (sgn > 0 ? 0 : PI); return gc.clone().add(V3(Math.cos(a) * r, Math.sin(a) * r * 0.5, Math.sin(a) * r * 0.85)); };
      for (const [mesh, hl, sgn, rib] of [[blueO, haloB, 1, ribB], [redO, haloR, -1, ribR]]) { const p = orbPos(t, sgn); const rr = 0.28 + 0.38 * g1; mesh.visible = true; mesh.position.copy(p); mesh.scale.setScalar(rr); mesh.material.uniforms.time.value = tvid;
        hl.visible = true; hl.position.copy(p); hl.scale.setScalar(rr * 6); const pts = []; for (let k = 0; k < 24; k++) pts.push(orbPos(Math.max(tA, t - k * 0.03), sgn)); rib.set(pts, rr * 0.8); }
      lensSet(gc, 0.3, 0.1 + 0.3 * g1); shakeAmp = Math.max(shakeAmp, 0.05 + 0.12 * g1);
    }
    if (t >= tM - 0.02 && t < T.clash + 0.05) {
      const g2 = smooth(clamp((t - tM) / 0.7)); const launched = t >= tF; const zc = launched ? -5 + (t - tF) * 4.6 : -5; const c = V3(0, 34.6, zc);
      const r = 0.32 + 1.95 * g2 + (launched ? 0.25 : 0) + 0.05 * Math.sin(tvid * 40);
      purple.visible = true; purple.position.copy(c); purple.scale.setScalar(r); purple.material.uniforms.time.value = tvid; haloP.visible = true; haloP.position.copy(c); haloP.scale.setScalar(r * (6.5 + 1.5 * Math.sin(tvid * 22)));
      lensSet(c, 0.28 + 0.1 * g2, 0.3 + 0.2 * g2);
      const d0 = t - tM; if (d0 >= -0.02 && d0 < 0.5) { ringFx(c, 0.6 + 7 * easeOut(clamp(d0 / 0.5)), 0xc070ff, 0.9 * (1 - clamp(d0 / 0.5)), 'z'); ringFx(c, 0.4 + 5 * easeOut(clamp(d0 / 0.5)), 0xffffff, 0.8 * (1 - clamp(d0 / 0.5)), 'y'); flashW = Math.max(flashW, 0.4 * (1 - clamp(d0 / 0.25))); if (d0 < 0.01) invert = 1; }
      if (launched) { const pts = []; for (let k = 0; k < 28; k++) pts.push(V3(0, 34.6, zc - k * 0.6)); ribP.set(pts, r * 1.15);
        for (let k = 0; k < 4; k++) { const zr = zc - 1.3 - k * 1.35; ringFx(V3(0, 34.6, zr), r * (1.4 + 0.55 * k), k % 2 ? 0x7a30ff : 0xff70d0, 0.75 * (1 - k / 4), 'z'); } }
      for (let b = 0; b < 5; b++) bolts.bolt(c, c.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(r * (1.5 + rnd(b * 3)))), { n: 5, jit: .25, w: 0.012, color: [0xc060ff, 0xff70d0, 0x9ad0ff][b % 3], seed: frame * 5 + b });
      shakeAmp = Math.max(shakeAmp, 0.1 + 0.1 * g2);
    }
    const fh = handW(G, 'L'); for (let b = 0; b < 2; b++) if (t > 8.8 && t < T.launch + 0.2) bolts.bolt(fh, fh.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).multiplyScalar(1.4)), { n: 3, jit: .12, w: 0.01, color: 0x9ad0ff, seed: frame * 7 + b });
  }
  // 激突(紫 vs 解): 白熱した火球と光の輪・衝撃波
  { const d = hit(T.clash, 2.4); if (d >= 0) { const P = V3(0, 34, -0.4); const k = clamp(d / 1.5); const r = 2.0 + 8 * easeOut(k); const fade = 1 - smooth(clamp((d - 0.3) / 1.2));
      fire.visible = true; fire.position.copy(P); fire.scale.setScalar(r); fire.material.uniforms.a.value = fade; fire.material.uniforms.time.value = tvid; haloE.visible = true; haloE.position.copy(P); haloE.scale.setScalar(r * 2.6); haloE.material.opacity = 0.45 * fade;
      ringFx(P, 42 * easeOut(clamp(d / 1.4)), 0xffffff, 0.9 * (1 - clamp(d / 1.4)), 'y'); ringFx(P, 36 * easeOut(clamp(d / 1.3)), 0xc070ff, 0.8 * (1 - clamp(d / 1.3)), 'z'); ringFx(P, 28 * easeOut(clamp((d - 0.1) / 1.2)), 0xffa050, 0.7 * (1 - clamp((d - 0.1) / 1.2)), 'y');
      lensSet(P, 0.45, 0.35 * (1 - clamp(d / 1.0)));
      for (let b = 0; b < 10; b++) { const dir = V3(rnd(b * 1.7) - .5, rnd(b * 2.9) - .5, rnd(b * 4.1) - .5).normalize(); bolts.bolt(P, P.clone().addScaledVector(dir, (6 + 14 * rnd(b * 5)) * easeOut(clamp(d / 0.5))), { n: 7, jit: .6, w: 0.03 * (1 - clamp(d / 2)) + 0.004, color: b % 2 ? 0xffe070 : 0xc060ff, seed: frame * 3 + b }); }
      flashW = Math.max(flashW, d < 0.03 ? 0.5 : 0.1 * (1 - clamp(d / 0.5))); shakeAmp = Math.max(shakeAmp, 1.0 * (1 - clamp(d / 1.6))); if (d < 0.02) invert = 1;
      fxLight.color.set(0xffd090); fxLight.position.copy(P); fxLight.intensity = 90 * (1 - clamp(d / 1.5)); } }
  // 着地
  { const d = hit(T.land, 0.7); if (d >= 0) { for (const z of [-4, 4]) { bolts.ring(V3(0, 0.1, z), 9 * easeOut(d / 0.7), 0.25 * (1 - d / 0.7) + 0.03, 0xffffff, frame + z, 26, 'y');
        for (let k = 0; k < 8; k++) { const a = rnd(k + z) * PI * 2; bolts.seg(V3(0, 0.08, z), V3(Math.cos(a) * 5, 0.08, z + Math.sin(a) * 5).lerp(V3(0, 0.08, z), 1 - easeOut(clamp(d / 0.3))), 0.12, 0x101018); } }
      shakeAmp = Math.max(shakeAmp, 0.7 * (1 - d / 0.7)); flashW = Math.max(flashW, 0.15 * (1 - d / 0.7)); } }
  // 証印(B案): 光の線で印を描く
  sigils(t, frame);
  if (false) { const f = handW(G, 'R').add(V3(0, 0.5, 0)); for (let b = 0; b < 4; b++) bolts.bolt(f, f.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(0.3 + 0.3 * rnd(b + frame))), { n: 3, jit: .06, w: 0.008, color: b % 2 ? 0xffffff : 0x9ad0ff, seed: frame * 3 + b }); }
  if ((t > 15.9 && t < 17.9) || (t > T.yDomSeal && t < 47.4)) { for (const sd of ['R', 'L']) { const f = handW(Y, sd); for (let b = 0; b < 6; b++) { const e = f.clone().add(V3(rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5, rnd(frame * 7 + b) - .5).normalize().multiplyScalar(0.3 + 0.4 * rnd(b + frame)));
      bolts.bolt(f, e, { n: 3, jit: .1, w: 0.012, color: 0xff1a38, seed: frame * 9 + b }); bolts.bolt(f, e, { n: 3, jit: .1, w: 0.005, color: 0x000000, seed: frame * 9 + b }); } } }
  if (t > 36.2 && t < 37.8) { const f = handW(G, 'L').add(V3(0, 0.5, 0)); for (let b = 0; b < 4; b++) bolts.bolt(f, f.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(0.3)), { n: 3, jit: .06, w: 0.008, color: 0x9ad0ff, seed: frame * 3 + b }); }
  // 領域展開(外から見た押し合い)
  { const dA = t - T.domG, dB = t - T.domY;
    if (t >= T.domG && t < T.shatter) { const wob = Math.sin(t * 3.4) * 0.5; const rA = kf(t, [[17.6, 0.01], [18.6, 9], [19.6, 8.4], [20.5, 7.2]]) + (t > 18.8 ? wob : 0); const rB = kf(t, [[17.9, 0.01], [18.9, 11], [19.8, 13], [20.5, 14.5]]) - (t > 18.8 ? wob : 0);
      shA.visible = true; shA.position.set(0, 0, -4); shA.scale.setScalar(Math.max(rA, 0.01)); if (t >= T.domY) { shB.visible = true; shB.position.set(0, 0, 4); shB.scale.setScalar(Math.max(rB, 0.01)); }
      if (t >= T.domY + 0.3) { const dC = 8, x = (dC * dC + rA * rA - rB * rB) / (2 * dC), rr = Math.sqrt(Math.max(0, rA * rA - x * x)), zc = -4 + x; const N = 24;
        for (let i = 0; i < N; i++) { const a0 = (i / N) * PI * 2, a1 = ((i + 1) / N) * PI * 2; bolts.bolt(V3(Math.cos(a0) * rr, Math.sin(a0) * rr + 0.0, zc), V3(Math.cos(a1) * rr, Math.sin(a1) * rr, zc), { n: 2, jit: 0.6, w: 0.22, color: i % 2 ? 0xaad0ff : 0xff8040, seed: frame * 3 + i }); }
        shakeAmp = Math.max(shakeAmp, 0.15); } }
    for (const [tt, ok] of [[T.domG, 1], [T.domY, 1]]) { const d = t - tt; if (d >= 0 && d < 0.4) { flashW = Math.max(flashW, 0.5 * (1 - d / 0.4)); shakeAmp = Math.max(shakeAmp, 0.5 * (1 - d / 0.4)); if (d < 0.04) invert = 1; } } }
  // 斬撃(shellを割る / 腕を断つ)
  const slash = (tt, a, b, w, col, dur) => { const d = t - tt; if (d < 0 || d > dur) return; const k = d / dur; const gr = clamp(d / 0.06); const e = a.clone().lerp(b, gr); const ww = w * Math.pow(1 - k, 1.4) * (0.4 + 0.6 * gr); bolts.seg(a, e, ww * 2.6, col); bolts.seg(a, e, ww, 0xffffff); flashW = Math.max(flashW, d < 0.06 ? 0.3 : 0); shakeAmp = Math.max(shakeAmp, 0.4 * (1 - k)); };
  const cres = (idx, tt, dur, c0, R, span, w, tilt, yaw, speed, dirz = -1) => { const d = t - tt; if (d < 0 || d > dur) return; const k = d / dur; const grow = clamp(d / 0.07); const ww = w * (0.35 + 0.65 * grow) * Math.pow(1 - k, 1.2);
    crescentFx(idx, V3(c0.x, c0.y, c0.z + dirz * speed * d), R * (0.7 + 0.3 * grow), span, ww, tilt, yaw, 0xff2a40, true); flashW = Math.max(flashW, d < 0.07 ? 0.25 : 0); shakeAmp = Math.max(shakeAmp, 0.4 * (1 - k)); };
  cres(1, T.cut, 0.7, V3(0, 2.6, 5), 16, 1.0, 0.8, 0, 0, 34);
  cres(2, T.slash2, 0.6, V3(0, 1.4, 3.2), 8, 1.0, 0.45, 0, 0, 26); cres(3, T.slash2 + 0.06, 0.55, V3(0, 1.9, 3.0), 6.5, 1.0, 0.34, 0.3, 0, 26);
  // 黒閃×5
  T.bf.forEach((tb, i) => { const d = t - tb; if (d < 0 || d > 1.1) return; const pos = bodyOf(G, 0.35); const big = [1.0, 1.05, 1.15, 1.3, 1.55][i]; bfD = d; bfPos.copy(pos);
    const r = (0.25 + 1.2 * easeOut(clamp(d / 0.3))) * big, op = 1 - smooth(clamp((d - 0.3) / 0.6)); bfBlack.position.copy(pos); bfBlack.scale.setScalar(r); bfBlack.material.opacity = op * 0.92; bfBlack.visible = true; bfRed.position.copy(pos); bfRed.scale.setScalar(r * 1.1); bfRed.material.opacity = op; bfRed.visible = true;
    const life = 1 - clamp(d / 0.8);
    for (let b = 0; b < 14 + i * 3; b++) { const a = rnd(b * 1.7 + i) * PI * 2, e = (rnd(b * 2.9) - .5) * 2.2; const dir = V3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)).normalize(); const to = pos.clone().addScaledVector(dir, (1.0 + rnd(b * 4.1) * 3.6) * easeOut(clamp(d / 0.22)) * big); const seed = b * 13 + frame + i * 5;
      bolts.bolt(pos, to, { n: 6, jit: .3, w: 0.1 * life + .02, color: 0xff1030, seed }); bolts.bolt(pos, to, { n: 6, jit: .3, w: 0.045 * life + .01, color: 0x000000, seed }); }
    bolts.ring(V3(pos.x, 0.1, pos.z), (3 + i * 1.2) * easeOut(clamp(d / 0.5)), 0.2 * (1 - clamp(d / 0.5)) + 0.02, 0xff2030, frame + i, 24, 'y');
    fxLight.color.set(0xff2040); fxLight.position.copy(pos); fxLight.intensity = (60 + i * 20) * Math.max(0, 1 - d * 2.2); invert = d < 0.004 ? 1 : 0; shakeAmp = Math.max(shakeAmp, (d < 0.5 ? 0.35 * (1 - d / 0.5) : 0) * big); });
  // 鮮血(腹を貫く)
  { const d = hit(T.pierce, 0.8); if (d >= 0) { const o = V3(0, 1.3, -5.6), e = V3(0, 1.3, -13); const life = 1 - d / 0.8; const gr = clamp(d / 0.08); const tip = o.clone().lerp(e, gr);
      bolts.seg(o, tip, 0.8 * life + 0.05, 0xff1030); bolts.seg(o, tip, 0.3 * life, 0xffffff); bolts.seg(o, tip, 0.15 * life + 0.02, 0x000000);
      for (let b = 0; b < 12; b++) { const dir = V3((rnd(b * 1.7) - .5) * 1.2, (rnd(b * 2.9) - .5), -(0.3 + rnd(b * 3.3))).normalize(); bolts.bolt(V3(0, 1.3, -8.0), V3(0, 1.3, -8.0).addScaledVector(dir, (1.5 + 3 * rnd(b)) * easeOut(clamp(d / 0.2))), { n: 4, jit: .3, w: 0.08 * life + 0.01, color: b % 2 ? 0xff1030 : 0x101010, seed: frame * 3 + b }); }
      flashW = Math.max(flashW, d < 0.05 ? 0.7 : 0.15 * life); shakeAmp = Math.max(shakeAmp, 0.6 * life); if (d < 0.004) invert = 1; fxLight.color.set(0xff2040); fxLight.position.set(0, 1.3, -7); fxLight.intensity = 70 * life; } }
  // 毒: 緑紫のスパーク
  if (t > T.poison && t < T.spearOn) { const c = bodyOf(G); for (let b = 0; b < 4; b++) bolts.bolt(c, c.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(0.6)), { n: 3, jit: .1, w: 0.03, color: b % 2 ? 0xa050e0 : 0x40e080, seed: frame * 3 + b }); }
  // 天逆鉾 → 領域を無効化
  { const d = hit(T.spearOn + 0.2, 1.1); if (d >= 0) { const c = V3(0.1, 0.3, -6.2); const k = clamp(d / 1.0);
      bolts.ring(c, 46 * easeOut(k), 0.25 * (1 - k) + 0.03, 0xaad0ff, frame, 44, 'y'); bolts.ring(V3(0, 1.4, -6.2), 46 * easeOut(k), 0.2 * (1 - k) + 0.03, 0xffffff, frame + 5, 44, 'z');
      flashW = Math.max(flashW, d < 0.08 ? 0.45 : 0.1 * (1 - k)); shakeAmp = Math.max(shakeAmp, 0.8 * (1 - k)); if (d < 0.02) invert = 1; fxLight.color.set(0xaad0ff); fxLight.position.set(0, 3, -6); fxLight.intensity = 60 * (1 - k); } }
  // 虎杖の突進の軌跡
  { const d = t - T.rush; if (d >= 0 && d < 0.8) { const s0 = V3(0, 1.4, -2.5), e = bodyOf(Y); for (let b = 0; b < 3; b++) bolts.bolt(s0.clone().add(V3(0, b * 0.35 - 0.35, 0)), e.clone().add(V3(0, b * 0.35 - 0.35, 0)), { n: 8, jit: 0.25, w: 0.07, color: b ? 0xff1030 : 0xffffff, seed: frame * 3 + b }); } }
  // 蒼の拳(カウンター)
  if (t > 32.9 && t < T.counter + 0.9) { const f = handW(G, 'L'); const g = clamp((t - 32.9) / 0.6); blueFist.visible = t < T.counter + 0.12; blueFist.position.copy(f); blueFist.scale.setScalar(0.1 + 0.55 * g);
    for (let b = 0; b < 8; b++) bolts.bolt(f, f.clone().add(V3(rnd(frame + b) - .5, rnd(frame * 3 + b) - .5, rnd(frame * 5 + b) - .5).normalize().multiplyScalar(0.7 * g)), { n: 3, jit: .1, w: 0.05, color: b % 2 ? 0x4aa8ff : 0xffffff, seed: frame * 3 + b }); }
  { const d = hit(T.counter, 1.2); if (d >= 0) { const pos = V3(0, 1.45, -5.9); bfD = d; bfPos.copy(pos); const r = 0.4 + 2.6 * easeOut(clamp(d / 0.35)), op = 1 - smooth(clamp((d - 0.4) / 0.7));
      bfBlack.position.copy(pos); bfBlack.scale.setScalar(r * 0.7); bfBlack.material.opacity = op; bfBlack.visible = true; bfRed.material.color.set(0x4aa8ff); bfRed.position.copy(pos); bfRed.scale.setScalar(r); bfRed.material.opacity = op; bfRed.visible = true;
      for (let b = 0; b < 22; b++) { const dir = V3(rnd(b * 1.7) - .5, (rnd(b * 2.9) - .5), rnd(b * 4.1) - .1).normalize(); bolts.bolt(pos, pos.clone().addScaledVector(dir, (2 + 6 * rnd(b * 5)) * easeOut(clamp(d / 0.2))), { n: 6, jit: .45, w: 0.14 * (1 - clamp(d / 1.0)) + 0.01, color: b % 3 ? 0x4aa8ff : (b % 2 ? 0xff1030 : 0x000000), seed: frame * 3 + b }); }
      bolts.ring(V3(0, 0.1, -5.9), 12 * easeOut(clamp(d / 0.6)), 0.3 * (1 - clamp(d / 0.6)) + 0.02, 0x4aa8ff, frame, 30, 'y');
      flashW = Math.max(flashW, d < 0.02 ? 0.6 : 0.12 * (1 - clamp(d / 0.6))); shakeAmp = Math.max(shakeAmp, 1.0 * (1 - clamp(d / 0.9))); if (d < 0.02) invert = 1; fxLight.color.set(0x4aa8ff); fxLight.position.copy(pos); fxLight.intensity = 50 * (1 - clamp(d / 0.8)); } }
  if (t < T.counter || t > T.counter + 1.3) bfRed.material.color.set(0xff1030);
  // 五条の領域展開(一足早い)
  { const d = hit(T.domG2, 0.9); if (d >= 0) { shA.visible = true; shA.position.set(0, 0, -7.4); shA.scale.setScalar(0.5 + 70 * easeOut(clamp(d / 0.8))); shA.children[0].material.uniforms.a.value = 1.0 - smooth(clamp((d - 0.45) / 0.45)); flashW = Math.max(flashW, d < 0.12 ? 0.9 : 0.4 * (1 - d / 0.9)); shakeAmp = Math.max(shakeAmp, 0.7 * (1 - d / 0.9)); if (d < 0.06) invert = 1; } }
  // 領域G内の脈動
  if (t > T.domG2 + 0.4 && t < T.domEnd) { const p = Math.sin(t * 2.4); flashW = Math.max(flashW, 0.04 * Math.max(0, p)); }
  lateFx(t, tvid, frame);
}

// ---------- カメラ ----------
const UP = V3(0, 1, 0), UPZ = V3(0, 0, -1);
function orbit(c, r, h, a0, a1, t, t0, t1) { const a = lerp(a0, a1, clamp((t - t0) / (t1 - t0))); return V3(c.x + Math.sin(a) * r, h, c.z + Math.cos(a) * r); }
let bd = null;
function shot(t, tvid) {
  bd = null;
  if (q.has('cam')) { const c = q.get('cam').split(',').map(Number); camera.up.set(0, 1, 0); camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]); camera.fov = c[6] || 50; camera.updateProjectionMatrix(); return; }
  let p, l, fov = 50, up = UP.clone(), roll = 0, sh = 0;
  const gh = head(G), yh = head(Y), gp = G.root.position, yp = Y.root.position, gb = bodyOf(G), yb = bodyOf(Y);
  const mz = (gp.z + yp.z) / 2;
  if (t < 3) { p = V(kf(t, [[0, [0, 150, 70]], [3, [5, 38, 21]]], easeOut)); l = V(kf(t, [[0, [0, 0, 0]], [3, [0, 28, -8]]], easeOut)); fov = 62; }
  else if (t < 4.8) { p = V(kf(t, [[3, [2.2, 31.6, -23.2]], [4.8, [1.2, 31.4, -24.6]]], lin)); l = gh.clone().add(V3(0, -0.05, 0)); fov = 40; sh = 0.02; roll = 0.05; }
  else if (t < 6.0) { p = V(kf(t, [[4.8, [-1.6, 32.2, 23.4]], [6.0, [-1.0, 32.0, 24.6]]], lin)); l = yh.clone(); fov = 40; sh = 0.03; roll = -0.05; }
  else if (t < 7.6) { p = V(kf(t, [[6.0, [10, 32, -2]], [7.6, [17, 38, 0]]], lin)); l = V3(0, 35, 0); fov = 58; sh = 0.12; roll = 0.1; }
  else if (t < 9.4) { p = V(kf(t, [[7.6, [3, 33.8, 16]], [9.4, [2.2, 33.6, 12.5]]], lin)); l = V3(0, 34.8, -4); fov = 52; sh = 0.03; roll = 0.08; }
  else if (t < 9.9) { p = V(kf(t, [[9.4, [-3, 35.6, -15]], [9.9, [-2.6, 35.3, -12]]], lin)); l = V3(0, 34.6, -2); fov = 50; sh = 0.05; roll = -0.08; }
  else if (t < 10.6) { p = V(kf(t, [[9.9, [-4.2, 35.4, -9.5]], [10.6, [-3.2, 35.2, -8.6]]], lin)); l = V3(0, 34.6, -5); fov = 40; sh = 0.06; roll = -0.1; }
  else if (t < 11.6) { p = V(kf(t, [[10.6, [0, 54, 46]], [11.6, [0, 49, 38]]], lin)); l = V(kf(t, [[10.6, [0, 34, -2]], [11.6, [0, 34, -2]]], lin)); fov = 68; sh = 0.12; }
  else if (t < 12.4) { p = V(kf(t, [[11.6, [17, 36, 6]], [12.4, [14, 35.5, 6]]], lin)); l = V3(0, 34, 0); fov = 50; sh = 0.15; roll = 0.1; }
  else if (t < 13.9) { p = V(kf(t, [[12.4, [10, 30, 4]], [13.9, [7, 4, 5]]], lin)); l = V(kf(t, [[12.4, [0, 34, 0]], [13.9, [0, 3, -1]]], lin)); fov = 58; sh = 0.1; roll = -0.1; }
  else if (t < 14.5) { p = V3(9, 1.6, 8); l = V3(0, 1.3, -1); fov = 56; sh = 0.2 * (14.5 - t); }
  else if (t < 15.4) { const h = handW(G, 'R'); p = h.clone().add(V3(0.25, 0.6, 1.6)); l = h.clone().add(V3(0, 0.5, 0)); fov = 28; sh = 0.006; bd = [l, p]; }
  else if (t < 15.9) { p = V(kf(t, [[15.4, [0.2, 2.2, -2.4]], [15.9, [2.2, 2.0, 0.6]]], lin)); l = V3(0, 1.5, -4); fov = 46; sh = 0.01; }
  else if (t < 16.9) { const h = handW(Y, 'R').add(handW(Y, 'L')).multiplyScalar(0.5); p = h.clone().add(V3(0, 0.3, -1.6)); l = h.clone().add(V3(0, 0.25, 0)); fov = 30; sh = 0.008; bd = [l, p]; }
  else if (t < 17.6) { p = V(kf(t, [[16.9, [10, 3.2, 1]], [17.6, [11, 3.6, 0.5]]], lin)); l = V3(0, 1.0, 0); fov = 52; sh = 0.01; }
  else if (t < 19.0) { p = orbit(V3(0, 0, 0), 18, 4.5, 0, 1.9, t, 17.6, 19.0); l = V3(0, 3, 0); fov = 56; sh = 0.1; roll = 0.1; }
  else if (t < 20.5) { p = V3(0, 48, 0.01); l = V3(0, 0, 0); up = UPZ.clone(); fov = 52; sh = 0.06; }
  else if (t < 21.2) { p = V3(3, 10, 17); l = V3(0, 2.5, -4); fov = 60; sh = 0.3; roll = 0.06; }
  else if (t < 21.9) { p = V(kf(t, [[21.2, [-7, 2.4, -7]], [21.9, [-6, 2.0, -4]]], lin)); l = V(kf(t, [[21.2, [0, 12, 50]], [21.9, [0, 9, 48]]], lin)); fov = 74; sh = 0.04; }
  else if (t < 22.0) { p = V3(3.4, 1.7, 1.4); l = V3(0, 1.4, -3.6); fov = 48; sh = 0.03; }
  else if (t < 22.7) { const as = armState(t); p = V(kf(t, [[22.0, [2.5, 4.2, 5.5]], [22.7, [-2.6, 3.8, 0.8]]], lin)); l = as ? as.p.clone() : gb.clone(); fov = 50; sh = 0.1; roll = 0.1; }
  else if (t < 23.4) { p = V(kf(t, [[22.7, [15, 3.6, -1.5]], [23.4, [12, 3.0, -1.0]]], lin)); l = V3(0, 1.6, -1.2); fov = 58; sh = 0.06; }
  else if (t < 24.1) { p = V3(4.8, 1.8, mz + 0.4); l = V3(0, 1.5, mz); fov = 50; sh = 0.2; roll = 0.06; }
  else if (t < 24.8) { p = yp.clone().add(V3(0.9, 0.9, 2.3)); l = gb.clone(); fov = 52; sh = 0.2; roll = -0.1; }
  else if (t < 25.5) { p = gh.clone().add(V3(-1.3, 0.3, -1.2)); l = gb.clone().add(V3(0, 0.2, 0)); fov = 46; sh = 0.25; roll = 0.12; }
  else if (t < 26.2) { p = V(kf(t, [[25.5, [-5, 9, mz + 1]], [26.2, [-3.5, 5.5, mz + 0.6]]], lin)); l = gb.clone(); fov = 54; sh = 0.25; roll = -0.08; }
  else if (t < 27.0) { p = gb.clone().add(V3(2.2, 0.3, 3.0)); l = gb.clone(); fov = 38; sh = 0.4; roll = 0.2; }
  else if (t < 28.5) { p = V(kf(t, [[27.0, [4.2, 1.5, -3.5]], [28.5, [3.6, 1.8, -10.5]]], lin)); l = V3(0, 1.3, -8.2); fov = 50; sh = 0.1; }
  else if (t < 29.8) { p = gh.clone().add(V3(0.7, 0.05, 1.7)); l = gh.clone(); fov = 36; sh = 0.04; }
  else if (t < 30.6) { const h = handW(G, 'L'); p = h.clone().add(V3(0.6, 0.35, 1.5)); l = h.clone().add(V3(0, 0.5, 0.4)); fov = 40; sh = 0.2; }
  else if (t < 32.8) { p = orbit(gb, 5.2, 1.8, 0.3, 2.9, t, 30.6, 32.8); l = gb.clone(); fov = 48; sh = 0.02; }
  else if (t < 33.4) { p = yp.clone().add(V3(0.6, 1.5, 3.6)); l = V3(0, 1.4, -6); fov = 60; sh = 0.15; roll = 0.1; }
  else if (t < 33.7) { p = V3(3.6, 1.7, -4.8); l = V3(0, 1.5, -5.9); fov = 46; sh = 0.3; roll = 0.15; }
  else if (t < 35.2) { p = V(kf(t, [[33.7, [3.5, 1.8, -7]], [35.2, [3.5, 2.5, -2]]], lin)); l = yb.clone(); fov = 52; sh = 0.25; roll = -0.14; }
  else if (t < 36.2) { p = yh.clone().add(V3(0.1, 0.05, -1.15)); l = yh.clone(); fov = 32; sh = 0.015; }
  else if (t < 37.5) { const h = handW(G, 'L'); p = h.clone().add(V3(-0.1, 0.45, 1.0)); l = h.clone().add(V3(0, 0.4, 0)); fov = 30; sh = 0.008; }
  else if (t < T.simple) { p = orbit(gb, 9, 3, 0, 1.2, t, 37.5, T.simple); l = gb.clone(); fov = 52; sh = 0.2; roll = 0.12; }
  else if (t < T.amp) { p = orbit(yb, 6.2, 2.0, 0.9, 2.4, t, T.simple, T.amp); l = yb.clone(); fov = 50; sh = 0.04; }
  else if (t < 39.9) { p = yb.clone().add(V3(2.0, 0.3, -2.4)); l = yb.clone(); fov = 40; sh = 0.04; roll = 0.06; }
  else if (t < 41.5) { const m = yb.clone().lerp(gb, 0.5); p = orbit(m, 5.2, 1.7, 0.2, 2.6, t, 39.9, 41.5); l = m; fov = 48; sh = 0.03; }
  else if (t < 43.0) { const m = yb.clone().lerp(gb, 0.5); p = m.clone().add(V3(4.2, -0.5, 0.6)); l = m.clone().add(V3(0, 0.3, 0)); fov = 44; sh = 0.04; roll = -0.1; }
  else if (t < 44.3) { const m = yb.clone().lerp(gb, 0.5); p = m.clone().add(V3(-1.5, 0.4, -3.4)); l = m; fov = 40; sh = 0.04; roll = 0.08; }
  else if (t < T.redHit) { const m = yb.clone().lerp(gb, 0.5); p = V3(1.4, 1.6, gb.z - 2.6); l = V3(0, 1.3, yb.z); fov = 44; sh = 0.08; roll = 0.05; }
  else if (t < T.yDomSeal) { p = yb.clone().add(V(kf(t, [[T.redHit, [4, 0.9, -3]], [T.yDomSeal, [6.5, 1.8, -4.5]]], easeOut))); l = yb.clone(); fov = 50; sh = 0.1; roll = 0.1; }
  else if (t < T.yDomShell) { const h = handW(Y, 'R').add(handW(Y, 'L')).multiplyScalar(0.5); p = h.clone().add(V3(0, 0.2, -1.1)); l = h.clone(); fov = 32; sh = 0.03; bd = [l, p]; }
  else if (t < T.muku) { p = orbit(yb, 7.5, 2.0, 0.5, 1.6, t, T.yDomShell, T.muku); l = yb.clone(); fov = 55; sh = 0.1; roll = -0.08; }
  else if (t < T.yDown) { p = yh.clone().add(V3(0.1, 0.0, -1.2)); l = yh.clone(); fov = 32; sh = 0.04; }
  else if (t < T.reverse) { p = yp.clone().add(V3(2.6, 0.5, -2.6)); l = yb.clone().add(V3(0, -0.2, 0)); fov = 46; sh = 0.05; roll = 0.12; }
  else if (t < T.yRise) { p = yb.clone().add(V3(1.8, 0.9, -2.8)); l = yb.clone(); fov = 42; sh = 0.03; }
  else if (t < T.tele) { const m = yb.clone().lerp(gb, 0.5); p = V3(2.8, 1.8, gb.z - 3.2); l = V3(0, 1.4, m.z + 1); fov = 52; sh = 0.02; roll = -0.05; }
  else if (t < T.reappear) { p = V3(16, 2.6, 2.4); l = V3(0, 1.4, 2.4); fov = 60; sh = 0.2; roll = 0.12; }
  else if (t < 52.55) { const k = clamp((t - T.reappear) / 0.8); p = V3(2.0 - 0.3 * k, 0.3, yp.z + 3.2 - 0.9 * k); l = V3(0, 2.3, 3.6); fov = 50 - 4 * k; sh = 0.02 + 0.2 * clamp((t - T.purpleFire) / 0.15); roll = -0.06; }
  else if (t < 52.9) { const zf = PUR.z0 + PUR.v * (t - T.purpleFire); p = V3(12, 2.2, zf + 1); l = V3(0, 1.8, zf + 5); fov = 46; sh = 0.12; roll = 0.08; }
  else if (t < T.hole) { p = V3(8, 2.2, 10); l = V3(0, 2.2, HZ); fov = 46; sh = 0.08; roll = -0.05; }
  else if (t < 54.4) { const k = clamp((t - T.hole) / 1.0); p = V3(8 + k, 2.2 + 0.8 * k, 12); l = V3(0, 2.8, HZ); fov = 46 - 4 * k; sh = 0.04; roll = -0.05; }
  else if (t < T.dawn) { p = V3(3.2, 3.4, gp.z - 5); l = V3(0, 3.0, HZ); fov = 36; sh = 0.02; }
  else { const e = T.dawn; p = V(kf(t, [[e, [3.2, 3.4, -1.4]], [END, [0, 95, 5]]], smooth)); l = V(kf(t, [[e, [0, 3, HZ]], [END, [0, 4, 20]]], lin)); fov = 55; sh = 0.01; }
  const total = Math.max(sh, shakeAmp);
  camera.up.copy(up); if (up.z === 0 && roll) camera.up.applyAxisAngle(V3(0, 0, 1), roll);
  camera.position.copy(p).add(shake(tvid, total)); camera.lookAt(l); camera.fov = fov; camera.updateProjectionMatrix();
  if (bd) { const dir = bd[0].clone().sub(bd[1]).normalize(); backdrop.visible = true; backdrop.position.copy(bd[0]).addScaledVector(dir, 0.9); backdrop.lookAt(camera.position); handLight.position.copy(bd[0]).addScaledVector(dir, -0.5).add(V3(0, 0.4, 0)); handLight.intensity = 0.5; } else { backdrop.visible = false; handLight.intensity = 0; }
}

// ---------- ポスト ----------
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.55, 0.82); composer.addPass(bloom);
composer.addPass(new OutputPass());
const post = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uSat: { value: 1 }, uFlash: { value: 0 }, uInv: { value: 0 }, uFade: { value: 0 }, uCA: { value: 0.0007 }, uAsp: { value: W / H }, uC: { value: new THREE.Vector2(.5, .5) }, uR: { value: 0 }, uStr: { value: 0 }, uVig: { value: 0.45 }, uLC: { value: new THREE.Vector2(.5, .5) }, uLR: { value: 0.3 }, uLS: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uSat,uFlash,uInv,uFade,uCA,uAsp,uR,uStr,uVig,uLR,uLS; uniform vec2 uC,uLC; varying vec2 vUv;
  void main(){ vec2 uv=vUv; { vec2 dl=uv-uLC; dl.x*=uAsp; float rl=length(dl); float kl=uLS*smoothstep(uLR,0.0,rl); uv=uLC+(uv-uLC)*(1.0-kl); } vec2 d=uv-uC; d.x*=uAsp; float r=length(d); float ring=exp(-pow((r-uR)/0.09,2.0))*uStr;
    vec2 dir=normalize(d+1e-5); dir.x/=uAsp; uv+=dir*ring*0.07; vec2 ca=dir*(uCA+ring*0.01)*(0.5+r);
    vec3 col; col.r=texture2D(tDiffuse,uv+ca).r; col.g=texture2D(tDiffuse,uv).g; col.b=texture2D(tDiffuse,uv-ca).b;
    float l=dot(col,vec3(.299,.587,.114)); col=mix(vec3(l),col,uSat); col=mix(col,vec3(1.0-l*1.1),uInv); col+=uFlash;
    float v=1.0-smoothstep(0.5,1.1,length((vUv-.5)*vec2(1.0,.6))); col*=mix(1.0,v,uVig); col*=1.0-uFade; gl_FragColor=vec4(col,1.0);} `
});
composer.addPass(post);
const SHOCKS = [T.clash, T.land, T.cut, T.shatter, T.counter, T.cancel, T.domG, T.domY, T.domG2, T.redHit, T.purpleFire, T.hole, ...T.bf];
function updatePost(t, tvid) {
  const u = post.uniforms;
  u.uSat.value = kf(t, [[T.poison, 1], [T.poison + 0.3, 0.55], [T.heal + 1.6, 0.55], [T.heal + 2.6, 1], [T.domG2 + 0.4, 1], [T.domG2 + 1.0, 0.8], [T.domEnd, 0.8], [T.domEnd + 0.5, 1]]);
  u.uInv.value = invert; u.uFlash.value = flashW * (invert ? 0 : 1);
  u.uFade.value = kf(tvid, [[0, 1], [0.25, 0], [VID_DUR - 1.0, 0], [VID_DUR, 1]], lin);
  u.uCA.value = 0.0007 + caBoost; u.uStr.value = 0;
  for (const tc of SHOCKS) { const d = t - tc; if (d >= 0 && d < 0.8) { const pos = tc === T.clash ? V3(0, 34, 0) : tc === T.counter ? V3(0, 1.4, -5.9) : tc === T.domG2 ? V3(0, 1.5, -7.4) : tc === T.redHit ? V3(0, 1.4, 2.2) : tc === T.purpleFire ? V3(0, 1.8, 4.2) : tc === T.hole ? V3(0, 1.8, HZ) : tc >= 23 && tc < 27 ? bfPos : V3(0, 2, 0); const sp = pos.clone().project(camera); u.uC.value.set(sp.x * .5 + .5, sp.y * .5 + .5); u.uR.value = d * 1.4; u.uStr.value = 1.0 * (1 - d / 0.8); u.uCA.value = 0.0007 + 0.011 * (1 - d / 0.8); } }
  if (lensS > 0) { const sp = lensC.clone().project(camera); u.uLC.value.set(sp.x * .5 + .5, sp.y * .5 + .5); u.uLR.value = lensR; u.uLS.value = lensS; } else u.uLS.value = 0;
  bloom.strength = (bd ? 0.2 : 0.55) + Math.min(0.8, flashW * 0.8);
}
// ---------- 画面効果(スピード線のみ。文字は一切出さない) ----------
const SPEED = [[6.0, 0.6], [10.6, 0.5], [11.6, 0.9], [13.0, 0.9], [T.land, 0.3], [T.domG, 0.3], [T.domY, 0.3], [T.cut, 0.3], [T.slash2, 0.3], [22.4, 0.5], ...T.bf.map(b => [b, 0.2]), [T.pierce, 0.3], [T.cancel, 0.4], [T.rush, 0.6], [T.counter, 0.4], [33.7, 1.3], [T.domG2, 0.5]];
function drawSpeed(c, t, tvid) {
  for (const [ts, dur] of SPEED) { const d = t - ts; if (d < 0 || d > dur) continue; const k = d / dur; const fr = Math.floor(tvid * 24);
    c.save(); c.translate(W / 2, H * 0.5); c.strokeStyle = '#fff'; c.lineCap = 'round';
    for (let i = 0; i < 70; i++) { const a = rnd(i * 3.1 + fr) * PI * 2, r0 = (0.28 + rnd(i * 1.9 + fr * 0.3) * 0.2) * H, r1 = H * (0.7 + rnd(i * 7.3) * 0.2);
      c.globalAlpha = 0.5 * (1 - k); c.lineWidth = (2 + rnd(i * 5.5) * 6) * SC; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 0.9); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); }
    c.restore(); }
}

// ---------- 最後の呼びかけ(社長の指示で、この場面だけ文字を出す) ----------
function drawEnd(c, tvid) {
  const t0 = VID_DUR - 4.0, t1 = VID_DUR - 1.1; if (tvid < t0 || tvid > t1 + 0.4) return;
  const a = smooth(clamp((tvid - t0) / 0.6)) * (1 - smooth(clamp((tvid - t1) / 0.4)));
  const lines = ['次の対決は誰と誰?', 'チャンネル登録して待て。']; const fs = 72 * SC;
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${fs}px "IPAGothic", sans-serif`; c.lineJoin = 'round'; c.globalAlpha = a;
  lines.forEach((tx, i) => { const y = H * 0.74 + i * fs * 1.45 + (1 - a) * 24 * SC; c.lineWidth = 14 * SC; c.strokeStyle = '#050010'; c.strokeText(tx, W / 2, y); c.fillStyle = i ? '#ffe070' : '#ffffff'; c.fillText(tx, W / 2, y); });
  c.restore();
}

// ---------- 1フレーム ----------
function renderAt(tvid) {
  const t = tau(tvid);
  updateScene(t, tvid); updateSpear(t); updateFx(t, tvid); updateParts(t); shot(t, tvid); updateSoft(t); updatePost(t, tvid);
  composer.render();
  ctx2.drawImage(renderer.domElement, 0, 0, W, H);
  drawSpeed(ctx2, t, tvid);
  drawEnd(ctx2, tvid);
}
window.renderAt = renderAt;
window.frameDataURL = () => out2d.toDataURL('image/jpeg', 0.93);
window.VID_DUR = VID_DUR; window.dbg = (tt) => { renderAt(tt); return { gR: handW(G, 'R').toArray(), gL: handW(G, 'L').toArray(), yR: handW(Y, 'R').toArray(), yL: handW(Y, 'L').toArray(), gh: head(G).toArray(), yh: head(Y).toArray() }; };
window.READY = true;
if (q.has('t')) renderAt(parseFloat(q.get('t')));
else if (!q.has('render')) { const t0 = parseFloat(q.get('from') ?? '0'), s = performance.now(); (function loop() { const t = (t0 + (performance.now() - s) / 1000) % VID_DUR; renderAt(t); requestAnimationFrame(loop); })(); }
