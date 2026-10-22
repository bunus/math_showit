#!/usr/bin/env python3
# 构建：template.html + <分册>/<章>/meta.json + modules.js -> index.html
import json, os, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPL = os.path.join(ROOT, '_template', 'template.html')

def build_one(folder):
    meta_path = os.path.join(folder, 'meta.json')
    mod_path = os.path.join(folder, 'modules.js')
    if not (os.path.exists(meta_path) and os.path.exists(mod_path)):
        return None
    with open(TPL, encoding='utf-8') as f:
        page = f.read()
    with open(meta_path, encoding='utf-8') as f:
        meta = json.load(f)
    with open(mod_path, encoding='utf-8') as f:
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
    out = os.path.join(folder, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(page)
    return out

def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    folders = sorted(set(os.path.dirname(p) for p in glob.glob(os.path.join(ROOT, '*', 'meta.json'))))
    if arg != 'all':
        folders = [f for f in folders if arg in f]
    n = 0
    for folder in folders:
        out = build_one(folder)
        if out:
            n += 1
            print('built', os.path.relpath(folder, ROOT))
    print('done', n)

if __name__ == '__main__':
    main()
