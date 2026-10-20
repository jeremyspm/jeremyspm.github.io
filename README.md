# BN2 Study Tools (the root page)

The landing page for every study tool that is still in use, live at
**https://jeremyspm.github.io/** (this repo must stay named
`jeremyspm.github.io`; that's what puts it at the root URL). One link to
share with the cohort.

**How it works (20 Oct 2026, second pass):** two taps to studying. Home lists
everything coming up, by date, across all three papers; **every exam
sparkles**. Tap an exam and it is **three sides**, always in this order:
**Rep questions** (the sim's question bank, marked as you go), **Write
answers** (the sim's SAQ trainer, typed like on the day; the timed mock is a
quiet link under it) and **Listen** (the podcast, only where one exists, so
INP has two sides for now). **Pharm's third side is Abbreviations**
(Chart Speak): in the 20 Oct revision session Joan said "must, must, must"
about the abbreviations ("you've got to know them all", 1:18:53 in
`pharm-final/transcripts/Pharm 20 Oct - transcript.md`). Each side is one big button and at
most two quiet links. Placement and the resits keep the old layout (one
"Start here" tool, then the rest). Everything else (videos, the 3D body, the
Pharmacology hub, Chart Speak…) is in the **Library** (`#tools`), filed by
paper, and still found by search.

Why (20 Oct, "way too many pills"): the first pass sorted by assessment but
still gave each exam a Start here card, three to four shortcut pills and up to
seven more tools in three sections, so nobody knew where to start. The exam is
three things you actually do, so the page is those three things. The Genetics
Trainer sits under Rep for Test 3 and the final (cases 14 and 15), not as its
own card. Picked from `mockup-three-sides.html` the same day (option B).
The sims only take screen-level links (`#learn`, `#saq`, `#mock`,
`#allcase`), so a side can't yet list topics or cases that open one each.

URLs are shareable: `/#hs2/t3`, `/#hs2/t3/write`, `/#tools`. Switching side
changes the URL without adding a back step, and an exam reopens on the side
you last had open (localStorage `hub.side.<paper>/<id>`). A bare `/#hs2` (the
old paper screen) lands on Home. Each exam's screen takes on its paper's hue
(HS2 blue, INP green, Pharm purple) and opens with a trail, `⌂ Home › HS2 Test 3`.

## Adding a tool, or an assessment (the whole process)

Everything the page shows is two lists at the top of the script in
`index.html`, between `CONTENT` and `ENGINE`:

- **`TOOLS`**: `id: {nm, ic, url, ds, kind, pp, kw?}`. `url` is relative to
  the site root (`medcalc/`, `pharm-final/chart.html`); `ic` is an id in
  the inline SVG sprite; `kind` is `practise`, `learn` or `listen` (which
  section it shows in); `pp` is the paper it's filed under in the Library;
  `kw` adds search words, including the everyday words for its topic.
- **`PAPERS`**: each paper's assessments (`as`). An **exam** has `t`, `s`,
  `kw`, a `date` and `sides`: `{rep, write, listen?, terms?}`, each
  `{id, h, go, ds, more:[[toolId, hash, label, icon]]}` (the tool and screen
  the big button opens, its label, one line, and at most two quiet links).
  Anything else has `t`, `s`, `kw`, an optional `date`, a `start` tool and
  a `tools` list (can be empty). `start` is an id, or `{id, jump:[[hash,label,icon]], cta:[hash,label]}`
  for the shortcut buttons / to point the main button at a screen. A `tools`
  entry is an id, or `{id, h, why}` to open that tool at one screen
  (`cls-trainer/#walk/ma`) with its own one-line reason.
- **`date`**: `{on}` or `{from,to}` (`YYYY-MM-DD`) plus `chip`, `what`,
  `txt`, optional `verb` and `keep`. A dated assessment **hides itself the
  day after its date** unless it has `keep` (then only its date goes).
  Assessments are sorted by date on Home.
- **`quiet: true`** (20 Oct) marks an assessment most of the cohort is past
  (Med calc test, Med admin practical): it sits under "Resits and catch-ups"
  at the bottom of Home and never sparkles.

Then:

1. `node index.check.mjs`, which must print `ok:`. It runs the page's own
   script against a stub DOM and fails on: an assessment naming a tool
   that doesn't exist, an exam without a rep and a write side, a side with more
   than two quiet links, a missing icon, a bad date, a
   script that won't parse, `color:var(--acc)`, the old navy palette, a
   missing `noindex`, a tool with no `kind` or paper, a quiet assessment in
   Next up, and **27 search probes** ("bp" must land on the CLS Practical
   Trainer, "mg to ml" on MedCalc, "test 3" on Test 3, …). Probes whose
   assessment has hidden itself are skipped, not failed.
2. `node index.check.mjs --live` also fetches every tool and checks every
   jump's (and every `h`'s) `#screen` exists in that tool's router. Screens a Paper Sim only
   shows when it has content (`saq`, `focus`, `vid`) still deserve one look
   in a browser; all of them were checked on 12 Oct.
3. Commit + push.

**Dates** came from the `sem2-finals-dates` memory (INP Mon 2 Nov, HS2 Wed 4
Nov, Pharm Thu 5 Nov), the Test 3 ProctorU window (Tue 20 – Mon 26 Oct), the
med calc resit (Wed 21 Oct) and placement (9 Nov – 18 Dec). `CHECKED` is
the date printed in the footer; bump it whenever they're re-checked.

