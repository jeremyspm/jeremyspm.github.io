/* Generates hs2-m1-videos.html — the Module 1 video playlist.
 *
 * The tool this belongs to is hs2-paper-m1 (HS2 Paper Sim — Module 1). In there,
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
 * hs2-paper-m1's `content/dmdm-all.json` verbatim (itself the Module 1 shelf that
 * hs2-module1/index.html declares, flattened); the "explains N questions" counts
 * are read back out of its BUILT index.html, so they are the matches the tool
 * actually ships. Those matches come from hs2-paper-m1's `content/video-matches.json`
 * — each one found in the video's own caption track (the whole channel, 691
 * tracks), judged from that text, gated on a verbatim quote re-found in the
 * track, and a review slice read again by hand. Never a title match.
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
const SIM = resolve(process.env.HS2_PAPER_M1 || join(HERE, '..', 'hs2-paper-m1'));
const VIDS = join(SIM, 'content', 'dmdm-all.json');
const BUILT = join(SIM, 'index.html');
const OUT = join(HERE, 'hs2-m1-videos.html');

for (const [what, p] of [['hs2-paper-m1 video list', VIDS], ['hs2-paper-m1 built index.html', BUILT]]) {
  if (!fs.existsSync(p)) {
    console.error(`✗ ${what} not found at ${p}\n  Check hs2-paper-m1 out beside this repo, or set HS2_PAPER_M1=<path to the repo>.`);
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
   Module 1 is CVS / Respiratory / Lymphatic. The grouping starts from the ten
   topics hs2-module1/index.html already sorts this shelf into (CVS 1–4, shock,
   RESP 1–4, lymphatic) and splits the four that run past fifteen videos, the way
   Module 2's page does. The one grouping the hub does NOT have is "answered in
   passing": forty videos joined the shelf on 2026-09-06 only because their captions
   state a fact a Module 1 quiz tests, and a dozen of them are about other systems
   (the thyroid, urine formation, a fever podcast). They stay — the tag is real —
   but under a heading that says what they are, not filed as if they were CVS
   lectures. To add a video: add its id to a topic here and re-run. The build fails
   if a video is in no topic, in two, or names an id the list does not have. */
