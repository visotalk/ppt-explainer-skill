import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const library = new URL('./library/', import.meta.url);
const script = JSON.parse(readFileSync(new URL('narration.json', library), 'utf8'));

// VisoTalk's standard provider contract. Keep the approved voice and service timings.
export default async function speak({say}) {
  const segment = script.segments.find(item => item.text.includes(say));
  if (!segment) throw new Error('Narration changed. Generate and review its voice before preparing this document.');
  const entries = readFileSync(new URL(`${segment.id}-neural.jsonl`, library), 'utf8').trim().split('\n').map(JSON.parse);
  let heard = entries.flatMap(entry => {
    const characters = [...entry.text.replace(/[^\p{L}\p{N}]/gu, '')];
    return characters.map((w, index) => ({w, t0:(entry.offset + entry.duration * index / characters.length)/1e7, t1:(entry.offset + entry.duration * (index+1)/characters.length)/1e7}));
  });
  let audio = readFileSync(new URL(`${segment.id}-neural.mp3`,library));
  let ext = 'mp3';
  if (segment.text !== say) {
    const clean = say.replace(/[^\p{L}\p{N}]/gu,'');
    const index = heard.map(word=>word.w).join('').indexOf(clean);
    if (index < 0) throw new Error('Cannot align the requested sentence');
    heard = heard.slice(index,index+[...clean].length);
    const start = Math.max(0,heard[0].t0 - 0.06);
    const duration = heard.at(-1).t1 + 0.08 - start;
    audio = execFileSync('ffmpeg',['-v','error','-ss',String(start),'-i',fileURLToPath(new URL(`${segment.id}-neural.mp3`,library)),'-t',String(duration),'-f','wav','pipe:1'],{maxBuffer:20*1024*1024});
    ext = 'wav';
    heard = heard.map(word=>({...word,t0:word.t0-start,t1:word.t1-start}));
  }
  let cursor = 0;
  let last = 0;
  const words = [...say.matchAll(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[^\s\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu)].map(match => {
    const w = match[0].replace(/[^\p{L}\p{N}]/gu, '');
    if (!w) return {w:'',t0:last,t1:last};
    const word = heard[cursor++];
    if (!word || word.w !== w) throw new Error(`Voice alignment mismatch at ${w}`);
    last = word.t1;
    return word;
  });
  return {audio,ext,words};
}
