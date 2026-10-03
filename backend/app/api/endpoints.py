from typing import List, Optional, Any
import urllib.request
import urllib.error
import base64
import re
from html.parser import HTMLParser
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from app.api.schemas import (
    TextAnalysisRequest, TextAnalysisResponse,
    CodeAnalysisRequest, CodeAnalysisResponse,
    ForensicReportRequest, ScanHistoryItem,
    UrlAnalysisRequest, UrlAnalysisResponse,
    FileExtractRequest, FileExtractResponse
)
from app.ml.text_analyzer import engine as text_engine
from app.ml.ast_analyzer import CodeAstAnalyzer
from app.services.pdf_report import generate_forensic_pdf

try:
    from sqlalchemy.orm import Session
    from app.db.database import get_db
    from app.db.models import ScanRecord
except Exception as e:
    Session = Any
    def get_db():
        yield None
    class ScanRecord:
        def __init__(self, **kwargs):
            pass

class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.title = "Extracted Document"
        self.in_title = False
        self.ignore_tags = {'script', 'style', 'noscript', 'header', 'footer', 'nav', 'svg'}
        self.current_tag = None

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        self.current_tag = tag_lower
        if tag_lower == 'title':
            self.in_title = True

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower == 'title':
            self.in_title = False
        if tag_lower == self.current_tag:
            self.current_tag = None

    def handle_data(self, data):
        cleaned = data.strip()
        if not cleaned:
            return
        if self.in_title:
            self.title = cleaned
        elif self.current_tag not in self.ignore_tags:
            self.text_parts.append(cleaned)

    def get_text(self):
        return "\n\n".join(self.text_parts)

router = APIRouter(prefix="/api/v1")

@router.post("/analyze/text", response_model=TextAnalysisResponse)
async def analyze_text_endpoint(payload: TextAnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyzes prose text for AI-generated patterns using sentence-level
    perplexity, burstiness index, and token likelihood rankings.
    """
    if len(payload.text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text payload must contain at least 10 characters.")
    
    result = text_engine.analyze(payload.text)

    # Persist scan to database for audit history
    try:
        record = ScanRecord(
            content_type="text",
            overall_ai_score=result.metrics.overall_ai_score,
            verdict=result.metrics.verdict,
            mean_perplexity=result.metrics.mean_perplexity,
            burstiness_score=result.metrics.burstiness_score,
            forensic_hash=result.metrics.forensic_hash,
            content_preview=payload.text[:200]
        )
        db.add(record)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[!] Warning: Scan persistence failed: {e}")

    return result

@router.post("/analyze/code", response_model=CodeAnalysisResponse)
async def analyze_code_endpoint(payload: CodeAnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyzes source code using Abstract Syntax Tree (AST) depth,
    identifier entropy, and structural uniformity across multiple languages.
    """
    if len(payload.code.strip()) < 10:
        raise HTTPException(status_code=400, detail="Code payload must contain at least 10 characters.")
    
    result = CodeAstAnalyzer.analyze_code(payload.code, payload.language or "python")

    # Persist code scan to database
    try:
        record = ScanRecord(
            content_type="code",
            overall_ai_score=result.metrics.overall_ai_score,
            verdict=result.metrics.verdict,
            ast_max_depth=result.metrics.ast_max_depth,
            identifier_entropy=result.metrics.identifier_entropy,
            forensic_hash=result.metrics.forensic_hash,
            content_preview=payload.code[:200]
        )
        db.add(record)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[!] Warning: Code scan persistence failed: {e}")

    return result

@router.get("/history", response_model=List[ScanHistoryItem])
async def get_scan_history(limit: int = 15, db: Session = Depends(get_db)):
    """
    Retrieves the latest forensic scan records for audit history.
    """
    records = db.query(ScanRecord).order_by(ScanRecord.created_at.desc()).limit(limit).all()
    return [
        ScanHistoryItem(
            id=r.id,
            created_at=r.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if r.created_at else "",
            content_type=r.content_type,
            overall_ai_score=r.overall_ai_score,
            verdict=r.verdict,
            forensic_hash=r.forensic_hash,
            content_preview=r.content_preview
        )
        for r in records
    ]

@router.post("/export/pdf")
async def export_forensic_pdf_endpoint(payload: ForensicReportRequest):
    """
    Generates and streams an in-memory verifiable PDF forensic report.
    Zero cloud storage required ($0 cost).
    """
    pdf_buffer = generate_forensic_pdf(payload)
    filename = f"forensic_audit_{payload.forensic_hash[:8]}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/analyze/url", response_model=UrlAnalysisResponse)
