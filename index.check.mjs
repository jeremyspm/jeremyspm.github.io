/* index.check.mjs — the gate for the landing page (index.html). Run before every push:
     node index.check.mjs          content, links between lists, dates, icons, search, house rules
     node index.check.mjs --live   also fetches every tool URL and checks each jump's #screen exists
   Exit 1 on any failure. The page's own script is run here (with a stub DOM), so what is checked
   is the code that ships, not a copy of it. */
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const fails = [], notes = [];
const fail = m => fails.push(m), note = m => notes.push(m);

/* 1. the script parses (a stray apostrophe kills a single-file app silently) */
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const main = scripts.find(s => s.includes('const TOOLS'));
if (!main) { console.error('FAIL: no main script with TOOLS'); process.exit(1); }
for (const s of scripts) { try { new vm.Script(s); } catch (e) { fail('script does not parse: ' + e.message); } }

/* 2. run it against a stub DOM and pull the lists + the search out */
const stub = () => new Proxy(function () {}, {
  get: (t, k) => k === Symbol.toPrimitive ? () => '' : ['innerHTML', 'textContent', 'value', 'title'].includes(k) ? '' : stub(),
  set: () => true, apply: () => stub(),
});
const ctx = vm.createContext({ document: stub(), history: stub(), location: stub(), window: stub(), addEventListener() {}, console });
let L;
try { L = vm.runInContext(main + '\n;({TOOLS, PAPERS, SIM, CHECKED, search, needs, when})', ctx); }
catch (e) { for (const f of fails) console.error('FAIL: ' + f); console.error('FAIL: script throws on load: ' + e.message); process.exit(1); }
const { TOOLS, PAPERS, search, needs, when } = L;

