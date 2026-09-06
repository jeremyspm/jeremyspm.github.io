/* Generates hs2-videos.html — the Module 2 video playlist.
 *
 * The tool this belongs to is hs2-test2 (HS2 Paper Sim — Module 2). In there,
 * a Dr Matt & Dr Mike video only ever appears AFTER you get something wrong:
 * `content/explain.mjs` retrieves one at build time per question, and the page
 * shows it in the explain row or the weak-spots box. That is the right shape
 * for remediation and the wrong shape for orientation — you cannot watch the
 * set before a mock test without first failing your way to it, and the videos
 * no captured question needs are unreachable from inside the tool no matter
 * how many questions you miss.
 *
 * This page is the other door: every video, grouped by topic, in the open.
 *
 * NOTHING here is authored content. The video list, its titles and durations are
 * hs2-test2's `content/dmdm-all.json` verbatim; the "explains N questions" counts
 * are read back out of its BUILT index.html, so they are the matches the tool
 * actually ships. Since 2026-09-06 those matches come from hs2-test2's
 * `content/video-matches.json` — each one found in the video's own caption
 * track, judged by a model reading that text, quote-gated and then put through
 * an adversarial second review — not from the title matcher that shipped on
 * 1 Sept and attached the Anterior Pituitary video to bone-growth questions.
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
const TEST2 = resolve(process.env.HS2_TEST2 || join(HERE, '..', 'hs2-test2'));
const VIDS = join(TEST2, 'content', 'dmdm-all.json');
const BUILT = join(TEST2, 'index.html');
const OUT = join(HERE, 'hs2-videos.html');

for (const [what, p] of [['hs2-test2 video list', VIDS], ['hs2-test2 built index.html', BUILT]]) {
  if (!fs.existsSync(p)) {
    console.error(`✗ ${what} not found at ${p}\n  Check hs2-test2 out beside this repo, or set HS2_TEST2=<path to the repo>.`);
    process.exit(2);
  }
}

const videos = JSON.parse(fs.readFileSync(VIDS, 'utf8'));
if (!Array.isArray(videos) || videos.length < 100) { console.error(`✗ ${VIDS} gave ${videos.length} videos`); process.exit(2); }

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
   Module 2 is MS / NS / Endocrine; these are the topics inside them, named the
   way her quizzes and learning pages name them. The grouping is by SUBJECT, so
   a handful of videos sit under a different system than the one dmdm-all tags
   them with — declared in OVERRIDES below rather than fixed silently.
   To add a video: add its id to a topic here and re-run. The build fails if a
   video is in no topic, in two, or names an id the list does not have. */
