// 生成 bom-data.js（完整 BOM + 总装放置 + 安装方法）
const fs = require("fs");
const path = require("path");

const P = (o) => o;

const parts = [
  P({ id: "E-01", cat: "extrusion", name: "纵梁", spec: "2020 · L560", qty: 2, color: "#2b2e33", dims: "560×20×20 mm", material: "6063-T5 阳极黑", tol: "下料±1；垂直度±0.5°", desc: "左右主梁（平台顶侧），车架纵长基准", install: "与 E-02/E-04 角件+T螺母+M5×12 连接；底板经槽 M5×8+法兰螺母。先装左右纵梁成框再装横梁。配套底框短梁见 E-01B。", connects: ["F-01", "F-04", "ACC-CORNER", "PL-01", "E-01B"], model: { type: "extrusion", length: 0.56 }, module: "M1" }),
  P({ id: "E-01B", cat: "extrusion", name: "底框纵梁", spec: "2020 · L≈310", qty: 2, color: "#2b2e33", dims: "约 310×20×20 mm", material: "6063-T5 阳极黑", tol: "下料±1", desc: "平台底左右短纵梁（图中下方两根），与 E-01 同规格型材裁短", install: "与 E-02/E-04 底框角件连接，托住底板；不伸入滚轮进料口中心。原切割清单未单列，可并入 2020 采购余量。", connects: ["E-01", "F-01", "F-04", "PL-01"], model: { type: "extrusion", length: 0.31 }, module: "M1" }),
  P({ id: "E-02", cat: "extrusion", name: "后横梁", spec: "2020 · L420", qty: 1, color: "#2b2e33", dims: "420×20×20 mm", material: "2020 铝型材", tol: "±1 mm", desc: "后端封闭", install: "与 E-01 后端角件连接；后舱围板顶沿对齐。", connects: ["F-01", "F-04", "ACC-CORNER"], model: { type: "extrusion", length: 0.42 }, module: "M1" }),
  P({ id: "E-03", cat: "extrusion", name: "中横梁", spec: "2020 · L420", qty: 1, color: "#2b2e33", dims: "420×20×20 mm", material: "2020 铝型材", tol: "±1 mm", desc: "电池仓分隔", install: "T螺母滑入 E-01 槽，M5×10 锁紧。", connects: ["F-01", "F-04", "ACC-CORNER"], model: { type: "extrusion", length: 0.42 }, module: "M1" }),
  P({ id: "E-04", cat: "extrusion", name: "前横梁", spec: "2020 · L420", qty: 1, color: "#2b2e33", dims: "420×20×20 mm", material: "2020 铝型材", tol: "±1 mm", desc: "前轮/滚轮滑轨根", install: "与 E-01 前端角件连接；E-07 装其上，S-01 舵机座吊梁下中置。", connects: ["F-01", "F-04", "ACC-CORNER", "E-07", "ST-servo"], model: { type: "extrusion", length: 0.42 }, module: "M1" }),
  P({ id: "E-05", cat: "extrusion", name: "挡板立柱", spec: "2020 · L395", qty: 2, color: "#2b2e33", dims: "395×20×20 mm", material: "2020 铝型材", tol: "±1 mm", desc: "E1.3g：平台顶125→挡板梁520", install: "T螺母+M5×10；顶角件连E-06@520", connects: ["F-01", "F-04", "E-06"], model: { type: "extrusion", length: 0.395 }, module: "M3" }),
  P({ id: "E-05B", cat: "extrusion", name: "摄像头短柱", spec: "2020 · L145", qty: 2, color: "#2b2e33", dims: "145×20×20 mm", material: "2020 铝型材", tol: "±1 mm", desc: "平台顶125→相机梁270；不承挡板", install: "T螺母+M5×10；顶连E-06B", connects: ["F-01", "E-06B"], model: { type: "extrusion", length: 0.145 }, module: "M3" }),
  P({ id: "E-06", cat: "extrusion", name: "挡板横梁", spec: "2020 · L400 @ y=520", qty: 1, color: "#2b2e33", dims: "400×20×20 mm", material: "2020 铝型材", tol: "±1 mm", desc: "只吊60°挡板；相机/ToF另梁E-06B@270", install: "角件+M5×12于E-05顶；挂PL-03", connects: ["F-03", "PL-03"], model: { type: "extrusion", length: 0.40 }, module: "M3" }),
  P({ id: "E-06B", cat: "extrusion", name: "摄像头横梁", spec: "2020 · L400 @ y=270", qty: 1, color: "#2b2e33", dims: "400×20×20 mm", material: "2020 铝型材", tol: "±1 mm", desc: "E1.3g：相机+正中ToF；不承挡板", install: "角件+M5×12于E-05B顶；挂ST-cam/ST-tof", connects: ["F-03", "ST-cam", "ST-tof"], model: { type: "extrusion", length: 0.40 }, module: "M3" }),
  P({ id: "E-07", cat: "extrusion", name: "滚轮滑轨", spec: "2020 · L180 + 30×8 长圆孔", qty: 2, color: "#2b2e33", dims: "180×20×20；槽宽6.2 过M5", material: "2020+铣长圆孔", tol: "孔中心距轨端40", desc: "X±15 / Z28 双调节", install: "装前横梁上方左右；轴承座用 M5 星形手拧螺母锁长圆孔。弧道与滚轮同滑架，面隙65不变。", connects: ["F-01", "F-16", "F-04", "ST-bearing"], model: { type: "extrusion", length: 0.18, slot: true }, module: "M2" }),
  P({ id: "E-08", cat: "extrusion", name: "筐定位轨", spec: "2020 · L360", qty: 2, color: "#2b2e33", dims: "360×20×20 mm", material: "2020 铝型材", tol: "轨间距=筐宽+1", desc: "沿X安装，限制筐Z向", install: "平台顶左右各一条，间距=筐外宽+1mm；后端止挡。筐沿轨推入，F-17 锁定。", connects: ["F-01", "F-17", "ST-corner", "ST-basket"], model: { type: "extrusion", length: 0.36 }, module: "M4" }),

  P({ id: "PL-01", cat: "sheet", name: "底板", spec: "5052-H32 · t2.0 · 560×460", qty: 1, color: "#9aa1a8", dims: "560×460×2 mm", material: "5052-H32 喷砂黑粉喷", tol: "功能孔±0.2", desc: "主承力；进料口/轮拱/电机让位/走线孔", install: "铺型材框，沿槽打M5.5；M5×8+背面法兰螺母F-05。四角先锁。底板下表面 y=35。", connects: ["F-02", "F-05", "E-01", "BR-02"], model: { type: "baseplate" }, module: "M1" }),
  P({ id: "PL-02", cat: "sheet", name: "后舱围板", spec: "5052 · t1.5 · 高135", qty: 1, color: "#9aa1a8", dims: "后板460×135；侧板约200×135×2", material: "5052 折弯或3mm PETG", tol: "折弯90°±1°", desc: "只围后段；顶沿 EPDM 3×8", install: "与型材侧槽 T螺母+角码；顶沿粘 EPDM 供筐底压合。", connects: ["F-01", "F-04", "ACC-CORNER"], model: { type: "skirt" }, module: "M1" }),
  P({ id: "PL-03", cat: "sheet", name: "60° 挡板", spec: "t2.0 · 工作面≈148×288", qty: 1, color: "#9aa1a8", dims: "板≈148×288×2；翻边36", material: "5052或PETG；贴0.8橡胶", tol: "倾角约60°相对水平", desc: "球撞板弹入筐；绕杆端螺丝±18°", install: "两固定杆自 E-06 吊下不转；板绕杆端M5旋转弧槽锁紧。起点(150,400)终点(85,520)mm。", connects: ["E-06", "F-01", "E-05"], model: { type: "deflector" }, module: "M3" }),
  P({ id: "PL-04", cat: "sheet", name: "滚轮顶护板", spec: "R105 · 包角~75° · 宽360", qty: 1, color: "#c8ccd2", dims: "内R105 宽360 厚3 PETG/1.5铝", material: "PETG 或铝板", tol: "与轮缘径向间隙≥12", desc: "罩滚轮上方", install: "两侧2020立柱生根平台顶；3条筋M3沉头。属车架上装，不随滑轨。", connects: ["E-05", "F-09"], model: { type: "shroud" }, module: "M3" }),

  P({ id: "M-01", cat: "motor", name: "滚轮电机", spec: "无刷 ≈450–500RPM+驱动", qty: 1, color: "#1a1c20", dims: "名义450RPM · 筋尖Ø152", material: "无刷减速电机", tol: "先定型号再打座", desc: "E1.3g；GT2 20T:20T；轮端≥5kg·cm；表面≈3.6m/s 抛高", install: "装滑架电机板 RC-07；XT30；400–520RPM标定；禁TB6612", connects: ["ST-motor", "F-09", "PU-01", "BL-01"], model: { type: "jgb37" }, module: "M2" }),
  P({ id: "M-02", cat: "motor", name: "后驱电机", spec: "无刷 ≈350RPM+编码 · ≥12kg·cm", qty: 1, color: "#1a1c20", dims: "1:1带轮 · 轮端≈1.65m/s", material: "无刷减速电机", tol: "轮端额定≥12kg·cm", desc: "单电机通轴；里程计=驱动轴+转角；回家靠信标", install: "GT2 20T:20T；无刷驱动≥3A/路；主保险25–40A", connects: ["ST-motor", "F-09", "PU-01", "BL-02"], model: { type: "jgb37", encoder: true }, module: "M5" }),
  P({ id: "S-01", cat: "motor", name: "转向舵机", spec: "MG996R ≥10kg·cm@6V", qty: 1, color: "#2a1810", dims: "40×20×38 mm", material: "金属齿数字舵机", tol: "中位1500μs ±30°≈1100–1900", desc: "前轮中置转向；独立5V≥3A", install: "装 ST-servo 于 E-04 下中置；先校中位再装臂→拉杆→横拉杆。勿与逻辑共小BEC。", connects: ["ST-servo", "F-09", "ST-knuckle", "ACC-LINK"], model: { type: "mg996" }, module: "M5" }),

  P({ id: "WH-01", cat: "other", name: "行走轮", spec: "Ø100 PU 实心 · 宽38", qty: 4, color: "#1a1a1a", dims: "Ø100×38 mm", material: "PU实心胎+轮毂", tol: "—", desc: "四轮等大；后驱前转", install: "后轮键/顶丝装SH-02两端；前轮装转向节。轮心 y=50。罩 ST-wheel。", connects: ["SH-02", "ST-knuckle", "ST-wheel", "BR-01"], model: { type: "wheel" }, module: "M5" }),
  P({ id: "AL-01", cat: "other", name: "滚轮铝管芯", spec: "Ø120×360 · 壁2", qty: 1, color: "#8a9098", dims: "Ø120×360 mm 壁2", material: "6063铝管或PETG芯", tol: "与TPU内孔Ø120过盈", desc: "E1.3：废止Ø80，与TPU内孔闭环", install: "先与ST-tpu压合/胶接，再穿SH-01；两端端盖压608。", connects: ["ST-tpu", "SH-01", "ST-endcap"], model: { type: "alu_core" }, module: "M2" }),
  P({ id: "BR-01", cat: "drive", name: "轴承 608-2RS", spec: "8×22×7 双面橡胶密封", qty: 8, color: "#b0b6bc", dims: "外Ø22×7 · 孔Ø8", material: "轴承钢 2RS", tol: "座孔铰Ø22.0–22.1", desc: "滚轮4 + 前轮4", install: "滚轮每侧两副入端盖/座，预紧间隔套；前轮压入转向节。锂基脂，约3月补。", connects: ["ST-bearing", "SH-01", "ST-endcap", "ST-knuckle"], model: { type: "bearing608" }, module: "M2" }),
  P({ id: "BR-02", cat: "drive", name: "带座轴承", spec: "UCP · 内孔Ø10", qty: 2, color: "#8a9098", dims: "内孔Ø10", material: "铸铁座+轴承", tol: "两座同轴", desc: "后驱通轴支承 z≈±120", install: "M4/M5法兰固定底板；通轴穿过调同轴后锁顶丝。", connects: ["SH-02", "PL-01", "F-07"], model: { type: "pillow" }, module: "M5" }),
  P({ id: "SH-01", cat: "drive", name: "滚轮轴", spec: "Ø8×420 · 两端M6+扁位", qty: 1, color: "#c0c6cc", dims: "Ø8×420 mm", material: "45# 精磨/冷拔", tol: "直线度；两端M6×15", desc: "贯穿TPU滚轮", install: "轴→608×2/侧→端盖→管芯+TPU→另侧轴承。落入滑轨座，挡圈F-14+M6 F-13。", connects: ["BR-01", "ST-endcap", "ST-tpu", "F-13", "F-14", "AL-01"], model: { type: "shaft", d: 0.008, len: 0.42 }, module: "M2" }),
  P({ id: "SH-02", cat: "drive", name: "后驱通轴", spec: "Ø10×460 · 卡簧槽", qty: 1, color: "#c0c6cc", dims: "Ø10×460 mm", material: "冷拔圆钢", tol: "两端卡簧槽/顶丝面", desc: "单电机驱动两后轮", install: "穿BR-02与后轮；PU-03中段顶丝；轮端键/顶丝固定WH-01。", connects: ["BR-02", "PU-03", "F-15", "WH-01"], model: { type: "shaft", d: 0.010, len: 0.46 }, module: "M5" }),
  P({ id: "SH-03", cat: "drive", name: "前轮主销", spec: "Ø8×70", qty: 2, color: "#c0c6cc", dims: "Ø8×70 mm", material: "圆钢", tol: "与转向节孔过渡", desc: "前轮转向节主销", install: "竖直穿ST-knuckle；下端轮轴装轮+608；上端限位；臂接横拉杆。", connects: ["ST-knuckle", "BR-01", "WH-01"], model: { type: "shaft", d: 0.008, len: 0.07 }, module: "M5" }),
  P({ id: "BL-01", cat: "drive", name: "滚轮同步带", spec: "GT2 闭环 · 20T:20T", qty: 1, color: "#1a1a1a", dims: "1:1 · 中心距~40–55", material: "GT2橡胶带", tol: "挠度~5", desc: "M-01 20T → PU-S 20T（禁止40T从动）", install: "1:1；惰轮压背张紧。名义滚轮480RPM。", connects: ["PU-01", "PU-02", "M-01", "PU-04"], model: { type: "belt", major: 0.040, minor: 0.026 }, module: "M2" }),
  P({ id: "BL-02", cat: "drive", name: "后驱同步带", spec: "GT2 · 20T:20T", qty: 1, color: "#1a1a1a", dims: "1:1 · 中心距~50", material: "GT2同步带", tol: "挠度~5", desc: "M-02 → 通轴20T", install: "1:1；张紧后锁电机座。轮端≈350RPM。", connects: ["PU-01", "PU-03", "M-02"], model: { type: "belt", major: 0.040, minor: 0.026 }, module: "M5" }),
  P({ id: "PU-01", cat: "drive", name: "带轮 20T Ø6", spec: "GT2 · 孔Ø6", qty: 2, color: "#8a9098", dims: "齿20 孔Ø6", material: "铝合金", tol: "—", desc: "电机输出轴", install: "套电机Ø6 D轴，顶丝F-15对平面。", connects: ["M-01", "M-02", "F-15"], model: { type: "pulley", teeth: 20, bore: 0.006 }, module: "M2" }),
  P({ id: "PU-02", cat: "drive", name: "带轮 40T Ø6", spec: "GT2 · 孔Ø6", qty: 1, color: "#8a9098", dims: "齿40 孔Ø6", material: "铝合金", tol: "—", desc: "滚轮轴端", install: "装SH-01一端扁位/顶丝，与BL-01啮合。", connects: ["SH-01", "BL-01", "F-15"], model: { type: "pulley", teeth: 40, bore: 0.006 }, module: "M2" }),
  P({ id: "PU-03", cat: "drive", name: "带轮 40T Ø10", spec: "GT2 · 孔Ø10", qty: 1, color: "#8a9098", dims: "齿40 孔Ø10", material: "铝合金", tol: "—", desc: "后驱通轴", install: "装SH-02中段两座之间，顶丝锁紧。", connects: ["SH-02", "BL-02", "F-15"], model: { type: "pulley", teeth: 40, bore: 0.010 }, module: "M5" }),
  P({ id: "PU-04", cat: "drive", name: "张紧惰轮", spec: "光面Ø16+支架", qty: 1, color: "#8a9098", dims: "Ø16 光面+支架", material: "轴承+光面套", tol: "行程~5", desc: "滚轮带张紧", install: "支架装电机座附近，压簧顶带背面；挠度~5后锁紧。", connects: ["BL-01", "ST-motor"], model: { type: "idler" }, module: "M2" }),
  P({ id: "ACC-LINK", cat: "drive", name: "横拉杆球头", spec: "M4/M5 球头扣+拉杆", qty: 1, color: "#c0c6cc", dims: "按前轮距配长", material: "球头扣+螺杆", tol: "左右对称±1扣", desc: "舵机臂→左右转向臂", install: "中位1500μs时左右轮平行；锁球头后试±30°不刮轮拱。", connects: ["S-01", "ST-knuckle"], model: { type: "tie_rod" }, module: "M5" }),

  P({ id: "ST-tpu", cat: "print", name: "TPU 滚轮套", spec: "TPU 95A · 外Ø140 螺旋筋", qty: 1, color: "#3a3c40", dims: "外Ø140 内Ø120 宽≈352", material: "TPU95A 层高0.2 筋100%", tol: "与铝管过盈；宽向留端盖", desc: "连续咬球、自洁排沙", install: "水平慢速15–25mm/s打印；套入AL-01；螺旋导程~120 角~15°。勿用PLA。", connects: ["SH-01", "BR-01", "ST-endcap", "AL-01"], stl: "../stl/tpu_roller_sleeve.stl", model: { type: "tpu_sleeve" }, module: "M2" }),
  P({ id: "ST-guide", cat: "print", name: "弧道段", spec: "PETG · R135 · 4段", qty: 4, color: "#c8ccd2", dims: "R135 宽400 壁3+侧60", material: "PETG+内贴UHMW0.5", tol: "弧心角~12°/段", desc: "同轴上升通道 面隙65", install: "4段M3对接；与滚轮同轴同滑轨。入口不封；出口a≈3.20近竖直。", connects: ["ST-tpu", "F-09", "E-07"], stl: "../stl/guide_arc_segment.stl", model: { type: "guide_arc" }, module: "M2" }),
  P({ id: "ST-bearing", cat: "print", name: "608 轴承座", spec: "PETG · 44×44×16", qty: 4, color: "#c8ccd2", dims: "44×44×16 孔Ø22", material: "PETG/ABS 4周长40%", tol: "孔+0.2后铰Ø22.0–22.1", desc: "滚轮轴支承", install: "热熔M4螺母；608密封朝外压入；M4×12固定E-07槽内T母。", connects: ["BR-01", "SH-01", "F-07", "F-08", "E-07"], stl: "../stl/bearing_housing_608.stl", model: { type: "bearing_house" }, module: "M2" }),
  P({ id: "ST-motor", cat: "print", name: "无刷电机座", spec: "PETG · 按选定型号", qty: 2, color: "#c8ccd2", dims: "先冻结型号再出图", material: "PETG 4周长40%", tol: "法兰/耳距按电机", desc: "禁止无型号按JGB37抱箍直接生产", install: "按无刷法兰或转接板；可垫3mm硅胶", connects: ["M-01", "M-02", "F-09", "F-11"], stl: "../stl/motor_mount_jgb37.stl", model: { type: "motor_mount" }, module: "M2" }),
  P({ id: "ST-knuckle", cat: "print", name: "转向节", spec: "PETG · 主销Ø8 臂28", qty: 2, color: "#c8ccd2", dims: "主销孔Ø8 臂长28", material: "PETG 4周长50%", tol: "按SH-03配孔", desc: "前轮转向 左右各一", install: "主销竖直打印；穿SH-03；轮轴装608+轮；臂球头接ACC-LINK。", connects: ["SH-03", "S-01", "BR-01", "F-08", "ACC-LINK", "WH-01"], stl: "../stl/steering_knuckle.stl", model: { type: "knuckle" }, module: "M5" }),
  P({ id: "ST-servo", cat: "print", name: "舵机座", spec: "PETG · 适配40×20", qty: 1, color: "#c8ccd2", dims: "适配MG996R机体", material: "PETG 3周长30%", tol: "槽间隙0.2", desc: "中置舵机座", install: "热熔M3；舵机放入侧面4×M3锁紧；线缆从座后出。", connects: ["S-01", "F-09", "F-11", "E-04"], stl: "../stl/servo_mount_mg996.stl", model: { type: "servo_mount" }, module: "M5" }),
  P({ id: "ST-ecu", cat: "print", name: "电控盒", spec: "PETG · 110×60×48", qty: 1, color: "#c8ccd2", dims: "110×60×48", material: "PETG 开口朝上", tol: "壁3周长", desc: "密封舱 Pi+ESP32", install: "后舱|z|≤55；先BEC/分配再上层主控；护线圈；百叶朝下。", connects: ["ST-lid", "F-11", "U-02", "U-01"], stl: "../stl/ecu_box.stl", model: { type: "ecu_box" }, module: "M6" }),
  P({ id: "ST-lid", cat: "print", name: "电控盖", spec: "PETG · 114×52×5", qty: 1, color: "#c8ccd2", dims: "114×52×5+唇边", material: "PETG", tol: "唇边贴合", desc: "密封盖 免拆整车可开", install: "唇边对准，4×M3×8均匀锁；可加硅胶圈。", connects: ["ST-ecu", "F-09"], stl: "../stl/ecu_lid.stl", model: { type: "ecu_lid" }, module: "M6" }),
  P({ id: "ST-cam", cat: "print", name: "摄像头支架", spec: "PETG · 夹E-06B@270", qty: 1, color: "#c8ccd2", dims: "夹2020 俯仰-12°±8°", material: "PETG 3周长30%", tol: "抗振夹持", desc: "夹相机梁E-06B装UVC+正中ToF", install: "夹E-06B槽M4锁；镜头朝前下俯；不承挡板", connects: ["E-06B", "U-03", "F-04"], stl: "../stl/camera_bracket.stl", model: { type: "cam_bracket" }, module: "M7" }),
  P({ id: "ST-tof", cat: "print", name: "ToF 支架", spec: "PETG · VL53安装面", qty: 3, color: "#c8ccd2", dims: "VL53L1X 安装面", material: "PETG 3周长30%", tol: "光轴无遮挡", desc: "正中相机梁y=270；左右前偏30°；回家standoff≥35cm", install: "M2×6；正中对E-06B；I2C分地址", connects: ["U-04", "F-12", "E-06B"], stl: "../stl/tof_bracket.stl", model: { type: "tof_bracket" }, module: "M7" }),
  P({ id: "ST-wheel", cat: "print", name: "轮罩", spec: "PETG · 适配Ø100", qty: 4, color: "#c8ccd2", dims: "适配Ø100×38", material: "PETG 2周长15%", tol: "不擦胎面", desc: "四轮外罩", install: "固定侧向型材/支架；前轮留转角空间。", connects: ["WH-01", "F-01"], stl: "../stl/wheel_cover.stl", model: { type: "wheel_cover" }, module: "M5" }),
  P({ id: "ST-finger", cat: "print", name: "护指条", spec: "PETG · 330×10×12", qty: 1, color: "#c8ccd2", dims: "330×10×12", material: "PETG或金属条", tol: "距轮缘>12", desc: "进料口护指", install: "横跨进料口前缘；刮板可从弧道入口抽出清理。", connects: ["ST-tpu", "PL-01", "ST-guide"], stl: "../stl/finger_guard.stl", model: { type: "finger" }, module: "M2" }),
  P({ id: "ST-corner", cat: "print", name: "筐角件", spec: "PETG · L22×22×160", qty: 8, color: "#c8ccd2", dims: "L22×22×160", material: "PETG 3周长25%", tol: "贴合板厚2", desc: "筐四角竖直角件", install: "固定筐四角板缝；可埋M4作提手螺母。", connects: ["F-17", "E-08", "ST-basket"], stl: "../stl/basket_corner.stl", model: { type: "basket_corner" }, module: "M4" }),
  P({ id: "ST-endcap", cat: "print", name: "滚轮端盖", spec: "PETG · 轴承位Ø22", qty: 2, color: "#c8ccd2", dims: "轴承位Ø22 防尘唇", material: "PETG 4周长40%", tol: "与608过渡配合", desc: "滚轮两端压轴承", install: "压入608后与管端固定；迷宫槽朝内。", connects: ["BR-01", "ST-tpu", "SH-01", "AL-01"], stl: "../stl/roller_endcap.stl", model: { type: "endcap" }, module: "M2" }),
  P({ id: "ST-basket", cat: "print", name: "球筐体", spec: "PETG板2mm · 360×420×160", qty: 1, color: "#f0c040", dims: "内腔360×420×160 ≈24L", material: "2mm PETG网孔底 或PP周转筐400×300", tol: "外宽=轨距-1", desc: "实用25–35球；φ8排水孔", install: "沿E-08推入；F-17锁定；底沿压EPDM。取筐：拉环→提手后提。", connects: ["ST-corner", "E-08", "F-17"], model: { type: "basket" }, module: "M4" }),

  P({ id: "ACC-CORNER", cat: "fastener", name: "90° 角件", spec: "2020 铝合金", qty: 16, color: "#e85d04", dims: "标准2020角件", material: "铝合金压铸", tol: "—", desc: "型材直角", install: "T螺母入槽→角件贴合→M5×12对角拧紧。", connects: ["F-01", "F-03", "F-04"], model: { type: "corner" }, module: "M1" }),
  P({ id: "F-01", cat: "fastener", name: "M5×10 内六角", spec: "圆柱头8.8", qty: 40, color: "#c0c6cc", dims: "M5×10", material: "碳钢8.8", tol: "—", desc: "型材+T螺母", install: "与F-04配对；预紧再终拧。", connects: ["F-04", "ACC-CORNER"], model: { type: "screw", d: 0.005, len: 0.01 }, module: "M1" }),
  P({ id: "F-02", cat: "fastener", name: "M5×8 内六角", spec: "圆柱头", qty: 24, color: "#c0c6cc", dims: "M5×8", material: "碳钢8.8", tol: "—", desc: "底板-型材", install: "板面穿入，背面F-05；四角优先。", connects: ["F-05", "PL-01", "E-01"], model: { type: "screw", d: 0.005, len: 0.008 }, module: "M1" }),
  P({ id: "F-03", cat: "fastener", name: "M5×12 内六角", spec: "圆柱头", qty: 12, color: "#c0c6cc", dims: "M5×12", material: "碳钢8.8", tol: "—", desc: "角件连接", install: "穿角件孔入T螺母。", connects: ["ACC-CORNER", "F-04"], model: { type: "screw", d: 0.005, len: 0.012 }, module: "M1" }),
  P({ id: "F-04", cat: "fastener", name: "M5 T螺母", spec: "弹片式", qty: 50, color: "#9aa1a8", dims: "M5弹片T母", material: "钢镀锌+弹片", tol: "槽宽6标准", desc: "2020槽", install: "尖角朝槽内滑入对准孔再上螺丝。", connects: ["F-01", "F-03", "E-01"], model: { type: "tnut" }, module: "M1" }),
  P({ id: "F-05", cat: "fastener", name: "M5 法兰螺母", spec: "—", qty: 24, color: "#9aa1a8", dims: "M5法兰", material: "钢", tol: "—", desc: "底板背面", install: "与F-02配对；不压线束。", connects: ["F-02", "PL-01"], model: { type: "flange_nut" }, module: "M1" }),
  P({ id: "F-07", cat: "fastener", name: "M4×12 内六角", spec: "圆柱头", qty: 16, color: "#c0c6cc", dims: "M4×12", material: "碳钢8.8", tol: "—", desc: "轴承座", install: "穿座耳入热熔螺母或T母。", connects: ["F-08", "ST-bearing", "BR-02"], model: { type: "screw", d: 0.004, len: 0.012 }, module: "M2" }),
  P({ id: "F-08", cat: "fastener", name: "M4 热熔螺母", spec: "预埋", qty: 16, color: "#b87333", dims: "M4热熔", material: "黄铜滚花", tol: "平齐表面", desc: "打印件螺纹", install: "热风枪加热垂直压入，冷却自锁。", connects: ["F-07", "ST-bearing", "ST-knuckle"], model: { type: "heatset", d: 0.004 }, module: "M2" }),
  P({ id: "F-09", cat: "fastener", name: "M3×8 内六角", spec: "圆柱头", qty: 24, color: "#c0c6cc", dims: "M3×8", material: "碳钢8.8", tol: "—", desc: "电机/舵机/盖等", install: "交叉拧紧；铝件勿超扭。", connects: ["F-11", "ST-motor", "M-01", "S-01"], model: { type: "screw", d: 0.003, len: 0.008 }, module: "M2" }),
  P({ id: "F-11", cat: "fastener", name: "M3 热熔螺母", spec: "预埋", qty: 24, color: "#b87333", dims: "M3热熔", material: "黄铜滚花", tol: "—", desc: "打印件螺纹", install: "热风枪压入。", connects: ["F-09"], model: { type: "heatset", d: 0.003 }, module: "M2" }),
  P({ id: "F-12", cat: "fastener", name: "M2×6 内六角", spec: "—", qty: 16, color: "#c0c6cc", dims: "M2×6", material: "碳钢", tol: "—", desc: "ToF/传感器", install: "轻拧，塑料勿滑牙。", connects: ["ST-tof", "U-04"], model: { type: "screw", d: 0.002, len: 0.006 }, module: "M7" }),
  P({ id: "F-13", cat: "fastener", name: "M6×20+螺母", spec: "轴端", qty: 4, color: "#c0c6cc", dims: "M6×20", material: "碳钢", tol: "—", desc: "滚轮轴端", install: "与F-14配合；可点螺纹胶。", connects: ["SH-01", "ST-endcap"], model: { type: "screw", d: 0.006, len: 0.02 }, module: "M2" }),
  P({ id: "F-14", cat: "fastener", name: "轴用挡圈Ø8", spec: "—", qty: 4, color: "#6a7078", dims: "Ø8轴用", material: "弹簧钢", tol: "槽按标准", desc: "轴向定位", install: "卡簧钳装入；勿过度张开。", connects: ["SH-01", "BR-01"], model: { type: "circlip", d: 0.008 }, module: "M2" }),
  P({ id: "F-15", cat: "fastener", name: "顶丝 M4×4", spec: "无头", qty: 4, color: "#6a7078", dims: "M4×4", material: "合金钢", tol: "—", desc: "带轮/轮毂顶紧", install: "对准轴扁位；可点螺纹胶。", connects: ["PU-01", "PU-02", "PU-03", "SH-02"], model: { type: "setscrew" }, module: "M2" }),
  P({ id: "F-16", cat: "fastener", name: "星形手拧螺母M5", spec: "—", qty: 4, color: "#e85d04", dims: "M5星形", material: "尼龙/铝+钢嵌件", tol: "—", desc: "滑轨锁紧免工具", install: "X/Z各一对/侧；调好高度手拧到底再半圈。", connects: ["E-07", "F-01"], model: { type: "starknob" }, module: "M2" }),
  P({ id: "F-17", cat: "fastener", name: "弹簧插销Ø6", spec: "拉环式 行程8", qty: 2, color: "#c0c6cc", dims: "Ø6 行程8 拉力8–12N", material: "钢镀锌", tol: "—", desc: "球筐快拆", install: "拉环拉出→推入锁孔；咔哒即锁定。", connects: ["ST-corner", "E-08", "ST-basket"], model: { type: "springpin" }, module: "M4" }),

  P({ id: "U-01", cat: "elec", name: "香橙派 Zero 2W", spec: "1GB Linux USB×2", qty: 1, color: "#22d866", dims: "SBC", material: "成品板", tol: "—", desc: "视觉/决策上位机", install: "ECU上层；USB接摄像头；UART/I2C连ESP32。", connects: ["U-03", "U-02", "ST-ecu"], model: { type: "sbc" }, module: "M6" }),
  P({ id: "U-02", cat: "elec", name: "ESP32 DevKitC", spec: "WROOM 双核240MHz", qty: 1, color: "#22d866", dims: "DevKitC", material: "成品板", tol: "—", desc: "运动/机构/安全下位机", install: "ECU下层；驱动PWM、ToF I2C、急停；堵转/看门狗。", connects: ["U-05", "ST-ecu"], model: { type: "esp32" }, module: "M6" }),
  P({ id: "U-03", cat: "elec", name: "UVC 摄像头", spec: "640×480 ≥30FPS", qty: 1, color: "#0c2840", dims: "USB免驱", material: "成品模组", tol: "—", desc: "球识别", install: "夹ST-cam；USB带磁环到Pi。", connects: ["ST-cam", "U-01"], model: { type: "camera" }, module: "M7" }),
  P({ id: "U-04", cat: "elec", name: "VL53L1X ToF", spec: "0–4m FOV27°", qty: 3, color: "#22d866", dims: "I2C模块", material: "成品模块", tol: "—", desc: "避障+硬急停", install: "M2装ST-tof；正中对横梁；避开护板遮挡。", connects: ["ST-tof", "F-12", "U-02"], model: { type: "tof" }, module: "M7" }),
  P({ id: "U-05", cat: "elec", name: "TB6612FNG", spec: "双路H桥 建议≥3A/路", qty: 1, color: "#22d866", dims: "驱动模块", material: "成品模块", tol: "—", desc: "后驱+滚轮；勿混无刷", install: "可换板位；PWM接ESP32 LEDC；动力18AWG。", connects: ["U-02", "M-01", "M-02"], model: { type: "driver" }, module: "M6" }),
  P({ id: "U-08", cat: "elec", name: "3S 电池 15000mAh", spec: "11.1V · 弹仓BAT-01 · XT90", qty: 1, color: "#3d5a80", dims: "3S 15000mAh ≈166Wh", material: "21700 3S3P或软包+BMS", tol: "3年后混合≥2h；10.5V/9.9V", desc: "E1.3g：后抽弹仓易换；加宽不加高", install: "BAT-01导轨+卡扣+提手；≤2min换电不拆车架；保险25–40A", connects: ["W-06"], model: { type: "lipo" }, module: "M6" }),
  P({ id: "U-14", cat: "elec", name: "起点信标柱", spec: "青蓝+AprilTag · Ø80–120×H200–300", qty: 1, color: "#0aa", dims: "standoff≥35cm", material: "柱+底座+打印码", tol: "与网球HSV分离", desc: "可搬“家”；RETURN视觉找柱", install: "车尾卡座运输；开局放置；SAFE_STOP若丢失", connects: ["U-03"], model: { type: "camera" }, module: "M7" }),
  P({ id: "W-06", cat: "wire", name: "XT60 公+母", spec: "电池主回路", qty: 2, color: "#f0c040", dims: "XT60对", material: "尼龙+镀金", tol: "—", desc: "动力插拔", install: "14AWG出线；焊后热缩；防反插。", connects: ["U-08"], model: { type: "xt60" }, module: "M6" }),
  P({ id: "W-07", cat: "wire", name: "JST-SM 2P", spec: "电机接插件", qty: 4, color: "#e8e8e8", dims: "2P", material: "尼龙+端子", tol: "—", desc: "电机可拔 便于换无刷", install: "电机/驱动各一；活动段留15%；波纹管保护。", connects: ["M-01", "M-02", "U-05"], model: { type: "jst" }, module: "M6" }),

  /* —— 官方清单补全（原 bom 缺失） —— */
  P({ id: "ACC-END", cat: "fastener", name: "2020 端盖", spec: "塑料端盖", qty: 12, color: "#2b2e33", dims: "2020 塑料端盖", material: "尼龙", tol: "—", desc: "型材端头防尘/美观", install: "敲入型材端口。", connects: ["E-01", "E-02"], model: { type: "corner" }, module: "M1" }),
  P({ id: "F-06", cat: "fastener", name: "M5 弹垫+平垫", spec: "—", qty: 80, color: "#9aa1a8", dims: "M5 垫片组", material: "钢", tol: "—", desc: "防松", install: "与 F-01/F-02 配对使用。", connects: ["F-01", "F-02"], model: { type: "flange_nut" }, module: "M1" }),
  P({ id: "F-10", cat: "fastener", name: "M3×6 内六角", spec: "—", qty: 8, color: "#c0c6cc", dims: "M3×6", material: "碳钢", tol: "—", desc: "急停/开关固定", install: "面板开孔后锁紧。", connects: ["U-11", "U-10"], model: { type: "screw", d: 0.003, len: 0.006 }, module: "M6" }),
  P({ id: "F-18", cat: "fastener", name: "尼龙扎带 3×150", spec: "—", qty: 30, color: "#e8e8e8", dims: "3×150", material: "尼龙", tol: "—", desc: "线束固定", install: "沿型材槽绑扎，活动段留余量。", connects: ["W-01"], model: { type: "jst" }, module: "M6" }),
  P({ id: "F-19", cat: "fastener", name: "扎带座 3M 背胶", spec: "—", qty: 10, color: "#e8e8e8", dims: "背胶扎带座", material: "尼龙+3M", tol: "—", desc: "线束固定点", install: "清洁后粘贴于型材/板面。", connects: ["F-18"], model: { type: "jst" }, module: "M6" }),
  P({ id: "F-20", cat: "fastener", name: "EPDM 密封条 3×8", spec: "—", qty: 1, color: "#1a1a1a", dims: "3×8 mm · 1.5m", material: "EPDM", tol: "—", desc: "筐沿/舱沿密封", install: "粘贴平台顶筐沿与电控舱口。", connects: ["ST-basket", "ST-ecu"], model: { type: "flange_nut" }, module: "M4" }),
  P({ id: "F-21", cat: "fastener", name: "橡胶护边", spec: "—", qty: 1, color: "#1a1a1a", dims: "约 1 m", material: "橡胶", tol: "—", desc: "锐边防护", install: "扣在钣金/型材锐边。", connects: ["PL-01"], model: { type: "flange_nut" }, module: "M1" }),
  P({ id: "BR-03", cat: "drive", name: "法兰轴承 6901", spec: "12×24×6 · 可选", qty: 2, color: "#b0b6bc", dims: "12×24×6", material: "轴承钢", tol: "—", desc: "前轮轮轴（若与 608 通用可取消）", install: "压入转向节轮轴孔；或改用 608 则本项取消。", connects: ["ST-knuckle", "BR-01"], model: { type: "bearing608" }, module: "M5" }),
  P({ id: "SH-04", cat: "drive", name: "前轮轮轴", spec: "Ø6×40 · 可选", qty: 2, color: "#c0c6cc", dims: "Ø6×40", material: "圆钢", tol: "—", desc: "前轮轴（若不用 12mm 轴方案）", install: "穿转向节与轮毂，顶丝/挡圈定位。", connects: ["ST-knuckle", "WH-01"], model: { type: "shaft", d: 0.006, len: 0.04 }, module: "M5" }),
  P({ id: "U-06", cat: "elec", name: "BEC 逻辑 5V3A", spec: "降压模块", qty: 1, color: "#22d866", dims: "5V 3A", material: "模块", tol: "—", desc: "Pi / ESP32 供电", install: "装电控舱；与舵机 BEC 分开。", connects: ["U-01", "U-02", "U-08"], model: { type: "driver" }, module: "M6" }),
  P({ id: "U-07", cat: "elec", name: "BEC 舵机 5V3A", spec: "独立舵机供电", qty: 1, color: "#22d866", dims: "5V 3A", material: "模块", tol: "—", desc: "MG996R 专用，勿与逻辑共用", install: "独立从电池取电，只给舵机。", connects: ["S-01", "U-08"], model: { type: "driver" }, module: "M6" }),
  P({ id: "U-09", cat: "elec", name: "平衡充 B6 类", spec: "外置充电", qty: 1, color: "#8899aa", dims: "B6 平衡充", material: "成品", tol: "—", desc: "3S LiPo 充电", install: "车侧只出 XT60+平衡头座，充电器外置。", connects: ["U-08"], model: { type: "driver" }, module: "M6" }),
  P({ id: "U-10", cat: "elec", name: "主开关 15A", spec: "拨动开关", qty: 1, color: "#e85d04", dims: "15A 拨动", material: "成品", tol: "—", desc: "串主回路", install: "装后舱面板；与急停串联。", connects: ["U-08", "U-11"], model: { type: "estop" }, module: "M6" }),
  P({ id: "U-11", cat: "elec", name: "急停蘑菇头", spec: "自锁 NC", qty: 1, color: "#cc2200", dims: "蘑菇头自锁", material: "成品", tol: "—", desc: "串动力回路，硬切断", install: "装后上角易按位置；NC 串电机与舵机动力。", connects: ["U-10", "U-05"], model: { type: "estop" }, module: "M7" }),
  P({ id: "U-12", cat: "elec", name: "保险 5A", spec: "汽车插片+座", qty: 1, color: "#f0c040", dims: "5A 插片", material: "成品", tol: "—", desc: "主回路过流保护", install: "紧靠电池输出。", connects: ["U-08"], model: { type: "xt60" }, module: "M6" }),
  P({ id: "U-13", cat: "elec", name: "电源分配板", spec: "洞洞板/端子", qty: 1, color: "#22d866", dims: "星形共地", material: "洞洞板", tol: "—", desc: "共地星形分配", install: "装 ECU 内；结构铝与电池负单点接地。", connects: ["U-06", "U-07", "U-08"], model: { type: "driver" }, module: "M6" }),
  P({ id: "W-01", cat: "wire", name: "动力线 14AWG", spec: "硅胶线红黑", qty: 1, color: "#cc2200", dims: "各约 0.5 m", material: "硅胶线", tol: "—", desc: "电池→开关/驱动", install: "14AWG；焊后热缩。", connects: ["U-08", "W-06"], model: { type: "jst" }, module: "M6" }),
  P({ id: "W-02", cat: "wire", name: "电机线 18AWG", spec: "—", qty: 1, color: "#e8e8e8", dims: "约 1 m", material: "硅胶线", tol: "—", desc: "驱动→电机", install: "与 JST-SM 端接。", connects: ["W-07", "U-05"], model: { type: "jst" }, module: "M6" }),
  P({ id: "W-03", cat: "wire", name: "编码器线 4芯", spec: "28AWG 屏蔽", qty: 1, color: "#8899aa", dims: "约 0.8 m", material: "屏蔽线", tol: "—", desc: "后驱编码器", install: "XH2.54-6P 端接，尽量短、远离动力线。", connects: ["M-02", "U-02"], model: { type: "jst" }, module: "M6" }),
  P({ id: "W-04", cat: "wire", name: "I2C 线 4芯", spec: "28AWG", qty: 1, color: "#8899aa", dims: "约 1 m", material: "多芯线", tol: "—", desc: "ToF 总线", install: "XH2.54-4P；VCC/GND/SDA/SCL。", connects: ["U-04", "U-02"], model: { type: "jst" }, module: "M7" }),
  P({ id: "W-05", cat: "wire", name: "USB 线带磁环", spec: "A–C 或 A–Micro", qty: 1, color: "#e8e8e8", dims: "1 根", material: "成品", tol: "—", desc: "Pi↔摄像头 / Pi↔ESP32", install: "走梁槽，加磁环抑噪。", connects: ["U-01", "U-03"], model: { type: "jst" }, module: "M6" }),
  P({ id: "W-08", cat: "wire", name: "XH2.54 端子", spec: "4P/6P", qty: 1, color: "#e8e8e8", dims: "若干", material: "尼龙+端子", tol: "—", desc: "传感/编码器", install: "压线后插入对应模块座。", connects: ["W-03", "W-04"], model: { type: "jst" }, module: "M6" }),
  P({ id: "W-09", cat: "wire", name: "波纹管 Ø6/8", spec: "—", qty: 1, color: "#1a1a1a", dims: "约 2 m", material: "尼龙波纹管", tol: "—", desc: "线束保护", install: "活动段套管，留 15% 余量。", connects: ["W-01"], model: { type: "jst" }, module: "M6" }),
  P({ id: "W-10", cat: "wire", name: "热缩管套装", spec: "3/5/8 mm", qty: 1, color: "#1a1a1a", dims: "1 套", material: "热缩管", tol: "—", desc: "端子绝缘", install: "焊后热缩烘缩。", connects: ["W-01", "W-06"], model: { type: "jst" }, module: "M6" }),
  P({ id: "W-11", cat: "wire", name: "护线圈 Ø12", spec: "板孔用", qty: 6, color: "#1a1a1a", dims: "Ø12", material: "橡胶", tol: "—", desc: "底板走线孔防磨", install: "压入底板 φ12 孔。", connects: ["PL-01", "W-01"], model: { type: "jst" }, module: "M6" }),
];

