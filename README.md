# Slides Explainer Skill

Turn existing PowerPoint and PDF presentations into narrated, animated explainers delivered as video, interactive web experiences, or both.

**Project name:** `slides-explainer-skill`

**Planned skill invocation:** `slides-explainer`

The current production workflow uses **standard VisoTalk** for narration, word-anchored animation, QA and player delivery. The migrated Chinese data-report example is in [examples/mjn-visotalk](examples/mjn-visotalk). See the [VisoTalk workflow](references/visotalk-workflow.md) for setup and reproduction.

The earlier source-page Remotion MVP remains in this repository as historical implementation material.

Read the [product and technical design](docs/product-and-technical-design.md) for goals, user scenarios, workflow, architecture, project structure, output formats, and the evaluation plan.

## Getting started

Follow the [VisoTalk workflow](references/visotalk-workflow.md). For the included example:

```powershell
npx --yes visotalk@latest doctor --fix
cd examples/mjn-visotalk
python -m pip install edge-tts==7.3.1
python generate_voice.py
./produce.ps1
npx --yes visotalk@latest play doc.tsx --port 3096
```

Web player delivery is the default. MP4 export is explicit through `visotalk render`. The example uses Microsoft's online Yunxi voice service to generate local clips. Generated audio, source PDFs and build artifacts are not committed.

## Development checks

```bash
npm run check
npm test
git diff --check
```

The [evaluation material manifest](evals/materials.json) records public source links and representative page selections. Third-party decks and generated works are not committed.
