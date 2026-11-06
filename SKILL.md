---
name: slides-explainer
description: Turn an existing PPTX or PDF into a source-grounded narrated explainer using standard VisoTalk documents and a local web player.
---

# Slides Explainer

Use [the standard VisoTalk workflow](references/visotalk-workflow.md) for all new productions. Use the available VisoTalk skill and consult the installed CLI schema before authoring. The current example uses spec 0.8.0, with `target` and `to` action attributes.

Read the source pages and verify each substantive claim, unit and number. Write natural spoken sentences with one idea per line. Distinguish source claims, derived calculations and editorial interpretation. Preserve historical context and unresolved ambiguity.

Create a `doc.tsx` containing narration lines, visual parts and word-anchored actions. Draw explanatory diagrams from real data and keep spatial continuity where it helps understanding. Motion must express a comparison, process or change. Follow the narration's words rather than duplicating timing in frame numbers.

Use VisoTalk's voice provider interface, preparation, layout review, QA, build and player. Do not use the historical Remotion composition or player for new work. Default to web delivery, and export MP4 only when explicitly requested.

Inspect representative full-size frames and actual playback. Check that the narration explains the source and that the picture shows what is being discussed. Technical QA alone is insufficient.

Keep work assets local and out of Git unless explicitly intended for publication. Never present localhost as an externally accessible URL. The committed example provides editable source and reproduction instructions; generated voices and the original PDF are excluded.