/* 总装放置（米）
 * 坐标：X前 Y上 Z右；原点=后轮轴投影到地面
 * 型材模型长度沿Z：沿X→rot[0,π/2,0]；沿Y→rot[π/2,0,0]；沿Z→rot[0,0,0]
 * 轴/圆柱默认沿Y：沿Z→rot[π/2,0,0]；沿X→rot[0,0,π/2]
 * 网球Ø67；底盘底 y=0.035；平台顶 y=0.170；滚轮轴 (0.24, 0.138)
 * 轮Ø100 心高 y=0.05；后轮 x=-0.28 前轮 x=0.04；z=±0.215
 */
const placements = [
  // ── M1 车架（底框 y≈0.028，纵梁沿X）──
  { partId: "E-01", pos: [-0.02, 0.028, 0.21], rot: [0, Math.PI / 2, 0] },
  { partId: "E-01", pos: [-0.02, 0.028, -0.21], rot: [0, Math.PI / 2, 0] },
  { partId: "E-02", pos: [-0.28, 0.028, 0], rot: [0, 0, 0] },
  { partId: "E-03", pos: [-0.08, 0.028, 0], rot: [0, 0, 0] },
  { partId: "E-04", pos: [0.20, 0.028, 0], rot: [0, 0, 0] },
  // 底板真实 560×460
  { partId: "PL-01", pos: [-0.02, 0.036, 0], rot: [0, 0, 0] },
  { partId: "PL-02", pos: [-0.18, 0.035, 0], rot: [0, 0, 0], scale: 1.15 },
  // 滚轮滑轨沿X，左右
  { partId: "E-07", pos: [0.24, 0.055, 0.19], rot: [0, Math.PI / 2, 0] },
  { partId: "E-07", pos: [0.24, 0.055, -0.19], rot: [0, Math.PI / 2, 0] },

  // ── M2 滚轮轴系：轴线 (0.24, 0.138) 沿Z ──
  { partId: "AL-01", pos: [0.24, 0.138, 0], rot: [0, Math.PI / 2, 0], scale: 1.8 },
  { partId: "ST-tpu", pos: [0.24, 0.138, 0], rot: [0, Math.PI / 2, 0], scale: 1.9 },
  { partId: "SH-01", pos: [0.24, 0.138, 0], rot: [0, 0, 0] },
  { partId: "ST-endcap", pos: [0.24, 0.138, 0.188], rot: [0, Math.PI / 2, 0] },
  { partId: "ST-endcap", pos: [0.24, 0.138, -0.188], rot: [0, Math.PI / 2, 0] },
  { partId: "ST-bearing", pos: [0.24, 0.138, 0.21], rot: [0, 0, 0] },
  { partId: "ST-bearing", pos: [0.24, 0.138, -0.21], rot: [0, 0, 0] },
  { partId: "ST-guide", pos: [0.24, 0.138, 0], rot: [0, 0, 0], scale: 1.3 },
  { partId: "M-01", pos: [0.20, 0.138, 0.155], rot: [Math.PI / 2, 0, 0] },
  { partId: "ST-motor", pos: [0.20, 0.10, 0.155], rot: [0, 0, 0] },
  { partId: "PU-01", pos: [0.20, 0.138, 0.19], rot: [0, 0, 0] },
  { partId: "PU-02", pos: [0.24, 0.138, 0.198], rot: [0, 0, 0] },
  { partId: "BL-01", pos: [0.22, 0.138, 0.19], rot: [0, 0, 0] },
  { partId: "PU-04", pos: [0.22, 0.155, 0.18], rot: [0, 0, Math.PI / 2] },
  { partId: "ST-finger", pos: [0.29, 0.075, 0], rot: [0, 0, 0], scale: 1.4 },

  // ── M3 导流上装（挂车架，不随滑轨）──
  // 立柱沿Y：x=0.21，z=±0.18，y 中心 0.22（0.17→0.27）
  { partId: "E-05", pos: [0.21, 0.32, 0.18], rot: [Math.PI / 2, 0, 0] },
  { partId: "E-05", pos: [0.21, 0.32, -0.18], rot: [Math.PI / 2, 0, 0] },
  { partId: "E-05B", pos: [0.21, 0.20, 0.10], rot: [Math.PI / 2, 0, 0] },
  { partId: "E-05B", pos: [0.21, 0.20, -0.10], rot: [Math.PI / 2, 0, 0] },
  { partId: "E-06", pos: [0.21, 0.52, 0], rot: [0, 0, 0] },
  { partId: "E-06B", pos: [0.21, 0.27, 0], rot: [0, 0, 0] },
  // 挡板：工作面中点约 (118, 460)mm，倾角约 60°
  { partId: "PL-03", pos: [0.118, 0.46, 0], rot: [0, 0, Math.atan2(0.12, -0.065)], scale: 2 },
  { partId: "PL-04", pos: [0.24, 0.255, 0], rot: [0, 0, 0], scale: 1.5 },

  // ── M4 球筐（内腔 360×420×160，模型半尺寸 scale2）──
  // 定位轨沿X，z=±0.21，y=平台顶
  { partId: "E-08", pos: [-0.12, 0.172, 0.21], rot: [0, Math.PI / 2, 0] },
  { partId: "E-08", pos: [-0.12, 0.172, -0.21], rot: [0, Math.PI / 2, 0] },
  { partId: "ST-basket", pos: [-0.12, 0.17, 0], rot: [0, 0, 0] },
  // 四角角件（高160，中心在筐半高）
  { partId: "ST-corner", pos: [-0.29, 0.25, 0.20], rot: [0, 0, 0] },
  { partId: "ST-corner", pos: [-0.29, 0.25, -0.20], rot: [0, 0, 0] },
  { partId: "ST-corner", pos: [0.05, 0.25, 0.20], rot: [0, 0, 0] },
  { partId: "ST-corner", pos: [0.05, 0.25, -0.20], rot: [0, 0, 0] },

  // ── M5 行走轮系 ──
  // 轮心 y=0.05，轴线沿Z
  { partId: "WH-01", pos: [-0.28, 0.05, 0.215], rot: [0, 0, 0] },
  { partId: "WH-01", pos: [-0.28, 0.05, -0.215], rot: [0, 0, 0] },
  { partId: "WH-01", pos: [0.04, 0.05, 0.215], rot: [0, 0, 0] },
  { partId: "WH-01", pos: [0.04, 0.05, -0.215], rot: [0, 0, 0] },
  { partId: "SH-02", pos: [-0.28, 0.05, 0], rot: [0, 0, 0] },
  { partId: "BR-02", pos: [-0.28, 0.05, 0.12], rot: [0, 0, 0] },
  { partId: "BR-02", pos: [-0.28, 0.05, -0.12], rot: [0, 0, 0] },
  { partId: "PU-03", pos: [-0.28, 0.05, 0.02], rot: [0, 0, 0] },
  { partId: "M-02", pos: [-0.23, 0.09, 0.09], rot: [Math.PI / 2, 0, 0] },
  { partId: "ST-motor", pos: [-0.23, 0.06, 0.09], rot: [0, 0, 0] },
  { partId: "BL-02", pos: [-0.255, 0.07, 0.06], rot: [0, 0, 0] },
  { partId: "ST-wheel", pos: [-0.28, 0.05, 0.24], rot: [0, 0, 0] },
  { partId: "ST-wheel", pos: [-0.28, 0.05, -0.24], rot: [0, 0, 0] },
  // 前转向：舵机中置梁下
  { partId: "ST-servo", pos: [0.05, 0.008, 0], rot: [0, 0, 0] },
  { partId: "S-01", pos: [0.05, 0.018, 0], rot: [0, 0, 0] },
  // 转向节：主销竖直，轮轴位 y≈0.07
  { partId: "ST-knuckle", pos: [0.04, 0.055, 0.195], rot: [0, 0, 0] },
  { partId: "ST-knuckle", pos: [0.04, 0.055, -0.195], rot: [0, 0, 0] },
  // 主销竖直：轴模型原沿Z，rot X→竖直
  { partId: "SH-03", pos: [0.04, 0.10, 0.195], rot: [Math.PI / 2, 0, 0] },
  { partId: "SH-03", pos: [0.04, 0.10, -0.195], rot: [Math.PI / 2, 0, 0] },
  // 横拉杆沿Z
  { partId: "ACC-LINK", pos: [0.04, 0.09, 0], rot: [0, Math.PI / 2, 0] },

  // ── M6 电控（后舱内，|z|≤0.055）──
  { partId: "ST-ecu", pos: [-0.16, 0.06, 0], rot: [0, 0, 0], scale: 1.3 },
  { partId: "ST-lid", pos: [-0.16, 0.095, 0], rot: [0, 0, 0], scale: 1.3 },
  { partId: "U-02", pos: [-0.16, 0.075, -0.02], rot: [0, 0, 0] },
  { partId: "U-01", pos: [-0.16, 0.085, 0.02], rot: [0, 0, 0] },
  { partId: "U-05", pos: [-0.21, 0.055, 0.04], rot: [0, 0, 0] },
  { partId: "U-08", pos: [-0.22, 0.055, 0], rot: [0, 0, 0], scale: 1.2 },
  { partId: "W-06", pos: [-0.18, 0.055, -0.06], rot: [0, 0, 0] },

  // ── M7 传感（横梁正中 + 前脸）──
  { partId: "ST-cam", pos: [0.21, 0.295, 0], rot: [0, 0, 0] },
  { partId: "U-03", pos: [0.225, 0.315, 0], rot: [0, 0, 0] },
  { partId: "ST-tof", pos: [0.21, 0.278, 0.02], rot: [0, 0, 0] },
  { partId: "U-04", pos: [0.215, 0.278, 0.02], rot: [0, 0, 0] },
  { partId: "ST-tof", pos: [0.25, 0.12, 0.16], rot: [0, 0.5, 0] },
  { partId: "ST-tof", pos: [0.25, 0.12, -0.16], rot: [0, -0.5, 0] },
];

