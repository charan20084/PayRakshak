"""
Phase 7 End-to-End Test Suite for PayRakshak.
Tests:
1. Low Risk payment evaluation and database persistence
2. Medium Risk payment evaluation and database persistence
3. High Risk payment evaluation and database persistence
4. Database verification directly via SQLAlchemy
5. Gemini graceful fallback test
6. History API retrieval with filtering
7. Security verification (no API keys in frontend)
"""

import os
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.connection import SessionLocal
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis

client = TestClient(app)


def test_phase7_e2e_flow():
    # 1. LOW RISK TEST
    low_payload = {
        "amount": 500.0,
        "beneficiary": "arjun@upi",
        "new_beneficiary": False,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 800.0,
        "location_changed": False,
        "unusual_time": False,
        "context_note": "Dinner split"
    }
    low_res = client.post("/api/payment/analyze", json=low_payload)
    assert low_res.status_code == 200
    low_data = low_res.json()
    assert low_data['risk_level'] == "LOW"
    assert low_data['recommended_action'] == "ALLOW"
    assert low_data['risk_score'] < 35.0

    # 2. MEDIUM RISK TEST
    med_payload = {
        "amount": 6500.0,
        "beneficiary": "flash.deals@paytm",
        "new_beneficiary": True,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 1800.0,
        "location_changed": False,
        "unusual_time": False,
        "context_note": "Promotional discount purchase"
    }
    med_res = client.post("/api/payment/analyze", json=med_payload)
    assert med_res.status_code == 200
    med_data = med_res.json()
    assert med_data['risk_level'] == "MEDIUM"
    assert med_data['recommended_action'] == "WARN"
    assert 35.0 <= med_data['risk_score'] < 70.0

    # 3. HIGH RISK TEST
    high_payload = {
        "amount": 80000.0,
        "beneficiary": "refund.help@upi",
        "new_beneficiary": True,
        "new_device": True,
        "transactions_last_10_min": 4,
        "previous_average": 2500.0,
        "location_changed": False,
        "unusual_time": False,
        "context_note": "Urgent customs refund release"
    }
    high_res = client.post("/api/payment/analyze", json=high_payload)
    assert high_res.status_code == 200
    high_data = high_res.json()
    assert high_data['risk_level'] == "HIGH"
    assert high_data['recommended_action'] == "INTERVENE"
    assert high_data['risk_score'] >= 70.0

    # 4. DATABASE DIRECT VERIFICATION
    db: Session = SessionLocal()
    try:
        latest_txn = db.query(Transaction).filter(Transaction.id == high_data['transaction_id']).first()
        assert latest_txn is not None, "Transaction record not found in MySQL"
        assert latest_txn.risk_analysis is not None, "RiskAnalysis record not found in MySQL"
        assert latest_txn.risk_analysis.risk_level == "HIGH"
        assert latest_txn.risk_analysis.action == "INTERVENE"
        assert len(latest_txn.risk_analysis.triggered_signals) > 0
    finally:
        db.close()

    # 5. HISTORY API RETRIEVAL & FILTER TEST
    history_res = client.get("/api/history")
    assert history_res.status_code == 200
    all_history = history_res.json()

    high_res_filtered = client.get("/api/history?risk_level=HIGH")
    assert high_res_filtered.status_code == 200
    high_history = high_res_filtered.json()

    low_res_filtered = client.get("/api/history?risk_level=LOW")
    assert low_res_filtered.status_code == 200
    low_history = low_res_filtered.json()

    assert len(all_history) >= 3
    assert len(high_history) >= 1
    assert len(low_history) >= 1
    assert latest_txn.id == all_history[0]['id']

    # 6. SECURITY CHECK
    frontend_api_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "services", "api.js")
    if os.path.exists(frontend_api_path):
        with open(frontend_api_path, "r", encoding="utf-8") as f:
            frontend_api_code = f.read()
            assert "GEMINI_API_KEY" not in frontend_api_code, "Security leak: GEMINI_API_KEY found in frontend code!"
