# Slides Explainer Skill

Turn existing PowerPoint and PDF presentations into narrated, animated explainers delivered as video, interactive web experiences, or both.

**Project name:** `slides-explainer-skill`

**Planned skill invocation:** `slides-explainer`

An initial functional MVP is implemented: PPTX/PDF ingestion, source-grounded narration files, local TTS, source-page animation, phrase captions, a chaptered web player, and H.264 MP4 export. MotionHub support currently adapts palette/grid tokens; it does not yet reuse native motion components. See the [current setup and limitations](references/quickstart.md).

The repository directory still uses its earlier name, `ppt-motion-skill`; this implementation does not rename the checkout or remote repository.

Read the [product and technical design](docs/product-and-technical-design.md) for goals, user scenarios, workflow, architecture, project structure, output formats, and the evaluation plan.

## Getting started

Install the prerequisites and run the environment check using the [quickstart](references/quickstart.md). In an agent, start from [SKILL.md](SKILL.md).

```bash
npm ci
node scripts/explainer.mjs doctor
node scripts/explainer.mjs ingest --input /path/to/deck.pptx --work /workspace/works/demo --pages 1-3
# Author /workspace/works/demo/story/narration.json, then:
node scripts/explainer.mjs prepare --work /workspace/works/demo
node scripts/explainer.mjs build --work /workspace/works/demo
node scripts/check-web.mjs /workspace/works/demo
node scripts/explainer.mjs verify --work /workspace/works/demo
node scripts/serve.mjs /workspace/works/demo
```

Web player delivery is the default. MP4 export runs only when explicitly requested (`render` or `run --video`). Outputs are under the work project's `dist/`. The server listens on port 3000; an environment preview mapping or hosting endpoint is required for a shareable URL. Source materials are processed locally; no cloud voice credentials are needed for the preview-quality eSpeak narration. Source and third-party asset rights must be respected.

## Development checks

```bash
npm run check
npm test
git diff --check
```

The [evaluation material manifest](evals/materials.json) records public source links and representative page selections. Third-party decks and generated works are not committed.
