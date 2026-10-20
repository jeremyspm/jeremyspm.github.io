/* Generates med-admin-cheat-offline.html: the med admin half of
 * med-admin-cheat.html as one self-contained file to keep offline or send to
 * someone. The page's "Download for offline use" button links to it.
 *
 * NOTHING here is authored content. It takes the live page and cuts the vital
 * signs part (its four sections, their jump chips and its marking sheet), the
 * back link and the download button. Every cut is asserted, so an edit to the
 * page that breaks one fails loudly instead of shipping a copy that still has
 * vital signs in it.
 *
 * It also adds print CSS, so printing it (or `--pdf`) gives a clean A4 PDF.
 * The print CSS turns the page's grid layouts into plain blocks: Chrome can't
 * split a CSS grid item across a page break, and on 20 Oct the grid version
 * printed table rows and list items on top of each other.
 *
 * Re-run after any edit to med-admin-cheat.html:
 *   node med-admin-cheat-offline.build.mjs
 *   node med-admin-cheat-offline.build.mjs --pdf <out.pdf>   (also prints a PDF
 *     with headless Chrome or Edge; set CHROME=<path> if neither is found)
 */
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/* Paths resolve from THIS FILE, never the working directory. */
const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, 'med-admin-cheat.html');
const OUT = join(here, 'med-admin-cheat-offline.html');

// LF only, so the cuts below match whatever line endings the checkout has.
let h = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');

function cut(re, label) {
  const next = h.replace(re, '');
  if (next === h) throw new Error(`cut failed: ${label}`);
  h = next;
}
function sub(from, to) {
  if (!h.includes(from)) throw new Error(`replace failed: ${from}`);
  h = h.replace(from, to);
}

// The whole vital-signs part: its heading up to the Med admin heading, then that heading.
cut(/<h2 class="part">Vital signs<\/h2>[\s\S]*?(?=<h2 class="part">Med admin<\/h2>)/, 'vital signs part');
cut(/<h2 class="part">Med admin<\/h2>\s*/, 'med admin part heading');
// The vital signs marking sheet: the second card in #rubric.
cut(/  <div class="card">\s*<h3>Practical Skills Assessment: Vital Signs[\s\S]*?<\/div>\n(?=  <p class="small muted">Copied)/, 'vital signs marking sheet');
// Their jump chips.
for (const id of ['normals', 'vs', 'bp', 'vstraps']) cut(new RegExp(`    <a href="#${id}">[^<]*</a>\\n`), `chip #${id}`);
// The back link goes nowhere offline; the download button would download itself.
cut(/  <a class="back"[^\n]*\n/, 'back link');
cut(/  <a class="btn"[^\n]*id="dl"[^\n]*\n  <p class="small muted"[^\n]*\n/, 'download button');

sub('<title>Practical Cheat Sheet</title>', '<title>Med Admin Cheat Sheet</title>');
sub(/<meta name="description" content="[^"]*">/.exec(h)[0],
    '<meta name="description" content="CLS practical cheat sheet: med admin (paracetamol, metoprolol, drug interactions, the rights, Ask Build Check) and its traps.">');
sub('CLS practicals · vital signs and med admin', 'CLS practical · medication administration');
sub('<h1>Practical cheat sheet</h1>', '<h1>Med admin cheat sheet</h1>');
sub("Both practicals on one page: the vital signs routine and normal ranges, Mr Luke's two drugs and their interactions, and the traps for each.",
    "The med admin practical on one page: Mr Luke's two drugs and their interactions, the full run, Ask Build Check, and the traps.");
sub('The two marking sheets', 'The marking sheet');
sub('<a href="#rubric">Marking sheets</a>', '<a href="#rubric">Marking sheet</a>');
sub('which took them from the Canvas sheets', 'which took it from the Canvas sheet');
sub('<footer>\n  <p>', '<footer>\n  <p>Offline copy of jeremyspm.github.io/med-admin-cheat.html (med admin only).</p>\n  <p>');

for (const word of ['Vital signs', 'vital signs routine', 'tympanic', 'Two-step', 'Normal adult ranges']) {
  if (h.includes(word)) throw new Error(`still in the offline copy: ${word}`);
}

/* Paper: always light, A4, no nav, every grid flattened to blocks so page breaks are clean. */
const PRINT_CSS = `
/* print (added by med-admin-cheat-offline.build.mjs) */
@media print{
  :root,:root[data-theme]{--bg:#fff;--card:#fff;--card2:#f4f5f7;--line:rgba(0,0,0,.18);--line2:rgba(0,0,0,.25);
    --tx:#16161a;--tx2:rgba(0,0,0,.68);--tx3:rgba(0,0,0,.55);--acc:#4F46E5;--acc-tx:#4F46E5;--acc-soft:rgba(79,70,229,.10);
    --good:#12833A;--hard:#A35C00;--bad:#C62A20;--ph:#7E22CE;--ph-soft:rgba(126,34,206,.08);color-scheme:light}
  @page{size:A4;margin:14mm 12mm}
  html,body{background:#fff;margin:0}
  body{font-size:13px;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  nav.chips{display:none}
  .wrap,header,section,.sec-head,.card,.mini,.def,dl.defs,ul,ol,.split,.quick li{display:block}
  .wrap{max-width:none;padding:0}
  .wrap>*+*{margin-top:26px}
  header>*+*,section>*+*,.card>*+*,.mini>*+*,.def>*+*{margin-top:9px}
  .sec-head>*+*{margin-top:3px}
  section>h3{margin-top:16px}
  li+li{margin-top:5px}
  .split>*+*{margin-top:16px}
  .quick li{position:relative;padding-left:38px;min-height:28px}
  .quick li::before{position:absolute;left:0;top:0;width:28px}
  dl.defs,.tscroll{overflow:visible}
  h1{font-size:30px}
  h2{font-size:19px}
  .def,tr,.mini,.card,.say,li,p{break-inside:avoid}
  .sec-head .eyebrow{display:block}
  .sec-head{break-inside:avoid}
  h2,h3,.sec-head{break-after:avoid}
}
`;
sub('</style>', PRINT_CSS + '</style>');

fs.writeFileSync(OUT, h);
console.log(`wrote ${OUT}`);

const pdfAt = process.argv.indexOf('--pdf');
if (pdfAt !== -1) {
  const pdf = resolve(process.argv[pdfAt + 1] || join(here, 'med-admin-cheat.pdf'));
  const browser = [
    process.env.CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].find(p => p && fs.existsSync(p));
  if (!browser) throw new Error('no Chrome or Edge found: set CHROME');
  const profile = fs.mkdtempSync(join(os.tmpdir(), 'med-admin-pdf-'));
  const r = spawnSync(browser, [
    '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
    `--user-data-dir=${profile}`, `--print-to-pdf=${pdf}`, pathToFileURL(OUT).href,
  ], { encoding: 'utf8' });
  fs.rmSync(profile, { recursive: true, force: true });
  if (r.status !== 0 || !fs.existsSync(pdf)) throw new Error(`print failed:\n${r.stderr}`);
  console.log(`wrote ${pdf}`);
}
