/* KIT-TBR-01 BOM 3D 预览器（经典脚本，file:// 可直接打开） */
(function () {
"use strict";

if (typeof THREE === "undefined") {
  document.body.innerHTML =
    '<div style="padding:24px;color:#e8eef4;font-family:sans-serif;background:#0b0e13;min-height:100vh">' +
    "<h2>无法加载 Three.js</h2><p>请确认 vendor/three.min.js 存在，且通过 bom-3d/index.html 打开。</p></div>";
  return;
}

const BOM = window.BOM;
if (!BOM) {
  document.body.innerHTML =
    '<div style="padding:24px;color:#e8eef4;font-family:sans-serif;background:#0b0e13;min-height:100vh">' +
    "<h2>无法加载 BOM 数据</h2><p>请确认 bom-data.js 在同目录。</p></div>";
  return;
}

const byId = Object.fromEntries(BOM.parts.map((p) => [p.id, p]));
const byCat = {};
for (const c of BOM.categories) byCat[c.id] = [];
for (const p of BOM.parts) (byCat[p.cat] = byCat[p.cat] || []).push(p);

/* ── 场景 ── */
const wrap = document.getElementById("canvasWrap");
function viewportSize() {
  const w = wrap.clientWidth || wrap.parentElement.clientWidth || 800;
  const h = wrap.clientHeight || wrap.parentElement.clientHeight || 600;
  return { w: Math.max(w, 320), h: Math.max(h, 320) };
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (e) {
  document.getElementById("loading").innerHTML =
    "WebGL 初始化失败，请换 Chrome/Edge 或开启硬件加速<br/><small>" + e.message + "</small>";
  document.getElementById("loading").classList.remove("hide");
  return;
}

const vs0 = viewportSize();
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(vs0.w, vs0.h);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
if (THREE.ACESFilmicToneMapping !== undefined) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
}
wrap.appendChild(renderer.domElement);
renderer.domElement.style.display = "block";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e13);
scene.fog = new THREE.Fog(0x0b0e13, 1.8, 6);

const camera = new THREE.PerspectiveCamera(40, vs0.w / vs0.h, 0.01, 40);
camera.position.set(0.55, 0.38, 0.55);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 0.02, 0);
controls.minDistance = 0.12;
controls.maxDistance = 2.5;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.AmbientLight(0xa8b8c8, 0.45));
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(1.2, 1.8, 0.9);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
const sc = key.shadow.camera;
sc.left = -0.6; sc.right = 0.6; sc.top = 0.6; sc.bottom = -0.6;
scene.add(key);
const fill = new THREE.DirectionalLight(0x88aacc, 0.4);
fill.position.set(-1.2, 0.8, -0.6);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffaa66, 0.28);
rim.position.set(0, 0.4, -1.5);
scene.add(rim);

const grid = new THREE.GridHelper(2, 20, 0x253040, 0x151c26);
grid.position.y = -0.001;
scene.add(grid);
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(0.7, 48),
  new THREE.MeshStandardMaterial({ color: 0x121a24, roughness: 0.92 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const root = new THREE.Group();
scene.add(root);

/* ── 材质 ── */
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: opts.metalness ?? 0.35,
    roughness: opts.roughness ?? 0.45,
    transparent: false,
    opacity: 1,
    ...opts.extra,
  });
}

const MATS = {
  extrusion: mat(0x2b2e33, { metalness: 0.78, roughness: 0.32 }),
  plate: mat(0x9aa1a8, { metalness: 0.82, roughness: 0.28 }),
  dark: mat(0x1a1c20, { metalness: 0.25, roughness: 0.42 }),
  petg: mat(0xc8ccd2, { metalness: 0.1, roughness: 0.48 }),
  tpu: mat(0x2e3034, { metalness: 0.02, roughness: 0.88 }),
  metal: mat(0xa8aeb6, { metalness: 0.9, roughness: 0.22 }),
  bearing: mat(0xb0b6bc, { metalness: 0.95, roughness: 0.18 }),
  rubber: mat(0x0a0a0a, { metalness: 0, roughness: 0.92 }),
  orange: mat(0xe85d04, { metalness: 0.05, roughness: 0.4 }),
  brass: mat(0xb87333, { metalness: 0.7, roughness: 0.35 }),
  green: mat(0x1a8a4a, { metalness: 0.2, roughness: 0.4 }),
  yellow: mat(0xf0c040, { metalness: 0.3, roughness: 0.4 }),
  glass: mat(0x0c2840, { metalness: 0.5, roughness: 0.08 }),
  black: mat(0x111111, { metalness: 0.1, roughness: 0.7 }),
  blue: mat(0x3d5a80, { metalness: 0.2, roughness: 0.45 }),
  pcb: mat(0x0d4a2a, { metalness: 0.15, roughness: 0.55 }),
};
Object.values(MATS).forEach((m) => { m.userData.shared = true; });

