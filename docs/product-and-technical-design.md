# Slides Explainer Skill: Product and Technical Design

**Status:** Design proposal, v0.1

**Project:** `slides-explainer-skill`

**Skill invocation:** `slides-explainer`

This document records the agreed product scope and working conventions, and proposes an implementation architecture. It describes intended capabilities, not an already implemented system. Exact dependency versions, service providers, schemas, and performance targets remain subject to implementation and evaluation.

## 1. Product overview

Slides Explainer Skill transforms an existing presentation into a self-contained explanation that an audience can understand without its original presenter being present.

The user supplies a `.pptx` or `.pdf` file. The skill interprets its content, visual style, and supporting assets; develops a narration and storyboard; adds explanatory animation and appropriate sound; and produces a video, an interactive web player experience, or both.

The original material is the source of truth. Its information, brand identity, and useful visual assets guide the result. The presentation can be reorganized for viewing and listening, with every substantive claim traceable to its source or explicitly supplied user context.

MotionHub provides optional, selectable visual and motion systems. Remotion provides the proposed React-based composition and video-rendering foundation.

### Product promise

> Give the skill an existing presentation, and receive an editable, source-grounded explanation that people can watch independently, navigate by chapter, and share as a web experience or video.

## 2. Goals and scope

### Primary goals

- Preserve factual accuracy and the recognizable identity of the source material.
- Turn presenter-dependent slides into a coherent explanation for independent viewing.
- Use animation to explain relationships, processes, comparisons, and changes.
- Let users preview and select suitable MotionHub motions.
- Coordinate narration, visuals, captions, music, and sound effects.
- Support targeted revisions without rebuilding every creative decision.
- Deliver reproducible outputs with documented sources and validation results.

### Initial supported inputs

| Input | Planned handling |
| --- | --- |
| `.pptx` | Extract structured content and assets, and render reference pages for visual comparison. |
| `.pdf` | Combine text and layout extraction with page rendering; use OCR when the document is scanned or text extraction is insufficient. |

Legacy `.ppt` files and direct Google Slides links are outside the initial scope. Google Slides users must first export a PPTX or PDF. The skill does not require or produce a native Google Slides file format.

### Initial outputs

- A static web player application with packaged assets.
- An MP4 video when video export is requested.
- Captions, a transcript, a poster image, attribution records, and a delivery manifest for the requested outputs.
- An editable project containing source references, narration, storyboard, timeline, and composition code.

### Outside the initial scope

- Creating a complete presentation from an empty brief.
- Exporting editable PPTX files or preserving PowerPoint animation behavior.
- Direct Google account integration or presentation editing in Google Slides.
- Arbitrary branching narratives, conversational avatars, or live question answering.
- Perfect recovery of editable chart data from flattened images or PDFs.
- Voice cloning or impersonation.
- A hosted account, storage, collaboration, or publishing service.

## 3. Users and scenarios

The primary users are professionals who already have presentation materials and want to communicate them asynchronously.

| Scenario | Existing material | Intended experience | Main success condition |
| --- | --- | --- | --- |
| Product introduction | Product slides, UI screenshots, feature comparisons | A narrated product explainer or a demonstration led by music and sound effects | Viewers understand the product's purpose and key benefits without invented capabilities. |
| Project proposal | Problem statement, options, implementation plan, resource request | A structured explanation of the proposal and decision required | Viewers understand the reasoning, tradeoffs, dependencies, and requested action. |
| Work report | Progress, metrics, milestones, risks | A concise update with chapter navigation | Achievements, problems, and next steps remain accurate and easy to find. |
| Internal training | Process slides, technical explanations, operating instructions | A reusable guided lesson | The explanation is clear enough to follow without the original presenter. |
| Investment or business analysis | Financial tables, charts, assumptions, recommendations | A source-grounded analytical explainer | Units, dates, uncertainty, and the distinction between evidence and recommendation survive adaptation. |

