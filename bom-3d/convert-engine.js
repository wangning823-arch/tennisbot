const fs = require("fs");
const path = require("path");
const srcPath = path.join(__dirname, "..", "simulation", "robot-model.js");
let src = fs.readFileSync(srcPath, "utf8");
src = src.replace("import * as THREE from 'three';", "/* uses global THREE */");
src = src.replace(/export const /g, "const ");
src = src.replace(/export function /g, "function ");
const out =
  "/* KIT-TBR-01 工程化整机几何 · 与根目录 index.html 一致 */\n" +
  "(function(){\n" +
  src +
  "\nwindow.EngineRobot={D:D,BR:BR,BASE_ROLL_X:BASE_ROLL_X,buildRobot:buildRobot,makeMats:makeMats};\n" +
  "})();\n";
fs.writeFileSync(path.join(__dirname, "engine-robot.js"), out, "utf8");
console.log("wrote engine-robot.js", out.length);