function box(w, h, d, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function cyl(r, h, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function torus(R, r, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 12, 48), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function lathe(points, material) {
  const g = new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), 32);
  const m = new THREE.Mesh(g, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/* ── 参数化模型工厂 ── */
function buildModel(def, colorHex) {
  const g = new THREE.Group();
  const t = def.type;

  if (t === "extrusion") {
    const L = def.length;
    const m = MATS.extrusion;
    g.add(box(0.02, 0.02, L, m, 0, 0.01, 0));
    // 槽口示意
    for (const [ax, ay] of [[0.0105, 0], [-0.0105, 0], [0, 0.0105], [0, -0.0105]]) {
      g.add(box(0.002, 0.004, L * 0.98, MATS.dark, ax, ay + 0.01, 0));
    }
    if (def.slot) {
      g.add(box(0.008, 0.004, 0.03, MATS.dark, 0, 0.0205, L * 0.22));
    }
    // 端盖
    g.add(box(0.022, 0.022, 0.002, MATS.dark, 0, 0.01, L / 2 + 0.001));
    g.add(box(0.022, 0.022, 0.002, MATS.dark, 0, 0.01, -L / 2 - 0.001));
  } else if (t === "baseplate") {
    const m = MATS.plate;
    // 真实 560×460×2 mm
    g.add(box(0.56, 0.002, 0.46, m, 0, 0.001, 0));
    // 进料口 180×340，x +100…+280 → 中心相对板心 +0.09
    g.add(box(0.18, 0.004, 0.34, MATS.dark, 0.09, 0.001, 0));
    // 前轮拱
    for (const s of [1, -1]) g.add(box(0.10, 0.004, 0.09, MATS.dark, 0.06, 0.001, s * 0.175));
    // 后驱电机让位
    g.add(box(0.055, 0.004, 0.055, MATS.dark, -0.26, 0.001, 0));
    // 走线孔
    for (const s of [1, -1])
      for (const sx of [-0.18, -0.24])
        g.add(cyl(0.006, 0.006, MATS.dark, sx, 0.001, s * 0.18, 0, 0, 0, 12));
  } else if (t === "skirt") {
    const m = MATS.plate;
    g.add(box(0.18, 0.0675, 0.002, m, 0, 0.034, 0.115));
    g.add(box(0.002, 0.0675, 0.23, m, -0.09, 0.034, 0));
    g.add(box(0.09, 0.0675, 0.002, m, -0.045, 0.034, -0.115));
  } else if (t === "deflector") {
    const m = MATS.plate;
    g.add(box(0.074, 0.002, 0.144, m, 0, 0, 0, 0, 0, 0));
    g.add(box(0.074, 0.018, 0.002, m, 0, 0.009, 0.072));
    g.add(box(0.074, 0.018, 0.002, m, 0, 0.009, -0.072));
    g.add(box(0.07, 0.001, 0.14, MATS.rubber, 0, 0.002, 0));
  } else if (t === "jgb37") {
    g.add(cyl(0.0185, 0.055, MATS.dark, 0, 0.028, 0, 0, 0, 0, 32));
    g.add(cyl(0.012, 0.028, MATS.metal, 0, 0.07, 0, 0, 0, 0, 24));
    g.add(cyl(0.003, 0.015, MATS.metal, 0, 0.09, 0, 0, 0, 0, 12));
    // 法兰耳
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      g.add(box(0.008, 0.002, 0.012, MATS.dark, Math.cos(a) * 0.018, 0.052, Math.sin(a) * 0.018, 0, -a, 0));
      g.add(cyl(0.0015, 0.004, MATS.metal, Math.cos(a) * 0.022, 0.052, Math.sin(a) * 0.022, 0, 0, 0, 8));
    }
    if (def.encoder) {
      g.add(cyl(0.014, 0.008, MATS.green, 0, 0.004, 0, 0, 0, 0, 20));
    }
  } else if (t === "mg996") {
    g.add(box(0.04, 0.02, 0.038, MATS.dark, 0, 0.019, 0));
    g.add(box(0.054, 0.004, 0.02, MATS.dark, 0, 0.041, 0));
    g.add(cyl(0.006, 0.006, MATS.metal, 0.012, 0.046, 0, 0, 0, 0, 16));
    g.add(box(0.03, 0.002, 0.008, MATS.metal, 0.02, 0.048, 0, 0, 0, 0.2));
    g.add(box(0.008, 0.004, 0.006, MATS.black, -0.018, 0.01, 0.02));
  } else if (t === "bearing608") {
    g.add(torus(0.008, 0.0035, MATS.bearing, 0, 0.011, 0, Math.PI / 2, 0, 0));
    g.add(cyl(0.011, 0.007, MATS.bearing, 0, 0.011, 0, 0, 0, 0, 32));
    g.add(cyl(0.004, 0.008, MATS.dark, 0, 0.011, 0, 0, 0, 0, 16));
    g.add(cyl(0.0095, 0.0072, MATS.rubber, 0, 0.011, 0, 0, 0, 0, 24));
  } else if (t === "pillow") {
    g.add(box(0.05, 0.035, 0.028, MATS.plate, 0, 0.018, 0));
    g.add(cyl(0.014, 0.03, MATS.bearing, 0, 0.022, 0, Math.PI / 2, 0, 0, 24));
    g.add(cyl(0.005, 0.032, MATS.dark, 0, 0.022, 0, Math.PI / 2, 0, 0, 16));
    g.add(box(0.06, 0.008, 0.04, MATS.plate, 0, 0.004, 0));
  } else if (t === "shaft") {
    g.add(cyl(def.d / 2, def.len, MATS.metal, 0, 0, 0, Math.PI / 2, 0, 0, 20));
    const thread = def.d * 0.85;
    g.add(cyl(thread / 2, 0.015, MATS.metal, 0, 0, def.len / 2 - 0.004, Math.PI / 2, 0, 0, 16));
    g.add(cyl(thread / 2, 0.015, MATS.metal, 0, 0, -def.len / 2 + 0.004, Math.PI / 2, 0, 0, 16));
  } else if (t === "pulley") {
    const R = def.teeth <= 20 ? 0.009 : 0.016;
    g.add(cyl(R, 0.012, MATS.metal, 0, 0.016, 0, Math.PI / 2, 0, 0, 28));
    g.add(cyl(def.bore / 2 + 0.001, 0.014, MATS.dark, 0, 0.016, 0, Math.PI / 2, 0, 0, 16));
    // 齿示意
    const n = Math.min(def.teeth, 16);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      g.add(box(0.002, 0.0015, 0.011, MATS.metal, Math.cos(a) * R, 0.016 + Math.sin(a) * R, 0, 0, 0, a));
    }
  } else if (t === "belt") {
    g.add(torus(def.major, 0.003, MATS.rubber, 0, 0.03, 0, 0, 0, 0));
    g.add(torus(def.minor, 0.0025, MATS.rubber, 0, 0.03, 0.001, 0, 0, 0));
  } else if (t === "screw") {
    const headR = def.d * 1.6;
    const headH = def.d * 0.7;
    g.add(cyl(headR, headH, MATS.metal, 0, headH / 2, 0, 0, 0, 0, 20));
    // 内六角
    g.add(cyl(headR * 0.45, headH + 0.001, MATS.dark, 0, headH / 2 + 0.0005, 0, 0, 0, 0, 6));
    g.add(cyl(def.d / 2, def.len, MATS.metal, 0, headH + def.len / 2, 0, 0, 0, 0, 16));
    // 螺纹示意
    const coils = Math.max(3, Math.floor(def.len / def.d));
    for (let i = 0; i < coils; i++) {
      const y = headH + (i + 0.5) * (def.len / coils);
      g.add(cyl(def.d * 0.58, def.len / coils * 0.35, MATS.metal, 0, y, 0, 0, 0, 0, 12));
    }
  } else if (t === "tnut") {
    g.add(box(0.008, 0.003, 0.012, MATS.plate, 0, 0.0015, 0));
    g.add(box(0.006, 0.004, 0.008, MATS.plate, 0, 0.005, 0));
    g.add(cyl(0.0022, 0.005, MATS.dark, 0, 0.003, 0, 0, 0, 0, 12));
    // 弹片
    g.add(box(0.004, 0.001, 0.006, MATS.metal, 0, 0.007, 0.002));
  } else if (t === "flange_nut") {
    g.add(cyl(0.006, 0.004, MATS.plate, 0, 0.002, 0, 0, 0, 0, 6));
    g.add(cyl(0.008, 0.001, MATS.plate, 0, 0.0045, 0, 0, 0, 0, 20));
    g.add(cyl(0.0025, 0.006, MATS.dark, 0, 0.002, 0, 0, 0, 0, 12));
  } else if (t === "heatset") {
    g.add(cyl(def.d * 0.7, 0.006, MATS.brass, 0, 0.003, 0, 0, 0, 0, 16));
    g.add(cyl(def.d * 0.4, 0.008, MATS.dark, 0, 0.003, 0, 0, 0, 0, 12));
    g.add(cyl(def.d * 0.75, 0.001, MATS.brass, 0, 0.0005, 0, 0, 0, 0, 16));
  } else if (t === "circlip") {
    g.add(torus(def.d / 2 + 0.001, 0.0008, MATS.metal, 0, 0.01, 0, Math.PI / 2, 0, 0));
    g.add(box(0.002, 0.001, 0.003, MATS.metal, def.d / 2 + 0.001, 0.01, 0));
    g.add(box(0.002, 0.001, 0.003, MATS.metal, -def.d / 2 - 0.001, 0.01, 0));
  } else if (t === "setscrew") {
    g.add(cyl(0.002, 0.004, MATS.metal, 0, 0.002, 0, 0, 0, 0, 12));
    g.add(cyl(0.0012, 0.0045, MATS.dark, 0, 0.002, 0, 0, 0, 0, 6));
  } else if (t === "starknob") {
    g.add(cyl(0.008, 0.005, MATS.orange, 0, 0.0025, 0, 0, 0, 0, 5));
    g.add(cyl(0.003, 0.01, MATS.metal, 0, 0.008, 0, 0, 0, 0, 12));
  } else if (t === "springpin") {
    g.add(cyl(0.003, 0.03, MATS.metal, 0, 0.015, 0, 0, 0, 0, 16));
    g.add(torus(0.006, 0.001, MATS.metal, 0, 0.032, 0, Math.PI / 2, 0, 0));
    g.add(cyl(0.0035, 0.004, MATS.orange, 0, 0.002, 0, 0, 0, 0, 12));
  } else if (t === "corner") {
    const m = MATS.orange;
    g.add(box(0.04, 0.035, 0.004, m, 0.02, 0.018, 0));
    g.add(box(0.004, 0.035, 0.04, m, 0, 0.018, 0.02));
    g.add(box(0.04, 0.004, 0.04, m, 0.02, 0.002, 0.02));
    // 加强
    g.add(box(0.025, 0.002, 0.002, m, 0.015, 0.012, 0.003, 0, 0, -0.7));
    for (const [x, z] of [[0.02, 0.003], [0.003, 0.02], [0.035, 0.02], [0.02, 0.035]]) {
      g.add(cyl(0.0022, 0.006, MATS.dark, x, 0.018, z, 0, 0, 0, 10));
    }
  } else if (t === "tpu_sleeve") {
    // 轴线沿本地 X，中心在原点（装配时 rot Y→沿Z）
    g.add(cyl(0.07, 0.176, MATS.tpu, 0, 0, 0, 0, 0, Math.PI / 2, 48));
    g.add(cyl(0.06, 0.178, MATS.dark, 0, 0, 0, 0, 0, Math.PI / 2, 32));
    for (let i = 0; i < 12; i++) {
      const a = i * 0.55;
      g.add(box(0.008, 0.006, 0.16, MATS.tpu, 0, Math.cos(a) * 0.068, Math.sin(a) * 0.068, a, 0, 0));
    }
  } else if (t === "guide_arc") {
    // 弧道段简化
    const shape = new THREE.Shape();
    shape.moveTo(0.08, 0);
    shape.absarc(0, 0, 0.1, -0.2, 0.35, false);
    shape.lineTo(0.11 * Math.cos(0.35), 0.11 * Math.sin(0.35));
    shape.absarc(0, 0, 0.11, 0.35, -0.2, true);
    shape.lineTo(0.08, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
    const mesh = new THREE.Mesh(geo, MATS.petg);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(-0.05, 0.02, -0.1);
    mesh.castShadow = mesh.receiveShadow = true;
    g.add(mesh);
  } else if (t === "bearing_house") {
    g.add(box(0.022, 0.016, 0.022, MATS.petg, 0, 0.008, 0));
    g.add(cyl(0.011, 0.018, MATS.dark, 0, 0.008, 0, Math.PI / 2, 0, 0, 24));
    g.add(cyl(0.008, 0.02, MATS.bearing, 0, 0.008, 0, Math.PI / 2, 0, 0, 20));
    for (const s of [1, -1]) g.add(cyl(0.0018, 0.008, MATS.brass, s * 0.008, 0.014, 0, 0, 0, 0, 10));
  } else if (t === "motor_mount") {
    g.add(torus(0.02, 0.003, MATS.petg, 0, 0.025, 0, Math.PI / 2, 0, 0));
    g.add(box(0.05, 0.006, 0.04, MATS.petg, 0, 0.003, 0));
    g.add(box(0.006, 0.045, 0.04, MATS.petg, -0.022, 0.022, 0));
    for (const s of [1, -1]) g.add(cyl(0.0018, 0.008, MATS.brass, 0.012, 0.006, s * 0.012, 0, 0, 0, 10));
  } else if (t === "knuckle") {
    g.add(cyl(0.005, 0.04, MATS.petg, 0, 0.02, 0, 0, 0, 0, 16));
    g.add(box(0.03, 0.02, 0.014, MATS.petg, 0.015, 0.012, 0));
    g.add(cyl(0.008, 0.016, MATS.dark, 0.028, 0.012, 0, Math.PI / 2, 0, 0, 20));
    g.add(box(0.02, 0.006, 0.008, MATS.petg, 0.008, 0.022, 0));
  } else if (t === "servo_mount") {
    g.add(box(0.05, 0.008, 0.03, MATS.petg, 0, 0.004, 0));
    g.add(box(0.008, 0.03, 0.03, MATS.petg, -0.02, 0.018, 0));
    g.add(box(0.008, 0.03, 0.03, MATS.petg, 0.02, 0.018, 0));
    g.add(box(0.04, 0.004, 0.028, MATS.petg, 0, 0.032, 0));
  } else if (t === "ecu_box") {
    g.add(box(0.055, 0.024, 0.03, MATS.petg, 0, 0.012, 0));
    g.add(box(0.05, 0.022, 0.025, MATS.dark, 0, 0.012, 0));
  } else if (t === "ecu_lid") {
    g.add(box(0.057, 0.003, 0.032, MATS.petg, 0, 0.002, 0));
    g.add(box(0.052, 0.002, 0.027, MATS.petg, 0, 0.004, 0));
    for (const s of [1, -1])
      for (const sx of [1, -1])
        g.add(cyl(0.0015, 0.005, MATS.dark, sx * 0.024, 0.002, s * 0.013, 0, 0, 0, 8));
  } else if (t === "cam_bracket") {
    g.add(box(0.03, 0.008, 0.03, MATS.petg, 0, 0.004, 0));
    g.add(box(0.008, 0.025, 0.03, MATS.petg, 0, 0.016, 0));
    g.add(box(0.016, 0.006, 0.016, MATS.dark, 0.01, 0.022, 0));
    g.add(cyl(0.004, 0.006, MATS.glass, 0.01, 0.026, 0, 0, 0, 0, 16));
  } else if (t === "tof_bracket") {
    g.add(box(0.018, 0.012, 0.008, MATS.petg, 0, 0.006, 0));
    g.add(box(0.014, 0.01, 0.002, MATS.green, 0, 0.006, 0.005));
    g.add(cyl(0.002, 0.004, MATS.dark, 0, 0.01, 0.004, Math.PI / 2, 0, 0, 12));
  } else if (t === "wheel_cover") {
    g.add(torus(0.04, 0.008, MATS.petg, 0, 0.05, 0, 0, 0, 0));
    g.add(cyl(0.048, 0.004, MATS.petg, 0, 0.05, 0, Math.PI / 2, 0, 0, 32));
  } else if (t === "finger") {
    g.add(box(0.0165, 0.005, 0.006, MATS.petg, 0, 0.004, 0));
    for (let i = 0; i < 6; i++) {
      g.add(box(0.002, 0.004, 0.008, MATS.petg, -0.007 + i * 0.0028, 0.009, 0));
    }
  } else if (t === "basket_corner") {
    g.add(box(0.011, 0.08, 0.011, MATS.petg, 0, 0.04, 0));
    g.add(box(0.02, 0.08, 0.004, MATS.petg, 0.008, 0.04, 0));
    g.add(box(0.004, 0.08, 0.02, MATS.petg, 0, 0.04, 0.008));
  } else if (t === "estop") {
    g.add(box(0.02, 0.01, 0.02, MATS.dark, 0, 0.005, 0));
    g.add(cyl(0.008, 0.012, MATS.orange, 0, 0.016, 0, 0, 0, 0, 16));
  } else if (t === "sbc") {
    g.add(box(0.04, 0.002, 0.03, MATS.pcb, 0, 0.001, 0));
    g.add(box(0.015, 0.003, 0.012, MATS.dark, 0.008, 0.004, 0));
    g.add(box(0.008, 0.004, 0.006, MATS.metal, -0.015, 0.003, 0.01));
    g.add(cyl(0.002, 0.003, MATS.metal, 0.012, 0.004, -0.008, 0, 0, 0, 10));
  } else if (t === "esp32") {
    g.add(box(0.025, 0.002, 0.05, MATS.pcb, 0, 0.001, 0));
    g.add(box(0.015, 0.003, 0.018, MATS.metal, 0, 0.004, -0.01));
    g.add(box(0.006, 0.002, 0.004, MATS.dark, 0, 0.004, 0.018));
    for (let i = 0; i < 8; i++) g.add(box(0.002, 0.003, 0.002, MATS.dark, -0.008, 0.003, -0.02 + i * 0.005));
  } else if (t === "camera") {
    g.add(cyl(0.008, 0.012, MATS.dark, 0, 0.008, 0, 0, 0, 0, 20));
    g.add(cyl(0.005, 0.004, MATS.glass, 0, 0.015, 0, 0, 0, 0, 16));
    g.add(box(0.008, 0.006, 0.004, MATS.black, 0, 0.004, 0.01));
  } else if (t === "tof") {
    g.add(box(0.012, 0.008, 0.002, MATS.pcb, 0, 0.004, 0));
    g.add(box(0.004, 0.004, 0.003, MATS.dark, 0, 0.006, 0.002));
    g.add(cyl(0.0015, 0.002, MATS.glass, -0.002, 0.006, 0.003, Math.PI / 2, 0, 0, 8));
  } else if (t === "driver") {
    g.add(box(0.03, 0.002, 0.022, MATS.pcb, 0, 0.001, 0));
    g.add(box(0.012, 0.004, 0.012, MATS.dark, 0, 0.004, 0));
    g.add(box(0.006, 0.003, 0.008, MATS.metal, -0.01, 0.003, 0));
  } else if (t === "lipo") {
    g.add(box(0.07, 0.025, 0.035, MATS.blue, 0, 0.0125, 0));
    g.add(box(0.01, 0.006, 0.012, MATS.yellow, 0.04, 0.015, 0));
    g.add(box(0.004, 0.004, 0.006, MATS.orange, 0.046, 0.015, 0));
  } else if (t === "xt60") {
    g.add(box(0.015, 0.008, 0.008, MATS.yellow, 0, 0.004, 0));
    g.add(cyl(0.002, 0.01, MATS.metal, -0.003, 0.004, 0, Math.PI / 2, 0, 0, 8));
    g.add(cyl(0.002, 0.01, MATS.metal, 0.003, 0.004, 0, Math.PI / 2, 0, 0, 8));
  } else if (t === "jst") {
    g.add(box(0.012, 0.006, 0.005, MATS.petg, 0, 0.003, 0));
    g.add(box(0.002, 0.002, 0.008, MATS.metal, -0.003, 0.003, 0.006));
    g.add(box(0.002, 0.002, 0.008, MATS.metal, 0.003, 0.003, 0.006));
  } else if (t === "alu_core") {
    g.add(cyl(0.04, 0.18, MATS.plate, 0, 0, 0, 0, 0, Math.PI / 2, 36));
    g.add(cyl(0.036, 0.182, MATS.dark, 0, 0, 0, 0, 0, Math.PI / 2, 24));
  } else if (t === "endcap") {
    g.add(cyl(0.016, 0.012, MATS.petg, 0, 0, 0, 0, 0, Math.PI / 2, 28));
    g.add(cyl(0.011, 0.014, MATS.dark, 0, 0, 0, 0, 0, Math.PI / 2, 20));
    g.add(cyl(0.004, 0.02, MATS.metal, 0, 0, 0, 0, 0, Math.PI / 2, 12));
  } else if (t === "wheel") {
    g.add(cyl(0.05, 0.038, MATS.rubber, 0, 0, 0, Math.PI / 2, 0, 0, 40));
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      g.add(box(0.006, 0.004, 0.036, MATS.dark, 0.048 * Math.cos(a), 0.048 * Math.sin(a), 0, 0, 0, a));
    }
    g.add(cyl(0.019, 0.042, MATS.metal, 0, 0, 0, Math.PI / 2, 0, 0));
    g.add(cyl(0.006, 0.048, MATS.bearing, 0, 0, 0, Math.PI / 2, 0, 0, 16));
  } else if (t === "shroud") {
    g.add(torus(0.055, 0.006, MATS.petg, 0, 0.07, 0, 0, 0, 0));
    for (let i = 0; i < 3; i++) g.add(box(0.008, 0.008, 0.16, MATS.petg, 0, 0.07, (i - 1) * 0.05));
  } else if (t === "idler") {
    g.add(cyl(0.008, 0.012, MATS.bearing, 0, 0.016, 0, Math.PI / 2, 0, 0, 16));
    g.add(box(0.02, 0.004, 0.008, MATS.frame, 0, 0.002, 0));
  } else if (t === "tie_rod") {
    g.add(cyl(0.002, 0.12, MATS.metal, 0, 0.01, 0, 0, 0, Math.PI / 2, 12));
    g.add(cyl(0.005, 0.008, MATS.metal, 0.06, 0.01, 0, 0, 0, 0, 12));
    g.add(cyl(0.005, 0.008, MATS.metal, -0.06, 0.01, 0, 0, 0, 0, 12));
  } else if (t === "basket") {
    // 内腔示意 360×420×160
    const m = MATS.orange;
    g.add(box(0.36, 0.004, 0.42, m, 0, 0.002, 0));
    g.add(box(0.004, 0.16, 0.42, m, -0.18, 0.08, 0));
    g.add(box(0.36, 0.16, 0.004, m, 0, 0.08, 0.21));
    g.add(box(0.36, 0.16, 0.004, m, 0, 0.08, -0.21));
    g.add(box(0.004, 0.16, 0.42, m, 0.18, 0.08, 0));
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 4; j++)
        g.add(cyl(0.004, 0.006, MATS.dark, -0.12 + i * 0.06, 0.001, -0.12 + j * 0.08, 0, 0, 0, 8));
  } else {
    g.add(box(0.03, 0.02, 0.03, MATS.petg, 0, 0.01, 0));
  }

  return g;
}

