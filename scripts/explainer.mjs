#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, cpSync, readdirSync, rmSync} from 'node:fs';
import {resolve, join, dirname, extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateNarration} from './validate.mjs';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia, renderStill} from '@remotion/renderer';
import {build as esbuild} from 'esbuild';
import {ROOT, LOCAL, run, tool, read, write, hash, assetPath, mediaDuration, captionTime} from './common.mjs';

const python = process.env.EXPLAINER_PYTHON || (existsSync('/workspace/.local/slides-explainer-venv/bin/python') ? '/workspace/.local/slides-explainer-venv/bin/python' : 'python3');
const browser = process.env.CHROMIUM_BIN || '/usr/bin/chromium';
const {positionals, values: opts} = parseArgs({allowPositionals: true, options: {
  input: {type: 'string'}, work: {type: 'string'}, pages: {type: 'string'}, script: {type: 'string'},
  language: {type: 'string', default: 'zh-CN'}, motion: {type: 'string'}, ref: {type: 'string'},
  width: {type: 'string', default: '1920'}, video: {type: 'boolean', default: false},
}});
const command = positionals[0] || 'help';
const work = resolve(opts.work || 'works/example');
const workFile = p => join(work, p);
const fail = message => {throw new Error(message);};

function doctor() {
  const checks = [
    ['Python extraction', () => run(python, ['-c', 'import pptx,pypdf,pypdfium2,PIL; print("available")'])],
    ['PPTX renderer', () => run(tool('soffice'), ['--headless', '--version'])],
    ['Local voice', () => run(tool('espeak-ng'), ['--version'])],
    ['FFmpeg', () => run('ffmpeg', ['-version']).split('\n')[0]],
    ['FFprobe', () => run('ffprobe', ['-version']).split('\n')[0]],
    ['Chromium', () => run(browser, ['--version'])],
  ];
  let missing = false;
  for (const [name, check] of checks) {
    try {console.log(`OK ${name}: ${check().trim().split('\n')[0]}`);} catch (e) {missing = true; console.log(`MISSING ${name}: ${e.message}`);}
  }
  if (missing) process.exitCode = 1;
}

function ingest() {
  if (!opts.input) fail('--input is required');
  const source = resolve(opts.input);
  const ext = extname(source).toLowerCase();
  if (!['.pptx', '.pdf'].includes(ext)) fail('Only .pptx and .pdf inputs are supported');
  if (Number(opts.width) !== 1920) fail('MVP supports a 1920×1080 composition; player scales it to the viewport.');
  if (existsSync(workFile('project.json'))) fail('Project already exists. Use prepare/build/render for revisions, or choose a new --work directory.');
  for (const p of ['input', 'extracted', 'story', 'design', 'audio/narration', 'audio/music', 'audio/sfx', 'composition', 'checks/frames', 'public', '.cache', 'dist']) mkdirSync(workFile(p), {recursive: true});
  const target = workFile(`input/source${ext}`);
  if (existsSync(target) && hash(readFileSync(target)) !== hash(readFileSync(source))) fail('Refusing to overwrite an existing input.');
  copyFileSync(source, target);
  let reference;
  if (ext === '.pptx') {
    reference = workFile('.cache/source.pdf');
    run(tool('soffice'), [`-env:UserInstallation=${pathToFileURL(workFile('.cache/lo-profile')).href}`, '--headless', '--convert-to', 'pdf:impress_pdf_Export', '--outdir', workFile('.cache'), target], {timeout: 180000});
    if (!existsSync(reference)) fail('LibreOffice did not produce the reference PDF');
  }
  const args = [join(ROOT, 'scripts/ingest.py'), '--source', target, '--work', work, '--pages', opts.pages || '1'];
  if (reference) args.push('--reference-pdf', reference);
  console.log(run(python, args, {timeout: 180000}));
  const doc = read(workFile('extracted/document.json'));
  write(workFile('project.json'), {schemaVersion: 1, id: hash(work).slice(0, 16), title: doc.pages[0].title,
    language: opts.language, source: doc.source, width: Number(opts.width), height: Math.round(Number(opts.width) * 9 / 16), fps: 30,
    state: 'ingested', outputs: opts.video ? ['web', 'video'] : ['web'], limitations: ['Agent-authored narration is recommended; automatic narration is extractive only.', ...doc.warnings]});
  writeFileSync(workFile('story/brief.md'), '# Production brief\n\nSource-grounded explainer. Preserve the historical context of the source. Review narration before distribution.\n');
  console.log(`Ingested ${doc.pages.length}/${doc.source.pageCount} pages into ${work}`);
}

