"""Generate the approved Yunxi clips for the standard VisoTalk provider."""
import asyncio
import json
from pathlib import Path

import edge_tts

LIBRARY = Path(__file__).resolve().parent / 'library'


async def main():
    narration = json.loads((LIBRARY / 'narration.json').read_text(encoding='utf-8'))
    for segment in narration['segments']:
        audio = LIBRARY / f"{segment['id']}-neural.mp3"
        metadata = audio.with_suffix('.jsonl')
        await edge_tts.Communicate(
            segment['text'], 'zh-CN-YunxiNeural', rate='-5%', boundary='WordBoundary'
        ).save(str(audio), str(metadata))
        print(segment['id'], flush=True)


if __name__ == '__main__':
    asyncio.run(main())
