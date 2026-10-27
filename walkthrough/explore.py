"""Explore a page step by step: python explore.py <name> <url> [js-or-click steps...]. Each step is 'click:<text>' (a
button/link by visible text), 'sel:<css>' (click a selector), 'type:<css>|<text>', 'wait:<ms>', or 'js:<code>'.
Saves explore/<name>-<n>.png after every step and prints the visible buttons and links."""
import sys, json
from playwright.sync_api import sync_playwright
name, url, steps = sys.argv[1], sys.argv[2], sys.argv[3:]
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1280, 'height': 720}, device_scale_factor=1, color_scheme='dark')
    pg = ctx.new_page(); pg.goto(url, wait_until='networkidle'); pg.wait_for_timeout(600)
    def dump(n):
        pg.screenshot(path=f'explore/{name}-{n}.png')
        items = pg.evaluate("""() => [...document.querySelectorAll('button,a,[role=button],input,textarea')].filter(e => {const r=e.getBoundingClientRect(); return r.width && r.height && r.bottom>0 && r.top<innerHeight}).map(e => (e.tagName+' '+(e.id?'#'+e.id+' ':'')+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ').join('.')+' ':'')+JSON.stringify((e.innerText||e.value||e.placeholder||'').trim().slice(0,50))).slice(0,140))""")
        print(f'--- {name}-{n}'); print('\n'.join(items[:40]))
    dump(0)
    for i, s in enumerate(steps, 1):
        kind, _, arg = s.partition(':')
        if kind == 'click': pg.get_by_text(arg, exact=False).first.click()
        elif kind == 'sel': pg.locator(arg).first.click()
        elif kind == 'type': css, _, txt = arg.partition('|'); pg.locator(css).first.fill(txt)
        elif kind == 'wait': pg.wait_for_timeout(int(arg))
        elif kind == 'js': print('js ->', pg.evaluate(arg))
        pg.wait_for_timeout(500); dump(i)
    b.close()
