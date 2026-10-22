# 章节页开发指南

每个章节交付目录 `<章>/` 只保留三个文件：`index.html`、`README.md`、`preview.png`。

构建源文件统一放在 `_template/src/<章>/`：

- `meta.json`：页面标题与文案槽位；
- `modules.js`：本章 5 个交互情境（数组 push）。

构建脚本会把 `_template/template.html`（布局、CSS、Canvas 引擎）与源文件合并成单文件 `<章>/index.html`。**不要直接改 template.html，也不要手写 index.html。**

## meta.json

```json
{
  "h1": "集合与常用逻辑用语",
  "titleEn": "SETS & LOGIC",
  "eyebrowEn": "Set Theory Lab",
  "eyebrowCn": "必修第一册 · 第 1 章",
  "catalogHint": "集合 = 确定的、互异的整体",
  "catalogSub": "五个情境 · 点击切换",
  "metaDesc": "集合与常用逻辑用语：动态韦恩图、数轴与条件关系。"
}
```

## modules.js 结构

```js
MODULES.push({
  key: 'sets',            // 英文标识
  tab: '01',              // 01..05
  name: '集合的含义',      // 左侧导航短名
  en: 'SETS',             // 英文小字
  blurb: '元素与集合',     // 底部图鉴副标题
  accent: '#5eead4',      // 本章情境主题色
  rgb: '94,234,212',      // 对应 RGB
  hint: '拖动圆点，观察元素与集合的关系',
  state: { ... },         // 任意状态
  reset() { ... },        // 恢复默认状态（必写）
  meta() {                // 右侧要点（必写）
    return {
      title: '情境标题',
      desc: '一段 60–120 字的说明，可用 <b>…</b>',
      formula: 'A ∩ B = {x | x∈A 且 x∈B}',   // 可含 <br>、<sub>、<sup>
      note: '观察提示，可用 <i>…</i>、<span class="nw">…</span>'
    };
  },
  handles() {             // 可拖动点（可省略）
    return [{id: 'A', ...this.state.A}];
  },
  drag(id, p) {           // p 是世界坐标 {x,y}
    const q = clampPt(p);
    this.state[id] = q;
  },
  orbit(dx, dy) {         // 可选：拖动空白画布旋转立体视图
    this.state.yaw -= dx * .007;
    this.state.pit = clamp(this.state.pit + dy * .006, -.15, 1.15);
  },
  orbitEnabled() { return true; },  // 可选：按当前视角决定是否允许拖动
  draw(dt) {              // 每帧绘制（必写）
    setFrame(.5, .55, 12);
    base();
    // ... 使用下面的绘图工具
  },
  hud() {                 // 右侧实时数据，3–6 项
    return [{k: '|A|', v: '3', hi: true}];
  },
  panel(el) {             // 左侧控件（必写，可只放说明按钮）
    addToggle(el, '显示元素', this.state.show, v => this.state.show = v);
  }
});
```

5 个情境的 `tab` 依次为 01–05，`key` 不重复。

## 可用的引擎与绘图函数

坐标：世界坐标 → 屏幕坐标由 `setFrame` 决定。常用世界范围约 x∈[-6,6]、y∈[-4,4]。

| 函数 | 说明 |
| --- | --- |
| `setFrame(cx, cy, span)` | 设置原点位置（画布宽高比例）与横向世界跨度；每帧开头调用 |
| `base()` | 画网格与坐标轴 |
| `X(x)` / `Y(y)` | 世界坐标转屏幕坐标 |
| `arrow(a, b, color, opt)` | 从 a 到 b 的箭头；opt: `{w,head,dash,alpha,glow}` |
| `line(a, b, color, opt)` | 线段；opt: `{w,dash,alpha}` |
| `dot(p, color, r)` | 发光圆点 |
| `handle(p, color, active)` | 可拖动端点手柄 |
| `math(txt, x, y, color, size, align, baseline)` | 数学斜体文字（屏幕坐标） |
| `sans(txt, x, y, color, size, align, baseline)` | 普通文字（屏幕坐标） |
| `vlabel(a, b, txt, color, off, size)` | 沿向量中点法向放置标签 |
| `segLabel(a, b, txt, color, frac, off, size)` | 在线段 frac 处放普通文字 |
| `segMath(a, b, txt, color, frac, off, size)` | 同上，数学斜体 |
| `angleArc(c, th1, th2, r, color, txt, size)` | 以 c 为顶点、从 th1 到 th2 的角弧（弧度） |
| `rightAngle(center, u, v, s, color)` | 直角小方块 |
| `lim()` | 当前可见世界范围 `{x0,x1,y0,y1}` |
| `clampPt(p)` | 把世界坐标夹到可见范围内 |
| `fmt(n, d)` / `deg(rad)` / `len2(x,y)` | 数值格式化 / 弧度转角度 / 向量长度 |

控件：

| 函数 | 说明 |
| --- | --- |
| `addSlider(el, label, min, max, step, value, format, onInput)` | 返回 `{input, set(v)}`；format 为显示函数 |
| `addToggle(el, label, value, onChange)` | 开关 |
| `addBtn(el, label, fn, 'ghost')` | 按钮；`row(el)` 可先建一行 |
| `row(el)` | 返回一个横向按钮容器 |

全局变量：`V.k`（像素/单位）、`W`、`H`、`DPR`、`clamp`、`lerp`、`TAU`、`easeInOut`、`tscale()`。

## 约定

- 5 个情境各用一个独立主题色（从下方色板取），并填写对应 rgb。
- 画布上不要画大段说明文字；说明放 `meta().desc` / `note`。
- 数值必须与图形一致，不要出现“图上一半、读数另一套”。
- 拖动点使用 `handle`，并在 `drag` 中调用 `clampPt`；立体图可提供 `orbit(dx,dy)`，让整幅画布都能拖动旋转，并用 `orbitEnabled()` 控制启用条件。
- 所有文案用中文；公式可用 Unicode（²、√、∈、∩、∪、≤、≥、α、β、θ 等）。
- 不引入外部库、图片、字体或网络请求。

## 色板

`#5eead4 / 94,234,212`、`#6cb6ff / 108,182,255`、`#ff8fab / 255,143,171`
`#b49cff / 180,156,255`、`#ffc56b / 255,197,107`、`#7be0c0 / 123,224,192`
`#ffa97a / 255,169,122`、`#9ad0ff / 154,208,255`

## 构建与自检

```bash
node --check _template/src/集合与常用逻辑用语/modules.js
python3 _template/build.py 集合与常用逻辑用语
python3 _template/make_readmes.py
python3 _template/portal.py
```

构建成功会生成 `<章>/index.html`；`index.html` 已内联全部 CSS 与 JavaScript，可单独复制使用。`_template/src/` 中的 `meta.json`、`modules.js` 只是构建源文件，不随章节目录分发。