/* ── STL 缓存 ── */
const stlLoader = new THREE.STLLoader();
const stlCache = new Map();

function loadSTL(url) {
  if (stlCache.has(url)) return stlCache.get(url);
  const p = new Promise((resolve) => {
    stlLoader.load(
      url,
      (geo) => {
        geo.computeVertexNormals();
        geo.center();
        // 缩放到约 80mm 尺度
        geo.computeBoundingBox();
        const s = new THREE.Vector3();
        geo.boundingBox.getSize(s);
        const maxDim = Math.max(s.x, s.y, s.z) || 1;
        const scale = 0.08 / maxDim;
        geo.scale(scale, scale, scale);
        resolve(geo);
      },
      undefined,
      () => resolve(null)
    );
  });
  stlCache.set(url, p);
  return p;
}

/* ── 视图状态 ── */
const state = {
  mode: "full", // full | part | assembly
  partId: "E-01",
  asmId: null,
  view: "solid", // solid | xray | wire
  explode: 0, // 0..1
  showConnectors: true,
  moduleFilter: null, // null | M1..M7
  selectedFullId: null,
};

let viewGroup = null;
let draggable = []; // { mesh, axis, travel, base, t(0..1) }
let selectedDrag = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane();
const hitPoint = new THREE.Vector3();

