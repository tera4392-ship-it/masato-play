// ステージ: 夜の渋谷スクランブル交差点 / 五条の領域(無量空処) / 虎杖の領域
import * as THREE from 'three';
const PI = Math.PI;
const rnd = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lam = (c, extra = {}) => new THREE.MeshLambertMaterial({ color: c, ...extra });
const bas = (c, extra = {}) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...extra });
const BOX = new THREE.BoxGeometry(1, 1, 1);
function box(g, w, h, d, x, y, z, mat) { const m = new THREE.Mesh(BOX, mat); m.scale.set(w, h, d); m.position.set(x, y + h / 2, z); g.add(m); return m; }
function ptex(n, fn, rep, rep2 = rep) {
  const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); fn(x, n);
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep2); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function skyMesh(top, bot, stars = false) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(400, 20, 14), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { t: { value: new THREE.Color(top) }, b: { value: new THREE.Color(bot) }, time: { value: 0 }, st: { value: stars ? 1 : 0 } },
    vertexShader: 'varying vec3 v; void main(){v=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform vec3 t,b; uniform float time,st; varying vec3 v;
    float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
    void main(){ float y=clamp(v.y*1.4+0.12,0.,1.); vec3 c=mix(b,t,pow(y,.7));
      if(st>0.5){ vec3 q=floor(v*90.); float s=step(0.9965,h(q)); c+=vec3(s)*(0.6+0.4*sin(time*3.+h(q)*30.));
        float n=sin(v.x*6.+time*.2)*sin(v.y*5.-time*.15)*sin(v.z*7.); c+=vec3(.25,.35,.9)*max(n,0.)*.35+vec3(.5,.15,.7)*max(-n,0.)*.25; }
      gl_FragColor=vec4(c,1.0);} `
  }));
  return m;
}
function winTex(w, h) {
  const t = ptex(16, (x, n) => { x.fillStyle = '#0c101c'; x.fillRect(0, 0, n, n); const pal = ['#ffd890', '#9ad0ff', '#ffe8b0', '#ff9ad8', '#0c101c', '#0c101c', '#162036'];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { x.fillStyle = pal[Math.floor(rnd(i * 3.1 + j * 7.7 + w * 0.37 + h * 0.11) * pal.length)]; x.fillRect(i * 4 + 1, j * 4 + 1, 2, 2); } }, w / 5, h / 5);
  return t;
}
function building(g, x, z, w, d, h, seed, y0 = 0) {
  const side = winTex(w + seed, h + seed * 0.3); const mats = [0, 1, 4, 5].map(() => new THREE.MeshLambertMaterial({ map: side, emissive: 0x151824 }));
  const top = lam(0x1c1e28), arr = [mats[0], mats[1], top, top, mats[2], mats[3]];
  const m = new THREE.Mesh(BOX, arr); m.scale.set(w, h, d); m.position.set(x, y0 + h / 2, z); g.add(m); return m;
}

export function buildWorld(scene) {
  const W = { env: {}, anim: {} };
  // ======== 渋谷(夜) ========
  (() => {
    const g = new THREE.Group(); W.env.S = { g, fog: [0x1a1030, 90, 380], hemi: [0x8090d8, 0x201a38, 0.9], sun: [0x9ab0ff, 0.65] };
    const sky = skyMesh(0x02030c, 0x4a2a5a); g.add(sky); W.anim.skyS = sky;
    // ---- 路面・歩道 ----
    const asph = ptex(8, (x, n) => { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { x.fillStyle = ['#1c1e26', '#1a1c24', '#20222c', '#181a22'][Math.floor(rnd(i * 5 + j * 9) * 4)]; x.fillRect(i, j, 1, 1); } }, 140);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshLambertMaterial({ map: asph })); fl.rotation.x = -PI / 2; g.add(fl);
    const paveT = ptex(8, (x, n) => { x.fillStyle = '#4a4a54'; x.fillRect(0, 0, n, n); x.fillStyle = '#3a3a44'; x.fillRect(0, 0, n, 1); x.fillRect(0, 0, 1, n); x.fillStyle = '#56565f'; x.fillRect(3, 3, 2, 2); }, 1);
    const wh = lam(0xe8e8f0, { emissive: 0x606068 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { // 四隅の歩道(段差つき)
      const pv = paveT.clone(); pv.needsUpdate = true; pv.repeat.set(30, 30); const m = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ map: pv })); m.scale.set(120, 0.2, 120); m.position.set(sx * (22.5 + 60), 0.1, sz * (22.5 + 60)); g.add(m); box(g, 120, 0.12, 0.35, sx * (22.5 + 60), 0.2, sz * 22.7, lam(0x6a6a74)); box(g, 0.35, 0.12, 120, sx * 22.7, 0.2, sz * (22.5 + 60), lam(0x6a6a74)); }
    for (const s of [-1, 1]) for (let i = -8; i <= 8; i++) { box(g, 1.3, 0.05, 7, i * 2.3, 0, s * 18.5, wh); box(g, 7, 0.05, 1.3, s * 18.5, 0, i * 2.3, wh); } // 横断歩道(4方向)
    for (let i = -9; i <= 9; i++) for (const a of [PI / 4, -PI / 4]) { const m = box(g, 1.2, 0.05, 6, i * 2.2 * Math.cos(a), 0, i * 2.2 * Math.sin(a), wh); m.rotation.y = a + PI / 2; } // 斜め横断
    for (let k = 0; k < 30; k++) { for (const sgn of [-1, 1]) { box(g, 0.2, 0.04, 2.2, sgn * 6, 0, -150 + k * 10 + (k > 14 ? 40 : 0) - (k > 14 ? 0 : 0), lam(0xd0d0a0)); } } // 車線
    // ---- 建物の部品 ----
    const facade = (kind, seed) => ptex(256, (x, n) => {
      const cols = 16, rows = 16, cw = n / cols, rh = n / rows;
      x.fillStyle = kind === 'glass' ? '#0a1222' : kind === 'brick' ? '#3a2a2a' : '#25272f'; x.fillRect(0, 0, n, n);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const lit = rnd(c * 7.1 + r * 3.7 + seed) < (kind === 'glass' ? 0.36 : 0.3); const warm = rnd(c * 2.3 + r * 9.1 + seed) < 0.6;
        const px = c * cw, py = r * rh;
        if (kind === 'glass') { x.fillStyle = lit ? (warm ? '#ffe2a8' : '#bfe4ff') : (rnd(c + r * 5 + seed) < 0.5 ? '#16243e' : '#10192e'); x.fillRect(px + 1, py + 2, cw - 2, rh - 5); x.fillStyle = '#243656'; x.fillRect(px, py + rh - 3, cw, 3); x.fillStyle = '#31466e'; x.fillRect(px + cw - 1, py, 1, rh); }
        else if (kind === 'brick') { x.fillStyle = '#5a3a34'; x.fillRect(px, py, cw, 2); x.fillStyle = lit ? (warm ? '#ffd890' : '#a8d8ff') : '#171a24'; x.fillRect(px + 3, py + 4, cw - 6, rh - 8); x.fillStyle = '#6a4a44'; x.fillRect(px + 3, py + rh - 4, cw - 6, 2); }
        else { x.fillStyle = '#3a3d48'; x.fillRect(px, py, 2, rh); x.fillStyle = lit ? (warm ? '#ffe0a0' : '#b8e0ff') : '#12151f'; x.fillRect(px + 3, py + 3, cw - 6, rh - 8); x.fillStyle = '#4a4e5c'; x.fillRect(px, py + rh - 3, cw, 3); } }
    }, 1);
    const fcache = {};
    const facadeMat = (kind, seed, repU, repV, off) => { const k = kind + seed; fcache[k] ??= facade(kind, seed); const t = fcache[k].clone(); t.needsUpdate = true; t.repeat.set(repU, repV); t.offset.set(off, 0);
      return new THREE.MeshLambertMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.9, color: 0x9aa4c0 }); };
    const neon = [0xff3a9a, 0x3ad8ff, 0xffe03a, 0x7a4aff, 0xff5a3a, 0x3aff8a];
    W.anim.blink = [];
    function tower(x, z, w, d, h, kind, seed, o = {}) {
      const mx = facadeMat(kind, seed, d / 32, h / 57.6, rnd(seed)), mz = facadeMat(kind, seed, w / 32, h / 57.6, rnd(seed + 3));
      const top = lam(0x1a1c26); const m = new THREE.Mesh(BOX, [mx, mx, top, top, mz, mz]); m.scale.set(w, h, d); m.position.set(x, h / 2, z); g.add(m);
      const pil = lam(kind === 'brick' ? 0x4a3430 : 0x3a3e4c); // 角の柱
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 1.1, h + 0.4, 1.1, x + sx * (w / 2), 0, z + sz * (d / 2), pil);
      for (let k = 1; k < 4; k++) box(g, w + 0.5, 0.5, d + 0.5, x, (h * k) / 4, z, pil); // 階層の帯
      if (!o.flat) { // 頂部のセットバック・設備・アンテナ
        const sh = 4 + rnd(seed * 3) * 7; box(g, w * 0.78, sh, d * 0.78, x, h, z, lam(0x20232e)); box(g, w * 0.5, 2.2, d * 0.5, x + w * 0.1, h + sh, z - d * 0.1, lam(0x2c303c));
        const ant = box(g, 0.25, 8 + rnd(seed) * 10, 0.25, x, h + sh + 2.2, z, lam(0x8a8c98)); const bl = new THREE.Mesh(BOX, bas(0xff2a2a)); bl.scale.setScalar(0.7); bl.position.set(x, h + sh + 11 + rnd(seed) * 10, z); g.add(bl); W.anim.blink.push({ m: bl, ph: rnd(seed * 7) * 6 });
        box(g, w + 0.6, 0.9, d + 0.6, x, h, z, lam(0x2a2c38));
        if (rnd(seed * 5) < 0.55) { const nc = neon[Math.floor(rnd(seed * 11) * neon.length)]; box(g, w * 0.6, 3.2, 0.5, x, h + sh + 3, z + (z > 0 ? -1 : 1) * (d * 0.39), bas(nc)); }
      }
      // 低層の店舗帯(光る看板・庇)
      const sface = o.faces ?? [[0, z > 0 ? -1 : 1]];
      for (const [fx, fz] of sface) { for (let k = 0; k < 4; k++) { const nc = neon[Math.floor(rnd(seed * 3 + k * 7) * neon.length)]; const len = (fx ? d : w) / 4 - 0.4;
        const px = x + fx * (w / 2 + 0.25) + (fx ? 0 : (k - 1.5) * ((w) / 4)), pz = z + fz * (d / 2 + 0.25) + (fx ? (k - 1.5) * (d / 4) : 0);
        box(g, fx ? 0.5 : len, 3.2, fx ? len : 0.5, px, 0.2, pz, lam(0x30323c)); box(g, fx ? 0.55 : len - 0.4, 0.5, fx ? len - 0.4 : 0.55, px, 3.9, pz, bas(nc));
        box(g, fx ? 1.4 : len - 0.3, 0.3, fx ? len - 0.3 : 1.4, px + fx * 0.5, 3.6, pz + fz * 0.5, lam(rnd(seed + k) < 0.5 ? 0xb83a3a : 0x2a5ab8)); box(g, fx ? 0.45 : len - 1.2, 2.2, fx ? len - 1.2 : 0.45, px, 0.5, pz, bas(rnd(seed * 2 + k) < 0.5 ? 0xffe8b0 : 0xbfe4ff, { opacity: 0.9, transparent: true })); } }
      // 壁面の縦ネオン・大きな看板(窓の上に重ねる。色の塊にならない小さめ)
      if (o.signs !== false) for (let k = 0; k < 2; k++) { if (rnd(seed * 13 + k) < 0.6) { const nc = neon[Math.floor(rnd(seed * 17 + k) * neon.length)]; const side = rnd(seed + k) < 0.5 ? -1 : 1; const fz = z > 0 ? -1 : 1;
        box(g, 0.5, Math.min(h * 0.5, 22), 0.4, x + side * w * 0.38, 8 + rnd(seed * 3 + k) * 6, z + fz * (d / 2 + 0.3), bas(nc)); } }
      return m;
    }
    W.anim.tower = tower;
    const kinds = ['glass', 'concrete', 'brick', 'glass'];
    // 屋上の舞台(五条側・虎杖側): 平らな屋上、ガラスのビル
    for (const sz of [-1, 1]) { tower(0, sz * 34, 18, 18, 30, 'glass', sz > 0 ? 71 : 72, { flat: true, faces: [[0, -sz]] }); }
    const ROOF = 30;
    for (const sz of [-1, 1]) { const zc = sz * 34; box(g, 18.4, 0.4, 0.5, 0, ROOF, zc - sz * 8.7, lam(0x2a2c38)); box(g, 18.4, 0.4, 0.5, 0, ROOF, zc + sz * 8.7, lam(0x2a2c38)); box(g, 0.5, 0.4, 18.4, -8.7, ROOF, zc, lam(0x2a2c38)); box(g, 0.5, 0.4, 18.4, 8.7, ROOF, zc, lam(0x2a2c38));
      box(g, 3, 1.8, 2.2, -5.5, ROOF, zc + sz * 4, lam(0x6a6c78)); box(g, 3, 1.8, 2.2, 5.5, ROOF, zc + sz * 5, lam(0x6a6c78)); box(g, 2.6, 4, 2.6, 6.5, ROOF, zc + sz * 1, lam(0x3a3c48)); box(g, 0.2, 7, 0.2, -6, ROOF, zc + sz * 6, lam(0x8a8c98));
      box(g, 18.6, 0.4, 18.6, 0, ROOF - 0.1, zc, lam(0x23252f)); }
    // 四隅のブロックに高層ビル群を敷き詰める
    let sd = 1;
    for (const qx of [-1, 1]) for (const qz of [-1, 1]) {
      let zz = 24 + 9; // 交差点に面した列
      for (let row = 0; row < 3; row++) { let xx = 24 + 9;
        for (let col = 0; col < 4; col++) { sd++; const w = 14 + rnd(sd * 3.1) * 12, d = 14 + rnd(sd * 5.3) * 10; const h = (row === 0 ? 34 : 28) + rnd(sd * 7.7) * (row === 0 ? 46 : 60);
          const bx = qx * (xx + w / 2 - 9 + 0), bz = qz * (zz + d / 2 - 9 + 0); const faces = []; if (col === 0) faces.push([-qx, 0]); if (row === 0) faces.push([0, -qz]);
          if (!(Math.abs(bx) < 28 && Math.abs(bz) > 24 && false)) tower(bx, bz, w, d, h, kinds[Math.floor(rnd(sd * 9.9) * 4)], sd * 13, { faces: faces.length ? faces : [[0, 0]] });
          xx += w + 1.2; }
        zz += 22 + rnd(row * 3 + sd) * 6; }
    }
    // 道路沿いにも低中層(北と南の道の奥)
    for (const sz of [-1, 1]) for (let i = -3; i <= 3; i++) { if (Math.abs(i) < 1) continue; sd++; const w = 18, d = 16, h = 32 + rnd(sd * 3) * 40; tower(i * 20, sz * (62 + rnd(sd) * 6), w, d, h, kinds[Math.floor(rnd(sd * 9) * 4)], sd * 7, { faces: [[0, -sz]] }); }
    // 遠景のスカイライン
    for (let i = 0; i < 70; i++) { const a = (i / 70) * PI * 2, d = 190 + rnd(i * 3.3) * 120; const h = 40 + rnd(i * 5.1) * 120; tower(Math.cos(a) * d, Math.sin(a) * d, 18 + rnd(i) * 20, 18 + rnd(i * 2) * 20, h, kinds[i % 4], i * 3, { signs: false, faces: [[0, 0]] }); }
    // 切断される高層ビル(斬撃で上部がずれ落ちる): 交差点を挟む左右
    W.anim.cut = [];
    for (const sx of [-1, 1]) { const x = sx * 27, z = 4, w = 16, d = 20, h = 70, cutY = 36; const lowerMat = [], base = tower(x, z, w, d, cutY, 'glass', 400 + sx, { flat: true, faces: [[-sx, 0]] });
      const up = new THREE.Group(); up.position.set(x, cutY, z); g.add(up); const mm = facadeMat('glass', 400 + sx, d / 32, (h - cutY) / 57.6, 0.3), mz2 = facadeMat('glass', 400 + sx, w / 32, (h - cutY) / 57.6, 0.6);
      const um = new THREE.Mesh(BOX, [mm, mm, lam(0x1a1c26), lam(0x1a1c26), mz2, mz2]); um.scale.set(w, h - cutY, d); um.position.y = (h - cutY) / 2; up.add(um);
      for (const px of [-1, 1]) for (const pz of [-1, 1]) { const p = new THREE.Mesh(BOX, lam(0x3a3e4c)); p.scale.set(1.1, h - cutY + 0.4, 1.1); p.position.set(px * w / 2, (h - cutY) / 2, pz * d / 2); up.add(p); }
      const edge = new THREE.Mesh(BOX, bas(0xff6a70)); edge.scale.set(w + 0.4, 0.7, d + 0.4); edge.position.y = 0.0; up.add(edge); edge.visible = false;
      const antn = new THREE.Mesh(BOX, lam(0x8a8c98)); antn.scale.set(0.3, 14, 0.3); antn.position.y = h - cutY + 7; up.add(antn);
      W.anim.cut.push({ up, edge, sx, base0: new THREE.Vector3(x, cutY, z), w, d, hh: h - cutY }); base.visible = true; }
    // 109風の円筒ビル(光の帯つき)
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 46, 20), new THREE.MeshLambertMaterial({ color: 0xc87a98, emissive: 0x6a2a44 })); cyl.position.set(-34, 23, -44); g.add(cyl);
    for (let k = 0; k < 8; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.3, 6, 24), bas(k % 2 ? 0xff6aaa : 0xffe0ec)); r.rotation.x = PI / 2; r.position.set(-34, 4 + k * 5.5, -44); g.add(r); }
    // 信号・街灯・車・歩行者信号
    for (const [sx, sz] of [[-21, -21], [21, -21], [-21, 21], [21, 21]]) { box(g, 0.3, 7, 0.3, sx, 0, sz, lam(0x3a3c44)); box(g, 1.0, 2.6, 0.8, sx, 6, sz, lam(0x24262e)); box(g, 0.5, 0.5, 0.2, sx, 7.9, sz + 0.5, bas(0xff2a2a)); box(g, 0.5, 0.5, 0.2, sx, 6.5, sz + 0.5, bas(0x2aff6a)); }
    for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2; const x = Math.cos(a) * 23.6, z = Math.sin(a) * 23.6; box(g, 0.25, 6.5, 0.25, x, 0.2, z, lam(0x2a2c34)); box(g, 1.1, 0.5, 1.1, x, 6.7, z, bas(0xfff0c0)); }
    for (let i = 0; i < 14; i++) { const lane = i % 2 ? 4 : -4; const z = -38 - (i * 13) % 60 * (i % 3 === 0 ? -1 : 1); const col = [0xc83a3a, 0x3a5ac8, 0xd8d8d8, 0x2a2a2a][i % 4]; const xx = (i % 2 ? 1 : -1) * (30 + (i * 11) % 40); if (i % 2) { box(g, 4.4, 1.3, 2.0, xx, 0, lane, lam(col)); box(g, 2.4, 0.9, 1.9, xx, 1.3, lane, lam(0x1a2030)); } else { box(g, 2.0, 1.3, 4.4, lane, 0, z, lam(col)); box(g, 1.9, 0.9, 2.4, lane, 1.3, z, lam(0x1a2030)); box(g, 0.4, 0.3, 0.1, lane - 0.6, 0.6, z + 2.25, bas(0xff2a2a)); box(g, 0.4, 0.3, 0.1, lane + 0.6, 0.6, z + 2.25, bas(0xff2a2a)); } }
    W.anim.screens = []; scene.add(g);
  })();
  // ======== 五条の領域: 無量空処(星空・光の流れ) ========
  (() => {
    const g = new THREE.Group(); W.env.G = { g, fog: [0x04061a, 80, 260], hemi: [0x8aa8ff, 0x101030, 1.1], sun: [0xc8d8ff, 1.3] };
    const sky = skyMesh(0x02030f, 0x2a1a6a, true); g.add(sky); W.anim.skyG = sky;
    const ft = ptex(8, (x, n) => { x.fillStyle = '#05061a'; x.fillRect(0, 0, n, n); for (let k = 0; k < 2; k++) { x.fillStyle = ['#6a88dd', '#b08aff'][k % 2]; x.fillRect(Math.floor(rnd(k * 3.3) * n), Math.floor(rnd(k * 5.1) * n), 1, 1); } }, 260);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshLambertMaterial({ map: ft, emissive: 0x0a0a30 })); fl.rotation.x = -PI / 2; g.add(fl);
    const N = 320; const st = new THREE.InstancedMesh(BOX, bas(0xffffff), N); st.frustumCulled = false; g.add(st); W.anim.streaks = st; st.userData.cols = [];
    const c = new THREE.Color(); st.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    for (let i = 0; i < N; i++) { c.set([0x8ac8ff, 0xffffff, 0xb08aff, 0x6aa8ff][i % 4]); st.setColorAt(i, c); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; const r = new THREE.Mesh(new THREE.TorusGeometry(20 + i * 3, 0.15, 6, 48), bas(i % 2 ? 0x6aa8ff : 0xb08aff)); r.rotation.set(PI / 2 + Math.sin(a) * 0.4, Math.cos(a) * 0.4, 0); r.position.y = 2 + i * 1.5; g.add(r); }
    scene.add(g);
  })();
  // ======== 虎杖の領域(赤い空と黒曜石の闘技場、拳の石碑、黒い火花) ========
  (() => {
    const g = new THREE.Group(); W.env.Y = { g, fog: [0xa83020, 50, 190], hemi: [0xffb080, 0x40202a, 1.0], sun: [0xffcf9a, 1.8] };
    g.add(skyMesh(0x38061a, 0xff7a30));
    const ft = ptex(2, (x) => { x.fillStyle = '#1b1220'; x.fillRect(0, 0, 2, 2); x.fillStyle = '#2c2034'; x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 1, 1); }, 110);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshLambertMaterial({ map: ft })); fl.rotation.x = -PI / 2; g.add(fl);
    const st = lam(0x14101a), fist = lam(0x3a3040);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * PI * 2, d = 30, x = Math.cos(a) * d, z = Math.sin(a) * d; box(g, 2.4, 9, 2.4, x, 0, z, st); box(g, 3.4, 2.4, 3.4, x, 9, z, fist); for (let k = 0; k < 4; k++) box(g, 0.8, 0.8, 1.6, x - 1.2 + k * 0.8, 10, z, fist); }
    const sun = new THREE.Mesh(new THREE.SphereGeometry(22, 20, 14), bas(0xff3a2a, { fog: false })); sun.position.set(0, 14, -180); g.add(sun);
    scene.add(g);
  })();
  Object.values(W.env).forEach(e => (e.g.visible = false));
  return W;
}
