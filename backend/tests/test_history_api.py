"""
Unit and integration tests for GET /api/history endpoint and MySQL transaction retrieval.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis

client = TestClient(app)


def test_history_endpoint_returns_list():
    """Verify GET /api/history returns a list of transaction records."""
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_history_record_schema():
    """Verify each transaction record contains all expected fields."""
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()

    if len(data) > 0:
        first_item = data[0]
        expected_keys = [
            "id",
            "transaction_ref",
            "beneficiary",
            "payee_name",
            "amount",
            "risk_level",
            "risk_score",
            "action",
            "status",
            "signals",
            "explanation",
        ]
        for key in expected_keys:
            assert key in first_item, f"Expected key '{key}' in history item"


def test_history_filter_by_risk_level():
    """Verify GET /api/history?risk_level=... accurately filters items."""
    # First ensure we have records with different risk levels by analyzing payments
    low_payload = {
        "amount": 350.0,
        "beneficiary": "local.vendor@upi",
        "new_beneficiary": False,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 400.0,
        "context_note": "Tea and snacks"
    }
    high_payload = {
        "amount": 95000.0,
        "beneficiary": "lottery.support@upi",
        "new_beneficiary": True,
        "new_device": True,
        "transactions_last_10_min": 5,
        "previous_average": 1000.0,
        "context_note": "Urgent lottery prize processing fee"
    }

    client.post("/api/payment/analyze", json=low_payload)
    client.post("/api/payment/analyze", json=high_payload)

    # Filter LOW
    res_low = client.get("/api/history?risk_level=LOW")
    assert res_low.status_code == 200
    low_items = res_low.json()
    assert len(low_items) > 0
    for item in low_items:
        assert item["risk_level"] == "LOW"

    # Filter HIGH
    res_high = client.get("/api/history?risk_level=HIGH")
    assert res_high.status_code == 200
    high_items = res_high.json()
    assert len(high_items) > 0
    for item in high_items:
        assert item["risk_level"] == "HIGH"


def test_history_persistence_and_order():
    """Verify that newly analyzed transactions appear at the top (descending order)."""
    unique_note = "Dinner test transaction for order verification"
    payload = {
        "amount": 1200.0,
        "beneficiary": "friend.rahul@okaxis",
        "new_beneficiary": False,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 1500.0,
        "context_note": unique_note
    }

    post_res = client.post("/api/payment/analyze", json=payload)
    assert post_res.status_code == 200
    created_id = post_res.json()["transaction_id"]

    history_res = client.get("/api/history")
    assert history_res.status_code == 200
    items = history_res.json()
    assert len(items) > 0

    # The most recent transaction should have the highest ID and be first
    assert items[0]["id"] == created_id
    assert items[0]["amount"] == 1200.0
    assert items[0]["beneficiary"] == "friend.rahul@okaxis"
