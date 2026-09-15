const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "..", "simulation", "robot-model.js");
let s = fs.readFileSync(p, "utf8");
const start = s.indexOf("// 前轮转向");
const end = s.indexOf("// 电池");
if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}
const repl = `// 前轮转向：中置舵机（坐在底板上方）+ 横拉杆 + 主销
  {
    const g = new THREE.Group();
    const kpX = D.wxFront;
    const wy = D.wy, wr = D.wr, ww = D.ww;
    const plateTop = D.bodyZ + 0.013;
    const servoH = 0.022;
    const armY = plateTop + servoH + 0.006;
    const armOut = 0.040;
    const tipZ = wy - armOut;
    const servoX = kpX - 0.008;
    const servoY = plateTop + 0.002 + servoH / 2;

    g.add(box(0.050, 0.004, 0.030, MAT.frame, servoX, plateTop + 0.002, 0));
    g.add(box(0.040, servoH, 0.020, MAT.dark, servoX, servoY, 0));
    for (const s of [1, -1]) {
      g.add(box(0.044, 0.005, 0.006, MAT.frame, servoX, plateTop + 0.012, s * 0.013));
      g.add(cyl(0.0018, 0.008, MAT.bearing, servoX + 0.016, plateTop + 0.012, s * 0.013, 0, 0, 0, 8));
      g.add(cyl(0.0018, 0.008, MAT.bearing, servoX - 0.016, plateTop + 0.012, s * 0.013, 0, 0, 0, 8));
    }
    g.add(cyl(0.0045, 0.014, MAT.metal, servoX, plateTop + servoH + 0.007, 0, 0, 0, 0, 14));
    g.add(cyl(0.012, 0.006, MAT.metal, servoX, armY - 0.001, 0, 0, 0, 0, 20));
    const hornLen = 0.028;
    g.add(box(hornLen, 0.005, 0.012, MAT.fin, servoX + hornLen / 2, armY, 0));
    g.add(cyl(0.004, 0.008, MAT.bearing, servoX + hornLen, armY, 0, Math.PI / 2, 0, 0, 10));

    const tieX = kpX + 0.010;
    g.add(cyl(0.0032, tipZ * 2, MAT.metal, tieX, armY, 0, Math.PI / 2, 0, 0, 12));
    for (const z of [tipZ, 0, -tipZ]) {
      g.add(cyl(0.0055, 0.008, MAT.bearing, tieX, armY, z, Math.PI / 2, 0, 0, 12));
    }
    {
      const ax = servoX + hornLen, bx = tieX;
      g.add(box(Math.max(Math.abs(bx - ax), 0.008), 0.004, 0.008, MAT.metal, (ax + bx) / 2, armY, 0));
    }

    const steerGroups = { L: null, R: null };
    for (const s of [1, -1]) {
      const z = s * wy;
      g.add(box(0.028, 0.020, 0.020, MAT.extrusion, kpX, plateTop + 0.010, s * (wy - 0.070)));
      g.add(box(0.014, 0.040, 0.014, MAT.frame, kpX, plateTop + 0.028, s * (wy - 0.050)));
      g.add(cyl(0.005, 0.070, MAT.metal, kpX, wr + 0.010, z, 0, 0, 0, 14));
      g.add(box(0.036, 0.016, 0.028, MAT.petg, kpX, wr + 0.012, z));
      g.add(cyl(0.005, ww + 0.020, MAT.metal, kpX, wr, z, Math.PI / 2, 0, 0, 12));
      g.add(box(0.014, 0.008, armOut, MAT.frame, tieX, armY, z - s * armOut / 2));
      g.add(cyl(0.005, 0.010, MAT.bearing, tieX, armY, z - s * armOut, Math.PI / 2, 0, 0, 10));
      g.add(box(0.010, 0.010, 0.008, MAT.petg, kpX - 0.018, armY, z - s * 0.010));

      const sg = new THREE.Group();
      sg.position.set(kpX, wr, z);
      sg.add(cyl(wr, ww, MAT.rubber, 0, 0, 0, Math.PI / 2, 0, 0, 48));
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        sg.add(box(0.006, 0.004, ww * 0.9, MAT.dark,
          (wr - 0.002) * Math.cos(a), (wr - 0.002) * Math.sin(a), 0, 0, 0, a));
      }
      sg.add(cyl(wr * 0.40, ww + 0.004, MAT.metal, 0, 0, 0, Math.PI / 2, 0, 0));
      sg.add(cyl(0.012, ww + 0.010, MAT.bearing, 0, 0, 0, Math.PI / 2, 0, 0, 20));
      sg.add(box(wr * 1.7, 0.006, ww + 0.018, MAT.petg, 0, wr + 0.004, 0));
      g.add(sg);
      steerGroups[s > 0 ? 'L' : 'R'] = sg;
    }
    g.userData.steer = steerGroups;
    root.add(g);
    parts.steer = g;
  }

  `;
s = s.slice(0, start) + repl + s.slice(end);
fs.writeFileSync(p, s, "utf8");
console.log("patched robot-model steer");
