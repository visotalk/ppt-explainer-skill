import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {Explanation} from './Composition';
import type {Timeline} from './types';

function App({timeline}: {timeline: Timeline}) {
  const player = useRef<PlayerRef>(null);
  const [captions, setCaptions] = useState(true);
  const [rate, setRate] = useState(1);
  const key = `slides-explainer:${document.body.dataset.project}`;
  useEffect(() => {
    const current = player.current;
    const save = () => {if (current) localStorage.setItem(key, String(current.getCurrentFrame()));};
    current?.addEventListener('pause', save);
    window.addEventListener('pagehide', save);
    return () => {current?.removeEventListener('pause', save); window.removeEventListener('pagehide', save);};
  }, [key]);
  return <main>
    <header><div><p className="eyebrow">SLIDES EXPLAINER</p><h1>{timeline.title}</h1></div><a href="transcript.md" download>Transcript</a></header>
    <section aria-label="Presentation player">
      <Player ref={player} component={Explanation} inputProps={{timeline, captions, assetBase: 'assets'}} durationInFrames={timeline.durationInFrames}
        compositionWidth={timeline.width} compositionHeight={timeline.height} fps={timeline.fps} controls playbackRate={rate}
        style={{width: '100%', aspectRatio: '16/9'}} acknowledgeRemotionLicense
        initialFrame={Math.max(0, Math.min(timeline.durationInFrames - 1, Number(localStorage.getItem(key)) || 0))}/>
    </section>
    <div className="toolbar"><label><input type="checkbox" checked={captions} onChange={e => setCaptions(e.target.checked)}/> Captions</label>
      <label>Speed <select aria-label="Playback speed" value={rate} onChange={e => setRate(Number(e.target.value))}>{[0.75, 1, 1.25, 1.5, 2].map(v => <option key={v} value={v}>{v}×</option>)}</select></label>
      <span>{(timeline.durationInFrames / timeline.fps).toFixed(1)} seconds</span>
    </div>
    <nav aria-label="Chapters">{timeline.scenes.map((s, i) => <button key={s.id} onClick={() => {player.current?.seekTo(s.from); localStorage.setItem(key, String(s.from));}}><span>{String(i + 1).padStart(2, '0')}</span>{s.title}</button>)}</nav>
    <p className="note">Local synthetic narration · Source-preserving preview · Historical source material retains its original context.</p>
  </main>;
}

fetch('assets/timeline.json').then(r => {if (!r.ok) throw new Error('Cannot load timeline'); return r.json();}).then(timeline => {
  createRoot(document.getElementById('root')!).render(<App timeline={timeline}/>);
}).catch(error => {document.getElementById('root')!.textContent = String(error);});
