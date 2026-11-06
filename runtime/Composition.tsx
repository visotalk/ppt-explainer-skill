import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, useCurrentFrame, staticFile} from 'remotion';
import type {Timeline, Scene} from './types';

export function Explanation({timeline, captions = true, assetBase}: {timeline: Timeline; captions?: boolean; assetBase: string}) {
  const url = (path: string) => assetBase ? `${assetBase.replace(/\/$/, '')}/${path}` : staticFile(path);
  return <AbsoluteFill style={{backgroundColor: timeline.theme.background, color: timeline.theme.ink, fontFamily: 'Explainer Sans, Noto Sans CJK SC, sans-serif'}}>
    {timeline.scenes.map(scene => <Sequence key={scene.id} from={scene.from} durationInFrames={scene.duration}>
      <SceneView scene={scene} timeline={timeline} captions={captions} url={url}/>
    </Sequence>)}
  </AbsoluteFill>;
}

function SceneView({scene, timeline, captions, url}: {scene: Scene; timeline: Timeline; captions: boolean; url: (path: string) => string}) {
  const frame = useCurrentFrame();
  const theme = timeline.theme;
  const cue = scene.cues.find(c => frame >= c.from && frame < c.from + c.duration);
  const activePoint = Math.min(scene.points.length - 1, Math.floor(frame / Math.max(1, scene.duration / Math.max(scene.points.length, 1))));
  const boxWidth = scene.points.length ? 1180 : 1776;
  const imageAspect = scene.imageAspect || 16 / 9;
  const imageWidth = Math.min(boxWidth, 582 * imageAspect);
  const imageHeight = imageWidth / imageAspect;
  return <AbsoluteFill style={{padding: '56px 72px', backgroundImage: theme.grid ? 'linear-gradient(#cbd5e130 1px,transparent 1px),linear-gradient(90deg,#cbd5e130 1px,transparent 1px)' : undefined, backgroundSize: '40px 40px'}}>
    <div style={{position: 'absolute', top: 0, left: 0, height: 7, width: '100%', background: theme.accent}}/>
    <div style={{fontSize: 22, color: theme.muted, height: 34, display: 'flex', justifyContent: 'space-between'}}>
      <span>{timeline.title}</span><span>{timeline.language === 'zh-CN' ? '原稿' : 'Source'} {scene.sourcePages.join(', ')} · {theme.name}</span>
    </div>
    <h1 data-fit style={{fontSize: scene.title.length > 26 ? 47 : 60, lineHeight: 1.22, margin: '20px 0 34px', height: 148, display: 'flex', alignItems: 'center'}}>{scene.title}</h1>
    <div style={{display: 'flex', gap: 44, height: 582, alignItems: 'center'}}>
      <div style={{position: 'relative', width: boxWidth, flexShrink: 0, height: 582, background: theme.panel, border: '1px solid #94a3b84d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={url(scene.image)} style={{width: '100%', height: '100%', objectFit: 'contain'}}/>
        {scene.focus && frame > 24 && <div style={{position: 'absolute', left: (boxWidth - imageWidth) / 2 + scene.focus.x * imageWidth, top: (582 - imageHeight) / 2 + scene.focus.y * imageHeight, width: scene.focus.width * imageWidth, height: scene.focus.height * imageHeight, border: `5px solid ${theme.accent}`, boxSizing: 'border-box', opacity: interpolate(frame, [24, 40], [0, 1], {extrapolateRight: 'clamp'})}}/>}
      </div>
      {!!scene.points.length && <div style={{flex: 1, alignSelf: 'center'}}>{scene.points.map((point, i) => {
        const p = i === 0 ? 1 : interpolate(frame, [i * scene.duration / scene.points.length, i * scene.duration / scene.points.length + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return <div key={i} data-fit style={{fontSize: point.length > 36 ? 31 : 36, lineHeight: 1.55, marginBottom: 30, paddingLeft: 22, borderLeft: `4px solid ${i === activePoint ? theme.accent : 'transparent'}`, opacity: p, transform: `translateY(${(1 - p) * 9}px)`}}>{point}</div>;
      })}</div>}
    </div>
    {captions && cue && <div style={{position: 'absolute', left: 130, right: 130, bottom: 48, display: 'flex', justifyContent: 'center'}}>
      <div data-fit style={{fontSize: 34, lineHeight: 1.5, background: theme.panel, borderTop: `3px solid ${theme.accent}`, padding: '12px 28px', maxWidth: 1600, textAlign: 'center'}}>{cue.text}</div>
    </div>}
    {scene.cues.map((c, i) => <Sequence key={i} from={c.from} durationInFrames={c.duration}><Audio src={url(c.audio)}/></Sequence>)}
  </AbsoluteFill>;
}
