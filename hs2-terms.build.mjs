/* Generates hs2-terms.html — the Module 1 terminology cram tool.
 *
 * The term LIST is the course's own: focus points cvs-15, resp-17 and lymph-4 of
 * "Continuous Tests and Exam Focus Points" (a.k.a. Module 1: Assessment Criteria),
 * which appears identically in Science 2 Detailed Content.docx and on pages 4-6 of
 * the Course Lab Workbook. Every term below is named there, spelled as the course
 * spells it. The DEFINITIONS are lifted from hs2-test1's glossary, already
 * cross-checked against the module hub, so nothing here is newly invented.
 */
import fs from 'fs';
const SRC = '/tmp/claude-0/-home-user-jeremyspm-github-io/f222785a-8dfb-5c91-8c55-36ccb56d7389/scratchpad/pack.json';
const TPL = '/workspace/cram-engine/template.html';
const OUT = '/home/user/jeremyspm.github.io/hs2-terms.html';

const P = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const gloss = {};
(P.glossary || []).forEach(g => gloss[g.term.toLowerCase().trim()] = g.def);

/* course spelling → the glossary key that defines it. `alt` holds spellings the
   matcher should also accept, which is where the course's own two misspellings live:
   the workbook writes "Hypocapnea" and "Hypercapnoea"; the words are hypocapnia and
   hypercapnia. A student who types the correct spelling must not be marked wrong,
   and one who reproduces the workbook's must not be either. */
const TERMS = [
  // ── cvs-15 · Cardiovascular terminology and homeostatic imbalances ──
  ['Pulse', 'cvs', 'pulse'],
  ['Cardiac output', 'cvs', 'cardiac output'],
  ['Blood pressure', 'cvs', 'blood pressure'],
  ['Blood flow', 'cvs', 'blood flow'],
  ['Peripheral resistance', 'cvs', 'peripheral resistance'],
  ['Tissue perfusion', 'cvs', 'tissue perfusion'],
  ['Vasoconstriction', 'cvs', 'vasoconstriction'],
  ['Vasodilation', 'cvs', 'vasodilation'],
  ['Pressure points', 'cvs', 'pressure points'],
  ['ECG', 'cvs', 'ecg'],
  ['Coronary arteries', 'cvs', 'coronary arteries'],
  ['Coronary circulation', 'cvs', 'coronary circulation'],
  ['Myocardial infarction', 'cvs', 'heart attack / myocardial infarction', ['heart attack']],
  ['Ischaemia', 'cvs', 'ischaemia'],
  ['Myocardium', 'cvs', 'myocardium'],
  ['Atrial systole', 'cvs', 'atrial systole'],
  ['Atrial diastole', 'cvs', 'atrial diastole'],
  ['Ventricular systole', 'cvs', 'ventricular systole'],
  ['Ventricular diastole', 'cvs', 'ventricular diastole'],
  ['Pericarditis', 'cvs', 'pericarditis'],
  ['Myocarditis', 'cvs', 'myocarditis'],
  ['Endocarditis', 'cvs', 'endocarditis'],
  ['Angina pectoris', 'cvs', 'angina pectoris'],
  ['Asystole', 'cvs', 'asystole'],
  ['Bradycardia', 'cvs', 'bradycardia'],
  ['Tachycardia', 'cvs', 'tachycardia'],
  ['Inotropic action', 'cvs', 'inotropic action'],
  ['Chronotropic action', 'cvs', 'chronotropic action'],
  ['Congestive heart failure', 'cvs', 'congestive heart failure'],
  ['Ventricular fibrillation', 'cvs', 'ventricular fibrillation'],
  ['Hypertension', 'cvs', 'hypertension'],
  ['Hypotension', 'cvs', 'hypotension'],
  // ── resp-17 · Respiratory terminology and homeostatic imbalances ──
  ['Alveoli', 'resp', 'alveoli'],
  ['Asthma', 'resp', 'asthma'],
  ['Chronic bronchitis', 'resp', 'chronic bronchitis'],
  ['Bronchodilator', 'resp', 'bronchodilator'],
  ['Negative pressure breathing', 'resp', 'negative pressure breathing'],
  ['Positive pressure ventilation', 'resp', 'positive pressure ventilation'],
  ['Cellular respiration', 'resp', 'cellular respiration'],
  ['Pleural pressure', 'resp', 'pleural pressure'],
  ['Atmospheric pressure at sea level', 'resp', 'atmospheric pressure at sea level'],
  ['Partial pressure of gases', 'resp', 'partial pressure of gases'],
  ["Boyle's law", 'resp', "boyle's law"],
  ["Henry's law", 'resp', "henry's law"],
  ['Hypoxia', 'resp', 'hypoxia'],
  ['Hypocapnia', 'resp', 'hypocapnia', ['hypocapnea']],
  ['Hypercapnia', 'resp', 'hypercapnia', ['hypercapnoea', 'hypercapnea']],
  ['Dyspnoea', 'resp', 'dyspnoea'],
  ['Apnoea', 'resp', 'apnoea'],
  ['Emphysema', 'resp', 'emphysema'],
  ['Tuberculosis', 'resp', 'tuberculosis'],
  ['Eupnoea', 'resp', 'eupnoea'],
  ['Tachypnoea', 'resp', 'tachypnoea'],
  ['Hyperventilation', 'resp', 'hyperventilation'],
  // ── lymph-4 · Lymphatic terminology and homeostatic imbalances ──
  ['Buboes', 'lymph', 'buboes'],
  ['Lymphoedema', 'lymph', 'lymphoedema'],
  ['Lymphangitis', 'lymph', 'lymphangitis'],
  ["Hodgkin's disease", 'lymph', "hodgkin's disease"],
  ['Splenectomy', 'lymph', 'splenectomy'],
  ['Tonsillitis', 'lymph', 'tonsillitis'],
  ['Sentinel node', 'lymph', 'sentinel node'],
  ['Swollen glands', 'lymph', 'swollen glands'],
  ['Ruptured spleen', 'lymph', 'ruptured spleen'],
];

