#!/usr/bin/env node
import http from 'node:http';
import {readFileSync, existsSync, statSync} from 'node:fs';
import {resolve, join, extname, relative} from 'node:path';
import {chromium} from 'playwright-core';
import {read, write} from './common.mjs';

const work = resolve(process.argv[2] || 'works/example');
const root = join(work, 'dist/web');
const timeline = read(join(work, 'composition/timeline.json'));
const types = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.wav': 'audio/wav', '.ttc': 'font/collection'};
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  const path = resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (relative(root, path).startsWith('..') || !existsSync(path) || !statSync(path).isFile()) {res.writeHead(404); res.end(); return;}
  res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
  res.end(readFileSync(path));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_BIN || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']});
  const page = await browser.newPage({viewport: {width: 1440, height: 1100}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => {if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(`http://127.0.0.1:${server.address().port}`, {waitUntil: 'networkidle'});
  await page.getByRole('heading', {name: timeline.title, exact: true}).waitFor();
  await page.evaluate(() => document.fonts.ready);
  const chapterButtons = page.getByRole('navigation', {name: 'Chapters'}).getByRole('button');
  if (await chapterButtons.count() !== timeline.scenes.length) throw new Error('Wrong chapter count');
  const play = page.getByRole('button', {name: 'Play video', exact: true});
  await play.click();
  await page.waitForFunction(() => [...document.querySelectorAll('audio')].some(a => a.src.includes('.wav') && a.readyState >= 2 && a.currentTime > 0 && !a.paused && !a.error), {timeout: 15000});
  const audioState = await page.locator('audio').evaluateAll(items => items.map(a => ({src: a.src, readyState: a.readyState, time: a.currentTime, paused: a.paused, error: a.error?.message})));
  const audioOK = audioState.some(a => a.src.includes('.wav') && a.readyState >= 2 && a.time > 0 && !a.error);
  const pause = page.getByRole('button', {name: 'Pause video', exact: true});
  await pause.click();
  if (!audioOK) throw new Error(`Narration audio did not advance: ${JSON.stringify(audioState)}; browser errors: ${errors}`);
  const checks = [];
  for (let i = 0; i < timeline.scenes.length; i++) {
    await chapterButtons.nth(i).click();
    // Seek slightly into the chapter using keyboard controls would depend on focus; chapter start is sufficient for image loading.
    await page.waitForTimeout(150);
    const bad = await page.locator('img').evaluateAll(items => items.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src));
    if (bad.length) throw new Error(`Missing images: ${bad}`);
    checks.push({chapter: timeline.scenes[i].id, image: 'loaded'});
  }
  await page.getByLabel('Captions', {exact: true}).uncheck();
  await page.getByLabel('Captions', {exact: true}).check();
  await page.getByLabel('Playback speed').selectOption('1.5');
  const remembered = await page.evaluate(() => localStorage.getItem(`slides-explainer:${document.body.dataset.project}`));
  if (Number(remembered) !== timeline.scenes.at(-1).from) throw new Error('Playback position not saved');
  await page.reload({waitUntil: 'networkidle'});
  await page.getByRole('heading', {name: timeline.scenes.at(-1).title, exact: true}).waitFor();
  await page.setViewportSize({width: 390, height: 844});
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new Error('Mobile horizontal overflow');
  await page.setViewportSize({width: 1440, height: 1100});
  await page.screenshot({path: join(work, 'checks/player.png'), fullPage: true});
  if (errors.length) throw new Error(errors.join('\n'));
  const report = {schemaVersion: 1, result: 'passed', chapters: checks, audioPlayback: 'passed', controls: ['play', 'pause', 'chapter seek', 'captions toggle', 'speed', 'restore position', 'mobile width'], errors};
  write(join(work, 'checks/browser.json'), report);
  console.log(JSON.stringify(report));
} finally {await browser?.close(); await new Promise(resolve => server.close(resolve));}
