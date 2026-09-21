/* Generates hs2-m3-videos.html — the Module 3 video playlist.
 *
 * The tool this belongs to is hs2-test3 (HS2 Paper Sim — Module 3). In there, a
 * video only ever appears AFTER you get something wrong (or under the question in
 * Learn mode): `content/explain.mjs` looks one up per question at build time. That
 * is the right shape for remediation and the wrong shape for orientation — you
 * cannot watch the set before a mock test without failing your way to it, and the
 * videos no captured question needs are unreachable from inside the tool.
 *
 * This page is the other door: every video, grouped by topic, in the open.
 *
 * NOTHING here is authored content. The video list, its titles and durations are
 * hs2-test3's `content/dmdm-all.json` verbatim. Modules 1 and 2 inherited their
 * shelf from a module hub; Module 3 has none, so its shelf was declared on
 * 2026-09-21 by the estate's scripts/video-captions/shelf-m3.py: every Dr Matt &
 * Dr Mike video whose title is on a Module 3 topic, plus every video (any channel)
 * whose captions were matched to a Module 3 question and survived a hand read.
 * The "explains N questions" counts are read back out of its BUILT index.html, so
 * they are the matches the tool actually ships. Those come from hs2-test3's
 * `content/video-matches.json` — each found in the video's own caption track,
 * judged from that text, gated on a verbatim quote re-found in the track, a second
 * pass trying to refute it, and then every surviving match read by hand (29 struck).
 * Never a title match.
 * The one thing added here is the TOPICS table below — a hand-made grouping of
 * ids into topics, gated in both directions so it can never silently drift from
 * the video list.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/* Paths resolve from THIS FILE, never the working directory — same rule as
   hs2-terms.build.mjs, for the same reason. Default layout is siblings. */
const HERE = dirname(fileURLToPath(import.meta.url));
const SIM = resolve(process.env.HS2_TEST3 || join(HERE, '..', 'hs2-test3'));
const VIDS = join(SIM, 'content', 'dmdm-all.json');
const BUILT = join(SIM, 'index.html');
const OUT = join(HERE, 'hs2-m3-videos.html');

for (const [what, p] of [['hs2-test3 video list', VIDS], ['hs2-test3 built index.html', BUILT]]) {
  if (!fs.existsSync(p)) {
    console.error(`✗ ${what} not found at ${p}\n  Check hs2-test3 out beside this repo, or set HS2_TEST3=<path to the repo>.`);
    process.exit(2);
  }
}

const videos = JSON.parse(fs.readFileSync(VIDS, 'utf8'));
if (!Array.isArray(videos) || videos.length < 50) { console.error(`✗ ${VIDS} gave ${videos.length} videos`); process.exit(2); }

/* The built page carries its bank as one `const DATA = {…};` line. Reading the
   BUILT file, not re-running content/explain.mjs, is deliberate: the matcher needs
   her Canvas archive on a Windows path that does not exist here, and the counts
   should be what the tool ships anyway. */
const built = fs.readFileSync(BUILT, 'utf8');
const s = built.indexOf('const DATA = ');
if (s < 0) { console.error(`✗ no DATA object in ${BUILT}`); process.exit(2); }
const DATA = JSON.parse(built.slice(s + 13, built.indexOf('\n', s) - 1));
/* `vid` is the best caption-verified video for the question and `vid.alt` the
   runner-up when a second one also survived verification; both count — a video
   that is the second door into five questions is still in the question bank. */
const explains = {};
for (const q of DATA.questions) if (q.vid) {
  explains[q.vid.id] = (explains[q.vid.id] || 0) + 1;
  if (q.vid.alt) explains[q.vid.alt.id] = (explains[q.vid.alt.id] || 0) + 1;
}

/* ── topics ─────────────────────────────────────────────────────────────
   Module 3 is Reproduction / Genetics / Special senses. Her own criteria
   (Reproductive 1–14, Genetics 1–9, Special senses 1–13) set the order. Each system
   ends in an "answered in passing" topic: videos about something else (an endocrine
   overview, an antibiotics episode, the autonomic system) whose captions state a
   fact a Module 3 quiz tests. They stay — the tag is real — under a heading that
   says what they are. To add a video: add it to the shelf (shelf-m3.py in the
   estate), then its id to a topic here, and re-run. The build fails if a video is
   in no topic, in two, or names an id the list does not have. */
