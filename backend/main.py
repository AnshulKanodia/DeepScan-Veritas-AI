import os
import sys
from pathlib import Path

# Add backend directory to sys.path so 'app' is found directly
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

try:
    from app.db.database import Base, engine
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[!] Warning: Table creation deferred: {e}")

app = FastAPI(
    title="Veritas AI / DeepScan Forensic Detection API",
    description="Statistical & Machine Learning Engine for AI-Generated Text and Source Code Forensics.",
    version="1.0.0"
)

# CORS configuration
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    """Health check endpoint for Vercel, HF Spaces, and frontend keep-alive."""
    return {
        "status": "healthy",
        "service": "VeritasAI Forensic Engine",
        "version": "1.0.0",
        "runtime": "Cloud / Serverless"
    }

# Mount router: handles /api/v1/...
app.include_router(api_router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