const TOPICS = [
  /* 2026-09-06: five more from the channel that the 31 Aug list missed — bone
     healing, osteoporosis (the long one), the energy systems, and the scapula
     movers. Found by grepping the whole channel for the quiz topics no listed
     video covered; caption-verified like the rest. */
  ['ms', 'ms-bone', 'Bone & cartilage tissue', 'What bone and cartilage are made of, how bone is remodelled, and how it heals.', [
    '5OA9AcaBcUo', 'S5b4NvdT1ds', 'Chmwd4BD21Q', 'JYQL7JEsF_4', 'b-9NtC5YC84', 'N391iuWbM0s', 'iAdF1vvgMmM']],
  ['ms', 'ms-joint', 'Joints & movement', 'How joints are classified, and the names for the movements they make.', [
    'JO_N1apvidE', 'uhYTgob4ESg', 'LqCkvj0fTj0', '7G_4O04IET0', 'tAJjXvumL7E']],
  ['ms', 'ms-muscle', 'Muscle tissue & contraction', 'The three muscle types, the sliding filament theory, what happens at the NMJ, and where the ATP comes from.', [
    'jpnNc03cqU0', 'RVl1dni2LDQ', 'K2kHnb1x7cE', '7_LZFmfeCuk', 'ApaPlKPb4ek', 'MZLADPduKWw',
    '0WPaacgMqjw', 'Uz4ZrvFY6b4', 'XBNm4-BHoXo', '0FID5qRGXGg', 'OWz8x2l5NEE', '_pfRkc7SOH0']],
  ['ms', 'ms-named', 'Named muscles & regional anatomy', 'One video per structure — for the labelling questions.', [
    'fNkGwZ8FRRk', 'kFvVOaEmfCo', 'PPKlGlwxr5s', 'EuS3kZ-ZBQU', 'QJVqTf_rNtk', 'dzVssRini0o',
    'qencTWCfK_4', 'pStOYPRacMY', 'ahD_1vXIU1w', '23X5bX2yobw', 'gbedi92HL6U', 'POaUxh05naU', '9wWq05HOxnI']],
  ['ms', 'ms-clin', 'Musculoskeletal injury', 'The applied end — what goes wrong and why it hurts.', [
    'cFveuuBxwWY', 'WFDGo2_6WcI']],

  ['ns', 'ns-org', 'Organisation of the nervous system', 'CNS vs PNS, somatic vs autonomic — the map before the detail.', [
    'N3DyeW0Dh30', 'IDCUi9eZDOQ', 'tkf7jJih8PI', 'Qh6A1neljbI', 'XEFumtI-pSk', 'b6m35PlH7t8',
    'tUQB2Xgp9w4', 'wkowgnAaaMY']],
  ['ns', 'ns-cell', 'Neurons & glia', 'The cells themselves: what each glial type does, and how neurons adapt.', [
    'yT9Ad01oUgc', 'iTwyLAYuvtI', 'dPwayN03y3M']],
  ['ns', 'ns-phys', 'Membrane potentials & synapses', 'Resting → graded → action potential, then across the synapse.', [
    'r9n_LtrXctY', 'wq0MTSBxncA', 'BB0qVcp7FOQ', 'dPK0HuGRJ78', 'fhiJo1QYGtA', 'iuPeJG6fQbU',
    'qJXZD2gaLMU']],
  ['ns', 'ns-brain', 'The brain, region by region', 'Lobes, cerebellum, basal ganglia, diencephalon, brain stem.', [
    'xXk5BOAO7rc', '1_UY7goO2k0', 'o2HMWg6SFtE', 'WNEUejpz3A4', 'VCzaq7CJhvw', 'aDous4uAv6Y',
    'WUQay1EEhgQ', '-Y2_JrSCQtc', 'fcDfQZ4Z_uc', '5psr91yrAto', 'qeMH_qH6Jgs', 'WltoKu-xBA8']],
  ['ns', 'ns-protect', 'Protection of the nervous system', 'The blood-brain barrier, and what raised pressure inside the skull does.', [
    'eakL-xHwWL4', 'K575jeJzyuw', 'w3pza1rf32o', '80MovRxs4t0']],
  ['ns', 'ns-cord', 'Spinal cord, tracts & reflexes', 'Ascending and descending pathways, and the reflex arcs that bypass the brain.', [
    'SoSFjaZ-lMs', 'MXARAn1avCk', 'oCcxOtFiD2k', 'oFvhpMfS2M0', '7ZlHGljMWa0', '1s_dyfl0Xgs',
    'cgeEiZaQtNw', '0gjdP-cYujw', 'a1WpsJvkTR0', 'pDOqmq0A_lg', 'EqsNHbbJQJ4', 'XP8t9oSmS38',
    'dGFp-ujVT10', 'j9pwDAcb-U0', 'OOIxbIVB6u4', 'v6NSgOhy8MI', 'tSkocizPFAA']],
  ['ns', 'ns-pns', 'Peripheral & cranial nerves', 'The twelve cranial nerves, the plexuses, and what a trapped nerve does.', [
    'ZQ1TN6C1Lug', 'kSrWDW06f3k', 'kWEOouzHavg', 'RuH4fgkf2Bw', 'Xq1jdiRhRmQ', 'AWkAc5coHCg',
    'voDZl9Y0RUc']],
  ['ns', 'ns-ans', 'Autonomic nervous system', 'Sympathetic vs parasympathetic, and the receptors each one talks to.', [
    'QBLqs-2ryZ0', 'GFrHKUi0tnI', 'n9S_EkxbZSA', '9ajabS9IibA', 'TEnPql9dcs4', 'a5TPdA3eRhU',
    'tIjPl1jhQLI', 'evCZxFiphrE', 'DUiEKM4NypY', '4LkamvKUuz4', 'v5zVwOXPaZ0', 'eocOmytfg8s',
    'd8SmtGCyqOE', 'GqkMzds77f8', 'ZEi-LcsLCvY']],
  ['ns', 'ns-sens', 'Sensation & pain', 'Receptor types, nociception, and why pain and tissue damage are not the same thing.', [
    'AG7Ev2hJGFk', 'RD6QY5KWiko', 'QidHfIj5rYQ', 'hw-vHF1LrqY', 'rxl6c8UwmKs', '94Qn01dz6vA',
    'tJHndCJq7TY', 'BG5g_Yfw0dc']],
  ['ns', 'ns-clin', 'Neurological conditions & CNS drugs', 'The named conditions, plus the drug classes that act on the CNS.', [
    'RYLI-4zEi-I', 'EVJoWfYuKD0', 'YCvo86laWv0', 'Gojo-ojQj0Y', 'smWdIgwxRgE', 'dm6DO8Re_ec',
    '1RxATXURxQM', 'qitIPY-JIBw', 'qIsYTmuMNUQ']],

  ['endo', 'en-prin', 'Endocrine principles', 'What a hormone is, what a target cell is, and how release is controlled.', [
    'vLCg_kyuyw4', 'zJu6CsuFSpg', '91Gzi3-xxzY', 'czS7-JF1kOE', '5Hq4eoqsVbk']],
  ['endo', 'en-pit', 'Hypothalamus & pituitary', 'The axis that runs most of the other glands, plus ADH and water balance.', [
    'fqz4WOwfz4Q', 'FDatRYxlgQI', '2JNrEnUWX4s', 'YE-a7XiEYB4', 'JBUA1NcRchs']],
  ['endo', 'en-thy', 'Thyroid, parathyroid & calcium', 'T3/T4, and the PTH–vitamin D–calcitonin loop that holds blood calcium steady.', [
    'XlqKNaebMJc', 'FCngwKqLaT0', 'C4q4YkRokVs', 'BsXMjOK5IR8', 'uxCw4qovZXE', '0kbKre47qdk']],
  ['endo', 'en-adr', 'Adrenal glands & stress', 'Cortisol, the ACTH axis, and what steroids do when they are the drug.', [
    'FOxJIDCyaPY', '-6MFCy_dFew', 'e7uGKpRTk1U', 'T5ScIqPnqf8']],
  ['endo', 'en-panc', 'Pancreas & diabetes', 'Insulin and glucagon, then the three types of diabetes.', [
    'ksomgJMqxgI', 'ECAZ8hjeASI', '-hTWA2SKYbM', 'r-sDGEswYQY']],
];

