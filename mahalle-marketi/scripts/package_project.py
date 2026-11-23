"""Create the portable game and complete source archive after a successful build."""
from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
archive = root / "mahalle-marketi.zip"
docs = ["README.md", "SQUARESPACE.md", "TESTLER.md"]
source = ["package.json", "package-lock.json", "vite.config.mjs", "tsconfig.json", "index.html", ".gitignore"]
with NamedTemporaryFile(dir=root, suffix=".tmp", delete=False) as handle:
    temporary = Path(handle.name)
try:
    with ZipFile(temporary, "w", compression=ZIP_DEFLATED, compresslevel=9) as bundle:
        bundle.write(root / "dist" / "index.html", "OYNA.html")
        for name in docs:
            bundle.write(root / name, name)
        for name in source:
            bundle.write(root / name, "kaynak/" + name)
        for folder in ["art", "scripts", "src", "tests"]:
            for path in sorted((root / folder).rglob("*")):
                if path.is_file() and "__pycache__" not in path.parts:
                    bundle.write(path, "kaynak/" + path.relative_to(root).as_posix())
        for name in docs:
            bundle.write(root / name, "kaynak/" + name)
    with ZipFile(temporary) as bundle:
        if bundle.testzip() or bundle.read("OYNA.html") != (root / "dist" / "index.html").read_bytes():
            raise RuntimeError("Paket doğrulanamadı.")
    temporary.replace(archive)
finally:
    temporary.unlink(missing_ok=True)
print(f"{archive.name} ({archive.stat().st_size:,} bayt)")