/* 3. lists agree with each other */
const sprite = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
const used = new Set(), jumps = [];
for (const [id, T] of Object.entries(TOOLS)) {
  for (const k of ['nm', 'ic', 'url', 'ds']) if (!T[k]) fail(`tool ${id}: missing ${k}`);
  if (T.ic && !sprite.has(T.ic)) fail(`tool ${id}: icon ${T.ic} is not in the sprite`);
  if (/^https?:|^\//.test(T.url)) fail(`tool ${id}: url must be relative to the site root (${T.url})`);
  if (!T.url.includes('/') && !existsSync(new URL('./' + T.url, import.meta.url))) fail(`tool ${id}: ${T.url} is not in this repo`);
}
const pids = new Set();
for (const p of PAPERS) {
  if (pids.has(p.id)) fail(`paper id ${p.id} twice`); pids.add(p.id);
  if (!sprite.has(p.ic)) fail(`paper ${p.id}: icon ${p.ic} is not in the sprite`);
  if (!/^var\(--[a-z]+\)$/.test(p.hue) || !html.includes(p.hue.slice(4, -1) + ':')) fail(`paper ${p.id}: hue ${p.hue} is not a defined token`);
  const nids = new Set();
  for (const n of p.needs) {
    const at = `${p.id}/${n.id}`;
    if (nids.has(n.id)) fail(`${at}: need id twice`); nids.add(n.id);
    for (const k of ['t', 's', 'kw']) if (!n[k]) fail(`${at}: missing ${k}`);
    if (!n.tools || !n.tools.length) fail(`${at}: no tools`);
    const seen = new Set();
    for (const t of n.tools || []) {
      const e = typeof t === 'string' ? { id: t } : t;
      if (!TOOLS[e.id]) { fail(`${at}: tool ${e.id} does not exist`); continue; }
      if (seen.has(e.id)) fail(`${at}: tool ${e.id} listed twice`); seen.add(e.id);
      used.add(e.id);
      for (const j of e.jump || []) {
        if (j.length !== 3 || !j[0] || !j[1]) fail(`${at}: bad jump ${JSON.stringify(j)}`);
        if (!sprite.has(j[2])) fail(`${at}: jump icon ${j[2]} is not in the sprite`);
        jumps.push([e.id, j[0], at]);
      }
      if (e.cta) jumps.push([e.id, e.cta[0], at]);
    }
    const ok = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00'));
    if (n.hot && (!n.hot.tag || !ok(n.hot.until))) fail(`${at}: bad hot ${JSON.stringify(n.hot)}`);
    if (n.date) {
      const D = n.date;
      const start = D.from || D.on;
      if (!start || !ok(start) || (D.to && !ok(D.to))) fail(`${at}: bad date ${JSON.stringify(D)}`);
      else if (D.to && D.to < D.from) fail(`${at}: date ends before it starts`);
      if (D.on && (D.from || D.to)) fail(`${at}: date has both on and from/to`);
      for (const k of ['chip', 'what', 'txt']) if (!D[k]) fail(`${at}: date missing ${k}`);
      const w = when(n);
      if (w && w.past) note(`${at}: date has passed (${D.to || D.on})${D.keep ? ', kept without its date' : ', hidden'}`);
    }
  }
}
for (const id of Object.keys(TOOLS)) if (!used.has(id)) fail(`tool ${id} is in TOOLS but no problem links to it`);

/* 4. search: everyday words land on the right problem (skipped once that problem has hidden itself) */
const PROBES = [
  ['blood pressure', 'inp/bp'], ['bp', 'inp/bp'], ['obs', 'inp/vs'], ['sats', 'inp/vs'], ['test 3', 'hs2/t3'],
  ['ear', 'hs2/t3'], ['lactation', 'hs2/t3'], ['pedigree', 'hs2/gen'], ['punnett', 'hs2/gen'], ['bones', 'hs2/anat'],
  ['flesh and bone', 'hs2/anat'], ['cystic fibrosis', 'hs2/exam'], ['hs2 exam', 'hs2/exam'], ['videos', 'hs2/vid'],
  ['mg to ml', 'ph/calc'], ['drip rate', 'ph/calc'], ['medcalc', 'ph/calc'], ['med admin', 'ph/admin'],
  ['abbreviations', 'ph/terms'], ['qid', 'ph/terms'], ['drug classes', 'ph/drugs'], ['pharm exam', 'ph/exam'],
  ['inp exam', 'inp/exam'], ['med chart', 'inp/chart'], ['chart sim', 'inp/chart'], ['placement', 'inp/place'],
];
const live = new Set(PAPERS.flatMap(p => needs(p).map(n => `${p.id}/${n.id}`)));
let probed = 0;
for (const [q, want] of PROBES) {
  if (!live.has(want)) { note(`search "${q}": skipped, ${want} has hidden itself`); continue; }
  let r; try { r = search(q); } catch (e) { fail(`search "${q}" throws: ${e.message}`); continue; }
  const got = r && r[0] ? `${r[0].p.id}/${r[0].n.id}` : '(nothing)';
  probed++; if (got !== want) fail(`search "${q}": best match is ${got}, expected ${want}`);
}
try {
  if (search('zzqx') && search('zzqx').length) fail('search "zzqx" should find nothing');
  if (search('the') !== null) fail('a stop word alone should be no search at all');
} catch (e) { fail('search throws: ' + e.message); }

/* 5. house rules: --acc is a fill, never text; no legacy navy; no remote stylesheet */
if (/(?<![-\w])color:\s*var\(--acc\)/.test(html)) fail('color:var(--acc) found: use --acc-tx for accent text');
if (/#0e1420|#182133/i.test(html)) fail('legacy navy palette found');
if (!/<meta name="robots" content="noindex">/.test(html)) fail('noindex meta missing');

/* 6. --live: every tool answers 200 and every jump's #screen is one that tool's router knows
   (a Paper Sim's SCR entry `saq: {t:` / a CLS route `name === 'bp'`). A screen the sim only
   shows when it has content (saq, focus, vid) still needs one look in a browser. */
if (process.argv.includes('--live')) {
  const BASE = 'https://jeremyspm.github.io/';
  const pages = {};
  for (const [id, T] of Object.entries(TOOLS)) {
    try {
      const url = new URL(T.url, BASE), r = await fetch(url);
      if (!r.ok) { fail(`live ${id}: HTTP ${r.status}`); continue; }
      let src = await r.text();
      /* a router can live in a script file (cls-trainer/js/app.js), so read the page's own scripts too */
      for (const m of src.matchAll(/<script[^>]+src="([^"]+)"/g)) {
        const s = new URL(m[1], url); if (s.origin !== url.origin) continue;
        const rs = await fetch(s); if (rs.ok) src += '\n' + await rs.text();
      }
      pages[id] = src;
    } catch (e) { fail(`live ${id}: ${e.message}`); }
  }
  for (const [id, hash, at] of jumps) {
    const name = hash.split('/')[0], src = pages[id] || '';
    const known = new RegExp(`\\b${name}\\s*:\\s*\\{t:|name === '${name}'`).test(src);
    if (!known) fail(`live ${at}: ${TOOLS[id].url}#${hash} — no screen "${name}" found in the live page`);
  }
  note(`live: ${Object.keys(TOOLS).length} tools fetched, ${jumps.length} jumps checked`);
}

for (const n of notes) console.log('note: ' + n);
if (fails.length) { for (const f of fails) console.error('FAIL: ' + f); console.error(`${fails.length} failure(s)`); process.exit(1); }
console.log(`ok: ${Object.keys(TOOLS).length} tools, ${PAPERS.length} papers, ${PAPERS.reduce((a, p) => a + p.needs.length, 0)} problems, ${probed} search probes`);
