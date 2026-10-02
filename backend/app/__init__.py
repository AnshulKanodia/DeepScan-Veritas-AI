import sys
import types

# Ensure 'backend.app' is aliased in sys.modules when running in serverless environments
# where the root directory is 'backend'
if "backend" not in sys.modules:
    _backend_pkg = types.ModuleType("backend")
    _this_module = sys.modules.get(__name__)
    if _this_module:
        _backend_pkg.app = _this_module
        sys.modules["backend"] = _backend_pkg
        sys.modules["backend.app"] = _this_module
