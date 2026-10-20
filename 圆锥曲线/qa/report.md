# 独立验收报告 · 圆锥曲线方程实验室（Conic Equation Lab）

**结论：PASS（通过）**
- 最终被测文件：index.html，131865 字节，mtime 2026-10-20 23:32:49（UTC+8），SHA-256 = 5A829440E1A699AB2E92946AE0D0646028F26B56513A5702E403C7DED27E6F99。
- 自动化检查：**385 / 385 通过**（part1 数学/模式/预设/URL 275 项 + part2 交互/模态/布局/可访问性 110 项），0 失败。
- 无 blocker、无 major；有 7 项轻微问题/观察（见第 9 节），均不影响教学使用与交付。
- 验收期间 Lead 的收尾修改（aria-label 随模式更新、标签开关隐藏辅助标签、准线在视野外提示、统一 e≈1 分支说明等）均已按**最终文件**复测通过；所有截图均在同一 SHA-256 文件上重拍。
- QA 仅写入 圆锥曲线/qa/ 目录，未修改 index.html、README.md、preview.png、research/ 任何文件。

---

## 1. 测试环境与方法

| 项 | 内容 |
| --- | --- |
| 操作系统 | Windows 本机 |
| 浏览器 | Microsoft Edge 155.0.4283.62，headless=new |
| 启动参数 | --remote-debugging-port=9460/9462/9463/9464（独立 QA 实例）；--user-data-dir=C:\\Users\\LHH\\AppData\\Local\\Temp\\qa-conic-visual-qa\\profile-*；--disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --disable-features=CalculateNativeWinOcclusion --edge-skip-compat-layer-relaunch --window-size=1920,1080 |
| 加载方式 | file:///D:/workspace/数学演示/圆锥曲线/index.html?...（真实本地文件，无服务器、无网络） |
| 控制方式 | Chrome DevTools Protocol：Page.bringToFront、Emulation.setFocusEmulationEnabled、Emulation.setDeviceMetricsOverride、Input.dispatchMouseEvent / dispatchKeyEvent、Runtime.evaluate、Page.captureScreenshot |
| 测试脚本 | qa/_tools/run-part1.mjs、run-part2.mjs（辅助 qa-lib.mjs、conic-math.mjs、capture-e065.mjs） |
| 机器可读结果 | qa/_tools/results-part1.json、results-part2.json、part1.log、part2.log、e065.json |
| 独立数学核验 | 自研 conic-math.mjs（从定义/标准方程独立计算 a,b,c,e,p,l,d、焦点、准线、渐近线、P 在曲线上的残差、定义不变量），**不调用页面内部计算函数**；页面读数通过 window.__CONIC_LAB__.getDiagnostics() 获取后与独立结果比对；presets.json 仅作第二重交叉对照 |
| 交互真实性 | 模式标签/图鉴卡片/滑杆/开关/播放/重置/指南等均用 CDP 真实鼠标事件；快捷键用真实键盘事件；少数构造性用例（指定参数/相位）使用页面公开调试 API |

**版本说明**：验收期间 index.html 有多次收尾修改；最终一轮 part1（2026-10-20 23:33:58 起跑）与 part2（23:34:44 起跑）均在 SHA-256 5A829440… 的同一文件上完成，结果 JSON 内 target 字段记录了同一 hash；全部截图在 23:33:58–23:35:15 之间重拍（另有 e=0.65 补拍）。验收中确认该文件在两次全量测试期间未被改动。

---

## 2. 四模式截图与读数（独立复算对照）

下表为最终页面的实际读数（页面 diag 与 DOM），与 QA 独立几何引擎结果逐项比对。误差列：派生量/焦点/准线的最大绝对差，P 在曲线上的残差，以及定义不变量残差。所有场景的派生几何量、焦点坐标、准线位置与独立重算**完全一致（误差 0）**。

