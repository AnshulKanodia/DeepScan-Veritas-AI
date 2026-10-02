from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=10, description="The prose text to analyze for AI provenance")
    language: Optional[str] = Field("en", description="ISO language code, defaults to en")

class SentenceSpan(BaseModel):
    index: int
    text: str
    start_char: int
    end_char: int
    perplexity: float
    ai_probability: float
    classification: Literal["likely_human", "uncertain", "likely_ai"]
    highlight_color: str

class TextAnalysisMetrics(BaseModel):
    overall_ai_score: float = Field(..., description="Percentage confidence (0 - 100) that text is AI-generated")
    verdict: Literal["Likely Human-Written", "Mixed / Refined", "Likely AI-Generated"]
    mean_perplexity: float
    min_perplexity: float
    max_perplexity: float
    burstiness_score: float
    top10_token_ratio: float
    top100_token_ratio: float
    sentence_count: int
    word_count: int
    forensic_hash: str

class TextAnalysisResponse(BaseModel):
    status: str = "success"
    metrics: TextAnalysisMetrics
    sentences: List[SentenceSpan]

class CodeAnalysisRequest(BaseModel):
    code: str = Field(..., min_length=10, description="The source code snippet to analyze")
    language: Optional[str] = Field("python", description="Language of source code, defaults to python")

class CodeLineSpan(BaseModel):
    line_number: int
    code: str
    ai_probability: float
    classification: Literal["likely_human", "uncertain", "likely_ai"]
    highlight_color: str

class CodeAnalysisMetrics(BaseModel):
    overall_ai_score: float
    verdict: Literal["Likely Human-Written", "Mixed / Refined", "Likely AI-Generated"]
    ast_max_depth: int
    identifier_entropy: float
    cyclomatic_complexity: int
    comment_density_pct: float
    loc_count: int
    forensic_hash: str

class CodeAnalysisResponse(BaseModel):
    status: str = "success"
    metrics: CodeAnalysisMetrics
    lines: List[CodeLineSpan]

class ForensicReportRequest(BaseModel):
    title: Optional[str] = "Forensic Authenticity Audit"
    content_type: Literal["text", "code"] = "text"
    content: str
    overall_ai_score: float
    verdict: str
    mean_perplexity: Optional[float] = None
    burstiness_score: Optional[float] = None
    ast_max_depth: Optional[int] = None
    identifier_entropy: Optional[float] = None
    forensic_hash: str

class ScanHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: str
    content_type: str
    overall_ai_score: float
    verdict: str
    forensic_hash: str
    content_preview: str

