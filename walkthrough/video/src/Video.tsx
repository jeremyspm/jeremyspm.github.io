import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FPS, INTRO, LINES, PAGE, SCENES, SEGMENTS, SHOTS, TOTAL} from './timeline';
import {LABELS} from './plan';

/* layout: the page in a framed screen, a label above it, captions below */
const FW = 1536, FH = 864, FX = 192, FY = 62, S = FW / PAGE.w;
/* light (27 Oct: "everything needs to be redone in light mode"); the dark render used bg #0b0e14, fg #eef1f6, accent #818cf8 */
const C = {bg: '#eef1f6', fg: '#0f172a', muted: '#5b6475', line: 'rgba(15,23,42,0.10)', accent: '#4f46e5',
  dot: 'rgba(15,23,42,.16)', screen: '#ffffff', veil: 'rgba(246,248,251,.97)'};
/* sound: a soft click on every click, light key taps while text is typed, both well under the voice */
const CLICK_VOL = 0.35, TYPING_VOL = 0.22;
const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
const ease = Easing.bezier(0.4, 0, 0.2, 1);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type Cam = {z: number; cx: number; cy: number};
const HOME: Cam = {z: 1, cx: PAGE.w / 2, cy: PAGE.h / 2};
const fit = (c: Cam): Cam => {
  const hw = PAGE.w / 2 / c.z, hh = PAGE.h / 2 / c.z;
  return {z: c.z, cx: clamp(c.cx, hw, PAGE.w - hw), cy: clamp(c.cy, hh, PAGE.h - hh)};
};
/* the hub's pages are one narrow column, so they sit a little closer by default */
const HUB = new Set(['hub', 'inp-tabs', 'hs2-tabs', 'i-tab', 'c-tab', 'r-tab', 'm-tab', 'l-tab', 'end']);
const homeFor = (shot: string): Cam => (HUB.has(shot) ? fit({z: 1.25, cx: PAGE.w / 2, cy: 300}) : HOME);
const boxCam = (shot: string): Cam => {
  const b = SHOTS[shot].zoom;
  if (!b) return homeFor(shot);
  const z = clamp(Math.min((PAGE.w * 0.8) / b.width, (PAGE.h * 0.72) / b.height), 1, 1.6);
  return fit({z, cx: b.x + b.width / 2, cy: b.y + b.height / 2});
};
/* each segment's camera target; 'keep' holds the previous one */
const TARGETS: Cam[] = [];
SEGMENTS.forEach((s, i) => { TARGETS.push(s.zoom === 'box' ? boxCam(s.shot) : s.zoom === 'none' ? homeFor(s.shot) : (TARGETS[i - 1] ?? HOME)); });
const MOVE = 0.75;
const camAt = (t: number): Cam => {
  let i = SEGMENTS.findIndex((s) => t < s.end); if (i < 0) i = SEGMENTS.length - 1;
  const from = TARGETS[i - 1] ?? HOME, to = TARGETS[i], p = ease(clamp((t - SEGMENTS[i].start) / MOVE, 0, 1));
  return {z: from.z + (to.z - from.z) * p, cx: from.cx + (to.cx - from.cx) * p, cy: from.cy + (to.cy - from.cy) * p};
};
const toFrame = (c: Cam, x: number, y: number) => ({x: FW / 2 + (x - c.cx) * S * c.z, y: FH / 2 + (y - c.cy) * S * c.z});

/* the cursor: rests where it last clicked, glides to each click box, clicks just before the cut */
const center = (b: {x: number; y: number; width: number; height: number}) => ({x: b.x + b.width / 2, y: b.y + b.height / 2});
const cursorAt = (t: number) => {
  let rest = {x: PAGE.w * 0.72, y: PAGE.h * 0.8}, click = -1;
  for (const s of SEGMENTS) {
    const b = s.click ? SHOTS[s.shot].click : null;
    if (!b) continue;
    const to = center(b), go = s.end - 1.15, land = s.end - 0.35;
    if (t < go) break;
    if (t < land) { const p = ease((t - go) / (land - go)); return {x: rest.x + (to.x - rest.x) * p, y: rest.y + (to.y - rest.y) * p, click: -1}; }
    rest = to; click = t - (s.end - 0.3);
  }
  return {...rest, click};
};

