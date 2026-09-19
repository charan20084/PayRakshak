"""Explanation Service.

Translates detected risk flags into clear, plain-language, non-jargony pre-payment warnings.
"""

from typing import List
from app.schemas.risk import RiskReason

class ExplanationService:
    """Service to produce user-friendly safety warnings before UPI PIN entry."""

    def generate_warning(self, risk_level: str, reasons: List[RiskReason]) -> str:
        """
        Produce actionable advice explaining why a transaction is high or medium risk.
        """
        if risk_level == "LOW" or not reasons:
            return "No suspicious patterns detected. Please verify payee details before confirming."

        # Structured placeholder explanation
        warning_lines = [
            "Caution: Potential payment safety concern detected before you enter your UPI PIN.",
        ]
        for reason in reasons:
            warning_lines.append(f"- {reason.description}")

        warning_lines.append(
            "Remember: Real bank officials, customer support, or lotteries will never ask you "
            "to pay money or enter your UPI PIN to receive funds or refunds."
        )
        return "\n".join(warning_lines)

explanation_service = ExplanationService()
