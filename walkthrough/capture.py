"""Capture the walkthrough's screens from the live site: python walkthrough/capture.py

Every shot is a 2x PNG of a 1120x630 viewport, in light mode (LIGHT sets each tool's own theme key) in video/public/shots/, and video/src/shots.json records,
per shot, the box of the element clicked next (`click`) and any box worth zooming into (`zoom`), in CSS pixels.
Math.random is seeded so the sims deal the same questions every run. Uses the installed Chrome (channel='chrome').
"""
import json, os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, 'video', 'public', 'shots')
SITE = 'https://jeremyspm.github.io'
W, H = 1120, 630
SEED = """(() => { let a = 20261027; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();"""
LIGHT = """try { localStorage.setItem('hub.theme', 'light'); localStorage.setItem('inpf.theme', '"light"');
  localStorage.setItem('hs2f.theme', '"light"'); localStorage.setItem('hs2pod-theme', 'light'); } catch (e) {}"""

manifest = {}

def box(pg, sel):
    b = pg.locator(sel).first.bounding_box()
    return {k: round(v, 1) for k, v in b.items()} if b else None

def union(*bs):
    bs = [b for b in bs if b]
    x0, y0 = min(b['x'] for b in bs), min(b['y'] for b in bs)
    x1, y1 = max(b['x'] + b['width'] for b in bs), max(b['y'] + b['height'] for b in bs)
    return {'x': x0, 'y': y0, 'width': x1 - x0, 'height': y1 - y0}

def shot(pg, name, click=None, zoom=None):
    pg.wait_for_timeout(450)
    pg.mouse.move(-10, -10)  # no hover states in the stills
    pg.screenshot(path=os.path.join(SHOTS, name + '.png'))
    manifest[name] = {'click': box(pg, click) if isinstance(click, str) else click,
                      'zoom': box(pg, zoom) if isinstance(zoom, str) else zoom}
    print('shot', name, manifest[name])

def fresh(browser, url):
    ctx = browser.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, color_scheme='light')
    ctx.add_init_script(SEED); ctx.add_init_script(LIGHT)
    pg = ctx.new_page(); pg.goto(url, wait_until='networkidle'); pg.wait_for_timeout(500)
    return ctx, pg

def type_slowly(pg, sel, text, frames, name):
    """Fill a field in `frames` steps, a shot after each, so the edit can play it as typing."""
    for i in range(1, frames + 1):
        pg.locator(sel).first.fill(text[: round(len(text) * i / frames)])
        shot(pg, f'{name}{i}')