const TOPICS = [
  ['cvs', 'cvs-vessels', 'Blood vessels & capillary exchange', 'Artery, vein and capillary; filtration and reabsorption; why oedema forms.', [
    '6mfqH1wmJBw', 'GnriknE4YRY', 'nJ44wZ5_TvA', 'VMJfiDsOgc8', '3hb_80XwS7Q', 'dFRa2ECm5pY', '1z9oAe6nn3o',
    'cl1B9lwoJTE', 'S8IMBEYhtUU', 'QriePxRM1ls', 'VToE_p_tcPc', 'LK3LLPMWmCU', 'yKbyCYAY6fU', 'oJ6ebQclqHI']],
  ['cvs', 'cvs-heart', 'The heart: chambers, flow, valves & sounds', 'The pump itself — what is where, the order blood takes through it, and the cardiac cycle.', [
    'uqWQDVSsbE4', 'PzVKE2AkatM', 'XyxuzHX1Grg', 'uKrgEv7-rVM', 'UPOxrE79uCE', 'eB9dQJaKpTM', 'AtsTfVpXDpY',
    'fg8JQmivIzs', '5NRVOCBoDyc', 'i1yC6rcRPeU', 'lS_9GIEpCe0', 'xFukt4Yndgw']],
  ['cvs', 'cvs-coronary', 'Coronary circulation & ischaemic heart disease', 'How the myocardium is fed, and what a blocked coronary artery does to it and to the ECG.', [
    'F51Tg_KNrKY', 'mtKVUC-Gpdg', 'KEfwq5A48kw', 'DAuQ3eQrbPE', '2BcaALrQ3PU', 'O7W8jegLokE']],
  ['cvs', 'cvs-conduction', 'Conduction, the ECG & arrhythmias', 'SA node to Purkinje fibres, what each wave means, and the rhythms that go wrong.', [
    'YNDqDqd2WkY', 'NijiLTONHxg', '32vOiSDfvAE', 'NR8GvLBfABw', 'pXvhTFpMOTw', '47PLh3UgpPs', 'zK2RIOqcuIU',
    'xqmyODnxVhU', 'M_soKG-Tzh0', 'uXo62h96zgM', 'WmGn7BlVQkU', 'o_mWbClDVzI', '1OEwneDW6A0', 'FkGF-at5WtM', 'elVAkFENfxI']],
  ['cvs', 'cvs-output', 'Cardiac output: preload, afterload & neural control', 'Stroke volume × heart rate, the Frank–Starling law, and how the medulla turns the dials.', [
    'WuGMqezV3eo', 'PfR8epq6Yac', 'pzEgjaDPVb8', '0FID5qRGXGg', 'IVSDvEEWgxE', 'zffzKo4Ew04', 'RkQq23fSRcA',
    'h2QAey56-Ms', 'RVl1dni2LDQ']],
  ['cvs', 'cvs-bp', 'Blood pressure & its regulation', 'Baroreflex, RAAS, ADH, the kidney — short-term and long-term control, and the drugs that act on it.', [
    'k-BWyBePu8Q', '6NJ0L4RNQ-8', 'TrU0VenTmIk', 'lXWFLDkl2tM', 'ibjodC7Ft7U', 'CWBNzX3d_y8', '0k-YBNQwm7k',
    'K27ipbateKY', 'd8SmtGCyqOE', 'oiGwAXp0CPo', 'dlLuYmWtaKM', 'dTqadSSWsZk', 'R_MW9AHYqys', 'nh08D29jepg', 'HV-k31vCYvg']],
  ['cvs', 'cvs-shock', 'Circulatory shock', 'Pressure too low to perfuse — the causes, the types, and the stages.', [
    'OKppt74Vr10', '3wa8jGDyhS8', 'bFKxnsVimls', 'JBUA1NcRchs', 'EvGgtY_NCDk', 'xKIpZ3bGUro']],
  ['cvs', 'cvs-aside', 'Answered in passing — other systems, one Module 1 fact', 'Videos about something else whose captions state a fact a CVS quiz tests. Watch for the tag, not the title.', [
    'XlqKNaebMJc', 'n2yXVKa1b_Y', 'J5av5Tw5rpk', '4SeDddlLT3w', 'IivVcea01xI', 'hlctwXB5ihw', 'BB0qVcp7FOQ',
    'r9n_LtrXctY', 'sjdO6grmvVw', 'HM1z1dl-Rxs', 'RhBS9ANCVL8', 'xSGWUrAgTLI']],

  ['resp', 'resp-anat', 'Respiratory anatomy & the airway', 'Nose to alveolus: the tree, its lining, the larynx, the reflexes that guard it, and what emphysema and pneumonia do to it.', [
    'Yc2yVIAif9g', 'CFHUYTPc7So', 'D2t7aHAMxIU', 'difIQ4Jwi9o', 'zf7mPgRCZf8', '_vsKkLTnJCU', 'ZEi-LcsLCvY',
    '4wjCLiCCS6w', '8nu66_5j6T8', 'IXbVwm5vVnA', 'RbgVg-kbJ3Q', 'GYZ8ivcBGDw', '_x8QJr9rkPo', 't7DXH8cvYUc', 'wZTWURpP_As']],
  ['resp', 'resp-vent', 'Ventilation: pressures, muscles & volumes', "Boyle's law, the muscles of quiet and forced breathing, and the lung volumes and capacities.", [
    'VX2Biw_qRoU', 'RcLnzU6Pk_Q', 'YpllpAAeir4', 'HbweHVLv9FE', '59knV9PJ3Rs', 'eV5efVFaxLU', 'WoIzGOyX4F8',
    'pA7QZUkmErg', 'J49cgFC1uXQ', 'TrUaRX-Fd80', 'Y9k0K999dlM']],
  ['resp', 'resp-exchange', 'Gas laws, exchange & V/Q matching', "Dalton and Henry, the respiratory membrane, and why ventilation and perfusion have to agree.", [
    '7z9coEwzn2s', 'xLtLY9qaQks', '4OetlK7YQOY', 'CQo_if4NEb4', 'uah-1eXBjmQ', 'iWCyi_uosUo', 'dDBX-z07n9I',
    'nBfqDvNJ3LA', 'BHbl-ws5deg']],
  ['resp', 'resp-transport', 'Gas transport & acid–base balance', 'Oxygen and carbon dioxide in the blood, the bicarbonate buffer, and the four acid–base disturbances.', [
    '7vPRetkeDjI', 'tC9EfkOe8IQ', 'pFQVq6ArdSw', 'uk0WpLoD8SE', '6cb0eDBO19k', 'rcvRiglLLL0', 'w3nsxx6AcdA',
    'kpwiuBfXCbo', 's5UQ_JpvFqc', 'aTor6siCllY', '21oV1MD0G8k', 'Y95u-wCfZMs', 'K1qReVoragU', 'HiFZQ-pOtmw',
    'zsPa6oFZcdU', '8cOyDn2Myy8']],
  ['resp', 'resp-control', 'Regulation of breathing', 'The medullary centres, the chemoreceptors, and the breathing patterns that show up at the bedside.', [
    'GqkMzds77f8', 'uAnnFscr4LQ', 'AG7Ev2hJGFk', '9IZGNzj9S0w', '6FugDyys-9A', 'vLSwWBRWekY']],

  ['lymph', 'lymph-sys', 'The lymphatic system & oedema', 'Where lymph comes from and goes, lacteals, and what happens when the drain is blocked or overwhelmed.', [
    'ik9xIeOjHyw', 'C7PR3oEMIy4', 'I8fVKz1nupo', 'mAfw4yHtr1k', 'SOZhlKj7nZ0', 'aMhNvS1yYqY', 'ENR669jLTL4']],
  ['lymph', 'lymph-imm', 'Immunity', 'The cells and the four types of immunity — the lymphatic system’s other job.', [
    'UsZ_zHfFeR0', 'yvKENnMUxLA', 'Q8YeuicRNxc', 'lbfywanF2Bc', 'kD8YJvwp9-8']],
];

