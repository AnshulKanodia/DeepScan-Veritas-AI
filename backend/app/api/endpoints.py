from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.schemas import (
    TextAnalysisRequest, TextAnalysisResponse,
    CodeAnalysisRequest, CodeAnalysisResponse,
    ForensicReportRequest, ScanHistoryItem
)
from app.ml.text_analyzer import engine as text_engine
from app.ml.ast_analyzer import CodeAstAnalyzer
from app.services.pdf_report import generate_forensic_pdf
from app.db.database import get_db
from app.db.models import ScanRecord

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
        # Logging without blocking analysis response
        print(f"[!] Warning: Scan persistence failed: {e}")

    return result

@router.post("/analyze/code", response_model=CodeAnalysisResponse)
async def analyze_code_endpoint(payload: CodeAnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyzes source code using Abstract Syntax Tree (AST) depth,
    identifier entropy, and structural uniformity.
    """
    if len(payload.code.strip()) < 10:
        raise HTTPException(status_code=400, detail="Code payload must contain at least 10 characters.")
    
    result = CodeAstAnalyzer.analyze_python_code(payload.code)

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