Product introductions and internal proposal explanations are the recommended first implementation targets. Dense financial and technical documents provide useful stress tests.

## 4. Experience principles

### Explain the material

The production unit is an explanatory scene, not necessarily one slide. One source page may become several scenes; several pages may support a single scene. The original page order is useful evidence, not a mandatory video edit.

### Preserve information and provenance

Keep numbers, units, dates, qualifications, and relationships accurate. Historical material must retain its historical context. Do not invent missing data, benefits, causal relationships, or product behavior. Flag ambiguities that materially affect the explanation.

Each narration segment and scene must reference source pages, extracted object IDs, or user-supplied context. The system should distinguish source facts from proposed explanatory language and optional editorial suggestions.

### Respect the original visual identity

Use the original palette, typography, logos, screenshots, and diagrams where useful. Recomposition should improve legibility and explanation. Do not stretch source assets or silently replace a branded screenshot with a fictional interface.

### Make important decisions visible early

Before producing the full work, present a concise interpretation of the material, a proposed narrative, and a representative preview. Ask only for decisions that materially change the output. Explicit user instructions to proceed with defaults or skip a review should be recorded and respected.

### Optimize for revision

A user should be able to change a sentence, replace an image, adjust scene length, change a voice, or regenerate one chapter. Stable IDs and dependency-aware regeneration are part of the architecture.

## 5. End-to-end workflow

1. **Inspect the environment and input.** Validate the file type, discover available tools, record the source checksum, and identify missing capabilities.
2. **Extract and render.** Produce structured content, source-page previews, extracted assets, and a report of extraction limitations.
3. **Interpret.** Identify the audience, communication goal, key claims, evidence, source style, and ambiguities. Infer reasonable defaults from the material and user request.
4. **Plan the explanation.** Develop chapters, scene objectives, narration, source mappings, and approximate duration. Preserve essential qualifications.
5. **Choose a direction.** Recommend a small shortlist of MotionHub motions or retain the source style. Use the same real content in comparable previews.
6. **Produce a representative segment.** Exercise narration, visual composition, motion, captions, and sound together before expanding to the full work.
7. **Build the complete composition.** Generate or reuse narration audio, align timing, assemble scenes, and add music or sound effects appropriate to the brief.
8. **Validate.** Check content, layout, timing, audio, player behavior, and requested export formats. Inspect rendered frames and motion, not only source code.
9. **Revise and deliver.** Apply targeted changes, rerun affected checks, and package the editable project and requested final outputs.

Review checkpoints should not require unnecessary manual approval for every production step. The user can supply a complete brief or explicitly authorize automatic choices.

### Production modes

- **Narrated explanation:** narration carries the argument; visuals and optional sound support it.
- **Product showcase:** visual demonstration, music, and sound effects can lead; narration is optional.

The skill must not add compulsory music, sound effects, or narration when the selected mode or user request does not call for them.

## 6. MotionHub integration

MotionHub supplies reusable visual and motion systems, expressed through `MOTION.md`, design tokens, metadata, credits, and optional React components. It does not supply the story, script, scene sequence, or final timing.

The skill should:

1. Inspect the source style and scene requirements.
2. Recommend a small number of relevant motions, explaining their suitability.
3. Fetch the selected motion through its supported distribution mechanism, verify available integrity metadata, and record its version and license.
4. Read the motion specification and tokens, then reuse compatible components where suitable.
5. Resolve conflicts between source identity and the selected motion explicitly.

### Adaptation modes

| Mode | Behavior |
| --- | --- |
| Source-preserving | Preserve source colors, typography, and assets; adapt selected motion techniques where technically and legally permitted. |
| Blended | Retain recognizable brand anchors while applying more of the selected motion's layout and movement system. |
| Motion-led | Reinterpret the presentation using the selected motion's broader visual system, while preserving content and required brand assets. |

Source-preserving adaptation is the proposed default. A motion is not assumed to support independent replacement of every visual token. Any deviations from its intended system must be recorded.

