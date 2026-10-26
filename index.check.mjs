/* index.check.mjs — the gate for the landing page (index.html). Run before every push:
     node index.check.mjs          content, links between lists, exam sides, dates, icons, search, house rules
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
try { L = vm.runInContext(main + '\n;({TOOLS, PAPERS, KINDS, SIDES, CHECKED, search, live, when, nextUp})', ctx); }
catch (e) { for (const f of fails) console.error('FAIL: ' + f); console.error('FAIL: script throws on load: ' + e.message); process.exit(1); }
const { TOOLS, PAPERS, KINDS, SIDES, search, live, when, nextUp } = L;

/* 3. lists agree with each other */
const sprite = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
const kinds = new Set(KINDS.map(k => k[0])), pids = new Set(PAPERS.map(p => p.id));
const used = new Set(), jumps = [];
for (const [id, T] of Object.entries(TOOLS)) {
  for (const k of ['nm', 'ic', 'url', 'ds']) if (!T[k]) fail(`tool ${id}: missing ${k}`);
  if (T.ic && !sprite.has(T.ic)) fail(`tool ${id}: icon ${T.ic} is not in the sprite`);
  if (/^https?:|^\//.test(T.url)) fail(`tool ${id}: url must be relative to the site root (${T.url})`);
  if (!T.url.includes('/') && !existsSync(new URL('./' + T.url, import.meta.url))) fail(`tool ${id}: ${T.url} is not in this repo`);
  if (!kinds.has(T.kind)) fail(`tool ${id}: kind "${T.kind}" is not one of ${[...kinds].join(', ')}`);
  if (!pids.has(T.pp)) fail(`tool ${id}: filed under paper "${T.pp}", which doesn't exist`);
}
const seenP = new Set();
const ok = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00'));
for (const p of PAPERS) {
  if (seenP.has(p.id)) fail(`paper id ${p.id} twice`); seenP.add(p.id);
  if (!sprite.has(p.ic)) fail(`paper ${p.id}: icon ${p.ic} is not in the sprite`);
  if (!/^var\(--[a-z]+\)$/.test(p.hue) || !html.includes(p.hue.slice(4, -1) + ':')) fail(`paper ${p.id}: hue ${p.hue} is not a defined token`);
  if (!p.as || !p.as.length) fail(`paper ${p.id}: no assessments`);
  const aids = new Set();
  for (const a of p.as || []) {
    const at = `${p.id}/${a.id}`;
    if (aids.has(a.id)) fail(`${at}: assessment id twice`); aids.add(a.id);
    for (const k of ['t', 's', 'kw']) if (!a[k]) fail(`${at}: missing ${k}`);
    if ('quiet' in a && typeof a.quiet !== 'boolean') fail(`${at}: quiet must be true or false`);
    /* an exam has three sides (rep and write required, listen optional); anything else has start + tools */
    if (a.sides) {
      if (a.start || a.tools) fail(`${at}: has sides, so it takes no start or tools`);
      const known = new Set(SIDES.map(x => x[0]));
      for (const k of Object.keys(a.sides)) if (!known.has(k)) fail(`${at}: side "${k}" is not one of ${[...known].join(', ')}`);
      /* a way to learn the questions (rep, or HS2 Final's learn) and a way to sit them (write, or a mock) */
      if (!a.sides.rep && !a.sides.learn) fail(`${at}: an exam needs a rep or learn side`);
      if (!a.sides.write && !a.sides.mock) fail(`${at}: an exam needs a write or mock side`);
      for (const [k, S] of Object.entries(a.sides)) {
        for (const f of ['id', 'go', 'ds']) if (!S[f]) fail(`${at}/${k}: missing ${f}`);
        if (S.id && !TOOLS[S.id]) { fail(`${at}/${k}: tool ${S.id} does not exist`); continue; }
        used.add(S.id); if (S.h) jumps.push([S.id, S.h, `${at}/${k}`]);
        if ((S.more || []).length > 2) fail(`${at}/${k}: at most two quiet links under the button`);
        for (const m of S.more || []) {
          if (m.length !== 4 || !m[2]) { fail(`${at}/${k}: bad link ${JSON.stringify(m)}`); continue; }
          if (!TOOLS[m[0]]) { fail(`${at}/${k}: tool ${m[0]} does not exist`); continue; }
          if (!sprite.has(m[3])) fail(`${at}/${k}: icon ${m[3]} is not in the sprite`);
          used.add(m[0]); if (m[1]) jumps.push([m[0], m[1], `${at}/${k}`]);
        }
      }
    } else {
      if (!a.start) fail(`${at}: missing start (or sides, for an exam)`);
      if (!Array.isArray(a.tools)) fail(`${at}: tools must be a list (it can be empty)`);
    }
    const seen = new Set();
    for (const t of [a.start, ...(a.tools || [])].filter(Boolean)) {
      const e = typeof t === 'string' ? { id: t } : t;
      if (!TOOLS[e.id]) { fail(`${at}: tool ${e.id} does not exist`); continue; }
      if (seen.has(e.id)) fail(`${at}: tool ${e.id} listed twice (or is also its Start here)`); seen.add(e.id);
      used.add(e.id);
      for (const j of e.jump || []) {
        if (j.length !== 3 || !j[0] || !j[1]) fail(`${at}: bad jump ${JSON.stringify(j)}`);
        if (!sprite.has(j[2])) fail(`${at}: jump icon ${j[2]} is not in the sprite`);
        jumps.push([e.id, j[0], at]);
      }
      if (e.cta) jumps.push([e.id, e.cta[0], at]);
      if (e.h) jumps.push([e.id, e.h, at]);
    }
    if (a.date) {
      const D = a.date, start = D.from || D.on;
      if (!start || !ok(start) || (D.to && !ok(D.to))) fail(`${at}: bad date ${JSON.stringify(D)}`);
      else if (D.to && D.to < D.from) fail(`${at}: date ends before it starts`);
      if (D.on && (D.from || D.to)) fail(`${at}: date has both on and from/to`);
      for (const k of ['chip', 'what', 'txt']) if (!D[k]) fail(`${at}: date missing ${k}`);
      const w = when(a);
      if (w && w.past) note(`${at}: date has passed (${D.to || D.on})${D.keep ? ', kept without its date' : ', hidden'}`);
    }
  }
}
/* every tool is in the Library, so a tool no assessment names is fine; say which ones, so it's a choice */
const libOnly = Object.keys(TOOLS).filter(id => !used.has(id));
if (libOnly.length) note(`Library only: ${libOnly.join(', ')}`);
for (const x of nextUp()) if (x.a.quiet) fail(`Next up shows ${x.p.id}/${x.a.id}, which is quiet`);

/* 4. search: everyday words land on the right assessment or tool (an assessment that has hidden
   itself is skipped). "tool:" means the best match is that tool. */
const PROBES = [
  ['blood pressure', 'tool:cls-trainer'], ['bp', 'tool:cls-trainer'], ['obs', 'tool:cls-trainer'], ['sats', 'tool:cls-trainer'],
  ['pedigree', 'tool:hs2-genetics'], ['punnett', 'tool:hs2-genetics'],
  ['bones', 'tool:flesh-and-bone'], ['flesh and bone', 'tool:flesh-and-bone'], ['cystic fibrosis', 'hs2/exam'], ['hs2 exam', 'hs2/exam'],
  ['videos', 'tool:m3-videos'], ['podcast', 'tool:pod-final'], ['mg to ml', 'tool:medcalc'], ['drip rate', 'tool:medcalc'], ['medcalc', 'tool:medcalc'],
  ['med admin', 'ph/admin'], ['abbreviations', 'tool:chart-speak'], ['qid', 'tool:chart-speak'], ['drug classes', 'tool:intro-pharm'],
  ['pharm exam', 'ph/exam'], ['inp exam', 'inp/exam'], ['med chart', 'tool:chart-sim'], ['chart sim', 'tool:chart-sim'], ['placement', 'inp/place'],
];
const shown = new Set(PAPERS.flatMap(p => live(p).map(a => `${p.id}/${a.id}`)));
let probed = 0;
for (const [q, want] of PROBES) {
  if (!want.startsWith('tool:') && !shown.has(want)) { note(`search "${q}": skipped, ${want} has hidden itself`); continue; }
  let r; try { r = search(q); } catch (e) { fail(`search "${q}" throws: ${e.message}`); continue; }
  const top = r && r[0], got = !top ? '(nothing)' : top.tool ? 'tool:' + top.tool : `${top.p.id}/${top.a.id}`;
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
   (a Paper Sim's SCR entry `saq: {t:` / a CLS route `name === 'bp'` / a Genetics Trainer route
   `a === 'ped'`). A screen the sim only
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
    const known = new RegExp(`\\b${name}\\s*:\\s*\\{\\s*t:|(name|a) === '${name}'`).test(src);
    if (!known) fail(`live ${at}: ${TOOLS[id].url}#${hash} — no screen "${name}" found in the live page`);
  }
  note(`live: ${Object.keys(TOOLS).length} tools fetched, ${jumps.length} jumps checked`);
}

for (const n of notes) console.log('note: ' + n);
if (fails.length) { for (const f of fails) console.error('FAIL: ' + f); console.error(`${fails.length} failure(s)`); process.exit(1); }
console.log(`ok: ${Object.keys(TOOLS).length} tools, ${PAPERS.length} papers, ${PAPERS.reduce((a, p) => a + p.as.length, 0)} assessments, ${probed} search probes`);
