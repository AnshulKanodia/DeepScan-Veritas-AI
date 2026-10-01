import os
import sys
from pathlib import Path

# Add project root to sys.path so 'backend' package imports work cleanly
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.endpoints import router as api_router

app = FastAPI(
    title="Veritas AI / DeepScan Forensic Detection API",
    description="Statistical & Machine Learning Engine for AI-Generated Text and Source Code Forensics.",
    version="1.0.0"
)

# CORS configuration for Vercel and local development
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
def health_check():
    """Endpoint for Hugging Face Spaces health monitoring & frontend keep-alive pings."""
    return {
        "status": "healthy",
        "service": "VeritasAI Forensic Engine",
        "version": "1.0.0",
        "runtime": "CPU / ONNX-Optimized"
    }

app.include_router(api_router)

if __name__ == "__main__":
    # Port 7860 is the default required port for Hugging Face Spaces Docker
    port = int(os.getenv("PORT", 7860))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)
