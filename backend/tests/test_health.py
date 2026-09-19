# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    """Verify GET /api/health returns status ok and service AREA51 API."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "AREA51 API"

def test_root_endpoint():
    """Verify root endpoint returns basic info and links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "health" in data
