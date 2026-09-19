#!/usr/bin/env python3
"""KIT-TBR-01 打印件参数化生成器（无 Blender 依赖）
用法: python generate_stl.py
输出: stl/*.stl  单位 mm，二进制 STL
"""
from __future__ import annotations
import math
import struct
import os

OUT = os.path.join(os.path.dirname(__file__), "stl")
os.makedirs(OUT, exist_ok=True)


def tri_normal(a, b, c):
    ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
    vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
    nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
    L = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
    return (nx / L, ny / L, nz / L)


def write_stl(path, tris):
    with open(path, "wb") as f:
        f.write(b"KIT-TBR-01".ljust(80, b"\0"))
        f.write(struct.pack("<I", len(tris)))
        for a, b, c in tris:
            n = tri_normal(a, b, c)
            f.write(struct.pack("<3f", *n))
            f.write(struct.pack("<3f", *a))
            f.write(struct.pack("<3f", *b))
            f.write(struct.pack("<3f", *c))
            f.write(struct.pack("<H", 0))
    print(f"  wrote {path}  ({len(tris)} tris)")


def box(x0, y0, z0, x1, y1, z1):
    """Axis-aligned box as 12 triangles."""
    v = [
        (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
        (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
    ]
    faces = [
        (0, 1, 2), (0, 2, 3),  # bottom
        (4, 6, 5), (4, 7, 6),  # top
        (0, 4, 5), (0, 5, 1),  # y-
        (2, 6, 7), (2, 7, 3),  # y+
        (0, 3, 7), (0, 7, 4),  # x-
        (1, 5, 6), (1, 6, 2),  # x+
    ]
    return [(v[a], v[b], v[c]) for a, b, c in faces]


def cylinder(cx, cy, z0, z1, r, seg=32, cap=True):
    """Z-axis cylinder."""
    tris = []
    for i in range(seg):
        a0 = 2 * math.pi * i / seg
        a1 = 2 * math.pi * (i + 1) / seg
        x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
        x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        # side
        tris.append(((x0, y0, z0), (x1, y1, z0), (x1, y1, z1)))
        tris.append(((x0, y0, z0), (x1, y1, z1), (x0, y0, z1)))
        if cap:
            tris.append(((cx, cy, z0), (x1, y1, z0), (x0, y0, z0)))
            tris.append(((cx, cy, z1), (x0, y0, z1), (x1, y1, z1)))
    return tris


def tube(cx, cy, z0, z1, r_out, r_in, seg=32):
    """Hollow tube along Z."""
    tris = []
    for i in range(seg):
        a0 = 2 * math.pi * i / seg
        a1 = 2 * math.pi * (i + 1) / seg
        ox0, oy0 = cx + r_out * math.cos(a0), cy + r_out * math.sin(a0)
        ox1, oy1 = cx + r_out * math.cos(a1), cy + r_out * math.sin(a1)
        ix0, iy0 = cx + r_in * math.cos(a0), cy + r_in * math.sin(a0)
        ix1, iy1 = cx + r_in * math.cos(a1), cy + r_in * math.sin(a1)
        # outer wall
        tris.append(((ox0, oy0, z0), (ox1, oy1, z0), (ox1, oy1, z1)))
        tris.append(((ox0, oy0, z0), (ox1, oy1, z1), (ox0, oy0, z1)))
        # inner wall
        tris.append(((ix0, iy0, z0), (ix1, iy1, z0), (ix0, iy0, z1)))
        tris.append(((ix0, iy0, z1), (ix1, iy1, z0), (ix1, iy1, z1)))
        # top ring
        tris.append(((ox0, oy0, z1), (ix0, iy0, z1), (ix1, iy1, z1)))
        tris.append(((ox0, oy0, z1), (ix1, iy1, z1), (ox1, oy1, z1)))
        # bottom ring
        tris.append(((ox0, oy0, z0), (ix1, iy1, z0), (ix0, iy0, z0)))
        tris.append(((ox0, oy0, z0), (ox1, oy1, z0), (ix1, iy1, z0)))
    return tris


def merge(*parts):
    out = []
    for p in parts:
        out.extend(p)
    return out


# ── 零件定义（尺寸与 engineering-design.md 一致，单位 mm）──

def part_bearing_housing_608():
    """608-2RS 法兰轴承座：外圈 Ø22，座体 44×44×16，安装孔 M4"""
    body = box(-22, -22, 0, 22, 22, 16)
    boss = tube(0, 0, 0, 20, 14, 11)  # 轴承孔 Ø22 → r=11，凸台
    flange_holes = []
    for sx, sy in [(-16, -16), (16, -16), (-16, 16), (16, 16)]:
        flange_holes.extend(cylinder(sx, sy, -1, 17, 2.2, 12, cap=False))
    # 简化：不布尔减孔，切片软件可后续打孔；打印后钻 M4
    return merge(body, boss)


def part_motor_mount_jgb37():
    """JGB37-520 法兰座：电机 Ø37，耳距约 31mm，L 支架"""
    base = box(-28, -18, 0, 28, 18, 4)
    upright = box(-28, -18, 4, -20, 18, 40)
    # 电机抱箍环（开口）
    ring = tube(0, 0, 8, 36, 20, 18.5)
    # 安装耳
    ear1 = box(-18, -22, 10, 18, -16, 14)
    ear2 = box(-18, 16, 10, 18, 22, 14)
    return merge(base, upright, ring, ear1, ear2)


def part_servo_mount_mg996():
    """MG996R 舵机座：舵机体 40.5×20×40.5，安装耳"""
    # 底板
    base = box(-30, -16, 0, 30, 16, 3)
    # 侧墙夹持
    left = box(-30, -16, 3, -24, 16, 28)
    right = box(24, -16, 3, 30, 16, 28)
    # 舵机槽示意（实体中间留空用两墙表达）
    back = box(-24, 12, 3, 24, 16, 28)
    # 耳孔座
    tab = box(-24, -20, 20, 24, -16, 26)
    return merge(base, left, right, back, tab)


def part_steering_knuckle():
    """前轮转向节：主销 Ø8，轮轴 Ø12，转向臂"""
    upright = box(-8, -6, 0, 8, 6, 50)
    # 轮轴座
    hub = cylinder(0, 0, 18, 32, 8, 20)
    hub_bore = tube(0, 0, 18, 32, 8, 6, 20)
    # 转向臂（向内）
    arm = box(-6, 6, 40, 6, 34, 48)
    arm_end = cylinder(0, 32, 40, 48, 5, 12)
    # 主销套
    king = tube(0, 0, 0, 55, 6, 4.2, 16)
    return merge(upright, hub, hub_bore, arm, arm_end, king)


def part_wheel_cover():
    """Ø100 轮半罩"""
    # 简化：拱形板 + 侧挡
    plate = box(-50, -22, 0, 50, 22, 2)
    lip_l = box(-50, -22, 0, 50, -18, 28)
    lip_r = box(-50, 18, 0, 50, 22, 28)
    return merge(plate, lip_l, lip_r)


def part_camera_bracket():
    """摄像头支架：夹 2020，俯仰槽"""
    clamp = box(-12, -12, 0, 12, 12, 20)
    clamp_bore = tube(0, 0, -1, 21, 11.5, 10.5, 16)
    arm = box(-6, 12, 8, 6, 40, 14)
    cam_plate = box(-14, 36, 8, 14, 50, 12)
    return merge(clamp, clamp_bore, arm, cam_plate)


def part_tof_bracket():
    """VL53L1X 支架"""
    base = box(-10, -8, 0, 10, 8, 3)
    wall = box(-10, 4, 3, 10, 8, 22)
    sensor_slot = box(-6, 5, 10, 6, 8, 18)
    return merge(base, wall)


def part_ecu_box():
    """电控密封舱盒体 110×60×48 外形"""
    # 五面盒（开口向上）
    floor = box(-55, -30, 0, 55, 30, 3)
    w1 = box(-55, -30, 0, 55, -27, 48)
    w2 = box(-55, 27, 0, 55, 30, 48)
    w3 = box(-55, -30, 0, -52, 30, 48)
    w4 = box(52, -30, 0, 55, 30, 48)
    # 密封槽
    groove = box(-50, -25, 45, 50, 25, 48)
    return merge(floor, w1, w2, w3, w4)


def part_ecu_lid():
    """电控舱盖 114×52×6"""
    lid = box(-57, -26, 0, 57, 26, 5)
    lip = box(-52, -22, -3, 52, 22, 0)
    return merge(lid, lip)


def part_finger_guard():
    """滚轮护指条 330×10×12"""
    return box(-165, -5, 0, 165, 5, 12)


def part_basket_corner():
    """筐角件 L 型"""
    a = box(0, 0, 0, 22, 4, 160)
    b = box(0, 0, 0, 4, 22, 160)
    return merge(a, b)


def part_roller_endcap():
    """滚轮端盖：含 608 轴承位"""
    disc = cylinder(0, 0, 0, 12, 28, 36)
    lip = tube(0, 0, 12, 18, 28, 24, 36)
    bore = tube(0, 0, -1, 13, 11.2, 8, 24)
    return merge(disc, lip, bore)


def part_guide_arc_segment():
    """弧道一段：R135 外，宽 400，厚 3+侧壁 60，弧心角 ~12°"""
    # 用弦近似：分段小块
    segs = 8
    R_mid = 132.0  # 中面半径
    ang = math.radians(12.0)
    half_w = 200.0
    tris = []
    for i in range(segs):
        a0 = -ang / 2 + ang * i / segs
        a1 = -ang / 2 + ang * (i + 1) / segs
        # 底板块
        x0, y0 = R_mid * math.cos(a0), R_mid * math.sin(a0)
        x1, y1 = R_mid * math.cos(a1), R_mid * math.sin(a1)
        # 矩形近似段
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        seg_len = R_mid * ang / segs * 1.15
        tris.extend(box(cx - seg_len / 2, cy - half_w, 0,
                        cx + seg_len / 2, cy + half_w, 3))
        # 侧壁
        tris.extend(box(cx - seg_len / 2, -half_w - 3, 0,
                        cx + seg_len / 2, -half_w, 60))
        tris.extend(box(cx - seg_len / 2, half_w, 0,
                        cx + seg_len / 2, half_w + 3, 60))
    return tris


def part_tpu_roller_sleeve():
    """TPU 滚轮套 E1.3c：套筒 Ø140/Ø120 + 筋高 6 → 筋尖 Ø152
    高度链以筋尖为测量基准；与铝管芯 Ø120 过盈。
    """
    # 主套筒 r_out=70, r_in=60 → 外Ø140 内Ø120
    sleeve = tube(0, 0, -176, 176, 70, 60, 48)
    # 螺旋筋（简化为环状凸起 ×6，打印后可打磨成螺旋）
    ribs = []
    for k in range(6):
        z = -150 + k * 60
        ribs.extend(tube(0, 0, z, z + 8, 76, 69, 36))
    return merge(sleeve, ribs)


PARTS = {
    "bearing_housing_608": part_bearing_housing_608,
    "motor_mount_jgb37": part_motor_mount_jgb37,
    "servo_mount_mg996": part_servo_mount_mg996,
    "steering_knuckle": part_steering_knuckle,
    "wheel_cover": part_wheel_cover,
    "camera_bracket": part_camera_bracket,
    "tof_bracket": part_tof_bracket,
    "ecu_box": part_ecu_box,
    "ecu_lid": part_ecu_lid,
    "finger_guard": part_finger_guard,
    "basket_corner": part_basket_corner,
    "roller_endcap": part_roller_endcap,
    "guide_arc_segment": part_guide_arc_segment,
    "tpu_roller_sleeve": part_tpu_roller_sleeve,
}

# 打印数量（与 BOM 对齐）
QTY = {
    "bearing_housing_608": 4,   # 滚轮2 + 后轴带座可另购，打印备用2
    "motor_mount_jgb37": 2,     # 滚轮 + 后驱
    "servo_mount_mg996": 1,
    "steering_knuckle": 2,
    "wheel_cover": 4,
    "camera_bracket": 1,
    "tof_bracket": 3,
    "ecu_box": 1,
    "ecu_lid": 1,
    "finger_guard": 1,
    "basket_corner": 8,
    "roller_endcap": 2,
    "guide_arc_segment": 4,
    "tpu_roller_sleeve": 1,
}


def main():
    print("生成 KIT-TBR-01 打印件 STL →", OUT)
    for name, fn in PARTS.items():
        tris = fn()
        path = os.path.join(OUT, f"{name}.stl")
        write_stl(path, tris)
        print(f"    建议打印数量: {QTY[name]}")
    # 清单文件
    with open(os.path.join(OUT, "MANIFEST.txt"), "w", encoding="utf-8") as f:
        f.write("KIT-TBR-01 打印件清单 (mm)\n")
        f.write("生成脚本: generate_stl.py  （无需 Blender）\n")
        f.write("切片: Cura / PrusaSlicer / Bambu Studio 直接打开 STL\n\n")
        for name in PARTS:
            f.write(f"{name}.stl × {QTY[name]}\n")
    print("完成。切片软件直接打开 stl/ 即可。")


if __name__ == "__main__":
    main()
