# MVP setup and operation

## Prerequisites

Linux, Node.js 22+, Python 3.11+, FFmpeg/FFprobe, Chromium, LibreOffice Impress, eSpeak NG, and a licensed Chinese-capable font. The current instance was tested with Node 24, Python 3.12, Chromium 155, LibreOffice 25.2, and eSpeak NG 1.52.

```bash
npm ci
python3 -m venv /workspace/.local/slides-explainer-venv
/workspace/.local/slides-explainer-venv/bin/pip install -r requirements.txt
node scripts/explainer.mjs doctor
```

Python uses `python-pptx`, `pypdf`, PDFium, and Pillow. It does not use PyMuPDF. Python dependency versions, including transitive dependencies, are pinned in `requirements.txt`.

On a normal Debian machine, install system prerequisites through the package manager. On a managed machine without system write access, `bash scripts/setup-local.sh` can download signed Debian packages and extract LibreOffice and eSpeak into the workspace. This requires allowed network access to Debian and the package registries; it preserves TLS and package verification. Existing Chromium and FFmpeg are required. The script is specific to Debian amd64 and records the package checksums actually downloaded.

Overrides: `EXPLAINER_PYTHON`, `EXPLAINER_TOOLS`, `SOFFICE_BIN`, `ESPEAK_BIN`, `CHROMIUM_BIN`, and `EXPLAINER_FONT`. No cloud credentials are needed for the local MVP.

## Create a work

Run from the skill root. Use the existing checkout; do not create a worktree unless requested.

```bash
node scripts/explainer.mjs ingest \
  --input /path/to/source.pptx \
  --work /workspace/works/my-explainer \
  --pages 3-5 --language zh-CN
```

Read extracted text and source previews. Author `story/narration.json` before production:

```json
{
  "schemaVersion": 1,
  "language": "zh-CN",
  "title": "作品标题",
  "segments": [
    {
      "id": "intro",
      "sourcePages": [3],
      "title": "本段要解释的内容",
      "text": "这里写经过原稿核验的解说。",
      "points": ["有来源依据的重点"]
    }
  ]
}
```

Both languages `zh-CN` and `en-US` are supported. Multiple segments can reference the same source page. `--pages` accepts comma-separated numbers and inclusive ranges. If omitted, only page 1 is extracted as a preview. Empty/scanned PDF text cannot produce an automatic narrated preview; OCR remains unimplemented.

For supplied audio, copy it inside the work project and set a segment's `audio` to its relative path. Text/caption timing is segment-level for supplied audio. `voiceText` optionally controls TTS pronunciation, also at segment level. Both modes require short segments until forced alignment is added.

## Optional MotionHub adaptation

```bash
node scripts/explainer.mjs motion \
  --work /workspace/works/my-explainer \
  --motion @iamsuosi/lab-notebook \
  --ref 089856853d42100106bbf59ee7548e567d2528af
```

Read the downloaded `MOTION.md` whole before adaptation. The current implementation maps common color tokens, adds a notebook grid for Lab Notebook, and preserves the source slide. It does not reproduce native hand-drawn components or original motion fonts. Attribution and deviations are retained. File hashes establish local integrity and the commit pins the source; no publisher-signed digest verification is claimed.

## Prepare, preview, render, verify

```bash
node scripts/explainer.mjs prepare --work /workspace/works/my-explainer
node scripts/explainer.mjs build --work /workspace/works/my-explainer
node scripts/check-web.mjs /workspace/works/my-explainer
node scripts/explainer.mjs verify --work /workspace/works/my-explainer
node scripts/serve.mjs /workspace/works/my-explainer
```

Web is the default output. `serve.mjs` serves `dist/web` on port 3000 and binds to `0.0.0.0` for platform port mappings. `PORT` and `EXPLAINER_BIND_HOST` override these. Supply `EXPLAINER_PREVIEW_URL` only with a real configured URL; setting it does not create a tunnel or publish anything. A local server alone does not establish external access. `check-web.mjs` starts a temporary local server, exercises Chromium, and closes both. It verifies real audio advancement, play/pause, chapters, captions controls, speed selection, position restoration, loaded images, and mobile horizontal overflow.

When the environment provides the `sites-preview` command, use `sites-preview start <work>` for an accessible platform URL. Build creates `.openai/hosting.json` pointing to `dist/web` and preserves an existing hosting configuration. A `preview relay unavailable` error means the platform relay is missing; a local static server cannot fix that external-access prerequisite.

For an explicitly requested MP4 only: `node scripts/explainer.mjs render --work <work>`. Do not render video on ordinary player revisions.

`verify` checks narration references, timeline continuity, media presence, H.264 dimensions, audio presence, output duration, and full video decoding. It reads existing browser results. It does not assert human factual/visual approval. Read `checks/report.json` and inspect frames and playback.

For an extractive smoke test only, a one-command path is available:

```bash
node scripts/explainer.mjs run --input /path/to/source.pdf \
  --work /workspace/works/pdf-smoke --pages 1 --language en-US
```

Without an authored script, narration is merely truncated source text. This is not an editorially finished explanation. Use `--script /path/to/narration.json` to supply a reviewed narrative. Video is skipped by default; `--video` explicitly enables MP4 export.

## Current delivery and limitations

- `dist/web/`: static React/Remotion player and packaged font/images/audio.
- `dist/video/explainer.mp4`: 1920×1080, 30 fps, H.264 with narration and burned-in captions.
- `dist/captions/<language>.vtt` and `.srt`: phrase-level captions tied to actual synthesized audio.
- `dist/transcript.md`, `credits.md`, `delivery.json`, `poster.png`.
- `checks/frames/`, `player.png`, `browser.json`, `report.json`, `report.md`.

No OCR, chart redraw, cloud TTS, music, SFX, sophisticated scene transitions, branching interaction, or native MotionHub component reuse yet. Text within source previews remains rasterized. Grouped PPTX object transforms are not flattened; rendered source pages are authoritative. Font substitution can affect source rendering. Only referenced source pages are visible in each scene; the first `sourcePages` entry supplies its preview image.

The runtime is 1920×1080 internally and scales as a whole. Focus rectangles use normalized source-image coordinates. Short points and titles are schema-bounded but still require visual review. Web captions can be toggled; an uncaptioned MP4 variant is not yet exposed. Source licensing is the user's responsibility; do not commit or redistribute evaluation files without permission.

Run `npm run check`, `npm test`, and `git diff --check` for code changes, plus an affected real-file flow for pipeline changes. Rendering uses two worker tabs to limit memory usage. Local TTS phrase caching is supported; partial video rerendering is not.