const TOPICS = [
  ['repro', 'repro-male', 'Male anatomy & sperm production', 'Testes to urethra, the glands that make semen, erection and ejaculation — and the two cancers of the region.', [
    'DrPw3EZW5ow', 'RhBS9ANCVL8', 'Nmq0U5D_Jn4', '33m9pN_vAI4', 'mjROZrxBdv4', 'K88DwDMwjJE', 'B-Ih_jhyI90']],
  ['repro', 'repro-female', 'Female anatomy, the cycles & menopause', 'Ovaries, tubes and uterus; the ovarian and uterine cycles; the pill, lactation and what changes at menopause.', [
    'LPvqphgIYXE', 'ta4wAINBqio', 'L4adODFmmtI', 'Lzlt1Gk7Riw', 'CwgaFwHJM4g', 'EfexbuyIqCY', 'pzgUbyD6mCM',
    'ZC0_uGeKmb0', 'E1toz8WDyds', 'n166xsnl7kY']],
  ['repro', 'repro-hormones', 'The hormones that drive it: GnRH, FSH & LH', 'The hypothalamic–pituitary–gonadal axis — which cell each hormone acts on, in each sex.', [
    'AWyJw69OZt4', '9Rnd1KWxGKU', 'YE-a7XiEYB4']],
  ['repro', 'repro-gametes', 'Gametes, fertilisation & the embryo', 'Spermatogenesis and oogenesis side by side, the acrosome reaction, implantation and the first weeks.', [
    '6WOrF6gXEzo', 'vonVty4kTuc', 'y_TR2UDnxqg', '7w0DUGUrq5o', 'dqiDf7Xm8nU', 'PS7bdl_PF3M', 'UAScTbIt1Dc',
    'Wjvl8zEIGaA', 'rRRL2yKPPfQ']],
  ['repro', 'repro-long', 'The whole system in one sitting', 'Two podcasts and a university lecture, one to two hours each — for a long walk, not a quick check.', [
    'F_RA9hItWN8', 'vnjPCmQ5H2o', 'bqZAYZTeMbk']],
  ['repro', 'repro-aside', 'Answered in passing — other topics, one Module 3 fact', 'Videos about something else whose captions state a fact a reproduction quiz tests. Watch for the tag, not the title.', [
    'vLCg_kyuyw4', 'jkFfuSV5jNQ', 'hgoa_ZxX5Sg', 'FTa23HWhVwc']],

  ['gen', 'gen-dna', 'DNA, genes & the cell', 'What DNA is made of, how a gene becomes a protein, and where the cell keeps it.', [
    'yLsIvVs5ZWI', 'nqlNcm_mMcI', 'R7e9k0ypRZ0', 'I6NhO-YJhZ8']],
  ['gen', 'gen-inherit', 'Inheritance, Punnett squares & pedigrees', 'Dominant and recessive, carriers, X-linked traits, sex determination and the disorders her pedigrees use.', [
    'jcxx1Uwfnv4', 'tltFH-kRMoc', 'BcXQJoFMWN0', 'CbSg-DXNWFE', 'iywe4jIrfDo', 'I-U6l7diAqE']],
  ['gen', 'gen-aside', 'Answered in passing — other topics, one Module 3 fact', 'Gene editing, an antibiotics episode, muscular dystrophy: captions that state a genetics fact her quizzes test.', [
    '7-zG1BqckTk', '4FBD3qxS-j4', 'bXz3LCXsyXc', 'o1uhhpjmzkw']],

  ['senses', 'sen-eye', 'The eye: anatomy, focusing & the light reflexes', 'Cornea to retina, the visual pathway, accommodation, the pupil and corneal reflexes, and tears.', [
    'D-kVWke0CD0', 'gBdJbWiun8c', 'j9pwDAcb-U0', '6tjfY-SwWaY', 'RBJnclxslmQ', 'YQ_kU7ZF-qA', 'CCqUkTvI1NI']],
  ['senses', 'sen-ear', 'The ear: hearing & balance', 'Outer, middle and inner ear, how sound becomes a nerve signal, and the vestibular system.', [
    'A2Ee9VrDHh4', 'eLkIoG6hU_Y', 'V8AZ6QygeYs', 'pxga9ci2ets']],
  ['senses', 'sen-smell', 'Smell', 'One short video on the olfactory pathway (through why COVID-19 took it away). Nothing on the channel covers taste.', [
    'h1kDzqpDlY0']],
  ['senses', 'sen-aside', 'Answered in passing — other topics, one Module 3 fact', 'The autonomic system, the cranial nerves, diabetes: captions that state an eye or ear fact her quizzes test.', [
    'F3U9pB5w0XM', 'ITlKlDnyKfU', 'eeQ6c5nu-ck', 'gpIDVyM8V4U', 'ZnnVUq1P5Yo']],
];

