import os
import sys
from pathlib import Path

# Add backend directory and project root to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
for p in [str(CURRENT_DIR), str(BACKEND_DIR), str(PROJECT_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Alias 'app' as 'backend.app' so absolute imports work inside Vercel container
import types
if "backend" not in sys.modules:
    try:
        import app as _app_pkg
        _backend_pkg = types.ModuleType("backend")
        _backend_pkg.app = _app_pkg
        sys.modules["backend"] = _backend_pkg
        sys.modules["backend.app"] = _app_pkg
    except ImportError:
        pass

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.app.db.database import Base, engine
    from backend.app.db.models import ScanRecord
    from backend.app.api.endpoints import router as api_router
except ImportError:
    from app.db.database import Base, engine
    from app.db.models import ScanRecord
    from app.api.endpoints import router as api_router

# Safely initialize database tables without crashing on serverless boot
try:
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

# Mount router: handles both /api/v1/... (if path preserved) and /v1/... (if Vercel rewrites strip /api)
app.include_router(api_router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)
