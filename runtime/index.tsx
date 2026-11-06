import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Explanation} from './Composition';
import type {Timeline} from './types';

const empty: Timeline = {schemaVersion: 1, title: '', language: 'en-US', fps: 30, width: 1920, height: 1080, durationInFrames: 1, scenes: [], theme: {name: '', background: '#fff', panel: '#fff', ink: '#111', muted: '#555', accent: '#2572db', grid: false}};
const Root = () => <Composition id="Explainer" component={Explanation} width={1920} height={1080} fps={30} durationInFrames={1}
  defaultProps={{timeline: empty, assetBase: '', captions: true}}
  calculateMetadata={({props}) => ({durationInFrames: props.timeline.durationInFrames, fps: props.timeline.fps, width: props.timeline.width, height: props.timeline.height})}/>;
registerRoot(Root);