/* Videos deliberately filed under a different system than dmdm-all tags them.
   Module 3's shelf is tagged by this same grouping (shelf-m3.py), so none today. */
const OVERRIDES = {};

const SYS = [
  ['repro', 'Reproduction', 'Male and female anatomy, the hormones that run them, and how gametes are made and meet.'],
  ['gen', 'Genetics', 'More than half of her Module 3 questions — inheritance, Punnett squares and pedigrees above all.'],
  ['senses', 'Special senses', 'The eye and the ear, with light and sound physics she tests alongside them.'],
];

/* ── gates ──────────────────────────────────────────────────────────────
   Both directions. An unassigned video is as fatal as a topic naming an id the
   list no longer has: either one means this page has quietly stopped being
   "every video", which is the only thing it promises. */
const byId = new Map(videos.map(v => [v.id, v]));
if (byId.size !== videos.length) { console.error(`✗ ${videos.length - byId.size} duplicate id(s) in ${VIDS}`); process.exit(1); }

const seen = new Map(), fail = [];
for (const [sys, tid, , , ids] of TOPICS) {
  if (!SYS.some(x => x[0] === sys)) fail.push(`topic ${tid} has unknown system "${sys}"`);
  for (const id of ids) {
    if (!byId.has(id)) fail.push(`topic ${tid} names ${id}, which is not in dmdm-all.json`);
    else if (seen.has(id)) fail.push(`${id} is in both ${seen.get(id)} and ${tid}`);
    else seen.set(id, tid);
  }
}
for (const v of videos) if (!seen.has(v.id)) fail.push(`${v.id} "${v.t}" (${v.sys}) is in no topic`);
for (const [sys, tid, , , ids] of TOPICS) for (const id of ids) {
  const v = byId.get(id); if (!v || v.sys === sys) continue;
  if (!OVERRIDES[id]) fail.push(`${id} "${v.t}" is tagged ${v.sys} but filed under ${tid} — add it to OVERRIDES with a reason, or move it`);
}
for (const id of Object.keys(OVERRIDES)) if (!seen.has(id)) fail.push(`OVERRIDES names ${id}, which no topic uses`);
if (fail.length) { console.error('✗ topic table does not match the video list:\n  ' + fail.join('\n  ')); process.exit(1); }

const CHN = { nn: 'Ninja Nerd', ah: 'Armando Hasudungan', az: 'AnatomyZone', iha: 'Institute of Human Anatomy' };

/* ── shape ──────────────────────────────────────────────────────────── */
const secs = (d) => { const p = String(d).split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : (p[0] || 0) * 60 + (p[1] || 0); };
const hhmm = (n) => n >= 3600 ? `${Math.floor(n / 3600)} h ${Math.round(n % 3600 / 60)} min` : `${Math.round(n / 60)} min`;

