#!/usr/bin/env python3
# 为每个章节生成 README.md（基于 meta.json 与 modules.js 中的情境列表）
import json, os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAT = re.compile(r"tab:\s*'(\d{2})'\s*,\s*name:\s*'([^']+)'\s*,\s*en:\s*'([^']+)'\s*,\s*blurb:\s*'([^']+)'")
BT = chr(96)
FENCE = BT * 3

def one(folder):
    meta = json.load(open(os.path.join(folder, 'meta.json'), encoding='utf-8'))
    src = open(os.path.join(folder, 'modules.js'), encoding='utf-8').read()
    rows = PAT.findall(src)
    if not rows:
        return None
    book = meta.get('eyebrowCn', '高中数学')
    title = meta['h1']
    en = meta.get('titleEn', 'MATH LAB')
    lines = []
    lines.append('# %s · %s\n' % (title, en.title()))
    lines.append('一个可直接双击打开的单文件动态教学网页，对应%s。' % book)
    lines.append('本页包含 %d 个可拖拽、可调节的教学情境，图形、公式与实时数据同步联动。\n' % len(rows))
    lines.append('直接用浏览器打开 [index.html](index.html) 即可，**无需联网、无需安装依赖、无需启动服务**。\n')
    lines.append('![%s 界面预览](preview.png)\n' % title)
    lines.append('---\n')
    lines.append('## 快速开始\n')
    lines.append('1. 双击 %sindex.html%s（推荐 Chrome / Edge / Firefox / Safari 近年版本）。' % (BT, BT))
    lines.append('2. 在左侧「情境与参数」中切换 %d 个情境，或点击底部「情境图鉴」。' % len(rows))
    lines.append('3. 拖动画布中的彩色端点，调节左栏滑块、开关与按钮。')
    lines.append('4. 顶部「重置本节」恢复当前情境；「全屏」适合课堂投屏。')
    lines.append('5. 键盘 %s←%s / %s→%s 切换情境。\n' % (BT, BT, BT, BT))
    lines.append('---\n')
    lines.append('## 五个情境\n')
    lines.append('| 编号 | 情境 | 英文 | 关注点 |')
    lines.append('| --- | --- | --- | --- |')
    for tab, name, en2, blurb in rows:
        lines.append('| %s | %s | %s | %s |' % (tab, name, en2, blurb))
    lines.append('')
    lines.append('---\n')
    lines.append('## 交互与界面\n')
    lines.append('- 左栏：情境列表与本节参数控件（滑块、开关、按钮）。')
    lines.append('- 中栏：Canvas 动态图、当前情境徽标、底部核心公式与实时读数。')
    lines.append('- 右栏：概念说明、公式卡、实时数据卡与观察提示。')
    lines.append('- 底栏：情境图鉴，点击可在五个情境之间快速跳转。\n')
    lines.append('颜色约定：每个情境使用独立主题色；拖动端点带环形手柄，悬停变手型。\n')
    lines.append('---\n')
    lines.append('## 文件结构\n')
    lines.append(FENCE + 'text')
    lines.append('index.html    单文件教学演示（HTML / CSS / 原生 Canvas JS）')
    lines.append('README.md     本说明')
    lines.append('preview.png   页面预览图')
    lines.append(FENCE + '\n')
    lines.append('---\n')
    lines.append('## 说明\n')
    lines.append('- 页面无外网依赖，所有图形与文字均使用系统能力绘制。')
    lines.append('- 画布按 devicePixelRatio 缩放；窄屏自动改为纵向堆叠。')
    lines.append('- 拖动端点被限制在当前视野内；刷新后回到第一个情境。')
    out = os.path.join(folder, 'README.md')
    open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    return out

n = 0
for folder in sorted(set(os.path.dirname(p) for p in glob.glob(os.path.join(ROOT, '*', 'modules.js')))):
    if one(folder):
        n += 1
print('readmes', n)