const Cursor: React.FC<{x: number; y: number; click: number}> = ({x, y, click}) => (
  <>
    {click >= 0 && click < 0.6 && (
      <div style={{position: 'absolute', left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: 26,
        border: `3px solid ${C.accent}`, opacity: 1 - click / 0.6, transform: `scale(${0.4 + click * 1.4})`}} />
    )}
    <svg width="30" height="34" viewBox="0 0 30 34" style={{position: 'absolute', left: x - 4, top: y - 2,
      transform: `scale(${click >= 0 && click < 0.15 ? 0.88 : 1})`, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))'}}>
      <path d="M4 2 L4 26 L10.5 20 L15 30.5 L19.5 28.5 L15 18.5 L24 18.5 Z" fill="#fff" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  </>
);

const Screen: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t), cur = cursorAt(t);
  const tl = toFrame(cam, 0, 0), sc = S * cam.z;
  const live = SEGMENTS.map((s, i) => ({s, i})).filter(({s}) => t >= s.start - s.xf && t < s.end + 0.4);
  const pos = toFrame(cam, cur.x, cur.y);
  return (
    <div style={{position: 'absolute', left: FX, top: FY, width: FW, height: FH, overflow: 'hidden', borderRadius: 14,
      border: `1px solid ${C.line}`, boxShadow: '0 30px 70px -32px rgba(15,23,42,.38)', background: C.screen}}>
      {live.map(({s, i}) => (
        <Img key={i} src={staticFile(`shots/${s.shot}.png`)} style={{position: 'absolute', left: tl.x, top: tl.y,
          width: PAGE.w * sc, height: PAGE.h * sc, opacity: interpolate(t, [s.start - s.xf, s.start], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}} />
      ))}
      <Cursor x={pos.x} y={pos.y} click={cur.click} />
    </div>
  );
};