def main():
    os.makedirs(SHOTS, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome')

        # hub → INP exam (Write tab) → its tabs; HS2's tabs for the Listen line
        ctx, pg = fresh(b, SITE + '/')
        shot(pg, 'hub', click='a.card.row.hot:has-text("INP Final")')
        pg.locator('a.card.row.hot:has-text("INP Final")').click()
        shot(pg, 'inp-tabs', zoom='.sides')
        ctx.close()
        ctx, pg = fresh(b, SITE + '/#hs2/exam')
        shot(pg, 'hs2-tabs', zoom='.sides')
        ctx.close()

        # HS2 Write: home, a piece read, key words hidden, typed, checked
        ctx, pg = fresh(b, SITE + '/hs2-final/rep.html')
        shot(pg, 'w-home', zoom='.today', click='#begin')
        pg.click('#begin'); pg.wait_for_timeout(300)
        if pg.locator('#introGo').count(): pg.click('#introGo')
        shot(pg, 'w-read', zoom='.facts', click='#climb')
        keys = pg.evaluate("() => [...document.querySelectorAll('.facts li')].map(li => [...li.querySelectorAll('b')].map(b => b.innerText.trim()))")
        pg.click('#climb')
        blanks = pg.locator('input.blank')
        shot(pg, 'w-hide0', zoom='.facts', click=None)
        fk = pg.evaluate("() => [...document.querySelectorAll('input.blank')].map(i => [+i.dataset.f, +i.dataset.k])")
        answers = [keys[f][k] if f < len(keys) and k < len(keys[f]) else '' for f, k in fk]
        print('blank answers:', answers)
        for i in range(blanks.count()):
            if answers[i]: blanks.nth(i).fill(answers[i])
            shot(pg, f'w-hide{i + 1}', zoom='.facts', click='#checkStep' if i == blanks.count() - 1 else None)
        pg.click('#checkStep')
        shot(pg, 'w-checked', zoom='.facts')
        ctx.close()

        # INP Write: the exam tab, the trainer list, read, write it, marked
        ctx, pg = fresh(b, SITE + '/#inp/exam/write')
        shot(pg, 'i-tab', click='a.cta')
        ctx.close()
        ctx, pg = fresh(b, SITE + '/inp-final/#saq')
        shot(pg, 'i-list', click='.btn.primary.wide')
        pg.locator('.btn.primary.wide').first.click()
        shot(pg, 'i-read', click='#sqGo')
        pg.click('#sqGo')
        answer = ('Discharge planning is an interdisciplinary approach to continuity of care. It helps the person move '
                  'smoothly from hospital to home, keeps the progress already made, and begins at admission.\n'
                  'Two benefits: fewer readmissions, and a shorter length of hospital stay.')
        shot(pg, 'i-write0', zoom='#sqTxt')
        type_slowly(pg, '#sqTxt', answer, 5, 'i-write')
        manifest['i-write5']['click'] = box(pg, '#sqMark')
        pg.click('#sqMark')
        shot(pg, 'i-marked')
        ctx.close()

        # Flashcards: the tab, decks, a card, its answer, the next card
        ctx, pg = fresh(b, SITE + '/#inp/exam/cards')
        shot(pg, 'c-tab', click='a.cta')
        ctx.close()
        ctx, pg = fresh(b, SITE + '/inp-final/cards.html')
        shot(pg, 'c-decks', click='#studyAll')
        pg.click('#studyAll')
        shot(pg, 'c-front', click='#show')
        pg.click('#show')
        shot(pg, 'c-back', zoom='.grades', click='[data-ease="3"]')
        pg.click('[data-ease="3"]')
        shot(pg, 'c-next')
        ctx.close()

        # Rep: the tab, a question answered right (found on a first pass with the same seed), checked, the misses button
        ctx, pg = fresh(b, SITE + '/inp-final/#learn')
        pg.locator('.btn.primary.wide').first.click(); pg.wait_for_timeout(400)
        pg.locator('.opt').first.click(); pg.click('#chkB'); pg.wait_for_timeout(400)
        right = pg.evaluate("() => [...document.querySelectorAll('.opt')].findIndex(o => o.classList.contains('k'))")
        ctx.close()
        print('rep: right option', right)
        ctx, pg = fresh(b, SITE + '/#inp/exam/rep')
        shot(pg, 'r-tab', click='a.cta')
        ctx.close()
        ctx, pg = fresh(b, SITE + '/inp-final/#learn')
        shot(pg, 'r-menu', click='.btn.primary.wide')
        pg.locator('.btn.primary.wide').first.click()
        shot(pg, 'r-q', click=f'.opt >> nth={max(right, 0)}')
        pg.locator('.opt').nth(max(right, 0)).click()
        shot(pg, 'r-picked', click='#chkB')
        pg.click('#chkB'); pg.wait_for_timeout(300); pg.evaluate('scrollTo(0, 0)')
        shot(pg, 'r-checked')
        ctx.close()
        ctx, pg = fresh(b, SITE + '/inp-final/#learn')
        shot(pg, 'r-misses', zoom='button:has-text("Learn my misses") >> xpath=..')
        ctx.close()

        # Mock, then HS2's Listen tab and the podcast
        ctx, pg = fresh(b, SITE + '/#inp/exam/mock')
        shot(pg, 'm-tab', click='a.cta')
        ctx.close()
        ctx, pg = fresh(b, SITE + '/inp-final/#mock')
        shot(pg, 'm-menu', zoom='.btn.wide >> nth=1')
        ctx.close()
        ctx, pg = fresh(b, SITE + '/#hs2/exam/listen')
        shot(pg, 'l-tab', click='a.cta')
        ctx.close()
        ctx, pg = fresh(b, SITE + '/hs2-podcast/#final')
        shot(pg, 'l-pod')
        ctx.close()

        # close: the hub again
        ctx, pg = fresh(b, SITE + '/')
        shot(pg, 'end')
        ctx.close()
        b.close()
    json.dump({'w': W, 'h': H, 'shots': manifest}, open(os.path.join(HERE, 'video', 'src', 'shots.json'), 'w'), indent=1)

if __name__ == '__main__':
    main()
