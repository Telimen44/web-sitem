import argparse
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


PROJECT_ROOT = Path.cwd()
OUTPUT_DIR = PROJECT_ROOT / "assets" / "images" / "gor-ve-sec"

ILLUSTRATIONS = [
    {"slug": "top", "prompt": "cute kids illustration of a soccer ball, clean white background, soft colors, flat vector style"},
    {"slug": "ev", "prompt": "cute kids illustration of a house, clean white background, soft colors, flat vector style"},
    {"slug": "mum", "prompt": "cute kids illustration of a candle, clean white background, soft colors, flat vector style"},
    {"slug": "kapi", "prompt": "cute kids illustration of a door, clean white background, soft colors, flat vector style"},
    {"slug": "elma", "prompt": "cute kids illustration of an apple, clean white background, soft colors, flat vector style"},
    {"slug": "muz", "prompt": "cute kids illustration of a banana, clean white background, soft colors, flat vector style"},
    {"slug": "su", "prompt": "cute kids illustration of a glass of water, clean white background, soft colors, flat vector style"},
    {"slug": "bal", "prompt": "cute kids illustration of a honey jar, clean white background, soft colors, flat vector style"},
    {"slug": "tabak", "prompt": "cute kids illustration of a plate, clean white background, soft colors, flat vector style"},
    {"slug": "kasik", "prompt": "cute kids illustration of a spoon, clean white background, soft colors, flat vector style"},
    {"slug": "catal", "prompt": "cute kids illustration of a fork, clean white background, soft colors, flat vector style"},
    {"slug": "defter", "prompt": "cute kids illustration of a notebook, clean white background, soft colors, flat vector style"},
    {"slug": "sandalye", "prompt": "cute kids illustration of a chair, clean white background, soft colors, flat vector style"},
    {"slug": "lamba", "prompt": "cute kids illustration of a lamp, clean white background, soft colors, flat vector style"},
    {"slug": "saat", "prompt": "cute kids illustration of an alarm clock, clean white background, soft colors, flat vector style"},
    {"slug": "canta", "prompt": "cute kids illustration of a school backpack, clean white background, soft colors, flat vector style"},
    {"slug": "telefon", "prompt": "cute kids illustration of a smartphone, clean white background, soft colors, flat vector style"},
    {"slug": "kamera", "prompt": "cute kids illustration of a camera, clean white background, soft colors, flat vector style"},
    {"slug": "tablet", "prompt": "cute kids illustration of a tablet device, clean white background, soft colors, flat vector style"},
    {"slug": "bilgisayar", "prompt": "cute kids illustration of a desktop computer, clean white background, soft colors, flat vector style"},
    {"slug": "bisiklet", "prompt": "cute kids illustration of a bicycle, clean white background, soft colors, flat vector style"},
    {"slug": "gemi", "prompt": "cute kids illustration of a ship, clean white background, soft colors, flat vector style"},
    {"slug": "ucak", "prompt": "cute kids illustration of an airplane, clean white background, soft colors, flat vector style"},
    {"slug": "kus", "prompt": "cute kids illustration of a bird, clean white background, soft colors, flat vector style"},
    {"slug": "traktor", "prompt": "cute kids illustration of a tractor, clean white background, soft colors, flat vector style"},
    {"slug": "helikopter", "prompt": "cute kids illustration of a helicopter, clean white background, soft colors, flat vector style"},
    {"slug": "kaplumbaga", "prompt": "cute kids illustration of a turtle, clean white background, soft colors, flat vector style"},
    {"slug": "zurafa", "prompt": "cute kids illustration of a giraffe, clean white background, soft colors, flat vector style"},
    {"slug": "penguen", "prompt": "cute kids illustration of a penguin, clean white background, soft colors, flat vector style"},
    {"slug": "balina", "prompt": "cute kids illustration of a whale, clean white background, soft colors, flat vector style"},
    {"slug": "bulut", "prompt": "cute kids illustration of a cloud, clean white background, soft colors, flat vector style"},
    {"slug": "yagmur", "prompt": "cute kids illustration of rain drops, clean white background, soft colors, flat vector style"},
    {"slug": "gokkusagi", "prompt": "cute kids illustration of a rainbow, clean white background, soft colors, flat vector style"},
    {"slug": "portakal", "prompt": "cute kids illustration of an orange fruit, clean white background, soft colors, flat vector style"},
    {"slug": "karpuz", "prompt": "cute kids illustration of a watermelon, clean white background, soft colors, flat vector style"},
    {"slug": "uzum", "prompt": "cute kids illustration of grape bunch, clean white background, soft colors, flat vector style"},
    {"slug": "armut", "prompt": "cute kids illustration of a pear fruit, clean white background, soft colors, flat vector style"},
    {"slug": "pencere", "prompt": "cute kids illustration of a window, clean white background, soft colors, flat vector style"},
    {"slug": "dolap", "prompt": "cute kids illustration of a cupboard cabinet, clean white background, soft colors, flat vector style"},
    {"slug": "battaniye", "prompt": "cute kids illustration of a folded blanket, clean white background, soft colors, flat vector style"},
]

