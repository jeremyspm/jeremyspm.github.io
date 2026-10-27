# Study tools walkthrough (video)

A 2 min 33 s walkthrough of the exam tools for the cohort: the hub, then Write, Flashcards, Rep questions, Mock and
Listen, and a daily routine. 1080p, light mode, voiced by Kokoro (`af_heart`, the HS2 podcast's voice), with quiet click
and typing sounds. Made 27 Oct 2026. **Not linked from the hub** (his call); the MP4s are not in git.

Everything is on screen as it really is: the live site, recorded by Playwright, not mocked up.

## Re-render it

```
python walkthrough/voice.py      # narration.json -> video/public/audio/*.wav + video/src/timing.json (cached by text)
python walkthrough/capture.py    # the live site, light mode -> video/public/shots/*.png + video/src/shots.json
python walkthrough/sfx.py        # synthesises video/public/sfx/click.wav and typing.wav
cd walkthrough/video && npm install && npm run render   # -> video/out/walkthrough.mp4
```

Skip `capture.py` to re-render exactly what was made on 27 Oct: the committed shots are that capture. Run it again only
when the site has changed and the video should show the new site. `npx remotion studio src/index.ts` previews it.

`python walkthrough/check_voice.py` transcribes every voiced line back with faster-whisper and prints the ones that
differ from the script (homophones such as Pharm/farm and Mock/MOC are expected; anything else is a mispronunciation).

## How it is put together

| file | role |
|---|---|
| `narration.json` | the words, one line each, grouped by scene; `script.md` is the approved, readable copy |
| `voice.py` | Kokoro, one WAV per line; `SAY` maps BN2, HS2 and INP to how they should be said |
| `capture.py` | Playwright on the installed Chrome (`channel='chrome'`), 1120x630 at 2x; seeds `Math.random` so the sims deal the same questions; sets each tool's theme key to light (`hub.theme`, `inpf.theme`, `hs2f.theme`, `hs2pod-theme`) |
| `video/src/plan.ts` | what is on screen during each line: the shot, zoom onto its box or back out, and whether the cursor clicks |
| `video/src/timeline.ts` | turns line lengths and the plan into absolute times |
| `video/src/Video.tsx` | the edit: one continuous camera (zooms ease between shots), the cursor and its clicks, captions, section labels, title and closing cards, sound |
| `explore.py` | a helper for finding a page's buttons and selectors (screenshots go to `explore/`, ignored) |

Remotion 4.0.534 renders it (it brings its own ffmpeg and headless Chrome).