function clearView() {
  if (viewGroup) {
    root.remove(viewGroup);
    viewGroup.traverse((o) => {
      // STL 缓存几何体不可释放
      if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose();
    });
  }
  viewGroup = new THREE.Group();
  root.add(viewGroup);
  draggable = [];
  selectedDrag = null;
  fullNodes = [];
  engineRoot = null;
  bodyMeshes = [];
  bomGroups = {};
}

function applyViewMode(group) {
  group.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m.userData._orig) {
        m.userData._orig = {
          transparent: m.transparent,
          opacity: m.opacity,
          wireframe: m.wireframe,
          depthWrite: m.depthWrite,
          side: m.side,
        };
      }
      if (state.view === "solid") {
        m.transparent = m.userData._orig.transparent;
        m.opacity = m.userData._orig.opacity;
        m.wireframe = false;
        m.depthWrite = true;
        m.side = THREE.FrontSide;
      } else if (state.view === "xray") {
        m.transparent = true;
        m.opacity = 0.28;
        m.wireframe = false;
        m.depthWrite = false;
        m.side = THREE.DoubleSide;
      } else if (state.view === "wire") {
        m.transparent = false;
        m.opacity = 1;
        m.wireframe = true;
        m.depthWrite = true;
        m.side = THREE.DoubleSide;
      }
      m.needsUpdate = true;
    }
  });
}

function colorize(group, hex) {
  // 仅微调独立材质；共享 MATS 不动，避免污染后续视图
  const c = new THREE.Color(hex || "#c8ccd2");
  group.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m.userData.shared) continue;
      if (m.color) m.color.copy(c);
    }
  });
}

async function showPart(id) {
  // 默认：在总装中定位，而不是单独漂浮展示零件
  showPartInAssembly(id);
}

/** 单独预览（仍保留，供需要时使用） */
async function showPartIsolated(id) {
  const part = byId[id];
  if (!part) return;
  state.mode = "part";
  state.partId = id;
  state.asmId = null;
  state.explode = 0;
  clearView();

  setLoading(true, "单独预览 " + part.name + " …");

  let model = null;
  if (part.stl) {
    const geo = await loadSTL(part.stl);
    if (geo) {
      model = new THREE.Group();
      const mesh = new THREE.Mesh(
        geo,
        mat(part.color, { metalness: 0.12, roughness: 0.5 })
      );
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.sharedGeo = true;
      model.add(mesh);
    }
  }
  if (!model) {
    model = buildModel(part.model || { type: "default" }, part.color);
  }
  colorize(model, part.color);
  viewGroup.add(model);

  if (state.showConnectors && part.connects && part.connects.length) {
    const links = part.connects.filter((cid) => byId[cid]).slice(0, 6);
    links.forEach((cid, i) => {
      const cp = byId[cid];
      const a = (i / links.length) * Math.PI * 2;
      const R = 0.16;
      const cm = buildModel(cp.model || { type: "default" }, cp.color);
      cm.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      cm.scale.setScalar(0.7);
      cm.userData.connector = cid;
      cm.userData.float = true;
      viewGroup.add(cm);
      const from = new THREE.Vector3(0, 0.03, 0);
      const to = new THREE.Vector3(Math.cos(a) * R * 0.7, 0.02, Math.sin(a) * R * 0.7);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([from, to]);
      const line = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({ color: 0xe85d04, transparent: true, opacity: 0.45 })
      );
      viewGroup.add(line);
    });
  }

  applyViewMode(viewGroup);
  frameCamera(viewGroup);
  setLoading(false);
  renderDetailPart(part, null, "当前为单独预览");
  renderPartList();
  updateModeChip();
  setModeButtons();
  document.getElementById("dragHint").classList.remove("show");
}

function layoutAssembly(asm, hostG, guestG) {
  // 按装配类型摆放主件/配合件，使连接关系一眼可读
  const id = asm.id;
  if (id === "asm-corner") {
    hostG.rotation.y = Math.PI / 2; // 纵梁沿 X
    hostG.position.set(0, 0, 0);
    guestG.rotation.y = 0; // 横梁沿 Z，在末端交汇
    guestG.position.set(0, 0, 0);
  } else if (id === "asm-baseplate") {
    hostG.position.set(0, 0.035, 0);
    hostG.scale.setScalar(0.55);
    guestG.rotation.y = Math.PI / 2;
    guestG.position.set(0, 0, 0);
  } else if (id === "asm-roller") {
    hostG.rotation.x = Math.PI / 2;
    hostG.position.set(0, 0.05, 0);
    guestG.position.set(0, 0.05, 0);
    guestG.scale.setScalar(0.9);
  } else if (id === "asm-motor") {
    hostG.position.set(0, 0, 0);
    guestG.position.set(0, 0.02, 0);
    guestG.scale.setScalar(0.85);
  } else if (id === "asm-steer") {
    hostG.position.set(0, 0, 0);
    guestG.rotation.x = Math.PI / 2;
    guestG.position.set(0, 0.02, 0);
    guestG.scale.setScalar(0.9);
  } else if (id === "asm-basket") {
    hostG.position.set(0, 0, 0);
    hostG.scale.setScalar(1.1);
    guestG.rotation.y = Math.PI / 2;
    guestG.position.set(0.05, 0, 0);
  } else if (id === "asm-bearing") {
    hostG.position.set(0, 0, 0);
    hostG.scale.setScalar(1.4);
    guestG.rotation.x = Math.PI / 2;
    guestG.position.set(0, 0.008, 0);
    guestG.scale.setScalar(0.9);
  } else if (id === "asm-servo") {
    hostG.position.set(0, 0, 0);
    hostG.scale.setScalar(1.2);
    guestG.position.set(0, 0.008, 0);
    guestG.scale.setScalar(0.9);
  } else if (id === "asm-ecu") {
    hostG.position.set(0, 0, 0);
    hostG.scale.setScalar(1.1);
    guestG.position.set(0, 0.03, 0);
  } else if (id === "asm-gt2") {
    hostG.rotation.x = Math.PI / 2;
    hostG.position.set(-0.03, 0.03, 0);
    guestG.rotation.x = Math.PI / 2;
    guestG.position.set(0.03, 0.03, 0);
  } else {
    hostG.position.set(-0.05, 0, 0);
    guestG.position.set(0.06, 0, 0);
  }
}

async function showAssembly(asmId) {
  const asm = BOM.assemblies.find((a) => a.id === asmId);
  if (!asm) return;
  state.mode = "assembly";
  state.asmId = asmId;
  state.explode = 0.35; // 默认半爆炸，便于看清连接件
  clearView();

  setLoading(true, "装配场景 " + asm.name + " …");

  const host = byId[asm.host];
  const guest = byId[asm.guest];

  const hostG = buildModel(host.model || { type: "default" }, host.color);
  hostG.userData.role = "host";
  viewGroup.add(hostG);

  let guestG = null;
  if (guest && guest.id !== host.id) {
    guestG = buildModel(guest.model || { type: "default" }, guest.color);
    guestG.userData.role = "guest";
    viewGroup.add(guestG);
  }

  if (guestG) {
    layoutAssembly(asm, hostG, guestG);
    guestG.userData.basePos = guestG.position.clone();
  } else {
    hostG.position.set(0, 0, 0);
  }

  // 可拖动连接件 —— t 初始 0.55，方便一上来就能拖
  for (const c of asm.connectors) {
    const cp = byId[c.id];
    if (!cp) continue;
    const cm = buildModel(cp.model || { type: "default" }, cp.color);
    const base = new THREE.Vector3(...c.offset);
    cm.position.copy(base);
    cm.userData.role = "connector";
    cm.userData.connId = c.id;
    cm.userData.label = c.label || cp.name;
    cm.userData.axis = c.axis || "y";
    cm.userData.travel = c.travel || 0.03;
    cm.userData.base = base.clone();
    cm.userData.t = 0.55;
    cm.scale.setScalar(0.95);
    viewGroup.add(cm);
    draggable.push(cm);
  }

  applyViewMode(viewGroup);
  applyExplode(state.explode);
  frameCamera(viewGroup);
  setLoading(false);
  renderDetailAsm(asm);
  renderPartList();
  updateModeChip();
  setModeButtons();
  document.getElementById("dragHint").classList.add("show");
  if (explSlider) {
    explSlider.value = Math.round(state.explode * 100);
    explPct.textContent = explSlider.value + "%";
  }
}

function applyExplode(t) {
  state.explode = t;
  if (!viewGroup) return;
  viewGroup.traverse((o) => {
    if (o.userData?.role === "guest" && o.userData.basePos) {
      o.position.copy(o.userData.basePos).add(new THREE.Vector3(t * 0.12, t * 0.04, 0));
    }
    if (o.userData?.role === "connector" && o.userData.base) {
      const axis = o.userData.axis;
      const travel = o.userData.travel * (1 + t * 2);
      const dragT = o.userData.t || 0;
      const off = new THREE.Vector3();
      if (axis === "x") off.x = travel * dragT;
      else if (axis === "y") off.y = travel * dragT;
      else off.z = travel * dragT;
      o.position.copy(o.userData.base).add(off);
    }
  });
  const label = document.getElementById("explodeVal");
  if (label) label.textContent = Math.round(t * 100) + "%";
}