// 装配连接场景（保留原逻辑）
const assemblies = [
  {
    id: "asm-corner",
    name: "型材 90° 角件连接",
    method: "T螺母滑入槽 → 角件贴合 → M5×12锁紧",
    host: "E-01",
    guest: "E-02",
    connectors: [
      { id: "F-04", offset: [0, 0, 0], axis: "z", travel: 0.04, label: "T螺母滑入槽" },
      { id: "ACC-CORNER", offset: [0.012, 0.012, 0], axis: "y", travel: 0.035, label: "角件贴合" },
      { id: "F-03", offset: [0.022, 0.012, 0.028], axis: "z", travel: 0.04, label: "M5×12旋紧" },
      { id: "F-01", offset: [0.022, 0.028, 0], axis: "y", travel: 0.035, label: "M5×10锁槽" },
    ],
    steps: ["① T螺母尖角朝内滑入槽对孔", "② 角件两翼贴合型材", "③ M5×12对角交替拧紧", "④ 长梁跨度大时加中间角件"],
  },
  {
    id: "asm-roller",
    name: "滚轮轴系总成",
    method: "轴穿TPU套与端盖轴承 → 轴承入座 → 轴端挡圈/M6",
    host: "SH-01",
    guest: "ST-tpu",
    connectors: [
      { id: "ST-endcap", offset: [0, 0, 0.16], axis: "z", travel: 0.05, label: "端盖" },
      { id: "BR-01", offset: [0, 0, 0.19], axis: "z", travel: 0.04, label: "608轴承" },
      { id: "ST-bearing", offset: [0, 0, 0.21], axis: "z", travel: 0.05, label: "轴承座" },
      { id: "F-14", offset: [0, 0, 0.24], axis: "z", travel: 0.03, label: "轴用挡圈" },
    ],
    steps: ["① TPU套入铝管芯", "② 端盖热熔M4压608", "③ 轴穿套与轴承落滑轨座", "④ 挡圈+M6防松；带轮顶丝"],
  },
  {
    id: "asm-steer",
    name: "前轮转向节",
    method: "主销穿转向节 → 球头拉杆连舵机臂 → 轮轴装608",
    host: "ST-knuckle",
    guest: "SH-03",
    connectors: [
      { id: "BR-01", offset: [0.02, 0, 0], axis: "x", travel: 0.03, label: "轮轴608" },
      { id: "S-01", offset: [-0.04, 0.02, 0], axis: "x", travel: 0.04, label: "舵机+臂" },
      { id: "ACC-LINK", offset: [0, 0.03, 0], axis: "z", travel: 0.04, label: "横拉杆" },
    ],
    steps: ["① 主销孔铰Ø8穿SH-03", "② 轮轴压608装Ø100轮", "③ MG996R装座臂连横拉杆", "④ ±30°试转不刮轮拱"],
  },
  {
    id: "asm-basket",
    name: "球筐快拆",
    method: "角件装筐 → 沿定位轨滑入 → 弹簧插销锁定",
    host: "ST-basket",
    guest: "E-08",
    connectors: [{ id: "F-17", offset: [0, 0, 0.04], axis: "z", travel: 0.05, label: "弹簧插销" }],
    steps: ["① 8个角件固定筐四角", "② 沿E-08推入平台顶", "③ 两侧弹簧插销锁定", "④ 取筐拉环拔出后提"],
  },
];

