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
  const mk = (...a) => part(...a, C.mats);
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
// ================= リカ(巨大な式神。長い腕と大きな手) =================
export function makeRika(scene) {
  const R = { mats: [] }; const root = new THREE.Group(); R.root = root;
  const WH = '#ecebf0', GY = '#b8b6c4', BK = '#101018';
  const body = (f, x, w, h) => { noise(x, w, h, WH, 0.06, 41); dot(x, GY, 1, 3, w - 2, 1); dot(x, GY, 1, 6, w - 2, 1); dot(x, GY, 1, 9, w - 2, 1); dot(x, GY, 4, 0, 2, h); };
  const headP = (f, x, w, h) => {
    noise(x, w, h, WH, 0.06, 42);
    if (f === 'top') noise(x, w, h, BK, 0.05, 43);
    else if (f === 'front') {
      dot(x, BK, 0, 0, w, 2); dot(x, BK, 0, 2, 1, 3); dot(x, BK, 7, 2, 1, 3);
      dot(x, BK, 1, 3, 2, 2); dot(x, BK, 5, 3, 2, 2); dot(x, '#ffffff', 2, 4); dot(x, '#ffffff', 5, 4);
      dot(x, '#7a0a16', 1, 5, 6, 3); for (let i = 1; i < 7; i++) { dot(x, '#ffffff', i, 5); if (i % 2) dot(x, '#ffffff', i, 7); }
    } else if (f === 'back') noise(x, w, h, BK, 0.05, 44);
    else dot(x, BK, 0, 0, w, 2);
  };
  const arm = (f, x, w, h) => { noise(x, w, h, WH, 0.06, 45); dot(x, GY, 0, 6, w, 1); dot(x, GY, 0, 13, w, 1); };
  const mk = (...a) => part(...a, R.mats);
  const skirt = mk(10, 8, 6, body); skirt.position.y = 4 * PX; root.add(skirt);
  const torso = mk(10, 12, 6, body); torso.position.y = 14 * PX; root.add(torso); R.torso = torso;
  const hp = new THREE.Group(); hp.position.y = 20 * PX; root.add(hp); R.headPivot = hp;
  const head = mk(8, 8, 8, headP); head.position.y = 4 * PX; hp.add(head); R.head = head;
  const mkArm = (sx) => {
    const g = new THREE.Group(); g.position.set(sx * 7 * PX, 19 * PX, 0); root.add(g);
    const a = mk(4, 20, 4, arm, true); g.add(a);
    const hand = new THREE.Group(); hand.position.y = -20 * PX; g.add(hand);
    { const palm = mk(6, 5, 2, arm); palm.position.set(0, -2.5 * PX, 0); hand.add(palm); }
    for (let i = 0; i < 4; i++) { const fg = mk(1.2, 6, 1.2, arm); fg.position.set((-2.2 + i * 1.5) * PX, -7.5 * PX, 0); hand.add(fg); }
    return g;
  };
  R.armL = mkArm(1); R.armR = mkArm(-1);
  // 完全顕現: 光輪と鎖
  const full = new THREE.Group(); full.visible = false; root.add(full); R.full = full;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 6, 24), new THREE.MeshBasicMaterial({ color: 0xffb0d8, toneMapped: false })); halo.position.set(0, 24 * PX, -4 * PX); full.add(halo); R.halo = halo;
  const chm = new THREE.MeshLambertMaterial({ color: 0x3a3a44 });
  for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), chm); c.position.set(Math.sin(i * 0.9) * 0.5 + (i % 2 ? 0.7 : -0.7), 0.9 - i * 0.18, -0.4 + Math.cos(i) * 0.1); full.add(c); }
  scene.add(root); return R;
}
export function setRika(R, s) {
  const d = (k, v) => (s[k] ?? v);
  R.root.position.set(d('x', 0), d('y', 0), d('z', 0)); R.root.rotation.set(0, d('yaw', 0), 0); R.root.scale.setScalar(d('sc', 2.4));
  R.torso.parent.rotation.x = 0; R.headPivot.rotation.set(d('headP', 0), 0, 0);
  R.armR.rotation.set(-d('Rf', 0.1), 0, -d('Rab', 0.35)); R.armL.rotation.set(-d('Lf', 0.1), 0, d('Lab', 0.35));
  R.root.rotation.x = d('lean', 0); R.full.visible = !!d('full', false); R.root.visible = d('vis', true);
}
