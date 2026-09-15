const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const bom = fs.readFileSync(path.join(__dirname, "bom-data.js"), "utf8");
const eng = fs.readFileSync(path.join(__dirname, "engine-robot.js"), "utf8");
const official = fs.readFileSync(path.join(root, "BOM-详细配件清单.md"), "utf8");

// BOM catalog ids from JSON
const m = bom.match(/window\.BOM\s*=\s*(\{[\s\S]*\});/);
let bomIds = [];
let parts = [];
if (m) {
  const data = JSON.parse(m[1]);
  parts = data.parts;
  bomIds = data.parts.map((p) => p.id);
}

// official cut list codes from markdown tables
const offIds = [...official.matchAll(/\|\s*([A-Z]{1,3}-\d{2}[A-Z]?)\s*\|/g)].map((x) => x[1]);
const offUniq = [...new Set(offIds)];

// engine bodySubs + parts.*
const subIds = [...eng.matchAll(/subG\("([^"]+)"\)/g)].map((x) => x[1]);
const engSubs = [...new Set(subIds)];
const engParts = [...eng.matchAll(/parts\.([A-Za-z0-9_]+)\s*=/g)].map((x) => x[1]);

console.log("=== 官方切割清单代号 ===");
console.log(offUniq.sort().join(" "));
console.log("\n=== BOM 数据 id ===");
console.log(bomIds.sort().join(" "));
console.log("\n=== 3D bodySubs ===");
console.log(engSubs.sort().join(" "));
console.log("\n=== 3D parts.* ===");
console.log([...new Set(engParts)].join(" "));

const set = (a) => new Set(a);
const o = set(offUniq);
const b = set(bomIds);
const s = set(engSubs);

console.log("\n=== 官方有、BOM数据无 ===");
console.log([...o].filter((x) => !b.has(x)).join(" ") || "(无)");
console.log("\n=== BOM数据有、官方无（可能是我们补的） ===");
console.log([...b].filter((x) => !o.has(x)).join(" ") || "(无)");
console.log("\n=== 3D子组有、BOM无 ===");
console.log([...s].filter((x) => !b.has(x)).join(" ") || "(无)");
console.log("\n=== BOM有、3D无子组（可能在其它模块或无几何） ===");
console.log([...b].filter((x) => !s.has(x)).join(" ") || "(无)");

// qty summary
console.log("\n=== 关键件数量 ===");
for (const p of parts) {
  if (/^(E-|PL-|SH-|BR-|WH-|ST-|M-|S-|U-)/.test(p.id)) {
    console.log(p.id, "qty=" + p.qty, p.name);
  }
}
