"""Pack the finished scene masters into the small WebP textures used by Vite."""
from argparse import ArgumentParser
from pathlib import Path
from PIL import Image

if __name__ == "__main__":
    parser = ArgumentParser()
    for scene in ("street", "kitchen", "shop", "checkout"):
        parser.add_argument(scene, type=Path)
    args = parser.parse_args()
    out = Path(__file__).resolve().parents[1] / "art"
    for name, path in vars(args).items():
        with Image.open(path) as image:
            image = image.convert("RGB")
            image.thumbnail((1280, 640), Image.Resampling.BOX)
            image.save(out / (name + ".webp"), "WEBP", quality=91, method=6)