function frameCamera(group) {
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.12);
  const dist = maxDim * 2.2;
  controls.target.copy(center);
  camera.position.set(center.x + dist * 0.7, center.y + dist * 0.55, center.z + dist * 0.7);
  controls.update();
}

function setLoading(on, msg) {
  const el = document.getElementById("loading");
  if (on) {
    el.classList.remove("hide");
    el.textContent = msg || "加载中…";
  } else {
    el.classList.add("hide");
  }
}

function updateModeChip() {
  const el = document.getElementById("modeChip");
  if (state.mode === "full") {
    el.textContent = "总装图 · " + (state.moduleFilter || "全部模块");
  } else if (state.mode === "assembly") {
    const asm = BOM.assemblies.find((a) => a.id === state.asmId);
    el.textContent = "连接装配 · " + (asm?.name || "");
  } else {
    const p = byId[state.partId];
    el.textContent = "部件预览 · " + (p?.id || "");
  }
}

/* ── 拖动 ── */
function onPointerDown(e) {
  if (state.mode === "full") {
    state._clickX = e.clientX;
    state._clickY = e.clientY;
    return;
  }
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(draggable, true);
  if (!hits.length) return;
  let obj = hits[0].object;
  while (obj && !obj.userData?.axis) obj = obj.parent;
  if (!obj) return;
  selectedDrag = obj;
  controls.enabled = false;
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), obj.position);
  document.body.style.cursor = "grabbing";
}

function onPointerMove(e) {
  if (!selectedDrag) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  if (!raycaster.ray.intersectPlane(dragPlane, hitPoint)) return;

  const obj = selectedDrag;
  const axis = obj.userData.axis;
  const base = obj.userData.base;
  const travel = obj.userData.travel * (1 + state.explode * 2);
  let t = 0;
  if (axis === "x") t = (hitPoint.x - base.x) / travel;
  else if (axis === "y") t = (hitPoint.y - base.y) / travel;
  else t = (hitPoint.z - base.z) / travel;
  t = Math.max(0, Math.min(1, t));
  obj.userData.t = t;
  applyExplode(state.explode);

  const info = document.getElementById("dragInfo");
  if (info) info.textContent = `${obj.userData.label} · 拉出 ${Math.round(t * 100)}%`;
}

function onPointerUp(e) {
  if (state.mode === "full" && state._clickX != null) {
    const dx = e.clientX - state._clickX;
    const dy = e.clientY - state._clickY;
    if (dx * dx + dy * dy < 25) pickFullPart(e.clientX, e.clientY);
    state._clickX = null;
    state._clickY = null;
  }
  selectedDrag = null;
  controls.enabled = true;
  document.body.style.cursor = "";
  const info = document.getElementById("dragInfo");
  if (info) info.textContent = state.mode === "full" ? "点击零件查看尺寸与安装方法" : "拖动连接件沿装配轴滑入/拉出";
}

renderer.domElement.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);

/* ── UI ── */
function renderPartList() {
  const list = document.getElementById("partList");
  const q = (document.getElementById("searchInput").value || "").trim().toLowerCase();
  list.innerHTML = "";

  const fullBtn = document.createElement("button");
  fullBtn.className = "part-item" + (state.mode === "full" && !state.partId ? " on" : "");
  fullBtn.innerHTML = `
    <span class="sw" style="background:#3dd68c"></span>
    <span class="nm">★ 总装图<small>整机爆炸 / 模块过滤 / 点选零件</small></span>
    <span class="qty">总装</span>`;
  fullBtn.onclick = () => showFullAssembly();
  list.appendChild(fullBtn);

  for (const cat of BOM.categories) {
    const items = (byCat[cat.id] || []).filter((p) => {
      if (!q) return true;
      return (
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.spec || "").toLowerCase().includes(q)
      );
    });
    if (!items.length) continue;
    const head = document.createElement("div");
    head.className = "cat-head";
    head.innerHTML = `<span class="dot" style="background:${cat.color}"></span>${cat.name}`;
    list.appendChild(head);
    for (const p of items) {
      const btn = document.createElement("button");
      btn.className = "part-item" + (state.partId === p.id ? " on" : "");
      btn.innerHTML = `
        <span class="sw" style="background:${p.color}"></span>
        <span class="nm">${p.name}<small>${p.id} · ${p.spec || ""}</small></span>
        <span class="qty">×${p.qty}</span>`;
      btn.onclick = () => showPart(p.id);
      list.appendChild(btn);
    }
  }
  const head2 = document.createElement("div");
  head2.className = "cat-head";
  head2.innerHTML = `<span class="dot" style="background:#e85d04"></span>连接方式 · 可拖动`;
  list.appendChild(head2);
  for (const a of BOM.assemblies) {
    const btn = document.createElement("button");
    btn.className = "part-item" + (state.mode === "assembly" && state.asmId === a.id ? " on" : "");
    btn.innerHTML = `
      <span class="sw" style="background:#e85d04"></span>
      <span class="nm">${a.name}<small>${a.connectors.length} 个连接件</small></span>
      <span class="qty">⚙</span>`;
    btn.onclick = () => showAssembly(a.id);
    list.appendChild(btn);
  }
}

function renderDetailPart(part, engMod, note) {
  const el = document.getElementById("detailBody");
  const connects = (part.connects || []).map((id) => byId[id]).filter(Boolean);
  const relatedAsm = BOM.assemblies.filter(
    (a) => a.host === part.id || a.guest === part.id || a.connectors.some((c) => c.id === part.id)
  );
  const mod = (BOM.modules || []).find((m) => m.id === part.module);
  const em = engMod || findEngineModuleForPart(part.id);

  el.innerHTML = `
    <h2>${part.name}</h2>
    <div class="pid">${part.id} · ${mod ? mod.name : part.cat}${em ? " · 总装子系统「" + em.label + "」" : ""}</div>
    ${
      note
        ? `<div class="install-box" style="margin-top:8px">${note}</div>`
        : em
        ? `<div class="install-box" style="margin-top:8px">橙色=选中件，黄色=相关连接件；其余不透明度 0.1。拖滑条可继续爆炸。</div>`
        : ""
    }
    <div class="meta-grid">
      <div><b>×${part.qty}</b><span>数量</span></div>
      <div><b style="font-size:11px;line-height:1.3">${(part.dims || "—").split("·")[0]}</b><span>关键尺寸</span></div>
      <div><b style="font-size:11px;line-height:1.3">${part.spec || "—"}</b><span>规格</span></div>
      <div><b style="font-size:11px;color:var(--accent2)">${em ? "总装内" : part.stl ? "STL" : "参数化"}</b><span>显示方式</span></div>
    </div>
    <div class="sec">
      <div class="sec-title">尺寸参数</div>
      <table class="param-table">
        <tr><td>外形</td><td>${part.dims || "—"}</td></tr>
        <tr><td>材料</td><td>${part.material || "—"}</td></tr>
        <tr><td>公差</td><td>${part.tol || part.tolerance || "—"}</td></tr>
        <tr><td>模块</td><td>${mod ? mod.id + " " + mod.name : "—"}</td></tr>
        ${em ? `<tr><td>总装</td><td>${em.module} · ${em.label}</td></tr>` : ""}
      </table>
    </div>
    <div class="sec">
      <div class="sec-title">安装方法</div>
      <div class="install-box">${part.install || part.desc || "见 engineering-design.md"}</div>
    </div>
    <div class="sec">
      <div class="sec-title">说明</div>
      <div class="desc">${part.desc || ""}</div>
    </div>
    <div class="sec">
      <div class="sec-title">关联连接件 / 配合件</div>
      <div class="conn-list">
        ${
          connects.length
            ? connects
                .map(
                  (c) => `
          <button class="conn-item" data-goto="${c.id}">
            <span class="id">${c.id}</span>
            <span>${c.name}</span>
            <span class="arrow">定位</span>
          </button>`
                )
                .join("")
            : `<div class="empty">无直接关联件</div>`
        }
      </div>
    </div>
    <div class="sec">
      <div class="sec-title">相关装配场景</div>
      <div class="conn-list">
        ${
          relatedAsm.length
            ? relatedAsm
                .map(
                  (a) => `
          <button class="asm-item" data-asm="${a.id}">
            <span class="nm">${a.name}</span>
            <span class="mt">${a.method}</span>
          </button>`
                )
                .join("")
            : `<div class="empty">可从侧栏进入通用连接场景</div>`
        }
      </div>
    </div>
    <div class="sec" style="display:flex;gap:6px">
      <button class="tbtn" data-full="1" style="flex:1">整机总装</button>
      <button class="tbtn" data-iso="1" style="flex:1">单独预览本件</button>
    </div>
  `;
  el.querySelectorAll("[data-goto]").forEach((b) => {
    b.onclick = () => showPartInAssembly(b.dataset.goto);
  });
  el.querySelectorAll("[data-asm]").forEach((b) => {
    b.onclick = () => showAssembly(b.dataset.asm);
  });
  const fb = el.querySelector("[data-full]");
  if (fb) fb.onclick = () => showFullAssembly();
  const iso = el.querySelector("[data-iso]");
  if (iso) iso.onclick = () => showPartIsolated(part.id);
}

