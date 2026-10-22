#!/usr/bin/env python3
# 为模板章节生成 README.md（源文件统一读取 _template/src）
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '_template', 'src')
PAT = re.compile(r"tab:\s*'(\d{2})'\s*,\s*name:\s*'([^']+)'\s*,\s*en:\s*'([^']+)'\s*,\s*blurb:\s*'([^']+)'")
BT = chr(96)
FENCE = BT * 3

manifest = json.load(open(os.path.join(ROOT, '_template', 'manifest.json'), encoding='utf-8'))
NO = {ch['dir']: ch['no'] for book in manifest['books'] for ch in book['chapters']}


def one(name):
    src = os.path.join(SRC, name)
    meta_path = os.path.join(src, 'meta.json')
    mod_path = os.path.join(src, 'modules.js')
    if not (os.path.exists(meta_path) and os.path.exists(mod_path)):
        return None
    meta = json.load(open(meta_path, encoding='utf-8'))
    body = open(mod_path, encoding='utf-8').read()
    rows = PAT.findall(body)
    if not rows:
        return None
    hints = re.findall(r"hint:\s*'([^']*)'", body)
    if len(hints) != len(rows):
        hints = [''] * len(rows)
    no = NO.get(name)
    title = meta['h1']
    en = meta.get('titleEn', 'MATH LAB')
    scene_word = '五个情境' if len(rows) == 5 else ('%d 个情境' % len(rows))
    lines = []
    lines.append('# %s · %s\n' % (title, en))
    lines.append('一个可直接双击打开的单文件动态教学网页，对应%s%s。' % (meta.get('eyebrowCn', '高中'), (' · 第 %d 章' % no) if no else ''))
    lines.append('本页包含 %d 个可拖拽、可调节的教学情境，图形、公式与实时数据同步联动。\n' % len(rows))
    lines.append('直接用浏览器打开 [index.html](index.html) 即可，**无需联网、无需安装依赖、无需启动服务**。\n')
    lines.append('![%s 界面预览](preview.png)\n' % title)
    lines.append('---\n')
    lines.append('## 快速开始\n')
    lines.append('1. 双击 %sindex.html%s（推荐 Chrome / Edge / Firefox / Safari 近年版本）。' % (BT, BT))
    lines.append('2. 在左侧「情境与参数」中切换 %d 个情境，或点击底部「情境图鉴」。' % len(rows))
    lines.append('3. 拖动画布端点，调节左栏滑块、开关与按钮；立体图可直接拖动画布旋转。')
    lines.append('4. 顶部「重置本节」恢复当前情境；「全屏」适合课堂投屏。')
    lines.append('5. 键盘 %s←%s / %s→%s 切换情境；带播放按钮的情境可用空格播放。\n' % (BT, BT, BT, BT))
    lines.append('---\n')
    lines.append('## %s\n' % scene_word)
    lines.append('| 编号 | 情境 | 英文 | 关注点 | 操作提示 |')
    lines.append('| --- | --- | --- | --- | --- |')
    for (tab, name2, en2, blurb), hint in zip(rows, hints):
        lines.append('| %s | %s | %s | %s | %s |' % (tab, name2, en2, blurb, hint))
    lines.append('')
    lines.append('---\n')
    lines.append('## 页面结构\n')
    lines.append('- 左栏：情境列表与当前情境的参数控件（滑块、开关、按钮）。')
    lines.append('- 中栏：Canvas 动态图、情境徽标、底部核心公式与实时读数。')
    lines.append('- 右栏：概念说明、公式卡、实时数据卡与观察提示。')
    lines.append('- 底栏：情境图鉴，点击可在情境之间快速跳转。\n')
    lines.append('每个情境使用独立主题色；导航、数据卡、公式条与画布同步换色。\n')
    lines.append('---\n')
    lines.append('## 文件说明\n')
    lines.append('- %sindex.html%s：**单文件交付**，HTML / CSS / JavaScript 已全部内联，可单独复制到任意目录双击打开。' % (BT, BT))
    lines.append('- %spreview.png%s：页面预览图，供总览页使用。' % (BT, BT))
    lines.append('- %sREADME.md%s：本说明。\n' % (BT, BT))
    lines.append('本章目录只保留这三个交付文件。构建源文件统一归档在 %s_template/src/%s%s，不随章节分发。\n' % (BT, name, BT))
    lines.append('## 开发维护\n')
    lines.append('源文件归档在 %s_template/src/%s%s。修改后从仓库根目录运行：\n' % (BT, name, BT))
    lines.append(FENCE + 'bash')
    lines.append('python3 _template/build.py ' + name)
    lines.append('python3 _template/make_readmes.py')
    lines.append(FENCE + '\n')
    lines.append('---\n')
    lines.append('## 验证与说明\n')
    lines.append('- 页面无外网依赖，所有图形、字体与文字均使用系统能力绘制。')
    lines.append('- 画布按 devicePixelRatio 缩放；窄屏自动改为「舞台 → 情境与参数 → 本节要点 → 情境图鉴」纵向堆叠。')
    lines.append('- 拖动端点被限制在当前视野内；刷新后回到第一个情境。\n')
    out = os.path.join(ROOT, name, 'README.md')
    open(out, 'w', encoding='utf-8').write('\n'.join(lines))
    return out


n = 0
for name in sorted(os.listdir(SRC)):
    if os.path.isdir(os.path.join(SRC, name)) and one(name):
        n += 1
print('readmes', n)