STRICT_SUFFIX = (
    "single isolated object, centered, plain white background, "
    "no people, no children, no hands, no text, no extra objects"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate word illustrations via Pollinations.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing image files")
    parser.add_argument("--width", default="768", help="Output width")
    parser.add_argument("--height", default="768", help="Output height")
    parser.add_argument("--model", default="flux", help="Pollinations model name")
    parser.add_argument("--max-retries", type=int, default=8, help="Max retries per image")
    parser.add_argument("--retry-base", type=float, default=2.5, help="Base sleep seconds for retries")
    parser.add_argument("--pause", type=float, default=2.0, help="Sleep seconds between successful requests")
    return parser.parse_args()


def download_with_retry(url: str, out_file: Path, max_retries: int, retry_base: float) -> bool:
    for idx in range(max_retries):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                },
            )
            with urllib.request.urlopen(request, timeout=120) as response:
                content_type = (response.headers.get("Content-Type") or "").lower()
                payload = response.read()
                if not content_type.startswith("image/"):
                    print(f"Uyari: gorsel olmayan yanit ({content_type or 'bilinmiyor'}) alindi -> {out_file.name}")
                    return False
                out_file.write_bytes(payload)
            return True
        except urllib.error.HTTPError as exc:
            status = getattr(exc, "code", None)
            if status in (429, 500, 502, 503, 504):
                wait = retry_base * (idx + 1)
                if status == 429:
                    wait = max(wait, 10.0)
                print(f"Uyari: HTTP {status} -> {out_file.name}, {wait:.1f}s sonra tekrar denenecek")
                time.sleep(wait)
                continue
            print(f"Hata: HTTP {status} -> {out_file.name}")
            return False
        except (urllib.error.URLError, TimeoutError) as exc:
            if idx == max_retries - 1:
                print(f"Hata: baglanti/zaman asimi -> {out_file.name}: {exc}")
                return False
            wait = retry_base * (idx + 1)
            print(f"Uyari: baglanti sorunu -> {out_file.name}, {wait:.1f}s sonra tekrar denenecek")
            time.sleep(wait)
        except Exception as exc:
            print(f"Hata: beklenmeyen durum -> {out_file.name}: {exc}")
            return False

    print(f"Hata: tekrar deneme limiti doldu -> {out_file.name}")
    return False


def main() -> None:
    args = parse_args()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    created = 0
    skipped = 0
    failed = []

    for item in ILLUSTRATIONS:
        out_file = OUTPUT_DIR / f"{item['slug']}.jpg"
        if out_file.exists() and not args.overwrite:
            skipped += 1
            print(f"Atlandi: {item['slug']}")
            continue

        prompt = f"{item['prompt']}, {STRICT_SUFFIX}"
        encoded = urllib.parse.quote(prompt, safe="")
        url = (
            f"https://image.pollinations.ai/prompt/{encoded}"
            f"?width={args.width}&height={args.height}&model={args.model}&nologo=true&enhance=true"
        )
        print(f"Uretiliyor: {item['slug']}")
        ok = download_with_retry(
            url,
            out_file,
            max_retries=max(1, args.max_retries),
            retry_base=max(0.5, args.retry_base),
        )
        if ok:
            created += 1
        else:
            failed.append(item["slug"])

        if args.pause > 0:
            time.sleep(args.pause)

    print(
        f"Tamamlandi. Yeni: {created}, Atlanan: {skipped}, Basarisiz: {len(failed)}, Toplam: {len(ILLUSTRATIONS)}"
    )
    if failed:
        print("Basarisiz sluglar: " + ", ".join(failed))


if __name__ == "__main__":
    main()
