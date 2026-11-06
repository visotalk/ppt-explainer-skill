import {spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {resolve, dirname, join, isAbsolute, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const LOCAL = process.env.EXPLAINER_TOOLS || '/workspace/.local/slides-explainer';
export function tool(name) {
  const overrides = {soffice: 'SOFFICE_BIN', 'espeak-ng': 'ESPEAK_BIN'};
  if (process.env[overrides[name]]) return process.env[overrides[name]];
  const local = name === 'soffice' ? join(LOCAL, 'usr/lib/libreoffice/program/soffice') : join(LOCAL, 'usr/bin', name);
  return existsSync(local) ? local : name;
}
export function environment() {
  const env = {...process.env,
    LD_LIBRARY_PATH: [join(LOCAL, 'usr/lib/x86_64-linux-gnu'), join(LOCAL, 'usr/lib/libreoffice/program'), process.env.LD_LIBRARY_PATH].filter(Boolean).join(':'),
    SAL_USE_VCLPLUGIN: 'svp',
    DCONF_PROFILE: '/dev/null',
  };
  if (existsSync(join(LOCAL, 'usr/lib/x86_64-linux-gnu/espeak-ng-data')) && !env.ESPEAK_DATA_PATH) env.ESPEAK_DATA_PATH = join(LOCAL, 'usr/lib/x86_64-linux-gnu/espeak-ng-data');
  return env;
}
export function run(cmd, args, options = {}) {
  const r = spawnSync(cmd, args, {encoding: 'utf8', env: environment(), maxBuffer: 20 * 1024 * 1024, ...options});
  if (r.error || r.status !== 0) throw new Error(`${cmd} failed (${r.status}): ${r.error?.message || r.stderr || r.stdout}`);
  return r.stdout;
}
export const read = p => JSON.parse(readFileSync(p, 'utf8'));
export function write(p, data) {mkdirSync(dirname(p), {recursive: true}); writeFileSync(p, JSON.stringify(data, null, 2) + '\n');}
export function hash(data) {return createHash('sha256').update(data).digest('hex');}
export function assetPath(work, path) {
  const full = resolve(work, path);
  if (isAbsolute(path) || relative(work, full).startsWith('..')) throw new Error(`Asset must stay inside work project: ${path}`);
  return full;
}
export function mediaDuration(path) {
  const value = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path]));
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid audio duration: ${path}`);
  return value;
}
export function parsePages(spec, count) {
  if (!spec) return Array.from({length: Math.min(count, 3)}, (_, i) => i + 1);
  const out = spec.split(',').flatMap(part => {
    if (!/^\d+(-\d+)?$/.test(part)) throw new Error(`Invalid pages: ${spec}`);
    const [start, end = start] = part.split('-').map(Number);
    if (end < start || end > count || start < 1) throw new Error(`Page range outside 1–${count}: ${part}`);
    return Array.from({length: end - start + 1}, (_, i) => start + i);
  });
  return [...new Set(out)];
}
export function captionTime(frames, fps, separator = '.') {
  const ms = Math.round(frames * 1000 / fps);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}${separator}${String(ms % 1000).padStart(3, '0')}`;
}