const fade = (t: number, a: number, b: number, d = 0.25) =>
  interpolate(t, [a, a + d, b - d, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const Caption: React.FC<{t: number}> = ({t}) => {
  const l = LINES.find((x) => t >= x.start - 0.1 && t < x.end + 0.3);
  if (!l) return null;
  return (
    <div style={{position: 'absolute', left: FX, width: FW, top: FY + FH + 26, height: 110, display: 'flex',
      alignItems: 'flex-start', justifyContent: 'center', textAlign: 'center', opacity: fade(t, l.start - 0.1, l.end + 0.3, 0.12)}}>
      <span style={{fontFamily: FONT, fontSize: 36, lineHeight: 1.32, fontWeight: 500, color: C.fg, maxWidth: 1420}}>{l.text}</span>
    </div>
  );
};

const Label: React.FC<{t: number}> = ({t}) => {
  const sc = SCENES.find((s) => t >= s.start && t < s.end) ?? (t >= SCENES[SCENES.length - 1].start ? SCENES[SCENES.length - 1] : null);
  const idx = sc ? SCENES.indexOf(sc) : -1;
  return (
    <div style={{position: 'absolute', left: FX + 4, right: FX + 4, top: 16, height: 34, display: 'flex', alignItems: 'center',
      fontFamily: FONT, opacity: interpolate(t, [INTRO - 0.2, INTRO + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
      <span style={{fontSize: 22, fontWeight: 600, color: C.fg, opacity: sc ? fade(t, sc.start, sc.end + 0.3, 0.3) : 0}}>{sc ? LABELS[sc.id] : ''}</span>
      <span style={{flex: 1}} />
      <span style={{display: 'flex', gap: 8}}>
        {SCENES.map((s, i) => (
          <i key={s.id} style={{width: i === idx ? 26 : 8, height: 8, borderRadius: 4, background: i === idx ? C.accent : C.dot}} />
        ))}
      </span>
    </div>
  );
};

const Title: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: C.bg, alignItems: 'center', justifyContent: 'center', fontFamily: FONT,
    opacity: interpolate(t, [INTRO - 0.6, INTRO], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
    <div style={{textAlign: 'center', transform: `translateY(${interpolate(t, [0, 0.8], [14, 0], {extrapolateRight: 'clamp', easing: ease})}px)`,
      opacity: interpolate(t, [0, 0.6], [0, 1], {extrapolateRight: 'clamp'})}}>
      <div style={{fontSize: 30, fontWeight: 600, color: C.accent, letterSpacing: 1}}>BN2 · Semester 2</div>
      <div style={{fontSize: 92, fontWeight: 700, color: C.fg, margin: '10px 0 14px'}}>Study tools</div>
      <div style={{fontSize: 38, color: C.muted}}>How to use them for the finals</div>
    </div>
  </AbsoluteFill>
);

/* the close: the day's routine over the hub, then the address */
const Routine: React.FC<{t: number}> = ({t}) => {
  const close = SCENES[SCENES.length - 1], ls = LINES.filter((l) => l.scene === 'close');
  if (t < close.start) return null;
  const item = (text: string, at: number, k: number, sub = false) => (
    <div key={k} style={{display: 'flex', alignItems: 'baseline', gap: 22, margin: '18px 0', opacity: interpolate(t, [at, at + 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
      transform: `translateY(${interpolate(t, [at, at + 0.35], [10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease})}px)`}}>
      <span style={{width: 44, fontSize: 34, fontWeight: 700, color: sub ? C.muted : C.accent}}>{sub ? '·' : k}</span>
      <span style={{fontSize: 44, fontWeight: sub ? 400 : 600, color: sub ? C.muted : C.fg}}>{text}</span>
    </div>
  );
  const l0 = ls[0];
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: FX, top: FY, width: FW, height: FH, borderRadius: 14, background: C.veil,
        opacity: interpolate(t, [close.start + 0.2, close.start + 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: 900}}>
          {item('Your Write round', l0.start + 0.6, 1)}
          {item('Flashcards', l0.start + 1.9, 2)}
          {item('Some Rep', l0.start + 2.9, 3)}
          {item('Mock: a few days before', ls[1].start, 4, true)}
          {item('Same device each time', ls[2].start + 1.2, 5, true)}
        </div>
      </div>
      <AbsoluteFill style={{background: C.bg, alignItems: 'center', justifyContent: 'center',
        opacity: interpolate(t, [ls[3].end + 0.4, ls[3].end + 1.0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: 70, fontWeight: 700, color: C.fg}}>jeremyspm.github.io</div>
          <div style={{fontSize: 36, color: C.muted, marginTop: 16}}>Good luck in the finals</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* a click where the cursor clicks; key taps from just before the first typed frame to the last one */
const SFX: {at: number; len: number; file: string; vol: number}[] = [];
SEGMENTS.forEach((s, i) => {
  if (s.click && SHOTS[s.shot].click) SFX.push({at: s.end - 0.3, len: 0.2, file: 'sfx/click.wav', vol: CLICK_VOL});
  const typed = (j: number) => SEGMENTS[j] && SEGMENTS[j].xf === 0.08;
  if (typed(i) && !typed(i - 1)) {
    let k = i; while (typed(k + 1)) k++;
    const from = s.start - 0.55, to = SEGMENTS[k].start;
    SFX.push({at: from, len: to - from, file: 'sfx/typing.wav', vol: TYPING_VOL});
  }
});

export const Walkthrough: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {t >= INTRO - 0.7 && <Screen t={t} />}
      <Label t={t} />
      <Routine t={t} />
      <Caption t={t} />
      {t < INTRO && <Title t={t} />}
      <AbsoluteFill style={{background: '#000', opacity: interpolate(t, [TOTAL - 0.6, TOTAL], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}} />
      {SFX.map((s, i) => (
        <Sequence key={'fx' + i} from={Math.round(s.at * FPS)} durationInFrames={Math.max(1, Math.round(s.len * FPS))}>
          <Audio src={staticFile(s.file)} volume={s.vol} />
        </Sequence>
      ))}
      {LINES.map((l, i) => (
        <Sequence key={i} from={Math.round(l.start * FPS)} durationInFrames={Math.ceil((l.end - l.start) * FPS) + 6}>
          <Audio src={staticFile(l.file)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
