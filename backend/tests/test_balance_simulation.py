"""
Unit and integration tests for Simulated Bank Balance feature.
Tests:
1. Initial balance is ₹2,00,000 (2 Lakhs).
2. Payment analysis does NOT deduct balance.
3. Confirmation of ₹5,000 succeeds -> Balance becomes ₹1,95,000.
4. Subsequent confirmation of ₹25,000 succeeds -> Balance becomes ₹1,70,000.
5. Confirmation of ₹1,80,000 fails (INSUFFICIENT_FUNDS) -> Balance stays ₹1,70,000.
6. Confirmation equal to balance (₹1,70,000) succeeds -> Balance becomes ₹0.
7. Confirmation greater than balance when 0 fails -> Balance remains ₹0.
8. Reset balance returns to ₹2,00,000.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_balance_simulation_lifecycle():
    # 0. Reset to known clean baseline of ₹2,00,000
    reset_res = client.post("/api/payment/balance/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["available_balance"] == 200000.0

    # 1. Check initial balance
    bal_res = client.get("/api/payment/balance")
    assert bal_res.status_code == 200
    data = bal_res.json()
    assert data["available_balance"] == 200000.0
    assert data["currency"] == "INR"
    assert data["is_demo"] is True

    # 2. Payment analysis does NOT deduct balance
    analyze_payload = {
        "amount": 5000.0,
        "beneficiary": "arjun@upi",
        "new_beneficiary": False,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 800.0,
        "context_note": "Dinner split"
    }
    ana_res = client.post("/api/payment/analyze", json=analyze_payload)
    assert ana_res.status_code == 200
    txn_id_1 = ana_res.json()["transaction_id"]

    # Balance should still be ₹2,00,000
    bal_res_after_ana = client.get("/api/payment/balance")
    assert bal_res_after_ana.json()["available_balance"] == 200000.0

    # 3. Confirm payment ₹5,000 -> Success -> Balance ₹1,95,000
    conf_1 = client.post("/api/payment/confirm", json={"transaction_id": txn_id_1, "amount": 5000.0})
    assert conf_1.status_code == 200
    res_1 = conf_1.json()
    assert res_1["status"] == "SUCCESS"
    assert res_1["success"] is True
    assert res_1["previous_balance"] == 200000.0
    assert res_1["remaining_balance"] == 195000.0
    assert res_1["deducted"] is True

    # 4. Then payment ₹25,000 -> Success -> Balance ₹1,70,000
    ana_res_2 = client.post("/api/payment/analyze", json={
        "amount": 25000.0,
        "beneficiary": "electronics@upi",
        "new_beneficiary": True,
        "previous_average": 2000.0
    })
    txn_id_2 = ana_res_2.json()["transaction_id"]

    conf_2 = client.post("/api/payment/confirm", json={"transaction_id": txn_id_2, "amount": 25000.0})
    assert conf_2.status_code == 200
    res_2 = conf_2.json()
    assert res_2["status"] == "SUCCESS"
    assert res_2["previous_balance"] == 195000.0
    assert res_2["remaining_balance"] == 170000.0
    assert res_2["deducted"] is True

    # 5. Then payment ₹1,80,000 -> Insufficient Bank Balance -> Balance remains ₹1,70,000
    ana_res_3 = client.post("/api/payment/analyze", json={
        "amount": 180000.0,
        "beneficiary": "luxury.store@upi",
        "new_beneficiary": True,
        "previous_average": 2000.0
    })
    txn_id_3 = ana_res_3.json()["transaction_id"]

    conf_3 = client.post("/api/payment/confirm", json={"transaction_id": txn_id_3, "amount": 180000.0})
    assert conf_3.status_code == 200
    res_3 = conf_3.json()
    assert res_3["status"] == "INSUFFICIENT_FUNDS"
    assert res_3["success"] is False
    assert res_3["remaining_balance"] == 170000.0
    assert res_3["deducted"] is False

    # Check balance endpoint directly
    bal_after_fail = client.get("/api/payment/balance")
    assert bal_after_fail.json()["available_balance"] == 170000.0

    # 6. Payment equal to balance (₹1,70,000) -> Success -> Balance becomes ₹0
    conf_exact = client.post("/api/payment/confirm", json={"amount": 170000.0})
    assert conf_exact.status_code == 200
    res_exact = conf_exact.json()
    assert res_exact["status"] == "SUCCESS"
    assert res_exact["remaining_balance"] == 0.0

    # 7. Payment greater than balance when 0 -> Failed -> Balance remains 0.0
    conf_over = client.post("/api/payment/confirm", json={"amount": 500.0})
    assert conf_over.status_code == 200
    res_over = conf_over.json()
    assert res_over["status"] == "INSUFFICIENT_FUNDS"
    assert res_over["remaining_balance"] == 0.0

    # 8. Reset balance returns to ₹2,00,000
    reset_final = client.post("/api/payment/balance/reset")
    assert reset_final.status_code == 200
    assert reset_final.json()["available_balance"] == 200000.0

    # 9. Top-up / Add Money feature
    topup_res = client.post("/api/payment/balance/topup", json={"amount": 50000.0})
    assert topup_res.status_code == 200
    assert topup_res.json()["available_balance"] == 250000.0

    # 10. Clean reset back to ₹2,00,000
    client.post("/api/payment/balance/reset")

