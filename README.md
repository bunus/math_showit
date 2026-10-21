# 高中数学动态演示 · Math Showit

面向高中数学课堂的单文件动态演示网页，双击 `index.html` 即可使用，无需联网、无需安装依赖、无需启动服务器。

## 演示列表

| 目录 | 内容 |
| --- | --- |
| [平面切正方体](平面切正方体/) | 平面切割正方体，实时显示截面形状与全截面图鉴 |
| [平面向量](平面向量/) | 向量的概念、线性运算、基本定理、数量积及应用 |
| [圆锥曲线](圆锥曲线/) | 椭圆、双曲线、抛物线的方程与统一定义 |
| [直线与园的方程](直线与园的方程/) | 倾斜角与斜率、直线方程、距离公式、圆的方程与位置关系 |

各演示的详细说明、快捷键与 URL 参数见对应目录下的 `README.md`。

## 使用方法

```bash
git clone https://github.com/bunus/math_showit.git
```

进入任意演示目录，用浏览器打开 `index.html` 即可（推荐 Chrome / Edge / Firefox 近年版本）。

## 目录结构

```text
数学演示/
├── 平面切正方体/
│   ├── index.html      演示页面
│   ├── README.md       项目说明
│   └── preview.png     预览图
├── 平面向量/
├── 圆锥曲线/
├── 直线与园的方程/
└── LICENSE
```

## 新增演示

每个演示一个独立目录，包含 `index.html`（HTML / CSS / JavaScript 全部内联）和 `README.md`，在此处「演示列表」中补一行即可。

## 许可

[MIT License](LICENSE) · Copyright (c) 2026 bunus