/* Videos deliberately filed under a different system than dmdm-all tags them.
   The tag drives nothing here except this check, so the point of the list is to
   make each move a decision on the record rather than a silent reclassification. */
const OVERRIDES = {
  'dGFp-ujVT10': 'a spinal reflex arc, tagged ms because the effector is muscle — it belongs with the other reflexes',
};

const SYS = [
  ['ms', 'Musculoskeletal', 'Bones, joints and muscle — Module 2’s first block.'],
  ['ns', 'Nervous', 'The biggest block by a distance, and the one Test 2 leans on hardest.'],
  ['endo', 'Endocrine', 'Glands, hormones and the loops that keep them in range.'],
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
      i: v.id, t: v.t, d: v.d, s: secs(v.d), n: explains[v.id] || 0,
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
<title>Module 2 Video Playlist — Dr Matt &amp; Dr Mike</title>
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
    <a class="back" href="https://jeremyspm.github.io/hs2-test2/">Paper Sim →</a>
    <button class="iconbtn" id="btnTheme" title="Theme">◐</button>
  </div>
  <h1>▶ Module 2 Video Playlist</h1>
  <p class="sub">Every Dr Matt &amp; Dr Mike video the HS2 Paper Sim knows about — ${total.n} of them, ${total.topics} topics, ${hhmm(total.s)} end to end. Watch first, sit the mock papers after.</p>
  <div class="why">📺 <b>Why this exists:</b> inside the Paper Sim a video only appears once you have already got something wrong. That is good remediation and useless for orientation — and ${total.n - total.reach} of these ${total.n} videos teach nothing a captured quiz question tests, so no amount of failing ever surfaces them. Here they are all in the open, grouped by topic. Tap a title to play it on this page.</div>

  <div class="controls">
    <div class="searchrow">
      <input id="q" type="search" placeholder="Search ${total.n} videos — try “action potential”, “cranial”, “cortisol”" autocomplete="off" spellcheck="false"/>
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

  <div class="note"><b>What the numbers mean.</b> The “<i>explains N</i>” tag counts Paper Sim questions whose tested fact this video actually states — matched from the video's own captions, not its title, then checked by two separate reviews and a verbatim quote gate, so every tag is a claim that was read, not guessed. The ${total.n - total.reach} videos with no tag are still good videos; they just cover ground none of the captured quizzes ask about. And these are Dr Matt &amp; Dr Mike, not Hannetjie: where a video and her material disagree, <b>she is the one being marked</b>.</div>

  <div class="foot">Videos and durations come straight from hs2-test2's <code>content/dmdm-all.json</code>; the question counts from its <code>content/video-matches.json</code>. Topics are this page's own grouping. Watched ticks are stored in this browser only.</div>
</div>
<script>
'use strict';
const PACK=${JSON.stringify(PACK)};
const TK='hub.theme', WK='hs2vid.seen';
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
            <a href="https://www.youtube.com/watch?v=\${v.i}" target="_blank" rel="noopener">YouTube ↗</a>
          </div>
        </div>
      </div>\`).join('')}
    </div>
  </section>\`).join('')}
  </div>\`).join('')+'<div class="empty" id="empty" hidden>No video matches that. Clear the filters, or try a shorter word — titles are Dr Matt &amp; Dr Mike\\u2019s own.</div>';

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
