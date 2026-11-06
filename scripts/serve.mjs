#!/usr/bin/env node
import http from 'node:http';
import {readFileSync, statSync} from 'node:fs';
import {resolve, join, extname, relative} from 'node:path';

const work = resolve(process.argv[2] || 'works/example');
const root = join(work, 'dist/web');
const port = Number(process.env.PORT || 3000);
const host = process.env.EXPLAINER_BIND_HOST || '0.0.0.0';
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.wav': 'audio/wav', '.ttc': 'font/collection', '.md': 'text/plain; charset=utf-8'};
http.createServer((req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const path = resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (relative(root, path).startsWith('..') || !statSync(path).isFile()) {res.writeHead(404); res.end(); return;}
    res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(readFileSync(path));
  } catch {res.writeHead(404); res.end();}
}).listen(port, host, () => {
  console.log(`Player server listening on ${host}:${port}; serving ${root}`);
  if (process.env.EXPLAINER_PREVIEW_URL) console.log(`Configured preview URL: ${process.env.EXPLAINER_PREVIEW_URL}`);
  else console.log('No public preview URL is configured. A platform port mapping or static hosting endpoint is required for access outside this machine.');
});
