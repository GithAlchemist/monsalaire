#!/usr/bin/env python3
"""
Build the legal library: download each source listed in sources/sources.json (when missing), record its SHA-256,
and write a full Markdown transcription in sources/text/<id>.md, page by page.

Text PDFs are transcribed with pdftotext (poppler). Scanned PDFs are read with the macOS Vision OCR tool in
tools/ocr.swift (compiled on first use). Transcriptions are faithful to the document: no rewording, page breaks
kept, so a rule can cite "page N" and anyone can check it against the original.

Usage: python3 sources/tools/build_library.py [--force] [id ...]
Requires: curl, poppler (pdftotext, pdftoppm, pdfinfo); swiftc on macOS for scanned documents.
"""
import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
ORIGINALS = ROOT / "originals"
TEXT = ROOT / "text"
TOOLS = ROOT / "tools"
OCR_BIN = TOOLS / ".ocr-bin"


def sh(*args: str, **kw) -> str:
    return subprocess.run(args, check=True, capture_output=True, text=True, **kw).stdout


def sha256(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def pages(pdf: pathlib.Path) -> int:
    for line in sh("pdfinfo", str(pdf)).splitlines():
        if line.startswith("Pages:"):
            return int(line.split()[1])
    return 0


def text_pages(pdf: pathlib.Path, n: int) -> list[str]:
    out = []
    for p in range(1, n + 1):
        out.append(sh("pdftotext", "-f", str(p), "-l", str(p), "-enc", "UTF-8", str(pdf), "-"))
    return out


def ocr_pages(pdf: pathlib.Path) -> list[str]:
    if not OCR_BIN.exists():
        sh("swiftc", "-O", str(TOOLS / "ocr.swift"), "-o", str(OCR_BIN))
    with tempfile.TemporaryDirectory() as tmp:
        sh("pdftoppm", "-r", "200", "-png", str(pdf), f"{tmp}/p")
        imgs = sorted(pathlib.Path(tmp).glob("p-*.png"))
        raw = sh(str(OCR_BIN), *map(str, imgs))
    chunks = raw.split("<<<PAGE ")[1:]
    return [c.split(">>>\n", 1)[1] if ">>>\n" in c else "" for c in chunks]


def clean(page: str) -> str:
    lines = [l.rstrip() for l in page.replace("\f", "").splitlines()]
    out, blank = [], 0
    for l in lines:
        blank = blank + 1 if not l.strip() else 0
        if blank <= 1:
            out.append(l)
    return "\n".join(out).strip()


def build(src: dict, force: bool) -> dict:
    pdf = ORIGINALS / f"{src['id']}.pdf"
    if not pdf.exists():
        print(f"  downloading {src['download_url']}")
        sh("curl", "-sSL", "-m", "300", "-A", "Mozilla/5.0", "-o", str(pdf), src["download_url"])
    digest = sha256(pdf)
    md = TEXT / f"{src['id']}.md"
    n = pages(pdf)
    if md.exists() and not force and digest[:16] in md.read_text(encoding="utf-8")[:2000]:
        return {"sha256": digest, "pages": n}
    body = ocr_pages(pdf) if src["method"] == "ocr" else text_pages(pdf, n)
    head = [
        f"# {src['title']}",
        "",
        f"- Publisher: {src['publisher']}",
        f"- Date: {src['date']}",
        f"- Original: [`originals/{pdf.name}`](../originals/{pdf.name}), {n} pages, SHA-256 `{digest}`",
        f"- Downloaded from: {src['download_url']}",
        f"- Transcription: {'OCR (macOS Vision), check figures against the original page' if src['method'] == 'ocr' else 'text layer of the PDF (pdftotext)'}",
        "",
        "Faithful transcription, page by page, without rewording. Tables may lose their layout: the original PDF is",
        "the reference.",
        "",
    ]
    parts = [f"## Page {i}\n\n```text\n{clean(t)}\n```\n" for i, t in enumerate(body, 1)]
    md.write_text("\n".join(head) + "\n" + "\n".join(parts), encoding="utf-8")
    print(f"  wrote {md.relative_to(ROOT.parent)} ({n} pages, {src['method']})")
    return {"sha256": digest, "pages": n}


def main() -> None:
    force = "--force" in sys.argv
    wanted = [a for a in sys.argv[1:] if not a.startswith("--")]
    registry_path = ROOT / "sources.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    ORIGINALS.mkdir(exist_ok=True)
    TEXT.mkdir(exist_ok=True)
    for src in registry:
        if wanted and src["id"] not in wanted:
            continue
        print(src["id"])
        src.update(build(src, force))
    registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
