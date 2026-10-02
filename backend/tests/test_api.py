import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "VeritasAI" in data["service"]

def test_analyze_text():
    sample_text = (
        "In conclusion, it is important to note that modern artificial intelligence "
        "represents a transformative paradigm. Moreover, the technological nuances "
        "underscore a profound testament to scalable engineering."
    )
    response = client.post("/api/v1/analyze/text", json={"text": sample_text, "language": "en"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "metrics" in data
    assert "overall_ai_score" in data["metrics"]
    assert "sentences" in data
    assert len(data["sentences"]) > 0
    assert "forensic_hash" in data["metrics"]

def test_analyze_code():
    code_snippet = """def calculate_sum(items):
    # Calculate total sum of array
    total = 0
    for item in items:
        total += item
    return total
"""
    response = client.post("/api/v1/analyze/code", json={"code": code_snippet, "language": "python"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "metrics" in data
    assert "ast_max_depth" in data["metrics"]
    assert "lines" in data
    assert len(data["lines"]) > 0

def test_export_pdf():
    payload = {
        "title": "Forensic Unit Test",
        "content_type": "text",
        "content": "Short test sample for PDF rendering.",
        "overall_ai_score": 85.0,
        "verdict": "Likely AI-Generated",
        "mean_perplexity": 24.5,
        "burstiness_score": 0.18,
        "forensic_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
    response = client.post("/api/v1/export/pdf", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000

def test_get_history():
    response = client.get("/api/v1/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "forensic_hash" in data[0]

