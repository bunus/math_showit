#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
research/verify_presets.py

独立核验脚本：单位立方体 C = [-1,1]^3 被平面  n·x = d  （n 为单位法向量）截出的截面多边形。

核验内容
  1. 边数只可能是 3/4/5/6，最多 6 条边（面数上限论证 + 数值抽样）；
  2. 三角形：截棱长公式、等边/等腰/不等边存在性、恒为锐角（无直角/钝角）；
  3. 四边形：平行四边形/梯形判据，正方形/矩形/菱形/非菱形平行四边形/梯形/
     直角梯形（不存在）等结论，以及“仅按相交面配对判断”的误区；
  4. 五边形（无正五边形、恰有两组平行边）、六边形（正六边形条件）;
  5. 10 个精确预设的逐项验证（坐标、边数、二维性、退化阈值、单位法向量、d 范围）；
  6. 若干退化/临界情形的计算。

运行：  python research/verify_presets.py
输出：  research/verification.txt  （本脚本直接写 UTF-8 文本）
        research/presets.json     （机器可读预设）
"""

import itertools
import json
import math
import os
import sys
from collections import Counter
from fractions import Fraction as F

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TXT_PATH = os.path.join(HERE, "verification.txt")
JSON_PATH = os.path.join(HERE, "presets.json")

EPS = 1e-9                 # 一般数值容差
PAR_TOL = 1e-11            # 平行判定容差（单位方向向量的 |dot| > 1-PAR_TOL）
ANG_TOL = 1e-9             # 角度判定容差（度；只用于识别“精确”特殊形状）
REL = 1e-9                 # 长度/边长“相等”的相对容差


def close(a, b, rel=REL):
    return abs(a - b) <= rel * max(1.0, abs(a), abs(b))
VIS = 1e-3                 # 视觉稳定阈值：交点离端点、平面离顶点/棱的最小距离
SAMPLE_N = 120000          # 随机抽样平面数量
SEED = 20251019

OUT = []                   # verification.txt 的行


def log(s=""):
    OUT.append(str(s))


def hr(ch="=", n=78):
    log(ch * n)


# ----------------------------------------------------------------------------
# 基本几何对象
# ----------------------------------------------------------------------------

def cube_vertices():
    return [tuple(float(c) for c in v) for v in itertools.product((-1.0, 1.0), repeat=3)]


def cube_edges_float():
    edges = []
    for axis in range(3):
        others = [i for i in range(3) if i != axis]
        for s0 in (-1.0, 1.0):
            for s1 in (-1.0, 1.0):
                p = np.zeros(3)
                q = np.zeros(3)
                p[others[0]] = q[others[0]] = s0
                p[others[1]] = q[others[1]] = s1
                p[axis] = -1.0
                q[axis] = 1.0
                edges.append((p, q, axis))
    return edges


def cube_edges_exact():
    edges = []
    for axis in range(3):
        others = [i for i in range(3) if i != axis]
        for s0 in (-1, 1):
            for s1 in (-1, 1):
                p = [F(0), F(0), F(0)]
                q = [F(0), F(0), F(0)]
                p[others[0]] = q[others[0]] = F(s0)
                p[others[1]] = q[others[1]] = F(s1)
                p[axis] = F(-1)
                q[axis] = F(1)
                edges.append((tuple(p), tuple(q), axis))
    return edges


EDGES_F = cube_edges_float()
EDGES_X = cube_edges_exact()


def support_unit(n):
    """单位法向量 n 下立方体的支撑函数值 sum|n_i|（d 的允许范围是 (-s, s)）。"""
    return float(np.abs(n).sum())


# ----------------------------------------------------------------------------
# 精确截面（预设用有理数计算：顶点坐标是平面 n_raw·x = k 与棱的交点，必为有理数）
# ----------------------------------------------------------------------------

def section_exact(raw, k):
    raw = [F(a) for a in raw]
    k = F(k)
    vertex_hits = []
    for v in itertools.product((-1, 1), repeat=3):
        val = sum(raw[i] * F(v[i]) for i in range(3))
        if val == k:
            vertex_hits.append(v)
    contained = []
    crossings = []
    for idx, (p, q, axis) in enumerate(EDGES_X):
        vp = sum(raw[i] * p[i] for i in range(3))
        vq = sum(raw[i] * q[i] for i in range(3))
        if raw[axis] == 0:
            if vp == k:
                contained.append(idx)
            continue
        t = (k - vp) / (vq - vp)
        if F(0) <= t <= F(1):
            pt = tuple(p[i] + t * (q[i] - p[i]) for i in range(3))
            crossings.append((idx, t, pt))
    # 精确去重
    ded = {}
    for idx, t, pt in crossings:
        ded.setdefault(pt, []).append((idx, t))
    return dict(
        points=list(ded.keys()),
        point_info=ded,
        crossings=crossings,
        contained=contained,
        vertex_hits=vertex_hits,
        raw=[int(a) for a in raw],
        k=k,
    )


# ----------------------------------------------------------------------------
# 浮点截面（随机抽样用）
# ----------------------------------------------------------------------------

def section_float(n, d):
    pts = []
    contained = []
    tvals = []
    for p, q, axis in EDGES_F:
        vp = float(np.dot(n, p))
        vq = float(np.dot(n, q))
        if abs(vq - vp) < 1e-14:
            if abs(vp - d) < 1e-12:
                contained.append((p, q, axis))
            continue
        t = (d - vp) / (vq - vp)
        if -1e-12 <= t <= 1.0 + 1e-12:
            t = min(max(t, 0.0), 1.0)
            pts.append(p + t * (q - p))
            tvals.append((t, axis))
    if not pts:
        return dict(points=np.zeros((0, 3)), contained=contained, tvals=tvals)
    pts = np.array(pts)
    # 去重（精确到末端点重合的情形）
    keep = []
    for p in pts:
        if all(np.linalg.norm(p - q) > 1e-9 for q in keep):
            keep.append(p)
    return dict(points=np.array(keep), contained=contained, tvals=tvals)


# ----------------------------------------------------------------------------
# 排序与多边形度量
# ----------------------------------------------------------------------------

def order_points(pts, n):
    pts = np.asarray(pts, dtype=float)
    c = pts.mean(axis=0)
    ref = np.eye(3)[int(np.argmin(np.abs(n)))]
    u = np.cross(n, ref)
    u = u / np.linalg.norm(u)
    v = np.cross(n, u)
    ang = np.arctan2((pts - c) @ v, (pts - c) @ u)
    idx = np.argsort(ang)
    return pts[idx], c, u, v


def face_label_from_midpoint(mid):
    """截面一条边的中点必落在某个立方体面上；返回 (face_label, saturated_count)。
    face_label 形如 '+x' / '-z'。"""
    sat = [i for i in range(3) if abs(abs(mid[i]) - 1.0) < 1e-8]
    if len(sat) != 1:
        return None, len(sat)
    i = sat[0]
    return ("+" if mid[i] > 0 else "-") + "xyz"[i], 1


def poly_metrics(pts_ordered, n):
    pts = np.asarray(pts_ordered, dtype=float)
    m = len(pts)
    area_vec = 0.0
    c = pts.mean(axis=0)
    ref = np.eye(3)[int(np.argmin(np.abs(n)))]
    u = np.cross(n, ref)
    u = u / np.linalg.norm(u)
    v = np.cross(n, u)
    p2 = np.column_stack([(pts - c) @ u, (pts - c) @ v])
    area = 0.0
    for i in range(m):
        x1, y1 = p2[i]
        x2, y2 = p2[(i + 1) % m]
        area += x1 * y2 - x2 * y1
    area = 0.5 * area

    edges = [pts[(i + 1) % m] - pts[i] for i in range(m)]
    lens = [float(np.linalg.norm(e)) for e in edges]
    angles = []
    for i in range(m):
        a = -edges[i - 1]
        b = edges[i]
        ca = float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
        ca = max(-1.0, min(1.0, ca))
        angles.append(math.degrees(math.acos(ca)))

    par = []
    for i in range(m):
        for j in range(i + 1, m):
            if j == i + 1 or (i == 0 and j == m - 1):
                continue
            d = abs(float(np.dot(edges[i], edges[j])) / (lens[i] * lens[j]))
            if d > 1.0 - PAR_TOL:
                par.append((i, j))

    faces = []
    bad_face_count = 0
    for i in range(m):
        mid = 0.5 * (pts[i] + pts[(i + 1) % m])
        lab, cnt = face_label_from_midpoint(mid)
        faces.append(lab)
        if lab is None:
            bad_face_count += 1

    # 凸性
    conv = True
    signs = []
    for i in range(m):
        e1 = p2[(i + 1) % m] - p2[i]
        e2 = p2[(i + 2) % m] - p2[(i + 1) % m]
        cr = e1[0] * e2[1] - e1[1] * e2[0]
        signs.append(cr)
    if not (all(s > 1e-12 for s in signs) or all(s < -1e-12 for s in signs)):
        conv = False

    return dict(
        m=m, pts=pts, area=area, lens=lens, angles=angles, par=par,
        faces=faces, bad_face_count=bad_face_count, convex=conv, edge_signs=signs,
    )


def classify(props, n):
    m = props["m"]
    lens = props["lens"]
    angs = props["angles"]
    par = props["par"]
    faces = props.get("faces", [])
    op_faces = sum(1 for ax in "xyz" if ("+" + ax) in faces and ("-" + ax) in faces)
    r = dict(sides=m, lens=lens, angles=angs, parallelPairs=par,
             parallelPairCount=len(par), oppositeFacePairCount=op_faces,
             faces=faces, rightAngles=[],
             rightAngleDetected=any(abs(a - 90.0) < ANG_TOL for a in angs))
    for i, a in enumerate(angs):
        if abs(a - 90.0) < ANG_TOL:
            r["rightAngles"].append(i)
    if m == 3:
        L = sorted(lens)
        eq = close(L[0], L[2])
        iso = close(L[0], L[1]) or close(L[1], L[2])
        r["triangle"] = "equilateral" if eq else ("isosceles" if iso else "scalene")
        r["acute"] = all(a < 90.0 - 1e-7 for a in angs)
        r["maxAngle"] = max(angs)
        r["right"] = any(abs(a - 90.0) < ANG_TOL for a in angs)
        r["obtuse"] = any(a > 90.0 + 1e-7 for a in angs)
    elif m == 4:
        p02 = (0, 2) in par
        p13 = (1, 3) in par
        # 面配对给出“必然平行”的边；但若某个 n_i = 0（平面平行于一条棱），
        # 相邻两面的边也会平行 => 实际是矩形/平行四边形（典型误区）。
        # 因此先看几何上是否两组对边都平行，再退回面配对判据。
        if op_faces == 2 or (p02 and p13):
            right = any(abs(a - 90.0) < ANG_TOL for a in angs)
            eqadj = close(lens[0], lens[1])
            if right and eqadj:
                tag = "square"
            elif right:
                tag = "rectangle"
            elif eqadj:
                tag = "rhombus"
            else:
                tag = "parallelogram-general"
            r["quad"] = tag
            r["parallelogram"] = True
        elif op_faces == 1 or p02 or p13:
            legs = [lens[1], lens[3]] if p02 else [lens[0], lens[2]]
            r["quad"] = "trapezoid"
            r["parallelogram"] = False
            r["isoscelesTrapezoid"] = close(legs[0], legs[1])
            r["rightTrapezoid"] = r["rightAngleDetected"]
            r["legs"] = legs
        else:
            r["quad"] = "quadrilateral-no-parallel-pair"
            r["parallelogram"] = False
    elif m == 5:
        r["allAnglesEqual"] = all(close(a, angs[0]) for a in angs)
        r["allSidesEqual"] = all(close(L, lens[0]) for L in lens)
        r["regular"] = r["allSidesEqual"] and r["allAnglesEqual"]
    elif m == 6:
        r["oppositePairsParallel"] = all((i, i + 3) in par or (i + 3, i) in par for i in range(3))
        r["allSidesEqual"] = all(close(L, lens[0]) for L in lens)
        r["allAnglesEqual"] = all(close(a, angs[0]) for a in angs)
        r["regular"] = r["allSidesEqual"] and r["allAnglesEqual"]
    return r


# ----------------------------------------------------------------------------
# 预设定义
# ----------------------------------------------------------------------------

def frac_str(x):
    x = F(x)
    return str(x.numerator) if x.denominator == 1 else "%d/%d" % (x.numerator, x.denominator)


PRESETS = [
    dict(
        id="tri-equilateral", name="等边三角形", sides=3,
        raw=[1, 1, 1], k=F(2),
        normalExpr="(1,1,1)/√3", dExpr="2/√3",
        expectedProperties=["三角形", "三边相等 √2", "三个内角 60°", "锐角"],
        expect=dict(sides=3, triangle="equilateral", acute=True, rightAngles=[]),
        teachingNote="平面 x+y+z=2 截去角 (1,1,1) 处三条棱的中点，三边长 √2。立方体截面中的正三角形必是这种“截角”型，且唯一（不计对称）。",
    ),
    dict(
        id="tri-isosceles", name="等腰三角形（非等边）", sides=3,
        raw=[1, 1, 3], k=F(7, 2),
        normalExpr="(1,1,3)/√11", dExpr="7/(2√11)",
        expectedProperties=["三角形", "两边相等 √(5/2)", "底边 3√2/2", "锐角"],
        expect=dict(sides=3, triangle="isosceles", acute=True),
        teachingNote="从顶点 (1,1,1) 出发截三条棱，截长 3/2、3/2、1/2：两腰 √(5/2)，底边 3√2/2。",
    ),
    dict(
        id="tri-scalene", name="不等边三角形（锐角）", sides=3,
        raw=[2, 3, 6], k=F(37, 5),
        normalExpr="(2,3,6)/7", dExpr="37/35",
        expectedProperties=["三角形", "三边 3√13/5, √10·3/5? ", "不等边", "锐角"],
        expect=dict(sides=3, triangle="scalene", acute=True),
        teachingNote="截长 9/5、6/5、3/5，三边 √13·3/5? 见验证输出；三边互不相等。",
    ),
    dict(
        id="quad-square", name="正方形", sides=4,
        raw=[0, 0, 1], k=F(0),
        normalExpr="(0,0,1)", dExpr="0",
        expectedProperties=["四边形", "正方形", "边长 2", "四个直角"],
        expect=dict(sides=4, quad="square", rightAngleDetected=True),
        teachingNote="平面 z=0 平行于上下底面，截面是 2×2 正方形。正方形截面还可以斜着截（见文档“斜截正方形”），但所有正方形截面都是沿某条棱方向“拉伸”出来的。",
    ),
    dict(
        id="quad-rectangle", name="非正方形矩形", sides=4,
        raw=[1, 1, 0], k=F(9, 10),
        normalExpr="(1,1,0)/√2", dExpr="9/(10√2)",
        expectedProperties=["四边形", "矩形", "边长 2 与 11√2/10", "四个直角", "平面平行于 z 棱"],
        expect=dict(sides=4, quad="rectangle", rightAngleDetected=True),
        teachingNote="平面 x+y=0.9 平行于 z 轴：截面是 2 × 11√2/10 的矩形。注意它截到 z=±1（一对面）与 x=1、y=1（两个相邻面）——按“面配对”会被误判成梯形，实际因平面平行于棱而是矩形（本文件重点反例）。",
    ),
    dict(
        id="quad-rhombus", name="菱形（非正方形）", sides=4,
        raw=[1, 1, 3], k=F(0),
        normalExpr="(1,1,3)/√11", dExpr="0",
        expectedProperties=["四边形", "菱形", "边长 2√10/3", "内角 84.26°/95.74°", "两组对边平行"],
        expect=dict(sides=4, quad="rhombus"),
        teachingNote="平面 x+y+3z=0 过中心，截四条平行 z 轴的棱：四边等长 2√10/3，非直角。菱形截面存在。",
    ),
    dict(
        id="quad-parallelogram", name="一般平行四边形（非菱形非矩形）", sides=4,
        raw=[1, 2, 4], k=F(0),
        normalExpr="(1,2,4)/√21", dExpr="0",
        expectedProperties=["四边形", "平行四边形", "边长 √5 与 √17/2", "非菱形非矩形"],
        expect=dict(sides=4, quad="parallelogram-general"),
        teachingNote="平面 x+2y+4z=0 截四条平行 z 轴的棱，得到一般平行四边形（内角约 83.8°/96.2°，邻边不等）。",
    ),
    dict(
        id="quad-trapezoid", name="梯形（非平行四边形，等腰）", sides=4,
        raw=[1, 3, 3], k=F(2),
        normalExpr="(1,3,3)/√19", dExpr="2/√19",
        expectedProperties=["四边形", "梯形", "仅一组对边平行", "等腰梯形", "无直角"],
        expect=dict(sides=4, quad="trapezoid", isoscelesTrapezoid=True, rightAngleDetected=False),
        teachingNote="平面 x+3y+3z=2 截 x=±1、y=1、z=1 四个面：两条底边平行（长 5√2/3 与 √2），两腰相等（2√10/3），是无直角的等腰梯形。",
    ),
    dict(
        id="pentagon", name="五边形", sides=5,
        raw=[1, 1, 2], k=F(3, 2),
        normalExpr="(1,1,2)/√6", dExpr="√6/4",
        expectedProperties=["五边形", "恰有两组平行边", "非正五边形", "无直角"],
        expect=dict(sides=5, parallelPairCount=2),
        teachingNote="平面 x+y+2z=3/2 截 x=±1、y=±1、z=1 五个面。五边形必截两组对面 + 一个面，因此恰有两组平行边，正五边形不可能。",
    ),
    dict(
        id="hexagon-regular", name="正六边形", sides=6,
        raw=[1, 1, 1], k=F(0),
        normalExpr="(1,1,1)/√3", dExpr="0",
        expectedProperties=["六边形", "正六边形", "边长 √2", "内角 120°", "三组平行边"],
        expect=dict(sides=6, regular=True, parallelPairCount=3),
        teachingNote="平面 x+y+z=0 过中心且垂直体对角线，截面是边长 √2 的正六边形。正六边形截面只有这一族（4 个法向量 ±(1,1,1)/√3，d=0）。",
    ),
]


# ----------------------------------------------------------------------------
# 预设验证
# ----------------------------------------------------------------------------

def verify_preset(p):
    raw = p["raw"]
    k = p["k"]
    sec = section_exact(raw, k)
    norm = math.sqrt(sum(float(a) ** 2 for a in raw))
    n = np.array(raw, dtype=float) / norm
    d = float(k) / norm
    support = support_unit(n)
    pts_f = np.array([[float(c) for c in q] for q in sec["points"]], dtype=float)

    checks = {}
    checks["unitNormal"] = abs(float(np.linalg.norm(n)) - 1.0) < 1e-15
    checks["normalUnit"] = checks["unitNormal"]
    checks["dInSupport"] = abs(d) < support - 1e-9
    checks["dMargin"] = support - abs(d)

    # 截面存在且是二维多边形
    if len(pts_f) < 3:
        checks["nondegenerate2D"] = False
        props = None
    else:
        pts_o, c, u, v = order_points(pts_f, n)
        props = poly_metrics(pts_o, n)
        checks["nondegenerate2D"] = props["area"] > 1e-6 and props["convex"]
        checks["area"] = props["area"]
        checks["convex"] = props["convex"]
        checks["sides"] = props["m"]

    if props is not None:
        # (a) 顶点坐标都在 [-1,1]
        checks["coordsInCube"] = bool(np.all(np.abs(props["pts"]) <= 1.0 + 1e-12))
        checks["maxAbsCoord"] = float(np.max(np.abs(props["pts"])))
        # 去重 / 边长
        m = props["m"]
        mind = 1e9
        for i in range(m):
            for j in range(i + 1, m):
                mind = min(mind, float(np.linalg.norm(props["pts"][i] - props["pts"][j])))
        checks["minVertexDistance"] = mind
        checks["minEdgeLength"] = min(props["lens"])
        checks["maxEdgeLength"] = max(props["lens"])
        checks["noCoincidentVertices"] = mind > 1e-6
        checks["noZeroLengthEdges"] = min(props["lens"]) > 1e-6
        checks["atLeastTwoNondegenerateEdges"] = sum(1 for L in props["lens"] if L > 1e-3) >= 2
        # 截面顶点必须落在棱的内部（而非立方体顶点/面内部）
        interior_edge_vertices = 0
        vertex_is_cube_vertex = []
        for q in props["pts"]:
            sat = [i for i in range(3) if abs(abs(q[i]) - 1.0) < 1e-12]
            strict = [i for i in range(3) if abs(q[i]) < 1.0 - 1e-12]
            is_cube_v = len(sat) >= 3
            vertex_is_cube_vertex.append(is_cube_v)
            if len(sat) == 2 and len(strict) == 1:
                interior_edge_vertices += 1
        checks["verticesOnEdgeInterior"] = interior_edge_vertices
        checks["allVerticesOnEdgeInterior"] = (interior_edge_vertices == m)
        checks["sectionVertexIsCubeVertex"] = any(vertex_is_cube_vertex)
        # (b) 边数正确、每条边落在不同立方体面上
        checks["facesPerSide"] = props["faces"]
        checks["distinctFaces"] = len(set(props["faces"]))
        checks["sidesEqFaces"] = (len(set(props["faces"])) == m and props["bad_face_count"] == 0)
        # (c) 无退化重合点（顶点互异 + 边长为正 + 交点离端点）
        tmin = 1.0
        for (idx, t, pt) in sec["crossings"]:
            tmin = min(tmin, float(min(t, 1 - t)))
        checks["minCrossingT"] = tmin
        checks["crossingsAwayFromVertices"] = tmin >= VIS
        # (d) 平面不经过立方体顶点 / 棱，并且离得足够远
        min_vertex_dist = min(
            abs(sum(float(raw[i]) * cv[i] for i in range(3)) - float(k)) / norm
            for cv in cube_vertices()
        )
        checks["minVertexPlaneDistance"] = min_vertex_dist
        checks["planeAvoidsVertices"] = (len(sec["vertex_hits"]) == 0 and min_vertex_dist >= VIS)
        checks["planeAvoidsEdges"] = (len(sec["contained"]) == 0)
        checks["containedEdgeCount"] = len(sec["contained"])
        checks["vertexHitCount"] = len(sec["vertex_hits"])

        cls = classify(props, n)
        checks["classification"] = {
            "triangle": cls.get("triangle"),
            "quad": cls.get("quad"),
            "parallelogram": cls.get("parallelogram"),
            "isoscelesTrapezoid": cls.get("isoscelesTrapezoid"),
            "rightAngleDetected": cls.get("rightAngleDetected"),
            "rightAngles": cls.get("rightAngles"),
            "parallelPairCount": cls.get("parallelPairCount"),
            "regular": cls.get("regular"),
            "acute": cls.get("acute"),
            "allAnglesEqual": cls.get("allAnglesEqual"),
            "allSidesEqual": cls.get("allSidesEqual"),
        }
        # 与声明比对
        exp = p["expect"]
        ok = True
        reasons = []
        if "sides" in exp and m != exp["sides"]:
            ok = False
            reasons.append("sides %d != %d" % (m, exp["sides"]))
        for key in ("triangle", "quad", "isoscelesTrapezoid", "regular", "acute"):
            if key in exp and cls.get(key) != exp[key]:
                ok = False
                reasons.append("%s=%r != %r" % (key, cls.get(key), exp[key]))
        if "rightAngleDetected" in exp and cls.get("rightAngleDetected") != exp["rightAngleDetected"]:
            ok = False
            reasons.append("rightAngleDetected %r != %r" % (cls.get("rightAngleDetected"), exp["rightAngleDetected"]))
        if "parallelPairCount" in exp and cls.get("parallelPairCount") != exp["parallelPairCount"]:
            ok = False
            reasons.append("parallelPairCount %r != %r" % (cls.get("parallelPairCount"), exp["parallelPairCount"]))
        if "rightAngles" in exp and len(cls.get("rightAngles", [])) != len(exp["rightAngles"]):
            ok = False
            reasons.append("rightAngles %r" % (cls.get("rightAngles"),))
        checks["declaredExpectationSatisfied"] = ok
        checks["mismatchReasons"] = reasons

        all_ok = all([
            checks["normalUnit"], checks["dInSupport"], checks["coordsInCube"],
            checks["nondegenerate2D"], checks["noCoincidentVertices"],
            checks["noZeroLengthEdges"], checks["atLeastTwoNondegenerateEdges"],
            checks["allVerticesOnEdgeInterior"], checks["sidesEqFaces"],
            checks["planeAvoidsVertices"], checks["planeAvoidsEdges"],
            checks["crossingsAwayFromVertices"], checks["declaredExpectationSatisfied"],
        ])
        checks["PASS"] = all_ok
        # 输出用数据
        data = dict(
            id=p["id"], name=p["name"], sides=m,
            normal=[round(float(x), 15) for x in n],
            d=round(float(d), 15),
            normalExpr=p["normalExpr"], dExpr=p["dExpr"],
            exact=dict(rawNormal=[int(a) for a in raw], k=frac_str(k),
                       formula="n = rawNormal/||rawNormal||, d = k/||rawNormal||, plane: rawNormal·x = k",
                       verticesExact=[[frac_str(q[i]) for i in range(3)] for q in sec["points"]]),
            expectedProperties=p["expectedProperties"],
            teachingNote=p["teachingNote"],
            vertices=[[round(float(q[i]), 12) for i in range(3)] for q in props["pts"]],
            sideLengths=[round(float(L), 12) for L in props["lens"]],
            interiorAnglesDeg=[round(float(a), 9) for a in props["angles"]],
            facesPerSide=props["faces"],
            properties={kk: vv for kk, vv in cls.items() if kk not in ("lens", "angles", "pts")},
            checks={kk: checks[kk] for kk in (
                "unitNormal", "dInSupport", "coordsInCube", "nondegenerate2D",
                "convex", "noCoincidentVertices", "noZeroLengthEdges",
                "atLeastTwoNondegenerateEdges", "allVerticesOnEdgeInterior",
                "sidesEqFaces", "planeAvoidsVertices", "planeAvoidsEdges",
                "crossingsAwayFromVertices", "declaredExpectationSatisfied", "PASS")},
            margins=dict(area=props["area"], minVertexDistance=mind,
                         minEdgeLength=min(props["lens"]),
                         maxEdgeLength=max(props["lens"]),
                         minCrossingT=float(checks["minCrossingT"]),
                         minVertexPlaneDistance=float(min_vertex_dist),
                         dMargin=float(support - abs(d)),
                         dSupport=float(support)),
        )
        return data, checks

    # 退化（不应出现在预设里）
    checks["PASS"] = False
    return dict(id=p["id"], name=p["name"], sides=len(pts_f),
                normal=[round(float(x), 15) for x in n], d=round(float(d), 15),
                normalExpr=p["normalExpr"], dExpr=p["dExpr"],
                expectedProperties=p["expectedProperties"],
                teachingNote=p["teachingNote"], vertices=[],
                checks=checks), checks


# ----------------------------------------------------------------------------
# 退化情形
# ----------------------------------------------------------------------------

def degenerate_examples():
    cases = [
        dict(id="tangent-vertex", raw=[1, 1, 1], k=F(3),
             note="平面位于支撑位置 x+y+z=3：只与顶点 (1,1,1) 相切，截面是一个点"),
        dict(id="through-three-vertices", raw=[1, 1, 1], k=F(1),
             note="平面 x+y+z=1 同时经过 3 个立方体顶点，截面是等边三角形（顶点即立方体顶点）"),
        dict(id="contains-two-edges", raw=[1, -1, 0], k=F(0),
             note="平面 x=y 包含两条相对的棱，截面是正方形，其中两条边就是立方体的整条棱"),
        dict(id="touch-one-edge", raw=[1, 1, 0], k=F(2),
             note="平面 x+y=2 只包含一条棱 (1,1,z)，截面退化为线段"),
        dict(id="face-plane", raw=[0, 0, 1], k=F(1),
             note="平面 z=1 与顶面重合，截面就是这个正方形面，四条边都是立方体的棱"),
        dict(id="through-one-vertex", raw=[1, 2, 3], k=F(2),
             note="平面 x+2y+3z=2 只经过一个顶点 (1,-1,1)，截面仍是四边形，但一个顶点落在立方体顶点上"),
        dict(id="outside", raw=[1, 1, 1], k=F(4),
             note="平面 x+y+z=4 在立方体外部，截面为空"),
    ]
    res = []
    for c in cases:
        raw = c["raw"]
        k = c["k"]
        sec = section_exact(raw, k)
        norm = math.sqrt(sum(float(a) ** 2 for a in raw))
        n = np.array(raw, float) / norm
        d = float(k) / norm
        pts = np.array([[float(q) for q in pt] for pt in sec["points"]], dtype=float)
        rec = dict(id=c["id"], plane="rawNormal=(%s), k=%s" % (",".join(map(str, raw)), frac_str(k)),
                   normalExpr="(%s)/%s" % (",".join(map(str, raw)), "√%d" % sum(a * a for a in raw)),
                   d=round(d, 12), note=c["note"],
                   distinctPoints=int(len(pts)),
                   containedEdges=int(len(sec["contained"])),
                   vertexHits=[list(v) for v in sec["vertex_hits"]])
        if len(pts) >= 3:
            pts_o, _, _, _ = order_points(pts, n)
            props = poly_metrics(pts_o, n)
            rec.update(sides=int(props["m"]), area=round(float(props["area"]), 12),
                       dim="2D" if props["area"] > 1e-9 else "degenerate",
                       sidesFaceCount=int(len(set(props["faces"]))),
                       minEdgeLength=round(float(min(props["lens"])), 12),
                       degenerate=(len(sec["contained"]) > 0 or len(sec["vertex_hits"]) > 0))
        elif len(pts) == 2:
            rec.update(sides=2, area=0.0, dim="1D(segment)", degenerate=True)
        elif len(pts) == 1:
            rec.update(sides=1, area=0.0, dim="0D(point)", degenerate=True)
        else:
            rec.update(sides=0, area=0.0, dim="empty", degenerate=True)
        res.append(rec)
    return res


# ----------------------------------------------------------------------------
# 随机抽样
# ----------------------------------------------------------------------------

def run_sampling():
    rng = np.random.default_rng(SEED)
    cnt_side = Counter()
    quad_types = Counter()
    stats = dict(
        N=SAMPLE_N,
        side_counts=dict(),
        max_sides=0,
        min_sides=99,
        quad_parallel_counts=Counter(),
        quad_geom_parallel_counts=Counter(),
        quad_types=Counter(),
        triangles=Counter(),
        triangle_acute_violations=0,
        triangle_formula_checked=0,
        triangle_formula_mismatch=0,
        quad_opposite_sides_equal_violations=0,
        quad_no_parallel=0,
        quad_right_angle_found=0,
        trapezoid_right_angle_found=0,
        pentagon_parallel_counts=Counter(),
        pentagon_geom_parallel_counts=Counter(),
        hexagon_parallel_counts=Counter(),
        hexagon_geom_parallel_counts=Counter(),
        hexagon_equiangular_pairs=Counter(),
        hexagon_regular_found=0,
        hexagon_symmetric_d0=0,
        hexagon_symmetric_dnonzero=0,
        sides_faces_mismatch=0,
        face_count_gt6=0,
        right_angle_any=0,
        min_margin_acute=1e9,
        min_trap_angle_dev=1e9,
        bad_polygon=0,
        skipped_degenerate=0,
        rhombus_found=0,
        square_found=0,
        rectangle_found=0,
    )
    for it in range(SAMPLE_N):
        v = rng.normal(size=3)
        nn = float(np.linalg.norm(v))
        if nn < 1e-12:
            continue
        n = v / nn
        s = float(np.abs(n).sum())
        d = float(rng.uniform(-s, s))
        sec = section_float(n, d)
        pts = sec["points"]
        if len(pts) < 3 or len(sec["contained"]) > 0:
            stats["skipped_degenerate"] += 1
            continue
        pts_o, c, u, vv = order_points(pts, n)
        props = poly_metrics(pts_o, n)
        if props["area"] < 1e-10 or props["bad_face_count"] > 0 or not props["convex"]:
            stats["skipped_degenerate"] += 1
            continue
        m = props["m"]
        cnt_side[m] += 1
        stats["max_sides"] = max(stats["max_sides"], m)
        stats["min_sides"] = min(stats["min_sides"], m)
        faces = props["faces"]
        if len(set(faces)) != m:
            stats["sides_faces_mismatch"] += 1
        if len(set(faces)) > 6:
            stats["face_count_gt6"] += 1
        cls = classify(props, n)
        stats["right_angle_any"] += 1 if cls.get("rightAngleDetected") else 0
        if m == 3:
            stats["triangles"][cls["triangle"]] += 1
            if not cls["acute"]:
                stats["triangle_acute_violations"] += 1
            stats["min_margin_acute"] = min(stats["min_margin_acute"], 90.0 - cls["maxAngle"])
            # 验证截棱长公式：找到公共顶点，截长 x,y,z，边长应为 sqrt(x^2+y^2) 等
            ok, xyz = triangle_formula_check(props, n)
            if ok is not None:
                stats["triangle_formula_checked"] += 1
                if not ok:
                    stats["triangle_formula_mismatch"] += 1
        elif m == 4:
            stats["quad_parallel_counts"][cls["oppositeFacePairCount"]] += 1
            stats["quad_geom_parallel_counts"][cls["parallelPairCount"]] += 1
            stats["quad_types"][cls["quad"]] += 1
            if cls["oppositeFacePairCount"] == 0:
                stats["quad_no_parallel"] += 1
            if cls["rightAngleDetected"]:
                stats["quad_right_angle_found"] += 1
            if cls["quad"] == "trapezoid":
                if cls["rightTrapezoid"]:
                    stats["trapezoid_right_angle_found"] += 1
                dev = min(abs(a - 90.0) for a in props["angles"])
                stats["min_trap_angle_dev"] = min(stats["min_trap_angle_dev"], dev)
            if cls["quad"] in ("square", "rectangle", "rhombus"):
                stats[{"square": "square_found", "rectangle": "rectangle_found", "rhombus": "rhombus_found"}[cls["quad"]]] += 1
            if cls["parallelogram"]:
                # 平行四边形对边应等长
                L = props["lens"]
                if abs(L[0] - L[2]) > 1e-7 or abs(L[1] - L[3]) > 1e-7:
                    stats["quad_opposite_sides_equal_violations"] += 1
        elif m == 5:
            stats["pentagon_parallel_counts"][cls["oppositeFacePairCount"]] += 1
            stats["pentagon_geom_parallel_counts"][cls["parallelPairCount"]] += 1
        elif m == 6:
            stats["hexagon_parallel_counts"][cls["oppositeFacePairCount"]] += 1
            stats["hexagon_geom_parallel_counts"][cls["parallelPairCount"]] += 1
            absn = np.abs(n)
            eq = (absn.max() - absn.min()) < 1e-7
            stats["hexagon_equiangular_pairs"][(bool(eq), bool(cls["allAnglesEqual"]))] += 1
            if cls["regular"]:
                stats["hexagon_regular_found"] += 1
            # 中心对称检测：p_i + p_{i+3} = 2*centroid
            P = props["pts"]
            sym = True
            for i in range(3):
                if np.linalg.norm(P[i] + P[i + 3] - 2 * P.mean(axis=0)) > 1e-7:
                    sym = False
            if abs(d) < 1e-12 and sym:
                stats["hexagon_symmetric_d0"] += 1
            if abs(d) > 1e-3 and sym:
                stats["hexagon_symmetric_dnonzero"] += 1
        if it % 40000 == 39999:
            pass
    stats["side_counts"] = dict(sorted(cnt_side.items()))
    return stats


def triangle_formula_check(props, n):
    """三角形截面必是截角型：找公共顶点 V，三条棱上截长 x,y,z；检查边长 = sqrt(x^2+y^2) 等。"""
    P = props["pts"]
    for V in itertools.product((-1.0, 1.0), repeat=3):
        V = np.array(V, dtype=float)
        cuts = []
        axis_of = []
        okv = True
        used_axes = set()
        for p in P:
            # 检查 p 是否在从 V 出发的棱上：p 与 V 只在一个坐标不同，其余坐标相等且为 ±1
            diff = np.where(np.abs(p - V) > 1e-9)[0]
            if len(diff) != 1:
                okv = False
                break
            axis = int(diff[0])
            other = [i for i in range(3) if i != axis]
            if any(abs(V[i]) != 1.0 for i in other):
                pass
            # V 的其它两个坐标必须与 p 相同（p 在该棱上）
            for i in other:
                if abs(p[i] - V[i]) > 1e-9:
                    okv = False
                    break
            if not okv:
                break
            if axis in used_axes:
                okv = False
                break
            used_axes.add(axis)
            cuts.append(abs(float(p[axis] - V[axis])))
            axis_of.append(axis)
        if not okv or len(cuts) != 3:
            continue
        # 边：分别连接不同坐标轴上的点，长度应 sqrt(x^2+y^2)（两个截长对应两条棱）
        axes = sorted(used_axes)
        xyz = {}
        for ax, cut in zip(axis_of, cuts):
            xyz[ax] = cut
        # 实际边长
        pred = []
        actual = []
        L = props["lens"]
        # 建立：点 -> 所在坐标轴
        pt_axis = []
        for p in P:
            diff = np.where(np.abs(p - V) > 1e-9)[0]
            pt_axis.append(int(diff[0]))
        for i in range(3):
            j = (i + 1) % 3
            a, b = pt_axis[i], pt_axis[j]
            pred.append(math.sqrt(xyz[a] ** 2 + xyz[b] ** 2))
            actual.append(float(np.linalg.norm(P[i] - P[j])))
        # lens 与顶点顺序对应关系：props 的边是 (pts[i], pts[i+1])，这里 pts 顺序相同
        ok = all(abs(pred[k] - actual[k]) < 1e-7 for k in range(3))
        return ok, xyz
    return None, None


# ----------------------------------------------------------------------------
# 特殊族扫描
# ----------------------------------------------------------------------------

def family_scans():
    out = {}

    # 1. 菱形族 n=(1,1,c)/sqrt(2+c^2), d=0
    rows = []
    for c in [1.0, 1.5, 1.8, 1.99, 2.0, 2.01, 2.2, 2.5, 3.0, 5.0, 10.0]:
        n = np.array([1.0, 1.0, c]) / math.sqrt(2.0 + c * c)
        sec = section_float(n, 0.0)
        pts = sec["points"]
        if len(pts) < 3:
            continue
        pts_o, _, _, _ = order_points(pts, n)
        props = poly_metrics(pts_o, n)
        cls = classify(props, n)
        cubev = sum(1 for q in props["pts"] if np.all(np.abs(np.abs(q) - 1.0) < 1e-9))
        if props["m"] == 6:
            kind = "hexagon"
        elif props["m"] == 5:
            kind = "pentagon"
        elif props["m"] == 4:
            kind = cls.get("quad")
        else:
            kind = cls.get("triangle")
        rows.append(dict(c=c, sides=int(props["m"]), kind=kind, quad=cls.get("quad"),
                         tri=cls.get("triangle"), area=float(props["area"]),
                         lens=[round(float(L), 6) for L in props["lens"]],
                         angles=[round(float(a), 4) for a in props["angles"]],
                         contained=len(sec["contained"]), cubeVertexCount=int(cubev)))
    out["rhombus_family"] = rows

    # 2. 正方形：面平行族 + 斜截族（n_z=0，弦长=2）
    sq = []
    for d in [-0.9, -0.5, 0.0, 0.5, 0.9]:
        n = np.array([0.0, 0.0, 1.0])
        sec = section_float(n, d)
        pts_o, _, _, _ = order_points(sec["points"], n)
        props = poly_metrics(pts_o, n)
        cls = classify(props, n)
        sq.append(dict(kind="face-parallel", d=d, sides=int(props["m"]),
                       quad=cls.get("quad"),
                       lens=[round(float(L), 6) for L in props["lens"]],
                       right=cls.get("rightAngleDetected")))
    # 斜截：n=(a,b,0)/√(a²+b²)，弦长 L(D) 随 D 单调下降；二分求 L=2
    a, b = 1.0, 2.0

    def rect_at(D):
        n = np.array([a, b, 0.0]) / math.sqrt(a * a + b * b)
        d = D / math.sqrt(a * a + b * b)
        sec = section_float(n, d)
        if len(sec["points"]) < 3:
            return None
        pts_o, _, _, _ = order_points(sec["points"], n)
        props = poly_metrics(props_pts := pts_o, n)
        if props["m"] != 4:
            return None
        chord = [props["lens"][i] for i in range(4) if props["faces"][i] in ("+z", "-z")]
        if len(chord) != 2:
            return None
        return props, float(np.mean(chord))

    lo, hi = 0.0, a + b
    for _ in range(80):
        mid = 0.5 * (lo + hi)
        got = rect_at(mid)
        if got is None:
            break
        _, ch = got
        if ch > 2.0:
            lo = mid
        else:
            hi = mid
    D = 0.5 * (lo + hi)
    got = rect_at(D)
    if got is not None:
        props, ch = got
        cls = classify(props, np.array([a, b, 0.0]) / math.sqrt(a * a + b * b))
        nrm = math.sqrt(a * a + b * b)
        sq.append(dict(kind="oblique(extrusion)", D=float(D), d=float(D / nrm),
                       n=[round(a / nrm, 9), round(b / nrm, 9), 0.0],
                       sides=int(props["m"]), quad=cls.get("quad"),
                       chord=round(float(ch), 9),
                       lens=[round(float(L2), 6) for L2 in props["lens"]],
                       right=cls.get("rightAngleDetected"),
                       note="弦长 = 2，拉伸方向长度 2 ⇒ 正方形"))
    out["square_family"] = sq

    # 3. 梯形族：n=(1,b,b)（等腰），以及 n=(1,a,b)（一般）
    trap = []
    for b in [1.2, 1.5, 2.0, 3.0, 5.0]:
        raw = np.array([1.0, b, b])
        s = float(raw.sum())
        # D ∈ (1, 2b-1)
        for D in [1.0 + (2 * b - 2) * frac for frac in (0.1, 0.3, 0.5, 0.7, 0.9)]:
            n = raw / np.linalg.norm(raw)
            d = D / np.linalg.norm(raw)
            sec = section_float(n, d)
            if len(sec["points"]) < 3:
                continue
            pts_o, _, _, _ = order_points(sec["points"], n)
            props = poly_metrics(pts_o, n)
            cls = classify(props, n)
            trap.append(dict(raw=list(raw), D=float(D), sides=int(props["m"]), quad=cls.get("quad"),
                             isosceles=cls.get("isoscelesTrapezoid"),
                             right=cls.get("rightAngleDetected"),
                             min_angle_dev=float(min(abs(x - 90.0) for x in props["angles"])) if props["m"] == 4 else None,
                             angles=[round(float(x), 4) for x in props["angles"]],
                             lens=[round(float(x), 6) for x in props["lens"]]))
        # 非等腰梯形：raw=(1, 2, b), b>2.5
    for b in [2.5, 3.0, 4.0]:
        raw = np.array([1.0, 2.0, b])
        s = float(raw.sum())
        for D in [3.0, 3.5]:
            n = raw / np.linalg.norm(raw)
            d = D / np.linalg.norm(raw)
            sec = section_float(n, d)
            if len(sec["points"]) < 3:
                continue
            pts_o, _, _, _ = order_points(sec["points"], n)
            props = poly_metrics(pts_o, n)
            cls = classify(props, n)
            if props["m"] == 4:
                trap.append(dict(raw=list(raw), D=float(D), sides=int(props["m"]), quad=cls.get("quad"),
                                 isosceles=cls.get("isoscelesTrapezoid"),
                                 right=cls.get("rightAngleDetected"),
                                 min_angle_dev=float(min(abs(x - 90.0) for x in props["angles"])),
                                 angles=[round(float(x), 4) for x in props["angles"]],
                                 lens=[round(float(x), 6) for x in props["lens"]]))
    # 近似直角梯形：raw=(eps,3,3), D=2
    for eps in [1e-1, 1e-2, 1e-3]:
        raw = np.array([eps, 3.0, 3.0])
        n = raw / np.linalg.norm(raw)
        d = 2.0 / np.linalg.norm(raw)
        sec = section_float(n, d)
        pts_o, _, _, _ = order_points(sec["points"], n)
        props = poly_metrics(pts_o, n)
        cls = classify(props, n)
        trap.append(dict(raw=[eps, 3, 3], D=2.0, sides=int(props["m"]), quad=cls.get("quad"),
                         isosceles=cls.get("isoscelesTrapezoid"),
                         right=cls.get("rightAngleDetected"),
                         min_angle_dev=float(min(abs(x - 90.0) for x in props["angles"])) if props["m"] == 4 else None,
                         angles=[round(float(x), 6) for x in props["angles"]],
                         lens=[round(float(x), 6) for x in props["lens"]]))
    out["trapezoid_family"] = trap

    # 4. 五边形平行边统计 / 正五边形不可能
    pent_rows = []
    for raw, k in [([1, 1, 2], 1.5), ([1, 2, 3], 1.8), ([2, 3, 4], 1.6), ([1, 1, 3], 2.0)]:
        raw = np.array(raw, float)
        n = raw / np.linalg.norm(raw)
        d = k / np.linalg.norm(raw)
        sec = section_float(n, d)
        pts_o, _, _, _ = order_points(sec["points"], n)
        props = poly_metrics(pts_o, n)
        cls = classify(props, n)
        pent_rows.append(dict(raw=list(raw), k=k, sides=int(props["m"]),
                              parallelPairCount=cls.get("parallelPairCount"),
                              regular=cls.get("regular"),
                              angles=[round(float(x), 4) for x in props["angles"]],
                              lens=[round(float(x), 6) for x in props["lens"]]))
    out["pentagon_family"] = pent_rows

    # 5. 正六边形唯一性：n=(1,1,1)/sqrt3 扫 d；以及随机方向 d=0 的 equiangular/regular 检查
    hex_rows = []
    n_diag = np.array([1.0, 1.0, 1.0]) / math.sqrt(3.0)
    for dd in [0.0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.55, 1.0 / math.sqrt(3.0) - 1e-3]:
        sec = section_float(n_diag, dd)
        if len(sec["points"]) < 3:
            continue
        pts_o, _, _, _ = order_points(sec["points"], n_diag)
        props = poly_metrics(pts_o, n_diag)
        cls = classify(props, n_diag)
        hex_rows.append(dict(d=float(dd), sides=int(props["m"]),
                             lens=[round(float(x), 9) for x in props["lens"]],
                             angles=[round(float(x), 6) for x in props["angles"]],
                             allSidesEqual=cls.get("allSidesEqual"),
                             allAnglesEqual=cls.get("allAnglesEqual"),
                             regular=cls.get("regular")))
    out["hexagon_body_diagonal_scan"] = hex_rows
    # 4 个体对角线方向 × 若干 d：n 分量绝对值全相等 => 应为等角（正六边形只在 d=0）
    dir_check = []
    for dv in [(1, 1, 1), (1, 1, -1), (1, -1, 1), (-1, 1, 1)]:
        v = np.array(dv, dtype=float) / math.sqrt(3.0)
        for dd in [-0.5, -0.2, 0.0, 0.2, 0.5]:
            sec = section_float(v, dd)
            if len(sec["points"]) < 3:
                continue
            pts_o, _, _, _ = order_points(sec["points"], v)
            props = poly_metrics(pts_o, v)
            cls = classify(props, v)
            dir_check.append(dict(n=list(dv), d=float(dd), sides=int(props["m"]),
                                  allAnglesEqual=cls.get("allAnglesEqual"),
                                  allSidesEqual=cls.get("allSidesEqual"),
                                  regular=cls.get("regular"),
                                  angles=[round(float(x), 6) for x in props["angles"]],
                                  lens=[round(float(x), 6) for x in props["lens"]]))
    out["hexagon_body_diagonal_directions"] = dir_check
    # 随机方向 d=0：检验“六边形等角 ⇔ |n_x|=|n_y|=|n_z|”
    rng = np.random.default_rng(SEED + 7)
    eq_viol = 0
    eq_ok = 0
    non_eq_ok = 0
    non_eq_viol = 0
    mins = 1e9
    for _ in range(20000):
        v = rng.normal(size=3)
        v = np.abs(v) + 1e-3
        v = v / np.linalg.norm(v)
        sec = section_float(v, 0.0)
        if len(sec["points"]) != 6:
            continue
        pts_o, _, _, _ = order_points(sec["points"], v)
        props = poly_metrics(pts_o, v)
        if props["m"] != 6:
            continue
        cls = classify(props, v)
        absn = np.abs(v)
        eqn = (absn.max() - absn.min()) < 1e-6
        if eqn and cls["allAnglesEqual"]:
            eq_ok += 1
        elif eqn and not cls["allAnglesEqual"]:
            eq_viol += 1
        elif (not eqn) and cls["allAnglesEqual"]:
            non_eq_viol += 1
        else:
            non_eq_ok += 1
        if not eqn:
            mins = min(mins, float(np.max(props["angles"]) - np.min(props["angles"])))
    out["hexagon_equiangular_check"] = dict(
        eq_ok=eq_ok, eq_viol=eq_viol, non_eq_ok=non_eq_ok, non_eq_viol=non_eq_viol,
        min_angle_spread_when_not_equal=float(mins) if mins < 1e9 else None)
    # 六边形中心对称检验：d=0 => 中心对称；d≠0 => 非中心对称
    sym_rows = []
    for nraw in [(1, 2, 2), (2, 3, 4), (1, 1, 1)]:
        v = np.array(nraw, dtype=float)
        v = v / np.linalg.norm(v)
        for dd in [0.0, 0.1, 0.3]:
            sec = section_float(v, dd)
            if len(sec["points"]) < 3:
                continue
            pts_o, c0, _, _ = order_points(sec["points"], v)
            props = poly_metrics(pts_o, v)
            if props["m"] != 6:
                continue
            P = props["pts"]
            c = P.mean(axis=0)
            defect = max(float(np.linalg.norm(P[i] + P[i + 3] - 2.0 * c)) for i in range(3))
            sym_rows.append(dict(n=list(nraw), d=float(dd), sides=6,
                                 symmetryDefect=round(defect, 12),
                                 symmetric=bool(defect < 1e-9)))
    out["hexagon_central_symmetry"] = sym_rows
    return out



# ----------------------------------------------------------------------------
# Lead 候选预设交叉核验（独立计算，不采信给定结论）
# ----------------------------------------------------------------------------

def check_candidate(raw, k, expect_sides):
    sec = section_exact(raw, k)
    norm = math.sqrt(sum(float(a) ** 2 for a in raw))
    n = np.array(raw, dtype=float) / norm
    d = float(k) / norm
    support = support_unit(n)
    pts = np.array([[float(c) for c in q] for q in sec["points"]], dtype=float)
    info = dict(raw=list(map(int, raw)), k=frac_str(k), normal=[round(float(x), 9) for x in n],
                d=round(float(d), 9), support=round(float(support), 9),
                distinctPoints=int(len(pts)), vertexHits=[list(v) for v in sec["vertex_hits"]],
                containedEdges=int(len(sec["contained"])))
    if len(pts) < 3:
        info.update(sides=len(pts), shape="退化（点数<3）", status="FAIL",
                    note="截面退化为点/线段/空集")
        return info
    pts_o, _, _, _ = order_points(pts, n)
    props = poly_metrics(pts_o, n)
    cls = classify(props, n)
    tmin = 1.0
    for (idx, t, pt) in sec["crossings"]:
        tmin = min(tmin, float(min(t, 1 - t)))
    min_vd = min(abs(sum(float(raw[i]) * cv[i] for i in range(3)) - float(k)) / norm
                 for cv in cube_vertices())
    interior = 0
    for q in props["pts"]:
        sat = [i for i in range(3) if abs(abs(q[i]) - 1.0) < 1e-12]
        strict = [i for i in range(3) if abs(q[i]) < 1.0 - 1e-12]
        if len(sat) == 2 and len(strict) == 1:
            interior += 1
    m = props["m"]
    if m == 3:
        shape = {"equilateral": "等边三角形", "isosceles": "等腰三角形", "scalene": "不等边三角形"}[cls["triangle"]]
        shape += "（锐角）" if cls["acute"] else "（非锐角，异常！）"
    elif m == 4:
        shape = {"square": "正方形", "rectangle": "矩形（非正方形）", "rhombus": "菱形（非正方形）",
                 "parallelogram-general": "一般平行四边形", "trapezoid": "梯形",
                 "quadrilateral-no-parallel-pair": "四边形（无平行边，异常）"}[cls["quad"]]
    elif m == 5:
        shape = "五边形（平行边组数=%d）" % cls["oppositeFacePairCount"]
    else:
        shape = "六边形（%s）" % ("正六边形" if cls.get("regular") else
                                 ("等边" if cls.get("allSidesEqual") else
                                  ("等角" if cls.get("allAnglesEqual") else "一般六边形")))
    ok = (m == expect_sides and len(sec["vertex_hits"]) == 0 and len(sec["contained"]) == 0
          and min_vd >= VIS and tmin >= VIS and interior == m)
    info.update(sides=m, shape=shape, status="PASS" if ok else "FAIL",
                lens=[round(float(x), 6) for x in props["lens"]],
                angles=[round(float(x), 4) for x in props["angles"]],
                parallelPairCount=cls["parallelPairCount"],
                oppositeFacePairCount=cls["oppositeFacePairCount"],
                rightAngleDetected=cls.get("rightAngleDetected"),
                minCrossingT=round(float(tmin), 6),
                minVertexPlaneDistance=round(float(min_vd), 6),
                dMargin=round(float(support - abs(d)), 6),
                note="")
    if not ok:
        reasons = []
        if m != expect_sides:
            reasons.append("边数 %d != 期望 %d" % (m, expect_sides))
        if len(sec["vertex_hits"]) > 0:
            reasons.append("平面经过立方体顶点 %r" % (sec["vertex_hits"],))
        if len(sec["contained"]) > 0:
            reasons.append("平面包含整条棱（%d 条）" % len(sec["contained"]))
        if min_vd < VIS:
            reasons.append("平面离顶点过近（%.6f < %.0e）" % (min_vd, VIS))
        if tmin < VIS:
            reasons.append("交点离棱端点过近（t 余量 %.6f < %.0e）" % (tmin, VIS))
        if interior != m:
            reasons.append("有 %d 个截面顶点不是棱内点" % (m - interior))
        info["note"] = "；".join(reasons)
    return info


def lead_candidates():
    cs = [
        dict(id="lead-tri-equilateral", label="等边三角形", raw=[1, 1, 1], k=F(F("2.2")), expect=3,
             given="(1,1,1), d_raw=2.2",
             comment="截长均为 0.8，三边相等。成立。"),
        dict(id="lead-tri-isosceles-given", label="等腰三角形（Lead 参数 d=15.6）", raw=[8, 8, 3],
             k=F(F("15.6")), expect=3,
             given="(8,8,3), d_raw=15.6",
             comment="独立重算：d_raw=15.6 仍是等腰三角形（截长 17/15, 17/40, 17/40；"
                     "边长 1.2104, 1.2104, 0.6010），但顶点是 (-2/15,1,1),(1,23/40,1),(1,1,23/40)，"
                     "与 Lead 列出的 (0.7,1,1)/(1,0.7,1)/(1,1,0.2) 不一致——后者对应 d_raw=16.6。"
                     "两个参数都成立，请确认前端用哪一个。"),
        dict(id="lead-tri-isosceles-fixed", label="等腰三角形（与 Lead 顶点一致：d=16.6）", raw=[8, 8, 3],
             k=F(F("16.6")), expect=3,
             given="(8,8,3), d_raw=16.6（与 Lead 所列顶点一致）",
             comment="截长 0.3,0.3,0.8；两腰 √0.73≈0.8544，底 3√2/10≈0.4243，"
                     "顶点 (0.7,1,1),(1,0.7,1),(1,1,0.2)，与 Lead 描述一致。"),
        dict(id="lead-tri-scalene", label="不等边三角形", raw=[45, 18, 10], k=F(64), expect=3,
             given="n≈(0.90932,0.36373,0.20207), d≈1.29326 / 精确 raw=(45,18,10), k=64",
             comment="精确有理化：raw=(45,18,10), k=64 即 n=(45,18,10)/√2449, d=64/√2449。截长 0.2,0.5,0.9。"),
        dict(id="lead-quad-square", label="正方形", raw=[0, 0, 1], k=F(F("0.2")), expect=4,
             given="(0,0,1), d_raw=0.2",
             comment="平面 z=0.2，2×2 正方形。成立。"),
        dict(id="lead-quad-rectangle", label="非正方形矩形", raw=[1, 1, 0], k=F(F("0.3")), expect=4,
             given="(1,1,0), d_raw=0.3",
             comment="平面平行 z 棱；截面 2 × 1.7√2 ≈ 2×2.404 矩形（非正方形）。成立。"),
        dict(id="lead-quad-rhombus", label="菱形（非正方形）", raw=[1, 1, 3], k=F(0), expect=4,
             given="(1,1,3), d_raw=0",
             comment="与核验文档预设一致：四边 2√10/3≈2.108，内角 84.26°/95.74°。成立；"
                     "条件 |n_z|>|d|+|n_x|+|n_y| 经核验为 0.9045 > 0.6030。"),
        dict(id="lead-quad-parallelogram", label="非菱形平行四边形", raw=[5, 6, 15], k=F(0), expect=4,
             given="(5,6,15), d_raw=0",
             comment="截 4 条平行 z 棱；边长 2√29/5≈2.154 与 2√10/3≈2.108，非菱形非矩形。成立。"),
        dict(id="lead-quad-trapezoid", label="梯形（非平行四边形）", raw=[1, 2, 3], k=F(F("2.5")), expect=4,
             given="(1,2,3), d_raw=2.5",
             comment="截 x±、y=1、z=1；两腰 2.236 与 2.108 不等 => 非等腰梯形，无直角。成立。"),
        dict(id="lead-pentagon", label="五边形", raw=[1, 2, 3], k=F(F("1.8")), expect=5,
             given="(1,2,3), d_raw=1.8",
             comment="成立但一个截面顶点离立方体顶点很近（t 余量约 0.033），动画上略敏感；"
                     "建议改用更稳的 (1,1,2), d_raw=1.5（本文件 pentagon 预设）。"),
        dict(id="lead-hexagon-regular", label="正六边形", raw=[1, 1, 1], k=F(0), expect=6,
             given="(1,1,1), d_raw=0",
             comment="成立：边长 √2，内角 120°。"),
        dict(id="lead-hexagon-general", label="一般六边形", raw=[2, 2, 3], k=F(F("0.4")), expect=6,
             given="(2,2,3), d_raw=0.4",
             comment="成立：6 个面全截到；|n| 分量不全相等 => 非等角，故非正六边形。"),
    ]
    rows = []
    for c in cs:
        info = check_candidate(c["raw"], c["k"], c["expect"])
        info["id"] = c["id"]
        info["label"] = c["label"]
        info["given"] = c["given"]
        info["comment"] = c["comment"]
        if info["status"] == "PASS" and c["comment"]:
            info["comment"] = c["comment"]
        rows.append(info)
    return rows


# ----------------------------------------------------------------------------
# 输出辅助
# ----------------------------------------------------------------------------

def fmt_raw(raw):
    try:
        return "[" + ",".join("%.3g" % float(x) for x in raw) + "]"
    except (TypeError, ValueError):
        return str(raw)


def table(rows, headers):
    widths = [len(h) for h in headers]
    for r in rows:
        for i, c in enumerate(r):
            widths[i] = max(widths[i], len(str(c)))
    fmt = "  ".join("{:<%d}" % w for w in widths)
    log(fmt.format(*headers))
    log("-" * (sum(widths) + 2 * (len(headers) - 1)))
    for r in rows:
        log(fmt.format(*[str(c) for c in r]))


def main():
    log("=" * 78)
    log("单位立方体 C = [-1,1]^3 截面（平面 n·x = d, |n|=1）数学核验报告")
    log("=" * 78)
    log("坐标系：立方体 C = [-1,1]^3，8 个顶点；平面 n·x = d，n 为单位法向量；")
    log("d 的有效范围：|d| < ||n||_1 = sum|n_i|（支撑函数）；|d| = 支撑值时为临界（顶点或整面）。")
    log("脚本：research/verify_presets.py")
    log("")

    # ---------------- 1. 预设验证 ----------------
    log("=" * 78)
    log("1. 代表性预设逐项验证（精确参数 + 有理数顶点计算 + 数值检查）")
    log("=" * 78)
    preset_json = []
    all_pass = True
    for p in PRESETS:
        data, checks = verify_preset(p)
        preset_json.append(data)
        ok = checks.get("PASS", False)
        all_pass = all_pass and ok
        log("")
        log("[%s] %s    expected sides = %d   PASS = %s" % (p["id"], p["name"], p["sides"], "YES" if ok else "NO"))
        log("  平面: rawNormal=(%s), k=%s   ⇒  n = %s,  d = %s" % (
            ",".join(map(str, p["raw"])), frac_str(p["k"]), p["normalExpr"], p["dExpr"]))
        if "vertices" in data and data["vertices"]:
            log("  精确顶点: " + " ; ".join(
                "(" + ",".join(data["exact"]["verticesExact"][i]) + ")" for i in range(len(data["exact"]["verticesExact"]))))
            log("  数值顶点: " + " ; ".join("(" + ", ".join("%.6f" % c for c in v) + ")" for v in data["vertices"]))
            log("  边长: " + ", ".join("%.6f" % x for x in data["sideLengths"]))
            log("  内角(度): " + ", ".join("%.4f" % x for x in data["interiorAnglesDeg"]))
            log("  每条边所在面: " + ", ".join(str(f) for f in data["facesPerSide"]))
            log("  形状: %r" % (data["properties"],))
            log("  边长和面积: area=%.6f, minEdge=%.6f, minVertexDist=%.6f" % (
                data["margins"]["area"], data["margins"]["minEdgeLength"], data["margins"]["minVertexDistance"]))
        log("  检查(a) 所有坐标∈[-1,1]: %s (max|coord|=%.3f)" % (checks.get("coordsInCube"), checks.get("maxAbsCoord", float('nan'))))
        log("  检查(b) 二维多边形/边数正确/凸: %s (sides=%s, area=%s, convex=%s)" % (
            checks.get("nondegenerate2D"), checks.get("sides"), checks.get("area"), checks.get("convex")))
        log("  检查(b') 边数 = 不同立方体面数: %s (faces=%s)" % (checks.get("sidesEqFaces"), checks.get("facesPerSide")))
        log("  检查(c) 无退化重合点: %s (minEdge=%.6f, minVertexDist=%.6f, minCrossingT=%.6f)" % (
            checks.get("noCoincidentVertices") and checks.get("noZeroLengthEdges") and checks.get("crossingsAwayFromVertices"),
            checks.get("minEdgeLength", -1), checks.get("minVertexDistance", -1), checks.get("minCrossingT", -1)))
        log("  检查(d) 平面不过顶点/棱: %s (minVertexDistToPlane=%.6f, containedEdges=%s, vertexHits=%s, dMargin=%.6f)" % (
            checks.get("planeAvoidsVertices") and checks.get("planeAvoidsEdges"),
            checks.get("minVertexPlaneDistance", -1), checks.get("containedEdgeCount", -1),
            checks.get("vertexHitCount", -1),
            checks.get("dMargin", float("nan")) if "dMargin" in checks else float("nan")))
        log("  检查(e) 形状与声明一致: %s, 不匹配原因=%s" % (
            checks.get("declaredExpectationSatisfied"), checks.get("mismatchReasons")))
        if not ok:
            log("  !!! 该预设未通过全部检查 !!!")

    # ---------------- 1.5 Lead 候选预设交叉核验 ----------------
    log("")
    log("=" * 78)
    log("1.5 Lead 候选预设交叉核验（独立重算，不采信给定结论）")
    log("=" * 78)
    lead_rows = lead_candidates()
    rows = []
    for r_ in lead_rows:
        rows.append([r_["id"], r_["given"], r_["sides"], r_["shape"], r_["status"]])
    table(rows, ["id", "Lead 给定参数", "实算边数", "实算形状", "判定"])
    log("")
    for r_ in lead_rows:
        log("[%s] %s" % (r_["id"], r_["label"]))
        log("   给定: %s" % r_["given"])
        log("   实算: 边数=%d, 形状=%s, 判定=%s" % (r_["sides"], r_["shape"], r_["status"]))
        if "lens" in r_:
            log("   边长=%r, 内角=%r, 平行边组数(几何)=%d, 对面组数=%d" % (
                r_["lens"], r_["angles"], r_["parallelPairCount"], r_["oppositeFacePairCount"]))
            log("   余量: minCrossingT=%.6f, minVertexPlaneDistance=%.6f, dMargin=%.6f" % (
                r_["minCrossingT"], r_["minVertexPlaneDistance"], r_["dMargin"]))
        if r_["note"]:
            log("   失败原因: %s" % r_["note"])
        log("   评注: %s" % r_["comment"])
        log("")
    log("  Lead 特别提出的问题：")
    log("  Q1 非正方形菱形能否作为正方体截面？")
    log("     能。构造条件（raw 平面 a x + b y + c z = D，设 c>0）：")
    log("        |D| + |a| + |b| < c   ⇔   |n_z| > |d| + |n_x| + |n_y|（单位化后）")
    log("     该条件保证平面同时截 x=±1、y=±1 而不截 z=±1；四个截面顶点落在 4 条平行 z 的棱上，")
    log("     是平行四边形；再取 |a|=|b|（如 (1,1,3)）则邻边等长 => 菱形；此时 cos(内角)=4ab/c²>0，")
    log("     内角 ≠ 90°，故非正方形。(1,1,3), d_raw=0 实测：四边 2√10/3≈2.108，角 84.26°/95.74°。")
    log("  Q2 直角梯形是否存在？等腰梯形是否存在？")
    log("     严格（非平行四边形）直角梯形【不存在】；等腰梯形【存在】。证明见第 4.3 节与文档；")
    log("     直觉：梯形要出现直角，必须某个 n_i=0，而 n_i=0 时截面是“棱方向拉伸”的矩形。")
    log("     但 n_i→0 时梯形可任意接近直角梯形（raw=(eps,3,3) 行给出数值证据），极限退化为矩形。")
    log("  Q3 五边形是否必然至少两组平行边？")
    log("     是，而且是【恰好两组】：5 个面 = 2 组完整对面 + 1 个面；对面产生 2 组平行边，")
    log("     第 5 条边不可能再平行（否则需要某个 n_i=0，而 n_i=0 时只有 4 条边）。故正五边形不可能。")
    log("  Q4 六边形是否必然三组对边平行？")
    log("     是，三组全部平行（6 个面 = 3 组对面）。注意：三组对边平行不蕴含中心对称；")
    log("     六边形中心对称当且仅当 d=0（此时立方体中心也是截面中心）；d≠0 的六边形一般不是中心对称。")
    log("")

    # ---------------- 2. 边数论证 ----------------
    log("")
    log("=" * 78)
    log("2. 边数只能为 3,4,5,6 的论证")
    log("=" * 78)
    log("(1) 立方体是凸多面体，平面与凸集的交仍是凸集，所以截面（非退化时）是凸多边形。")
    log("(2) 截面多边形的每条边都落在立方体的某一个面上：边的相对内部点不在任何棱上，")
    log("    它所在的立方体面唯一；而平面与一个平面（面）的交是一条直线，")
    log("    所以每个面最多贡献一条边，边数 ≤ 6（六个面）。")
    log("(3) 非退化二维凸多边形至少 3 条边，所以边数 ≥ 3。")
    log("(4) 3,4,5,6 都能实现：")
    log("    三角形：截去一个角（截相交于同一顶点的 3 条棱）—— 见 tri-* 预设；")
    log("    四边形：截 4 个面（2 组对面 / 1 组对面+2 个相邻面）—— 见 quad-* 预设；")
    log("    五边形：截 5 个面（2 组对面 + 1 个面）—— 见 pentagon 预设；")
    log("    六边形：截全部 6 个面 —— 见 hexagon-regular 预设。")
    log("(5) 按“截到哪些面”分类（不考虑截的位置），在立方体对称下恰有 5 种组合类型：")
    log("    三角形（8 个面三元组，两两相邻且共点）、平行四边形型四边形（3 个两对对面）、")
    log("    梯形型四边形（12 个一组对面+两相邻面）、五边形（6 个缺一面的五元组）、六边形（1 个）。")
    log("    6 个面取非空子集共 63 种，其中只有上述 8+15+6+1 = 30 种能真正被截到；")
    log("    其余（如含一整组对面却只有 3 条边等）无法构成凸多边形。")
    log("")

    # ---------------- 3. 随机抽样 ----------------
    log("=" * 78)
    log("3. 随机抽样（N = %d，n 均匀取单位球面，d 在 (-||n||_1, ||n||_1) 上均匀）" % SAMPLE_N)
    log("=" * 78)
    stats = run_sampling()
    log("边数分布: %r" % stats["side_counts"])
    log("出现过的边数集合: %r  （最大=%d，最小=%d）" % (
        sorted(stats["side_counts"].keys()), stats["max_sides"], stats["min_sides"]))
    log("跳过（数值退化/容差）样本数: %d" % stats["skipped_degenerate"])
    log("边数≠所在不同面数 的样本数: %d （应恒为 0）" % stats["sides_faces_mismatch"])
    log("所在面数 > 6 的样本数: %d （应恒为 0）" % stats["face_count_gt6"])
    log("")
    log("三角形抽样:")
    log("  类型分布: %r" % dict(stats["triangles"]))
    log("  非锐角样本数: %d （应恒为 0；即不存在直角/钝角三角形截面）" % stats["triangle_acute_violations"])
    log("  最大内角距 90° 的最小余量: %.6f°（有限抽样中可任意小：截长→0 时趋近直角，但恒为锐角）"
        % stats["min_margin_acute"])
    log("  截棱长公式 sqrt(x^2+y^2) 校验: 检查 %d 个样本, 不符 %d 个" % (
        stats["triangle_formula_checked"], stats["triangle_formula_mismatch"]))
    log("")
    log("四边形抽样:")
    log("  对面组数分布: %r （应只有 1 或 2；0 表示无平行边，本应为 0）" % dict(stats["quad_parallel_counts"]))
    log("  几何平行边组数分布: %r （与对面组数的差异只可能来自 n_i≈0 的临界情形）" % dict(stats["quad_geom_parallel_counts"]))
    log("  无平行边样本数: %d" % stats["quad_no_parallel"])
    log("  类型分布: %r" % dict(stats["quad_types"]))
    log("  出现直角的四边形样本数: %d （随机方向下应恒为 0；仅当某 n_i=0 时才会出现直角）" % stats["quad_right_angle_found"])
    log("  平行四边形的对边不等长 违规数: %d （应为 0）" % stats["quad_opposite_sides_equal_violations"])
    log("  梯形中出现直角（直角梯形）样本数: %d （应为 0：严格直角梯形不存在）" % stats["trapezoid_right_angle_found"])
    log("  梯形样本中“内角距 90°”的最小值: %.6f° （只能趋近 90°，不会等于；n_i→0 时梯形退化为矩形）" % stats["min_trap_angle_dev"])
    log("")
    log("五边形抽样:")
    log("  对面组数分布: %r （应恒为 2）" % dict(stats["pentagon_parallel_counts"]))
    log("  几何平行边组数分布: %r" % dict(stats["pentagon_geom_parallel_counts"]))
    log("")
    log("六边形抽样:")
    log("  对面组数分布: %r （应恒为 3）" % dict(stats["hexagon_parallel_counts"]))
    log("  几何平行边组数分布: %r" % dict(stats["hexagon_geom_parallel_counts"]))
    log("  (|n_x|=|n_y|=|n_z|, 全等角) 分布: %r" % dict(stats["hexagon_equiangular_pairs"]))
    log("  正则六边形样本数: %d （随机抽样几乎必然为 0；正六边形只出现在 n=±(1,1,1)/√3, d=0）" % stats["hexagon_regular_found"])
    log("  d=0 且中心对称样本数: %d；d≠0 却中心对称样本数: %d" % (
        stats["hexagon_symmetric_d0"], stats["hexagon_symmetric_dnonzero"]))
    log("")

    # ---------------- 4. 特殊族 ----------------
    log("=" * 78)
    log("4. 特殊族扫描")
    log("=" * 78)
    fam = family_scans()
    log("")
    log("(4.1) 菱形族: n=(1,1,c)/sqrt(2+c^2), d=0")
    rows = []
    for r in fam["rhombus_family"]:
        rows.append([r["c"], r["sides"], r["kind"], r["lens"], r["angles"], r["contained"],
                     r["cubeVertexCount"]])
    table(rows, ["c", "边数", "类型", "边长", "内角(度)", "含棱数", "落在立方体顶点的截面顶点数"])
    log("  结论: c>2 时为菱形（非正方形）；c=2 时退化：截面的两个顶点恰为立方体顶点")
    log("        (1,1,-1) 与 (-1,-1,1)，严格来说已不是“棱内点”截面；")
    log("        c<2 时同一平面变成六边形（c→2⁻ 时六边形两条短边趋于 0）。")
    log("        c→∞ 时菱形趋于正方形（角→90°，边→2）。")
    log("")
    log("(4.2) 正方形族")
    for r in fam["square_family"]:
        log("  %r" % r)
    log("  结论: 面平行平面 z=d (|d|<1) 给出 2×2 正方形；")
    log("  斜截正方形也存在: 平面平行于某条棱（如 n=(1,2,0)/√5），只要截出的“弦长 = 2”（= 拉伸方向长度）即得正方形；")
    log("  证明: 截面内角为 90° ⇔ 相邻两边所在面的法向分量乘积为 0 ⇔ 某个 n_i=0，")
    log("  此时平面平行于一条棱，截面 = 正方形截线 × 长度 2 的区间（矩形）；要成为正方形须弦长=2。")
    log("")
    log("(4.3) 梯形族")
    rows = []
    for r in fam["trapezoid_family"]:
        rows.append([fmt_raw(r["raw"]), round(float(r["D"]), 6), r["sides"], r["quad"], r["isosceles"], r["right"],
                     ("%.6f" % r["min_angle_dev"]) if r["min_angle_dev"] is not None else "-",
                     r["angles"]])
    table(rows, ["rawNormal", "D", "边数", "类型", "等腰", "直角", "min|角-90|", "内角"])
    log("  结论: 梯形（恰一组对边平行）存在，可为等腰（如 raw=(1,3,3), D=2）也可非等腰（raw=(1,2,b)）；")
    log("  严格直角梯形不存在：梯形若出现直角，则必有某个 n_i=0，此时截面实际是矩形（平行四边形）。")
    log("  但当 n_i→0 时梯形可以任意接近直角梯形（见 raw=(eps,3,3) 行），直到极限退化为矩形。")
    log("")
    log("(4.4) 五边形族")
    rows = []
    for r in fam["pentagon_family"]:
        rows.append([fmt_raw(r["raw"]), r["k"], r["sides"], r["parallelPairCount"], r["regular"],
                     r["angles"], r["lens"]])
    table(rows, ["rawNormal", "k", "边数", "平行边组数", "正五边形", "内角", "边长"])
    log("  结论: 五边形必截 2 组对面 + 1 个面，故恰有 2 组平行边；正五边形没有平行边，")
    log("  所以正五边形截面不存在。五边形也不可能有直角（否则某 n_i=0，边数变 4）。")
    log("")
    log("(4.5) 六边形 / 正六边形")
    rows = []
    for r in fam["hexagon_body_diagonal_scan"]:
        rows.append([round(r["d"], 9), r["sides"], r["lens"], r["angles"],
                     r["allSidesEqual"], r["allAnglesEqual"], r["regular"]])
    table(rows, ["d (n=(1,1,1)/√3)", "边数", "边长", "内角", "等边", "等角", "正六边形"])
    log("")
    log("  4 个体对角线方向 × 5 个 d 的等角性（|n 分量| 全相等 => 应全部等角 120°）：")
    rows = []
    for r_ in fam["hexagon_body_diagonal_directions"]:
        rows.append([str(r_["n"]), r_["d"], r_["sides"], r_["allAnglesEqual"], r_["allSidesEqual"],
                     r_["regular"], r_["lens"]])
    table(rows, ["n(raw)", "d", "边数", "等角", "等边", "正六边形", "边长"])
    log("")
    log("  六边形中心对称检验（中心对称 ⇔ 对顶点 P_i + P_{i+3} = 2·中心）：")
    rows = []
    for r_ in fam["hexagon_central_symmetry"]:
        rows.append([str(r_["n"]), r_["d"], r_["sides"], r_["symmetryDefect"], r_["symmetric"]])
    table(rows, ["n(raw)", "d", "边数", "对称性缺陷", "中心对称"])
    log("  证明：若六边形中心对称，关于中心 c 的中心对称把落在面 x=1 上的边映成与它平行的对边，")
    log("        而六边形中与之一边平行的只有 x=-1 面上的对边，故 2c_x-1=-1 => c_x=0；")
    log("        同理 c_y=c_z=0，于是 n·c=d 给出 d=0。反之 d=0 时立方体与平面都关于原点中心对称。")
    log("  随机方向 d=0 的等角检验: %r" % fam["hexagon_equiangular_check"])
    log("  结论: 六边形恒有 3 组平行边；六边形等角 ⇔ |n_x|=|n_y|=|n_z|（抽样与推导一致）；")
    log("  在上述条件下边长依次为 √2(1-d), √2(1+d) 交替，故正则（等边）还要求 d=0。")
    log("  即正六边形截面 ⇔ 平面过中心且法向量沿体对角线：n=±(1,1,1)/√3（及对称），d=0。")
    log("")

    # ---------------- 5. 退化情形 ----------------
    log("=" * 78)
    log("5. 退化 / 临界情形")
    log("=" * 78)
    deg = degenerate_examples()
    for r in deg:
        log("  [%s] %s" % (r["id"], r["note"]))
        log("     平面: %s, d≈%.9f" % (r["plane"], r["d"]))
        log("     去重后截面点数=%d, 维度=%s, 含有整条棱数=%d, 平面经过的顶点=%r, 面积=%s" % (
            r["distinctPoints"], r["dim"], r["containedEdges"], r["vertexHits"], r.get("area")))
        if r.get("sides", 0) >= 3 and r.get("sidesFaceCount", 0) > 0:
            log("     按“边数=不同面数”对照: 边数=%d, 不同面数=%d, 最小边长=%s" % (
                r["sides"], r.get("sidesFaceCount", -1), r.get("minEdgeLength")))
        log("     常规教学不计入: %s" % ("是（退化：点/线段/整面/顶点或棱落在截面上，动画会抖动或出现零长边）"
                                     if r["degenerate"] else "否"))
    log("")
    log("  说明：")
    log("  - |d| = ||n||_1 时平面与立方体相切：若 n 无零分量则切于一个顶点（0 维）；")
    log("    若 n 有零分量则切于一整个面（2 维，即立方体的面）。")
    log("  - 平面经过顶点 ⇒ 多边形顶点与立方体顶点重合，边数可能突变（例如 x+y+z=1 得到顶点在")
    log("    立方体顶点上的三角形）；平面包含整条棱 ⇒ 截面的边与立方体的棱重合（如 x=y 得正方形）。")
    log("  - 这些位置在参数扫描中都是孤立点/低维集，不影响“一般位置”的边数与形状分类，")
    log("    但前端动画若用固定步长扫过这些值，会看到边长/顶点数跳变或数值抖动，应避开或用容差吸附。")
    log("")

    # ---------------- 6. 结论摘要 ----------------
    log("=" * 78)
    log("6. 结论摘要")
    log("=" * 78)
    log("边数: 只能是 3,4,5,6；最多 6（六个面各最多一条边），最少 3（非退化多边形）。")
    log("三角形: 只能由截去一个角得到（截 3 条共点棱）。截长 x,y,z ⇒ 边长 sqrt(x^2+y^2) 等；")
    log("        三个内角恒为锐角（cos 顶点角 = x^2/(bc) > 0）。直角/钝角三角形截面不存在！")
    log("        等边（x=y=z）、等腰非等边、不等边都可由不同截长实现；任意锐角三角形只要三边 < 2√2 都可实现。")
    log("四边形: 每个四边形截面至少有一组平行边（4 个面中必含一组对面）—— 因此一定是（含平行四边形的）梯形。")
    log("        2 组对面 ⇒ 平行四边形（含正方形、矩形、菱形、一般平行四边形）；")
    log("        1 组对面 + 2 个相邻面 ⇒ 一般梯形，但若平面平行于一条棱（某个 n_i=0），截面其实是矩形！")
    log("        这是“只看截到哪几对面”的经典误区。")
    log("        正方形一定可以（面平行，或斜截且弦长=2）；矩形都是“棱方向拉伸”型（必有 n_i=0）；")
    log("        菱形存在（如 n=(1,1,3)/√11, d=0，内角 84.26°/95.74°）；非菱形非矩形平行四边形存在。")
    log("        梯形存在（可等腰、可非等腰）；严格直角梯形不存在，但可任意逼近（极限退化为矩形）。")
    log("五边形: 存在；必恰有 2 组平行边；正五边形不存在；五边形不可能有直角。")
    log("六边形: 存在；恒有 3 组平行边；等角 ⇔ |n_x|=|n_y|=|n_z|；正六边形 ⇔ n=±(1,1,1)/√3（对称），d=0。")
    log("“所有截面”是连续无穷多：按边数（3/4/5/6）与特殊形状归类，不能也不应枚举穷尽。")
    log("")

    # ---------------- 7. 写 presets.json ----------------
    problems = []
    if not all_pass:
        problems.append("预设验证未全部通过")
    if stats["triangle_acute_violations"] != 0:
        problems.append("抽样发现非锐角三角形")
    if stats["quad_no_parallel"] != 0:
        problems.append("抽样发现无平行边的四边形")
    if stats["trapezoid_right_angle_found"] != 0:
        problems.append("抽样发现直角梯形")
    if stats["sides_faces_mismatch"] != 0 or stats["face_count_gt6"] != 0:
        problems.append("边数与面数不一致")
    if set(stats["side_counts"].keys()) - {3, 4, 5, 6}:
        problems.append("抽样出现 3-6 以外的边数")
    if stats["quad_opposite_sides_equal_violations"] != 0:
        problems.append("平行四边形对边不等长")
    if stats["triangle_formula_mismatch"] != 0:
        problems.append("截棱长公式不符")
    if set(stats["pentagon_parallel_counts"].keys()) - {2}:
        problems.append("五边形平行边组数不是 2")
    if set(stats["hexagon_parallel_counts"].keys()) - {3}:
        problems.append("六边形平行边组数不是 3")

    doc = dict(
        meta=dict(
            title="单位立方体 C=[-1,1]^3 截面代表性预设（机器可读）",
            cube="[-1,1]^3",
            plane="n·x = d, |n|=1",
            generatedBy="research/verify_presets.py",
            verification="research/verification.txt",
            notes=[
                "normal 为数值单位法向量；d 为数值；exact 中给出精确构造：rawNormal·x = k。",
                "vertices 为按多边形顺序排列的截面顶点（在截面平面内逆/顺时针一致）。",
                "所有预设均通过：坐标∈[-1,1]、二维凸多边形、边数正确、无重合退化点、平面不经过立方体顶点或棱。",
                "d 的有效范围为 |d| < sum|normal_i|。",
            ],
            samplingSummary=dict(
                N=stats["N"], side_counts=stats["side_counts"],
                quad_parallel_counts=dict(stats["quad_parallel_counts"]),
                quad_geom_parallel_counts=dict(stats["quad_geom_parallel_counts"]),
                quad_types=dict(stats["quad_types"]),
                triangle_types=dict(stats["triangles"]),
                pentagon_parallel_counts=dict(stats["pentagon_parallel_counts"]),
                hexagon_parallel_counts=dict(stats["hexagon_parallel_counts"]),
            ),
        ),
        presets=preset_json,
        leadCandidates=lead_rows,
        degenerateExamples=deg,
        specialFamilies=dict(
            rhombusFamily=fam["rhombus_family"],
            squareFamily=fam["square_family"],
            trapezoidFamily=fam["trapezoid_family"],
            pentagonFamily=fam["pentagon_family"],
            hexagonBodyDiagonalScan=fam["hexagon_body_diagonal_scan"],
            hexagonBodyDiagonalDirections=fam["hexagon_body_diagonal_directions"],
            hexagonCentralSymmetry=fam["hexagon_central_symmetry"],
            hexagonEquiangularCheck=fam["hexagon_equiangular_check"],
        ),
        problems=problems,
    )
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)

    log("=" * 78)
    log("7. 输出文件")
    log("=" * 78)
    log("verification.txt : 本报告")
    log("presets.json     : %d 个预设（含精确参数、顶点、边长、内角、检查结果）" % len(preset_json))
    log("JSON 中的 problems 列表: %r" % (problems,))
    log("")

    with open(TXT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(OUT) + "\n")

    # 控制台只打印 ASCII 摘要，避免 Windows 控制台编码问题
    print("verify_presets.py: presets=%d, pass=%s, problems=%r" % (len(preset_json), all_pass, problems))
    print("side counts:", stats["side_counts"], "max sides:", stats["max_sides"])
    print("wrote", TXT_PATH)
    print("wrote", JSON_PATH)
    if problems:
        print("PROBLEMS:", problems)
        return 1
    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