| 场景 | 参数 | 页面名称 | 方程（数值） | 焦点 | 准线 / 渐近线 | 派生量 | P（页面） | P 在曲线上残差 | 定义残差 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 椭圆水平 E1 | a=5,e=0.6,x | 椭圆 | x²/25.00 + y²/16.00 = 1 | (−3,0),(3,0) | x=±8.33 | a5 b4 c3 e0.6 | (3.1080, 3.1333) | 0 | 0 |
| 椭圆竖直 E2 | a=5,e=0.6,y | 椭圆 | x²/16.00 + y²/25.00 = 1 | (0,−3),(0,3) | y=±8.33 | a5 b4 c3 e0.6 | (3.1333, 3.1080) | 0 | 0 |
| 圆 E3 | a=4,e=0,x | 圆 | x² + y² = 16.00 | F₁=F₂=O(0,0) | 圆没有准线 | a=b=4 c=0 e=0 | (2.4864, 3.1333) | 0 | 8.9e-16 |
| 双曲线水平 H1 | a=3,e=5/3,x | 双曲线 | x²/9.00 − y²/16.00 = 1 | (−5,0),(5,0) | x=±1.80；y=±1.33x | a3 b4 c5 e=5/3 | (4.4765, 4.4300) | 2.2e-16 | 8.9e-16 |
| 双曲线竖直 H2 | a=3,e=5/3,y | 双曲线 | y²/9.00 − x²/16.00 = 1 | (0,−5),(0,5) | y=±1.80；y=±0.75x | a3 b4 c5 e=5/3 | (4.4300, 4.4765) | 2.2e-16 | 8.9e-16 |
| 抛物线水平 P1 | p=4,x | 抛物线 | y² = 8.00x | (2,0) | x=−2.00 | p4 e1 通径8 | (6.0797, 6.9741) | 0 | 1.8e-15 |
| 抛物线竖直 P2 | p=3,y | 抛物线 | x² = 6.00y | (0,1.5) | y=−1.50 | p3 e1 通径6 | (5.2305, 4.5598) | 0 | 0 |
| 统一 e=0.6 U1 | e=0.6,l=3.2 | 椭圆 | r = 3.20 / (1 − 0.60 cos θ) | F(0,0) | x=−5.33 | e0.6 l3.2 d5.333 | (2.5583, 3.9844) | 0 | 0 |
| 统一 e=0.65 | e=0.65,l=2.5 | 椭圆 | r = 2.50 / (1 − 0.65 cos θ) | F(0,0) | x=−3.85 | e0.65 l2.5 d3.846 | (2.0819, 3.2424) | 0 | 0 |
| 统一 e=1 U2 | e=1,l=4 | 抛物线 | r = 4.00 / (1 − 1.00 cos θ) | F(0,0) | x=−4.00 | e1 l4 d4 | (1.2938, −5.1333) | 0 | 0 |
| 统一 e=5/3 U4 | e=5/3,l=16/9 | 双曲线 | r = 1.78 / (1 − 1.67 cos θ) | F(0,0) | x=−1.07 | e1.6667 l1.7778 d1.0667 | (0.3358, −2.3131) | 4.4e-16 | 4.4e-16 |
| 统一 e=1.6 | e=1.6,l=2.5 | 双曲线 | r = 2.50 / (1 − 1.60 cos θ) | F(0,0) | x=−1.56 | e1.6 l2.5 d1.5625 | (−0.3325, −1.9398) | 2.2e-16 | 2.2e-16 |
| 统一 e=0.98（裁剪） | e=0.98,l=2.5 | 椭圆（裁剪弧） | r = 2.50 / (1 − 0.98 cos θ) | F(0,0) | x=−2.55 | e0.98 l2.5 d2.5510 | (0.8904, −3.2529) | 0 | 0 |

对应截图：01–12、08b（截图 08 是 e=0.6 预设 U1；08b 为要求的 e=0.65）。圆 e=0 见 03：页面无准线、无 Infinity/NaN，特征行显示"圆没有准线 / 半径 r=a=4.00 / 离心率 e=0"。

### 2.1 数值误差汇总