Initial support should be a curated, tested subset. Each supported motion needs checks for Chinese text, dense diagrams, screenshot handling, rendering, and font availability. The runtime architecture should leave room for additional motions without promising universal compatibility.

## 7. Technical architecture

### Separation of responsibilities

| Layer | Responsibility | Main artifact |
| --- | --- | --- |
| Ingestion | File validation, extraction, page rendering, source references | `document.json` |
| Source style | Palette, typography, geometry, visual anchors | `style.json` |
| Narrative | Audience, purpose, claims, narration, chapter structure | `brief.md`, `narration.json` |
| Storyboard | Scene objectives, assets, explanatory actions | `storyboard.json` |
| Design | Motion selection, adaptation rules, resolved tokens | `direction.json`, `tokens.json` |
| Audio | Voice generation or supplied audio, music, effects, timing cues | Audio files, `cues.json` |
| Composition | Resolve actual media durations into deterministic frame timing | `timeline.json`, React scenes |
| Delivery | Web player, video render, captions, packaging | `dist/` |
| Validation | Structural, factual, visual, audio, and playback checks | `checks/` |

### Agent and tool boundary

The agent handles interpretation, narrative decisions, motion selection, and editorial judgment. Repeatable operations belong in scripts and runtime components: parsing, hashing, rendering, schema validation, media processing, asset packaging, and export verification.

### PPTX ingestion

Extract text, object geometry, images, notes, and native chart data where available. Preserve relationships between objects and their source slides. Groups, unsupported shapes, embedded objects, and complex diagrams require explicit handling or a documented fallback.

Also render the presentation to source-page images for comparison. A headless office renderer is a proposed dependency for this step; its fidelity must be evaluated with real files. Rendered previews remain useful when structural extraction is incomplete. Record font substitutions and conversion limitations.

### PDF ingestion

Extract text blocks and positions, inspect the document for readable text, and render pages. Apply OCR only where needed and record its use. A chart's appearance alone does not establish its underlying values. For flattened content, use crops, annotations, and visual emphasis when faithful reconstruction cannot be supported.

### Scene composition

Build a reusable vocabulary of explanatory actions: focus, reveal, compare, trace a process, show change, annotate, and demonstrate an interface. The storyboard selects the action; the selected motion determines its visual treatment.

Remotion is the proposed primary rendering engine. React components should derive their appearance from composition time and explicit inputs, so seeking to the same frame produces the same image. Avoid wall-clock animation and uncontrolled randomness.

### Narration and audio

Use a replaceable text-to-speech adapter or user-supplied narration. Preserve segment boundaries and pronunciation overrides. Final scene timing must use actual audio duration rather than word-count estimates alone.

Captions must follow the spoken text. Use supported timing information, alignment, or another verified timing method; sentence-length estimates alone are insufficient for word-synchronized claims. Music ducking and sound cues should keep speech intelligible. Record the origin and usage terms of every external audio asset.

### Web player and video

Both outputs should consume the same scene definitions and resolved timeline. The initial web experience is a static React application using a suitable Remotion player integration. It supports play/pause, seeking, chapter navigation, captions, and playback speed.

Video output follows a linear path. Any future interaction that changes content must define a linear fallback for export. Persist local playback position under a project-specific key. Package required playback assets locally unless an external dependency is explicitly declared.

## 8. Working environment

The baseline target is Linux with:

| Component | Baseline or requirement | Purpose |
| --- | --- | --- |
| Node.js | 22 LTS | React, Remotion, player, production scripts |
| npm | Version compatible with the selected Node.js release, recorded during implementation | Lockfile-based dependency installation |
| Python | 3.11 or newer, with the tested version recorded | Document extraction and supporting tools |
| Chromium and Playwright | Compatible, pinned browser/tool versions | Rendering and browser validation |
| FFmpeg and FFprobe | Tested versions recorded | Media processing and output inspection |
| Fonts | CJK coverage plus permitted source fonts | Legible, reproducible text rendering |
| PPTX page renderer | Headless LibreOffice is the proposed initial candidate | Source-page reference rendering |
| OCR engine | Required for scanned PDFs | Recover text when extraction is insufficient |

