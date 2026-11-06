import test from 'node:test';
import assert from 'node:assert/strict';
import {validateNarration} from '../scripts/validate.mjs';
import {captionTime, assetPath, parsePages} from '../scripts/common.mjs';

const source = {pages: [{number: 3}]};
const script = () => ({schemaVersion: 1, language: 'zh-CN', title: 'Example', segments: [{id: 'intro', sourcePages: [3], title: 'Title', text: '原稿事实。', points: ['事实']}]});
test('accepts a grounded narration and rejects unknown pages or duplicate IDs', () => {
  validateNarration(script(), source);
  const wrongPage = script(); wrongPage.segments[0].sourcePages = [4];
  assert.throws(() => validateNarration(wrongPage, source), /not extracted/);
  const duplicate = script(); duplicate.segments.push({...duplicate.segments[0]});
  assert.throws(() => validateNarration(duplicate, source), /Duplicate/);
});
test('rejects caption text drift, unsafe IDs and off-page highlights', () => {
  const drift = script(); drift.segments[0].captionChunks = ['虚构'];
  assert.throws(() => validateNarration(drift, source), /reproduce/);
  const unsafe = script(); unsafe.segments[0].id = '../outside';
  assert.throws(() => validateNarration(unsafe, source), /pattern/);
  const focus = script(); focus.segments[0].focus = {x: 0.9, y: 0, width: 0.2, height: 1};
  assert.throws(() => validateNarration(focus, source), /bounds/);
});
test('caption timestamps retain millisecond and hour boundaries', () => {
  assert.equal(captionTime(108000, 30), '01:00:00.000');
  assert.equal(captionTime(1, 30, ','), '00:00:00,033');
  assert.equal(captionTime(1799, 30), '00:00:59.967');
});
test('asset references cannot escape the project and page selections are bounded', () => {
  assert.throws(() => assetPath('/workspace/work', '../secret'), /inside/);
  assert.throws(() => assetPath('/workspace/work', '/etc/passwd'), /inside/);
  assert.deepEqual(parsePages('1,3-4,3', 4), [1, 3, 4]);
  assert.throws(() => parsePages('0-3', 4), /outside/);
  assert.throws(() => parsePages('3-2', 4), /outside/);
});
