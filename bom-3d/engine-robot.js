/* KIT-TBR-01 工程化整机几何 · 与根目录 index.html 一致 */
(function(){
/**
 * KIT-TBR-01 完整工程化机器人模型（与 index.html 几何一致）
 * 本地坐标：+X 前 / +Y 上 / +Z 右
 */
/* uses global THREE */

const D = {
  bodyX0: -0.30, bodyL: 0.56, bodyW: 0.46, bodyH: 0.135,
  bodyZ: 0.035,
  get bodyTop() { return this.bodyZ + this.bodyH; },
  get bodyCx() { return this.bodyX0 + this.bodyL / 2; },
  get bodyFront() { return this.bodyX0 + this.bodyL; },

  mouthW: 0.40, mouthH: 0.12, mouthZ: 0.055,

  rollD: 0.14, rollL: 0.36, rollX: 0.24,
  rollBottom: 0.068,
  rollBottomMin: 0.062,
  rollBottomMax: 0.090,
  get rollZ() { return this.rollBottom + this.rollD / 2; },
  finN: 8, finH: 0.012,

  guideGap: 0.065,
  get guideR() { return this.rollD / 2 + this.guideGap; },
  guideA0: 3.70,
  guideA1: 3.20,
  guideChW: 0.40,
  guideWallH: 0.060,

  shroudR: 0.105,
  shroudSpan: Math.PI * 0.42,
  shroudStart: 0.40,

  deflectorX0: 0.150,
  deflectorY0: 0.400,
  deflectorX1: 0.085,
  deflectorY1: 0.520,
  deflectorT: 0.012,

  topSlotX0: 0.05, topSlotX1: 0.19, topSlotW: 0.30,
  botSlotX0: 0.10, botSlotX1: 0.28, botSlotW: 0.34,

  beamY: 0.27,
  beamX: 0.21,

  basketX0: -0.30, basketL: 0.36, basketW: 0.42,
  basketH: 0.16,
  basketZ0: 0.17,
  get basketTop() { return this.basketZ0 + this.basketH; },
  get basketCx() { return this.basketX0 + this.basketL / 2; },
  get basketFront() { return this.basketX0 + this.basketL; },

  floorZ: 0.17,
  doorH: 0.20,

  wr: 0.050, ww: 0.038, wy: 0.215,
  wxFront: 0.040,
  wxRear: -0.280,
  mh: 0.045,
};

const BR = 0.0335;
const BASE_ROLL_X = 0.24;

function makeMats() {
  return {
    extrusion: new THREE.MeshStandardMaterial({ color: 0x2b2e33, metalness: 0.72, roughness: 0.38 }),
    plate:     new THREE.MeshStandardMaterial({ color: 0x9aa1a8, metalness: 0.82, roughness: 0.32 }),
    shell:     new THREE.MeshStandardMaterial({ color: 0xd2d4d8, metalness: 0.08, roughness: 0.40 }),
    box:       new THREE.MeshStandardMaterial({ color: 0xe85d04, metalness: 0.05, roughness: 0.38 }),
    dark:      new THREE.MeshStandardMaterial({ color: 0x1a1c20, metalness: 0.2,  roughness: 0.45 }),
    rollCore:  new THREE.MeshStandardMaterial({ color: 0x6a7078, metalness: 0.75, roughness: 0.30 }),
    roll:      new THREE.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.05, roughness: 0.88 }),
    fin:       new THREE.MeshStandardMaterial({ color: 0x4a4c50, metalness: 0.05, roughness: 0.82 }),
    petg:      new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 0.12, roughness: 0.48 }),
    rubber:    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0,    roughness: 0.92 }),
    seal:      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0,    roughness: 0.95 }),
    metal:     new THREE.MeshStandardMaterial({ color: 0x8a9098, metalness: 0.88, roughness: 0.28 }),
    bearing:   new THREE.MeshStandardMaterial({ color: 0xb0b6bc, metalness: 0.92, roughness: 0.22 }),
    hole:      new THREE.MeshStandardMaterial({ color: 0x08080a, metalness: 0,    roughness: 0.88 }),
    mesh:      new THREE.MeshStandardMaterial({ color: 0x8c9094, metalness: 0.65, roughness: 0.35 }),
    def:       new THREE.MeshStandardMaterial({ color: 0xc4cad2, metalness: 0.75, roughness: 0.30 }),
    ball:      new THREE.MeshStandardMaterial({ color: 0xb8d84a, metalness: 0,    roughness: 0.62 }),
    ballHot:   new THREE.MeshStandardMaterial({
      color: 0xd4f06a, emissive: 0x557711, emissiveIntensity: 0.35, roughness: 0.55,
    }),
    white:     new THREE.MeshStandardMaterial({ color: 0xe6e6e6, metalness: 0,    roughness: 0.4 }),
    glass:     new THREE.MeshStandardMaterial({ color: 0x0c2840, metalness: 0.4,  roughness: 0.08 }),
    led:       new THREE.MeshStandardMaterial({
      color: 0x22d866, emissive: 0x11aa44, emissiveIntensity: 0.75, roughness: 0.25,
    }),
    estop:     new THREE.MeshStandardMaterial({
      color: 0xcc2200, emissive: 0x440000, emissiveIntensity: 0.25, roughness: 0.45,
    }),
    frame:     new THREE.MeshStandardMaterial({ color: 0x2a2e34, metalness: 0.4, roughness: 0.42 }),
  };
}

