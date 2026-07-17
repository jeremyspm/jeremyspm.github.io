# Jeremy's Hub

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
