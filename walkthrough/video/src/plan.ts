/* What is on screen while each line is said. A segment shows `shot` from line `line` of its scene (plus `at` × that line's
   length). zoom: 'box' eases the camera onto the shot's zoom box (shots.json), 'none' back out, 'keep' holds it.
   click: the cursor travels to the shot's click box and clicks just before the next segment starts. */
export type Zoom = 'box' | 'none' | 'keep';
export type Seg = {shot: string; line: number; at?: number; zoom: Zoom; click?: boolean; xf?: number};

export const LABELS: Record<string, string> = {
  hub: 'The study tools page', tabs: 'The tabs', write: 'Write · HS2 and Pharm', inp: 'Write · INP',
  cards: 'Flashcards', rep: 'Rep questions', mock: 'Mock and Listen', close: 'Each day',
};

const typing = (prefix: string, n: number, line: number, from: number, step: number, clickLast: boolean): Seg[] =>
  Array.from({length: n}, (_, i) => ({shot: `${prefix}${i + 1}`, line, at: from + i * step, zoom: 'keep' as Zoom, xf: 0.08,
    click: clickLast && i === n - 1}));

export const PLAN: Record<string, Seg[]> = {
  hub: [{shot: 'hub', line: 0, zoom: 'none', click: true}],
  tabs: [
    {shot: 'inp-tabs', line: 0, zoom: 'none'},
    {shot: 'inp-tabs', line: 1, zoom: 'box'},
    {shot: 'hs2-tabs', line: 2, zoom: 'box'},
    {shot: 'hs2-tabs', line: 3, zoom: 'none'},
  ],
  write: [
    {shot: 'hs2-tabs', line: 0, zoom: 'keep', click: true},
    {shot: 'w-home', line: 1, zoom: 'none', click: true},
    {shot: 'w-read', line: 4, zoom: 'none'},
    {shot: 'w-read', line: 5, zoom: 'box'},
    {shot: 'w-read', line: 6, zoom: 'none', click: true},
    {shot: 'w-hide0', line: 7, zoom: 'box'},
    ...typing('w-hide', 4, 8, 0.12, 0.17, true),
    {shot: 'w-checked', line: 9, zoom: 'keep'},
    {shot: 'w-checked', line: 10, zoom: 'none'},
    {shot: 'w-home', line: 11, zoom: 'box'},
  ],
  inp: [
    {shot: 'i-tab', line: 0, zoom: 'none', click: true},
    {shot: 'i-list', line: 2, zoom: 'none', click: true},
    {shot: 'i-read', line: 3, zoom: 'none', click: true},
    {shot: 'i-write0', line: 3, at: 0.62, zoom: 'box'},
    ...typing('i-write', 5, 4, 0.08, 0.15, true),
    {shot: 'i-marked', line: 5, zoom: 'none'},
  ],
  cards: [
    {shot: 'c-tab', line: 0, zoom: 'none', click: true},
    {shot: 'c-decks', line: 1, zoom: 'none', click: true},
    {shot: 'c-front', line: 2, zoom: 'none', click: true},
    {shot: 'c-back', line: 3, zoom: 'box'},
    {shot: 'c-back', line: 4, zoom: 'keep', click: true},
    {shot: 'c-next', line: 5, zoom: 'none'},
    {shot: 'c-decks', line: 5, at: 0.45, zoom: 'none'},
  ],
  rep: [
    {shot: 'r-tab', line: 0, zoom: 'none', click: true},
    {shot: 'r-menu', line: 1, zoom: 'none', click: true},
    {shot: 'r-q', line: 2, zoom: 'none', click: true},
    {shot: 'r-picked', line: 2, at: 0.5, zoom: 'none', click: true},
    {shot: 'r-checked', line: 3, zoom: 'none'},
    {shot: 'r-misses', line: 4, zoom: 'box'},
  ],
  mock: [
    {shot: 'm-tab', line: 0, zoom: 'none', click: true},
    {shot: 'm-menu', line: 1, zoom: 'box'},
    {shot: 'l-tab', line: 2, zoom: 'none', click: true},
    {shot: 'l-pod', line: 2, at: 0.5, zoom: 'none'},
  ],
  close: [{shot: 'end', line: 0, zoom: 'none'}],
};
