import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Walkthrough} from './Video';
import {FPS, TOTAL} from './timeline';

const Root: React.FC = () =>
  React.createElement(Composition, {id: 'Walkthrough', component: Walkthrough, durationInFrames: Math.ceil(TOTAL * FPS),
    fps: FPS, width: 1920, height: 1080});

registerRoot(Root);
