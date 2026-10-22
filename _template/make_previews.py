#!/usr/bin/env python3
# 为所有章节页面生成 preview.png（1600x950）
import os, glob, subprocess, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDGE = '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
WIN = 'D:/workspace/数学演示/'

pages = sorted(glob.glob(os.path.join(ROOT, '*', 'index.html')))
for i, page in enumerate(pages):
    rel = os.path.relpath(page, ROOT).replace('\\', '/')
    url = 'file:///' + urllib.parse.quote(WIN + rel, safe='/')
    out = (WIN + rel.replace('index.html', 'preview.png'))
    subprocess.run([
        EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars',
        '--user-data-dir=C:\\tmp\\edgeprof_prev%d' % i,
        '--virtual-time-budget=2600', '--window-size=1600,950',
        '--screenshot=' + out, url
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print('shot', rel)
