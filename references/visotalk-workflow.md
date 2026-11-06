# Standard VisoTalk production

New productions use a VisoTalk document for narration, visuals, timing, review and playback. The source-page Remotion MVP remains historical implementation material. Its `prepare`, `build`, `render` and player commands are not part of this workflow.

## Setup

Use Node 22.12+, Python and FFmpeg. Run `npx --yes visotalk@latest doctor --fix` and resolve prerequisites. The migrated example was validated with CLI 0.8.6 and document spec 0.8.0. Inspect `visotalk schema actions` when upgrading. Current actions use `target` and `to={{...}}`.

## Production

1. Inspect selected source pages and retain factual provenance, units and uncertainties. Extracted text must be checked against page images.
2. Write a coherent explanation in short spoken sentences. Each `Line` carries one sentence; numbers are spelled out for speech.
3. Design the visual state and explanatory change for every sentence. Use data-driven diagrams and continuous transformations, and anchor changes to the words that name them.
4. Author `doc.tsx` with `Doc`, `Scene`, `Line`, `Part` and `Animation`. Draw with React/SVG and VisoTalk `useProp`; control motion using `Appear`, `Set` and `Tween`. Do not introduce a separate frame timeline or a Remotion composition.
5. Prepare actual narration with VisoTalk's provider interface. The example adapts approved cloud Yunxi clips and word boundaries. Word-internal character timing is interpolated. Voice changes require new preparation and a listening review.
6. Run `validate`, `prepare`, `sheet`, selected full-size `still` frames and `qa`. Inspect both visuals and narration. Passing technical QA does not establish explanatory quality.
7. Use `build --artifact` for the distributable player, and `play` for local review. Render MP4 only when requested.

## Reproduce the migrated example

```powershell
cd examples/mjn-visotalk
python -m pip install edge-tts==7.3.1
python generate_voice.py
./produce.ps1
npx --yes visotalk@latest play doc.tsx --port 3096
```

Voice generation sends the committed narration to Microsoft's online speech service. The provider itself then uses local clips. Generated audio, word metadata, source PDF, caches and builds are excluded from Git. The original evaluation PDF URL and checksum are in `evals/materials.json` under `mjn-summary-pdf`; it is not required to render the reconstructed chart.

The example's numbers are historical. Its percentages assume the price and valuations share a currency, while the original price says C$ and valuations say $. The document discloses this uncertainty and distinguishes its explanation from the source author's explicit Hold rating.