Python libraries such as `python-pptx` and PyMuPDF are candidates, subject to capability and license review. Exact packages and versions must be pinned before claiming reproducibility. A required capability can use an alternative implementation if it meets the same artifact and validation contracts.

Use the existing checkout in the task's isolated workspace. Do not create a Git worktree unless explicitly requested. Keep work outputs separate from skill source files.

External credentials are supplied through environment configuration, never through source files or saved project artifacts. Discover required destinations before network operations. Preserve TLS verification and artifact integrity checks. Record missing capabilities instead of marking an incomplete work as finished.

Rendering concurrency should follow available CPU and memory. Do not assume a GPU or choose a fixed high parallelism. Long or expensive renders should follow a successful representative render.

## 9. Skill repository layout

```text
slides-explainer-skill/
├── README.md
├── SKILL.md
├── docs/
│   └── product-and-technical-design.md
├── references/
│   ├── environment.md
│   ├── project-format.md
│   ├── ingestion.md
│   ├── storytelling.md
│   ├── motionhub.md
│   └── validation.md
├── scripts/
├── templates/
├── runtime/
└── evals/
```

`SKILL.md` should remain a concise entry point and workflow router. Supporting references are loaded only when relevant. Scripts implement repeatable operations; templates initialize work projects; runtime code implements scenes and playback. Evaluation definitions belong in the repository, while third-party source files are stored separately unless redistribution is permitted.

This is the target layout. This document does not imply that the listed implementation files already exist.

## 10. Work project directory

Default location: `<user-workspace>/works/<project-slug>/`. The user may choose another location. Never overwrite an existing work project without preserving its contents and respecting the user's instructions.

```text
works/<project-slug>/
├── project.json
├── input/
│   └── source.pptx              # Or source.pdf; immutable original
├── extracted/
│   ├── document.json
│   ├── style.json
│   ├── pages/
│   └── assets/
├── story/
│   ├── brief.md
│   ├── narration.json
│   └── storyboard.json
├── design/
│   ├── direction.json
│   ├── tokens.json
│   └── motions/
├── audio/
│   ├── narration/
│   ├── music/
│   ├── sfx/
│   └── cues.json
├── composition/
│   └── timeline.json
├── src/
├── public/
├── checks/
│   ├── report.json
│   ├── report.md
│   └── frames/
├── dist/
├── .cache/
├── package.json
└── package-lock.json
```

### Artifact conventions

- Use UTF-8 JSON for structured data and Markdown for readable explanations.
- Version structured document contracts with `schemaVersion`.
- Use stable IDs for source pages, objects, assets, narration segments, chapters, and scenes.
- Use project-relative paths in persistent artifacts.
- Number source pages from 1.
- Store source object geometry in its original coordinate system with explicit page width, height, units, and origin.
- Resolve composition timing to integer frames with an explicit project frame rate. Convert provider audio timings at a documented boundary.
- Keep editorial intent in the storyboard and authoritative playback timing in the resolved timeline.
- Retain source checksums, motion versions, font substitutions, and relevant tool versions.
- Treat `.cache/` as reproducible temporary state. It must not contain the only copy of an essential input or editorial decision.
- Keep the source file unchanged. Generated files must not overwrite it.

`project.json` should describe project identity, input references, language, communication goal, production mode, canvas, frame rate, requested outputs, and production state. Detailed JSON Schemas are a subsequent implementation task.

### Revisions and invalidation

Record dependencies between artifacts. A narration edit invalidates the affected audio, timing, captions, and dependent renders. A motion edit invalidates affected visual outputs and checks. A source replacement requires re-ingestion and reconciliation of source mappings. Cache keys must include relevant inputs and versions; file existence alone is not evidence that an artifact is current.