| 检查项 | 结果 |
| --- | --- |
| 派生量（a,b,c,e / p,e / e,l,d）与独立重算差 | 12/12 场景最大差 **0**（显示值即精确值） |
| 焦点坐标 | 12/12 场景最大差 **0** |
| 准线位置（含竖直/水平类型） | 12/12 场景最大差 **0** |
| 渐近线斜率（双曲线） | 水平 ±1.33（独立值 1.3333）、竖直 ±0.75（独立值 0.75），与 2 位显示一致；页面 label 与独立斜率匹配 |
| P 定义残差（|PF₁+PF₂−2a| 等） | 最大 **1.78e-15**，全部 ≤ 1e-9（要求 ≈0） |
| P 在曲线方程上的残差 | 最大 **4.44e-16** |
| 页面显示距离 vs 由 P 坐标独立重算 | 12/12 场景一致（最大差 0） |
| 不变量 | 椭圆 PF₁+PF₂ = 2a = 10.000（E1/E2/U1 的 PF/PD=0.6 精确）；双曲线 abs(PF₁−PF₂)=2a=6.000；抛物线 |PF|−d(P,ℓ)≤2.2e-15、PF/PD=1；统一 PF/PD=e（0.6/0.98/1/1.6/1.6667 全部误差 ≤1e-15） |
| 退化/端点 | 15 组参数端点（a/e/p/l 的最小、最大、竖直组合）全部无 NaN/Infinity，定义残差最大 **1.78e-15**，曲线点数正常 |
| 预设交叉对照 | 10 个在 UI 范围内的 presets.json 预设：焦点/准线/渐近线斜率/半通径与 presets.json 全部一致；U3/U5 超出 UI 范围（见 M4） |

---

## 3. 统一视角：e 跨越 1、分支补画与视野裁剪

| e | 页面类型 | 曲线数据（诊断） | 文案/行为 | 结论 |
| --- | --- | --- | --- | --- |
| 0.6（U1）/0.65 | 椭圆 | 1 条闭合曲线（closed=true, fill=true） | "e < 1：轨迹是完整的椭圆"；焦点在原点、准线 x=−ℓ/e | 通过 |
| 0.98 | 椭圆（被视野裁剪） | 1 条**非闭合**曲线（closed=false, fill=false，281 点） | note 明确"端点在视野边界处断开；这并不表示椭圆在这里终止"，未用直线闭合 | 通过（截图 12） |
| 1（U2） | 抛物线 | 1 条非闭合曲线（closed=false） | note 说明两端按视野裁剪；PF/PD=1.0000 | 通过（截图 09） |
| 1.6 / 5/3（U4） | 双曲线（两支） | 2 条曲线；第 2 条 dim=true；由中心对称补画 | note："极坐标取 r>0 只描出含焦点的一支，图中另一支由中心对称补画" | 通过（截图 10、11） |
| 1.05（接近 1，另一支在视野外） | 双曲线（只显示含焦点一支） | 2 条曲线数据（第二支离屏），第二支中心在 5ℓ 外 | note 改为"e 很接近 1，另一支离得很远，当前视野只显示含焦点的一支；「中心」给出它的对称中心" | 通过（截图 13） |
| e>1 定义表述 | — | — | 指南原文："按定义，**两支**上的点到同一焦点、同一准线的距离比都等于 e；取 r>0 作图时只描出含焦点的一支，图中另一支由中心对称补画。" 页面/指南未出现"定义只给一支/轨迹只有一支"等错误说法（正则扫描 0 命中） | 通过 |

补充数值验证（e=1.6,l=2.5）：页面给出的 P 位于含焦点一支（x > −ℓ/e）；将 P 关于中心 (−c,0) 中心对称得到第二支点，该点独立复算的定义残差 8.9e-16、PF/PD = 1.6000000000000003 ≈ e，证明补画方法正确（第二支同样满足同焦点/同准线的距离比 e）。U4（e=5/3,l=16/9）亦为 2 条曲线，second.dim=true。

---

## 4. 预设对照（presets.json 12 组）

- **可复现预设（10 组）**：E1、E2、E3、H1、H2、P1、P2、U1、U2、U4 全部通过页面 API/URL 复现并与 presets.json 的 expected 对照：焦点、准线（含类型）、双曲线渐近线斜率、半通径 l（椭圆显示通径 2l、抛物线 metricGrid 通径 2p、统一显示 ℓ）、方程系数一致。
- **超出 UI 范围的 2 组**：
  - U3（统一视角 l=1, e=2）：页面统一视角 l 滑杆范围 1.5–4，applyPreset 后按 1.5 夹取；页面仍稳定给出双曲线两支、无 NaN。
  - U5（统一视角 l=3, e=0）：页面统一视角 e 滑杆范围 0.35–2.2，夹取为 0.35（椭圆）；圆 e=0 的情况在椭圆模式（E3）已完整覆盖。
  - 结论：页面不报错、安全夹取；属**文档/范围口径**问题而非功能错误（见 M4）。
