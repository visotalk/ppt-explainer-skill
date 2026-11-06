import Ajv from 'ajv';
import {join} from 'node:path';
import {ROOT, read} from './common.mjs';

const validate = new Ajv({allErrors: true}).compile(read(join(ROOT, 'schemas/narration.schema.json')));
export function validateNarration(narration, document) {
  if (!validate(narration)) throw new Error(JSON.stringify(validate.errors, null, 2));
  const ids = new Set();
  for (const segment of narration.segments) {
    if (ids.has(segment.id)) throw new Error(`Duplicate segment ID: ${segment.id}`);
    ids.add(segment.id);
    for (const page of segment.sourcePages) if (!document.pages.some(p => p.number === page)) throw new Error(`Source page ${page} was not extracted`);
    if (segment.focus && (segment.focus.x + segment.focus.width > 1 || segment.focus.y + segment.focus.height > 1)) throw new Error(`Focus exceeds page bounds: ${segment.id}`);
    if (segment.captionChunks && segment.captionChunks.join('').replace(/\s/g, '') !== segment.text.replace(/\s/g, '')) throw new Error(`Caption chunks must reproduce narration text: ${segment.id}`);
    if ((segment.audio || segment.voiceText) && Array.from(segment.text).length > 70) throw new Error(`Supplied audio or voiceText needs a short segment (≤70 characters) until forced alignment is implemented: ${segment.id}`);
  }
}
