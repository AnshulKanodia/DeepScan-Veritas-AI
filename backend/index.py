import sys
import types
from pathlib import Path

# Add backend directory and parent directory to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
for p in [str(CURRENT_DIR), str(PROJECT_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Alias 'app' as 'backend.app' so absolute imports work inside Vercel container
if "backend" not in sys.modules:
    try:
        import app as _app_pkg
        _backend_pkg = types.ModuleType("backend")
        _backend_pkg.app = _app_pkg
        sys.modules["backend"] = _backend_pkg
        sys.modules["backend.app"] = _app_pkg
    except ImportError:
        pass

from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