- 预设专项检查共 12 项全部通过（10 个在范围内预设交叉对照 + U3/U5 边界夹取）；页面图鉴/模式标签与预设参数切换后，方程、焦点、准线、渐近线、P、不变量同步更新。

---

## 5. 交互测试

| 交互 | 实测结果 | 结论 |
| --- | --- | --- |
| 顶部模式标签（4） | 逐个真实点击：diag.mode/名称/方程/行显隐/焦点轴组/快速 e 按钮上下文全部正确；aria-pressed 始终单选中 | 通过 |
| 图鉴卡片（4） | 点击抛物线/椭圆卡片：模式、tab、卡 aria-pressed、diag 同步切换 | 通过 |
| 四个滑杆 | 真实点击滑杆轨道改变 a/e/p/l，几何/方程实时更新；用 input 事件测端点：椭圆 e=0 得圆（无准线）、e=0.85；双曲线 e=1.05/a=1.2 与 e=2/a=3.2；抛物线 p=1/5；统一 e=0.35/2.2、l=1.5/4——全部无 NaN/Infinity | 通过 |
| 统一 e 跨 1 | 通过滑杆依次 e=0.98→1.02→1：页面类型椭圆（裁剪）→双曲线（2 支）→抛物线，曲线条数/闭合状态正确 | 通过 |
| 焦点轴切换 | 椭圆 y：方程 x²/b²+y²/a²=1、焦点 (0,±c)、准线 y=±a²/c；双曲线 y：y²/a²−x²/b²=1、渐近线 ±0.75x（a/b）、准线 y=±a²/c；抛物线 y：x²=2py、开口向上；统一视角轴切换控件隐藏 | 通过 |
| 显示开关 | 准线/渐近线/标签 aria-pressed true↔false，场景 canvas 像素签名均改变；**标签关闭后准线/渐近线/焦点/顶点/P 等辅助标签全部消失**（15 开 vs 16 关，视觉与签名双重确认）；渐近线开关仅在双曲线模式出现 | 通过 |
| 播放/暂停 | 点击"播放动点"：playing=true、按钮"暂停动点"、stagePlay aria-pressed=true/aria-label 同步；1.1s 内相位 0.900→1.179、P 坐标明显改变；暂停后相位与 P 在后续 700ms 保持不变；stage 圆形按钮同样可切换 | 通过 |
| 重置 | 统一视角 e=1.9/l=3.2 + 关闭标签 + 播放中 → 点重置：参数回到默认 e=0.65/l=2.5、方向 x、三个开关恢复 true、toast"已重置当前参数"；reset 后 playing=true 为设计预期（随后暂停再读数） | 通过 |
| 键盘 | 1/2/3/4 切四模式；空格播放/暂停；R 重置当前模式（椭圆回 a=4,e=0.55）；G 打开速查（焦点入 .modal-close）；Esc 关闭（焦点回 guideBtn） | 通过 |
| 方程速查模态 | 点击打开：class/aria-hidden/visibility、role=dialog、aria-modal、labelledby 正确；焦点进入 .modal-close、背景 .app 加 inert；面板 scrollTop 归 0；20 次 Tab + Shift+Tab 焦点 0 次逃出；滚动后关闭再打开 scrollTop 回到 0；Esc/× /遮罩三种关闭方式均正常，Esc 后焦点回触发按钮、inert 移除；指南内③抛物线跳转可切模式并关闭 | 通过 |
| URL 参数 | 8 组 URL 实测：mode/axis/a/e/p/l/static/t/paused 均正确注入（?mode=ellipse&a=5&e=0.6&axis=x&static=1&t=0.95；?mode=hyperbola&a=2.2&e=1.45&axis=y…；?mode=parabola&p=3…；?mode=unified&e=1.6&l=2.5…；e=0.98 裁剪；e=0 圆；paused=1；非法 mode 回退椭圆），无报错、无 NaN | 通过 |
| 快速 e 按钮 | e=0.6 / 1 / 1.6 三个快捷按钮切换并更新曲线（U1/U2/U4 路径） | 通过 |