const PACK = SYS.map(([sid, sname, sblurb]) => ({
  id: sid, name: sname, blurb: sblurb,
  topics: TOPICS.filter(t => t[0] === sid).map(([, tid, tname, tblurb, ids]) => ({
    id: tid, name: tname, blurb: tblurb,
    /* shortest first: on a topic you have not met yet, the 4-minute one is the
       one that orients you, and the 40-minute one is what you come back for. */
    vids: ids.map(id => byId.get(id)).sort((a, b) => secs(a.d) - secs(b.d)).map(v => ({
      i: v.id, t: v.t, d: v.d, s: secs(v.d), n: explains[v.id] || 0, ...(v.ch ? { c: CHN[v.ch] || v.ch } : {}),
    })),
  })),
}));

const all = PACK.flatMap(s => s.topics.flatMap(t => t.vids));
const total = { n: all.length, s: all.reduce((a, v) => a + v.s, 0), topics: PACK.reduce((a, s) => a + s.topics.length, 0), reach: all.filter(v => v.n).length };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<meta name="theme-color" content="#0e1420"/>
<meta name="robots" content="noindex"/>
<title>Module 3 Video Playlist — Dr Matt &amp; Dr Mike</title>
<style>
:root{
  --bg:#0e1420; --bg2:#141c2b; --card:#182133; --card2:#1e2941;
  --line:#27324a; --line2:#33405c;
  --tx:#e8eef7; --tx2:#9fb0c8; --tx3:#6d7f9c;
  --acc:#9b8cff; --acc2:#7a63e8;
  --good:#39d98a; --hard:#ffce54;
  --r:16px; --maxw:900px;
}
html[data-theme="light"]{
  --bg:#eef2f8; --bg2:#e3e9f3; --card:#ffffff; --card2:#f4f7fc;
  --line:#dbe3ef; --line2:#c7d3e6;
  --tx:#16202f; --tx2:#4a5a72; --tx3:#7d8ca5;
  --acc:#6a52e8; --acc2:#5540c2;
  --good:#128a55; --hard:#a9791a;
}
*{box-sizing:border-box}
[hidden]{display:none!important}
html,body{margin:0;min-height:100%}
body{background:linear-gradient(180deg,var(--bg),var(--bg2)) fixed;color:var(--tx);
  font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.wrap{max-width:var(--maxw);margin:0 auto;padding:26px 18px 90px}
a{color:var(--acc)}
button{font-family:inherit;cursor:pointer;border:none;color:inherit;background:none}
.top{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.top a.back{font-size:13px;text-decoration:none;color:var(--tx3);border:1px solid var(--line);border-radius:9px;padding:7px 12px;background:var(--card)}
.top a.back:hover{color:var(--tx);border-color:var(--line2)}
.iconbtn{width:38px;height:38px;border-radius:10px;background:var(--card);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:17px;color:var(--tx2);margin-left:auto}
h1{font-size:25px;margin:0 0 4px;letter-spacing:-.4px}
.sub{color:var(--tx2);font-size:14px;margin:0 0 10px}
.why{background:linear-gradient(160deg,rgba(155,140,255,.16),rgba(155,140,255,.04));border:1px solid rgba(155,140,255,.45);border-radius:var(--r);padding:15px 18px;margin-bottom:18px;font-size:14.5px}
.why b{color:var(--acc)}
/* controls */
.controls{position:sticky;top:0;z-index:20;background:var(--bg);margin:0 -18px 16px;padding:12px 18px 12px;border-bottom:1px solid var(--line)}
.searchrow{display:flex;gap:8px;align-items:center}
#q{flex:1;min-width:0;background:var(--card);border:1px solid var(--line);border-radius:11px;color:var(--tx);
  font:15px/1.4 inherit;padding:11px 13px;outline:none}
#q:focus{border-color:var(--acc)}
#q::placeholder{color:var(--tx3)}
.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}
.chip{font-size:12.5px;padding:6px 11px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--tx2);white-space:nowrap}
.chip[aria-pressed="true"]{background:var(--acc);border-color:var(--acc);color:#fff;font-weight:600}
html[data-theme="light"] .chip[aria-pressed="true"]{color:#fff}
.count{font-size:12px;color:var(--tx3);margin-top:9px}
/* progress */
.bar{height:7px;border-radius:5px;background:var(--line);overflow:hidden;margin:9px 0 0}
.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--acc2),var(--acc));width:0;transition:width .25s}
/* sections */
h2.sys{font-size:13px;text-transform:uppercase;letter-spacing:1.2px;color:var(--tx3);margin:32px 0 4px}
p.sysblurb{font-size:13px;color:var(--tx3);margin:0 0 12px}
.topic{background:var(--card);border:1px solid var(--line);border-radius:var(--r);margin-bottom:12px;overflow:hidden}
.thead{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;cursor:pointer}
.thead:hover{background:var(--card2)}
.tw{flex:1;min-width:0}
.thead h3{font-size:16px;margin:0 0 2px;letter-spacing:-.2px}
.thead p{margin:0;font-size:13px;color:var(--tx2)}
.tmeta{font-size:11.5px;color:var(--tx3);margin-top:5px}
.tmeta .done{color:var(--good);font-weight:700}
.caret{color:var(--tx3);font-size:13px;padding-top:3px;transition:transform .18s}
.topic.open .caret{transform:rotate(90deg)}
.tbody{display:none;border-top:1px solid var(--line);padding:4px 0 8px}
.topic.open .tbody{display:block}
.playall{display:block;margin:6px 16px 8px;font-size:12.5px;color:var(--tx3);text-decoration:none;border:1px dashed var(--line2);border-radius:9px;padding:7px 11px;text-align:center}
.playall:hover{color:var(--acc);border-color:var(--acc)}
/* rows */
.v{display:flex;gap:11px;align-items:flex-start;padding:9px 16px}
.v+.v{border-top:1px solid rgba(128,140,170,.13)}
.v.hide{display:none}
.tick{flex:none;width:24px;height:24px;margin-top:2px;border-radius:7px;border:1px solid var(--line2);background:var(--card2);
  display:flex;align-items:center;justify-content:center;font-size:13px;color:transparent}
