"""
Tests for Gemini AI Contextual Analysis Service (Phase 3).
Verifies:
1. Gemini service success
2. Gemini invalid / unparseable response handling
3. Gemini API failure / HTTP error handling
4. Missing / empty API key handling
5. Risk Engine preserves full ownership of numerical score
6. End-to-end API resilience when Gemini is unavailable
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.gemini_service import GeminiService, clean_json_response
from app.services.risk_engine import risk_engine
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_clean_json_response():
    """Verify markdown code fences are stripped correctly."""
    raw = "```json\n{\"contextual_risk\": \"HIGH\", \"app_indicators\": [\"impersonation\"], \"explanation\": \"Risky\", \"safety_checks\": [\"Verify\"]}\n```"
    cleaned = clean_json_response(raw)
    assert cleaned["contextual_risk"] == "HIGH"
    assert "impersonation" in cleaned["app_indicators"]


@pytest.mark.anyio
async def test_gemini_missing_api_key():
    """Verify missing API key safely triggers fallback without raising exception."""
    service = GeminiService(api_key="")
    result = await service.analyze_context(
        transaction_data={"amount": 1000},
        signals=[],
        risk_level="LOW"
    )
    assert result["available"] is False
    assert "unavailable" in result["explanation"].lower() or "not configured" in result["explanation"].lower()
    assert len(result["safety_checks"]) > 0


@pytest.mark.anyio
async def test_gemini_success_mocked():
    """Verify structured response parsing on Gemini HTTP 200 response."""
    service = GeminiService(api_key="mock_key_test_123")

    mock_gemini_json = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": (
                                '{\n'
                                '  "contextual_risk": "HIGH",\n'
                                '  "app_indicators": ["Impersonation and lottery lure pattern"],\n'
                                '  "explanation": "Context combines unfamiliar recipient with extreme urgency.",\n'
                                '  "safety_checks": ["Call recipient on verified phone number"]\n'
                                '}'
                            )
                        }
                    ]
                }
            }
        ]
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_gemini_json

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        result = await service.analyze_context(
            transaction_data={"amount": 50000, "context_note": "Urgent lottery fee"},
            signals=["New beneficiary", "Extreme amount deviation"],
            risk_level="HIGH"
        )

        assert result["available"] is True
        assert result["contextual_risk"] == "HIGH"
        assert "Impersonation and lottery lure pattern" in result["app_indicators"]
        assert "Call recipient on verified phone number" in result["safety_checks"]


@pytest.mark.anyio
async def test_gemini_invalid_json_fallback():
    """Verify malformed JSON response from Gemini falls back safely."""
    service = GeminiService(api_key="mock_key_test_123")

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "THIS IS NOT JSON AT ALL"}]}}]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        result = await service.analyze_context(
            transaction_data={"amount": 5000},
            signals=["New beneficiary"],
            risk_level="MEDIUM"
        )

        assert result["available"] is False
        assert "format was unparseable" in result["explanation"]


@pytest.mark.anyio
async def test_gemini_api_http_error_fallback():
    """Verify Gemini API HTTP 500/403/429 falls back safely without crashing."""
    service = GeminiService(api_key="mock_key_test_123")

    mock_response = MagicMock()
    mock_response.status_code = 503
    mock_response.text = "Service Unavailable"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        result = await service.analyze_context(
            transaction_data={"amount": 5000},
            signals=[],
            risk_level="LOW"
        )

        assert result["available"] is False
        assert "temporarily unavailable" in result["explanation"]


def test_api_payment_analyze_gemini_integration():
    """
    Verify full /api/payment/analyze workflow includes ai_analysis
    and that the numerical risk score remains 100% deterministic.
    """
    payload = {
        "amount": 75000.0,
        "beneficiary": "lottery-dept-official@fakeupi",
        "new_beneficiary": True,
        "new_device": True,
        "transactions_last_10_min": 4,
        "previous_average": 5000.0,
        "location_changed": True,
        "unusual_time": True,
        "context_note": "Urgent lottery prize verification fee"
    }

    mock_ai = {
        "available": True,
        "contextual_risk": "HIGH",
        "app_indicators": ["Urgent lottery fee impersonation scam"],
        "explanation": "Multiple high-severity contextual pressure signals detected.",
        "safety_checks": ["Do not transfer fees to claim lottery prizes."]
    }

    with patch("app.services.gemini_service.gemini_service.analyze_context", new_callable=AsyncMock) as mock_ai_call:
        mock_ai_call.return_value = mock_ai

        response = client.post("/api/payment/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()

        # 1. Deterministic score ownership check
        assert data["risk_score"] >= 70.0
        assert data["risk_level"] == "HIGH"
        assert data["recommended_action"] == "INTERVENE"

        # 2. AI contextual analysis included
        assert "ai_analysis" in data
        assert data["ai_analysis"]["available"] is True
        assert data["ai_analysis"]["contextual_risk"] == "HIGH"
        assert len(data["ai_analysis"]["app_indicators"]) > 0
        assert len(data["ai_analysis"]["safety_checks"]) > 0


def test_api_payment_analyze_gemini_fallback_when_failing():
    """
    Verify payment analysis succeeds with Phase 2 score even when Gemini fails completely.
    """
    payload = {
        "amount": 1200.0,
        "beneficiary": "groceries@oksbi",
        "new_beneficiary": False,
        "previous_average": 1200.0
    }

    with patch("app.services.gemini_service.gemini_service.analyze_context", new_callable=AsyncMock) as mock_ai_call:
        # Simulate network failure or timeout inside gemini_service
        mock_ai_call.return_value = {
            "available": False,
            "contextual_risk": "LOW",
            "app_indicators": [],
            "explanation": "Contextual AI analysis timed out.",
            "safety_checks": ["Verify recipient before payment."]
        }

        response = client.post("/api/payment/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()

        # Engine decision is unaffected
        assert data["risk_score"] == 0.0
        assert data["risk_level"] == "LOW"
        assert data["recommended_action"] == "ALLOW"
        assert data["ai_analysis"]["available"] is False
        assert "timed out" in data["ai_analysis"]["explanation"]