---

## 6. 布局与视觉（四视口）

| 视口 | 页面横向溢出 | 页面高度/滚动 | 布局与关键可见性 | 结论 |
| --- | --- | --- | --- | --- |
| 1920×1080 | docW=1920=innerW，页面级溢出元素 0 | docH=1080，无页面滚动 | 三栏：控制 316px / 舞台 1184×812 / 档案 358px；播放按钮 199×37 完整可见；图鉴 4 卡一屏（轨道 1858=1858）；面板内部滚动 810=810（无） | 通过（截图 18） |
| 1366×768 | docW=1366=innerW，溢出 0 | docH=768，无页面滚动 | 三栏；舞台 644×528；控制/档案内部滚动 526=526；播放按钮 y=385–418 完整可见；图鉴轨道 1316=1316，4 卡可见 | 通过（截图 19） |
| 1024×800 | docW=1024=innerW，溢出 0 | docH=1786，纵向滚动（预期） | 单列顺序：图 → 参数 → 方程 → 图鉴；舞台 1000×512；参数/方程面板无内部裁切；播放按钮 889×37；图鉴轨道 1103>974 为**容器内横向滚动**（非页面溢出） | 通过（截图 20） |
| 390×844 | docW=390=innerW，溢出 0 | docH=1905，纵向滚动（预期） | 头部折行且不溢出；单列顺序：图 → 参数 → 方程 → 图鉴；舞台 366×540；参数面板 366 宽；图鉴 4 卡（270px/卡）在轨道内横向滚动；速查模态 374×793 完整位于视口内且焦点在模态内 | 通过（截图 21、22、24、25） |

**图鉴轨道横向滚动为刻意设计**：1024/390 下图鉴轨道 scrollWidth>clientWidth，CDP 实测 scrollLeft=200 后首卡左移（26→−174px），而 document.scrollWidth 保持 390/1024 不变。因此"页面级/body 无横向溢出，图鉴轨道内部横向滚动"成立。1366 与 1920 完全无页面滚动。

视觉抽查：四模式配色/曲线/焦点/准线/渐近线/Q 垂足/P 动点/距离辅助线均正常；"准线在视野外"提示（14 的 2× 特写）清晰显示在画布左下角；标签关/开对比正确（15/16）；无文字截断、无面板重叠、无空白画布。

---

## 7. 可访问性基础

| 检查 | 结果 |
| --- | --- |
| 按钮可访问名称 | 27/27 按钮均有名称（可见文本/aria-label），0 空名 |
| 滑杆标签 | 4 个 range 均有可见 label + aria-label，且**随模式更新**（椭圆长半轴/双曲线实半轴/抛物线焦准距/统一视角离心率、半通径）——最终版本已修复固定"椭圆…"文案问题 |
| canvas | #scene 有 aria-label"带坐标轴的圆锥曲线动态图"及 fallback 文本 |
| 键盘焦点可见 | Tab 后元素匹配 :focus-visible，outline 2px solid（mode 色） |
| aria-pressed | 模式标签/图鉴卡/焦点轴/显示开关/播放按钮均正确维护 pressed 状态 |
| 对话框 | role=dialog、aria-modal=true、labelledby=guideTitle；焦点移入关闭按钮；Tab/Shift+Tab 焦点陷阱 0 逃逸；背景 .app inert；Esc 关闭且焦点回触发者 |
| 对比度 | 13 个代表性文本元素实测 5.68–13.23，全部 ≥4.5（最低为 8px 小标签 5.68） |
| 其余 | toast 为 role=status + aria-live=polite |

残余可访问性观察（轻微）：#liveName（当前曲线名称）无 aria-live，切换模式时读屏不会自动播报；三维 Canvas 中的曲线/文字提示无等价文本描述（但右栏方程/几何要素/定义验证已文本化）。见 M5。

---

## 8. 健壮性

- 两轮全量测试中：Runtime.exceptionThrown = 0，console error / Log error = 0，getDiagnostics().errors 始终为空。
- file:// 单文件加载，无任何 http(s) 外部请求；performance resource entries 为空。
- 页面 DOM 文本无 NaN / Infinity / undefined（检测覆盖四模式、e=0 圆、e→1 裁剪、端点参数、播放中）。
- 15 组参数端点 + 12 组场景 + 4 模式切换/滑杆/开关/播放/重置/键盘/URL 共 180+ 次操作后无异常。
- URL 非法 mode 回退默认椭圆，不报错。

