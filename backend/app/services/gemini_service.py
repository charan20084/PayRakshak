"""
Gemini AI Contextual Analysis Service for PayRakshak (AREA51).

CORE RESPONSIBILITY:
Gemini acts strictly as an AI contextual-analysis and plain-language explanation component.
It receives:
- Transaction metadata
- Behavioral signals detected by the Phase 2 deterministic risk engine
- User-provided payment context / chat note

Gemini DOES NOT:
- Authorize, execute, or cancel payments
- Directly set or override the deterministic numerical risk_score
- Decide fraud on vague intuition
- Expose the GEMINI_API_KEY to clients or logs

FALLBACK GUARANTEE:
If the API key is missing, network times out, or response format is invalid,
the service returns a safe fallback without disrupting the transaction workflow.
"""

import json
import logging
import re
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# Official Gemini API Endpoint
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

SYSTEM_INSTRUCTION = (
    "You are a contextual risk-analysis assistant for an Authorised Push Payment (APP) scam detection system.\n"
    "Analyze the supplied transaction context and previously detected behavioural signals.\n"
    "Rules:\n"
    "1. Do not assume that an unusual transaction is automatically fraudulent.\n"
    "2. Do not invent facts that are not supplied in the input context.\n"
    "3. Identify contextual patterns that could be consistent with an APP scam (e.g., impersonation, lottery/refund lures, urgency pressure).\n"
    "4. Explain the reasoning clearly, concisely, and conservatively in plain language.\n"
    "5. You must NOT authorize, execute, or cancel payments.\n"
    "6. Return ONLY a valid JSON object matching this exact schema:\n"
    "{\n"
    '  "contextual_risk": "LOW" | "MEDIUM" | "HIGH",\n'
    '  "app_indicators": ["list of specific contextual scam indicators observed"],\n'
    '  "explanation": "concise explanation of why this combination may or may not be concerning",\n'
    '  "safety_checks": ["actionable questions or verification steps the user should check before sending money"]\n'
    "}"
)


def clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Strip markdown code fence wrapper if present and parse JSON."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n", "", text)
        text = re.sub(r"\n```$", "", text)
    return json.loads(text.strip())


class GeminiService:
    """
    Service responsible for communicating with the Gemini API to provide
    contextual risk analysis and safety explanations.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (api_key or settings.GEMINI_API_KEY or "").strip()
        self.is_configured = bool(self.api_key)

    def get_fallback_analysis(self, reason: str = "Contextual AI analysis is temporarily unavailable.") -> Dict[str, Any]:
        """Safe fallback response when Gemini is unavailable, unconfigured, or errors out."""
        return {
            "available": False,
            "contextual_risk": "LOW",
            "app_indicators": [],
            "explanation": reason,
            "safety_checks": [
                "Verify beneficiary details independently before sending funds.",
                "Ensure you know and trust the recipient."
            ]
        }

    async def analyze_context(
        self,
        transaction_data: Dict[str, Any],
        signals: List[str],
        risk_level: str
    ) -> Dict[str, Any]:
        """
        Send transaction context and detected signals to Gemini for contextual appraisal.
        Returns a structured dictionary with contextual_risk, app_indicators, explanation, and safety_checks.
        """
        if not self.is_configured:
            logger.info("[GeminiService] GEMINI_API_KEY is not configured. Using fallback explanation.")
            return self.get_fallback_analysis("Contextual AI analysis unavailable (API key not configured).")

        # Build prompt payload
        prompt_content = {
            "transaction_details": {
                "amount": transaction_data.get("amount"),
                "beneficiary": transaction_data.get("beneficiary"),
                "new_beneficiary": transaction_data.get("new_beneficiary", False),
                "new_device": transaction_data.get("new_device", False),
                "transactions_last_10_min": transaction_data.get("transactions_last_10_min", 0),
                "previous_average": transaction_data.get("previous_average", 0.0),
                "location_changed": transaction_data.get("location_changed", False),
                "unusual_time": transaction_data.get("unusual_time", False),
                "context_note": transaction_data.get("context_note") or "None provided"
            },
            "deterministic_engine_output": {
                "detected_signals": signals,
                "risk_level": risk_level
            }
        }

        user_prompt = (
            f"Analyze this payment context and detected signals for potential APP scam patterns:\n\n"
            f"{json.dumps(prompt_content, indent=2, default=str)}\n\n"
            f"Return ONLY valid JSON according to instructions."
        )

        request_body = {
            "contents": [
                {
                    "parts": [{"text": user_prompt}]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": SYSTEM_INSTRUCTION}]
            },
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 600,
                "responseMimeType": "application/json"
            }
        }

        url = f"{GEMINI_API_URL}?key={self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(url, json=request_body)

            if response.status_code != 200:
                logger.warning(f"[GeminiService] Gemini API returned HTTP {response.status_code}: {response.text[:200]}")
                return self.get_fallback_analysis("Contextual AI analysis temporarily unavailable.")

            res_json = response.json()
            candidates = res_json.get("candidates", [])
            if not candidates:
                return self.get_fallback_analysis("Contextual AI returned empty candidates.")

            part_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            parsed = clean_json_response(part_text)

            # Validate required fields
            contextual_risk = parsed.get("contextual_risk", risk_level).upper()
            if contextual_risk not in ["LOW", "MEDIUM", "HIGH"]:
                contextual_risk = risk_level

            app_indicators = parsed.get("app_indicators") or []
            if not isinstance(app_indicators, list):
                app_indicators = [str(app_indicators)]

            safety_checks = parsed.get("safety_checks") or []
            if not isinstance(safety_checks, list):
                safety_checks = [str(safety_checks)]

            explanation = parsed.get("explanation") or "Contextual analysis completed."

            return {
                "available": True,
                "contextual_risk": contextual_risk,
                "app_indicators": app_indicators,
                "explanation": str(explanation),
                "safety_checks": safety_checks
            }

        except httpx.TimeoutException:
            logger.warning("[GeminiService] Request timed out after 8s.")
            return self.get_fallback_analysis("Contextual AI analysis timed out.")
        except json.JSONDecodeError as jde:
            logger.warning(f"[GeminiService] Failed to parse JSON response from Gemini: {jde}")
            return self.get_fallback_analysis("Contextual AI response format was unparseable.")
        except Exception as exc:
            logger.warning(f"[GeminiService] Unexpected error in Gemini contextual analysis: {exc}")
            return self.get_fallback_analysis("Contextual AI analysis encountered an error.")


# Singleton service instance
gemini_service = GeminiService()
