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
  if (ko > 0) { C.root.rotation.x = -ko * Math.PI / 2; C.root.position.y += ko * 0.14; }
  C.root.visible = d('vis', true);
}
export function setTint(C, hex, amt) { // 煤で暗くする等
  const c = new THREE.Color(0xffffff).lerp(new THREE.Color(hex), amt);
  C.mats.forEach(m => m.color.copy(c));
}
export function worldOf(obj, off = [0, 0, 0]) { return obj.localToWorld(new THREE.Vector3(...off)); }
