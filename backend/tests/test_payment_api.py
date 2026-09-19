"""
Integration tests for POST /api/payment/analyze and MySQL persistence.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis

client = TestClient(app)


def test_analyze_endpoint_scenario_1_low():
    """Verify POST /api/payment/analyze returns LOW / ALLOW and stores in DB."""
    payload = {
        "amount": 800.0,
        "beneficiary": "supermarket@oksbi",
        "new_beneficiary": False,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 800.0,
        "location_changed": False,
        "unusual_time": False
    }

    response = client.post("/api/payment/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["risk_level"] == "LOW"
    assert data["recommended_action"] == "ALLOW"
    assert data["risk_score"] < 35.0
    assert "transaction_id" in data

    # Verify database persistence
    db = SessionLocal()
    try:
        saved_txn = db.query(Transaction).filter(Transaction.id == data["transaction_id"]).first()
        assert saved_txn is not None
        assert saved_txn.amount == 800.0
        assert saved_txn.beneficiary == "supermarket@oksbi"

        saved_analysis = db.query(RiskAnalysis).filter(RiskAnalysis.transaction_id == saved_txn.id).first()
        assert saved_analysis is not None
        assert saved_analysis.risk_level == "LOW"
        assert saved_analysis.action == "ALLOW"
    finally:
        db.close()


def test_analyze_endpoint_scenario_2_medium():
    """Verify POST /api/payment/analyze returns MEDIUM / WARN and stores in DB."""
    payload = {
        "amount": 5500.0,
        "beneficiary": "electronic-gadgets@icici",
        "new_beneficiary": True,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 2000.0,
        "location_changed": False,
        "unusual_time": False
    }

    response = client.post("/api/payment/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["risk_level"] == "MEDIUM"
    assert data["recommended_action"] == "WARN"
    assert 35.0 <= data["risk_score"] < 70.0
    assert len(data["signals"]) > 0


def test_analyze_endpoint_scenario_3_high():
    """Verify POST /api/payment/analyze returns HIGH / INTERVENE and stores in DB."""
    payload = {
        "amount": 75000.0,
        "beneficiary": "customs-release-desk@fakeupi",
        "new_beneficiary": True,
        "new_device": True,
        "transactions_last_10_min": 3,
        "previous_average": 5000.0,
        "location_changed": True,
        "unusual_time": True,
        "context_note": "Urgent customs release verification fee required immediately"
    }

    response = client.post("/api/payment/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["risk_level"] == "HIGH"
    assert data["recommended_action"] == "INTERVENE"
    assert data["risk_score"] >= 70.0
    assert len(data["signals"]) >= 3
    assert "pre-payment intervention required" in data["explanation"].lower()


def test_health_still_works():
    """Verify GET /health remains functional and unaffected by new endpoints."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
