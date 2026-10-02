from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from backend.app.db.database import Base

class ScanRecord(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    content_type = Column(String(20), nullable=False) # 'text' or 'code'
    overall_ai_score = Column(Float, nullable=False)
    verdict = Column(String(50), nullable=False)
    mean_perplexity = Column(Float, nullable=True)
    burstiness_score = Column(Float, nullable=True)
    ast_max_depth = Column(Integer, nullable=True)
    identifier_entropy = Column(Float, nullable=True)
    forensic_hash = Column(String(64), index=True, nullable=False)
    content_preview = Column(Text, nullable=False)
