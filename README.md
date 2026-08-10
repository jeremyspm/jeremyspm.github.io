# BN Hub

The landing page / directory for every study tool and app — live at
**https://jeremyspm.github.io/** (this repo must stay named
`jeremyspm.github.io`; that's what puts it at the root URL).

One link to share instead of a dozen: everything else is reachable from here.

## Adding a project (the whole process)

1. Publish the project (its own repo under `jeremyspm`, GitHub Pages enabled
   on `main` / root — it ends up at `https://jeremyspm.github.io/<repo>/`).
2. In `index.html`, find the `/* ===== PROJECTS START ===== */` block and add
   **one object**:

   ```js
   {cat:'cram', ic:'🧪', nm:'Name', ds:'One-line description.', url:'https://…', badge:'new'},
   ```

   `cat` must be one of the CATEGORIES ids (`cram`, `sim`, `clin`, `tool`,
   `life` — add a new category to CATEGORIES if none fits). `badge` is
   optional: `'new'` or `'beta'`. Remove badges once a tool matures.
3. Commit + push. Done.

Unpublished projects are parked as commented-out stubs at the bottom of the
PROJECTS array — flip them in when they go live.

### Tools that live in THIS repo

Step 1 assumes its own repo, and most tools have one. A few live here instead and
are served straight off the root — `bn2-brief.html`, `np-roadmap.html` and
`hs2-terms.html`. That is the right call when a tool is small, single-file and
unlikely to grow its own release cycle; give it its own repo the moment it needs
issues, a build pipeline, or a version history separate from the hub's.

`hs2-terms.html` is generated, not hand-written: **`node hs2-terms.build.mjs`**
splices a pack of Module 1's terminology into `cram-engine/template.html`. It needs
`cram-engine` and `hs2-test1` checked out beside this repo — it reads the engine for
the shell and `hs2-test1`'s glossary for the definitions, so nothing is duplicated by
hand. `hs2-terms.pack.js` is the pack on its own, so
`cram-engine/audit-typed.mjs` can be run against it. Regenerate rather than editing
the HTML.

## Notes

- `<meta name="robots" content="noindex">` keeps the hub out of search
  engines — it's meant to be shared by link. Remove that line if you ever
  want it indexed.
- The hub is a plain static page: no build step, no dependencies, offline-fine.
- Tools live across two accounts (`jeremyspm`, `1999jeremym`); the hub links
  to both. See `PROJECT-BACKLOG.md` in the parent working folder for the
  consolidation to-do.

## For future Claude sessions

When a new tool is built for Jeremy: publish it as its own `jeremyspm` repo
with Pages, then add its PROJECTS entry here and push. Keep names short,
descriptions one line, and put study tools in `cram` unless they're clearly a
simulator (`sim`), clinical/career (`clin`), a meta-tool (`tool`), or
non-nursing (`life`).
