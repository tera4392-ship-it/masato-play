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
  // ======== 渋谷 ========
  (() => {
    const g = new THREE.Group(); W.env.S = { g, fog: [0x1a1030, 70, 300], hemi: [0x7a88d0, 0x201a38, 0.95], sun: [0x9ab0ff, 0.7] };
    const sky = skyMesh(0x02030c, 0x3a1f5a); g.add(sky); W.anim.skyS = sky;
    const asph = ptex(8, (x, n) => { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { x.fillStyle = ['#1c1e26', '#1a1c24', '#20222c', '#181a22'][Math.floor(rnd(i * 5 + j * 9) * 4)]; x.fillRect(i, j, 1, 1); } }, 120);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshLambertMaterial({ map: asph })); fl.rotation.x = -PI / 2; g.add(fl);
    const wh = lam(0xe8e8f0, { emissive: 0x606068 });
    for (const s of [-1, 1]) for (let i = -8; i <= 8; i++) { // 横断歩道(4方向)
      box(g, 1.3, 0.04, 7, i * 2.3, 0, s * 25, wh); box(g, 7, 0.04, 1.3, s * 25, 0, i * 2.3, wh); }
    for (let i = -9; i <= 9; i++) for (const a of [PI / 4, -PI / 4]) { const m = box(g, 1.2, 0.04, 6, i * 2.2 * Math.cos(a), 0, i * 2.2 * Math.sin(a), wh); m.rotation.y = a + PI / 2; } // 斜め横断
    // ビル群
    const ROOF = 30;
    building(g, 0, -34, 18, 18, ROOF, 1); building(g, 0, 34, 18, 18, ROOF, 2); // 屋上の舞台
    for (const sz of [-1, 1]) { // 屋上の縁・室外機・タンク
      const zc = sz * 34; box(g, 18, 1.0, 0.5, 0, ROOF, zc - sz * 8.7, lam(0x2a2c38)); box(g, 18, 1.0, 0.5, 0, ROOF, zc + sz * 8.7, lam(0x2a2c38)); box(g, 0.5, 1.0, 18, -8.7, ROOF, zc, lam(0x2a2c38)); box(g, 0.5, 1.0, 18, 8.7, ROOF, zc, lam(0x2a2c38));
      box(g, 3, 1.8, 2.2, -5.5, ROOF, zc + sz * 4, lam(0x6a6c78)); box(g, 3, 1.8, 2.2, 5.5, ROOF, zc + sz * 5, lam(0x6a6c78)); box(g, 2.6, 4, 2.6, 6.5, ROOF, zc + sz * 1, lam(0x3a3c48)); box(g, 0.2, 7, 0.2, -6, ROOF, zc + sz * 6, lam(0x8a8c98)); }
    const neon = [0xff3a9a, 0x3ad8ff, 0xffe03a, 0x7a4aff, 0xff5a3a, 0x3aff8a];
    const place = (x0, z0, dx, dz, n, off) => { for (let i = 0; i < n; i++) { const h = 22 + rnd(i * 3.7 + off) * 48; const w = 12 + rnd(i * 2.1 + off) * 12; const d = 14 + rnd(i * 5.3 + off) * 8;
      const bx = x0 + dx * i * 17, bz = z0 + dz * i * 17; building(g, bx, bz, w, d, h, off + i * 3);
      // ネオン看板
      const nc = neon[Math.floor(rnd(i * 9 + off) * neon.length)]; const face = Math.abs(dx) > 0 ? bz : bz; const fz = bz + (bz > 0 ? -1 : 1) * (d / 2 + 0.4);
      if (Math.abs(dz) < 0.1) box(g, w * 0.7, 2.2, 0.3, bx, 8 + rnd(i + off) * 10, fz, bas(nc)); } };
    place(-60, -66, 1, 0, 8, 11); place(-60, 66, 1, 0, 8, 23); // 北・南の列(屋上ビルの両脇)
    const placeSide = (x0, sx, off) => { for (let i = -3; i <= 3; i++) { const h = 24 + rnd(i * 4.1 + off) * 50; const d = 14 + rnd(i + off) * 8; const bx = x0 + sx * d / 2; building(g, bx, i * 18 - 0, d, 16, h, off + i * 3); } };
    placeSide(-24, -1, 31); placeSide(24, 1, 41);
    // 大型ビジョン(動画のように色が変わる)と109風の円筒ビル
    W.anim.screens = []; for (const [x, z, ry, w, h] of [[-23.4, -4, PI / 2, 14, 18], [23.4, 6, -PI / 2, 12, 16]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), bas(0xff3a9a)); m.position.set(x, 16 + h / 2, z); m.rotation.y = ry; g.add(m); W.anim.screens.push(m); }
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 48, 16), new THREE.MeshLambertMaterial({ color: 0xc86a8a, emissive: 0x4a1a2a })); cyl.position.set(-34, 24, 14); g.add(cyl);
    for (let k = 0; k < 6; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.35, 6, 20), bas(k % 2 ? 0xff6aaa : 0xffd0e0)); r.rotation.x = PI / 2; r.position.set(-34, 6 + k * 7, 14); g.add(r); }
    // 信号・街灯・車
    for (const [sx, sz] of [[-19, -19], [19, -19], [-19, 19], [19, 19]]) { box(g, 0.3, 7, 0.3, sx, 0, sz, lam(0x3a3c44)); box(g, 1.0, 2.6, 0.8, sx, 6, sz, lam(0x24262e)); box(g, 0.5, 0.5, 0.2, sx, 7.9, sz + 0.5, bas(0xff2a2a)); box(g, 0.5, 0.5, 0.2, sx, 6.5, sz + 0.5, bas(0x2aff6a)); }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; const x = Math.cos(a) * 34, z = Math.sin(a) * 34; box(g, 0.25, 6, 0.25, x, 0, z, lam(0x2a2c34)); box(g, 1.0, 0.5, 1.0, x, 6, z, bas(0xfff0c0)); }
    for (let i = 0; i < 12; i++) { const x = (rnd(i * 3.3) - 0.5) * 80, z = (rnd(i * 5.5) - 0.5) * 20 + (i % 2 ? 40 : -40); const col = [0xc83a3a, 0x3a5ac8, 0xd8d8d8, 0x2a2a2a][i % 4]; box(g, 4.4, 1.3, 2.0, x, 0, z, lam(col)); box(g, 2.4, 0.9, 1.9, x, 1.3, z, lam(0x1a2030)); }
    scene.add(g);
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
