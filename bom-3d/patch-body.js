const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "..", "simulation", "robot-model.js");
let s = fs.readFileSync(p, "utf8");
const start = s.indexOf("// ── 车体 ──");
const end = s.indexOf("// ── 球筐 ──");
if (start < 0 || end < 0) {
  console.error("body markers", start, end);
  process.exit(1);
}
const repl = `// ── 车体（按 BOM 件号拆分子组）──
  {
    const t = 0.013;
    const bz = D.bodyZ + D.bodyH / 2;
    const g = new THREE.Group();
    const sub = {};
    function subG(id) {
      if (!sub[id]) {
        sub[id] = new THREE.Group();
        sub[id].userData.bomId = id;
        g.add(sub[id]);
      }
      return sub[id];
    }

    // E-01 纵梁（侧向，不进轮下中心）
    for (const s of [1, -1]) {
      subG("E-01").add(box(D.bodyL, 0.020, 0.020, MAT.extrusion,
        D.bodyCx, D.bodyTop - 0.010, s * (D.bodyW / 2 - 0.012)));
      subG("E-01").add(box(D.bodyL * 0.55, 0.020, 0.020, MAT.extrusion,
        D.bodyX0 + D.bodyL * 0.55 / 2, D.bodyZ - 0.008, s * (D.bodyW / 2 - 0.020)));
    }
    subG("E-02").add(box(0.020, 0.020, D.bodyW, MAT.extrusion,
      D.bodyX0 + 0.012, D.bodyTop - 0.010, 0));
    subG("E-02").add(box(0.020, 0.020, D.bodyW, MAT.extrusion,
      D.bodyX0 + 0.012, D.bodyZ - 0.008, 0));
    subG("E-03").add(box(0.020, 0.020, D.bodyW, MAT.extrusion,
      -0.08, D.bodyTop - 0.010, 0));
    // E-04 仅左右侧，轮下无横梁
    {
      const ex = D.bodyFront - 0.035;
      const sideL = 0.055;
      for (const s of [1, -1]) {
        subG("E-04").add(box(0.020, 0.020, sideL, MAT.extrusion,
          ex, D.bodyTop - 0.010, s * (D.bodyW / 2 - sideL / 2 - 0.005)));
        subG("E-04").add(box(0.020, 0.020, sideL, MAT.extrusion,
          ex, D.bodyZ + 0.012, s * (D.bodyW / 2 - sideL / 2 - 0.005)));
      }
    }

    const topRearL = D.basketFront - D.bodyX0;
    subG("PL-01").add(box(topRearL, t, D.bodyW, MAT.plate,
      D.bodyX0 + topRearL / 2, D.bodyTop - t / 2, 0));
    const topFrontL = D.bodyFront - D.basketFront;
    const topSideW = (D.bodyW - D.topSlotW) / 2;
    for (const s of [1, -1]) {
      subG("PL-01").add(box(topFrontL, t, topSideW, MAT.plate,
        D.basketFront + topFrontL / 2, D.bodyTop - t / 2,
        s * (D.topSlotW / 2 + topSideW / 2)));
    }
    const botRearL = D.botSlotX0 - D.bodyX0;
    subG("PL-01").add(box(botRearL, t, D.bodyW, MAT.plate,
      D.bodyX0 + botRearL / 2, D.bodyZ + t / 2, 0));
    const botFrontL = D.bodyFront - D.botSlotX0;
    const botSideW = 0.035;
    const botSlotHalf = D.bodyW / 2 - botSideW;
    for (const s of [1, -1]) {
      subG("PL-01").add(box(botFrontL, t, botSideW, MAT.plate,
        D.botSlotX0 + botFrontL / 2, D.bodyZ + t / 2,
        s * (botSlotHalf - botSideW / 2)));
    }
    for (const s of [1, -1]) {
      subG("PL-01").add(box(0.10, t + 0.006, 0.09, MAT.hole,
        D.wxFront, D.bodyZ + t / 2, s * (D.wy - 0.02)));
    }
    subG("PL-01").add(box(0.055, t + 0.004, 0.055, MAT.hole,
      D.wxRear, D.bodyZ + t / 2, 0));

    const skirtRear = 0.10 - D.bodyX0;
    for (const s of [1, -1]) {
      subG("PL-02").add(box(skirtRear, D.bodyH, t, MAT.plate,
        D.bodyX0 + skirtRear / 2, bz, s * (D.bodyW / 2 - t / 2)));
    }
    subG("PL-02").add(box(t, D.bodyH, D.bodyW, MAT.plate, D.bodyX0 + t / 2, bz, 0));
    const mouthTop = D.mouthZ + D.mouthH / 2;
    const upH = D.bodyTop - mouthTop - 0.004;
    if (upH > 0.01) {
      subG("PL-02").add(box(t, upH, D.bodyW, MAT.plate,
        D.bodyFront - t / 2, mouthTop + upH / 2 + 0.004, 0));
    }
    const sideW2 = (D.bodyW - D.mouthW) / 2;
    const cheekH = mouthTop - D.bodyZ;
    for (const s of [1, -1]) {
      subG("PL-02").add(box(t, cheekH, sideW2, MAT.plate,
        D.bodyFront - t / 2, D.bodyZ + cheekH / 2, s * (D.mouthW / 2 + sideW2 / 2)));
      subG("PL-02").add(box(skirtRear * 0.85, 0.025, 0.018, MAT.rubber,
        D.bodyX0 + skirtRear * 0.5, D.bodyZ + 0.022, s * (D.bodyW / 2 + 0.006)));
    }
    subG("E-08").add(box(D.basketL + 0.01, 0.008, 0.012, MAT.frame,
      D.basketCx, D.bodyTop + 0.004, D.basketW / 2));
    subG("E-08").add(box(D.basketL + 0.01, 0.008, 0.012, MAT.frame,
      D.basketCx, D.bodyTop + 0.004, -D.basketW / 2));
    subG("E-08").add(box(0.012, 0.008, D.basketW + 0.01, MAT.frame,
      D.basketX0, D.bodyTop + 0.004, 0));
    for (const s of [1, -1]) {
      subG("E-08").add(box(D.basketL, 0.004, 0.006, MAT.seal,
        D.basketCx, D.bodyTop + 0.010, s * (D.basketW / 2 - 0.004)));
      subG("F-17").add(box(0.022, 0.014, 0.018, MAT.metal,
        D.basketCx, D.bodyTop + 0.008, s * (D.basketW / 2 + 0.012)));
      subG("F-17").add(cyl(0.004, 0.020, MAT.metal,
        D.basketCx, D.bodyTop + 0.008, s * (D.basketW / 2 + 0.022), Math.PI / 2, 0, 0, 12));
      subG("F-17").add(cyl(0.008, 0.004, MAT.estop,
        D.basketCx, D.bodyTop + 0.008, s * (D.basketW / 2 + 0.034), Math.PI / 2, 0, 0, 16));
    }
    {
      const ex = D.bodyX0 + 0.04;
      subG("F-17").add(box(0.028, 0.012, 0.028, MAT.dark, ex, D.bodyTop + 0.008, 0));
      subG("F-17").add(cyl(0.012, 0.018, MAT.estop, ex, D.bodyTop + 0.022, 0, 0, 0, 0, 24));
      subG("F-17").add(cyl(0.006, 0.010, MAT.metal, ex, D.bodyTop + 0.034, 0, 0, 0, 0, 16));
    }
    subG("F-01").add(box(0.014, 0.014, 0.014, MAT.metal,
      D.bodyCx, D.bodyTop - 0.010, D.bodyW / 2 - 0.012));
    subG("F-01").add(box(0.014, 0.014, 0.014, MAT.metal,
      D.bodyCx, D.bodyTop - 0.010, -(D.bodyW / 2 - 0.012)));
    subG("ACC-CORNER").add(box(0.018, 0.018, 0.004, MAT.metal,
      D.bodyX0 + 0.02, D.bodyTop - 0.02, D.bodyW / 2 - 0.01));
    subG("ACC-CORNER").add(box(0.004, 0.018, 0.018, MAT.metal,
      D.bodyX0 + 0.02, D.bodyTop - 0.02, D.bodyW / 2 - 0.01));

    root.add(g);
    parts.body = g;
    parts.bodySubs = sub;
  }

  `;
s = s.slice(0, start) + repl + s.slice(end);
fs.writeFileSync(p, s, "utf8");
console.log("patched bodySubs");