function box(w, h, d, mat, x, y, z, rx, ry, rz) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x || 0, y || 0, z || 0);
  m.rotation.set(rx || 0, ry || 0, rz || 0);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function cyl(r, h, mat, x, y, z, rx, ry, rz, seg) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 48), mat);
  m.position.set(x || 0, y || 0, z || 0);
  m.rotation.set(rx || 0, ry || 0, rz || 0);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function ballMesh(r, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/**
 * 构建完整机器人
 * @returns {{ root: THREE.Group, parts: object, rollAdj: {bottom:number}, MAT: object }}
 */
function buildRobot() {
  const MAT = makeMats();
  const root = new THREE.Group();
  const parts = {};
  const rollAdj = { bottom: D.rollBottom };

  // ── 车体 ──
  {
    const g = new THREE.Group();
    const t = 0.013;
    const bz = D.bodyZ + D.bodyH / 2;

    const topRearL = D.basketFront - D.bodyX0;
    g.add(box(topRearL, t, D.bodyW, MAT.plate, D.bodyX0 + topRearL / 2, D.bodyTop - t / 2, 0));
    const topFrontL = D.bodyFront - D.basketFront;
    const topSideW = (D.bodyW - D.topSlotW) / 2;
    for (const s of [1, -1]) {
      g.add(box(topFrontL, t, topSideW, MAT.plate,
        D.basketFront + topFrontL / 2, D.bodyTop - t / 2,
        s * (D.topSlotW / 2 + topSideW / 2)));
    }
    for (const s of [1, -1]) {
      g.add(box(D.bodyL, 0.020, 0.020, MAT.extrusion,
        D.bodyCx, D.bodyTop - 0.010, s * (D.bodyW / 2 - 0.012)));
    }

    const botRearL = D.botSlotX0 - D.bodyX0;
    g.add(box(botRearL, t, D.bodyW, MAT.plate, D.bodyX0 + botRearL / 2, D.bodyZ + t / 2, 0));
    const botFrontL = D.bodyFront - D.botSlotX0;
    const botSideW = 0.035;
    const botSlotHalf = D.bodyW / 2 - botSideW;
    for (const s of [1, -1]) {
      g.add(box(botFrontL, t, botSideW, MAT.plate,
        D.botSlotX0 + botFrontL / 2, D.bodyZ + t / 2,
        s * (botSlotHalf - botSideW / 2)));
    }
    for (const s of [1, -1]) {
      g.add(box(0.10, t + 0.006, 0.09, MAT.hole, D.wxFront, D.bodyZ + t / 2, s * (D.wy - 0.02)));
    }
    g.add(box(0.055, t + 0.004, 0.055, MAT.hole, D.wxRear, D.bodyZ + t / 2, 0));
    for (const s of [1, -1]) {
      g.add(box(botRearL, 0.020, 0.020, MAT.extrusion,
        D.bodyX0 + botRearL / 2, D.bodyZ - 0.008, s * (D.bodyW / 2 - 0.020)));
    }

    const skirtRear = 0.10 - D.bodyX0;
    for (const s of [1, -1]) {
      g.add(box(skirtRear, D.bodyH, t, MAT.plate,
        D.bodyX0 + skirtRear / 2, bz, s * (D.bodyW / 2 - t / 2)));
    }
    g.add(box(t, D.bodyH, D.bodyW, MAT.plate, D.bodyX0 + t / 2, bz, 0));

    const mouthTop = D.mouthZ + D.mouthH / 2;
    const upH = D.bodyTop - mouthTop - 0.004;
    if (upH > 0.01) {
      g.add(box(t, upH, D.bodyW, MAT.plate, D.bodyFront - t / 2, mouthTop + upH / 2 + 0.004, 0));
    }
    const sideW2 = (D.bodyW - D.mouthW) / 2;
    const cheekH = mouthTop - D.bodyZ;
    for (const s of [1, -1]) {
      g.add(box(t, cheekH, sideW2, MAT.plate,
        D.bodyFront - t / 2, D.bodyZ + cheekH / 2, s * (D.mouthW / 2 + sideW2 / 2)));
    }
    for (const s of [1, -1]) {
      g.add(box(skirtRear * 0.85, 0.025, 0.018, MAT.rubber,
        D.bodyX0 + skirtRear * 0.5, D.bodyZ + 0.022, s * (D.bodyW / 2 + 0.006)));
    }
    g.add(box(0.06, 0.008, 0.018, MAT.led, D.bodyFront - 0.02, D.bodyTop - 0.012, 0));

    g.add(box(D.basketL + 0.01, 0.008, 0.012, MAT.frame, D.basketCx, D.bodyTop + 0.004, D.basketW / 2));
    g.add(box(D.basketL + 0.01, 0.008, 0.012, MAT.frame, D.basketCx, D.bodyTop + 0.004, -D.basketW / 2));
    g.add(box(0.012, 0.008, D.basketW + 0.01, MAT.frame, D.basketX0, D.bodyTop + 0.004, 0));
    for (const s of [1, -1]) {
      g.add(box(D.basketL, 0.004, 0.006, MAT.seal, D.basketCx, D.bodyTop + 0.010, s * (D.basketW / 2 - 0.004)));
    }
    for (const s of [1, -1]) {
      g.add(box(0.022, 0.014, 0.018, MAT.metal, D.basketCx, D.bodyTop + 0.008, s * (D.basketW / 2 + 0.012)));
      g.add(cyl(0.004, 0.020, MAT.metal, D.basketCx, D.bodyTop + 0.008, s * (D.basketW / 2 + 0.022), Math.PI / 2, 0, 0, 12));
      g.add(cyl(0.008, 0.004, MAT.estop, D.basketCx, D.bodyTop + 0.008, s * (D.basketW / 2 + 0.034), Math.PI / 2, 0, 0, 16));
    }
    {
      const ex = D.bodyX0 + 0.04;
      g.add(box(0.028, 0.012, 0.028, MAT.dark, ex, D.bodyTop + 0.008, 0));
      g.add(cyl(0.012, 0.018, MAT.estop, ex, D.bodyTop + 0.022, 0, 0, 0, 0, 24));
      g.add(cyl(0.006, 0.010, MAT.metal, ex, D.bodyTop + 0.034, 0, 0, 0, 0, 16));
    }
    root.add(g);
    parts.body = g;
  }

  // ── 球筐 ──
  const basket = new THREE.Group();
  {
    const g = basket;
    const t = 0.012;
    const bz = D.basketZ0;
    const cx = D.basketCx;
    const H = D.basketH;

    g.add(box(D.basketL, t, D.basketW, MAT.box, cx, bz + t / 2, 0));
    for (let ix = 0; ix < 5; ix++) {
      for (let iz = 0; iz < 4; iz++) {
        g.add(cyl(0.004, t + 0.002, MAT.hole,
          D.basketX0 + 0.05 + ix * 0.065, bz + t / 2, -0.12 + iz * 0.08, 0, 0, 0, 8));
      }
    }
    g.add(box(t, H, D.basketW, MAT.box, D.basketX0 + t / 2, bz + H / 2, 0));
    for (const s of [1, -1]) {
      g.add(box(D.basketL, H, t, MAT.box, cx, bz + H / 2, s * (D.basketW / 2 - t / 2)));
      g.add(box(0.10, 0.03, 0.016, MAT.frame, cx, bz + H * 0.55, s * (D.basketW / 2 + 0.002)));
      g.add(box(0.024, 0.016, 0.010, MAT.metal, cx, bz + H - 0.030, s * (D.basketW / 2 + 0.004)));
      g.add(cyl(0.0045, 0.012, MAT.hole, cx, bz + H - 0.030, s * (D.basketW / 2 + 0.008), Math.PI / 2, 0, 0, 10));
      for (let i = 0; i < 3; i++) {
        g.add(box(0.07, 0.018, t + 0.002, MAT.hole,
          D.basketX0 + 0.08 + i * 0.09, bz + H * 0.45, s * (D.basketW / 2 - t / 2)));
      }
    }
    g.add(box(t, H, D.basketW, MAT.box, D.basketX0 + D.basketL - t / 2, bz + H / 2, 0));
    g.add(box(D.basketL, 0.012, 0.014, MAT.frame, cx, bz + H, D.basketW / 2 - 0.01));
    g.add(box(D.basketL, 0.012, 0.014, MAT.frame, cx, bz + H, -(D.basketW / 2 - 0.01)));
    g.add(box(0.014, 0.012, D.basketW, MAT.frame, D.basketX0, bz + H, 0));
    g.add(box(0.014, 0.012, D.basketW, MAT.frame, D.basketFront, bz + H, 0));
    g.add(box(0.03, 0.02, 0.14, MAT.rubber, D.basketX0 - 0.02, bz + H + 0.02, 0));
    for (const s of [1, -1]) {
      g.add(box(0.018, 0.028, 0.018, MAT.frame, D.basketX0 - 0.02, bz + H + 0.008, s * 0.05));
    }
    for (const sx of [D.basketX0 + 0.01, D.basketFront - 0.01]) {
      for (const sz of [D.basketW / 2 - 0.01, -(D.basketW / 2 - 0.01)]) {
        g.add(box(0.022, H, 0.022, MAT.petg, sx, bz + H / 2, sz));
      }
    }
    // 筐内不预置球 — 运行时堆叠
    root.add(g);
    parts.basket = g;
  }

  // ── frontUnit ──
  const frontUnit = new THREE.Group();
  root.add(frontUnit);
  const rollAxisX = () => D.rollX;
  const rollAxisY = () => rollAdj.bottom + D.rollD / 2;
  function applyFrontUnitOffset() {
    frontUnit.position.x = D.rollX;
    frontUnit.position.y = rollAdj.bottom - D.rollBottom;
  }
  applyFrontUnitOffset();

  let deflectorRef = null;

  // ── 滚轮 ──
  const rollerGroup = new THREE.Group();
  const rollerPivot = new THREE.Group();
  {
    const g = rollerGroup;
    rollerPivot.position.set(0, D.rollZ, 0);
    g.add(rollerPivot);

    rollerPivot.add(cyl(D.rollD / 2 - 0.010, D.rollL, MAT.rollCore, 0, 0, 0, Math.PI / 2, 0, 0, 48));
    rollerPivot.add(cyl(D.rollD / 2, D.rollL - 0.008, MAT.roll, 0, 0, 0, Math.PI / 2, 0, 0, 64));
    rollerPivot.add(cyl(0.004, D.rollL + 0.06, MAT.metal, 0, 0, 0, Math.PI / 2, 0, 0, 16));

    const ribN = 6, slices = 18;
    for (let si = 0; si < slices; si++) {
      const z = -D.rollL / 2 + (si + 0.5) * (D.rollL / slices);
      for (let ri = 0; ri < ribN; ri++) {
        const ang = (ri * 2 * Math.PI / ribN) + (si / slices) * 1.15;
        const r = D.rollD / 2 + D.finH / 2;
        rollerPivot.add(box(0.008, D.finH, D.rollL / slices * 0.85, MAT.fin,
          r * Math.cos(ang), r * Math.sin(ang), z, 0, 0, -ang + Math.PI / 2));
      }
    }
    for (const s of [1, -1]) {
      g.add(cyl(D.rollD / 2 + 0.002, 0.014, MAT.fin, 0, D.rollZ, s * (D.rollL / 2 + 0.006), Math.PI / 2, 0, 0, 48));
      g.add(cyl(0.032, 0.012, MAT.petg, 0, D.rollZ, s * (D.rollL / 2 + 0.018), Math.PI / 2, 0, 0, 32));
      g.add(cyl(0.014, 0.008, MAT.bearing, 0, D.rollZ, s * (D.rollL / 2 + 0.026), Math.PI / 2, 0, 0, 24));
    }
    g.add(cyl(0.020, 0.030, MAT.metal, 0, D.rollZ, D.rollL / 2 + 0.040, Math.PI / 2, 0, 0));

    const bearingZ = D.bodyW / 2 - 0.032;
    for (const s of [1, -1]) {
      g.add(cyl(0.022, 0.020, MAT.bearing, 0, D.rollZ, s * bearingZ, Math.PI / 2, 0, 0, 32));
      g.add(box(0.044, 0.044, 0.016, MAT.petg, 0, D.rollZ, s * (bearingZ + 0.014)));
      g.add(cyl(0.014, 0.006, MAT.bearing, 0, D.rollZ, s * (bearingZ + 0.024), Math.PI / 2, 0, 0, 24));
      const upH = D.bodyTop - D.rollZ - 0.02;
      g.add(box(0.018, upH, 0.018, MAT.extrusion, 0, D.rollZ + 0.02 + upH / 2, s * (bearingZ + 0.010)));
      g.add(box(0.006, Math.max(0.04, upH * 0.7), 0.004, MAT.hole, 0, D.rollZ + 0.02 + upH / 2, s * (bearingZ + 0.020)));
      const dnH = D.rollZ - 0.02 - D.bodyZ;
      g.add(box(0.018, dnH, 0.018, MAT.extrusion, 0, D.rollZ - 0.02 - dnH / 2, s * (bearingZ + 0.010)));
      g.add(box(0.006, Math.max(0.03, dnH * 0.6), 0.004, MAT.hole, 0, D.rollZ - 0.02 - dnH / 2, s * (bearingZ + 0.020)));
      g.add(box(0.050, 0.014, 0.022, MAT.frame, 0, D.bodyTop - 0.01, s * (D.bodyW / 2 - 0.020)));
      g.add(box(0.036, 0.008, 0.006, MAT.hole, 0, D.bodyTop - 0.01, s * (D.bodyW / 2 - 0.008)));
      g.add(box(0.030, 0.014, 0.020, MAT.frame, 0, D.bodyZ + 0.02, s * (D.bodyW / 2 - 0.020)));
      g.add(box(0.022, 0.008, 0.006, MAT.hole, 0, D.bodyZ + 0.02, s * (D.bodyW / 2 - 0.008)));
      g.add(cyl(0.010, 0.008, MAT.metal, 0, D.bodyTop + 0.004, s * (D.bodyW / 2 - 0.008), Math.PI / 2, 0, 0, 6));
      g.add(cyl(0.009, 0.008, MAT.metal, 0, D.rollZ + 0.02 + upH * 0.55, s * (bearingZ + 0.022), Math.PI / 2, 0, 0, 6));
    }
    {
      const guardY = D.rollZ + D.rollD / 2 + 0.014;
      g.add(box(0.012, 0.010, D.rollL * 0.92, MAT.petg, 0.02, guardY, 0));
    }
    g.userData.spinPivot = rollerPivot;
    frontUnit.add(g);
    parts.roller = g;
  }

  // 滚轮电机 + GT2（frontUnit 局部坐标：原点在滚轮轴线 x=0）
  // 父级 frontUnit.position.x = D.rollX，此处不可再写 D.rollX
  {
    const g = new THREE.Group();
    const motorY = D.rollZ;
    const motorZ = 0.155;
    const motorX = -0.02; // 相对滚轮轴后移 20 mm
    g.add(cyl(0.024, 0.055, MAT.dark, motorX, motorY, motorZ, Math.PI / 2, 0, 0, 32));
    g.add(cyl(0.028, 0.028, MAT.metal, motorX, motorY, motorZ + 0.042, Math.PI / 2, 0, 0, 32));
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      g.add(cyl(0.002, 0.003, MAT.bearing,
        motorX + 0.020 * Math.cos(a), motorY + 0.020 * Math.sin(a),
        motorZ + 0.058, Math.PI / 2, 0, 0, 6));
    }
    g.add(cyl(0.006, 0.018, MAT.metal, motorX, motorY, motorZ + 0.068, Math.PI / 2, 0, 0, 12));
    for (const dy of [0.022, -0.022]) {
      g.add(box(0.014, 0.010, 0.030, MAT.frame, motorX, motorY + dy, motorZ - 0.020));
      g.add(cyl(0.0025, 0.012, MAT.hole, motorX, motorY + dy, motorZ - 0.020, Math.PI / 2, 0, 0, 8));
    }
    g.add(box(0.048, 0.012, 0.040, MAT.frame, motorX, motorY - 0.036, motorZ - 0.010));
    // 生根车体：local y 与 frontUnit 无关（父 y≈0）；local x 相对滚轮轴
    g.add(box(0.014, 0.050, 0.016, MAT.extrusion, motorX - 0.010, (D.bodyTop + D.bodyZ) / 2, motorZ - 0.008));
    g.add(box(0.030, 0.014, 0.024, MAT.frame, motorX - 0.010, D.bodyTop - 0.01, motorZ - 0.008));
    g.add(box(0.030, 0.014, 0.024, MAT.frame, motorX - 0.010, D.bodyZ + 0.02, motorZ - 0.008));
    const pulleyR1 = 0.020, pulleyR2 = 0.014, beltZ = motorZ - 0.012;
    // 滚轮轴上的从动轮：局部 x=0
    g.add(cyl(pulleyR1, 0.012, MAT.metal, 0, D.rollZ, beltZ, Math.PI / 2, 0, 0, 24));
    g.add(cyl(pulleyR2, 0.012, MAT.metal, motorX, motorY, beltZ, Math.PI / 2, 0, 0, 20));
    g.add(cyl(pulleyR1 + 0.001, 0.008, MAT.rubber, 0, D.rollZ, beltZ, Math.PI / 2, 0, 0, 24));
    g.add(cyl(pulleyR2 + 0.001, 0.008, MAT.rubber, motorX, motorY, beltZ, Math.PI / 2, 0, 0, 20));
    const midX = motorX / 2 + 0.004;
    const midY = D.rollZ - 0.018;
    g.add(cyl(0.008, 0.010, MAT.rubber, midX, midY, beltZ, Math.PI / 2, 0, 0, 16));
    g.add(box(0.012, 0.020, 0.008, MAT.frame, midX, midY + 0.010, beltZ));
    const dx = motorX - 0, dy = motorY - D.rollZ;
    const beltLen = Math.hypot(dx, dy), beltAng = Math.atan2(dy, dx);
    g.add(box(beltLen, 0.006, 0.004, MAT.rubber,
      motorX / 2, (D.rollZ + motorY) / 2 + (pulleyR1 + pulleyR2) / 2, beltZ, 0, 0, beltAng));
    g.add(box(beltLen, 0.006, 0.004, MAT.rubber,
      motorX / 2, (D.rollZ + motorY) / 2 - (pulleyR1 + pulleyR2) / 2, beltZ, 0, 0, beltAng));
    // 走线到电控舱：世界目标 x≈0.02 → 局部 = 0.02 - D.rollX
    const ecuLocalX = 0.02 - D.rollX;
    const wirePts = [
      new THREE.Vector3(motorX, motorY - 0.03, motorZ - 0.02),
      new THREE.Vector3(motorX - 0.08, motorY - 0.05, 0.14),
      new THREE.Vector3(ecuLocalX, D.bodyZ + 0.05, 0.12),
      new THREE.Vector3(ecuLocalX - 0.08, D.bodyZ + 0.05, 0.12),
    ];
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePts), 20, 0.0035, 6, false), MAT.hole));
    g.add(box(0.010, 0.006, 0.008, MAT.white, motorX - 0.03, motorY - 0.032, motorZ - 0.018));
    frontUnit.add(g);
    parts.rollDrive = g;
  }

  // 弧道
  {
    const g = new THREE.Group();
    frontUnit.add(g);
    const AX = 0, AY = D.rollZ;
    const chW = D.guideChW, wallH = D.guideWallH;
    const a0 = D.guideA0, a1 = D.guideA1;
    const surfAt = (a) => ({
      x: AX + D.guideR * Math.cos(a),
      y: AY + D.guideR * Math.sin(a),
    });
    const segs = 14;
    for (let i = 0; i < segs; i++) {
      const a = a0 + (a1 - a0) * (i + 0.5) / segs;
      const p = surfAt(a);
      const segLen = D.guideR * Math.abs(a1 - a0) / segs * 1.12;
      const tan = a + Math.PI / 2;
      g.add(box(segLen, 0.014, chW, MAT.petg, p.x, p.y, 0, 0, 0, tan));
      g.add(box(segLen * 0.92, 0.003, chW - 0.01, MAT.white,
        p.x - 0.006 * Math.cos(a), p.y - 0.006 * Math.sin(a), 0, 0, 0, tan));
      for (const s of [1, -1]) {
        g.add(box(segLen, wallH, 0.012, MAT.petg,
          p.x, p.y + wallH / 2, s * (chW / 2), 0, 0, tan));
      }
    }
    for (let k = 1; k < 4; k++) {
      const a = a0 + (a1 - a0) * k / 4;
      const p = surfAt(a);
      for (const s of [1, -1]) {
        g.add(cyl(0.002, 0.004, MAT.bearing, p.x, p.y + 0.008, s * (chW / 2), Math.PI / 2, 0, 0, 6));
      }
    }
    {
      const pB = surfAt(a1);
      g.add(box(0.010, 0.016, chW, MAT.frame, pB.x - 0.01, pB.y + 0.01, 0));
      const pA = surfAt(a0);
      g.add(box(0.012, 0.006, chW * 0.9, MAT.white, pA.x + 0.008, pA.y - 0.004, 0, 0, 0, Math.atan2(Math.sin(a0), Math.cos(a0))));
    }
    parts.guard = g;
  }

  // 车架上装：护板 + 横梁 + 挡板
  {
    const g = new THREE.Group();
    const AX = BASE_ROLL_X, AY = D.rollZ;
    const beamH = D.beamY;

    const shroudGeo = new THREE.TorusGeometry(D.shroudR, 0.010, 8, 20, D.shroudSpan);
    for (const s of [1, -1]) {
      const holder = new THREE.Group();
      holder.position.set(AX, AY, s * (D.rollL / 2 + 0.006));
      holder.rotation.z = D.shroudStart;
      holder.add(new THREE.Mesh(shroudGeo, MAT.petg));
      g.add(holder);
    }
    for (let i = 0; i < 3; i++) {
      const a = D.shroudStart + D.shroudSpan * (i + 0.5) / 3;
      g.add(box(0.012, 0.012, D.rollL, MAT.petg,
        AX + D.shroudR * Math.cos(a), AY + D.shroudR * Math.sin(a), 0));
    }
    for (const s of [1, -1]) {
      for (const a of [D.shroudStart + 0.2, D.shroudStart + D.shroudSpan - 0.1]) {
        const sx = AX + D.shroudR * Math.cos(a);
        const sy = AY + D.shroudR * Math.sin(a);
        const railZ = s * (D.bodyW / 2 - 0.030);
        const postH = Math.max(0.03, sy - D.bodyTop);
        g.add(box(0.020, postH, 0.020, MAT.extrusion, sx, D.bodyTop + postH / 2, railZ));
        g.add(box(0.024, 0.012, 0.022, MAT.frame, sx, D.bodyTop + 0.006, railZ));
        g.add(box(0.045, 0.012, 0.014, MAT.frame, sx, sy - 0.01, (railZ + s * (D.rollL / 2 + 0.01)) / 2));
      }
    }

    g.add(box(0.020, 0.020, D.bodyW - 0.06, MAT.extrusion, D.beamX, beamH, 0));
    for (const s of [1, -1]) {
      const railZ = s * (D.bodyW / 2 - 0.05);
      g.add(box(0.020, beamH - D.bodyTop, 0.020, MAT.extrusion, D.beamX, (D.bodyTop + beamH) / 2, railZ));
      g.add(box(0.040, 0.014, 0.032, MAT.frame, D.beamX, D.bodyTop + 0.006, railZ));
    }

    const ddx = D.deflectorX1 - D.deflectorX0;
    const ddy = D.deflectorY1 - D.deflectorY0;
    const len = Math.hypot(ddx, ddy);
    const boardAng = Math.atan2(ddy, ddx);
    const midX = (D.deflectorX0 + D.deflectorX1) / 2;
    const midY = (D.deflectorY0 + D.deflectorY1) / 2;
    const defW = D.rollL * 0.80;
    const armLen = Math.hypot(midX - D.beamX, midY - beamH);
    const armAng = Math.atan2(midY - beamH, midX - D.beamX);

    for (const s of [1, -1]) {
      const z = s * (defW / 2 - 0.02);
      g.add(box(0.022, 0.022, 0.014, MAT.frame, D.beamX, beamH, z));
      g.add(cyl(0.007, 0.012, MAT.bearing, D.beamX, beamH, z, Math.PI / 2, 0, 0, 12));
      g.add(box(armLen, 0.014, 0.014, MAT.extrusion,
        (D.beamX + midX) / 2, (beamH + midY) / 2, z, 0, 0, armAng));
      g.add(box(0.020, 0.020, 0.016, MAT.frame, midX, midY, z));
      g.add(cyl(0.0055, 0.036, MAT.metal, midX, midY, z, Math.PI / 2, 0, 0, 12));
      g.add(cyl(0.008, 0.006, MAT.bearing, midX, midY, z + s * 0.020, Math.PI / 2, 0, 0, 6));
    }

    const deflectorPivot = new THREE.Group();
    deflectorPivot.position.set(midX, midY, 0);
    g.add(deflectorPivot);
    deflectorPivot.add(box(len, D.deflectorT, defW, MAT.def, 0, 0, 0, 0, 0, boardAng));
    deflectorPivot.add(box(len * 0.92, 0.004, defW * 0.9, MAT.rubber,
      -0.004 * Math.sin(boardAng), 0.004 * Math.cos(boardAng), 0, 0, 0, boardAng));
    for (const s of [1, -1]) {
      deflectorPivot.add(box(len, 0.036, 0.008, MAT.frame, 0, -0.010, s * (defW / 2 + 0.006), 0, 0, boardAng));
      deflectorPivot.add(cyl(0.007, 0.010, MAT.bearing, 0, 0, s * (defW / 2 - 0.02), Math.PI / 2, 0, 0, 12));
      deflectorPivot.add(box(0.048, 0.004, 0.008, MAT.hole,
        0.028 * Math.cos(boardAng + 0.5), 0.028 * Math.sin(boardAng + 0.5),
        s * (defW / 2 + 0.012), 0, 0, boardAng + 0.5));
    }
    deflectorRef = { pivot: deflectorPivot, midX, midY, boardAng, len };
    root.add(g);
    parts.chassisTop = g;
  }

  // 摄像头
  {
    const g = new THREE.Group();
    g.add(box(0.024, D.mh, 0.024, MAT.frame, D.beamX, D.beamY + 0.014 + D.mh / 2, 0));
    g.add(box(0.036, 0.028, 0.036, MAT.dark, D.beamX + 0.010, D.beamY + 0.014 + D.mh + 0.012, 0));
    g.add(cyl(0.010, 0.012, MAT.glass, D.beamX + 0.028, D.beamY + 0.014 + D.mh + 0.012, 0, 0, 0, Math.PI / 2));
    root.add(g);
    parts.camera = g;
  }

  // 后驱
  {
    const g = new THREE.Group();
    const wx = D.wxRear, wy = D.wy, wr = D.wr, ww = D.ww;
    g.add(cyl(0.005, 2 * wy + 0.02, MAT.metal, wx, wr, 0, Math.PI / 2, 0, 0, 16));
    for (const s of [1, -1]) {
      const bz = s * 0.12;
      g.add(cyl(0.014, 0.028, MAT.bearing, wx, wr, bz, Math.PI / 2, 0, 0, 24));
      g.add(box(0.036, 0.036, 0.018, MAT.petg, wx, wr, bz + s * 0.018));
      g.add(box(0.030, 0.014, 0.030, MAT.frame, wx, wr - 0.022, bz));
      g.add(box(0.030, 0.014, 0.030, MAT.seal, wx, wr - 0.030, bz));
    }
    for (const s of [1, -1]) {
      const z = s * wy;
      g.add(cyl(wr, ww, MAT.rubber, wx, wr, z, Math.PI / 2, 0, 0, 48));
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        g.add(box(0.006, 0.004, ww * 0.9, MAT.dark,
          wx + (wr - 0.002) * Math.cos(a), wr + (wr - 0.002) * Math.sin(a), z, 0, 0, a));
      }
      g.add(cyl(wr * 0.38, ww + 0.004, MAT.metal, wx, wr, z, Math.PI / 2, 0, 0));
      g.add(cyl(0.010, ww + 0.012, MAT.bearing, wx, wr, z, Math.PI / 2, 0, 0, 20));
      g.add(box(wr * 1.8, 0.006, ww + 0.020, MAT.petg, wx, wr + wr + 0.006, z));
    }
    g.add(cyl(0.028, 0.014, MAT.metal, wx, wr, 0, Math.PI / 2, 0, 0, 28));
    const moX = wx + 0.045, moY = wr + 0.042, moZ = 0;
    g.add(cyl(0.024, 0.055, MAT.dark, moX, moY, moZ, Math.PI / 2, 0, 0, 32));
    g.add(cyl(0.028, 0.028, MAT.metal, moX, moY, moZ + 0.042, Math.PI / 2, 0, 0, 32));
    g.add(cyl(0.006, 0.018, MAT.metal, moX, moY, moZ + 0.068, Math.PI / 2, 0, 0, 12));
    g.add(cyl(0.014, 0.008, MAT.petg, moX, moY, moZ - 0.032, Math.PI / 2, 0, 0, 16));
    g.add(cyl(0.003, 0.004, MAT.led, moX, moY + 0.010, moZ - 0.032, Math.PI / 2, 0, 0, 8));
    g.add(box(0.040, 0.012, 0.036, MAT.frame, moX, moY - 0.030, moZ));
    g.add(box(0.014, 0.040, 0.014, MAT.frame, moX, (D.bodyZ + moY) / 2 - 0.005, moZ));
    g.add(box(0.030, 0.012, 0.028, MAT.frame, moX, D.bodyZ + 0.012, moZ));
    g.add(box(0.024, 0.004, 0.022, MAT.seal, moX, D.bodyZ + 0.020, moZ));
    g.add(cyl(0.014, 0.012, MAT.metal, moX, moY, moZ + 0.012, Math.PI / 2, 0, 0, 20));
    {
      const dx = wx - moX, dy = wr - moY;
      const beltLen = Math.hypot(dx, dy), beltAng = Math.atan2(dy, dx), beltZ = 0.010;
      g.add(box(beltLen, 0.006, 0.004, MAT.rubber, (wx + moX) / 2, (wr + moY) / 2 + 0.020, beltZ, 0, 0, beltAng));
      g.add(box(beltLen, 0.006, 0.004, MAT.rubber, (wx + moX) / 2, (wr + moY) / 2 - 0.020, beltZ, 0, 0, beltAng));
    }
    root.add(g);
    parts.rearDrive = g;
  }

  // 前轮转向
  {
    const g = new THREE.Group();
    const fwX = D.wxFront;
    const wy = D.wy, wr = D.wr, ww = D.ww;
    const knuckleY = wr + 0.018;
    const armY = wr + 0.048;
    const armOut = 0.028;
    const servoY = D.bodyZ - 0.028;
    g.add(box(0.048, 0.036, 0.040, MAT.dark, fwX + 0.010, servoY, 0));
    g.add(box(0.052, 0.005, 0.044, MAT.frame, fwX + 0.010, servoY - 0.018, 0));
    g.add(box(0.020, 0.024, 0.014, MAT.frame, fwX + 0.010, servoY + 0.016, 0.022));
    g.add(box(0.020, 0.024, 0.014, MAT.frame, fwX + 0.010, servoY + 0.016, -0.022));
    g.add(box(0.036, 0.010, 0.056, MAT.frame, fwX + 0.010, D.bodyZ - 0.004, 0));
    g.add(cyl(0.012, 0.008, MAT.metal, fwX + 0.010, servoY + 0.020, 0, 0, 0, 0, 16));
    g.add(box(0.010, 0.008, 0.070, MAT.fin, fwX + 0.010, servoY + 0.024, 0.028));

    // 前轮组：可绕主销偏转
    const steerGroups = { L: null, R: null };
    for (const s of [1, -1]) {
      const z = s * wy;
      g.add(box(0.030, 0.014, 0.040, MAT.extrusion, fwX, D.bodyZ + 0.008, s * (wy - 0.055)));
      g.add(box(0.014, 0.036, 0.014, MAT.frame, fwX, (D.bodyZ + knuckleY) / 2 + 0.01, s * (wy - 0.020)));
      g.add(cyl(0.008, 0.060, MAT.metal, fwX, knuckleY + 0.022, z, 0, 0, 0, 14));
      g.add(box(0.032, 0.012, 0.024, MAT.petg, fwX, knuckleY + 0.008, z));
      g.add(box(0.012, 0.010, armOut, MAT.frame, fwX, armY, z - s * armOut / 2));
      g.add(cyl(0.005, 0.012, MAT.metal, fwX, armY, z - s * armOut, Math.PI / 2, 0, 0, 10));
      g.add(box(0.010, 0.012, 0.010, MAT.petg, fwX + 0.018, armY + 0.008, z - s * 0.012));

      const sg = new THREE.Group();
      sg.position.set(fwX, wr, z);
      sg.add(cyl(wr, ww, MAT.rubber, 0, 0, 0, Math.PI / 2, 0, 0, 48));
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        sg.add(box(0.006, 0.004, ww * 0.9, MAT.dark,
          (wr - 0.002) * Math.cos(a), (wr - 0.002) * Math.sin(a), 0, 0, 0, a));
      }
      sg.add(cyl(wr * 0.40, ww + 0.004, MAT.metal, 0, 0, 0, Math.PI / 2, 0, 0));
      sg.add(cyl(0.012, ww + 0.010, MAT.bearing, 0, 0, 0, Math.PI / 2, 0, 0, 20));
      sg.add(box(wr * 1.7, 0.006, ww + 0.018, MAT.petg, 0, wr + 0.004, 0));
      g.add(sg);
      steerGroups[s > 0 ? 'L' : 'R'] = sg;
    }

    const linkY = armY;
    const linkZL = wy - armOut;
    const linkZR = -(wy - armOut);
    g.add(cyl(0.004, Math.abs(linkZL - linkZR) + 0.01, MAT.metal,
      fwX + 0.010, linkY, (linkZL + linkZR) / 2, Math.PI / 2, 0, 0, 12));
    for (const z of [linkZL, 0.028, linkZR]) {
      g.add(cyl(0.006, 0.008, MAT.bearing, fwX + 0.010, linkY, z, Math.PI / 2, 0, 0, 12));
    }
    g.add(cyl(0.0035, 0.030, MAT.metal, fwX + 0.010, linkY - 0.012, 0.028, 0, 0, 0.15, 10));
    g.userData.steer = steerGroups;
    root.add(g);
    parts.steer = g;
  }

  // 电池
  {
    const g = new THREE.Group();
    const bx = -0.10, by = D.bodyZ + 0.025, bz = 0.0;
    g.add(box(0.15, 0.045, 0.11, MAT.dark, bx, by, bz));
    g.add(box(0.154, 0.048, 0.114, MAT.seal, bx, by - 0.001, bz));
    g.add(box(0.016, 0.012, 0.014, MAT.estop, bx + 0.080, by + 0.005, bz));
    g.add(box(0.008, 0.008, 0.008, MAT.metal, bx + 0.090, by + 0.005, bz));
    g.add(box(0.018, 0.010, 0.012, MAT.metal, bx + 0.072, by + 0.018, bz + 0.02));
    g.add(box(0.012, 0.008, 0.020, MAT.white, bx + 0.072, by + 0.018, bz - 0.02));
    g.add(box(0.02, 0.040, 0.10, MAT.seal, bx - 0.08, by, bz));
    g.add(box(0.02, 0.040, 0.10, MAT.seal, bx + 0.08, by, bz));
    g.add(cyl(0.003, 0.003, MAT.led, bx + 0.055, by + 0.020, bz + 0.048, Math.PI / 2, 0, 0, 10));
    root.add(g);
    parts.battery = g;
  }

  // 电控舱
  {
    const g = new THREE.Group();
    const ex = 0.02, ey = D.bodyZ + 0.045, ez = 0.12;
    g.add(box(0.11, 0.060, 0.048, MAT.petg, ex, ey, ez));
    g.add(box(0.114, 0.006, 0.052, MAT.shell, ex, ey + 0.032, ez));
    g.add(box(0.108, 0.003, 0.046, MAT.seal, ex, ey + 0.028, ez));
    for (const dx of [-0.045, 0.045]) {
      for (const dz of [-0.018, 0.018]) {
        g.add(cyl(0.0025, 0.004, MAT.bearing, ex + dx, ey + 0.036, ez + dz, 0, 0, 0, 8));
      }
    }
    g.add(box(0.060, 0.004, 0.036, MAT.dark, ex - 0.015, ey + 0.010, ez));
    g.add(box(0.040, 0.004, 0.022, MAT.frame, ex + 0.028, ey + 0.010, ez));
    for (let i = 0; i < 8; i++) {
      g.add(box(0.003, 0.006, 0.002, MAT.metal, ex + 0.012 + i * 0.004, ey + 0.014, ez + 0.010));
    }
    for (let i = 0; i < 5; i++) {
      g.add(box(0.008, 0.003, 0.030, MAT.metal, ex - 0.032 + i * 0.016, ey + 0.020, ez));
    }
    g.add(cyl(0.0035, 0.004, MAT.led, ex + 0.040, ey + 0.018, ez + 0.018, Math.PI / 2, 0, 0, 12));
    for (let i = 0; i < 4; i++) {
      g.add(box(0.06, 0.002, 0.006, MAT.hole, ex - 0.02, ey - 0.028, ez - 0.012 + i * 0.008));
    }
    g.add(box(0.012, 0.008, 0.008, MAT.white, ex + 0.056, ey + 0.005, ez + 0.012));
    g.add(cyl(0.006, 0.010, MAT.dark, ex + 0.064, ey + 0.005, ez + 0.012, 0, 0, Math.PI / 2, 12));
    g.add(box(0.08, 0.004, 0.036, MAT.seal, ex, ey - 0.032, ez));
    root.add(g);
    parts.ecu = g;
  }

  // ToF
  {
    const g = new THREE.Group();
    g.add(box(0.022, 0.018, 0.032, MAT.frame, D.beamX, D.beamY - 0.008, 0));
    g.add(box(0.014, 0.020, 0.024, MAT.dark, D.beamX + 0.016, D.beamY - 0.008, 0));
    g.add(cyl(0.005, 0.004, MAT.glass, D.beamX + 0.024, D.beamY - 0.008, 0, 0, 0, Math.PI / 2, 12));
    for (const s of [1, -1]) {
      g.add(box(0.012, 0.016, 0.018, MAT.dark,
        D.bodyFront - 0.01, 0.080, s * (D.mouthW / 2 + 0.02), 0, s * 0.4, 0));
      g.add(cyl(0.004, 0.003, MAT.glass,
        D.bodyFront - 0.004, 0.080, s * (D.mouthW / 2 + 0.026), 0, s * Math.PI / 2, 0, 10));
    }
    root.add(g);
    parts.tof = g;
  }

  // 感知圈
  const sensor = new THREE.Group();
  {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x3dd68c, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.42, 48), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.012;
    sensor.add(ring);
    const mouthMat = ringMat.clone();
    mouthMat.opacity = 0.10;
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.38), mouthMat);
    mouth.rotation.x = -Math.PI / 2;
    mouth.position.set(0.32, 0.012, 0);
    sensor.add(mouth);
    sensor.visible = false;
    root.add(sensor);
  }

  return {
    root,
    parts,
    MAT,
    rollAdj,
    frontUnit,
    rollerPivot,
    deflectorRef,
    sensor,
    rollAxisX,
    rollAxisY,
    applyFrontUnitOffset,
    setRollBottom(b) {
      rollAdj.bottom = THREE.MathUtils.clamp(b, D.rollBottomMin, D.rollBottomMax);
      applyFrontUnitOffset();
    },
    setRollX(x) {
      D.rollX = THREE.MathUtils.clamp(x, 0.21, 0.27);
      applyFrontUnitOffset();
    },
  };
}

window.EngineRobot={D:D,BR:BR,BASE_ROLL_X:BASE_ROLL_X,buildRobot:buildRobot,makeMats:makeMats};
})();
