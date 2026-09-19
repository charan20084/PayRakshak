"""
Unit tests for the APP Scam Risk Engine.
Verifies signal extraction, deterministic scoring, and level/action mappings.
"""

import pytest
from app.services.risk_engine import risk_engine


def test_scenario_1_low_risk():
    """
    Scenario 1: Normal transaction
    - Low/typical amount matching historical baseline
    - Known beneficiary
    - Known device
    - Normal frequency
    Expected: LOW -> ALLOW
    """
    data = {
        "amount": 1200.0,
        "beneficiary": "local-grocery@oksbi",
        "new_beneficiary": False,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 1200.0,
        "location_changed": False,
        "unusual_time": False
    }

    result = risk_engine.evaluate_payment(data)

    assert result["risk_level"] == "LOW"
    assert result["recommended_action"] == "ALLOW"
    assert result["risk_score"] < 35.0
    assert len(result["signals"]) == 0
    assert "normal behavioural profile" in result["explanation"].lower()


def test_scenario_2_medium_risk():
    """
    Scenario 2: Suspicious transaction
    - Moderately unusual amount (2.5x - 3x previous average)
    - New beneficiary
    - Known device, normal frequency
    Expected: MEDIUM -> WARN
    """
    data = {
        "amount": 6000.0,
        "beneficiary": "online-store-deals@paytm",
        "new_beneficiary": True,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 2000.0,
        "location_changed": False,
        "unusual_time": False
    }

    result = risk_engine.evaluate_payment(data)

    assert result["risk_level"] == "MEDIUM"
    assert result["recommended_action"] == "WARN"
    assert 35.0 <= result["risk_score"] < 70.0
    assert any("New beneficiary" in s for s in result["signals"])
    assert any("notably higher" in s for s in result["signals"])


def test_scenario_3_high_risk():
    """
    Scenario 3: High-risk APP-scam-like transaction
    - Severe amount deviation (10x historical average)
    - New beneficiary
    - New device
    - Multiple rapid transactions (velocity)
    - Urgent keyword context
    Expected: HIGH -> INTERVENE
    """
    data = {
        "amount": 50000.0,
        "beneficiary": "lottery-dept-claim@fakeupi",
        "new_beneficiary": True,
        "new_device": True,
        "transactions_last_10_min": 4,
        "previous_average": 5000.0,
        "location_changed": True,
        "unusual_time": True,
        "context_note": "Urgent lottery prize fee verification immediate transfer required"
    }

    result = risk_engine.evaluate_payment(data)

    assert result["risk_level"] == "HIGH"
    assert result["recommended_action"] == "INTERVENE"
    assert result["risk_score"] >= 70.0
    assert len(result["signals"]) >= 4
    assert any("significantly above historical average" in s for s in result["signals"])
    assert any("New beneficiary" in s for s in result["signals"])
    assert any("unrecognised device" in s for s in result["signals"])
    assert any("rapid activity" in s for s in result["signals"])
    assert "pre-payment intervention required" in result["explanation"].lower()


def test_different_inputs_produce_different_scores():
    """
    Verifies that the scoring is strictly dynamic and deterministic,
    not returning arbitrary or fixed numbers.
    """
    base = {
        "amount": 1000.0,
        "beneficiary": "friend@upi",
        "previous_average": 1000.0
    }
    score_low = risk_engine.evaluate_payment(base)["risk_score"]

    with_new_payee = {**base, "new_beneficiary": True}
    score_med = risk_engine.evaluate_payment(with_new_payee)["risk_score"]

    with_dev_and_velocity = {**with_new_payee, "new_device": True, "transactions_last_10_min": 5}
    score_high = risk_engine.evaluate_payment(with_dev_and_velocity)["risk_score"]

    assert score_low < score_med < score_high
