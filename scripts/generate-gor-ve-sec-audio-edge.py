import asyncio
import argparse
import json
import re
from pathlib import Path

import edge_tts


PROJECT_ROOT = Path.cwd()
SOURCE_FILE = PROJECT_ROOT / "gor-ve-sec.html"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "audio" / "gor-ve-sec"
DEFAULT_VOICE = "tr-TR-EmelNeural"
DEFAULT_RATE = "-12%"


def normalize_audio_key(text: str) -> str:
    lowered = text.replace("I", "ı").replace("İ", "i").lower()
    translit = (
        lowered.replace("ç", "c")
        .replace("ğ", "g")
        .replace("ı", "i")
        .replace("ö", "o")
        .replace("ş", "s")
        .replace("ü", "u")
    )
    return re.sub(r"[^a-z0-9]", "", translit)


def extract_words(html: str) -> list[str]:
    words = {match.strip() for match in re.findall(r'w:\s*"([^"]+)"', html) if match.strip()}
    return sorted(words, key=normalize_audio_key)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate TTS audio files for gor-ve-sec words.")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help="Edge TTS voice id, e.g. tr-TR-EmelNeural")
    parser.add_argument("--rate", default=DEFAULT_RATE, help="Speech rate, e.g. -12%%")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate files even if they already exist")
    return parser.parse_args()


async def generate_one(word: str, out_file: Path, voice: str, rate: str) -> None:
    attempts = 5
    for idx in range(attempts):
        try:
            communicate = edge_tts.Communicate(text=word, voice=voice, rate=rate)
            await communicate.save(str(out_file))
            return
        except Exception:
            if idx == attempts - 1:
                raise
            await asyncio.sleep(1.5 * (idx + 1))


async def main() -> None:
    args = parse_args()
    html = SOURCE_FILE.read_text(encoding="utf-8")
    words = extract_words(html)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest = {}
    created = 0
    skipped = 0

    for word in words:
        slug = normalize_audio_key(word)
        if not slug:
            continue
        out_file = OUTPUT_DIR / f"{slug}.mp3"
        manifest[slug] = {
            "text": word,
            "file": f"assets/audio/gor-ve-sec/{slug}.mp3",
            "provider": "edge-tts",
            "voice": args.voice,
            "rate": args.rate,
        }
        if out_file.exists() and not args.overwrite:
            skipped += 1
            print(f"Atlandi: {word}")
            continue

        print(f"Uretiliyor: {word}")
        await generate_one(word, out_file, args.voice, args.rate)
        created += 1

    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Tamamlandi. Yeni: {created}, Atlanan: {skipped}, Toplam Kelime: {len(manifest)}")


if __name__ == "__main__":
    asyncio.run(main())