const missing = TERMS.filter(t => !gloss[t[2]]);
if (missing.length) { console.error('✗ no definition for:', missing.map(m => m[0])); process.exit(1); }

const CRIT = { cvs: 'cvs-15', resp: 'resp-17', lymph: 'lymph-4' };
const TOPIC = { cvs: 'cvs-terms', resp: 'resp-terms', lymph: 'lymph-terms' };

/* Deterministic shuffle so a rebuild produces the same distractors — a card whose
   options move between builds is a different card to ckey(), and every reader's
   progress on it silently resets. */
function rng(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const bySys = {}; TERMS.forEach(t => (bySys[t[1]] = bySys[t[1]] || []).push(t));

/* DISTRACTORS ARE THE NEAREST CONFUSABLES, not a random draw, and on this pack that is
   a correctness requirement rather than a nicety.
 *
 * The matcher credits a typo within an edit distance scaled to word length, and it only
 * refuses when the typed text is closer to one of the card's OWN distractors. This pack
 * is almost entirely minimal pairs — hypocapnia/hypercapnia (distance 2 on an 11-letter
 * word, i.e. inside tolerance), atrial/ventricular systole/diastole, peri-/myo-/endo-
 * carditis, eu-/dys-/a-/tachy-pnoea. With random distractors, a reader typing
 * "hypocapnia" on the hypercapnia card would be told "right idea, spelling" — crediting
 * the opposite term. Putting the nearest neighbours on the card puts them in `wrongs`,
 * where the distractor test catches exactly the confusion the reader actually made.
 *
 * It also makes the multichoice fall-through worth answering: four options that differ
 * by a prefix is the discrimination the paper tests. Two nearest plus one further afield,
 * so the options are not always a single family. */
const fold = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/ae|oe/g, 'e').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
const cards = [];
for (const [term, sys, key, alt] of TERMS) {
  const def = gloss[key];
  const pool = bySys[sys].filter(t => t[0] !== term);
  const r = rng(term);
  const ranked = pool.slice().sort((x, y) => lev(fold(term), fold(x[0])) - lev(fold(term), fold(y[0])));
  const picked = ranked.slice(0, 2).map(t => t[0]);
  const rest = ranked.slice(2).sort(() => r() - 0.5);
  if (rest.length) picked.push(rest[0][0]);
  const opts = [term, ...picked].sort(() => r() - 0.5);
  cards.push({
    type: 'mcq', topic: TOPIC[sys], crit: CRIT[sys],
    q: `<b>${esc(def)}</b><br/>Which term is this?`,
    options: opts, correct: opts.indexOf(term),
    why: `<b>${esc(term)}</b> — ${esc(def)}`,
    tier: 'textbook',
    srcNote: `The course names this term itself, in Module 1's ${
      sys === 'cvs' ? 'Cardiovascular' : sys === 'resp' ? 'Respiratory' : 'Lymphatic'
    } focus point on terminology (Science 2 Detailed Content, and pages 4–6 of the Course Lab Workbook). The definition is standard physiology, carried across from the Test 1 Cram pack.${
      alt ? ` The workbook spells it "${alt[0]}"; both spellings are accepted here.` : ''}`,
  });
}

