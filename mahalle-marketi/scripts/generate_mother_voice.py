"""Regenerate the bundled Turkish mother dialogue with edge-tts (7.3.1) and FFmpeg."""
import argparse
import asyncio
import json
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "art" / "voices" / "mother"
VOICE = "tr-TR-EmelNeural"


async def generate(id, text, tmp, ffmpeg, limit):
    raw = tmp / (id + ".mp3")
    async with limit:
        await edge_tts.Communicate(text, VOICE, rate="-8%", pitch="-2Hz").save(str(raw))
    # Trim the service's edge padding so item phrases can play consecutively.
    trim = "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-54dB"
    subprocess.run(
        [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw),
         "-af", f"{trim},areverse,{trim},areverse,volume=0.8",
         "-ar", "24000", "-ac", "1", "-b:a", "48k", str(tmp / (id + "-final.mp3"))],
        check=True,
    )


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    args = parser.parse_args()
    script = subprocess.check_output(
        ["node", "--experimental-strip-types", "--input-type=module", "-e",
         "import {motherRecordingScript} from './src/mother-dialogue.ts';"
         "process.stdout.write(JSON.stringify(motherRecordingScript()));"],
        cwd=ROOT, encoding="utf-8",
    )
    phrases = json.loads(script)
    OUT.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix="mahalle-voice-") as folder:
        tmp = Path(folder)
        limit = asyncio.Semaphore(3)
        await asyncio.gather(*(generate(id, text, tmp, args.ffmpeg, limit) for id, text in phrases.items()))
        for id in phrases:
            (OUT / (id + ".mp3")).write_bytes((tmp / (id + "-final.mp3")).read_bytes())
    print(f"{len(phrases)} clips: {VOICE}")


if __name__ == "__main__":
    asyncio.run(main())
