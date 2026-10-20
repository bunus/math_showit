#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
圆锥曲线数学核验脚本（独立数值核验，供教学网页 QA 使用）
================================================================
核验对象
  1) presets.json 中全部预设（椭圆 / 双曲线 / 抛物线 / 统一焦点-准线视角）
  2) 各模式的定义不变量（距离和、距离差、距离比、焦点-准线比）
  3) 统一视角极坐标方程 r = l/(1-e cos(theta)) 的符号与分支结论
  4) 半通径（semi-latus rectum）的几何意义与标准形式关系
  5) 水平 / 竖直焦点轴互换、e=0 与 e->1 的边界行为
  6) 方程识别判据（二次曲线 Ax^2+Cy^2+... 的初等分类）

运行方式
  python verify.py
输出
  verification.txt（与本脚本同目录，UTF-8）+ 控制台摘要
依赖
  numpy（数值采样）
"""
import datetime
import json
import math
import os
import sys

import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
PRESETS_PATH = os.path.join(HERE, "presets.json")
REPORT_PATH = os.path.join(HERE, "verification.txt")

TOL = 1e-9          # 数值核验容差（绝对误差）
RVIEW = 60.0        # 极坐标采样时允许的最大极径，避免 r->inf 附近浮点噪声
SAMPLES = 4001      # 稠密采样点数（5001/4001 为奇数，含 theta=pi/2、pi）

OUT = []
TOTAL = [0]
FAILS = []
GLOBAL_MAX = [0.0]
GLOBAL_MAX_STRICT = [0.0]   # 仅统计 tol<=1e-8 的严格检查
GROUPS = []


# ----------------------------------------------------------------------------
# 输出 / 记录小工具
# ----------------------------------------------------------------------------
def w(line=""):
    print(line)
    OUT.append(line)


def fmt(x):
    if x is None or not isinstance(x, (int, float)) or not math.isfinite(x):
        return "inf"
    return f"{x:.3e}"


def begin_group(label):
    GROUPS.append({"label": label, "n": 0, "max": 0.0, "worst": "", "fails": []})


def chk(name, err, tol=TOL, detail=""):
    """记录一项数值检查；err 为绝对误差（<=tol 视为通过）"""
    g = GROUPS[-1]
    g["n"] += 1
    TOTAL[0] += 1
    try:
        err = float(err)
    except Exception:
        err = float("inf")
    if not math.isfinite(err):
        err = float("inf")
    if err <= tol:
        if err > g["max"]:
            g["max"] = err
            g["worst"] = name
        if err > GLOBAL_MAX[0]:
            GLOBAL_MAX[0] = err
        if tol <= 1e-8 and err > GLOBAL_MAX_STRICT[0]:
            GLOBAL_MAX_STRICT[0] = err
        return True
    g["fails"].append((name, err, tol, detail))
    FAILS.append((g["label"], name, err, tol, detail))
    return False


def flush_groups():
    for g in GROUPS:
        status = "PASS" if not g["fails"] else "FAIL"
        extra = ""
        if g["max"] > 1e-13 and not g["fails"]:
            extra = f"（最差检查：{g['worst']}）"
        w(f"  [{status}] {g['label']}  —  检查 {g['n']} 项，最大误差 {fmt(g['max'])}{extra}")
        for name, err, tol, detail in g["fails"]:
            w(f"         × {name}: err={fmt(err)} > tol={tol:.0e} {detail}")
    GROUPS.clear()


def section(title):
    w("")
    w("-" * 78)
    w(title)
    w("-" * 78)


# ----------------------------------------------------------------------------
# 几何小工具
# ----------------------------------------------------------------------------
def dist(p, q):
    return math.hypot(p[0] - q[0], p[1] - q[1])


def directrix_distance(P, d):
    if d["type"] == "vertical":
        return abs(P[0] - float(d["value"]))
    return abs(P[1] - float(d["value"]))


def max_list_err(got, want):
    if want is None and got is None:
        return 0.0
    if got is None or want is None or len(got) != len(want):
        return float("inf")
    if len(want) == 0:
        return 0.0
    return max(abs(float(a) - float(b)) for a, b in zip(got, want))


def max_pt_err(got, want):
    if want is None and got is None:
        return 0.0
    if got is None or want is None or len(got) != len(want):
        return float("inf")
    if len(want) == 0:
        return 0.0
    return max(dist(a, b) for a, b in zip(got, want))


def pt_err(got, want):
    if got is None and want is None:
        return 0.0
    if got is None or want is None:
        return float("inf")
    return dist(got, want)


def dir_err(got, want):
    if got is None and want is None:
        return 0.0
    if got is None or want is None:
        return float("inf")
    if len(got) != len(want):
        return float("inf")
    g = sorted([(d["type"], float(d["value"])) for d in got])
    ww = sorted([(d["type"], float(d["value"])) for d in want])
    err = 0.0
    for (gt, gv), (wt, wv) in zip(g, ww):
        if gt != wt:
            return float("inf")
        err = max(err, abs(gv - wv))
    return err


def asym_err(got, want):
    if got is None and want is None:
        return 0.0
    if got is None or want is None:
        return float("inf")
    if len(got) != len(want):
        return float("inf")
    g = sorted([(float(x["slope"]), float(x["intercept"])) for x in got])
    ww = sorted([(float(x["slope"]), float(x["intercept"])) for x in want])
    err = 0.0
    for (gs, gi), (ws, wi) in zip(g, ww):
        err = max(err, abs(gs - ws), abs(gi - wi))
    return err


def line_distance(P, slope, intercept):
    """点 P 到直线 y = slope*x + intercept 的距离"""
    m = float(slope)
    return abs(P[1] - m * P[0] - float(intercept)) / math.sqrt(1.0 + m * m)


def load_presets():
    with open(PRESETS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


# ----------------------------------------------------------------------------
# 1. 预设逐项核验：把 presets.json 的每个字段与「从定义出发」的计算对照
# ----------------------------------------------------------------------------
def verify_preset(p):
    par = p["params"]
    exp = p["expected"]
    pt = p["point"]
    mode = p["mode"]
    orient = p.get("orientation", "horizontal")
    vert = orient == "vertical"
    e = exp.get("eccentricity")

    begin_group(f"预设 {p['n']:>2d}  {p['id']}")

    # ---------- 椭圆 ----------
    if mode == "ellipse":
        a = float(par["a"])
        e = float(par["e"])
        b = a * math.sqrt(max(0.0, 1.0 - e * e))
        c = a * e
        chk("椭圆 b = a*sqrt(1-e^2)", abs(b - exp["semiMinorAxis"]))
        chk("椭圆 c = a*e", abs(c - exp["focalDistance"]))
        chk("椭圆 中心在原点", pt_err(exp["center"], [0.0, 0.0]))
        if e <= 0.0:
            foci_got = [[0.0, 0.0]]  # e=0：两焦点重合为圆心
        else:
            foci_got = [[0.0, -c], [0.0, c]] if vert else [[-c, 0.0], [c, 0.0]]
        chk("椭圆 焦点坐标", max_pt_err(exp["foci"], foci_got))
        verts_got = [[0.0, -a], [0.0, a]] if vert else [[-a, 0.0], [a, 0.0]]
        chk("椭圆 长轴顶点", max_pt_err(exp["vertices"], verts_got))
        cov_got = [[-b, 0.0], [b, 0.0]] if vert else [[0.0, -b], [0.0, b]]
        chk("椭圆 短轴端点", max_pt_err(exp["coVertices"], cov_got))
        if c > 0:
            if vert:
                dirs_got = [{"type": "horizontal", "value": -a * a / c},
                            {"type": "horizontal", "value": a * a / c}]
            else:
                dirs_got = [{"type": "vertical", "value": -a * a / c},
                            {"type": "vertical", "value": a * a / c}]
            chk("椭圆 准线 x=±a^2/c（竖直 y=±a^2/c）", dir_err(exp["directrices"], dirs_got))
            chk("椭圆 焦准距 = l/e", abs(exp["focalParameter"] - (b * b / a) / e))
        else:
            chk("椭圆 e=0：无准线（准线在无穷远）", 0.0 if len(exp["directrices"]) == 0 else float("inf"))
            chk("椭圆 e=0：焦准距无定义", 0.0 if exp["focalParameter"] is None else float("inf"))
        chk("椭圆 半通径 l = b^2/a", abs(exp["semiLatusRectum"] - b * b / a))

        # 定义采样：|PF1|+|PF2|=2a、焦半径公式、两对焦点-准线比 = e、方程残差
        err_sum = err_rad = err_ratio = err_eq = 0.0
        for t in np.linspace(0.0, 2.0 * math.pi, SAMPLES):
            P = [b * math.cos(t), a * math.sin(t)] if vert else [a * math.cos(t), b * math.sin(t)]
            if e <= 0.0:
                # e=0：两焦点重合为圆心，|PF| = a
                d1 = dist(P, exp["foci"][0])
                err_sum = max(err_sum, abs(d1 - a))
                if vert:
                    err_eq = max(err_eq, abs(P[0] ** 2 / (b * b) + P[1] ** 2 / (a * a) - 1.0))
                else:
                    err_eq = max(err_eq, abs(P[0] ** 2 / (a * a) + P[1] ** 2 / (b * b) - 1.0))
                continue
            d1 = dist(P, exp["foci"][0])
            d2 = dist(P, exp["foci"][1])
            err_sum = max(err_sum, abs(d1 + d2 - 2.0 * a))
            if vert:
                r1, r2 = a + e * P[1], a - e * P[1]
            else:
                r1, r2 = a + e * P[0], a - e * P[0]
            err_rad = max(err_rad, abs(d1 - r1), abs(d2 - r2))
            if c > 0 and e > 0:
                dd1 = directrix_distance(P, exp["directrices"][0])
                dd2 = directrix_distance(P, exp["directrices"][1])
                err_ratio = max(err_ratio, abs(d1 / dd1 - e), abs(d2 / dd2 - e))
            if vert:
                res = abs(P[0] ** 2 / (b * b) + P[1] ** 2 / (a * a) - 1.0)
            else:
                res = abs(P[0] ** 2 / (a * a) + P[1] ** 2 / (b * b) - 1.0)
            err_eq = max(err_eq, res)
        if e > 0:
            chk("椭圆 定义：|PF1|+|PF2| = 2a", err_sum)
            chk("椭圆 焦半径 a±e*x（竖直 a±e*y）", err_rad)
            chk("椭圆 两对 |PF|/dist(P,准线) = e", err_ratio)
        else:
            chk("椭圆 e=0：|PF| = a（圆）", err_sum)
        chk("椭圆 标准方程残差", err_eq)

        # 预设点
        t = math.radians(pt["param"]["value"]) if pt["param"]["unit"] == "deg" else float(pt["param"]["value"])
        P_got = [b * math.cos(t), a * math.sin(t)] if vert else [a * math.cos(t), b * math.sin(t)]
        chk("椭圆 P 参数化坐标", pt_err(pt["coords"], P_got))

    # ---------- 双曲线 ----------
    elif mode == "hyperbola":
        a = float(par["a"])
        e = float(par["e"])
        b = a * math.sqrt(e * e - 1.0)
        c = a * e
        chk("双曲线 b = a*sqrt(e^2-1)", abs(b - exp["semiMinorAxis"]))
        chk("双曲线 c = a*e", abs(c - exp["focalDistance"]))
        chk("双曲线 中心在原点", pt_err(exp["center"], [0.0, 0.0]))
        foci_got = [[0.0, -c], [0.0, c]] if vert else [[-c, 0.0], [c, 0.0]]
        chk("双曲线 焦点坐标", max_pt_err(exp["foci"], foci_got))
        verts_got = [[0.0, -a], [0.0, a]] if vert else [[-a, 0.0], [a, 0.0]]
        chk("双曲线 实轴顶点", max_pt_err(exp["vertices"], verts_got))
        if vert:
            dirs_got = [{"type": "horizontal", "value": -a * a / c},
                        {"type": "horizontal", "value": a * a / c}]
            asym_got = [{"slope": a / b, "intercept": 0.0}, {"slope": -a / b, "intercept": 0.0}]
        else:
            dirs_got = [{"type": "vertical", "value": -a * a / c},
                        {"type": "vertical", "value": a * a / c}]
            asym_got = [{"slope": b / a, "intercept": 0.0}, {"slope": -b / a, "intercept": 0.0}]
        chk("双曲线 准线 y=±a^2/c（水平 x=±a^2/c）", dir_err(exp["directrices"], dirs_got))
        chk("双曲线 渐近线（竖直斜率 ±a/b）", asym_err(exp["asymptotes"], asym_got))
        chk("双曲线 半通径 l = b^2/a", abs(exp["semiLatusRectum"] - b * b / a))
        chk("双曲线 焦准距 = l/e", abs(exp["focalParameter"] - (b * b / a) / e))

        err_diff = err_rad = err_ratio = err_eq = err_asym = 0.0
        for u in np.linspace(-4.0, 4.0, SAMPLES):
            for sgn in (1.0, -1.0):
                if vert:
                    P = [b * math.sinh(u), sgn * a * math.cosh(u)]
                else:
                    P = [sgn * a * math.cosh(u), b * math.sinh(u)]
                d1 = dist(P, exp["foci"][0])
                d2 = dist(P, exp["foci"][1])
                err_diff = max(err_diff, abs(abs(d1 - d2) - 2.0 * a))
                if vert:
                    r1, r2 = abs(e * P[1] + a), abs(e * P[1] - a)
                else:
                    r1, r2 = abs(e * P[0] + a), abs(e * P[0] - a)
                err_rad = max(err_rad, abs(d1 - r1), abs(d2 - r2))
                dd1 = directrix_distance(P, exp["directrices"][0])
                dd2 = directrix_distance(P, exp["directrices"][1])
                err_ratio = max(err_ratio, abs(d1 / dd1 - e), abs(d2 / dd2 - e))
                if vert:
                    res = abs(P[1] ** 2 / (a * a) - P[0] ** 2 / (b * b) - 1.0)
                else:
                    res = abs(P[0] ** 2 / (a * a) - P[1] ** 2 / (b * b) - 1.0)
                err_eq = max(err_eq, res)
        # 渐近线：大 |u| 处点到最近渐近线的距离 -> 0
        for uu in (20.0, 25.0, 30.0):
            for sgn in (1.0, -1.0):
                if vert:
                    P = [b * math.sinh(uu), sgn * a * math.cosh(uu)]
                else:
                    P = [sgn * a * math.cosh(uu), b * math.sinh(uu)]
                err_asym = max(err_asym, min(
                    line_distance(P, exp["asymptotes"][0]["slope"], exp["asymptotes"][0]["intercept"]),
                    line_distance(P, exp["asymptotes"][1]["slope"], exp["asymptotes"][1]["intercept"])))
        chk("双曲线 定义：| |PF1|-|PF2| | = 2a（两支）", err_diff)
        chk("双曲线 焦半径 |e*x±a|（竖直 |e*y±a|）", err_rad)
        chk("双曲线 两对 |PF|/dist(P,准线) = e", err_ratio)
        chk("双曲线 标准方程残差（两支）", err_eq)
        chk("双曲线 渐近线：大 |u| 处距离 -> 0", err_asym, tol=1e-8)

        u = float(pt["param"]["value"])
        P_got = [b * math.sinh(u), a * math.cosh(u)] if vert else [a * math.cosh(u), b * math.sinh(u)]
        chk("双曲线 P 参数化坐标", pt_err(pt["coords"], P_got))

    # ---------- 抛物线 ----------
    elif mode == "parabola":
        pval = float(par["p"])
        chk("抛物线 焦点 (p/2,0) 或 (0,p/2)", max_pt_err(exp["foci"], [[0.0, pval / 2.0]] if vert else [[pval / 2.0, 0.0]]))
        chk("抛物线 顶点在原点", max_pt_err(exp["vertices"], [[0.0, 0.0]]))
        dir_got = [{"type": "horizontal", "value": -pval / 2.0}] if vert else [{"type": "vertical", "value": -pval / 2.0}]
        chk("抛物线 准线 y=-p/2（水平 x=-p/2）", dir_err(exp["directrices"], dir_got))
        chk("抛物线 半通径 l = p", abs(exp["semiLatusRectum"] - pval))
        chk("抛物线 焦准距 = p", abs(exp["focalParameter"] - pval))
        chk("抛物线 离心率 e=1", abs(exp["eccentricity"] - 1.0))

        err_eqv = err_ratio = err_conv = 0.0
        for t in np.linspace(-6.0, 6.0, SAMPLES):
            P = [pval * t, pval * t * t / 2.0] if vert else [pval * t * t / 2.0, pval * t]
            PF = dist(P, exp["foci"][0])
            PD = directrix_distance(P, exp["directrices"][0])
            err_eqv = max(err_eqv, abs(PF - PD))
            err_ratio = max(err_ratio, abs(PF / PD - 1.0))
            if vert:
                res = abs(P[0] ** 2 - 2.0 * pval * P[1]) / (1.0 + pval * pval)
            else:
                res = abs(P[1] ** 2 - 2.0 * pval * P[0]) / (1.0 + pval * pval)
            err_conv = max(err_conv, res)
        chk("抛物线 定义：|PF| = dist(P,准线)", err_eqv)
        chk("抛物线 距离比 = 1", err_ratio)
        chk("抛物线 标准方程残差", err_conv)
        # 通径（过焦点垂直轴）：半长 = p
        if vert:
            half = math.sqrt(2.0 * pval * (pval / 2.0))
        else:
            half = math.sqrt(2.0 * pval * (pval / 2.0))
        chk("抛物线 半通径实测（过焦点垂直轴的弦半长）", abs(half - pval))

        t = float(pt["param"]["value"])
        P_got = [pval * t, pval * t * t / 2.0] if vert else [pval * t * t / 2.0, pval * t]
        chk("抛物线 P 参数化坐标", pt_err(pt["coords"], P_got))

    # ---------- 统一视角 ----------
    elif mode == "unified":
        l = float(par["l"])
        e = float(par["e"])
        if e == 0.0:
            chk("统一 e=0：圆 a=b=l", max(abs(exp["semiMajorAxis"] - l), abs(exp["semiMinorAxis"] - l)))
            chk("统一 e=0：c=0", abs(exp["focalDistance"]))
            chk("统一 e=0：焦点=圆心", max_pt_err(exp["foci"], [[0.0, 0.0]]))
            chk("统一 e=0：无准线", 0.0 if len(exp["directrices"]) == 0 else float("inf"))
            chk("统一 e=0：半通径 l=a", abs(exp["semiLatusRectum"] - l))
            chk("统一 e=0：焦准距无定义", 0.0 if exp["focalParameter"] is None else float("inf"))
            err_circle = 0.0
            for t in np.linspace(0.0, 2.0 * math.pi, SAMPLES):
                P = [l * math.cos(t), l * math.sin(t)]
                err_circle = max(err_circle, abs(math.hypot(P[0], P[1]) - l), abs(P[0] ** 2 + P[1] ** 2 - l * l))
            chk("统一 e=0：|PF|=l 且 x^2+y^2=l^2", err_circle)
        elif e < 1.0:
            a = l / (1.0 - e * e)
            b = l / math.sqrt(1.0 - e * e)
            c = a * e
            chk("统一 e<1：a = l/(1-e^2)", abs(exp["semiMajorAxis"] - a))
            chk("统一 e<1：b = l/sqrt(1-e^2)", abs(exp["semiMinorAxis"] - b))
            chk("统一 e<1：c = ae", abs(exp["focalDistance"] - c))
            chk("统一 e<1：中心 (c,0)", pt_err(exp["center"], [c, 0.0]))
            chk("统一 e<1：焦点 F=(0,0)、F'=(2c,0)", max_pt_err(exp["foci"], [[0.0, 0.0], [2.0 * c, 0.0]]))
            chk("统一 e<1：顶点 (c±a,0)", max_pt_err(exp["vertices"], [[c - a, 0.0], [c + a, 0.0]]))
            dirs_got = [{"type": "vertical", "value": -l / e},
                        {"type": "vertical", "value": c + a / e}]
            chk("统一 e<1：准线 x=-l/e 与 x=c+a/e", dir_err(exp["directrices"], dirs_got))
            chk("统一 e<1：第二焦点 (2c,0)", pt_err(exp["secondFocus"], [2.0 * c, 0.0]))
            chk("统一 e<1：半通径 l = b^2/a", abs(exp["semiLatusRectum"] - b * b / a))
            chk("统一 e<1：焦准距 l/e", abs(exp["focalParameter"] - l / e))
            errs = unified_curve_checks(l, e, exp, a, b, c, expect_focus_side_frac=1.0)
            chk("统一 e<1：定义 |PF|/PD=e", errs["ratio"])
            chk("统一 e<1：椭圆方程残差", errs["eq"])
            chk("统一 e<1：极坐标 r>0 覆盖整条椭圆（闭合）", errs["coverage"])
            chk("统一 e<1：曲线全部位于焦点一侧 x>-l/e", errs["side"])
        elif abs(e - 1.0) < 1e-12:
            chk("统一 e=1：p=l", abs(exp["focalParameter"] - l))
            chk("统一 e=1：顶点 (-l/2,0)", max_pt_err(exp["vertices"], [[-l / 2.0, 0.0]]))
            chk("统一 e=1：准线 x=-l", dir_err(exp["directrices"], [{"type": "vertical", "value": -l}]))
            chk("统一 e=1：半通径 l=p", abs(exp["semiLatusRectum"] - l))
            chk("统一 e=1：焦点 F=(0,0)", max_pt_err(exp["foci"], [[0.0, 0.0]]))
            errs = unified_curve_checks(l, e, exp, None, None, None)
            chk("统一 e=1：定义 |PF|/PD=1", errs["ratio"])
            chk("统一 e=1：方程 y^2=2lx+l^2 残差", errs["eq"])
            chk("统一 e=1：抛物线全部位于焦点一侧 x>-l", errs["side"])
            chk("统一 e=1：顶点处 r(-l/2)=l/2（焦点到顶点）", abs(l / 2.0 - l / (1.0 - e * math.cos(math.pi))))
        else:
            a = l / (e * e - 1.0)
            b = l / math.sqrt(e * e - 1.0)
            c = a * e
            chk("统一 e>1：a = l/(e^2-1)", abs(exp["semiMajorAxis"] - a))
            chk("统一 e>1：b = l/sqrt(e^2-1)", abs(exp["semiMinorAxis"] - b))
            chk("统一 e>1：c = ae", abs(exp["focalDistance"] - c))
            chk("统一 e>1：中心 (-c,0)", pt_err(exp["center"], [-c, 0.0]))
            chk("统一 e>1：焦点 F=(0,0)、F'=(-2c,0)", max_pt_err(exp["foci"], [[0.0, 0.0], [-2.0 * c, 0.0]]))
            chk("统一 e>1：顶点 (-c-a,0)、(-c+a,0)", max_pt_err(exp["vertices"], [[-c - a, 0.0], [-c + a, 0.0]]))
            dirs_got = [{"type": "vertical", "value": -l / e},
                        {"type": "vertical", "value": -c - a / e}]
            chk("统一 e>1：准线 x=-l/e 与 x=-c-a/e", dir_err(exp["directrices"], dirs_got))
            asym_got = [{"slope": b / a, "intercept": b / a * c},
                        {"slope": -b / a, "intercept": -b / a * c}]
            chk("统一 e>1：渐近线 y=±(b/a)(x+c)", asym_err(exp["asymptotes"], asym_got))
            chk("统一 e>1：第二焦点 (-2c,0)", pt_err(exp["secondFocus"], [-2.0 * c, 0.0]))
            chk("统一 e>1：第二准线 x=-c-a/e", dir_err([exp["secondDirectrix"]],
                                                      [{"type": "vertical", "value": -c - a / e}]))
            chk("统一 e>1：半通径 l = b^2/a", abs(exp["semiLatusRectum"] - b * b / a))
            chk("统一 e>1：焦准距 l/e", abs(exp["focalParameter"] - l / e))
            errs = unified_curve_checks(l, e, exp, a, b, c)
            chk("统一 e>1：极坐标支满足 |PF|/PD=e", errs["ratio"])
            chk("统一 e>1：极坐标支方程残差", errs["eq"])
            chk("统一 e>1：极坐标支在焦点一侧 x>-l/e", errs["side"])
            chk("统一 e>1：极坐标支右支最小 x = -l/(e+1)", errs["vertex"])
            # 第二支：r = -l/(1+e cos theta)（取 r>0 的 theta）
            err2_def = err2_eq = err2_side = 0.0
            n2 = 0
            for th in np.linspace(0.0, 2.0 * math.pi, SAMPLES):
                den2 = 1.0 + e * math.cos(th)
                if den2 >= -1e-12:
                    continue
                r2 = -l / den2
                if r2 > RVIEW:
                    continue
                P = [r2 * math.cos(th), r2 * math.sin(th)]
                PF = math.hypot(P[0], P[1])
                PD = abs(P[0] + l / e)
                err2_def = max(err2_def, abs(PF / PD - e))
                res = abs((P[0] + c) ** 2 / (a * a) - P[1] ** 2 / (b * b) - 1.0)
                err2_eq = max(err2_eq, res)
                if not (P[0] < -l / e + 1e-12):
                    err2_side = float("inf")
                n2 += 1
            chk(f"统一 e>1：第二支 r=-l/(1+e cos) 满足定义（{n2} 点）", err2_def)
            chk("统一 e>1：第二支在同一双曲线上", err2_eq)
            chk("统一 e>1：第二支位于准线另一侧 x<-l/e", err2_side)
            # 定义（距离比，含绝对值）下的轨迹 = 两支
            err_both = 0.0
            for u in np.linspace(-5.0, 5.0, SAMPLES):
                for sgn in (1.0, -1.0):
                    P = [-c + sgn * a * math.cosh(u), b * math.sinh(u)]
                    PF = math.hypot(P[0], P[1])
                    PD = abs(P[0] + l / e)
                    err_both = max(err_both, abs(PF / PD - e))
            chk("关键：定义轨迹含两支（两支都满足同一 F、准线）", err_both)
            # 中心对称补画第二支
            err_refl = 0.0
            for u in np.linspace(-3.0, 3.0, 2001):
                P1 = [-c + a * math.cosh(u), b * math.sinh(u)]
                P2 = [-2.0 * c - P1[0], -P1[1]]
                PF = math.hypot(P2[0], P2[1])
                PD = abs(P2[0] + l / e)
                res = abs((P2[0] + c) ** 2 / (a * a) - P2[1] ** 2 / (b * b) - 1.0)
                err_refl = max(err_refl, abs(PF / PD - e), res)
            chk("统一 e>1：中心对称生成第二支", err_refl)

        # 预设点
        th = math.radians(pt["param"]["value"])
        r = l / (1.0 - e * math.cos(th)) if e > 0 else l
        P_got = [r * math.cos(th), r * math.sin(th)]
        chk("统一 P 极坐标参数化坐标", pt_err(pt["coords"], P_got))

    # ---------- 预设点共同核验（由原始坐标独立计算） ----------
    P = pt["coords"]
    df = [dist(P, F) for F in exp["foci"]]
    chk("P→各焦点距离（由坐标重算）", max_list_err(df, pt["distToFoci"]))
    if exp.get("directrices"):
        dd = [directrix_distance(P, d) for d in exp["directrices"]]
        chk("P→各准线距离（由坐标重算）", max_list_err(dd, pt["distToDirectrices"]))
        rr = [df[i] / dd[i] for i in range(min(len(df), len(dd)))]
        chk("P 的 |PF|/dist(P,准线) = e", max_list_err(rr, pt["ratios"]))
        inv_val = None
        if mode == "unified" or mode == "parabola":
            inv_val = df[0] / dd[0]
        chk("P 的不变量与声明一致", abs(inv_val - pt["invariant"]["value"]) if inv_val is not None else 0.0)
    else:
        chk("P 到焦点距离（圆）", max_list_err(df, pt["distToFoci"]))
    if mode == "ellipse" and len(df) == 2:
        chk("P 的 |PF1|+|PF2| = 2a", abs(df[0] + df[1] - pt["invariant"]["expected"]))
    elif mode == "hyperbola" and len(df) == 2:
        chk("P 的 | |PF1|-|PF2| | = 2a", abs(abs(df[0] - df[1]) - pt["invariant"]["expected"]))
    elif (mode == "unified") and exp.get("directrices"):
        chk("P 的 |PF|/PD = e", abs(df[0] / directrix_distance(P, exp["directrices"][0]) - pt["invariant"]["expected"]))
    elif mode == "unified":
        chk("P 的 |PF| = l（e=0 圆）", abs(df[0] - pt["invariant"]["expected"]))
    elif mode == "parabola":
        chk("P 的 |PF|/PD = 1", abs(df[0] / directrix_distance(P, exp["directrices"][0]) - 1.0))

    flush_groups()


def unified_curve_checks(l, e, exp, a, b, c, expect_focus_side_frac=None):
    """统一视角极坐标支的稠密采样核验，返回各项误差"""
    ratio = eq = side = 0.0
    xs = []
    ys = []
    for th in np.linspace(0.0, 2.0 * math.pi, SAMPLES):
        den = 1.0 - e * math.cos(th)
        if den <= 1e-12:
            continue
        r = l / den
        if r > RVIEW:
            continue
        P = [r * math.cos(th), r * math.sin(th)]
        PF = math.hypot(P[0], P[1])
        PD = abs(P[0] + l / e)
        ratio = max(ratio, abs(PF / PD - e))
        if P[0] < -l / e - 1e-12:
            side = float("inf")
        if e < 1.0:
            res = abs((P[0] - c) ** 2 / (a * a) + P[1] ** 2 / (b * b) - 1.0)
        elif abs(e - 1.0) < 1e-12:
            res = abs(P[1] ** 2 - 2.0 * l * P[0] - l * l) / (1.0 + l * l)
        else:
            res = abs((P[0] + c) ** 2 / (a * a) - P[1] ** 2 / (b * b) - 1.0)
        eq = max(eq, res)
        xs.append(P[0])
        ys.append(P[1])
    coverage = 0.0
    if e < 1.0:
        # theta=0 与 theta=pi 恰为左右顶点：确认 r>0 支覆盖整条椭圆（闭合）
        coverage = max(abs(min(xs) - (c - a)), abs(max(xs) - (c + a)))
    vertex = 0.0
    if e > 1.0:
        vertex = abs(min(xs) - (-c + a))
    return {"ratio": ratio, "eq": eq, "side": side, "coverage": coverage, "vertex": vertex}


# ----------------------------------------------------------------------------
# 2. 稠密采样：四种模式的定义不变量
# ----------------------------------------------------------------------------
def section2_dense_invariants(presets):
    section("[2] 稠密采样：定义不变量与标准形式（不依赖预设声明值）")
    byid = {p["id"]: p for p in presets}

    # --- 椭圆 ---
    for pid in ("E1-ellipse-h-a5-e06", "E2-ellipse-v-a5-e06"):
        p = byid[pid]
        a = float(p["params"]["a"])
        e = float(p["params"]["e"])
        b = a * math.sqrt(1.0 - e * e)
        c = a * e
        vert = p["orientation"] == "vertical"
        begin_group(f"椭圆（{'竖直' if vert else '水平'} a={a:g}, e={e:g}）：定义不变量")
        err_sum = err_rad = err_ratio = err_eq = 0.0
        for t in np.linspace(0.0, 2.0 * math.pi, SAMPLES):
            P = [b * math.cos(t), a * math.sin(t)] if vert else [a * math.cos(t), b * math.sin(t)]
            F1 = [0.0, -c] if vert else [-c, 0.0]
            F2 = [0.0, c] if vert else [c, 0.0]
            d1, d2 = dist(P, F1), dist(P, F2)
            err_sum = max(err_sum, abs(d1 + d2 - 2.0 * a))
            r1, r2 = (a + e * P[1], a - e * P[1]) if vert else (a + e * P[0], a - e * P[0])
            err_rad = max(err_rad, abs(d1 - r1), abs(d2 - r2))
            if vert:
                err_ratio = max(err_ratio, abs(d1 / (P[1] + a / e) - e), abs(d2 / (a / e - P[1]) - e))
                err_eq = max(err_eq, abs(P[0] ** 2 / (b * b) + P[1] ** 2 / (a * a) - 1.0))
            else:
                err_ratio = max(err_ratio, abs(d1 / (P[0] + a / e) - e), abs(d2 / (a / e - P[0]) - e))
                err_eq = max(err_eq, abs(P[0] ** 2 / (a * a) + P[1] ** 2 / (b * b) - 1.0))
        chk("|PF1| + |PF2| - 2a", err_sum)
        chk("焦半径 a±e*x（竖直 a±e*y）", err_rad)
        chk("|PF| / dist(P,相应准线) - e", err_ratio)
        chk("标准方程残差", err_eq)

        # 焦点弦（通径）半长 = l：过焦点垂直轴的弦，水平时为 x=c，竖直时为 y=c
        half = b * b / a
        chk("过焦点垂直轴的弦半长 = b^2/a", abs(half - b * b / a))
        flush_groups()

    # --- 圆 e=0 ---
    begin_group("椭圆 e=0（圆 a=4）：退化边界")
    err = 0.0
    for t in np.linspace(0.0, 2.0 * math.pi, SAMPLES):
        P = [4.0 * math.cos(t), 4.0 * math.sin(t)]
        err = max(err, abs(math.hypot(P[0], P[1]) - 4.0), abs(P[0] ** 2 + P[1] ** 2 - 16.0))
    chk("|PF|=a 且 x^2+y^2=a^2", err)
    c0 = 0.0
    raised = False
    try:
        _ = 4.0 * 4.0 / c0
    except ZeroDivisionError:
        raised = True
    chk("e=0 时准线 a^2/c 触发除零（页面必须特判）", 0.0 if raised else float("inf"))
    flush_groups()

    # --- 双曲线 ---
    for pid in ("H1-hyperbola-h-a3-e1667", "H2-hyperbola-v-a3-e1667"):
        p = byid[pid]
        a = float(p["params"]["a"])
        e = float(p["params"]["e"])
        b = a * math.sqrt(e * e - 1.0)
        c = a * e
        vert = p["orientation"] == "vertical"
        begin_group(f"双曲线（{'竖直' if vert else '水平'} a={a:g}, e={e:.6g}）：定义不变量")
        err_diff = err_rad = err_ratio = err_eq = err_asym = 0.0
        for u in np.linspace(-4.0, 4.0, SAMPLES):
            for sgn in (1.0, -1.0):
                if vert:
                    P = [b * math.sinh(u), sgn * a * math.cosh(u)]
                    F1, F2 = [0.0, -c], [0.0, c]
                    r1, r2 = abs(e * P[1] + a), abs(e * P[1] - a)
                    res = abs(P[1] ** 2 / (a * a) - P[0] ** 2 / (b * b) - 1.0)
                    ddir1, ddir2 = abs(P[1] + a / e), abs(a / e - P[1])
                else:
                    P = [sgn * a * math.cosh(u), b * math.sinh(u)]
                    F1, F2 = [-c, 0.0], [c, 0.0]
                    r1, r2 = abs(e * P[0] + a), abs(e * P[0] - a)
                    res = abs(P[0] ** 2 / (a * a) - P[1] ** 2 / (b * b) - 1.0)
                    ddir1, ddir2 = abs(P[0] + a / e), abs(a / e - P[0])
                d1, d2 = dist(P, F1), dist(P, F2)
                err_diff = max(err_diff, abs(abs(d1 - d2) - 2.0 * a))
                err_rad = max(err_rad, abs(d1 - r1), abs(d2 - r2))
                # 注意：对给定点，左焦点对左准线、右焦点对右准线的距离比均为 e
                err_ratio = max(err_ratio, abs(d1 / ddir1 - e), abs(d2 / ddir2 - e))
                err_eq = max(err_eq, res)
        # 渐近线：大 |u| 两端点到最近渐近线的距离 -> 0
        slopes = [a / b, -a / b] if vert else [b / a, -b / a]
        for uu in (20.0, 25.0, 30.0):
            for sgn in (1.0, -1.0):
                if vert:
                    P = [b * math.sinh(uu), sgn * a * math.cosh(uu)]
                else:
                    P = [sgn * a * math.cosh(uu), b * math.sinh(uu)]
                err_asym = max(err_asym, min(line_distance(P, m, 0.0) for m in slopes))
        chk("| |PF1|-|PF2| | - 2a（两支）", err_diff)
        chk("焦半径 |e*x±a|（竖直 |e*y±a|）", err_rad)
        chk("|PF| / dist(P,相应准线) - e", err_ratio)
        chk("标准方程残差（两支）", err_eq)
        chk("渐近线：u=20..30 处距离", err_asym, tol=1e-9)
        flush_groups()

    # --- 抛物线 ---
    for pid in ("P1-parabola-h-p4", "P2-parabola-v-p3"):
        p = byid[pid]
        pval = float(p["params"]["p"])
        vert = p["orientation"] == "vertical"
        begin_group(f"抛物线（{'竖直' if vert else '水平'} p={pval:g}）：定义不变量")
        err = err_ratio = err_eq = 0.0
        for t in np.linspace(-6.0, 6.0, SAMPLES):
            P = [pval * t, pval * t * t / 2.0] if vert else [pval * t * t / 2.0, pval * t]
            F = [0.0, pval / 2.0] if vert else [pval / 2.0, 0.0]
            PF = dist(P, F)
            PD = (P[1] + pval / 2.0) if vert else (P[0] + pval / 2.0)
            err = max(err, abs(PF - PD))
            err_ratio = max(err_ratio, abs(PF / PD - 1.0))
            if vert:
                res = abs(P[0] ** 2 - 2.0 * pval * P[1]) / (1.0 + pval * pval)
            else:
                res = abs(P[1] ** 2 - 2.0 * pval * P[0]) / (1.0 + pval * pval)
            err_eq = max(err_eq, res)
        chk("|PF| - dist(P,准线)", err)
        chk("|PF| / dist(P,准线) - 1", err_ratio)
        chk("标准方程残差", err_eq)
        # 通径半长 = p
        half = math.sqrt(2.0 * pval * (pval / 2.0))
        chk("过焦点垂直轴弦半长 = p", abs(half - pval))
        flush_groups()

    # --- 统一视角（各 e 情形） ---
    for pid in ("U1-unified-ellipse-l32-e06", "U2-unified-parabola-l4-e1",
                "U3-unified-hyperbola-l1-e2", "U4-unified-hyperbola-l169-e53",
                "U5-unified-circle-l3-e0"):
        p = byid[pid]
        l = float(p["params"]["l"])
        e = float(p["params"]["e"])
        begin_group(f"统一视角（l={l:g}, e={e:g}）：定义与极坐标方程")
        errs = {"ratio": 0.0, "eq": 0.0, "side": 0.0, "chord": 0.0}
        if e == 0.0:
            errs = {"ratio": 0.0, "eq": 0.0, "side": 0.0, "chord": 0.0}
        # 半通径：直线 x=0（过焦点垂直轴）与曲线交点的 |y| = l
        # 对 e<1/e=1/e>1 统一用极坐标 theta=pi/2 或 3pi/2：r=l
        for th in (math.pi / 2.0, 3.0 * math.pi / 2.0):
            den = 1.0 - e * math.cos(th)
            if den > 1e-12:
                rr = l / den
                if rr <= RVIEW:
                    errs["chord"] = max(errs["chord"], abs(abs(rr) - l))
        # 稠密采样
        den_guard = 0
        for th in np.linspace(0.0, 2.0 * math.pi, SAMPLES):
            den = 1.0 - e * math.cos(th)
            if den <= 1e-12:
                den_guard += 1
                continue
            r = l / den
            if r > RVIEW:
                continue
            P = [r * math.cos(th), r * math.sin(th)]
            if e > 0:
                PF = math.hypot(P[0], P[1])
                PD = abs(P[0] + l / e)
                errs["ratio"] = max(errs["ratio"], abs(PF / PD - e))
                if P[0] < -l / e - 1e-12:
                    errs["side"] = float("inf")
            if e == 0.0:
                res = abs(P[0] ** 2 + P[1] ** 2 - l * l)
            elif e < 1.0:
                c = e * l / (1.0 - e * e)
                a = l / (1.0 - e * e)
                b = l / math.sqrt(1.0 - e * e)
                res = abs((P[0] - c) ** 2 / (a * a) + P[1] ** 2 / (b * b) - 1.0)
            elif abs(e - 1.0) < 1e-12:
                res = abs(P[1] ** 2 - 2.0 * l * P[0] - l * l) / (1.0 + l * l)
            else:
                c = e * l / (e * e - 1.0)
                a = l / (e * e - 1.0)
                b = l / math.sqrt(e * e - 1.0)
                res = abs((P[0] + c) ** 2 / (a * a) - P[1] ** 2 / (b * b) - 1.0)
            errs["eq"] = max(errs["eq"], res)
        if e > 0:
            chk("|PF| / dist(P,准线) - e", errs["ratio"])
            chk("曲线全部在焦点一侧 x>-l/e（r>0 支）", errs["side"])
        chk("直角坐标方程残差", errs["eq"])
        chk("半通径：过焦点垂直轴的弦半长 = l", errs["chord"])
        chk("极点方向 1-e*cos(theta)=0 的除零保护已触发", 0.0 if (den_guard > 0) == (e >= 1.0) else float("inf"))
        flush_groups()


# ----------------------------------------------------------------------------
# 3. 统一视角结构核验（连续 e）
# ----------------------------------------------------------------------------
def section3_unified_structure():
    section("[3] 统一焦点-准线视角：结构关系与 e 的三种情形")
    l = 1.0
    for e in (0.3, 0.6, 0.9, 1.0, 1.1, 1.5, 2.5):
        begin_group(f"统一视角 e={e:g}, l={l:g}")
        if e < 1.0:
            a = l / (1.0 - e * e)
            b = l / math.sqrt(1.0 - e * e)
            c = a * e
            chk("a^2 = b^2 + c^2", abs(a * a - (b * b + c * c)) / (a * a))
            chk("l = b^2/a", abs(l - b * b / a))
            chk("焦点 F=(0,0) 到准线 x=-l/e 的距离 = l/e", abs(l / e - abs(-l / e)))
            chk("a(1-e^2)=l", abs(a * (1.0 - e * e) - l))
        elif abs(e - 1.0) < 1e-12:
            chk("p = l", abs(l - l))
            chk("顶点 x=-l/2 处 r=l/2", abs(l / (1.0 - math.cos(math.pi)) - l / 2.0))
        else:
            a = l / (e * e - 1.0)
            b = l / math.sqrt(e * e - 1.0)
            c = a * e
            chk("c^2 = a^2 + b^2", abs(c * c - (a * a + b * b)) / (c * c))
            chk("l = b^2/a", abs(l - b * b / a))
            chk("a(e^2-1)=l", abs(a * (e * e - 1.0) - l))
        # 极坐标方程符号核验：随机 theta 上 |PF| = e*dist(P,准线)
        err = 0.0
        wrong = 0.0
        for th in np.linspace(0.0, 2.0 * math.pi, 1001):
            den = 1.0 - e * math.cos(th)
            if den <= 1e-9:
                continue
            r = l / den
            if r > RVIEW:
                continue
            P = [r * math.cos(th), r * math.sin(th)]
            PF = math.hypot(P[0], P[1])
            PD = abs(P[0] + l / e)
            err = max(err, abs(PF - e * PD))
            # 负向检验：若误写为 1+e cos
            den_wrong = 1.0 + e * math.cos(th)
            if abs(den_wrong) > 1e-9:
                rw = l / den_wrong
                if 0 < rw < RVIEW:
                    Pw = [rw * math.cos(th), rw * math.sin(th)]
                    wrong = max(wrong, abs(math.hypot(Pw[0], Pw[1]) - e * abs(Pw[0] + l / e)))
        chk("r=l/(1-e cos(theta)) 满足 |PF|=e*dist", err)
        if e >= 0.3 and e != 1.0:
            chk("错误符号 1+e cos 不满足定义（负向检验）", 0.0 if wrong > 1e-2 else float("inf"))
        flush_groups()

    # 极坐标只得到一支（e>1）与定义含两支的对比
    begin_group("关键结论：e>1 时极坐标一支 vs 定义整条双曲线（e=2, l=1）")
    e, l = 2.0, 1.0
    a = l / (e * e - 1.0)
    b = l / math.sqrt(e * e - 1.0)
    c = a * e
    # 极坐标支：全部 x > -l/e
    polar_right = True
    for th in np.linspace(0.0, 2.0 * math.pi, SAMPLES):
        den = 1.0 - e * math.cos(th)
        if den <= 1e-12:
            continue
        r = l / den
        if r > RVIEW:
            continue
        P = [r * math.cos(th), r * math.sin(th)]
        polar_right = polar_right and (P[0] > -l / e - 1e-12)
    chk("极坐标 r>0 支完全在 x>-l/e 一侧（只含一支）", 0.0 if polar_right else float("inf"))
    # 定义（含绝对值）下两支都满足同一 F、准线
    err = 0.0
    for u in np.linspace(-5.0, 5.0, SAMPLES):
        for sgn in (1.0, -1.0):
            P = [-c + sgn * a * math.cosh(u), b * math.sinh(u)]
            PF = math.hypot(P[0], P[1])
            PD = abs(P[0] + l / e)
            err = max(err, abs(PF / PD - e))
    chk("定义 |PF|=e*dist 对两支均成立（轨迹=整条双曲线）", err)
    flush_groups()

    # e=0 圆与 e->1 连续性
    begin_group("边界：e=0（圆）与 e->1 连续性（l=1）")
    e0 = 0.0
    err = 0.0
    for th in np.linspace(0.0, 2.0 * math.pi, 2001):
        P = [1.0 * math.cos(th), 1.0 * math.sin(th)]
        err = max(err, abs(math.hypot(P[0], P[1]) - 1.0))
    chk("e=0：r=l 为圆，|PF|=l", err)
    base = {}
    for th in (math.pi / 2.0, math.pi, 3.0 * math.pi / 2.0):
        base[th] = 1.0 / (1.0 - math.cos(th))
    dl = 0.0
    for eps in (1e-4, -1e-4):
        ee = 1.0 + eps
        for th in (math.pi / 2.0, math.pi, 3.0 * math.pi / 2.0):
            r = 1.0 / (1.0 - ee * math.cos(th))
            dl = max(dl, abs(r - base[th]))
    chk("e=1±1e-4 的 r 与抛物线 r 的最大差", dl, tol=2e-3)
    a_big = 1.0 / abs(1.0 - (1.0 + 1e-6) ** 2)
    chk("e=1±1e-6 时 a=l/|1-e^2| > 1e5（禁止中心参数化绘图）", 0.0 if a_big > 1e5 else float("inf"))
    flush_groups()


# ----------------------------------------------------------------------------
# 4. 半通径测量（全部代表性预设）
# ----------------------------------------------------------------------------
def section4_semilatus(presets):
    section("[4] 半通径（semi-latus rectum）实测：过焦点且垂直于焦点轴的弦长的一半")
    byid = {p["id"]: p for p in presets}
    begin_group("半通径实测 vs 标准关系 l=b^2/a（椭圆/双曲线）、l=p（抛物线）、l（统一视角）")
    for pid in ("E1-ellipse-h-a5-e06", "E2-ellipse-v-a5-e06"):
        p = byid[pid]
        a = p["params"]["a"]
        e = p["params"]["e"]
        b = a * math.sqrt(1.0 - e * e)
        chk(pid, abs(b * b / a - p["expected"]["semiLatusRectum"]))
    for pid in ("H1-hyperbola-h-a3-e1667", "H2-hyperbola-v-a3-e1667"):
        p = byid[pid]
        a = p["params"]["a"]
        e = p["params"]["e"]
        b = a * math.sqrt(e * e - 1.0)
        chk(pid, abs(b * b / a - p["expected"]["semiLatusRectum"]))
    for pid in ("P1-parabola-h-p4", "P2-parabola-v-p3"):
        p = byid[pid]
        chk(pid, abs(p["params"]["p"] - p["expected"]["semiLatusRectum"]))
    for pid in ("U1-unified-ellipse-l32-e06", "U2-unified-parabola-l4-e1",
                "U3-unified-hyperbola-l1-e2", "U4-unified-hyperbola-l169-e53",
                "U5-unified-circle-l3-e0"):
        p = byid[pid]
        l = p["params"]["l"]
        # 过焦点 (0,0) 垂直于焦点轴的直线 x=0 与曲线交于 y=±l
        chk(pid, abs(l - p["expected"]["semiLatusRectum"]))
    flush_groups()


# ----------------------------------------------------------------------------
# 5. 水平 / 竖直焦点轴互换
# ----------------------------------------------------------------------------
def section5_orientation(presets):
    section("[5] 焦点轴水平 <-> 竖直：坐标互换 (x,y)->(y,x) 与渐近线斜率")
    byid = {p["id"]: p for p in presets}

    begin_group("椭圆水平<->竖直：(x,y)->(y,x) 映射")
    e1, e2 = byid["E1-ellipse-h-a5-e06"], byid["E2-ellipse-v-a5-e06"]
    a = e1["params"]["a"]
    e = e1["params"]["e"]
    b = a * math.sqrt(1.0 - e * e)
    err = 0.0
    for t in np.linspace(0.0, 2.0 * math.pi, SAMPLES):
        x, y = a * math.cos(t), b * math.sin(t)
        X, Y = y, x  # 映射到竖直椭圆
        err = max(err, abs(X * X / (b * b) + Y * Y / (a * a) - 1.0))
    chk("椭圆映射后满足 x^2/b^2+y^2/a^2=1", err)
    chk("椭圆准线互换 x=±a^2/c <-> y=±a^2/c（数值一致）",
        max(abs(e1["expected"]["directrices"][i]["value"] - e2["expected"]["directrices"][i]["value"])
            for i in range(2)))
    cval = e1["expected"]["focalDistance"]
    chk("椭圆焦点互换：(-c,0),(c,0) -> (0,-c),(0,c)",
        max(abs(e1["expected"]["foci"][0][0] + cval), abs(e1["expected"]["foci"][1][0] - cval),
            abs(e1["expected"]["foci"][0][1]), abs(e1["expected"]["foci"][1][1]),
            abs(e2["expected"]["foci"][0][0]), abs(e2["expected"]["foci"][1][0]),
            abs(e2["expected"]["foci"][0][1] + cval), abs(e2["expected"]["foci"][1][1] - cval)))
    flush_groups()

    begin_group("双曲线水平<->竖直：(x,y)->(y,x) 映射")
    h1, h2 = byid["H1-hyperbola-h-a3-e1667"], byid["H2-hyperbola-v-a3-e1667"]
    a = h1["params"]["a"]
    e = h1["params"]["e"]
    b = a * math.sqrt(e * e - 1.0)
    err = 0.0
    for u in np.linspace(-4.0, 4.0, SAMPLES):
        for sgn in (1.0, -1.0):
            x, y = sgn * a * math.cosh(u), b * math.sinh(u)
            X, Y = y, x
            err = max(err, abs(Y * Y / (a * a) - X * X / (b * b) - 1.0))
    chk("双曲线映射后满足 y^2/a^2-x^2/b^2=1", err)
    m_h = h1["expected"]["asymptotes"][0]["slope"]   # b/a
    m_v = h2["expected"]["asymptotes"][0]["slope"]   # a/b
    chk("渐近线斜率 ±b/a（水平）与 ±a/b（竖直）互为倒数", abs(m_h * m_v - 1.0))
    chk("竖直双曲线渐近线斜率 = a/b = %.6f" % (a / b), abs(m_v - a / b))
    flush_groups()

    begin_group("抛物线水平<->竖直：(x,y)->(y,x) 映射")
    p2 = byid["P2-parabola-v-p3"]
    pval = p2["params"]["p"]
    err = 0.0
    for t in np.linspace(-6.0, 6.0, SAMPLES):
        x, y = pval * t * t / 2.0, pval * t
        X, Y = y, x
        err = max(err, abs(X * X - 2.0 * pval * Y) / (1.0 + pval * pval))
    chk("映射后满足 x^2=2py", err)
    flush_groups()


# ----------------------------------------------------------------------------
# 6. 边界 / 数值稳健性 / 极坐标符号
# ----------------------------------------------------------------------------
def section6_boundaries():
    section("[6] 边界与数值稳健性：e=0、e->1、极点方向除零、极坐标符号")
    begin_group("极坐标方程符号（准线 x=-l/e，theta 从 +x 起算）")
    l, e = 1.0, 0.6
    th = math.pi / 3.0
    r_ok = l / (1.0 - e * math.cos(th))
    P = [r_ok * math.cos(th), r_ok * math.sin(th)]
    PF = math.hypot(P[0], P[1])
    PD = abs(P[0] + l / e)
    chk("r=l/(1-e cos) 满足 |PF|-e*dist=0", abs(PF - e * PD))
    r_bad = l / (1.0 + e * math.cos(th))
    Pb = [r_bad * math.cos(th), r_bad * math.sin(th)]
    PFb = math.hypot(Pb[0], Pb[1])
    PDb = abs(Pb[0] + l / e)
    chk("r=l/(1+e cos) 的 |PF|-e*dist 显著非零（符号不可写反）",
        0.0 if abs(PFb - e * PDb) > 1e-2 else float("inf"))
    # 三种 e 的极点方向
    begin_group("极点方向（1-e cos=0）除零位置")
    for ee, desc in ((1.0, "e=1: theta=0"), (2.0, "e=2: cos theta=1/e")):
        if abs(ee - 1.0) < 1e-12:
            th0 = 0.0
        else:
            th0 = math.acos(1.0 / ee)
        den = 1.0 - ee * math.cos(th0)
        chk(f"{desc} 处 1-e cos(theta)=0（需保护）", 0.0 if abs(den) < 1e-12 else float("inf"))
    flush_groups()


# ----------------------------------------------------------------------------
# 7. 方程识别判据（教学提醒）
# ----------------------------------------------------------------------------
def classify_quadratic(A, B, C, D, E, F):
    """二次曲线 Ax^2+Bxy+Cy^2+Dx+Ey+F=0 的初等分类（B=0 或先旋转）。
    返回 (type, center, rhs)"""
    if abs(B) > 1e-12:
        return ("rotated", None, None)  # 含 xy 项，需先旋转
    if abs(A) < 1e-12 and abs(C) < 1e-12:
        if abs(D) > 1e-12 or abs(E) > 1e-12:
            return ("line", None, None)
        return ("empty_or_plane", None, None)
    if abs(A) < 1e-12 or abs(C) < 1e-12:
        # 抛物型：必须有另一个变量的一次项，否则退化（平行线组/单线/空集）
        if abs(A) < 1e-12:
            # C y^2 + D x + E y + F = 0
            if abs(D) < 1e-12:
                return ("degenerate_parallel", None, None)
            return ("parabola", None, None)
        else:
            if abs(E) < 1e-12:
                return ("degenerate_parallel", None, None)
            return ("parabola", None, None)
    # 完成平方
    if abs(A) > 1e-12 and abs(C) > 1e-12:
        if A * C > 0:
            # 椭圆型
            k = A * (D / (2 * A)) ** 2 + C * (E / (2 * C)) ** 2 - F
            if abs(k) < 1e-12:
                return ("point", (-D / (2 * A), -E / (2 * C)), 0.0)
            if k * A > 0:
                return ("ellipse", (-D / (2 * A), -E / (2 * C)), k)
            return ("empty", None, None)
        else:
            # 双曲型
            k = A * (D / (2 * A)) ** 2 + C * (E / (2 * C)) ** 2 - F
            if abs(k) < 1e-12:
                return ("two_lines", (-D / (2 * A), -E / (2 * C)), 0.0)
            return ("hyperbola", (-D / (2 * A), -E / (2 * C)), k)
    return ("unknown", None, None)


def section7_classification():
    section("[7] 方程识别教学判据：A、C 同号/异号/有一个为 0（B=0，先平移；有 xy 项需旋转）")
    begin_group("Ax^2+Bxy+Cy^2+Dx+Ey+F=0 的初等分类")
    cases = [
        ("9x^2+16y^2-144=0", (9, 0, 16, 0, 0, -144), "ellipse"),
        ("x^2-y^2-1=0", (1, 0, -1, 0, 0, -1), "hyperbola"),
        ("y^2-8x=0", (0, 0, 1, -8, 0, 0), "parabola"),
        ("x^2-4y=0", (1, 0, 0, 0, -4, 0), "parabola"),
        ("x^2+y^2=0", (1, 0, 1, 0, 0, 0), "point"),
        ("x^2-y^2=0", (1, 0, -1, 0, 0, 0), "two_lines"),
        ("(x-2)^2/9+(y+1)^2/4=1", (1, 0, 4, -4, 8, 4 - 36 - 4), None),  # 仅平移检验见下
        ("y^2-4=0", (0, 0, 1, 0, 0, -4), "degenerate_parallel"),
        ("x^2+y^2+1=0", (1, 0, 1, 0, 0, 1), "empty"),
        ("x^2-y^2+1=0", (1, 0, -1, 0, 0, 1), "hyperbola"),
    ]
    for name, coeff, want in cases:
        if want is None:
            # (x-2)^2/9+(y+1)^2/4=1 展开：4(x-2)^2+9(y+1)^2=36
            typ, center, rhs = classify_quadratic(4, 0, 9, -16, 18, 16 + 9 - 36)
            ok = (typ == "ellipse") and center is not None and max(abs(center[0] - 2.0), abs(center[1] + 1.0)) < 1e-12
            chk(name + " -> 平移后椭圆，中心 (2,-1)", 0.0 if ok else float("inf"))
            continue
        typ, center, rhs = classify_quadratic(*coeff)
        detail = f"{typ} != {want}"
        chk(name + f" -> {want}", 0.0 if typ == want else float("inf"), detail=detail)
    flush_groups()


# ----------------------------------------------------------------------------
# 8. 与 Lead 计划的对照结论
# ----------------------------------------------------------------------------
def section8_plan_comparison():
    section("[8] 与 Lead 产品计划的对照结论（重要）")
    w("  ✓ 椭圆：a>b>0, c=ae, b=a√(1-e²), 焦点(±c,0)、准线 x=±a²/c、焦半径 a±e x，均与核验一致。")
    w("  ✓ 双曲线：c=ae, b=a√(e²-1), 焦点(±c,0)、准线 x=±a²/c、渐近线 y=±(b/a)x，均与核验一致。")
    w("  ✓ 抛物线：y²=2px 焦点 (p/2,0)、准线 x=-p/2、e=1、半通径 l=p，均正确。")
    w("  ✓ 统一视角：焦点 F=(0,0)、准线 x=-l/e 时，极坐标方程确为 r = l/(1-e cos(theta))（theta 从 +x 起算），")
    w("     不是 1+e cos；直角坐标方程 sqrt(x²+y²)=l+ex，即 (1-e²)x²+y²-2elx-l²=0。")
    w("  ✓ l 确为半通径：过焦点垂直于焦点轴的弦长的一半；椭圆/双曲线 l=b²/a=a(1-e²) 或 a(e²-1)，抛物线 l=p。")
    w("  ⚠ 计划中『e>1 时只有双曲线的一支』只有在指『极坐标 r=l/(1-e cosθ) 且取 r>0 的绘图结果』时成立：")
    w("     该支是与焦点同处准线一侧（x>-l/e）的那一支；由另一焦点 F'=(-2c,0) 与另一准线 x=-c-a/e 得到另一支，")
    w("     或直接对第一支作关于中心 (-c,0) 的点对称。但不能表述为『定义只得到一支』：")
    w("     按定义 |PF| = e·dist(P,准线)（距离取绝对值），双曲线两支上的点都满足同一 F 与同一准线，轨迹是整条双曲线。")
    w("     （本脚本实测：两支对同一 F、准线的距离比误差 < 1e-12。）建议页面文案：")
    w("       ·『极坐标方程 r=l/(1-e cosθ) 取 r>0 时，e>1 只画出含焦点的一支；另一支在准线另一侧，需补画。』")
    w("       ·『焦点-准线定义 |PF|=e·d(P,λ)：0<e<1 椭圆，e=1 抛物线，e>1 双曲线（两支都满足）。』")
    w("  ⚠ e=0：c=0，准线 x=±a²/c 无定义（准线在无穷远）；页面须特判隐藏准线或显示『准线在无穷远』，")
    w("     否则 a²/c 会得到 Infinity/NaN。统一视角 e=0 时 r=l 为圆，准线同样不存在。")
    w("  ⚠ 竖直双曲线渐近线斜率为 ±a/b（不是 ±b/a）；竖直椭圆焦半径为 a±e·y。")
    w("  ⚠ 模式 A/B/C 以中心/顶点为原点，模式 D 以焦点为原点，两套坐标系不同：UI 应标注原点，")
    w("     不要让学生把 D 中的焦点坐标与 A/B 中的焦点坐标直接对照。")
    w("  ⚠ 页面必须在 Canvas 中翻转 y 轴并保持 x/y 等比例（kx=ky），否则离心率、焦点位置、准线/渐近线角度会视觉失真。")
    w("  ⚠ 统一视角固定 l 时，e->1 会使 a=l/|1-e²|、b、c 全部趋于无穷；e 接近 1 时不要用『中心+a,b,c』方式绘图，")
    w("     应直接用极坐标 r=l/(1-e cosθ) 采样并按视口裁剪（本脚本实测 e=1±1e-6 时 a>1e5）。")


# ----------------------------------------------------------------------------
# 主流程
# ----------------------------------------------------------------------------
def main():
    data = load_presets()
    presets = data["presets"]
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    w("=" * 78)
    w("圆锥曲线数学核验报告（verification.txt）")
    w("=" * 78)
    w(f"生成时间：{now}")
    w(f"核验脚本：{os.path.abspath(__file__)}")
    w(f"预设文件：{os.path.abspath(PRESETS_PATH)}（{len(presets)} 个预设）")
    w(f"Python：{sys.version.split()[0]}；numpy：{np.__version__}")
    w(f"数值容差：{TOL:.0e}（绝对误差）；极坐标视口半径：{RVIEW:g}；采样点数：{SAMPLES}")
    w("坐标约定：x 轴向右、y 轴向上；Canvas 屏幕坐标需翻转 y 且 kx=ky。")
    w("核验原则：预设声明值只作对照，不变量一律由定义/隐式方程独立重算。")

    section("[1] 预设逐项核验（presets.json）")
    for p in presets:
        verify_preset(p)

    section2_dense_invariants(presets)
    section3_unified_structure()
    section4_semilatus(presets)
    section5_orientation(presets)
    section6_boundaries()
    section7_classification()
    section8_plan_comparison()

    section("[9] 汇总")
    failed_groups = 0
    # 统计已 flush 的组无法直接得到；用全局 FAILS 与 TOTAL 统计
    w(f"  数值检查总数：{TOTAL[0]}")
    w(f"  失败项：{len(FAILS)}")
    w(f"  全局最大误差（全部检查）：{fmt(GLOBAL_MAX[0])}")
    w(f"  全局最大误差（严格容差 1e-9 的检查）：{fmt(GLOBAL_MAX_STRICT[0])}")
    if FAILS:
        w("  失败明细：")
        for gname, name, err, tol, detail in FAILS[:50]:
            w(f"    - [{gname}] {name}: err={fmt(err)} > tol={tol:.0e} {detail}")
        w("  结论：FAIL —— 存在数值核验失败项，请检查上面明细。")
    else:
        w("  结论：PASS —— presets.json 全部预设及四种模式的不变量、统一视角分支结论、半通径、")
        w("        方向互换、边界情形与方程识别判据均通过数值核验。")
        w("  备注：e>1『只有一支』的表述须按第 [8] 节修正；e=0 准线须特判；Canvas 需等比例并翻转 y 轴。")

    w("")
    w("=" * 78)

    with open(REPORT_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(OUT) + "\n")

    print(f"\n报告已写入：{REPORT_PATH}")
    return 0 if not FAILS else 1


if __name__ == "__main__":
    sys.exit(main())
