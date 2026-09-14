# -*- coding: utf-8 -*-
"""
网球自动捡球机器人 — 一体箱 + 前部左右轴滚轮

结构（参考实机）:
  整机就是一个箱体，开口朝上
  前脸下方贴地进料口
  口内是水平滚轮，轴线左右向（Y）
  车前进，球被顶到滚轮 → 随轮向上向后带
  后方导流板把球送入箱体内腔（与滚轮同一箱体）
  球从上方落入内腔堆积
  回起点后翻后门卸球

关键：滚轮和储球在同一箱体内，没有隔墙挡球。

Blender（Z-up）→ Scripting → Run Script
+X 前，+Y 左，+Z 上，单位米
"""

import bpy, math

def clean():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for b in (bpy.data.meshes, bpy.data.materials):
        for i in list(b):
            if i.users == 0: b.remove(i)

def mat(name, rgb, metal=0.0, rough=0.5):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    n = m.node_tree.nodes.get("Principled BSDF")
    n.inputs["Base Color"].default_value = (*rgb, 1)
    n.inputs["Metallic"].default_value = metal
    n.inputs["Roughness"].default_value = rough
    return m

def cube(name, sx, sy, sz, loc, m, bevel=0.008, rot=(0,0,0), segs=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name
    o.scale = (sx/2, sy/2, sz/2)
    bpy.ops.object.transform_apply(scale=True)
    if bevel > 0:
        b = o.modifiers.new("B", "BEVEL"); b.width = bevel; b.segments = segs
        b.limit_method = "ANGLE"
    o.data.materials.append(m)
    return o

def cyl(name, r, h, loc, m, rot=(0,0,0), verts=48, bevel=0.003):
    """Blender: 圆柱默认轴 Z。rot=(90°,0,0) 后轴沿 Y（左右向）。"""
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name
    if bevel > 0:
        b = o.modifiers.new("B", "BEVEL"); b.width = bevel; b.segments = 2; b.limit_method = "ANGLE"
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    return o

def sph(name, r, loc, m):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=22, ring_count=12, location=loc)
    o = bpy.context.active_object; o.name = name
    bpy.ops.object.shade_smooth(); o.data.materials.append(m); return o

def cut(target, cutter):
    md = target.modifiers.new("Cut", "BOOLEAN"); md.operation = "DIFFERENCE"; md.object = cutter
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    return target

def par(ch, p):
    ch.parent = p; ch.matrix_parent_inverse = p.matrix_world.inverted()

# ── 尺寸（一体箱）─────────────────────────────────────
# 箱体外廓
BODY_X0, BODY_L = -0.30, 0.56        # x 后端 → 长 56
BODY_W, BODY_H = 0.46, 0.38          # 宽 46 高 38
BODY_Z = 0.08                        # 底面离地（给轮留空）
BODY_TOP = BODY_Z + BODY_H           # 0.46
BODY_CX = BODY_X0 + BODY_L / 2

# 前贴地进料口
MOUTH_W, MOUTH_H, MOUTH_Z = 0.38, 0.10, 0.045

# ★ 滚轮：轴线沿 Y（左右），装在箱内前下方
ROLL_D = 0.13                        # Ø13
ROLL_L = 0.34
ROLL_X = 0.18                        # 箱内前部
ROLL_Z = 0.06                        # 轴心高 6cm，底缘贴地
FIN_N = 8
FIN_H = 0.016

# 导流板：滚轮后上方，把球送进内腔并防回弹
DEF_ANG = math.radians(35)

# 内腔（滚轮后方+上方，同一箱体）
# 箱体内部就是储球空间，滚轮占前下角
# 后翻门
DOOR_H = 0.28

# 轮
WR, WW = 0.075, 0.05
WY = BODY_W / 2 - 0.025
WX_REAR, WX_FRONT = -0.16, 0.16
CR = 0.04

# 摄像头
MX, MH, MZ = 0.22, 0.10, BODY_TOP