function renderDetailAsm(asm) {
  const el = document.getElementById("detailBody");
  el.innerHTML = `
    <h2>${asm.name}</h2>
    <div class="pid">连接方式 · 可拖动预览</div>
    <div class="desc" style="margin-top:8px">${asm.method}</div>
    <div class="sec">
      <div class="sec-title">爆炸程度</div>
      <div class="slider-row">
        <label>分离 <span id="explodeVal">0%</span></label>
        <input type="range" id="explodeRange" min="0" max="100" value="${Math.round(
          state.explode * 100
        )}" />
      </div>
    </div>
    <div class="sec">
      <div class="sec-title">可拖动连接件</div>
      <div class="conn-list">
        ${asm.connectors
          .map((c) => {
            const p = byId[c.id];
            return `<button class="conn-item" data-goto="${c.id}">
              <span class="id">${c.id}</span>
              <span>${c.label || p?.name}</span>
              <span class="arrow">拖动</span>
            </button>`;
          })
          .join("")}
      </div>
      <div class="empty" style="padding:8px 0" id="dragInfo">在 3D 视图中拖动连接件，沿装配轴滑入/拉出</div>
    </div>
    <div class="sec">
      <div class="sec-title">装配步骤</div>
      <div class="steps">
        <ol style="margin:0;padding-left:0;list-style:none">
          ${asm.steps.map((s) => `<li>${s}</li>`).join("")}
        </ol>
      </div>
    </div>
    <div class="sec">
      <div class="sec-title">主件 / 配合件</div>
      <div class="conn-list">
        <button class="conn-item" data-goto="${asm.host}">
          <span class="id">${asm.host}</span><span>${byId[asm.host]?.name || ""}</span><span class="arrow">→</span>
        </button>
        <button class="conn-item" data-goto="${asm.guest}">
          <span class="id">${asm.guest}</span><span>${byId[asm.guest]?.name || ""}</span><span class="arrow">→</span>
        </button>
      </div>
    </div>
  `;
  const range = el.querySelector("#explodeRange");
  if (range) {
    range.oninput = () => applyExplode(range.value / 100);
  }
  el.querySelectorAll("[data-goto]").forEach((b) => {
    b.onclick = () => showPart(b.dataset.goto);
  });
}

/* ══ 总装图 ══ */
let fullNodes = []; // 工程模块组
let engineRoot = null;
let bodyMeshes = []; // 底盘板件，爆炸时半透明便于看车下
let bomGroups = {}; // BOM 件号 → 可独立高亮的组

function cloneMaterialsDeep(g) {
  g.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    if (Array.isArray(o.material)) o.material = o.material.map((m) => m.clone());
    else o.material = o.material.clone();
  });
  return g;
}

/* 工程整机模块映射：与根目录 index.html / robot-model.js 一致
 * explode 位移单位：米。约定 y≥0（不下穿地面）；
 * 车下件（轮系/电控）向外+略微抬升，避免落入平台下方被遮挡。
 */
const ENGINE_MODULES = [
  {
    key: "body",
    module: "M1",
    partId: "PL-01",
    label: "车体 / 底板 / 型材",
    related: ["E-01","E-01B","E-02","E-03","E-04","E-07","E-08","PL-01","PL-02","ACC-CORNER","F-01","F-02","F-03","F-04","F-05"],
    // 平台整体上抬，露出车下件
    explode: [0, 0.22, 0],
  },
  {
    key: "basket",
    module: "M4",
    partId: "ST-basket",
    label: "球筐（可拆）",
    related: ["ST-basket", "ST-corner", "E-08", "F-17"],
    explode: [-0.30, 0.40, 0],
  },
  {
    key: "roller",
    module: "M2",
    partId: "ST-tpu",
    label: "滚轮 + 弧道（frontUnit）",
    related: ["SH-01","ST-tpu","AL-01","BR-01","ST-bearing","ST-endcap","ST-guide","ST-finger","E-07","F-13","F-14","F-16"],
    explode: [0.06, 0.30, 0],
  },
  {
    key: "rollDrive",
    module: "M2",
    partId: "M-01",
    label: "滚轮电机 + GT2",
    related: ["M-01","ST-motor","PU-01","PU-02","BL-01","PU-04","F-09","F-11","F-15"],
    explode: [0.04, 0.20, 0.16],
  },
  {
    key: "guard",
    module: "M2",
    partId: "ST-guide",
    label: "弧道 / 护指",
    related: ["ST-guide", "ST-finger"],
    explode: [0.10, 0.26, 0],
  },
  {
    key: "chassisTop",
    module: "M3",
    partId: "E-06",
    label: "导流上装（护板/横梁/挡板）",
    related: ["E-05", "E-06", "PL-03", "PL-04"],
    explode: [0, 0.52, 0],
  },
  {
    key: "camera",
    module: "M7",
    partId: "ST-cam",
    label: "摄像头",
    related: ["ST-cam", "U-03"],
    explode: [0.14, 0.46, 0],
  },
  {
    key: "rearDrive",
    module: "M5",
    partId: "M-02",
    label: "后驱通轴轮组",
    related: ["M-02","SH-02","BR-02","WH-01","PU-03","BL-02","ST-motor","ST-wheel","F-15"],
    // 车下件：向后+略抬，不下穿
    explode: [-0.22, 0.06, 0],
  },
  {
    key: "steer",
    module: "M5",
    partId: "ST-knuckle",
    label: "前轮转向",
    related: ["S-01","ST-servo","ST-knuckle","SH-03","WH-01","ACC-LINK","ST-wheel","F-09"],
    explode: [0.20, 0.06, 0],
  },
  {
    key: "battery",
    module: "M6",
    partId: "U-08",
    label: "电池",
    related: ["U-08", "W-06"],
    explode: [-0.20, 0.10, 0.10],
  },
  {
    key: "ecu",
    module: "M6",
    partId: "ST-ecu",
    label: "电控密封舱",
    related: ["ST-ecu","ST-lid","U-01","U-02","U-05","W-07"],
    explode: [-0.16, 0.16, -0.08],
  },
  {
    key: "tof",
    module: "M7",
    partId: "U-04",
    label: "ToF 传感",
    related: ["U-04","ST-tof","F-12"],
    explode: [0.16, 0.24, 0],
  },
];

function findEngineModuleForPart(partId) {
  if (!partId) return null;
  for (const em of ENGINE_MODULES) {
    if (em.partId === partId || (em.related || []).indexOf(partId) >= 0) return em;
  }
  return null;
}

function focusOnGroup(g) {
  if (!g) return;
  const box = new THREE.Box3().setFromObject(g);
  if (box.isEmpty()) return;
  const c = box.getCenter(new THREE.Vector3());
  const sz = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(sz.x, sz.y, sz.z, 0.12);
  const dist = maxDim * 2.2 + 0.2;
  controls.target.copy(c);
  camera.position.set(c.x + dist * 0.65, c.y + dist * 0.45, c.z + dist * 0.7);
  controls.minDistance = maxDim * 0.35;
  controls.maxDistance = maxDim * 6 + 0.8;
  controls.update();
}

/** 总装内隔离：目标模块实体+高亮，其余半透明 */
function isolateEngineModule(engineKey) {
  for (const g of fullNodes) {
    const on = g.userData.engineKey === engineKey;
    g.visible = true;
    g.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m.userData._orig) {
          m.userData._orig = {
            transparent: m.transparent,
            opacity: m.opacity,
            wireframe: m.wireframe,
            depthWrite: m.depthWrite,
            side: m.side,
          };
        }
        const o0 = m.userData._orig;
        if (on) {
          m.transparent = !!o0.transparent;
          m.opacity = o0.opacity;
          m.wireframe = false;
          m.depthWrite = true;
          if (m.emissive) {
            if (!m.userData._baseEmissive) m.userData._baseEmissive = m.emissive.clone();
            m.emissive.setHex(0xe85d04);
            m.emissiveIntensity = 0.45;
          }
        } else {
          // 未选中：不透明度 0.1（透明度 90%），几乎隐去以突出选中件
          m.transparent = true;
          m.opacity = 0.1;
          m.wireframe = false;
          m.depthWrite = false;
          m.side = THREE.DoubleSide;
          if (m.emissive && m.userData._baseEmissive) {
            m.emissive.copy(m.userData._baseEmissive);
            m.emissiveIntensity = 1;
          }
        }
        m.needsUpdate = true;
      }
    });
  }
  focusOnGroup(fullNodes.find((n) => n.userData.engineKey === engineKey));
}

function restoreFullSolid() {
  for (const g of fullNodes) {
    g.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m.userData._orig) {
          m.transparent = m.userData._orig.transparent;
          m.opacity = m.userData._orig.opacity;
          m.wireframe = false;
          m.depthWrite = m.userData._orig.depthWrite;
          m.side = m.userData._orig.side || THREE.FrontSide;
        }
        if (m.emissive && m.userData._baseEmissive) {
          m.emissive.copy(m.userData._baseEmissive);
          m.emissiveIntensity = 1;
        }
        m.needsUpdate = true;
      }
    });
  }
}

