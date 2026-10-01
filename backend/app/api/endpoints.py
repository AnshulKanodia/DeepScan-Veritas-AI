from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from backend.app.api.schemas import (
    TextAnalysisRequest, TextAnalysisResponse,
    CodeAnalysisRequest, CodeAnalysisResponse,
    ForensicReportRequest
)
from backend.app.ml.text_analyzer import engine as text_engine
from backend.app.ml.ast_analyzer import CodeAstAnalyzer
from backend.app.services.pdf_report import generate_forensic_pdf

router = APIRouter(prefix="/api/v1")

@router.post("/analyze/text", response_model=TextAnalysisResponse)
async def analyze_text_endpoint(payload: TextAnalysisRequest):
    """
    Analyzes prose text for AI-generated patterns using sentence-level
    perplexity, burstiness index, and token likelihood rankings.
    """
    if len(payload.text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text payload must contain at least 10 characters.")
    return text_engine.analyze(payload.text)

@router.post("/analyze/code", response_model=CodeAnalysisResponse)
async def analyze_code_endpoint(payload: CodeAnalysisRequest):
    """
    Analyzes source code using Abstract Syntax Tree (AST) depth,
    identifier entropy, and structural uniformity.
    """
    if len(payload.code.strip()) < 10:
        raise HTTPException(status_code=400, detail="Code payload must contain at least 10 characters.")
    return CodeAstAnalyzer.analyze_python_code(payload.code)

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