def build():
    clean()

    m_shell = mat("Shell",   (0.82, 0.83, 0.85), 0.05, 0.42)   # 浅色一体壳
    m_dark  = mat("Dark",    (0.16, 0.17, 0.19), 0.2,  0.45)
    m_roll  = mat("Roller",  (0.18, 0.18, 0.20), 0.1,  0.75)
    m_fin   = mat("Fin",     (0.90, 0.45, 0.08), 0.0,  0.55)
    m_rub   = mat("Rubber",  (0.04, 0.04, 0.04), 0.0,  0.9)
    m_metal = mat("Metal",   (0.58, 0.60, 0.63), 0.85, 0.30)
    m_hole  = mat("Intake",  (0.05, 0.05, 0.06), 0.0,  0.88)
    m_mesh  = mat("Mesh",    (0.55, 0.58, 0.60), 0.65, 0.35)
    m_def   = mat("Deflector",(0.40, 0.42, 0.45), 0.4,  0.40)
    m_ball  = mat("Ball",    (0.72, 0.86, 0.22), 0.0,  0.62)
    m_white = mat("White",   (0.90, 0.90, 0.90), 0.0,  0.40)
    m_glass = mat("Glass",   (0.05, 0.12, 0.18), 0.3,  0.10)
    m_led   = mat("LED",     (0.2, 0.9, 0.4),   0.0,  0.25)
    m_frame = mat("Frame",   (0.22, 0.24, 0.27), 0.4,  0.45)

    root = bpy.data.objects.new("Robot", None)
    bpy.context.collection.objects.link(root)

    # ══════════════════════════════════════════
    # 1. 一体箱壳（前后左右+底，顶敞开）
    # ══════════════════════════════════════════
    t = 0.014
    bz = BODY_Z + BODY_H / 2
    # 底板
    cube("BodyFloor", BODY_L, t, BODY_W, (BODY_CX, BODY_Z + t/2, 0), m_shell, 0.006)
    # 后壁
    cube("BodyBack", t, BODY_H, BODY_W, (BODY_X0 + t/2, bz, 0), m_shell, 0.010)
    # 左右侧壁
    for sy in (1, -1):
        cube(f"BodySide{sy}", BODY_L, BODY_H, t,
             (BODY_CX, bz, sy * (BODY_W/2 - t/2)), m_shell, 0.010)
        # 观察窗
        cube(f"WinF{sy}", BODY_L * 0.50, 0.012, 0.018,
             (BODY_CX - 0.02, bz + 0.06, sy * (BODY_W/2 + 0.003)), m_frame, 0.003)
        cube(f"Win{sy}", BODY_L * 0.46, BODY_H * 0.42, 0.006,
             (BODY_CX - 0.02, bz + 0.01, sy * (BODY_W/2 + 0.005)), m_mesh, 0.002)

    # 前壁：下半留进料口，上半完整
    # 上半前壁（进料口之上）
    up_h = BODY_H - MOUTH_H - 0.02
    cube("BodyFrontUp", t, up_h, BODY_W,
         (BODY_X0 + BODY_L - t/2, MOUTH_Z + MOUTH_H/2 + up_h/2 + 0.01, 0),
         m_shell, 0.008)
    # 前壁两侧（口两侧的小立柱，把口夹出来）
    for sy in (1, -1):
        side_w = (BODY_W - MOUTH_W) / 2
        cube(f"BodyFrontSide{sy}", t, MOUTH_H + 0.02, side_w,
             (BODY_X0 + BODY_L - t/2, MOUTH_Z + 0.005, sy * (MOUTH_W/2 + side_w/2)),
             m_shell, 0.006)

    # 前唇橡胶
    cube("Lip", 0.028, 0.026, MOUTH_W + 0.01,
         (BODY_X0 + BODY_L + 0.006, 0.020, 0), m_rub, 0.004)
    # 口内衬
    cube("Liner", 0.06, MOUTH_H - 0.008, MOUTH_W - 0.012,
         (BODY_X0 + BODY_L - 0.035, MOUTH_Z, 0), m_hole, 0.002)

    # 顶沿
    for sy in (1, -1):
        cube(f"TopRail{sy}", BODY_L - 0.01, 0.016, 0.02,
             (BODY_CX, BODY_TOP - 0.005, sy * (BODY_W/2 - 0.01)), m_frame, 0.003)
    cube("TopRailF", 0.02, 0.016, BODY_W - 0.02,
         (BODY_X0 + BODY_L - 0.01, BODY_TOP - 0.005, 0), m_frame, 0.003)
    cube("TopRailB", 0.02, 0.016, BODY_W - 0.02,
         (BODY_X0 + 0.01, BODY_TOP - 0.005, 0), m_frame, 0.003)

    # 后翻门
    door = cube("DumpDoor", t, DOOR_H, BODY_W - 0.02,
                (BODY_X0 + t/2, BODY_Z + DOOR_H/2, 0), m_shell, 0.006)
    cyl("DoorHinge", 0.012, BODY_W - 0.05, (BODY_X0 + t/2, BODY_Z + DOOR_H, 0),
        m_metal, rot=(math.radians(90), 0, 0), bevel=0.001)
    cube("DoorHandle", 0.025, 0.02, 0.07, (BODY_X0 - 0.015, BODY_Z + 0.06, 0), m_rub, 0.005)
    cyl("DumpMotor", 0.022, 0.045,
        (BODY_X0 - 0.02, BODY_Z + DOOR_H - 0.02, BODY_W/2 - 0.035),
        m_metal, rot=(0, math.radians(90), 0), bevel=0.002)

    # 防撞胶条
    for sy in (1, -1):
        cube(f"BumpS{sy}", BODY_L * 0.7, 0.032, 0.022,
             (BODY_CX - 0.02, BODY_Z + 0.03, sy * (BODY_W/2 + 0.008)), m_rub, 0.006)
    cube("BumpR", 0.022, 0.035, BODY_W + 0.006,
         (BODY_X0 - 0.004, BODY_Z + 0.035, 0), m_rub, 0.006)

    # 状态灯
    cube("LED", 0.07, 0.01, 0.022,
         (BODY_X0 + BODY_L - 0.02, BODY_Z + BODY_H - 0.02, 0), m_led, 0.003)

    par(door, root)

    # ══════════════════════════════════════════
    # 2. ★ 滚轮 —— 轴线沿 Y（左右向）
    #    Blender 圆柱默认轴 Z，rot X+90° 后轴沿 Y
    # ══════════════════════════════════════════
    roller = cyl("PickupRoller", ROLL_D/2, ROLL_L,
                 (ROLL_X, 0, ROLL_Z), m_roll,
                 rot=(math.radians(90), 0, 0), verts=64, bevel=0.003)
    # 芯轴（同样左右向）
    cyl("RollerShaft", 0.016, ROLL_L + 0.05,
        (ROLL_X, 0, ROLL_Z), m_metal,
        rot=(math.radians(90), 0, 0), bevel=0.002)
    # 环向桨叶
    for i in range(FIN_N):
        ang = i * (2 * math.pi / FIN_N)
        fx = ROLL_X + (ROLL_D/2 + FIN_H/2) * math.cos(ang)
        fz = ROLL_Z + (ROLL_D/2 + FIN_H/2) * math.sin(ang)
        # 薄片沿滚轮周向，长度沿 Y
        cube(f"Fin{i}", 0.010, ROLL_L - 0.04, FIN_H,
             (fx, 0, fz), m_fin, 0.002, rot=(0, -ang, 0))
    # 端挡环
    for sy in (1, -1):
        cyl(f"RollEnd{sy}", ROLL_D/2 + 0.003, 0.018,
            (ROLL_X, sy * (ROLL_L/2 + 0.008), ROLL_Z), m_fin,
            rot=(math.radians(90), 0, 0), verts=48, bevel=0.001)
    # 电机（右端外侧，轴沿 Y）
    cyl("RollerMotor", 0.026, 0.05,
        (ROLL_X, ROLL_L/2 + 0.05, ROLL_Z), m_metal,
        rot=(math.radians(90), 0, 0), bevel=0.002)

    # 导流板：滚轮后上方，球被抛上后沿板滑入内腔
    cube("Deflector", 0.16, 0.012, ROLL_L - 0.02,
         (ROLL_X - ROLL_D/2 - 0.05, ROLL_Z + 0.10, 0),
         m_def, 0.003, rot=(0, DEF_ANG, 0))
    # 导流板侧挡
    for sy in (1, -1):
        cube(f"DefSide{sy}", 0.16, 0.05, 0.010,
             (ROLL_X - ROLL_D/2 - 0.05, ROLL_Z + 0.12, sy * (ROLL_L/2 + 0.004)),
             m_frame, 0.002, rot=(0, DEF_ANG, 0))

    par(roller, root)

    # ══════════════════════════════════════════
    # 3. 内腔球（滚轮后方+上方堆积）
    # ══════════════════════════════════════════
    br = 0.0335
    # 滚轮后方地板上的球
    for ix in range(4):
        for iy in range(4):
            sph(f"a{ix}{iy}", br,
                (BODY_X0 + 0.10 + ix * 0.08, 0, -0.12 + iy * 0.08), m_ball)
    # 中层
    for ix in range(3):
        for iy in range(3):
            sph(f"b{ix}{iy}", br,
                (BODY_X0 + 0.14 + ix * 0.08, 0, -0.08 + iy * 0.08), m_ball)
    # 上层
    for ix in range(3):
        sph(f"c{ix}", br, (BODY_X0 + 0.18 + ix * 0.09, 0, 0), m_ball)
    # 滚轮上示意
    sph("onRoll", br, (ROLL_X + 0.01, 0.05, ROLL_Z + ROLL_D/2 + br - 0.012), m_ball)
    # 地面散落
    for i, p in enumerate([(0.50, 0, 0.16), (0.56, 0, -0.14), (-0.48, 0, 0.20)]):
        sph(f"g{i}", br, p, m_ball)

    # ══════════════════════════════════════════
    # 4. 四轮（藏在箱下）
    # ══════════════════════════════════════════
    for tag, wx, sy in (("RL", WX_REAR, 1), ("RR", WX_REAR, -1)):
        w = cyl(f"Wheel{tag}", WR, WW, (wx, sy*WY, WR), m_rub,
                rot=(math.radians(90), 0, 0), verts=48, bevel=0.003)
        cyl(f"Hub{tag}", WR*0.38, WW + 0.005, (wx, sy*WY, WR), m_metal,
            rot=(math.radians(90), 0, 0), bevel=0.002)
        par(w, root)
    for tag, sy in (("FL", 1), ("FR", -1)):
        cyl(f"Caster{tag}", CR, 0.026, (WX_FRONT, sy*WY, CR), m_rub,
            rot=(math.radians(90), 0, 0), bevel=0.002)
        cube(f"CFork{tag}", 0.04, 0.032, 0.028, (WX_FRONT, sy*WY, CR + 0.016), m_metal, 0.003)

    # ══════════════════════════════════════════
    # 5. 摄像头 / AprilTag / 电池
    # ══════════════════════════════════════════
    cube("Mast", 0.028, MH, 0.028, (MX, 0, MZ + MH/2), m_frame, 0.005)
    cam = cube("Cam", 0.048, 0.038, 0.048, (MX + 0.01, 0, MZ + MH + 0.016), m_dark, 0.007)
    cube("Hood", 0.028, 0.01, 0.055, (MX + 0.032, 0, MZ + MH + 0.034), m_frame, 0.003)
    lens = cyl("Lens", 0.013, 0.015, (MX + 0.030, 0, MZ + MH + 0.016), m_glass,
               rot=(0, math.radians(90), 0), bevel=0.001)
    par(cam, root); par(lens, cam)
    for sy in (1, -1):
        cyl(f"ToF{sy}", 0.008, 0.011, (MX + 0.01, sy*0.026, MZ + MH + 0.016), m_metal,
            rot=(0, math.radians(90), 0), bevel=0.001)

    cube("TagBase", 0.035, 0.022, 0.035, (BODY_X0 + 0.03, 0, BODY_TOP + 0.012), m_frame, 0.004)
    cyl("TagPole", 0.007, 0.09, (BODY_X0 + 0.03, 0, BODY_TOP + 0.06), m_metal, bevel=0.001)
    cube("TagPlate", 0.009, 0.065, 0.065, (BODY_X0 + 0.03, 0, BODY_TOP + 0.12), m_white, 0.002)
    cube("TagMark", 0.005, 0.038, 0.038, (BODY_X0 + 0.036, 0, BODY_TOP + 0.12), m_dark, 0.001)

    cube("Battery", 0.16, 0.05, 0.12, (0.0, -(BODY_W/2 + 0.028), BODY_Z + 0.03), m_frame, 0.005)
    cube("BattTab", 0.035, 0.018, 0.025, (0.08, -(BODY_W/2 + 0.05), BODY_Z + 0.03), m_fin, 0.003)

    bpy.ops.object.select_all(action="DESELECT")
    for o in bpy.context.scene.objects:
        if o.type == "MESH": o.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))

    inner_v = BODY_L * BODY_W * BODY_H * 0.55   # 滚轮/机构占一部分
    print("=" * 52)
    print("一体箱 + 前部左右轴滚轮")
    print("=" * 52)
    print(f"箱体   {BODY_L*100:.0f}×{BODY_W*100:.0f}×{BODY_H*100:.0f}  顶敞开 一体")
    print(f"进料口 宽{MOUTH_W*100:.0f} 高{MOUTH_H*100:.0f} 中心{MOUTH_Z*100:.1f}")
    print(f"★滚轮  Ø{ROLL_D*100:.0f}×{ROLL_L*100:.0f}  轴线左右(Y)")
    print(f"       轴心({ROLL_X:.2f}, 0, {ROLL_Z:.2f})  底缘贴地")
    print(f"       桨叶×{FIN_N}  导流板在后上 {math.degrees(DEF_ANG):.0f}°")
    print(f"内腔   与滚轮同一箱体，无隔墙")
    print(f"容量   约 {int(inner_v*0.50/1.58e-4)} 球")
    print("=" * 52)
    print("路径: 前口进球→左右轴滚轮转上→导流板→内腔堆积→后翻门")