---

## 9. 问题清单（按严重度）

### 9.1 Blocker（阻断）
- **无**。页面可正常加载、四模式与统一视角全部可用，数学读数与独立复算一致。

### 9.2 Major（严重）
- **无**。

### 9.3 Minor（轻微，不阻断交付）

| # | 类别 | 问题 | 说明/证据 | 建议 |
| --- | --- | --- | --- | --- |
| M1 | 内容/UI | buildUnified/buildHyperbola 等计算了更详细的 stageNote（如"统一视角：e>1 → 双曲线（两支）"、"实轴：x 轴 · 两支关于中心对称"、"开口向右"、"e=0：圆是椭圆的特例"），但 updateStaticUI 始终只写"原点 = … · P 由参数方程生成"，这些设计文案从未显示（死字段） | index.html：stageNote 生成于 1130/1207/1263/1326–1330/1358 行，显示逻辑 2088 行只拼接 originNote；实际 e=1.05 时舞台左下文本仍为"原点 = 焦点 F · 准线在焦点左侧 · P 由参数方程生成" | 二选一：把 geo.stageNote 显示出来，或删除该字段避免误导维护者 |
| M2 | 教学内容 | 统一视角 e>1 时页面不绘制渐近线（buildUnified asymptotes: []，渐近线开关只在双曲线模式显示），而 U3/U4 预设的 expected 里含渐近线 y=±√(e²−1)(x+c)；标准双曲线模式已正确显示 | 诊断 asymptotes=[]；预设对照时已记录该页面设计观察 | 可在统一视角 e>1 增加渐近线虚线（教学增值），或在指南说明统一视角为何不画 |
| M3 | 内容一致性 | 双曲线"方程档案"的几何要素只有焦点/准线/渐近线/顶点，缺少通径/半通径；椭圆有"通径 6.40"，抛物线 metricGrid 有"通径 8.00"，统一视角有"半通径 ℓ" | buildHyperbola features 1193–1198 行 | 补一行"通径/半通径"即可 |
| M4 | 文档/参数范围 | presets.json 中 U3（l=1）、U5（e=0）超出页面统一视角滑杆范围（l 1.5–4、e 0.35–2.2）；页面安全夹取（l→1.5，e→0.35）但不复现原预设 | 实测：U3 派生 l=1.5、双曲线两支；U5 派生 e=0.35、椭圆；无 NaN | 在 README/research 注明该 2 组为"超出 UI 范围/数学边界示例"，或扩大滑杆范围 |
| M5 | 可访问性 | #liveName（当前曲线名称）没有 aria-live；模式切换时读屏不会自动播报新曲线名（toast 有 live） | HTML 602 行 | 可加 aria-live=polite / role=status |
| M6 | 交互细节 | "准线在视野外"画布提示受"标签"开关影响：drawDirectrices 在 showLabels=false 时于标签绘制前 return，提示块位于其后，因此关闭标签后提示也消失 | 代码 1553/1575 行；默认标签开启时提示可见（截图 14） | 若希望提示独立，可把提示绘制移到 showLabels 判断之前 |
| M7 | 响应式说明 | 1024/390 下图鉴轨道 4 卡需在容器内横向滚动；属媒体查询刻意设计（.mode-card flex:0 0 270px、track overflow-x auto），不是缺陷 | 1024 track 1103/974；390 track 1023/340；页面 docW=innerW | 无需修改，仅记录 |

### 9.4 验收期间发现并被 Lead 修复、已在最终版本复测通过

