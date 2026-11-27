// マイクラ風ブロックキャラ(ドット絵テクスチャは自作)
import * as THREE from 'three';

export const PX = 0.06; // 1ドット = 6cm(身長32ドット=1.92m)

function tex(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; fn(x, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const dot = (x, c, xx, yy, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(xx, yy, w, h); };
const noise = (x, w, h, base, amt, seed = 1) => { // 微妙なピクセルノイズで質感を出す
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const r = Math.sin((i * 12.9898 + j * 78.233 + seed * 37.7) * 1.7) * 43758.5453; const f = (r - Math.floor(r) - 0.5) * amt;
    const c = new THREE.Color(base); c.offsetHSL(0, 0, f); dot(x, '#' + c.getHexString(), i, j);
  }
};

// 面の順: left(+x) right(-x) top bottom front(+z) back(-z)
const FACES = ['left', 'right', 'top', 'bottom', 'front', 'back'];
function part(sw, sh, sd, paint, pivotTop = false, mats = []) {
  const dims = { left: [sd, sh], right: [sd, sh], top: [sw, sd], bottom: [sw, sd], front: [sw, sh], back: [sw, sh] };
  const m = FACES.map(f => { const [w, h] = dims[f]; const mm = new THREE.MeshLambertMaterial({ map: tex(w, h, (x) => paint(f, x, w, h)) }); mats.push(mm); return mm; });
  const g = new THREE.BoxGeometry(sw * PX, sh * PX, sd * PX);
  if (pivotTop) g.translate(0, -sh * PX / 2, 0);
  return new THREE.Mesh(g, m);
}

// ---------- 虎杖(モジュロ) ----------
const PINK = '#ec8aa0', PINK2 = '#d4708a', SKIN = '#f0c8a8', NAVY = '#1b2a8a', NAVY2 = '#16227a', RED = '#c0202e';
const yujiPaint = {
  head(f, x, w, h) {
    dot(x, SKIN, 0, 0, w, h);
    if (f === 'top') { noise(x, w, h, PINK, 0.12, 3); dot(x, '#101018', 1, 2); dot(x, '#101018', 4, 5); dot(x, '#101018', 6, 1); }
    else if (f === 'front') {
      noise(x, w, 2, PINK, 0.12, 4); dot(x, PINK, 0, 2); dot(x, PINK, 1, 2); dot(x, PINK2, 3, 2); dot(x, PINK, 4, 2); dot(x, PINK, 6, 2); dot(x, PINK, 7, 2);
      dot(x, '#2a1810', 1, 3, 2, 1); dot(x, '#2a1810', 5, 3, 2, 1); dot(x, '#2a1810', 3, 2); // 太い眉
      dot(x, '#ffffff', 1, 4, 2, 2); dot(x, '#ffffff', 5, 4, 2, 2);
      dot(x, '#6b3a1c', 2, 4, 1, 2); dot(x, '#6b3a1c', 5, 4, 1, 2); dot(x, '#1a0d06', 2, 5); dot(x, '#1a0d06', 5, 5);
      dot(x, '#b8806a', 3, 6, 2, 1); // 口
      dot(x, '#dfae92', 0, 5); dot(x, '#dfae92', 7, 5); // 頬の影(モジュロ=少し年齢を感じる)
    } else if (f === 'back') { noise(x, w, 6, PINK, 0.12, 5); }
    else if (f === 'left' || f === 'right') { noise(x, w, 3, PINK, 0.12, 6); dot(x, PINK, 0, 3); dot(x, PINK, w - 1, 3); dot(x, '#dfae92', 3, 4, 1, 2); }
  },
  body(f, x, w, h) {
    noise(x, w, h, NAVY, 0.08, 7);
    if (f === 'front') {
      dot(x, RED, 0, 0, w, 2); dot(x, SKIN, 3, 0, 2, 1); dot(x, RED, 2, 2, 1, 1); dot(x, RED, 5, 2, 1, 1);
      dot(x, '#e8c020', 3, 3); dot(x, '#e8c020', 4, 5); dot(x, '#101a60', 3, 4, 2, 8);
    } else if (f === 'back') { dot(x, RED, 0, 0, w, 2); }
    else dot(x, RED, 0, 0, w, 1);
  },
  arm(f, x, w, h) {
    noise(x, w, h, NAVY, 0.08, 8);
    dot(x, '#f4f4f4', 0, 9, w, 1); dot(x, RED, 0, 10, w, 1); dot(x, SKIN, 0, 11, w, 1);
    dot(x, RED, 0, 0, w, 1);
  },
  leg(f, x, w, h) { noise(x, w, h, NAVY2, 0.08, 9); dot(x, '#0c0c18', 0, 10, w, 2); },
};
// ---------- 宿儺 ----------
const SK = '#ecc2a6', SK2 = '#d4a088', BK = '#101014', HAIR = '#b0202a', WH = '#f4f2ee';
const sukunaPaint = {
  head(f, x, w, h) {
    dot(x, SK, 0, 0, w, h);
    if (f === 'top') { noise(x, w, h, HAIR, 0.14, 10); }
    else if (f === 'front') {
      noise(x, w, 2, HAIR, 0.14, 11); dot(x, HAIR, 0, 2); dot(x, HAIR, 7, 2); dot(x, HAIR, 2, 2); dot(x, HAIR, 5, 2);
      dot(x, '#3a1010', 1, 3, 2, 1); dot(x, '#3a1010', 5, 3, 2, 1); dot(x, '#3a1010', 3, 3, 2, 0);
      dot(x, '#ffffff', 1, 4, 2, 1); dot(x, '#ffffff', 5, 4, 2, 1); dot(x, '#c01020', 2, 4); dot(x, '#c01020', 5, 4); // 目
      dot(x, '#ffffff', 1, 5); dot(x, '#ffffff', 6, 5); dot(x, '#c01020', 1, 5); dot(x, '#c01020', 6, 5); // 下の2つの目
      dot(x, BK, 0, 5); dot(x, BK, 7, 5); dot(x, BK, 0, 6); dot(x, BK, 7, 6); dot(x, BK, 3, 3); dot(x, BK, 4, 3); // 顔の紋様
      dot(x, '#7a2020', 2, 6, 4, 1); dot(x, WH, 2, 6); dot(x, WH, 3, 6); dot(x, WH, 4, 6); dot(x, WH, 5, 6); // にやり笑い
    } else if (f === 'back') { noise(x, w, 6, HAIR, 0.14, 12); }
    else { noise(x, w, 3, HAIR, 0.14, 13); dot(x, SK2, 3, 4, 1, 2); }
  },
  body(f, x, w, h) {
    dot(x, SK, 0, 0, w, h);
    if (f === 'front') {
      dot(x, SK2, 3, 1, 2, 4); dot(x, SK2, 1, 5, 6, 1); dot(x, SK2, 3, 6, 2, 5); dot(x, SK2, 1, 8, 6, 1);
      dot(x, BK, 0, 0, 2, 1); dot(x, BK, 6, 0, 2, 1); dot(x, BK, 1, 1); dot(x, BK, 6, 1); dot(x, BK, 2, 2); dot(x, BK, 5, 2); dot(x, BK, 3, 3); dot(x, BK, 4, 3); // 胸の紋様
      dot(x, WH, 0, 9, w, 3); dot(x, BK, 0, 9, w, 1); dot(x, '#c8c4bc', 2, 11, 1, 1); dot(x, '#c8c4bc', 5, 11, 1, 1); // 袴の帯
    } else if (f === 'back') { dot(x, SK2, 3, 2, 2, 7); dot(x, WH, 0, 9, w, 3); dot(x, BK, 0, 9, w, 1); }
    else { dot(x, WH, 0, 9, w, 3); }
  },
  arm(f, x, w, h) {
    dot(x, SK, 0, 0, w, h); dot(x, BK, 0, 3, w, 1); dot(x, BK, 0, 8, w, 1); dot(x, SK2, 1, 5, 2, 2);
  },
  leg(f, x, w, h) { dot(x, WH, 0, 0, w, h); dot(x, '#cfcbc2', 1, 2, 1, 7); dot(x, '#cfcbc2', 3, 3, 1, 6); dot(x, '#3a3a40', 0, 10, w, 2); },
};

export function makeChar(paint, scene) {
  const C = { mats: [] };
  const root = new THREE.Group(); C.root = root;
  const hips = new THREE.Group(); hips.position.y = 12 * PX; root.add(hips); C.hips = hips;
  const mk = (a, b, c, d, pt = false) => part(a, b, c, d, pt, C.mats);
  const body = mk(8, 12, 4, paint.body); body.position.y = 6 * PX; hips.add(body); C.body = body;
  C.torso = new THREE.Group(); hips.add(C.torso); // 腰を中心に傾く
  hips.remove(body); body.position.y = 6 * PX; C.torso.add(body);
  const head = mk(8, 8, 8, paint.head); head.position.y = 12 * PX + 4 * PX; C.torso.add(head); C.head = head;
  const headPivot = new THREE.Group(); headPivot.position.y = 12 * PX; C.torso.add(headPivot); C.headPivot = headPivot;
  C.torso.remove(head); head.position.y = 4 * PX; headPivot.add(head);
  const mkArm = (sx) => { const g = new THREE.Group(); g.position.set(sx * 6 * PX, 12 * PX, 0); const a = mk(4, 12, 4, paint.arm, true); g.add(a); C.torso.add(g); return g; };
  C.armL = mkArm(1); C.armR = mkArm(-1);
  const mkLeg = (sx) => { const g = new THREE.Group(); g.position.set(sx * 2 * PX, 0, 0); const l = mk(4, 12, 4, paint.leg, true); g.add(l); hips.add(g); return g; };
  C.legL = mkLeg(1); C.legR = mkLeg(-1);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.4, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; root.add(sh); C.shadow = sh;
  scene.add(root); return C;
}
export const makeYuji = scene => makeChar(yujiPaint, scene);
export const makeSukuna = scene => makeChar(sukunaPaint, scene);

// ポーズ: Rf/Lf=腕を前に上げる量, Rab/Lab=腕を横に開く量, lr/ll=脚を前に出す量
export function setPose(C, s) {
  const d = (k, v) => (s[k] ?? v);
  const legLen = 12 * PX;
  const lr = d('lr', 0), ll = d('ll', 0);
  C.root.position.set(d('x', 0), d('y', 0), d('z', 0));
  C.root.rotation.set(0, d('yaw', 0), 0);
  const ko = d('ko', 0);
  let hy = legLen * Math.cos(Math.max(Math.abs(lr), Math.abs(ll)));
  C.hips.position.y = hy;
  C.hips.rotation.set(d('flip', 0), d('spin', 0), d('roll', 0));
  C.torso.rotation.set(d('lean', 0), d('twist', 0), 0);
  C.headPivot.rotation.set(d('headP', 0), d('headY', 0), 0);
  C.armR.rotation.set(-d('Rf', 0.05), 0, -d('Rab', 0.1));
  C.armL.rotation.set(-d('Lf', 0.05), 0, d('Lab', 0.1));
  C.legR.rotation.x = -lr; C.legL.rotation.x = -ll;
  if (ko !== 0) { C.root.rotation.x = -ko * Math.PI / 2; C.root.position.y += Math.abs(ko) * 0.14; }
  C.root.visible = d('vis', true);
}
export function setTint(C, hex, amt) { // 煤で暗くする等
  const c = new THREE.Color(0xffffff).lerp(new THREE.Color(hex), amt);
  C.mats.forEach(m => m.color.copy(c));
}
export function worldOf(obj, off = [0, 0, 0]) { return obj.localToWorld(new THREE.Vector3(...off)); }

// ================= 乙骨憂太 =================
const OSKIN = '#f0cdb0', OHAIR = '#16161e', OWH = '#f2f2f6', ONAVY = '#1a2040';
const okkotsuPaint = {
  head(f, x, w, h) {
    dot(x, OSKIN, 0, 0, w, h);
    if (f === 'top') noise(x, w, h, OHAIR, 0.1, 21);
    else if (f === 'front') {
      noise(x, w, 2, OHAIR, 0.1, 22); dot(x, OHAIR, 0, 2, 2, 1); dot(x, OHAIR, 3, 2, 2, 1); dot(x, OHAIR, 6, 2, 2, 1); dot(x, OHAIR, 1, 3);
      dot(x, '#ffffff', 1, 4, 2, 2); dot(x, '#ffffff', 5, 4, 2, 2); dot(x, '#101018', 2, 4, 1, 2); dot(x, '#101018', 5, 4, 1, 2);
      dot(x, '#6a5a78', 1, 6, 2, 1); dot(x, '#6a5a78', 5, 6, 2, 1); // 目の下のくま
      dot(x, '#b8806a', 3, 6, 2, 1);
    } else if (f === 'back') noise(x, w, 6, OHAIR, 0.1, 23);
    else { noise(x, w, 3, OHAIR, 0.1, 24); dot(x, OHAIR, 0, 3); dot(x, OHAIR, w - 1, 3); dot(x, '#dfae92', 3, 4, 1, 2); }
  },
  body(f, x, w, h) {
    noise(x, w, h, OWH, 0.05, 25);
    if (f === 'front') { dot(x, '#2a2a38', 0, 0, w, 1); dot(x, OSKIN, 3, 0, 2, 1); dot(x, '#2a2a38', 3, 1, 2, 11); dot(x, '#d8b040', 2, 3); dot(x, '#d8b040', 5, 3); dot(x, '#d8b040', 2, 6); dot(x, '#d8b040', 5, 6); }
    else dot(x, '#2a2a38', 0, 0, w, 1);
  },
  arm(f, x, w, h) { noise(x, w, h, OWH, 0.05, 26); dot(x, '#2a2a38', 0, 8, w, 1); dot(x, OSKIN, 0, 11, w, 1); },
  leg(f, x, w, h) { noise(x, w, h, ONAVY, 0.06, 27); dot(x, '#0c0c14', 0, 10, w, 2); },
};
export function makeOkkotsu(scene) {
  const C = makeChar(okkotsuPaint, scene);
  const sw = new THREE.Group(); C.armR.add(sw); sw.position.y = -12 * PX;
  const add = (w, h, d, y, col, basic) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), basic ? new THREE.MeshBasicMaterial({ color: col, toneMapped: false }) : new THREE.MeshLambertMaterial({ color: col })); m.position.y = y; sw.add(m); };
  add(0.07, 0.3, 0.07, -0.05, 0x101018); add(0.22, 0.05, 0.1, -0.22, 0xd8b040); add(0.06, 1.15, 0.025, -0.82, 0xe8f0ff, true);
  C.sword = sw; return C;
}
// ================= 鹿紫雲一 =================
const KHAIR = '#62e8d8', KHAIR2 = '#3ab8b2', KWH = '#f4f4f0';
const kashimoPaint = {
  head(f, x, w, h) {
    dot(x, '#eec8aa', 0, 0, w, h);
    if (f === 'top') noise(x, w, h, KHAIR, 0.12, 31);
    else if (f === 'front') {
      noise(x, w, 2, KHAIR, 0.12, 32); dot(x, KHAIR2, 0, 2); dot(x, KHAIR2, 7, 2); dot(x, KHAIR, 2, 2); dot(x, KHAIR, 5, 2); dot(x, KHAIR2, 3, 2);
      dot(x, '#1a3a44', 1, 3, 2, 1); dot(x, '#1a3a44', 5, 3, 2, 1);
      dot(x, '#ffffff', 1, 4, 2, 2); dot(x, '#ffffff', 5, 4, 2, 2); dot(x, '#30b8c8', 2, 4, 1, 2); dot(x, '#30b8c8', 5, 4, 1, 2); dot(x, '#0a2030', 2, 5); dot(x, '#0a2030', 5, 5);
      dot(x, '#ffd83a', 0, 5); dot(x, '#ffd83a', 0, 6); dot(x, '#ffd83a', 7, 5); dot(x, '#ffd83a', 7, 6); // 頬の雷模様
      dot(x, '#a8706a', 2, 6, 4, 1);
    } else if (f === 'back') noise(x, w, 6, KHAIR, 0.12, 33);
    else { noise(x, w, 3, KHAIR, 0.12, 34); dot(x, '#dfae92', 3, 4, 1, 2); }
  },
  body(f, x, w, h) {
    noise(x, w, h, KWH, 0.05, 35);
    if (f === 'front') { dot(x, '#c8c8c0', 3, 0, 2, 12); dot(x, '#ffb030', 1, 3, 1, 3); dot(x, '#ffb030', 6, 5, 1, 3); dot(x, '#3a3a40', 0, 9, w, 1); }
  },
  arm(f, x, w, h) { noise(x, w, h, KWH, 0.05, 36); dot(x, '#ffb030', 0, 4, w, 1); dot(x, '#eec8aa', 0, 11, w, 1); },
  leg(f, x, w, h) { noise(x, w, h, '#e6e6e8', 0.05, 37); dot(x, '#2a2a30', 0, 10, w, 2); },
};
export function makeKashimo(scene) {
  const C = makeChar(kashimoPaint, scene);
  const hm = new THREE.MeshLambertMaterial({ color: 0x62e8d8 }); C.mats.push(hm);
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(2 * PX, 3 * PX, 2 * PX), hm); m.position.set(sx * 2.6 * PX, 4 * PX + 8 * PX / 2 + 1.5 * PX, -0.5 * PX); m.rotation.z = -sx * 0.3; C.head.add(m); }
  return C;
}
// ================= リカ(参考画像に合わせた造形) =================
// 骨ばった頭+赤い口と長い牙 / 後頭部に放射状に伸びる白い腕の冠 / 肋骨の胴 / 長く太い腕と爪の大きな手 / 脚はなく黒い尾
const LAV = '#dcd8ea', LAV2 = '#b8b3cc', GRY = '#8f8aa6', BLK = '#14141a';
const lmCache = {};
const lm = hex => (lmCache[hex] ??= new THREE.MeshLambertMaterial({ color: hex, emissive: new THREE.Color(hex).multiplyScalar(hex === '#14141a' || hex === '#1c1c24' ? 0.05 : 0.6) }));
export function makeRika(scene) {
  const R = { mats: [] }; const root = new THREE.Group(); R.root = root;
  const solid = (w, h, d, col, pivotTop = false) => { const g = new THREE.BoxGeometry(w * PX, h * PX, d * PX); if (pivotTop) g.translate(0, -h * PX / 2, 0); return new THREE.Mesh(g, lm(col)); };
  const mk = (a, b, c, d, pt = false) => part(a, b, c, d, pt, R.mats);
  // --- 黒い尾(脚の代わり) ---
  const tail = new THREE.Group(); tail.position.y = 26 * PX; root.add(tail); R.tail = [];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group(); const seg = solid(6 - 0.55 * i, 3.4, 4.4 - 0.4 * i, i % 2 ? '#1c1c24' : BLK); seg.position.y = -1.7 * PX; g.add(seg);
    g.position.set(0, -i * 3 * PX, -(i * i) * 0.18 * PX); tail.add(g); R.tail.push(g);
  }
  // --- 腰・胴(肋骨) ---
  const waist = solid(6, 6, 4, GRY); waist.position.y = 29 * PX; root.add(waist);
  const ribs = (f, x, w, h) => {
    x.fillStyle = LAV; x.fillRect(0, 0, w, h);
    if (f === 'front') { for (let r = 1; r < h; r += 2) { x.fillStyle = LAV2; x.fillRect(1, r, w - 2, 1); } x.fillStyle = GRY; x.fillRect(Math.floor(w / 2) - 1, 0, 2, h); x.fillStyle = BLK; x.fillRect(0, 0, w, 1); }
    else if (f === 'back') { x.fillStyle = LAV2; for (let r = 1; r < h; r += 3) x.fillRect(2, r, w - 4, 1); x.fillStyle = GRY; x.fillRect(Math.floor(w / 2) - 1, 0, 2, h); }
    else { x.fillStyle = LAV2; x.fillRect(0, h - 3, w, 3); }
  };
  const torso = mk(10, 12, 5, ribs); torso.position.y = 38 * PX; root.add(torso); R.torso = torso;
  // --- 頭: 上顎+可動の下顎 ---
  const hp = new THREE.Group(); hp.position.y = 46 * PX; root.add(hp); R.headPivot = hp;
  const upper = mk(8, 4, 8, (f, x, w, h) => {
    x.fillStyle = LAV; x.fillRect(0, 0, w, h);
    if (f === 'front') { x.fillStyle = BLK; x.fillRect(1, 1, 1, 1); x.fillRect(6, 1, 1, 1); x.fillRect(0, 0, w, 1); // 目と眉
      x.fillStyle = '#8a0a1c'; x.fillRect(0, 2, w, 2); for (let i = 0; i < 8; i++) { x.fillStyle = '#fff'; x.fillRect(i, 2, 1, i % 2 ? 2 : 1); } }
    else if (f === 'bottom') { x.fillStyle = '#8a0a1c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i += 2) { x.fillStyle = '#fff'; x.fillRect(i, 0, 1, 2); } }
    else if (f === 'top') { x.fillStyle = LAV2; x.fillRect(3, 0, 2, h); }
  });
  upper.position.set(0, 2 * PX, 0); hp.add(upper); R.head = upper;
  const jaw = new THREE.Group(); jaw.position.set(0, 0, -4 * PX); hp.add(jaw); R.jaw = jaw;
  const low = mk(8, 3, 8, (f, x, w, h) => {
    x.fillStyle = LAV; x.fillRect(0, 0, w, h);
    if (f === 'top') { x.fillStyle = '#c01428'; x.fillRect(0, 0, w, h); x.fillStyle = '#7a0a16'; x.fillRect(2, 2, 4, 4); for (let i = 1; i < 8; i += 2) { x.fillStyle = '#fff'; x.fillRect(i, h - 1, 1, 1); x.fillRect(i, 0, 1, 1); } }
    else if (f === 'front') { x.fillStyle = '#8a0a1c'; x.fillRect(0, 0, w, 1); for (let i = 0; i < 8; i++) { x.fillStyle = '#fff'; x.fillRect(i, 0, 1, i % 2 ? 1 : 2); } }
  });
  low.position.set(0, -1.5 * PX, 4 * PX); jaw.add(low);
  for (const fx of [-3.2, -1.1, 1.1, 3.2]) { const fu = solid(1.0, 3.4, 1.0, '#fffdf5'); fu.position.set(fx * PX, -1.7 * PX + 0.2 * PX, 8.1 * PX); hp.add(fu); }
  for (const fx of [-2.2, 0, 2.2]) { const fl = solid(1.0, 3.0, 1.0, '#fffdf5'); fl.position.set(fx * PX, 1.2 * PX, 7.6 * PX); jaw.add(fl); }
  // --- 後頭部に放射状に伸びる白い腕の冠 ---
  const mane = new THREE.Group(); mane.position.set(0, 44 * PX, -2.5 * PX); mane.rotation.x = -0.3; root.add(mane); R.mane = mane;
  for (let i = 0; i < 11; i++) {
    const th = ((i - 5) / 5) * 1.35; let phi = th; let cx = 0, cy = 0; const sgn = Math.sign(th) || 1;
    for (let j = 0; j < 5; j++) { const L = 5.2, wd = 4.4 - 0.6 * j; const dx = Math.sin(phi), dy = Math.cos(phi);
      const seg = solid(wd, L, wd * 0.8, j % 2 ? LAV2 : LAV); seg.position.set((cx + dx * L / 2) * PX, (cy + dy * L / 2) * PX, -(Math.abs(th)) * 0.8 * PX); seg.rotation.z = -phi; mane.add(seg);
      cx += dx * L; cy += dy * L; phi += sgn * 0.2; if (j === 4) { const tip = solid(2.4, 2.4, 2.4, BLK); tip.position.set(cx * PX, cy * PX, -(Math.abs(th)) * 0.8 * PX); mane.add(tip); } }
  }
  // --- 腕(長く太い) ---
  const mkArm = sx => {
    const sh = new THREE.Group(); sh.position.set(sx * 8 * PX, 42 * PX, 0); root.add(sh);
    const pad = solid(7, 4, 7, LAV2); pad.position.y = 1.5 * PX; sh.add(pad);
    const up = solid(5, 14, 5, LAV, true); sh.add(up); for (const yy of [-4, -9]) { const b = solid(5.3, 0.8, 5.3, LAV2); b.position.y = yy * PX; sh.add(b); }
    const el = new THREE.Group(); el.position.y = -14 * PX; sh.add(el);
    const fo = solid(4.6, 14, 4.6, LAV, true); el.add(fo);
    const hand = new THREE.Group(); hand.position.y = -14 * PX; el.add(hand);
    const palm = solid(6.4, 5, 2.6, LAV2); palm.position.y = -2.5 * PX; hand.add(palm);
    for (let k = 0; k < 5; k++) { const fg = new THREE.Group(); fg.position.set((-2.5 + k * 1.25) * PX, -5 * PX, 0); fg.rotation.x = -0.25 - (k === 0 || k === 4 ? 0.2 : 0); hand.add(fg);
      const f1 = solid(1.1, 7, 1.1, LAV, true); fg.add(f1); const f2 = solid(0.9, 3, 0.9, BLK, true); f2.position.y = -7 * PX; fg.add(f2); }
    return { sh, el };
  };
  const aL = mkArm(1), aR = mkArm(-1); R.armL = aL.sh; R.elL = aL.el; R.armR = aR.sh; R.elR = aR.el;
  // --- 完全顕現: 光輪と鎖 ---
  const full = new THREE.Group(); full.visible = false; root.add(full); R.full = full;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffb0d8, toneMapped: false })); halo.position.set(0, 50 * PX, -7 * PX); full.add(halo); R.halo = halo;
  const chm = lm(0x3a3a44);
  for (let i = 0; i < 16; i++) { const c = new THREE.Mesh(BOXG, chm); c.scale.setScalar(0.14); c.position.set(Math.sin(i * 0.9) * 0.45 + (i % 2 ? 0.75 : -0.75), 2.0 - i * 0.17, -0.3 + Math.cos(i) * 0.1); full.add(c); }
  root.traverse(o => { if (o.isMesh && Array.isArray(o.material)) o.material = o.material.map(mm => new THREE.MeshBasicMaterial({ map: mm.map })); }); hp.scale.setScalar(1.3);
  scene.add(root); return R;
}
const BOXG = new THREE.BoxGeometry(1, 1, 1);
export function setRika(R, s) {
  const d = (k, v) => (s[k] ?? v);
  R.root.position.set(d('x', 0), d('y', 0), d('z', 0)); R.root.rotation.set(d('lean', 0), d('yaw', 0), 0); R.root.scale.setScalar(d('sc', 1.6));
  R.headPivot.rotation.set(d('headP', 0), 0, 0);
  const Rf = d('Rf', 0.1), Lf = d('Lf', 0.1);
  R.armR.rotation.set(-Rf, 0, -d('Rab', 0.35)); R.armL.rotation.set(-Lf, 0, d('Lab', 0.35));
  R.elR.rotation.x = -(0.15 + 0.5 * (1 - clamp01(Rf / 1.5))); R.elL.rotation.x = -(0.15 + 0.5 * (1 - clamp01(Lf / 1.5)));
  R.jaw.rotation.x = d('jaw', 0.3);
  const tw = d('tw', 0); R.tail.forEach((g, i) => { g.rotation.y = Math.sin(tw * 2 + i * 0.5) * 0.12 * (i / 4); });
  R.mane.children.forEach((m, i) => { m.position.x += 0; }); R.mane.rotation.z = Math.sin(tw * 1.2) * 0.03;
  R.full.visible = !!d('full', false); R.root.visible = d('vis', true);
}
const clamp01 = x => Math.min(1, Math.max(0, x));