async function fetchMotion() {
  if (!opts.motion || !/^@[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(opts.motion)) fail('Use --motion @scope/slug');
  // Pin a source commit before fetching files; never follow a moving branch independently for each file.
  const ref = opts.ref;
  if (!ref || !/^[a-f0-9]{40}$/.test(ref)) fail('--ref must be the full trusted catalogue commit SHA');
  const dest = workFile(`design/motions/${opts.motion}`);
  mkdirSync(dest, {recursive: true});
  const files = ['motion.json', 'tokens.json', 'MOTION.md', 'CREDITS.md'];
  const checksums = {};
  for (const name of files) {
    const url = `https://raw.githubusercontent.com/motionhub-dev/motions/${ref}/motions/${opts.motion}/${name}`;
    // curl honors the session HTTPS proxy and CA; no executable code is fetched.
    const data = run('curl', ['--fail', '--silent', '--show-error', '--location', '--max-time', '45', url]);
    writeFileSync(join(dest, name), data);
    checksums[name] = hash(data);
  }
  const meta = read(join(dest, 'motion.json'));
  write(workFile('design/direction.json'), {schemaVersion: 1, mode: 'source-preserving', motion: opts.motion, commit: ref,
    version: meta.version, license: meta.license, files: checksums,
    adaptation: 'Palette and notebook grid are adapted; original source page stays intact. Native hand-drawn components and fonts are not implemented.',
    integrity: 'HTTPS retrieval pinned to a Git commit with recorded SHA-256; not verified against a publisher-signed digest.'});
  console.log(`Fetched ${opts.motion}@${meta.version}, pinned to ${ref}`);
}

function chunks(text) {
  const sentences = text.match(/[^。！？.!?\n]+[。！？.!?]?/gu) || [text];
  return sentences.flatMap(sentence => {
    const result = [];
    let rest = sentence.trim();
    const limit = /[\u3400-\u9fff]/u.test(rest) ? 32 : 65;
    while (Array.from(rest).length > limit) {
      const head = Array.from(rest).slice(0, limit).join('');
      const space = head.lastIndexOf(' ');
      const cut = limit === 65 && space > 20 ? space : head.length;
      result.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) result.push(rest);
    return result;
  }).filter(Boolean);
}

function prepare() {
  const project = read(workFile('project.json'));
  const doc = read(workFile('extracted/document.json'));
  const existing = workFile('story/narration.json');
  const narration = opts.script ? read(resolve(opts.script)) : existsSync(existing) ? read(existing) : {
    schemaVersion: 1, language: project.language, title: project.title.slice(0, 70),
    segments: doc.pages.map(page => ({id: `scene-${page.number}`, sourcePages: [page.number], title: page.title.slice(0, 48),
      text: page.text.replace(/\s+/g, ' ').slice(0, 180), points: []})),
  };
  validateNarration(narration, doc);
  // Remove derived outputs so a failed revision cannot be mistaken for the old successful delivery.
  for (const derived of ['dist/web', 'dist/video', 'dist/captions', 'dist/delivery.json', 'dist/poster.png', 'checks/report.json', 'checks/report.md', 'checks/browser.json']) rmSync(workFile(derived), {recursive: true, force: true});
  write(existing, narration);
  const publicDir = workFile('public');
  mkdirSync(publicDir, {recursive: true});
  const font = process.env.EXPLAINER_FONT || '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';
  if (!existsSync(font)) fail('Set EXPLAINER_FONT to a licensed local CJK font');
  copyFileSync(font, join(publicDir, 'font.ttc'));
  const fontLicense = process.env.EXPLAINER_FONT_LICENSE || '/usr/share/doc/fonts-noto-cjk/copyright';
  if (!existsSync(fontLicense)) fail('Set EXPLAINER_FONT_LICENSE to the font license text for redistribution');
  copyFileSync(fontLicense, join(publicDir, 'font-license.txt'));
  const defaultTheme = {name: 'Source preserving', background: '#eef2f6', panel: '#ffffff', ink: '#16243c', muted: '#53627a', accent: '#0075ba', grid: false};
  let theme = defaultTheme;
  if (existsSync(workFile('design/direction.json')) && read(workFile('design/direction.json')).motion) {
    const direction = read(workFile('design/direction.json'));
    const dir = assetPath(work, `design/motions/${direction.motion}`);
    for (const [name, checksum] of Object.entries(direction.files)) if (hash(readFileSync(join(dir, name))) !== checksum) fail(`Motion file changed: ${name}`);
    const tokens = read(join(dir, 'tokens.json'));
    const color = key => tokens.color?.[key]?.$value?.hex;
    theme = {...defaultTheme, name: direction.motion, background: color('bg') || defaultTheme.background,
      panel: color('panel') || defaultTheme.panel, ink: color('text') || defaultTheme.ink,
      muted: color('muted') || defaultTheme.muted, accent: color('grad') || defaultTheme.accent,
      grid: direction.motion.endsWith('/lab-notebook')};
    write(workFile('design/tokens.json'), tokens);
  } else {
    write(workFile('design/direction.json'), {schemaVersion: 1, mode: 'source-preserving', motion: null});
    write(workFile('design/tokens.json'), defaultTheme);
  }
  const fps = project.fps;
  let cursor = 0;
  const scenes = [];
  const cues = [];
  for (const segment of narration.segments) {
    const page = doc.pages.find(p => p.number === segment.sourcePages[0]);
    const image = `page-${page.number}.png`;
    copyFileSync(assetPath(work, page.image), join(publicDir, image));
    let local = 18;
    const localCues = [];
    const captionChunks = segment.captionChunks || chunks(segment.text);
    // Supplied audio is one cue; no invented word-level alignment.
    const parts = segment.audio ? [segment.text] : segment.voiceText ? [segment.text] : captionChunks;
    for (let i = 0; i < parts.length; i++) {
      const text = parts[i];
      const target = workFile(`audio/narration/${segment.id}-${i}.wav`);
      if (segment.audio) {
        run('ffmpeg', ['-v', 'error', '-y', '-i', assetPath(work, segment.audio), '-ac', '1', '-ar', '24000', target]);
      } else {
        const spoken = segment.voiceText || text;
        const voice = narration.language === 'zh-CN' ? 'cmn' : 'en-us';
        const cacheKey = hash(JSON.stringify({spoken, voice, speed: 155, engine: run(tool('espeak-ng'), ['--version']).trim()}));
        const cacheFile = workFile(`.cache/${cacheKey}.wav`);
        if (!existsSync(cacheFile)) {
          const textFile = workFile(`.cache/${cacheKey}.txt`);
          writeFileSync(textFile, spoken);
          run(tool('espeak-ng'), ['-v', voice, '-s', '155', '-w', cacheFile, '-f', textFile]);
        }
        copyFileSync(cacheFile, target);
      }
      const duration = Math.ceil(mediaDuration(target) * fps);
      const audio = `${segment.id}-${i}.wav`;
      copyFileSync(target, join(publicDir, audio));
      localCues.push({from: local, duration, text, audio});
      cues.push({sceneId: segment.id, from: cursor + local, duration, text, audio: `audio/narration/${audio}`});
      local += duration + 5;
    }
    const duration = local + 18;
    scenes.push({id: segment.id, from: cursor, duration, title: segment.title, sourcePages: segment.sourcePages, points: segment.points, image, imageAspect: page.canvas.width / page.canvas.height, cues: localCues, ...(segment.focus ? {focus: segment.focus} : {})});
    cursor += duration;
  }
  const timeline = {schemaVersion: 1, title: narration.title, language: narration.language, fps, width: project.width, height: project.height,
    durationInFrames: cursor, theme, scenes};
  write(workFile('composition/timeline.json'), timeline);
  write(join(publicDir, 'timeline.json'), timeline);
  write(workFile('audio/cues.json'), {schemaVersion: 1, fps, engine: 'espeak-ng or supplied audio', cues});
  write(workFile('story/storyboard.json'), {schemaVersion: 1, scenes: narration.segments.map(s => ({id: s.id, sourcePages: s.sourcePages, action: s.focus ? 'source-focus' : s.points.length ? 'source-and-reveal' : 'source-page', title: s.title, points: s.points}))});
  mkdirSync(workFile('dist/captions'), {recursive: true});
  for (const ext of ['vtt', 'srt']) {
    const separator = ext === 'vtt' ? '.' : ',';
    const text = cues.map((c, i) => `${ext === 'srt' ? `${i + 1}\n` : ''}${captionTime(c.from, fps, separator)} --> ${captionTime(c.from + c.duration, fps, separator)}\n${c.text}\n`).join('\n');
    writeFileSync(workFile(`dist/captions/${narration.language}.${ext}`), (ext === 'vtt' ? 'WEBVTT\n\n' : '') + text);
  }
  writeFileSync(workFile('dist/transcript.md'), `# ${narration.title}\n\n` + narration.segments.map(s => `## ${s.title}\n\nSource pages: ${s.sourcePages.join(', ')}\n\n${s.text}`).join('\n\n'));
  let credits = '# Credits and limitations\n\nOriginal presentation: supplied source file. Rights remain with its owners.\n\nNoto Sans CJK: SIL Open Font License 1.1.\n\nLocal eSpeak NG voice: synthetic preview quality. No cloud TTS or external uploads.\n\nNo music or sound effects in this MVP.\n\n';
  const direction = read(workFile('design/direction.json'));
  if (direction.motion) credits += `MotionHub adaptation: ${direction.motion}, version ${direction.version}, by ${JSON.stringify(read(workFile(`design/motions/${direction.motion}/motion.json`)).authors)}. Text: ${direction.license.text}; code: ${direction.license.code}. https://github.com/motionhub-dev/motions/tree/${direction.commit}/motions/${direction.motion}\n\n${direction.adaptation}\n\n` + readFileSync(workFile(`design/motions/${direction.motion}/CREDITS.md`), 'utf8');
  writeFileSync(workFile('dist/credits.md'), credits);
  write(workFile('project.json'), {...project, title: narration.title, language: narration.language, state: 'prepared'});
  console.log(`Prepared ${scenes.length} scenes, ${(cursor / fps).toFixed(2)} seconds`);
}

const playerCSS = `@font-face{font-family:Explainer Sans;src:url('./assets/font.ttc')}*{box-sizing:border-box}body{margin:0;background:#f3f5f8;color:#18243a;font:16px 'Explainer Sans',sans-serif}main{max-width:1320px;margin:auto;padding:28px}header{display:flex;justify-content:space-between;align-items:center;gap:20px}header h1{font-size:27px;margin:6px 0 24px}.eyebrow{font-size:12px;letter-spacing:.15em;color:#52647c}a{color:#125ea4}section{background:#111;border-radius:8px;overflow:hidden}.toolbar{display:flex;gap:24px;align-items:center;padding:20px 0}select{padding:5px}nav{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}nav button{padding:16px;text-align:left;background:white;border:1px solid #d6dce6;border-radius:6px;font:inherit;cursor:pointer}nav button:hover{border-color:#1765b0}nav span{display:block;font-size:12px;color:#64748b;margin-bottom:8px}.note{font-size:13px;color:#64748b;margin-top:28px}`;

async function buildWeb() {
  const project = read(workFile('project.json'));
  const dest = workFile('dist/web');
  mkdirSync(dest, {recursive: true});
  cpSync(workFile('public'), join(dest, 'assets'), {recursive: true});
  copyFileSync(workFile('dist/transcript.md'), join(dest, 'transcript.md'));
  copyFileSync(workFile('dist/credits.md'), join(dest, 'credits.md'));
  await esbuild({entryPoints: [join(ROOT, 'runtime/player.tsx')], bundle: true, outfile: join(dest, 'app.js'), minify: true, jsx: 'automatic', define: {'process.env.NODE_ENV': '"production"'}});
  writeFileSync(join(dest, 'style.css'), playerCSS);
  writeFileSync(join(dest, 'index.html'), `<!doctype html><html lang="${project.language}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Slides Explainer</title><link rel="stylesheet" href="style.css"></head><body data-project="${project.id}"><div id="root"></div><script src="app.js"></script></body></html>`);
  if (!existsSync(workFile('.openai/hosting.json'))) write(workFile('.openai/hosting.json'), {static: {directory: 'dist/web'}});
  console.log(`Built static player: ${dest}`);
}

async function render() {
  const timeline = read(workFile('composition/timeline.json'));
  const serveUrl = await bundle({entryPoint: join(ROOT, 'runtime/index.tsx'), publicDir: workFile('public'), outDir: workFile('.cache/remotion')});
  const inputProps = {timeline, captions: true, assetBase: ''};
  const base = {serveUrl, inputProps, browserExecutable: browser, chromiumOptions: {disableWebSecurity: false}, timeoutInMilliseconds: 60000};
  const composition = await selectComposition({...base, id: 'Explainer'});
  const fontCSS = '@font-face{font-family:"Explainer Sans";src:url("/public/font.ttc")}';
  mkdirSync(workFile('dist/video'), {recursive: true});
  let last = -1;
  await renderMedia({...base, composition, codec: 'h264', pixelFormat: 'yuv420p', crf: 23, concurrency: 2,
    outputLocation: workFile('dist/video/explainer.mp4'), injectCss: fontCSS,
    onProgress: ({progress}) => {const p = Math.floor(progress * 10); if (p !== last) {last = p; console.log(`Render ${p * 10}%`);}}});
  for (let i = 0; i < timeline.scenes.length; i++) {
    const scene = timeline.scenes[i];
    await renderStill({...base, composition, frame: scene.from + Math.min(50, scene.duration - 1), output: workFile(`checks/frames/${scene.id}.png`), injectCss: fontCSS});
  }
  copyFileSync(workFile(`checks/frames/${timeline.scenes[0].id}.png`), workFile('dist/poster.png'));
  console.log('Rendered MP4 and representative frames');
}

function verify() {
  const timeline = read(workFile('composition/timeline.json'));
  const document = read(workFile('extracted/document.json'));
  validateNarration(read(workFile('story/narration.json')), document);
  let end = 0;
  for (const scene of timeline.scenes) {
    if (scene.from !== end || scene.duration <= 0) fail('Invalid scene continuity');
    end += scene.duration;
    for (const cue of scene.cues) {
      if (cue.from < 0 || cue.duration <= 0 || cue.from + cue.duration > scene.duration) fail('Audio outside scene');
      if (!existsSync(workFile(`public/${cue.audio}`))) fail(`Missing audio: ${cue.audio}`);
    }
  }
  if (end !== timeline.durationInFrames) fail('Timeline duration mismatch');
  let video = null;
  if (existsSync(workFile('dist/video/explainer.mp4'))) {
    video = JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', workFile('dist/video/explainer.mp4')]));
    const stream = video.streams.find(s => s.codec_type === 'video');
    if (!stream || stream.codec_name !== 'h264' || stream.width !== timeline.width || stream.height !== timeline.height) fail('Unexpected video format');
    if (!video.streams.some(s => s.codec_type === 'audio')) fail('Narrated output has no audio');
    if (Math.abs(Number(video.format.duration) - end / timeline.fps) > 0.2) fail('Video duration mismatch');
    run('ffmpeg', ['-v', 'error', '-i', workFile('dist/video/explainer.mp4'), '-f', 'null', '-']);
  }
  const outputs = {web: existsSync(workFile('dist/web/index.html')) ? 'generated' : 'not-generated', video: video ? 'generated' : 'not-generated'};
  const browserReport = existsSync(workFile('checks/browser.json')) ? read(workFile('checks/browser.json')) : null;
  const report = {schemaVersion: 1, structural: 'passed', video: video ? 'passed' : 'unrun', browser: browserReport?.result || 'unrun', factualReview: 'manual-required', visualReview: 'manual-required', outputs,
    limitations: [...document.warnings, 'Source-page composition with basic progressive reveal; no chart reconstruction, OCR, music, or SFX.', 'Local synthetic voice is a functional baseline, not production-quality narration.']};
  write(workFile('checks/report.json'), report);
  writeFileSync(workFile('checks/report.md'), '# Validation report\n\n' + Object.entries(report).map(([k, v]) => `- **${k}:** ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n') + '\n');
  const files = [];
  function walk(dir) {for (const entry of readdirSync(dir, {withFileTypes: true})) {const path = join(dir, entry.name); if (entry.isDirectory()) walk(path); else if (entry.name !== 'delivery.json') files.push({path: path.slice(workFile('dist').length + 1), sha256: hash(readFileSync(path))});}}
  walk(workFile('dist'));
  write(workFile('dist/delivery.json'), {schemaVersion: 1, title: timeline.title, width: timeline.width, height: timeline.height, fps: timeline.fps, durationInFrames: end, outputs, checks: report, files});
  console.log(JSON.stringify({structural: 'passed', video: report.video, outputs}));
}

try {
  if (command === 'doctor') doctor();
  else if (command === 'ingest') ingest();
  else if (command === 'motion') await fetchMotion();
  else if (command === 'prepare') prepare();
  else if (command === 'build') await buildWeb();
  else if (command === 'render') await render();
  else if (command === 'verify') verify();
  else if (command === 'run') {ingest(); if (opts.motion) await fetchMotion(); prepare(); await buildWeb(); if (opts.video) await render(); verify();}
  else console.log('Commands: doctor | ingest | motion | prepare | build | render | verify | run\nOptions: --input file.pptx|file.pdf --work directory --pages 1,3-5 --script narration.json --motion @scope/slug --ref full-commit-sha --video\nDefault delivery is the web player. Video export is explicit only.');
} catch (error) {console.error(error.stack || error.message); process.exitCode = 1;}