| # | 问题 | 最终验证 |
| --- | --- | --- |
| F1 | 滑杆 aria-label 固定为"椭圆…"，切到双曲线/统一视角后读屏语境错误 | 最终版本按模式更新：双曲线实半轴 a / 双曲线离心率 e / 抛物线焦准距参数 p / 统一视角离心率 e / 半通径 ℓ；7 项 a11y 自动化检查全部通过 |
| F2 | 椭圆准线在视野外时只把曲线缩小、缺少视野外提示 | 新增画布左下"准线在视野外"提示，且不再为显示准线压缩曲线；截图 01、14 可见 |
| F3 | "标签"开关只隐藏部分标签 | 最终版本隐藏准线/渐近线/焦点/顶点/Q/P 等辅助标签；截图 15（开）vs 16（关），canvas 签名 3701547467→4041556702 |
| F4 | 统一视角 e=1.05 时另一支在视野外但 note 未说明 | 最终 note："e 很接近 1，另一支离得很远，当前视野只显示含焦点的一支；「中心」给出它的对称中心。"（截图 13） |

### 9.5 测试口径说明（非应用缺陷）

- N1：headless 下 RAF 受后台节流，播放相位推进量不可按固定 Δ 阈值判断；本报告按"相位明显增加（>0.05）且 P 明显移动"判定，实测 0.9→1.179、P 大幅移动。
- N2：重置后 playing=true 是页面设计（重置恢复播放），因此先暂停再从参数/方向/开关判定 reset；相位 0.9→0.993 属预期推进。
- N3：图鉴轨道（#catalogTrack）在 1024/390 是 overflow-x:auto 的内部滚动容器；页面级溢出检测已排除其后代，docW==innerW 且实测轨道 scrollLeft 改变而 docW 不变。
- N4：画布文字（"准线在视野外"）不是 DOM，采用 2× 截图目视核验（14）。

---

## 10. 截图清单（qa/screens/，26 张，均为最终版本实拍）

| 文件 | 内容 |
| --- | --- |
| [01-ellipse-horizontal-1920.png](screens/01-ellipse-horizontal-1920.png) | 椭圆（长轴水平）a=5,e=0.6，1920 默认布局；含"准线在视野外"提示 |
| [02-ellipse-vertical-1920.png](screens/02-ellipse-vertical-1920.png) | 椭圆（长轴竖直）a=5,e=0.6 |
| [03-ellipse-circle-e0-1920.png](screens/03-ellipse-circle-e0-1920.png) | 圆 e=0：无准线、半径 r=a、无 NaN |
| [04-hyperbola-horizontal-1920.png](screens/04-hyperbola-horizontal-1920.png) | 双曲线水平 a=3,e=5/3：两支、渐近线、准线 |
| [05-hyperbola-vertical-1920.png](screens/05-hyperbola-vertical-1920.png) | 双曲线竖直 a=3,e=5/3（渐近线斜率 0.75） |
| [06-parabola-horizontal-1920.png](screens/06-parabola-horizontal-1920.png) | 抛物线 y²=8x（p=4） |
| [07-parabola-vertical-1920.png](screens/07-parabola-vertical-1920.png) | 抛物线 x²=6y（p=3） |
| [08-unified-e0.6-ellipse-1920.png](screens/08-unified-e0.6-ellipse-1920.png) | 统一视角 e=0.6,l=3.2：完整椭圆、焦点在原点 |
| [08b-unified-e0.65-ellipse-1920.png](screens/08b-unified-e0.65-ellipse-1920.png) | 统一视角 e=0.65,l=2.5（要求值 e=0.65 的补充截图） |
| [09-unified-e1-parabola-1920.png](screens/09-unified-e1-parabola-1920.png) | 统一视角 e=1：抛物线、端点按视野裁剪 |
| [10-unified-e1.6667-two-branches-1920.png](screens/10-unified-e1.6667-two-branches-1920.png) | 统一视角 e=5/3（预设 U4）：两支、第二支暗色补画 |
| [11-unified-e1.6-two-branches-1920.png](screens/11-unified-e1.6-two-branches-1920.png) | 统一视角 e=1.6：双曲线两支、中心对称补画 |
| [12-unified-e0.98-clipped-1920.png](screens/12-unified-e0.98-clipped-1920.png) | 统一视角 e=0.98：椭圆弧在视野边界断开、不闭合、note 说明 |
| [13-unified-e1.05-far-branch-note-1920.png](screens/13-unified-e1.05-far-branch-note-1920.png) | e=1.05：另一支在视野外，note 说明只显示含焦点一支 |
| [14-directrix-offscreen-hint-2x.png](screens/14-directrix-offscreen-hint-2x.png) | "准线在视野外"提示 2× 特写 |
| [15-hyperbola-labels-on-1920.png](screens/15-hyperbola-labels-on-1920.png) | 双曲线：标签开启（焦点/准线/渐近线/顶点/P 标签可见） |
| [16-hyperbola-labels-off-1920.png](screens/16-hyperbola-labels-off-1920.png) | 双曲线：标签关闭（辅助标签全部隐藏） |
| [17-playing-mid-1920.png](screens/17-playing-mid-1920.png) | 播放中（统一 e=1.6，P 移动、暂停按钮状态） |
| [18-layout-1920x1080.png](screens/18-layout-1920x1080.png) | 1920×1080 三栏布局 |
| [19-layout-1366x768.png](screens/19-layout-1366x768.png) | 1366×768 三栏布局、播放按钮与左右面板完整可见 |
| [20-layout-1024x800.png](screens/20-layout-1024x800.png) | 1024×800 单列布局（图→参数→方程→图鉴） |
| [21-mobile-390x844-top.png](screens/21-mobile-390x844-top.png) | 390×844 顶部：头部+图 |
| [22-mobile-390x844-params.png](screens/22-mobile-390x844-params.png) | 390×844 参数面板与方程档案 |
| [23-guide-modal-1920.png](screens/23-guide-modal-1920.png) | 方程速查模态（桌面） |
| [24-mobile-guide-modal.png](screens/24-mobile-guide-modal.png) | 方程速查模态（移动端，完整位于视口内） |
| [25-mobile-390x844-catalog.png](screens/25-mobile-390x844-catalog.png) | 390×844 方程档案尾部与曲线图鉴（轨道横向滚动） |

