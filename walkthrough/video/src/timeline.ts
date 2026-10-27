/* Turns timing.json (each line's voiced length) and the plan into absolute times, in seconds. */
import timing from './timing.json';
import shotsJson from './shots.json';
import {PLAN, Zoom} from './plan';

export const FPS = 30;
export const INTRO = 3.2, OUTRO = 3.4, GAP_LINE = 0.38, GAP_SCENE = 0.9, LEAD = 0.5;
export const PAGE = {w: shotsJson.w, h: shotsJson.h};
type Box = {x: number; y: number; width: number; height: number};
export const SHOTS = shotsJson.shots as Record<string, {click: Box | null; zoom: Box | null}>;

export type Line = {scene: string; text: string; file: string; start: number; end: number};
export type Segment = {shot: string; scene: string; start: number; end: number; zoom: Zoom; click: boolean; xf: number};
export type Scene = {id: string; start: number; end: number};

const lines: Line[] = [], scenes: Scene[] = [], segments: Segment[] = [];
let t = INTRO + LEAD;
for (const s of timing) {
  const sceneStart = t - LEAD, starts: number[] = [], lens: number[] = [];
  for (const l of s.lines) {
    lines.push({scene: s.id, text: l.text, file: l.file, start: t, end: t + l.sec});
    starts.push(t); lens.push(l.sec); t += l.sec + GAP_LINE;
  }
  t += GAP_SCENE - GAP_LINE;
  scenes.push({id: s.id, start: sceneStart, end: t - LEAD});
  for (const [gi, g] of PLAN[s.id].entries()) {
    const st = g.line === 0 && !g.at ? sceneStart : starts[g.line] + (g.at ?? 0) * lens[g.line];
    segments.push({shot: g.shot, scene: s.id, start: st, end: 0, zoom: g.zoom, click: !!g.click, xf: g.xf ?? (gi === 0 ? 0.4 : 0.16)});
  }
}
export const TOTAL = t - LEAD + OUTRO;
segments.forEach((s, i) => { s.end = i + 1 < segments.length ? segments[i + 1].start : TOTAL; });
for (const s of segments) if (!SHOTS[s.shot]) throw new Error('no shot ' + s.shot);

export {lines as LINES, scenes as SCENES, segments as SEGMENTS};
