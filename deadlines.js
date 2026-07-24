/* ══════════════════════════════════════════════════════════════════════
   deadlines.js — the machine-readable assessment calendar.
   Single source of truth for the hub's ⚡ Study engine (see
   STUDY-ENGINE-SPEC.md in the estate root). bn2-brief.html is the human
   version; keep the two in agreement when Canvas changes anything.

   ── ADDING A NEW SEMESTER (e.g. BN3, Semester 1 2027) ─────────────────
   This file is APPEND-ONLY across the degree. When a new semester starts:
     1. Append its papers to `papers` (new keys, semester label).
     2. Append its assessments to `assessments` (same fields as below).
     3. Optionally set `archived: true` on finished papers — this silences
        any pulses old apps still write. (Past-dated assessments already
        score zero, so this is belt-and-braces, not required.)
     4. Update `stream` if the new semester assigns one.
   Nothing in the hub engine or any app changes. New apps enroll
   themselves by writing a `studybus.pulse.<appId>` key that references
   the assessment ids you add here.

   ── FIELD REFERENCE (per assessment) ──────────────────────────────────
   id          stable slug — apps reference this in their pulse `assess`
   paper       key into `papers`
   kind        exam | test | assignment | practical | signoff
               (engine only feeds recall work: exam/test/practical;
                assignment/signoff are calendar context only)
   due         ISO date. Windowed items use window:{open,close} instead
   time        24h string when verified; timeUnconf:true if not
   weight      % of the paper (omit for hurdles); pts for point-scored
   hurdle      true = Met/Not-Met gate — can fail the paper outright
   resits      ISO dates of later attempts; engine targets the next
               future sitting until `done` is set
   streamDates { '1A': date, … } — engine assumes the EARLIEST until
               `stream` below is filled in
   done        null → set to an ISO date when submitted/passed; the item
               instantly drops to zero priority
   ══════════════════════════════════════════════════════════════════════ */
window.DEADLINES = {
  v: 1,
  updated: '2026-07-24',
  stream: null,          // '1A' | '1B' | '2A' | '2B' — set when the roster posts

  papers: {
    hs2:   { name: 'Health Science 2',                semester: 'BN2 S2' },
    inp:   { name: 'Introduction to Nursing Practice', semester: 'BN2 S2' },
    pharm: { name: 'Introduction to Pharmacology', code: '61985', semester: 'BN2 S2' },
  },

  assessments: [
    /* ─── Health Science 2 ─── */
    { id:'hs2-oquiz', paper:'hs2', kind:'test', due:'2026-07-29', time:'1100',
      name:'Orientation Quiz', pts:10, done:null },
    { id:'hs2-t1', paper:'hs2', kind:'test', due:'2026-08-23', weight:16.6,
      name:'Test 1 — Module 1', notes:'35 Q · 20% SAQ · Wk 1–4', done:null },
    { id:'hs2-t2', paper:'hs2', kind:'test', due:'2026-09-21', weight:16.6,
      name:'Test 2 — Module 2', notes:'42 Q · 22% SAQ · Wk 5–8', done:null },
    { id:'hs2-t3', paper:'hs2', kind:'test', due:'2026-10-26', weight:16.6,
      name:'Test 3 — Module 3', notes:'37 Q · 30% SAQ · Wk 9–11', done:null },
    { id:'hs2-final', paper:'hs2', kind:'exam', due:'2026-11-05', time:'1230',
      weight:50, name:'HS2 Final Exam',
      notes:'32 Q · 37% SAQ · rooms 301/312 · Wk 1–12 · starred Booklet A cases', done:null },
    { id:'hs2-labs', paper:'hs2', kind:'practical', hurdle:true,
      name:'Practical labs (5 of 6)', due:'2026-11-01', done:null },

    /* ─── Introduction to Nursing Practice ─── */
    { id:'inp-profile', paper:'inp', kind:'assignment', weight:20,
      name:'Community Profile (group)',
      streamDates:{ '1A':'2026-09-04','1B':'2026-09-04','2A':'2026-09-18','2B':'2026-09-18' }, done:null },
    { id:'inp-case', paper:'inp', kind:'assignment', weight:30,
      name:'Case Study (written)',
      streamDates:{ '2A':'2026-09-14','2B':'2026-09-21','1A':'2026-09-28','1B':'2026-10-05' }, done:null },
    { id:'inp-vitals', paper:'inp', kind:'practical', hurdle:true,
      name:'Vital Signs practical', window:{open:'2026-10-05', close:'2026-10-30'},
      notes:'roster slot TBA · shares the window & skill set with pharm-medadmin', done:null },
    { id:'inp-final', paper:'inp', kind:'exam', due:'2026-11-04', time:'1300',
      weight:50, name:'INP Final Exam',
      notes:'60 MCQ + 10 SAQ · Canvas opens 1230 · venue TBA', done:null },
    { id:'inp-soc', paper:'inp', kind:'signoff', hurdle:true,
      name:'Standards of Competence sign-offs', due:'2026-11-20',
      resits:['2026-12-04','2026-12-18'], done:null },

    /* ─── Introduction to Pharmacology ─── */
    { id:'pharm-medcalc', paper:'pharm', kind:'practical', hurdle:true,
      name:'Medication Calculations Test', due:'2026-08-25', time:'0800',
      resits:['2026-09-15','2026-10-07','2026-10-21'],
      notes:'must-pass · rooms 201 & 301', done:null },
    { id:'pharm-medadmin', paper:'pharm', kind:'practical', hurdle:true,
      name:'Medication Administration Competence',
      window:{open:'2026-10-05', close:'2026-10-30'}, notes:'max 2 attempts', done:null },
    { id:'pharm-essay', paper:'pharm', kind:'assignment', due:'2026-10-12',
      time:'0900', weight:50, name:'Pharmacology Essay', notes:'APA 7th', done:null },
    { id:'pharm-final', paper:'pharm', kind:'exam', due:'2026-11-06',
      timeUnconf:true, weight:50, name:'Pharmacology Final Exam',
      notes:'MCQs & SAQs · afternoon', done:null },
  ],
};
