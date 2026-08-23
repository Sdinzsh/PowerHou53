---
name: markitdown
description: "Convert multi-format documents (PDF, DOCX, PPTX, XLSX, images, audio, video, HTML, ZIP) into token-efficient Markdown using Microsoft MarkItDown for LLM ingestion and knowledge graph indexing."
metadata:
  category: ingestion
  tags: markitdown,parsing,pdf,ocr,audio,markdown,ingestion
  verified: "2026-08-16"
  provenance: agent-created
---

# MarkItDown Multi-Modal Ingestion Engine

Microsoft **MarkItDown** is a lightweight orchestration utility that converts 15+ diverse file formats into clean, token-efficient Markdown optimized for LLM consumption and knowledge graph indexing.

## When to Use
- Ingesting project specifications, user guides, slide decks, or architecture diagrams into the Knowledge Graph.
- Extracting tables from spreadsheets (`.xlsx`) or structural outlines from Word documents (`.docx`).
- Transcribing audio meeting notes or video walkthroughs into searchable Markdown.
- Running LLM-powered OCR on scanned PDFs or architecture diagram images.

---

## Supported Formats & Extraction Strategies

| Input Format | Underlying Driver | Ingestion Strategy |
|---|---|---|
| **Word (.docx)** | `mammoth` & `python-docx` | Maps inline elements directly to semantic Markdown hierarchies |
| **Excel (.xlsx)** | `pandas` & `openpyxl` | Translates sheets and calculated grids into clean Markdown tables |
| **PowerPoint (.pptx)** | `python-pptx` | Slide titles become headings, bullets become lists, notes become text comments |
| **PDFs** | `pdfminer.six` & `pdfplumber` | `pdfminer` for prose; `pdfplumber` for complex forms and multi-column tables |
| **Web Content (.html)** | `BeautifulSoup` & `Magika` | Detects content-type via `Magika` byte analysis; strips scripts and layout noise |
| **Audio / Video** | `speech_recognition` / YouTube | Extracts EXIF metadata and produces timestamped text transcriptions |
| **Images** | `markitdown-ocr` (Priority -1.0) | High-priority OCR plugin extracts image text and generates diagram captions |
| **Outlook Messages (.msg)** | `extract-msg` | Extracts body, headers, and attachments into Markdown |
| **Archives (.zip)** | Internal dispatch | Recursively iterates through archive contents, converting each file |

---

## CLI & Pipeline Workflows

### 1. Command Line Ingestion
```bash
# Convert a single document to markdown
markitdown architecture-spec.pdf -o docs/architecture-spec.md

# Run without installing via uv caching
uvx markitdown system-overview.pptx -o docs/system-overview.md

# Convert with plugins enabled
markitdown --use-plugins diagram.png -o docs/diagram.md

# Pipe directly into a processor
cat financial-report.xlsx | markitdown --extension .xlsx > docs/financial-report.md
```

### 2. Python API with LLM Vision OCR
```python
from markitdown import MarkItDown
from openai import OpenAI

# Initialize with Vision Model for diagram and image analysis
client = OpenAI()
md = MarkItDown(llm_client=client, llm_model="gpt-4o", enable_plugins=True)

# Convert image or visual PDF (access markdown content via result.text_content)
result = md.convert("diagrams/system-architecture.png")

with open("docs/system-architecture.md", "w") as f:
    f.write(result.text_content)
```

### 3. Azure Content Understanding Endpoint
```python
# Single endpoint offload for PDFs, images, audio, and video with structured frontmatter
md = MarkItDown(cu_endpoint="https://<your-service>.cognitiveservices.azure.com/")
result = md.convert("multimodal-spec.pdf")
```

---

## Feeding Ingested Markdown into Knowledge Graph

Once files are converted to Markdown:
1. Place the generated `.md` files in your project's `docs/` or `improver/` directory.
2. Run Graphify / Understand-Anything indexing:
   ```bash
   graphify update
   # or
   /understand
   ```
3. The engine connects the markdown concepts to underlying source code via `INFERRED` semantic edges.

---

## Quality Gates & Verification Checklist

- [ ] Output `.md` file is non-empty and contains valid Markdown syntax
- [ ] Confirmed UTF-8 encoding (validated via `charset-normalizer` / `Magika`)
- [ ] Tables and grids are formatted cleanly without broken pipe delimiters
- [ ] Embedded images/diagrams were processed via `markitdown-ocr` if vision model was enabled
- [ ] Ingested Markdown file placed in `docs/` or `improver/` and indexed into the Knowledge Graph
