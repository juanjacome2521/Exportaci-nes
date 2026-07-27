"""Convierte el informe Markdown en un PDF ligero, sin dependencias externas."""
from pathlib import Path
import re
import textwrap

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "reports/informe_exportaciones_ecuador_2014_2025.md"
OUTPUT = ROOT / "reports/informe_exportaciones_ecuador_2014_2025.pdf"
PAGE_W, PAGE_H = 612, 792
MARGIN, TOP, BOTTOM = 48, 742, 48


def clean(line: str) -> str:
    line = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", line)
    line = line.replace("**", "").replace("`", "")
    return line.replace("|", "  |  ").strip()


def escape_pdf(text: str) -> bytes:
    safe = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    return safe.encode("latin-1", "replace")


def lines_from_markdown(markdown: str):
    result = []
    for raw in markdown.splitlines():
        text = clean(raw)
        if not text or set(text.replace("|", "").replace(" ", "")) == {"-"}:
            result.append(("", 9, 8))
            continue
        if text.startswith("# "):
            result.extend((part, 18, 24) for part in textwrap.wrap(text[2:], width=62))
        elif text.startswith("## "):
            result.append((text[3:], 13, 18))
        elif text.startswith("### "):
            result.append((text[4:], 11, 15))
        elif text.startswith("- ") or re.match(r"\d+\. ", text):
            result.extend(("• " + part if i == 0 else "  " + part, 9, 13) for i, part in enumerate(textwrap.wrap(text[2:] if text.startswith("- ") else text, width=90)))
        elif " | " in text:
            result.extend((part, 7, 10) for part in textwrap.wrap(text, width=118, break_long_words=False))
        else:
            result.extend((part, 9, 13) for part in textwrap.wrap(text, width=94, break_long_words=False))
    return result


def content_stream(page_lines, page_number):
    commands = [b"BT /F1 8 Tf 48 770 Td (Exportaciones petroleras y no petroleras del Ecuador, 2014-2025) Tj ET"]
    y = TOP
    for text, size, leading in page_lines:
        if not text:
            y -= leading
            continue
        commands.append(b"BT /F1 " + str(size).encode() + b" Tf 48 " + f"{y:.1f}".encode() + b" Td (" + escape_pdf(text) + b") Tj ET")
        y -= leading
    commands.append(b"BT /F1 8 Tf 540 28 Td (" + str(page_number).encode() + b") Tj ET")
    return b"\n".join(commands)


all_lines = lines_from_markdown(SOURCE.read_text(encoding="utf-8"))
pages, current, used = [], [], 0
for item in all_lines:
    if used + item[2] > TOP - BOTTOM:
        pages.append(current)
        current, used = [], 0
    current.append(item)
    used += item[2]
if current:
    pages.append(current)

objects = [b"<< /Type /Catalog /Pages 2 0 R >>", None, b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
page_ids = []
for i, page in enumerate(pages):
    page_id = 4 + i * 2
    content_id = page_id + 1
    page_ids.append(page_id)
    stream = content_stream(page, i + 1)
    objects.extend([
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] /Resources << /Font << /F1 3 0 R >> >> /Contents {content_id} 0 R >>".encode(),
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ])
objects[1] = b"<< /Type /Pages /Kids [" + b" ".join(f"{item} 0 R".encode() for item in page_ids) + b"] /Count " + str(len(page_ids)).encode() + b" >>"

pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
offsets = [0]
for number, obj in enumerate(objects, start=1):
    offsets.append(len(pdf))
    pdf.extend(f"{number} 0 obj\n".encode() + obj + b"\nendobj\n")
xref = len(pdf)
pdf.extend(f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n".encode())
for offset in offsets[1:]:
    pdf.extend(f"{offset:010d} 00000 n \n".encode())
pdf.extend(f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
OUTPUT.write_bytes(pdf)
print(f"PDF creado: {OUTPUT} ({len(pages)} páginas)")
