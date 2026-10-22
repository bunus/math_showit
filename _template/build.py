#!/usr/bin/env python3
# 构建：template.html + _template/src/<章>/meta.json + modules.js -> <章>/index.html
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '_template', 'src')
TPL = os.path.join(ROOT, '_template', 'template.html')


def source_dir(name):
    """优先使用章节目录内的源文件；否则使用 _template/src 归档。"""
    local = os.path.join(ROOT, name)
    archived = os.path.join(SRC, name)
    for folder in (local, archived):
        if os.path.exists(os.path.join(folder, 'meta.json')) and os.path.exists(os.path.join(folder, 'modules.js')):
            return folder
    return None


def build_one(name):
    src = source_dir(name)
    if not src:
        return None
    with open(TPL, encoding='utf-8') as f:
        page = f.read()
    with open(os.path.join(src, 'meta.json'), encoding='utf-8') as f:
        meta = json.load(f)
    with open(os.path.join(src, 'modules.js'), encoding='utf-8') as f:
        mods = f.read()
    slots = {
        '__PAGE_TITLE__': meta.get('pageTitle', meta['h1'] + ' · 动态教学实验室'),
        '__META_DESC__': meta.get('metaDesc', meta['h1'] + '：动态可视化教学演示'),
        '__EYEBROW_EN__': meta.get('eyebrowEn', 'Math Lab'),
        '__EYEBROW_CN__': meta.get('eyebrowCn', meta.get('book', '高中数学')),
        '__H1__': meta['h1'],
        '__TITLE_EN__': meta.get('titleEn', 'MATH LAB'),
        '__CATALOG_HINT__': meta.get('catalogHint', ''),
        '__CATALOG_SUB__': meta.get('catalogSub', '点击切换'),
    }
    for k, v in slots.items():
        page = page.replace(k, v)
    page = page.replace('/*__MODULES__*/', mods)
    out_dir = os.path.join(ROOT, name)
    if not os.path.isdir(out_dir):
        return None
    out = os.path.join(out_dir, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(page)
    return out


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    names = set()
    if os.path.isdir(SRC):
        names.update(d for d in os.listdir(SRC) if os.path.isdir(os.path.join(SRC, d)))
    for d in os.listdir(ROOT):
        if os.path.isdir(os.path.join(ROOT, d)) and d != '_template':
            if os.path.exists(os.path.join(ROOT, d, 'meta.json')):
                names.add(d)
    n = 0
    for name in sorted(names):
        if arg != 'all' and arg not in name:
            continue
        if build_one(name):
            n += 1
            print('built', name)
    print('done', n)


if __name__ == '__main__':
    main()
