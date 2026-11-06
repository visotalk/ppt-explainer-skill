# Initial MVP execution results

The initial local pipeline is implemented. The current delivery preference is **web player only**. `run` does not export MP4 unless `--video` is supplied. A video renderer remains available for an explicit future request.

## Verified in the current instance

- Pinned JavaScript/Python dependency installation and repeatable local-tool setup.
- Four passing contract tests, TypeScript checks, shell syntax, Python compilation, and Git whitespace checks.
- CNCF Overview: rendered and extracted pages 3–5 of 50; authored three source-mapped Chinese narration segments; generated 62.33 seconds of local voice audio and a chaptered player.
- MotionHub Lab Notebook 1.1.1: pinned catalogue commit `089856853d42100106bbf59ee7548e567d2528af`, recorded declarative-file hashes and credits; adapted palette/grid while retaining source-page images.
- MJN PDF summary: extracted its single page and produced a two-scene, 31.90-second English narrated player.
- MJN Stock Pitch: rendered/extracted page 4 of 82 and recovered its native chart categories and numerical series.
- How Good Is Our Code?: rendered/extracted pages 1 and 4 of 55.
- Functional Chromium checks on the authored Chinese and English players: actual narration audio advancement, play/pause, chapters, caption controls, speed selection, position restoration, loaded images, and mobile horizontal overflow.
- The default one-command PDF smoke run generated a player without creating an MP4.

Earlier video export was exercised before the user changed the delivery preference. The subsequent render was stopped, its interrupted MP4 removed, and the current Chinese project was verified as web-only. No further video export is part of the default iteration loop.

## Current instance artifacts

These are workspace locations, not externally accessible URLs or repository fixtures:

- `/workspace/works/cncf-explainer/`: primary Chinese player and editable work.
- `/workspace/works/mjn-pdf-explainer/`: English PDF-derived player and editable work.
- `/workspace/works/mjn-chart-eval/`: financial chart extraction evidence.
- `/workspace/works/code-quality-eval/`: second Chinese extraction evidence.
- `/workspace/works/web-default-smoke/`: default web-only smoke-run evidence.

## External preview blocker

The Chinese player is served locally on port 3000. The built-in command `sites-preview start /workspace/works/cncf-explainer`, with a valid `.openai/hosting.json` static directory manifest, fails with:

```text
sites-preview: preview relay unavailable: No such file or directory (os error 2)
```

The platform preview relay must be made available, or an authorized hosting destination supplied, before an externally accessible player URL can be delivered. A local server or an invented loopback link does not satisfy that requirement. No site was published to an external hosting service.

## Practical limits

This is a source-page-based MVP with basic progressive reveals and optional focus rectangles. Voice quality is a local synthetic baseline. OCR, high-quality cloud voices, native MotionHub components, chart redraw, music/SFX, and partial video rerendering are not implemented. Source provenance is checked structurally; human factual and editorial review remains necessary. The observed setup and outputs have not been independently restored and tested in a new environment.