async def analyze_url_endpoint(payload: UrlAnalysisRequest):
    """
    Fetches web content or raw code from a URL, strips boilerplate,
    and runs comprehensive forensic analysis.
    """
    target_url = payload.url.strip()
    if not target_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid URL format. Must start with http:// or https://")

    try:
        req = urllib.request.Request(
            target_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7"
            }
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            content_type = response.headers.get("Content-Type", "")
            raw_bytes = response.read(500000)  # Max 500KB
            
            try:
                decoded_html = raw_bytes.decode("utf-8")
            except UnicodeDecodeError:
                decoded_html = raw_bytes.decode("latin-1", errors="replace")

        if "text/html" in content_type or "<html" in decoded_html.lower():
            parser = HTMLTextExtractor()
            parser.feed(decoded_html)
            extracted_text = parser.get_text()
            title = parser.title
        else:
            extracted_text = decoded_html
            title = target_url.split("/")[-1] or "Raw URL Document"

        if len(extracted_text.strip()) < 15:
            raise HTTPException(status_code=422, detail="Extracted document contains insufficient text content.")

        # Run text engine analysis
        analysis_result = text_engine.analyze(extracted_text[:12000])

        return UrlAnalysisResponse(
            status="success",
            url=target_url,
            title=title,
            extracted_text=extracted_text[:12000],
            analysis=analysis_result
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch content from URL: {str(e)}")

@router.post("/extract-file", response_model=FileExtractResponse)
async def extract_file_endpoint(payload: FileExtractRequest):
    """
    Extracts text or source code from uploaded files (.txt, .py, .js, .ts, .pdf, .md, etc.)
    with automatic language and mode detection.
    """
    filename = payload.filename or "unknown_file.txt"
    ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""

    code_ext_map = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".java": "java",
        ".cpp": "cpp",
        ".c": "cpp",
        ".cs": "csharp",
        ".go": "go",
        ".rs": "rust"
    }

    detected_mode = "code" if ext in code_ext_map else "text"
    language = code_ext_map.get(ext, "python" if detected_mode == "code" else "markdown")

    raw_bytes = b""
    if payload.raw_text:
        content = payload.raw_text
        size = len(content.encode("utf-8"))
    elif payload.content_base64:
        try:
            b64_str = payload.content_base64
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            raw_bytes = base64.b64decode(b64_str)
            size = len(raw_bytes)
        except Exception:
            raw_bytes = b""
            size = 0
            content = ""
    else:
        content = ""
        size = 0

    # Extract PDF text using pypdf with stream fallback
    if ext == ".pdf" and raw_bytes:
        try:
            import io
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
            extracted_pages = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    extracted_pages.append(t)
            content = "\n\n".join(extracted_pages)
        except Exception:
            text_matches = re.findall(r'\(([^\(\)]{3,})\)', raw_bytes.decode('latin-1', errors='ignore'))
            content = " ".join(text_matches[:300]) if text_matches else ""

    # Extract DOCX text using built-in zipfile & XML parser
    elif ext in [".docx", ".doc"] and raw_bytes:
        try:
            import io
            import zipfile
            import xml.etree.ElementTree as ET
            with zipfile.ZipFile(io.BytesIO(raw_bytes)) as z:
                xml_content = z.read("word/document.xml")
                root = ET.fromstring(xml_content)
                paragraphs = []
                for p in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                    texts = [t.text for t in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t") if t.text]
                    if texts:
                        paragraphs.append("".join(texts))
                content = "\n\n".join(paragraphs)
        except Exception:
            clean_strs = re.findall(r'[A-Za-z0-9\s,\.\?!]{4,}', raw_bytes.decode('latin-1', errors='ignore'))
            content = " ".join(clean_strs[:400])

    elif not payload.raw_text and raw_bytes:
        try:
            content = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content = raw_bytes.decode("latin-1", errors="replace")

    return FileExtractResponse(
        status="success",
        filename=filename,
        content=content.strip(),
        size=size,
        detected_mode=detected_mode,
        language=language
    )