/** 按 BOM 件号细粒度隔离：选中件+关联连接件实体，其余 0.1 */
function isolateByBomPart(partId) {
  const part = byId[partId];
  if (!part) return;
  const primary = new Set([partId]);
  const related = new Set(part.connects || []);

  // 车体类：关联里有几何的子件也保持可见
  function isPrimaryGroup(g) {
    return g && primary.has(g.userData.bomId || g.userData.engineKey || g.userData.partId);
  }
  function isRelatedGroup(g) {
    if (!g) return false;
    const id = g.userData.bomId || g.userData.engineKey || g.userData.partId;
    return related.has(id);
  }

  // 顶层模块：若选中的是车体子件，整机 body 模块仍显示但其内部子件按 bomId 区分
  for (const g of fullNodes) {
    const ek = g.userData.engineKey;
    // body 模块特殊处理
    if (ek === "body" && bomGroups[partId]) {
      g.visible = true;
      g.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        const bid = o.userData.bomId;
        const mode = primary.has(bid) ? "primary" : related.has(bid) ? "related" : "ghost";
        applyMeshIsolate(o, mode);
      });
      continue;
    }
    if (isPrimaryGroup(g)) {
      g.visible = true;
      g.traverse((o) => {
        if (o.isMesh) applyMeshIsolate(o, "primary");
      });
    } else if (isRelatedGroup(g)) {
      g.visible = true;
      g.traverse((o) => {
        if (o.isMesh) applyMeshIsolate(o, "related");
      });
    } else if (bomGroups[partId]) {
      // 选中的是车体子件时，其它顶层模块隐去
      g.traverse((o) => {
        if (o.isMesh) applyMeshIsolate(o, "ghost");
      });
    } else {
      // 选中的是顶层模块对应件
      const emPart = g.userData.partId;
      if (primary.has(emPart)) {
        g.visible = true;
        g.traverse((o) => {
          if (o.isMesh) applyMeshIsolate(o, "primary");
        });
      } else if (related.has(emPart) || related.has(g.userData.engineKey)) {
        g.visible = true;
        g.traverse((o) => {
          if (o.isMesh) applyMeshIsolate(o, "related");
        });
      } else {
        g.traverse((o) => {
          if (o.isMesh) applyMeshIsolate(o, "ghost");
        });
      }
    }
  }

  // 镜头对准主选中组
  let target = bomGroups[partId] || fullNodes.find((n) => n.userData.partId === partId);
  if (!target && partId) {
    // F-01 等紧固件挂在 bodySubs
    target = bomGroups[partId];
  }
  focusOnGroup(target);
}

function applyMeshIsolate(mesh, mode) {
  if (!mesh.material) return;
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const m of mats) {
    if (!m.userData._orig) {
      m.userData._orig = {
        transparent: m.transparent,
        opacity: m.opacity,
        wireframe: m.wireframe,
        depthWrite: m.depthWrite,
        side: m.side,
      };
    }
    const o0 = m.userData._orig;
    if (mode === "primary") {
      m.transparent = !!o0.transparent;
      m.opacity = o0.opacity;
      m.wireframe = false;
      m.depthWrite = true;
      if (m.emissive) {
        if (!m.userData._baseEmissive) m.userData._baseEmissive = m.emissive.clone();
        m.emissive.setHex(0xff6a00);
        m.emissiveIntensity = 0.85;
      }
    } else if (mode === "related") {
      m.transparent = !!o0.transparent;
      m.opacity = o0.opacity;
      m.wireframe = false;
      m.depthWrite = true;
      if (m.emissive) {
        if (!m.userData._baseEmissive) m.userData._baseEmissive = m.emissive.clone();
        m.emissive.setHex(0xf0c040);
        m.emissiveIntensity = 0.45;
      }
    } else {
      // ghost：不透明度 0.1
      m.transparent = true;
      m.opacity = 0.1;
      m.wireframe = false;
      m.depthWrite = false;
      m.side = THREE.DoubleSide;
      if (m.emissive && m.userData._baseEmissive) {
        m.emissive.copy(m.userData._baseEmissive);
        m.emissiveIntensity = 1;
      }
    }
    m.needsUpdate = true;
  }
}

/** 选中 BOM 件 → 在总装中定位高亮（细粒度：只亮该件+关联连接件） */
function showPartInAssembly(partId) {
  const part = byId[partId];
  if (!part) return;

  if (!fullNodes.length) showFullAssembly();
  state.mode = "full";
  state.partId = partId;
  state.moduleFilter = null;
  state.selectedFullId = partId;

  if (explSlider) {
    explSlider.value = 20;
    applyFullExplode(0.2);
  }

  const hasFine = !!bomGroups[partId];
  const em = findEngineModuleForPart(partId);
  if (hasFine || part.connects?.length) {
    isolateByBomPart(partId);
  } else if (em) {
    isolateEngineModule(em.key);
  } else {
    restoreFullSolid();
  }

  const emLabel = em ? em.label : hasFine ? "车体零件" : "—";
  document.getElementById("modeChip").textContent =
    "总装定位 · " + partId + "（" + part.name + "）";
  renderDetailPart(part, em, null);
  renderPartList();
  updateModeChip();
  setModeButtons();
  document.getElementById("dragHint").classList.add("show");
}

function showFullAssembly() {
  state.mode = "full";
  state.explode = 0;
  state.moduleFilter = null;
  state.selectedFullId = null;
  state.partId = null;
  clearView();
  fullNodes = [];
  setLoading(true, "构建工程总装图…");

  if (typeof window.EngineRobot === "undefined") {
    setLoading(false);
    document.getElementById("detailBody").innerHTML =
      '<div class="empty">缺少 engine-robot.js，无法构建总装几何。</div>';
    return;
  }

  const built = window.EngineRobot.buildRobot();
  if (built.sensor) built.sensor.visible = false;
  built.root.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    if (Array.isArray(o.material)) o.material = o.material.map((m) => m.clone());
    else o.material = o.material.clone();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m.emissive && !m.userData._baseEmissive) {
        m.userData._baseEmissive = m.emissive.clone();
      }
    }
  });
  engineRoot = built.root;
  viewGroup.add(built.root);

  bodyMeshes = [];
  if (built.parts.body) {
    built.parts.body.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      bodyMeshes.push(o);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m.userData._baseOpacity) m.userData._baseOpacity = m.opacity;
        if (!m.userData._baseTransparent) m.userData._baseTransparent = m.transparent;
      }
    });
  }

  // 注册按 BOM 件号的细粒度组（车体子件等）
  bomGroups = {};
  if (built.parts.bodySubs) {
    for (const bid of Object.keys(built.parts.bodySubs)) {
      const g = built.parts.bodySubs[bid];
      g.userData.bomId = bid;
      g.traverse((o) => {
        if (o.isMesh) o.userData.bomId = bid;
      });
      bomGroups[bid] = g;
    }
  }

  for (const em of ENGINE_MODULES) {
    const g = built.parts[em.key];
    if (!g) continue;
    g.userData.partId = em.partId;
    g.userData.module = em.module;
    g.userData.engineKey = em.key;
    g.userData.related = em.related;
    g.userData.base = g.position.clone();
    g.userData.explode = new THREE.Vector3(...em.explode);
    fullNodes.push(g);
  }

  // 网格级拾取：把 module/partId 写到子 mesh
  for (const em of ENGINE_MODULES) {
    const g = built.parts[em.key];
    if (!g) continue;
    g.traverse((o) => {
      if (!o.isMesh) return;
      o.userData.partId = em.partId;
      o.userData.module = em.module;
      o.userData.engineKey = em.key;
      o.userData.related = em.related;
    });
  }

  applyViewMode(viewGroup);
  applyFullExplode(0);

  const box = new THREE.Box3().setFromObject(viewGroup);
  const c = box.getCenter(new THREE.Vector3());
  const sz = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(sz.x, sz.y, sz.z, 0.45);
  controls.target.copy(c);
  const dist = maxDim * 1.7;
  camera.position.set(c.x + dist * 0.7, c.y + dist * 0.5, c.z + dist * 0.75);
  controls.minDistance = maxDim * 0.4;
  controls.maxDistance = maxDim * 3.2;
  controls.update();

  setLoading(false);
  renderDetailFull(null);
  renderPartList();
  updateModeChip();
  setModeButtons();
  if (explSlider) {
    explSlider.value = 0;
    explPct.textContent = "0%";
  }
  document.getElementById("dragHint").classList.add("show");
}

function applyFullExplode(t) {
  state.explode = t;
  if (!viewGroup) return;

  // 整机上抬：保证车下件不会沉入地面网格
  if (engineRoot) {
    engineRoot.position.y = t * 0.18;
  }

  for (const g of fullNodes) {
    if (!g.userData.base || !g.userData.explode) continue;
    const off = g.userData.explode.clone();
    // 兜底：任何模块 y 位移不为负，避免下穿
    if (off.y < 0) off.y = 0;
    g.position.copy(g.userData.base).addScaledVector(off, t);
  }

  // 底盘板半透明，便于看清被平台挡住的轮系/电控
  const fade = t * 0.72; // 爆炸满时透明度降到约 0.28
  for (const mesh of bodyMeshes) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const baseOp = m.userData._baseOpacity != null ? m.userData._baseOpacity : 1;
      m.opacity = Math.max(0.18, baseOp * (1 - fade));
      m.transparent = true;
      m.depthWrite = m.opacity > 0.55;
      m.needsUpdate = true;
    }
  }

  if (explSlider) explPct.textContent = explSlider.value + "%";
}

function refreshFullVisibility() {
  for (const g of fullNodes) {
    const vis = !state.moduleFilter || g.userData.module === state.moduleFilter;
    g.visible = vis;
  }
}

function pickFullPart(clientX, clientY) {
  if (state.mode !== "full") return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(fullNodes, true);
  if (!hits.length) {
    state.selectedFullId = null;
    state.partId = null;
    restoreFullSolid();
    renderDetailFull(null);
    renderPartList();
    return;
  }
  let obj = hits[0].object;
  while (obj && !obj.userData.bomId && !obj.userData.partId && !obj.userData.engineKey) obj = obj.parent;
  if (!obj) return;
  const bid = obj.userData.bomId || obj.userData.partId;
  const ekey = obj.userData.engineKey;
  state.selectedFullId = bid || ekey;
  state.partId = bid || null;
  if (bid && byId[bid]) {
    isolateByBomPart(bid);
    renderDetailPart(byId[bid], findEngineModuleForPart(bid), null);
  } else if (ekey) {
    isolateEngineModule(ekey);
    renderDetailFull(byId[obj.userData.partId], obj.userData.module, obj.userData.related, ekey);
  }
  renderPartList();
  updateModeChip();
}