def setup():
    m_court = mat("Court", (0.18, 0.28, 0.38), 0, 0.88)
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0))
    bpy.context.active_object.data.materials.append(m_court)
    m_line = mat("Line", (0.88, 0.88, 0.88), 0, 0.55)
    for loc, size in (((0, 1.2, 0.001), (3.5, 0.05, 0.002)),
                      ((1.2, 0, 0.001), (0.05, 3.5, 0.002))):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        o = bpy.context.active_object
        o.scale = (size[0]/2, size[1]/2, size[2]/2)
        bpy.ops.object.transform_apply(scale=True)
        o.data.materials.append(m_line)

    bpy.ops.object.light_add(type="SUN", location=(3, -2, 6))
    s = bpy.context.active_object; s.data.energy = 3.5
    s.rotation_euler = (math.radians(40), math.radians(10), math.radians(28))
    bpy.ops.object.light_add(type="AREA", location=(-2.5, 2.2, 3.5))
    bpy.context.active_object.data.energy = 300
    bpy.context.active_object.data.size = 6

    bpy.ops.object.camera_add(location=(1.7, -1.4, 1.15))
    c = bpy.context.active_object
    c.rotation_euler = (math.radians(58), 0, math.radians(48))
    bpy.context.scene.camera = c

    w = bpy.context.scene.world
    if w is None:
        w = bpy.data.worlds.new("World"); bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.50, 0.66, 0.82, 1)
        bg.inputs[1].default_value = 0.55

if __name__ == "__main__":
    build(); setup(); print("[OK]")