**Left off on purpose (his call, 12 Oct; 20 Oct):** the Vital signs practical and
Taking a BP (the cohort is past them; the CLS trainer and its BP Lab are still
under Placement, Med admin and the Library), and finished work (HS2 Test 1 and
Test 2 sims, the pharm essay). Also left off by default: the Module 1 sim
(its three exam cases are inside HS2 Final), the old Module 1 hub,
Placement Passport, the ED checklist, Ask Your Book and the BN2 brief. All
of them are still live at their own URLs.

**Copy is written for classmates**, not for Jeremy alone: no personal resit
history, lecturers named (Hannetjie, Joan), and a footer saying it's
student-made, not MIT material. No visit counter on this page (the old
hub's `cloud/count.js` is still in the repo, unused here).

### Tools that live in THIS repo

Step 1 assumes its own repo, and most tools have one. A few live here instead and
are served straight off the root — `bn2-brief.html`, `np-roadmap.html` and
`hs2-videos.html`. That is the right call when a tool is small, single-file and unlikely
to grow its own release cycle; give it its own repo the moment it needs issues, a build
pipeline, or a version history separate from the hub's.

`hs2-terms.html` used to be a third, generated by `hs2-terms.build.mjs` from
`cram-engine` + `hs2-test1`'s glossary. **Removed 2026-08-10**, along with its generator
and pack. It drilled the 63 terms that focus points `cvs-15` / `resp-17` / `lymph-4`
name, to fill coverage that was not actually missing — those focus points hold 28, 7 and
2 cards in Test 1 Cram once `alsoCrit` is counted the way the build counts it. The terms
are still searchable in that tool's glossary. Full reasoning is in the PROJECTS comment
in `index.html` where its tile used to be; before rebuilding anything like it, read
`hs2-test1`'s commit `64278d2`, which retired the same idea for the same reason.

`hs2-videos.html` is generated too: **`node hs2-videos.build.mjs`** reads hs2-test2's
`content/dmdm-all.json` for the video list and its **built** `index.html` for the
per-video "explains N questions" counts, then writes the playlist page. It expects
hs2-test2 as a sibling (`HS2_TEST2=` overrides), and exits 2 with the path it wanted if
it is missing. **Regenerate rather than editing the HTML.** Since 2026-09-06 those
counts come from hs2-test2's `content/video-matches.json`, where every question→video
pair was found in the video's own caption track, judged from that text, quote-gated
and re-checked — see that repo's README. 86 of the 153 videos now carry a count; the
title matcher that shipped on 1 Sept had reached 48 of 148, about a third of them
wrongly. The five added on 6 Sept came from grepping the whole channel for the quiz
topics no listed video covered.

The one thing the generator authors is the `TOPICS` table inside it — which video ids
sit under which of the 20 topics. That table is gated in both directions: a video in no
topic, a video in two, or a topic naming an id `dmdm-all.json` no longer has all fail
the build. So the page cannot quietly stop being *every* video, which is the only thing
it promises. Adding a video to hs2-test2 means adding its id to a topic here.

Why the page exists at all: inside hs2-test2, `content/explain.mjs` attaches a video to
a question at build time, and the page only shows it once you have answered wrong. 67
of the 153 videos teach nothing a captured quiz question tests, so they are unreachable
from in there however badly you do. This is the orientation door — watch first, sit the
mock papers after.

It is worth saying why this is not the `hs2-terms.html` mistake one paragraph up, since
it looks like it from a distance. That tool drilled content Test 1 Cram **already
covered** — the coverage it filled was not missing. This page carries content the Paper
Sim **ships and cannot reach**: 67 videos behind a door that only opens on a wrong
answer they are not attached to. Nothing is duplicated and nothing is drilled; it is a
reference surface, which is also why it carries no `practises` and bids into no
readiness bar. If a future version of `video-matches.json` ever reaches all 148, that
argument weakens and this page should be re-examined.

**Where the landing page links it (12 Oct 2026):** all three playlists
(`hs2-m1-videos.html`, `hs2-videos.html`, `hs2-m3-videos.html`) are `TOOLS` in
`index.html`, under **Learn it**: Module 3 on HS2 Test 3, and all three on the
HS2 Final exam (20 Oct; they were under *I need it explained* before). The old hub tile on branch
`claude/study-tool-video-playlist-bd5j3x` belonged to the dead hub and is not needed.

## Notes

- `<meta name="robots" content="noindex">` keeps the page out of search
  engines — it's meant to be shared by link (the `og:` tags give it a
  proper preview in a group chat). Remove that line if you ever want it indexed.
- A plain static page: no build step, no dependencies, house palette by value
  (the BN Hub uniformity contract), theme key `hub.theme` shared with the tools.
- `v2.html` and `bn2-brief.html` here are still "offline" placeholders; the
  brief lives on in its own repo (`jeremyspm/bn2-brief`).

## For future Claude sessions

When a new tool is built for Jeremy: publish it as its own `jeremyspm` repo
with Pages, add a `TOOLS` entry, name it in the right assessment's `start` or `tools`, run `node index.check.mjs --live`, push, and check the live page
at 375px. When a sitting passes, its assessment hides itself; when a whole paper
is finished, remove it from `PAPERS` (and its tools that nothing else uses).