const out = path.join(__dirname, "bom-data.js");
const header = `/* KIT-TBR-01 BOM · E1.3g · 坐标 X前 Y上 Z右；原点=后轮轴投影 */\n`;
const body =
  header +
  "window.BOM = " +
  JSON.stringify(
    {
      meta: { kit: "KIT-TBR-01", version: "E1.3g", name: "网球自动捡球机器人" },
      audit: [
        { level: "ok", msg: "型材 E-01~E-08 与 §2.2 一致" },
        { level: "ok", msg: "E1.3g：平台顶125/包高90 · 电池15Ah弹仓 · 弧板底缘y=35 · 滚轮450RPM" },
        { level: "ok", msg: "轮距430、后驱单电机通轴、前轮中置舵机" },
        { level: "ok", msg: "挡板梁y=520（E-05×395）· 相机梁y=270（E-05B×145）" },
        { level: "ok", msg: "无刷×2；带轮20T:20T；主保险25–40A；信标回家standoff≥35cm" },
        { level: "fix", msg: "E-08 改为沿X安装、限制筐Z向" },
        { level: "fix", msg: "补 WH-01/AL-01/PL-04/ACC-LINK/PU-04/ST-basket" },
        { level: "fix", msg: "E-01 拆分：E-01×2 全长主梁 + E-01B×2 底框短梁" },
        { level: "fix", msg: "补官方清单缺失件：端盖/F-06/F-10/F-18~21/BR-03/SH-04/U-06~13/W-01~05/W-08~11" },
        { level: "warn", msg: "PL-03 斜长按端点≈137mm，外形以钣金图为准" },
        { level: "warn", msg: "F-09 列24含电机座+舵机/盖；仅电机座可减到16" },
        { level: "warn", msg: "ST-tpu 宽352 vs 有效360，装配校核余量" },
        { level: "warn", msg: "3D 不画满紧固件实例（如螺钉×40），左侧×N以采购清单为准" },
        { level: "ok", msg: "3D 无「有几何但清单没有」的部件" },
      ],
      modules: [
        { id: "M1", name: "车架总成", color: "#2b2e33", explode: [0, -0.22, 0] },
        { id: "M2", name: "滚轮收集", color: "#e85d04", explode: [0, 0.3, 0] },
        { id: "M3", name: "导流上装", color: "#c8ccd2", explode: [0, 0.46, 0] },
        { id: "M4", name: "球筐", color: "#f0c040", explode: [-0.26, 0.36, 0] },
        { id: "M5", name: "行走轮系", color: "#3a3c40", explode: [0, -0.16, 0.2] },
        { id: "M6", name: "电控电源", color: "#22d866", explode: [-0.2, 0.1, 0] },
        { id: "M7", name: "传感安全", color: "#0c2840", explode: [0.2, 0.18, 0] },
      ],
      categories: [
        { id: "extrusion", name: "铝型材 2020", color: "#3d4450" },
        { id: "sheet", name: "钣金 / 铝板", color: "#8a9098" },
        { id: "motor", name: "电机 / 舵机", color: "#1a1c20" },
        { id: "drive", name: "轴承 / 轴 / 传动", color: "#6a7078" },
        { id: "print", name: "3D 打印件", color: "#c8ccd2" },
        { id: "fastener", name: "紧固件 / 连接件", color: "#e85d04" },
        { id: "elec", name: "电子模块", color: "#22d866" },
        { id: "wire", name: "线材接插件", color: "#b8d84a" },
        { id: "other", name: "外购件", color: "#8899aa" },
      ],
      parts,
      placements,
      assemblies,
    },
    null,
    0
  ) +
  ";\n";

fs.writeFileSync(out, body, "utf8");
console.log("wrote", out, "parts", parts.length, "placements", placements.length);