.v.seen .tick{background:var(--good);border-color:var(--good);color:#0b1a12}
.v.seen .vt{color:var(--tx3);text-decoration:line-through;text-decoration-color:var(--line2)}
.vmain{flex:1;min-width:0}
.vt{display:block;font-size:14.5px;line-height:1.45;background:none;border:none;padding:0;text-align:left;color:var(--tx);width:100%}
.vt:hover{color:var(--acc)}
.vmeta{font-size:11.5px;color:var(--tx3);margin-top:2px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.tag{font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;padding:1px 6px;border-radius:5px;border:1px solid}
.tag.q{color:var(--acc);border-color:rgba(155,140,255,.4);background:rgba(155,140,255,.1)}
.tag.deep{color:var(--hard);border-color:rgba(255,206,84,.35);background:rgba(255,206,84,.1)}
.tag.ch{color:var(--tx2);border-color:var(--line2);background:transparent}
.vmeta a{color:var(--tx3);text-decoration:none;border-bottom:1px dotted var(--line2)}
.vmeta a:hover{color:var(--acc)}
.player{margin:8px 16px 12px;border-radius:12px;overflow:hidden;border:1px solid var(--line2);background:#000}
.player iframe{display:block;width:100%;aspect-ratio:16/9;border:0}
.empty{padding:26px 16px;text-align:center;color:var(--tx3);font-size:14px}
.note{background:var(--card2);border:1px solid var(--line);border-left:3px solid var(--hard);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--tx2);margin:26px 0 0}
.note b{color:var(--tx)}
.foot{margin-top:26px;text-align:center;font-size:12px;color:var(--tx3)}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <a class="back" href="./">← Hub</a>
    <a class="back" href="https://jeremyspm.github.io/hs2-test3/">Paper Sim →</a>
    <button class="iconbtn" id="btnTheme" title="Theme">◐</button>
  </div>
  <h1>▶ Module 3 Video Playlist</h1>
  <p class="sub">Every Dr Matt &amp; Dr Mike video the Module 3 Paper Sim knows about, plus the other channels’ videos it matched — ${total.n} of them, ${total.topics} topics, ${hhmm(total.s)} end to end. Watch first, sit the mock papers after.</p>
  <div class="why">📺 <b>Why this exists:</b> inside the Paper Sim a video only appears once you have already got something wrong. That is good remediation and useless for orientation — and ${total.n - total.reach} of these ${total.n} videos teach nothing a captured quiz question tests, so no amount of failing ever surfaces them. Here they are all in the open, grouped by topic. Tap a title to play it on this page.</div>

  <div class="controls">
    <div class="searchrow">
      <input id="q" type="search" placeholder="Search ${total.n} videos — try “sperm”, “pedigree”, “cochlea”" autocomplete="off" spellcheck="false"/>
    </div>
    <div class="chips">
      <button class="chip" id="c-all" aria-pressed="true">All</button>
${SYS.map(([id, name]) => `      <button class="chip" data-sys="${id}" aria-pressed="false">${esc(name)}</button>`).join('\n')}
      <button class="chip" data-max="600" aria-pressed="false">Under 10 min</button>
      <button class="chip" data-unseen="1" aria-pressed="false">Not watched</button>
      <button class="chip" data-bank="1" aria-pressed="false">In the question bank</button>
      <button class="chip" id="c-open" aria-pressed="false">Expand all</button>
    </div>
    <div class="count" id="count"></div>
    <div class="bar"><i id="prog"></i></div>
  </div>

  <div id="list"></div>

  <div class="note"><b>What the numbers mean.</b> The “<i>explains N</i>” tag counts Paper Sim questions whose tested fact this video actually states — matched from the video's own captions, not its title, judged from that text, gated on a verbatim quote re-found in the track, and every match then read again by hand — so every tag is a claim that was read, not guessed. The ${total.n - total.reach} videos with no tag are still good videos; they just cover ground none of the captured quizzes ask about. And these are Dr Matt &amp; Dr Mike, not Hannetjie: where a video and her material disagree, <b>she is the one being marked</b>.</div>

  <div class="foot">Videos and durations come straight from hs2-test3's <code>content/dmdm-all.json</code> (the Module 3 shelf); the question counts from its <code>content/video-matches.json</code>. Topics are this page's own grouping. Watched ticks are stored in this browser only.</div>
</div>
<script>
'use strict';
const PACK=${JSON.stringify(PACK)};
const TK='hub.theme', WK='hs2m3vid.seen';
function applyTheme(){document.documentElement.setAttribute('data-theme',localStorage.getItem(TK)||'dark');}
document.querySelector('#btnTheme').onclick=()=>{localStorage.setItem(TK,(localStorage.getItem(TK)||'dark')==='dark'?'light':'dark');applyTheme();};
applyTheme();

/* watched set — this browser only, never posted anywhere */
let seen=new Set();
try{seen=new Set(JSON.parse(localStorage.getItem(WK)||'[]'));}catch(e){}
const save=()=>{try{localStorage.setItem(WK,JSON.stringify([...seen]));}catch(e){}};

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const ALL=[];PACK.forEach(s=>s.topics.forEach(t=>t.vids.forEach(v=>ALL.push(Object.assign({sys:s.id,topic:t.id},v)))));

/* watch_videos builds a real YouTube playlist from ids — capped at 50 there, and
   every topic here is well under that, which is why play-all is per topic only. */
const playAll=ids=>'https://www.youtube.com/watch_videos?video_ids='+ids.join(',');
const mins=s=>s>=3600?Math.floor(s/3600)+' h '+Math.round(s%3600/60)+' min':Math.round(s/60)+' min';

document.querySelector('#list').innerHTML=PACK.map(s=>\`
  <div class="sysblock" data-sysblock="\${s.id}">
  <h2 class="sys">\${esc(s.name)}</h2>
  <p class="sysblurb">\${esc(s.blurb)}</p>
  \${s.topics.map(t=>\`<section class="topic" id="t-\${t.id}" data-topic="\${t.id}">
    <div class="thead" role="button" tabindex="0" aria-expanded="false">
      <div class="tw">
        <h3>\${esc(t.name)}</h3>
        <p>\${esc(t.blurb)}</p>
        <div class="tmeta" data-meta="\${t.id}"></div>
      </div>
      <span class="caret">▶</span>
    </div>
    <div class="tbody">
      <a class="playall" href="\${playAll(t.vids.map(v=>v.i))}" target="_blank" rel="noopener">▶ Play all \${t.vids.length} on YouTube</a>
      \${t.vids.map(v=>\`<div class="v" data-id="\${v.i}" data-sys="\${s.id}" data-s="\${v.s}" data-n="\${v.n}">
        <button class="tick" title="Mark watched" aria-label="Mark watched">✓</button>
        <div class="vmain">
          <button class="vt">\${esc(v.t)}</button>
          <div class="vmeta">
            <span>\${esc(v.d)}</span>
            \${v.n?\`<span class="tag q">explains \${v.n}</span>\`:''}
            \${v.s>1500?'<span class="tag deep">deep dive</span>':''}
            \${v.c?\`<span class="tag ch">\${esc(v.c)}</span>\`:''}
            <a href="https://www.youtube.com/watch?v=\${v.i}" target="_blank" rel="noopener">YouTube ↗</a>
          </div>
        </div>
      </div>\`).join('')}
    </div>
  </section>\`).join('')}
  </div>\`).join('')+'<div class="empty" id="empty" hidden>No video matches that. Clear the filters, or try a shorter word — titles are the channels\\u2019 own.</div>';

/* ── filters ─────────────────────────────────────────────────────────── */
const F={q:'',sys:null,max:0,unseen:false,bank:false};
const $$=s=>[...document.querySelectorAll(s)];
function playing(el){return el.nextElementSibling&&el.nextElementSibling.classList.contains('player');}
function matches(el,v){
  if(F.sys&&el.dataset.sys!==F.sys)return false;
  if(F.max&&+el.dataset.s>F.max)return false;
  /* playing a video ticks it watched, so "Not watched" would otherwise yank the row
     out from under the player mid-sentence — that one filter spares the open row.
     Every other filter still applies, and render() closes the player when it hides. */
  if(F.unseen&&seen.has(el.dataset.id)&&!playing(el))return false;
  if(F.bank&&+el.dataset.n===0)return false;
  if(F.q&&!v.includes(F.q))return false;
  return true;
}
const TXT=new Map();
$$('.v').forEach(el=>TXT.set(el,(el.querySelector('.vt').textContent+' '+(el.closest('.topic').querySelector('h3').textContent)).toLowerCase()));
function render(){
  const filtering=!!(F.q||F.sys||F.max||F.unseen||F.bank);
  let shown=0;
  $$('.v').forEach(el=>{const ok=matches(el,TXT.get(el));el.classList.toggle('hide',!ok);if(ok)shown++;
    if(!ok&&playing(el))el.nextElementSibling.remove();
    el.classList.toggle('seen',seen.has(el.dataset.id));});
  $$('.topic').forEach(sec=>{
    const vs=[...sec.querySelectorAll('.v')],vis=vs.filter(v=>!v.classList.contains('hide'));
    sec.hidden=!vis.length;
    const done=vs.filter(v=>seen.has(v.dataset.id)).length;
    sec.querySelector('[data-meta]').innerHTML=vs.length+' videos · '
      +mins(vs.reduce((a,v)=>a+ +v.dataset.s,0))
      +(done?' · <span class="done">'+done+' watched</span>':'');
    /* a search that hits should open the topic it hit in, not make you tap twice —
       and clearing the filter puts those topics back the way it found them */
    if(filtering&&vis.length){if(!sec.classList.contains('open')){sec.classList.add('open');sec.dataset.auto='1';}}
    else if(sec.dataset.auto){sec.classList.remove('open');delete sec.dataset.auto;}
    sec.querySelector('.thead').setAttribute('aria-expanded',String(sec.classList.contains('open')));
  });
  $$('.sysblock').forEach(b=>{b.hidden=![...b.querySelectorAll('.topic')].some(t=>!t.hidden);});
  document.querySelector('#empty').hidden=shown>0;
  document.querySelector('#count').textContent=filtering
    ? shown+' of '+ALL.length+' videos'
    : ALL.length+' videos · '+seen.size+' watched · '
      +mins(ALL.filter(v=>!seen.has(v.i)).reduce((a,v)=>a+v.s,0))+' still to watch';
  document.querySelector('#prog').style.width=(100*seen.size/ALL.length).toFixed(1)+'%';
}

function setChips(){
  document.querySelector('#c-all').setAttribute('aria-pressed',String(!F.sys&&!F.max&&!F.unseen&&!F.bank));
  $$('.chip[data-sys]').forEach(c=>c.setAttribute('aria-pressed',String(F.sys===c.dataset.sys)));
  $$('.chip[data-max]').forEach(c=>c.setAttribute('aria-pressed',String(F.max>0)));
  $$('.chip[data-unseen]').forEach(c=>c.setAttribute('aria-pressed',String(F.unseen)));
  $$('.chip[data-bank]').forEach(c=>c.setAttribute('aria-pressed',String(F.bank)));
}
document.querySelector('#c-open').onclick=e=>{
  const open=e.target.getAttribute('aria-pressed')!=='true';
  $$('.topic').forEach(sec=>{sec.classList.toggle('open',open);delete sec.dataset.auto;});
  e.target.setAttribute('aria-pressed',String(open));e.target.textContent=open?'Collapse all':'Expand all';render();};
document.querySelector('#q').oninput=e=>{F.q=e.target.value.trim().toLowerCase();render();};
document.querySelector('#c-all').onclick=()=>{F.sys=null;F.max=0;F.unseen=false;F.bank=false;setChips();render();};
$$('.chip[data-sys]').forEach(c=>c.onclick=()=>{F.sys=F.sys===c.dataset.sys?null:c.dataset.sys;setChips();render();});
$$('.chip[data-max]').forEach(c=>c.onclick=()=>{F.max=F.max?0:+c.dataset.max;setChips();render();});
$$('.chip[data-unseen]').forEach(c=>c.onclick=()=>{F.unseen=!F.unseen;setChips();render();});
$$('.chip[data-bank]').forEach(c=>c.onclick=()=>{F.bank=!F.bank;setChips();render();});

/* ── open / play / tick ──────────────────────────────────────────────── */
document.querySelector('#list').addEventListener('click',e=>{
  const head=e.target.closest('.thead');
  if(head){head.closest('.topic').classList.toggle('open');
    head.setAttribute('aria-expanded',String(head.closest('.topic').classList.contains('open')));return;}
  const row=e.target.closest('.v');if(!row)return;
  if(e.target.closest('.tick')){
    const id=row.dataset.id;seen.has(id)?seen.delete(id):seen.add(id);save();render();return;}
  if(e.target.closest('.vt')){
    const open=row.nextElementSibling&&row.nextElementSibling.classList.contains('player');
    document.querySelectorAll('.player').forEach(p=>p.remove());
    if(open)return;
    const d=document.createElement('div');d.className='player';
    /* nocookie + no autoplay-on-load elsewhere: one player at a time, by construction */
    d.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+row.dataset.id+
      '?autoplay=1&rel=0" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture"'+
      ' allowfullscreen title="'+row.querySelector('.vt').textContent.replace(/"/g,'&quot;')+'"></iframe>';
    row.after(d);
    /* watching it is the tick — no second tap */
    if(!seen.has(row.dataset.id)){seen.add(row.dataset.id);save();render();}
    d.scrollIntoView({block:'nearest',behavior:'smooth'});}
});
document.querySelector('#list').addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('thead')){e.preventDefault();e.target.click();}});

setChips();render();
</script>
</body>
</html>
`;

/* Same gate the other generated pages ship behind: a page that parses but throws
   on load is the failure mode that looks fine and is not. */
for (const [i, m] of [...HTML.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].entries()) {
  try { new Function(m[1]); } catch (e) { console.error(`✗ script ${i} does not parse: ${e.message}`); process.exit(1); }
}
fs.writeFileSync(OUT, HTML);
const per = SYS.map(([id, name]) => `${PACK.find(s => s.id === id).topics.reduce((a, t) => a + t.vids.length, 0)} ${name.toLowerCase()}`).join(' · ');
console.log(`wrote ${OUT} — ${total.n} videos (${per}) across ${total.topics} topics, ${hhmm(total.s)} total, ${total.reach} reachable from a question today, ${(HTML.length / 1024).toFixed(0)} KB`);