// ================= 五条悟(社長のスキン画像を再現: 白い冠の髪+黒い目隠し+暗い青紫の高襟ジャケット) =================
const GSKIN = '#f0c4a8';
const mottle = (x, w, h, pal, seed, vert = 0.55) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const r = rnd2(i * 3.7 + seed) * vert + rnd2(i * 7.3 + j * 13.1 + seed * 1.7) * (1 - vert); dot(x, pal[Math.min(pal.length - 1, Math.floor(r * pal.length))], i, j); } };
const rnd2 = s => { const v = Math.sin(s * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const PURP = ['#1c1830', '#241f3a', '#2f2744', '#3b3150', '#4a3d66', '#5a4a7c', '#6a5a8a'];
const HAIRP = ['#8f8da0', '#a9a7b8', '#c4c2d2', '#d8d8e6', '#e8e8f4'];
const BLINDP = ['#1a1a20', '#22222a', '#2a2a32', '#33333c'];
const gojoPaint = {
  head(f, x, w, h) {
    dot(x, GSKIN, 0, 0, w, h);
    if (f === 'top') { mottle(x, w, h, HAIRP, 61, 0.2); }
    else if (f === 'front') {
      mottle(x, w, 2, HAIRP, 62, 0.6); dot(x, '#e8e8f4', 1, 0); dot(x, '#e8e8f4', 3, 0); dot(x, '#e8e8f4', 4, 0); dot(x, '#e8e8f4', 6, 0); dot(x, '#8f8da0', 2, 0); dot(x, '#8f8da0', 5, 0);
      mottle(x, w, 1, HAIRP.slice(0, 3), 63, 0.3); x.fillStyle = '#a9a7b8'; x.fillRect(0, 2, w, 1); dot(x, '#c4c2d2', 3, 2, 2, 1);
      mottle(x, w, 3, BLINDP, 64, 0.3); // 目隠し(上段から3行目を上書き)
      x.save(); x.restore();
      for (let j = 3; j < 6; j++) for (let i = 0; i < w; i++) dot(x, BLINDP[Math.floor(rnd2(i * 5.1 + j * 9.7 + 64) * 4)], i, j);
      dot(x, '#c8a090', 3, 6); dot(x, '#d8a890', 4, 6); dot(x, '#b87068', 3, 7, 2, 1); dot(x, '#f0c4a8', 0, 6, 3, 2); dot(x, '#f0c4a8', 5, 6, 3, 2); dot(x, '#e0b098', 3, 6, 2, 1);
    } else if (f === 'back') { mottle(x, w, 6, HAIRP, 65, 0.5); for (let j = 3; j < 6; j++) for (let i = 0; i < w; i++) dot(x, BLINDP[Math.floor(rnd2(i * 5.1 + j * 9.7 + 66) * 4)], i, j); dot(x, '#f0c4a8', 0, 6, w, 2); }
    else { mottle(x, w, 3, HAIRP, 67, 0.3); for (let j = 3; j < 6; j++) for (let i = 0; i < w; i++) dot(x, BLINDP[Math.floor(rnd2(i * 5.1 + j * 9.7 + 68) * 4)], i, j); dot(x, '#f0c4a8', 0, 6, w, 2); dot(x, '#e0b098', 3, 6, 2, 1); }
  },
  body(f, x, w, h) {
    mottle(x, w, h, PURP, 71, 0.5);
    if (f === 'front') { dot(x, '#1c1830', 0, 0, w, 2); dot(x, '#2f2744', 1, 1, w - 2, 1); dot(x, '#15122a', 3, 1, 1, 11); dot(x, '#7a6a9a', 4, 2, 1, 10); dot(x, '#15122a', 0, 11, w, 1); }
    else if (f === 'back') { dot(x, '#1c1830', 0, 0, w, 2); }
    else { dot(x, '#1c1830', 0, 0, w, 1); }
  },
  arm(f, x, w, h) { mottle(x, w, h, PURP, 72, 0.6); dot(x, '#1c1830', 0, 0, w, 1); dot(x, '#15122a', 0, 10, w, 1); dot(x, GSKIN, 0, 11, w, 1); dot(x, '#d8a890', 0, 11, 1, 1); },
  leg(f, x, w, h) { mottle(x, w, h, PURP, 73, 0.6); dot(x, '#15122a', 0, 10, w, 2); dot(x, '#1e1a28', 0, 11, w, 1); },
};
export function makeGojo(scene) {
  const C = makeChar(gojoPaint, scene);
  // 髪: 上端がギザギザの冠(白〜薄灰色の尖り)
  const hm = [new THREE.MeshLambertMaterial({ color: 0xf2f2fa, emissive: 0x4a4a5c }), new THREE.MeshLambertMaterial({ color: 0xd2d0e0, emissive: 0x3a3a4c }), new THREE.MeshLambertMaterial({ color: 0xe4e4f0, emissive: 0x444456 })]; hm.forEach(m => C.mats.push(m));
  [[-3.1, 3.6, 0.1, 0], [-1.5, 4.6, -0.05, 1], [0.1, 5.4, 0, 2], [1.7, 4.4, 0.05, 0], [3.1, 3.4, -0.1, 1], [-2.2, 3.0, -2.2, 2], [0.4, 3.4, -2.6, 0], [2.4, 3.0, -2.2, 1]].forEach(([x, hgt, rz, k], n) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.9 * PX, hgt * PX, 1.9 * PX), hm[k]); m.position.set(x * PX, (4 + hgt / 2 - 0.2) * PX, (n < 5 ? 0.5 : -2.5) * PX); m.rotation.z = rz; C.head.add(m); });
  C.mats.slice(0, -3).forEach((m, i) => m.emissive.set(i >= 6 && i < 12 ? 0x12101a : 0x30264a)); // 夜でも服が青紫に見えるよう底上げ
  C.paint = gojoPaint; return C;
}
// 腕だけの別体(切断された腕など)
export function makeLimb(scene, paint) { const mats = []; const m = part(4, 12, 4, paint.arm, true, mats); m.visible = false; scene.add(m); return m; }
// 虎杖の白目
export function addWhiteEyes(C) {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.2 * PX, 2.2 * PX, 0.5 * PX), m); b.position.set(sx * 2 * PX, 0, 4.3 * PX); g.add(b); }
  g.visible = false; C.head.add(g); C.whiteEyes = g;
}
// 証印用の指ブロック(接写カット専用)
export function addHands(C) {
  const mk = (sx) => {
    const grp = new THREE.Group(); grp.position.y = -12 * PX; grp.visible = false; grp.scale.setScalar(1.9);
    const skin = new THREE.MeshLambertMaterial({ color: 0xffd8b8, emissive: 0x4a3a30 }); const box = (w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w * PX, h * PX, d * PX), skin); return m; };
    const palm = box(3.8, 3.2, 2.4); palm.position.y = -1.6 * PX; grp.add(palm);
    const fingers = []; for (let i = 0; i < 4; i++) { const f = new THREE.Group(); f.position.set((-1.4 + i * 0.95) * PX, -3.2 * PX, 0); const b = box(1.0, 4.6, 1.0); b.position.y = -2.3 * PX; f.add(b); grp.add(f); fingers.push(f); }
    const th = new THREE.Group(); th.position.set(sx * 1.8 * PX, -1.2 * PX, 0.4 * PX); const tb = box(0.9, 3, 0.9); tb.position.y = -1.5 * PX; th.add(tb); grp.add(th);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshBasicMaterial({ color: 0xaee8ff, toneMapped: false })); glow.visible = false; grp.add(glow);
    grp.userData = { palm, fingers, th, glow }; return grp;
  };
  C.handR = mk(-1); C.armR.add(C.handR); C.handL = mk(1); C.armL.add(C.handL);
}
export function setHand(G, pose, t = 0, u = 1) {
  if (!G) return; const { fingers, th, glow } = G.userData; G.visible = pose !== 'none'; if (!G.visible) return;
  fingers.forEach(f => { f.rotation.set(0, 0, 0); f.children[0].scale.set(1, 1, 1); f.position.z = 0; });
  th.rotation.set(0, 0, 0); glow.visible = false; G.rotation.set(0, 0, 0);
  if (pose === 'cross') { // 人差し指と中指を交差させて立てる
    G.rotation.x = -PI2; fingers[0].rotation.z = -0.25 + 0.57 * u; fingers[1].rotation.z = 0.25 - 0.57 * u; fingers[0].children[0].scale.y = 1.25; fingers[1].children[0].scale.y = 1.25;
    fingers[0].position.z = -0.25 * PX; fingers[1].position.z = 0.25 * PX;
    fingers[2].rotation.x = 1.5; fingers[3].rotation.x = 1.5; fingers[2].children[0].scale.y = 0.5; fingers[3].children[0].scale.y = 0.5; th.rotation.x = 1.2;
    glow.visible = u > 0.95; glow.position.set(0, -7.5 * PX, 0); glow.scale.setScalar(1 + 0.15 * Math.sin(t * 25));
  } else if (pose === 'cup') { G.rotation.x = -0.2; fingers.forEach((f, i) => { f.rotation.x = -0.3; }); th.rotation.z = 0.5; }
  else if (pose === 'fist') { fingers.forEach(f => { f.rotation.x = 1.6; f.children[0].scale.y = 0.55; }); th.rotation.x = 0; th.children[0].scale.y = 1.2; G.rotation.x = -0.4; }
  else if (pose === 'open') { fingers.forEach((f, i) => { f.rotation.z = (i - 1.5) * 0.18; }); th.rotation.z = 0.7; }
}
const PI2 = Math.PI / 2;
// 天逆鉾
export function makeSpear(scene) {
  const g = new THREE.Group(); const dark = new THREE.MeshLambertMaterial({ color: 0x3a3a46, emissive: 0x15151c }), gold = new THREE.MeshLambertMaterial({ color: 0xc8a850, emissive: 0x3a2a10 }), blade = new THREE.MeshBasicMaterial({ color: 0xe4f0ff, toneMapped: false });
  const add = (w, h, d, y, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.y = y; g.add(b); return b; };
  add(0.07, 1.8, 0.07, 0.2, dark); add(0.11, 0.5, 0.11, -0.45, new THREE.MeshLambertMaterial({ color: 0x6a2a2a })); add(0.34, 0.07, 0.14, 1.18, gold);
  add(0.16, 0.9, 0.04, 1.68, blade); add(0.07, 0.4, 0.04, 1.3, blade).position.x = 0.14; add(0.07, 0.4, 0.04, 1.3, blade).position.x = -0.14; add(0.08, 0.3, 0.04, 2.25, blade);
  g.visible = false; scene.add(g); return g;
}