/* Videos deliberately filed under a different system than dmdm-all tags them.
   The tag drives nothing here except this check, so the point of the list is to
   make each move a decision on the record rather than a silent reclassification. */
const OVERRIDES = {
  'xSGWUrAgTLI': 'jugular venous pressure is a cardiovascular sign; the hub shelved it under ventilation because its captions answer a breathing question, so it is tagged resp',
};

const SYS = [
  ['cvs', 'Cardiovascular', 'The heart, the vessels and blood pressure — more than half of Module 1.'],
  ['resp', 'Respiratory', 'Breathing, gas exchange and the acid–base link that runs into the exam cases.'],
  ['lymph', 'Lymphatic', 'The drain and the guard — small block, two exam cases lean on it.'],
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
<title>Module 1 Video Playlist — Dr Matt &amp; Dr Mike</title>
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
    <a class="back" href="https://jeremyspm.github.io/hs2-paper-m1/">Paper Sim →</a>
    <button class="iconbtn" id="btnTheme" title="Theme">◐</button>
  </div>
  <h1>▶ Module 1 Video Playlist</h1>
  <p class="sub">Every Dr Matt &amp; Dr Mike video the HS2 Paper Sim knows about — ${total.n} of them, ${total.topics} topics, ${hhmm(total.s)} end to end. Watch first, sit the mock papers after.</p>
  <div class="why">📺 <b>Why this exists:</b> inside the Paper Sim a video only appears once you have already got something wrong. That is good remediation and useless for orientation — and ${total.n - total.reach} of these ${total.n} videos teach nothing a captured quiz question tests, so no amount of failing ever surfaces them. Here they are all in the open, grouped by topic. Tap a title to play it on this page.</div>

  <div class="controls">
    <div class="searchrow">
      <input id="q" type="search" placeholder="Search ${total.n} videos — try “capillary”, “ECG”, “lymph”" autocomplete="off" spellcheck="false"/>
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

  <div class="note"><b>What the numbers mean.</b> The “<i>explains N</i>” tag counts Paper Sim questions whose tested fact this video actually states — matched from the video's own captions, not its title, judged from that text, gated on a verbatim quote re-found in the track, and the doubtful cases read again by hand — so every tag is a claim that was read, not guessed. The ${total.n - total.reach} videos with no tag are still good videos; they just cover ground none of the captured quizzes ask about. And these are Dr Matt &amp; Dr Mike, not Hannetjie: where a video and her material disagree, <b>she is the one being marked</b>.</div>

  <div class="foot">Videos and durations come straight from hs2-paper-m1's <code>content/dmdm-all.json</code> (the hs2-module1 shelf, flattened); the question counts from its <code>content/video-matches.json</code>. Topics are this page's own grouping. Watched ticks are stored in this browser only.</div>
</div>
<script>
'use strict';
const PACK=${JSON.stringify(PACK)};
const TK='hub.theme', WK='hs2m1vid.seen';
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