## 11. Delivery structure and formats

```text
dist/
├── web/
│   ├── index.html
│   └── assets/
├── video/
│   └── explainer.mp4
├── captions/
│   ├── zh-CN.vtt
│   └── zh-CN.srt
├── poster.jpg
├── transcript.md
├── credits.md
└── delivery.json
```

Language filenames follow the actual work language; `zh-CN` is an example. Caption and transcript artifacts are generated when the work contains relevant spoken or textual content. Requested output types determine whether `web/`, `video/`, or both exist. The manifest must distinguish generated, failed, and unrequested outputs.

| Property | Initial default |
| --- | --- |
| Canvas | 1920 × 1080, 16:9 |
| Frame rate | 30 fps |
| Video container and codec | MP4, H.264 video; AAC audio when audio is present |
| Captions | WebVTT for the player; SRT for video workflows |
| Burned-in captions | Optional, explicitly requested variant |
| Web delivery | Static site and local assets, served over HTTP(S) |
| Editable delivery | Retained work project with source mappings and generation artifacts |

Preserve source aspect ratios within recomposed layouts. Avoid stretching or silent cropping of meaningful content. Defaults can be changed by the brief, with resulting specs recorded in the manifest.

`delivery.json` should identify the work version, output paths, media specs, checksums, validation summary, and known limitations. A delivered web build must be tested independently of development-only paths. Producing a static build does not publish it to the Internet.

## 12. Validation and acceptance

### Content validation

- Trace substantive claims and narration to source material or explicit user context.
- Check numbers, units, dates, chart labels, uncertainty, and recommendations.
- Identify omitted sections and editorial condensation.
- Resolve or disclose extraction failures and material ambiguities.

### Visual validation

- Inspect source references, representative frames, and transitions.
- Check text clipping, overlap, missing glyphs, font substitution, contrast, captions, and asset resolution.
- Verify the meaningful content of charts and screenshots remains legible.
- Inspect scene beginnings and endings for blank frames and accidental intermediate states.
- Check motion under playback, since isolated frames cannot establish timing quality.

### Audio and playback validation

- Verify narration completeness, pronunciation of important terms, and synchronization.
- Check intelligibility, clipping, music balance, and sound-cue placement.
- Inspect media duration, dimensions, codecs, frame rate, and expected audio tracks with appropriate tools.
- Test web loading, playback, seeking, chapter jumps, caption switching, speed changes, and completion behavior.
- Verify packaged assets resolve without relying on local development files or undeclared remote services.

### Completion criteria

A work is deliverable when its requested outputs are generated, required checks pass, and remaining limitations are explicitly recorded. Mark intermediate previews as previews. A successful render alone is insufficient to establish factual or editorial quality.

The main product-quality measure is the amount of revision needed before the user is comfortable sharing the work. Collect human feedback alongside mechanical checks; do not substitute an automated score for user judgment.

## 13. Initial evaluation set

The selected initial set contains PPTX and PDF inputs. The earlier Google Slides candidate is replaced by a downloadable PPTX, consistent with the final input scope.

| Material | Format and size | Main evaluation purpose |
| --- | --- | --- |
| CNCF Overview, Chinese | PPTX, 50 pages | Chinese narration, content selection, source visual identity |
| Mead Johnson Nutrition Stock Pitch | PPTX, 82 pages, 43 native chart XML parts | Financial numbers, units, charts, evidence and recommendation |
| Mead Johnson Investment Summary | PDF, 1 page | Dense-page interpretation and one-page-to-multiple-scene adaptation |
| How Good Is Our Code?, Chinese | PPTX, 55 pages | Technical terminology, argument structure, explanatory animation |

Sources:

- [CNCF Chinese presentation directory](https://github.com/cncf/presentations/tree/main/chinese)
- [MJN research and stock pitch repository](https://github.com/vshah5/Equity-Research-Report-and-Stock-Pitch)

These materials were downloaded and structurally inspected during research. They have not yet been run through this skill. Native chart counts do not establish that every chart is supported by the eventual parser.

Start with coherent sections of the long decks and then test whole-document behavior. Use the same excerpts to compare motion options. Define source facts and critical omissions before judging generated results.

The set is a seed benchmark, not comprehensive coverage. Add scanned PDFs, more recent product material, complex diagrams, and missing-font cases later. Historical claims must not be presented as current facts.

Public availability does not establish unrestricted redistribution. CNCF requests reusable licensing for submissions; per-deck attribution and third-party assets still need review. No explicit license was visible in the MJN repository root during initial research. Keep source files outside the public skill repository until usage terms are resolved.

## 14. Reference projects and reuse strategy

| Project | Useful ideas | Adaptation for this skill |
| --- | --- | --- |
| [Frontend Slides](https://github.com/zarazhangrui/frontend-slides) | Visual style discovery, fixed canvas, PPTX extraction, progressive reference loading | Compare motions using source content; keep the skill entry point concise. |
| [Huashu Design](https://github.com/alchaincyf/huashu-design) | Content-driven direction, representative samples, storyboards, sound planning, render inspection | Validate a complete explanatory segment before full production. |
| [Guizang PPT Skill](https://github.com/op7418/guizang-ppt-skill) | Named layouts, constrained tokens, validators, presentation navigation and state | Build a tested scene vocabulary and measurable player/layout checks. |
| [MotionHub](https://github.com/motionhub-dev/motions) | Reusable look and motion specifications, tokens, components, engine bindings | Supply selectable style systems independently of the narrative. |
| [Remotion](https://github.com/remotion-dev/remotion) | React compositions, deterministic timing, player and rendering capabilities | Share composition definitions between web playback and video output. |

Borrow methods selectively. Do not inherit mandatory multi-direction approval, watermarks, or sound defaults that conflict with the user's requested workflow. Single-file HTML delivery is not required for this project's player architecture.

Code reuse requires a separate license check. Huashu Design declares MIT, Guizang declares AGPL-3.0, MotionHub has tool and per-motion licensing, and Remotion has its own licensing conditions. Verify current terms and those of Frontend Slides before incorporating code. Methodological inspiration does not imply source-code reuse.

## 15. Implementation roadmap

### Phase 1: Contracts and ingestion

- Define schemas, stable IDs, artifact ownership, and project initialization.
- Implement PPTX/PDF extraction and source-page rendering.
- Produce source/style summaries and diagnose unsupported objects.
- Validate against the four seed materials.

### Phase 2: One end-to-end narrated explanation

- Build narrative and storyboard generation with source mappings.
- Add one voice adapter and deterministic scene components.
- Deliver a 2–5 minute explanation from a coherent section of an approximately 5–15-page source segment.
- Render MP4, captions, transcript, and provenance records.

### Phase 3: Motion selection and web playback

- Integrate a curated set of MotionHub motions and representative previews.
- Implement the shared timeline and web player controls.
- Validate the independently packaged web build and video parity.

### Phase 4: Revision workflow and broader reliability

- Implement targeted edits and dependency-aware regeneration.
- Add product-showcase sound workflows and optional narration.
- Expand evaluation coverage, error recovery, and resource-aware rendering.
- Measure revision effort and sharing readiness on realistic user tasks.

## 16. Decisions to resolve during implementation

- Which PPTX renderer and extraction libraries meet fidelity and licensing requirements?
- Which voice services and timing/alignment methods are available in the target environment?
- Which initial MotionHub motions work reliably with Chinese and dense business content?
- What source-style constraints take precedence when a motion is incompatible?
- What practical limits on document size, duration, and render resources are supported by measured results?
- What minimum readability and audio thresholds can be enforced by automated checks?
- How should editable projects be packaged for transfer across machines?

These questions do not change the agreed input scope or delivery conventions. They should be resolved through implementation evidence and recorded decisions before making capability or performance claims.