---

## 11. 残余风险

1. **浏览器覆盖**：仅在 Edge/Chromium 155 验证（题目指定）；未实测 Firefox/Safari。
2. **触屏**：390×844 为仿真视口 + 鼠标事件，未做真实触摸手势测试（拖动/双指缩放）。
3. **读屏软件**：只做 DOM/ARIA/键盘层面的启发式检查，未运行 NVDA/VoiceOver 实际播报；#liveName 无 live 区域（M5）。
4. **Canvas 文本**：画布内的提示/标签无法被 DOM 直接断言，本次以 2× 截图目视 + canvas 像素签名辅助确认。
5. **性能**：headless 软件渲染下 rAF 频率受限；未做真实设备长时间动画性能/内存测试，也未做 60fps 压测。
6. **数学抽样范围**：定义不变量在 12 个预设场景、15 组端点及若干相位下验证；未穷举整个参数连续域（数学参考已有 350 项独立核验支撑，本次为页面级抽检）。
7. **预设覆盖**：presets.json 的 U3/U5 超出页面 UI 参数范围，页面按范围夹取（M4），不能完全复现该两组。

---

## 12. 复现方法

    # 环境：Windows，Edge 位于 C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
    #       Node 位于 C:\Users\LHH\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe
    # 工作目录：D:\workspace\数学演示\圆锥曲线

    node qa/_tools/run-part1.mjs    # 环境/加载、12 场景读数、独立数学、预设、统一分支/裁剪、端点、URL、错误
    node qa/_tools/run-part2.mjs    # 模式标签/图鉴/滑杆/焦点轴/开关/播放/重置/键盘/速查模态/四视口/可访问性

    # 脚本各自启动独立 headless Edge（端口 9460/9462，独立 ASCII 临时 user-data-dir），结束后自动关闭；
    # 结果写入 qa/_tools/results-part*.json，截图写入 qa/screens/。
    # 补充截图：node qa/_tools/capture-e065.mjs（统一视角 e=0.65）

---

## 13. 验收边界声明

- 本报告为独立只读验收：未修改 index.html、README.md、preview.png、research/ 下任何文件；QA 写入均位于 圆锥曲线/qa/。
- 最终结论基于 SHA-256 5A829440… 的 index.html；若交付前该文件再次变化，需要重新抽检受影响项（尤其数学读数、布局与截图）。
- 测试中的"FAIL"仅出现在测试脚本自身口径修正前（图鉴轨道内部滚动、headless 相位阈值、重置后仍在播放）；最终版本全部检查通过，这些均已在 9.5 记录，不应视为应用缺陷。