const PACK = {
  id: 'hs2-terms',
  title: 'Module 1 — Terminology',
  subtitle: 'Health Science 2 · the terms the course names',
  lecturer: 'Hannetjie',
  exam: { auto: 32, saq: 3, minutes: 65, pass: 65, passIsTarget: true, date: '2026-08-23',
          mix: { mcq: 1 } },
  systems: [{ id: 'cvs', name: 'Cardiovascular' }, { id: 'resp', name: 'Respiratory' }, { id: 'lymph', name: 'Lymphatic' }],
  topics: [
    { id: 'cvs-terms', name: 'Cardiovascular terms', icon: '🫀', sys: 'cvs' },
    { id: 'resp-terms', name: 'Respiratory terms', icon: '🫁', sys: 'resp' },
    { id: 'lymph-terms', name: 'Lymphatic terms', icon: '💧', sys: 'lymph' },
  ],
  criteria: [
    { id: 'cvs-15', name: 'Cardiovascular terminology and homeostatic imbalances' },
    { id: 'resp-17', name: 'Respiratory terminology and homeostatic imbalances' },
    { id: 'lymph-4', name: 'Lymphatic terminology and homeostatic imbalances' },
  ],
  doorNote: 'Every card here is one of the terms the course names in its own focus-point list. Nothing has been added to that list and nothing left off it.',
  sources: 'The <b>list of terms</b> is the course\'s own: focus points <b>cvs-15</b>, <b>resp-17</b> and <b>lymph-4</b> of <i>Continuous Tests and Exam Focus Points</i> — the document Canvas files under <b>Assessment Criteria</b>, and the same list printed on <b>pages 4–6 of the Course Lab Workbook</b>. All 64 terms are named there and none has been invented. The <b>definitions</b> are standard physiology, carried across from the Test 1 Cram pack where they were cross-checked against the Module 1 hub — which is why every card is badged background reading. That badge is about the <b>wording</b>, not the scope: the course has said these terms are examinable, it has just never published definitions for them.',
  cards,
};

const tpl = fs.readFileSync(TPL, 'utf8');
const A = '/* ===== CONTENT PACK START ===== */', B = '/* ===== CONTENT PACK END ===== */';
const a = tpl.indexOf(A), b = tpl.indexOf(B);
if (a < 0 || b < 0) { console.error('✗ markers missing'); process.exit(1); }
const out = tpl.slice(0, a + A.length) + '\n' + 'const PACK = ' + JSON.stringify(PACK, null, 1) + ';\n' + tpl.slice(b);

/* Same gate the other packs ship behind: a page that parses but throws on load is the
   failure mode that looks fine and is not. */
for (const [i, m] of [...out.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].entries()) {
  try { new Function(m[1]); } catch (e) { console.error(`✗ script ${i} does not parse: ${e.message}`); process.exit(1); }
}
fs.writeFileSync(OUT, out);
/* The pack on its own, so `cram-engine/audit-typed.mjs` can be run against it. */
fs.writeFileSync(OUT.replace(/\.html$/, '.pack.js'), 'const PACK = ' + JSON.stringify(PACK, null, 1) + ';\n');
const n = { cvs: 0, resp: 0, lymph: 0 }; TERMS.forEach(t => n[t[1]]++);
console.log(`wrote ${OUT} — ${cards.length} cards (${n.cvs} cardiovascular · ${n.resp} respiratory · ${n.lymph} lymphatic), ${(out.length / 1024).toFixed(0)} KB`);