function highlightFull(key) {
  for (const g of fullNodes) {
    const on = key && (g.userData.engineKey === key || g.userData.partId === key);
    g.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m.emissive) continue;
        if (!m.userData._baseEmissive) m.userData._baseEmissive = m.emissive.clone();
        if (on) {
          m.emissive.setHex(0xe85d04);
          m.emissiveIntensity = 0.55;
        } else {
          m.emissive.copy(m.userData._baseEmissive);
          m.emissiveIntensity = 1;
        }
      }
    });
  }
}

function renderDetailFull(part, moduleId, relatedIds, engineKey) {
  const el = document.getElementById("detailBody");
  if (!part) {
    const audit = (BOM.audit || [])
      .map(
        (a) =>
          `<div class="${a.level}">${a.level === "ok" ? "✓" : a.level === "fix" ? "◆" : "!"} ${a.msg}</div>`
      )
      .join("");
    const mods = (BOM.modules || [])
      .map(
        (m) =>
          `<button class="conn-item" data-mod="${m.id}">
            <span class="id" style="color:${m.color}">${m.id}</span>
            <span>${m.name}</span>
            <span class="arrow">过滤</span>
          </button>`
      )
      .join("");
    const eng = (typeof ENGINE_MODULES !== "undefined" ? ENGINE_MODULES : [])
      .map(
        (e) =>
          `<button class="conn-item" data-mod="${e.module}">
            <span class="id">${e.module}</span>
            <span>${e.label}</span>
            <span class="arrow">${e.partId}</span>
          </button>`
      )
      .join("");
    el.innerHTML = `
      <h2>总装图 · KIT-TBR-01</h2>
      <div class="pid">几何与根目录 index.html 一致 · E1.3g（平台顶125 / 无刷 / 15Ah弹仓）</div>
      <div class="meta-grid">
        <div><b>${BOM.parts.length}</b><span>BOM 品种</span></div>
        <div><b>${ENGINE_MODULES.length}</b><span>总装子系统</span></div>
        <div><b>${BOM.modules.length}</b><span>功能模块</span></div>
        <div><b>${BOM.assemblies.length}</b><span>连接场景</span></div>
      </div>
      <div class="sec">
        <div class="sec-title">操作</div>
        <div class="desc">· 拖拽旋转 / 滚轮缩放<br/>· 顶部滑条<strong>爆炸拆解</strong><br/>· 模块按钮<strong>只看子系统</strong><br/>· 点击子系统 → 尺寸 / 材料 / 安装方法</div>
      </div>
      <div class="sec">
        <div class="sec-title">工程总装子系统（与 index.html 零件组对应）</div>
        <div class="conn-list">${eng}</div>
      </div>
      <div class="sec">
        <div class="sec-title">数据核对</div>
        <div class="audit">${audit}</div>
      </div>
      <div class="sec">
        <div class="sec-title">功能模块过滤</div>
        <div class="conn-list">${mods}</div>
      </div>
      <div class="sec">
        <div class="sec-title">连接方式场景（可拖动）</div>
        <div class="conn-list">
          ${(BOM.assemblies || [])
            .map(
              (a) =>
                `<button class="asm-item" data-asm="${a.id}">
                  <span class="nm">${a.name}</span>
                  <span class="mt">${a.method}</span>
                </button>`
            )
            .join("")}
        </div>
      </div>
    `;
    el.querySelectorAll("[data-mod]").forEach((b) => {
      b.onclick = () => {
        state.moduleFilter = state.moduleFilter === b.dataset.mod ? null : b.dataset.mod;
        refreshFullVisibility();
        renderModuleBar();
      };
    });
    el.querySelectorAll("[data-asm]").forEach((b) => {
      b.onclick = () => showAssembly(b.dataset.asm);
    });
    return;
  }

  const rel = (relatedIds || part.connects || []).map((id) => byId[id]).filter(Boolean);
  const mod = (BOM.modules || []).find((m) => m.id === (moduleId || part.module));
  const em = ENGINE_MODULES.find((e) => e.engineKey === engineKey || e.key === engineKey);
  el.innerHTML = `
    <h2>${part.name}</h2>
    <div class="pid">${part.id} · ${mod ? mod.name : part.cat}${em ? " · " + em.label : ""}</div>
    <div class="meta-grid">
      <div><b>×${part.qty}</b><span>数量</span></div>
      <div><b style="font-size:11px;line-height:1.3">${(part.dims || "—").split("·")[0]}</b><span>关键尺寸</span></div>
      <div><b style="font-size:11px;line-height:1.3">${part.spec || "—"}</b><span>规格</span></div>
      <div><b style="font-size:11px;color:var(--accent2)">${part.stl ? "STL" : "参数化"}</b><span>模型</span></div>
    </div>
    <div class="sec">
      <div class="sec-title">尺寸参数</div>
      <table class="param-table">
        <tr><td>外形</td><td>${part.dims || "—"}</td></tr>
        <tr><td>材料</td><td>${part.material || "—"}</td></tr>
        <tr><td>公差</td><td>${part.tol || part.tolerance || "—"}</td></tr>
        <tr><td>模块</td><td>${mod ? mod.id + " " + mod.name : "—"}</td></tr>
      </table>
    </div>
    <div class="sec">
      <div class="sec-title">安装方法</div>
      <div class="install-box">${part.install || part.desc || "见工程文档"}</div>
    </div>
    <div class="sec">
      <div class="sec-title">说明</div>
      <div class="desc">${part.desc || ""}</div>
    </div>
    <div class="sec">
      <div class="sec-title">关联连接件</div>
      <div class="conn-list">
        ${
          rel.length
            ? rel
                .map(
                  (c) =>
                    `<button class="conn-item" data-goto="${c.id}">
                      <span class="id">${c.id}</span>
                      <span>${c.name}</span>
                      <span class="arrow">→</span>
                    </button>`
                )
                .join("")
            : `<div class="empty">无直接关联</div>`
        }
      </div>
    </div>
  `;
  el.querySelectorAll("[data-goto]").forEach((b) => {
    b.onclick = () => showPart(b.dataset.goto);
  });
}

/* 工具栏 */
document.getElementById("btnSolid").onclick = () => setView("solid");
document.getElementById("btnXray").onclick = () => setView("xray");
document.getElementById("btnWire").onclick = () => setView("wire");
document.getElementById("btnResetCam").onclick = () => viewGroup && frameCamera(viewGroup);
document.getElementById("btnFull").onclick = () => showFullAssembly();
document.getElementById("btnAsm").onclick = () => showAssembly(state.asmId || "asm-corner");
document.getElementById("btnPart").onclick = () => showPart(state.partId || "E-01");
document.getElementById("searchInput").oninput = () => renderPartList();

const explSlider = document.getElementById("explodeSlider");
const explPct = document.getElementById("explodePct");
const explBar = document.getElementById("explBar");
const modBar = document.getElementById("modBar");

if (explSlider) {
  explSlider.oninput = () => {
    const t = explSlider.value / 100;
    explPct.textContent = explSlider.value + "%";
    if (state.mode === "full") {
      applyFullExplode(t);
      if (state.selectedFullId && byId[state.selectedFullId]) isolateByBomPart(state.selectedFullId);
      else if (state.selectedFullId) isolateEngineModule(state.selectedFullId);
    } else applyExplode(t);
  };
}

function renderModuleBar() {
  if (!BOM.modules || !modBar) return;
  const show = state.mode === "full";
  modBar.classList.toggle("hide", !show);
  explBar.classList.toggle("hide", !(state.mode === "full" || state.mode === "assembly"));
  if (!show) return;
  const all = document.createElement("button");
  all.className = "mbtn" + (state.moduleFilter ? "" : " on");
  all.textContent = "全部模块";
  all.onclick = () => {
    state.moduleFilter = null;
    refreshFullVisibility();
    renderModuleBar();
  };
  modBar.innerHTML = "";
  modBar.appendChild(all);
  for (const m of BOM.modules) {
    const b = document.createElement("button");
    b.className = "mbtn" + (state.moduleFilter === m.id ? " on" : "");
    b.textContent = m.name;
    b.style.borderColor = state.moduleFilter === m.id ? m.color : "";
    b.onclick = () => {
      state.moduleFilter = state.moduleFilter === m.id ? null : m.id;
      refreshFullVisibility();
      renderModuleBar();
    };
    modBar.appendChild(b);
  }
}

function setView(v) {
  state.view = v;
  document.getElementById("btnSolid").classList.toggle("on", v === "solid");
  document.getElementById("btnXray").classList.toggle("on", v === "xray");
  document.getElementById("btnWire").classList.toggle("on", v === "wire");
  if (viewGroup) applyViewMode(viewGroup);
}

function setModeButtons() {
  document.getElementById("btnFull").classList.toggle("on", state.mode === "full");
  document.getElementById("btnFull").classList.toggle("on-ok", state.mode === "full");
  document.getElementById("btnPart").classList.toggle("on", state.mode === "part");
  document.getElementById("btnAsm").classList.toggle("on", state.mode === "assembly");
  document.getElementById("btnAsm").classList.toggle("on-ok", state.mode === "assembly");
  document.getElementById("dragHint").classList.toggle("show", state.mode === "full" || state.mode === "assembly");
  renderModuleBar();
}

/* ── 循环 ── */
function onResize() {
  const s = viewportSize();
  camera.aspect = s.w / s.h;
  camera.updateProjectionMatrix();
  renderer.setSize(s.w, s.h);
}
window.addEventListener("resize", onResize);

function tick() {
  requestAnimationFrame(tick);
  controls.update();
  // 连接件轻微浮动
  if (viewGroup) {
    const t = performance.now() * 0.001;
    viewGroup.children.forEach((c, i) => {
      if (c.userData && c.userData.float) {
        c.position.y = Math.sin(t * 1.4 + i) * 0.006;
      }
    });
  }
  renderer.render(scene, camera);
}

/* 启动 */
onResize();
renderPartList();
setView("solid");
showFullAssembly();
tick();
})();
