#!/usr/bin/env python3
import json, os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tpl = open(os.path.join(ROOT, '_template', 'portal_template.html'), encoding='utf-8').read()
data = json.load(open(os.path.join(ROOT, '_template', 'manifest.json'), encoding='utf-8'))

def rgb(hexs):
    h = hexs.lstrip('#')
    return ','.join(str(int(h[i:i+2], 16)) for i in (0, 2, 4))

blocks = []
for bi, book in enumerate(data['books'], 1):
    cards = []
    for ch in book['chapters']:
        d = ch['dir']
        href = d + '/index.html'
        thumb = d + '/preview.png'
        no = '%02d' % ch['no']
        title = html.escape(ch['title'])
        en = html.escape(ch['en'])
        desc = html.escape(ch['desc'])
        cards.append(
            '<article class="card" style="--tc:%s;--tc-rgb:%s">'
            '<button class="thumb" type="button" data-preview="%s" data-title="%s" data-no="%s" aria-label="快速预览：%s">'
            '<img src="%s" alt="%s 预览图" loading="lazy" decoding="async">'
            '<span class="thumb-zoom">▷ 快速预览</span></button>'
            '<div class="body">'
            '<div class="row1"><span class="en">%s</span></div>'
            '<h3>%s</h3><p>%s</p>'
            '<div class="actions"><a href="%s" target="_blank" rel="noopener">打开页面 ↗</a>'
            '<button type="button" data-preview="%s" data-title="%s" data-no="%s">快速预览</button></div>'
            '</div></article>' % (
                ch['accent'], rgb(ch['accent']), d, title, no, title, thumb, title,
                en, title, desc, href, d, title, no)
        )
    blocks.append(
        '<section class="book" id="book-%d"><div class="book-head"><h2>%s</h2><span>%d 章</span></div>'
        '<div class="grid">%s</div></section>' % (bi, book['name'], len(book['chapters']), ''.join(cards))
    )

topic_blocks = []
for ch in data.get('topics', []):
    d = ch['dir']
    href = d + '/index.html'
    thumb = d + '/preview.png'
    title = html.escape(ch['title'])
    en = html.escape(ch['en'])
    desc = html.escape(ch['desc'])
    topic_blocks.append(
        '<section class="book topic-section" id="topic"><div class="book-head"><h2>独立专题</h2><span>%d 个演示</span></div>'
        '<article class="card topic-card" style="--tc:%s;--tc-rgb:%s">'
        '<button class="thumb" type="button" data-preview="%s" data-title="%s" data-no="TOPIC" aria-label="快速预览：%s">'
        '<img src="%s" alt="%s 预览图" loading="lazy" decoding="async"><span class="thumb-zoom">▷ 快速预览</span></button>'
        '<div class="topic-body">'
        '<div class="row1"><span class="num">TOPIC</span><span class="en">%s</span></div>'
        '<h3>%s</h3><p>%s</p>'
        '<div class="actions"><a href="%s" target="_blank" rel="noopener">打开页面 ↗</a>'
        '<button type="button" data-preview="%s" data-title="%s" data-no="TOPIC">快速预览</button></div>'
        '</div></article></section>' % (
            len(data.get('topics', [])), ch['accent'], rgb(ch['accent']), d, title, title, thumb, title,
            en, title, desc, href, d, title)
    )

html_out = tpl.replace('__BOOKS__', '\n'.join(blocks)).replace('__TOPICS__', '\n'.join(topic_blocks))
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html_out)
print('portal built:', len(html_out))
