"""
Automated APP Scam Risk Engine for PayRakshak (AREA51).

CORE PRINCIPLE:
"Authentication verifies who is authorising the payment.
 Risk analysis evaluates whether the authorised payment appears suspicious."

In Authorised Push Payment (APP) scams, a genuine user is socially engineered
into authorising a transfer. Therefore, OTP/PIN authentication succeeds, but the
transaction pattern exhibits clear contextual anomalies.

No individual signal definitively proves fraud; the engine aggregates
multiple behavioural and contextual indicators into an explainable heuristic score.
"""

import re
from datetime import datetime
from typing import Dict, Any, List, Tuple


# Configurable Risk Weights & Heuristic Thresholds
WEIGHT_SIGNIFICANT_AMOUNT_DEVIATION = 30.0  # Amount >= 5x historical average
WEIGHT_MODERATE_AMOUNT_DEVIATION = 18.0     # Amount >= 2.5x historical average
WEIGHT_SLIGHT_AMOUNT_DEVIATION = 8.0        # Amount >= 1.5x historical average
WEIGHT_HIGH_UNANCHORED_AMOUNT = 15.0        # High amount with no historical baseline

WEIGHT_NEW_BENEFICIARY = 20.0               # First-time payee (high APP indicator)
WEIGHT_NEW_DEVICE = 18.0                    # Unfamiliar device/session
WEIGHT_HIGH_VELOCITY = 25.0                 # >= 4 transactions in last 10 minutes
WEIGHT_MODERATE_VELOCITY = 14.0             # >= 2 transactions in last 10 minutes
WEIGHT_UNUSUAL_TIMING = 12.0                # Transactions in odd hours / flagged timing
WEIGHT_LOCATION_CHANGED = 15.0              # Geographic / network anomaly
WEIGHT_URGENCY_KEYWORD = 15.0               # Pressure / urgency keywords in remarks

# Risk Level Thresholds
THRESHOLD_LOW_MAX = 35.0                    # < 35 -> LOW (ALLOW)
THRESHOLD_MEDIUM_MAX = 70.0                 # 35 to < 70 -> MEDIUM (WARN)
                                            # >= 70 -> HIGH (INTERVENE)

# Suspicious urgency / scam keyword patterns in contextual notes
SCAM_KEYWORDS = [
    r"\burgent\b",
    r"\blottery\b",
    r"\bprize\b",
    r"\brefund\b",
    r"\bverify\b",
    r"\bimmediate\b",
    r"\bcustoms\b",
    r"\bpolice\b",
    r"\bcourier\b",
    r"\bblocked\b",
    r"\bkyc\b",
    r"\bpenalty\b",
    r"\botp\b",
    r"\bticket\b"
]


class RiskEngine:
    """
    Modular, deterministic APP scam risk evaluation engine.
    Computes risk score, level, triggered signals, and explanation.
    """

    def extract_signals(self, data: Dict[str, Any]) -> List[Tuple[str, str, float]]:
        """
        Extract measurable behavioural, transactional, and contextual signals.
        Returns a list of tuples: (signal_code, readable_description, score_weight).
        """
        signals: List[Tuple[str, str, float]] = []

        amount = float(data.get("amount", 0.0))
        previous_avg = float(data.get("previous_average", 0.0))
        new_beneficiary = bool(data.get("new_beneficiary", False))
        new_device = bool(data.get("new_device", False))
        velocity = int(data.get("transactions_last_10_min", 0))
        location_changed = bool(data.get("location_changed", False))
        unusual_time = bool(data.get("unusual_time", False))
        txn_time = data.get("transaction_time")
        context_note = data.get("context_note") or ""

        # A. Transaction Amount Deviation
        if previous_avg > 0:
            ratio = amount / previous_avg
            if ratio >= 5.0:
                signals.append((
                    "AMOUNT_EXTREME_DEVIATION",
                    f"Transaction amount (INR {amount:,.0f}) is significantly above historical average (INR {previous_avg:,.0f}, {ratio:.1f}x)",
                    WEIGHT_SIGNIFICANT_AMOUNT_DEVIATION
                ))
            elif ratio >= 2.5:
                signals.append((
                    "AMOUNT_MODERATE_DEVIATION",
                    f"Transaction amount (INR {amount:,.0f}) is notably higher than historical average (INR {previous_avg:,.0f}, {ratio:.1f}x)",
                    WEIGHT_MODERATE_AMOUNT_DEVIATION
                ))
            elif ratio >= 1.5:
                signals.append((
                    "AMOUNT_SLIGHT_DEVIATION",
                    f"Transaction amount (INR {amount:,.0f}) slightly exceeds normal spending baseline (INR {previous_avg:,.0f})",
                    WEIGHT_SLIGHT_AMOUNT_DEVIATION
                ))
        elif amount >= 25000:
            signals.append((
                "AMOUNT_HIGH_UNANCHORED",
                f"High-value payment (INR {amount:,.0f}) with no prior baseline established",
                WEIGHT_HIGH_UNANCHORED_AMOUNT
            ))

        # B & C. Beneficiary Novelty / History
        if new_beneficiary:
            signals.append((
                "NEW_BENEFICIARY",
                "New beneficiary with no prior transaction history",
                WEIGHT_NEW_BENEFICIARY
            ))

        # D. Device / Session Novelty
        if new_device:
            signals.append((
                "NEW_DEVICE",
                "Transaction initiated from an unrecognised device or session",
                WEIGHT_NEW_DEVICE
            ))

        # E. Rapid Transaction Activity (Velocity)
        if velocity >= 4:
            signals.append((
                "HIGH_VELOCITY",
                f"Unusually rapid activity ({velocity} transactions initiated in last 10 minutes)",
                WEIGHT_HIGH_VELOCITY
            ))
        elif velocity >= 2:
            signals.append((
                "MODERATE_VELOCITY",
                f"Elevated transaction frequency ({velocity} transactions in last 10 minutes)",
                WEIGHT_MODERATE_VELOCITY
            ))

        # F. Unusual Transaction Timing
        is_odd_hours = False
        if isinstance(txn_time, datetime):
            # Midnight to 5 AM considered unusual window
            if 0 <= txn_time.hour < 5:
                is_odd_hours = True

        if unusual_time or is_odd_hours:
            signals.append((
                "UNUSUAL_TIMING",
                "Transaction scheduled outside normal operational hours",
                WEIGHT_UNUSUAL_TIMING
            ))

        # G. Geographic / Network Context
        if location_changed:
            signals.append((
                "LOCATION_ANOMALY",
                "Sudden location deviation detected for current transaction session",
                WEIGHT_LOCATION_CHANGED
            ))

        # H. Contextual Urgency Indicators (Scam Remarks/Keywords)
        if context_note:
            found_keywords = []
            for pattern in SCAM_KEYWORDS:
                if re.search(pattern, context_note, re.IGNORECASE):
                    found_keywords.append(pattern.replace(r"\b", ""))
            if found_keywords:
                keywords_str = ", ".join(found_keywords[:3])
                signals.append((
                    "URGENCY_KEYWORDS",
                    f"Context contains urgency/pressure indicators ('{keywords_str}')",
                    WEIGHT_URGENCY_KEYWORD
                ))

        return signals

    def calculate_risk_score(self, signals: List[Tuple[str, str, float]]) -> float:
        """
        Aggregate signal weights into a bounded score between 0.0 and 100.0.
        """
        raw_score = sum(weight for _, _, weight in signals)
        return round(min(max(raw_score, 0.0), 100.0), 1)

    def determine_level_and_action(self, score: float) -> Tuple[str, str]:
        """
        Map risk score to standard APP risk levels and recommended actions:
        - LOW (< 35): ALLOW
        - MEDIUM (35 to < 70): WARN
        - HIGH (>= 70): INTERVENE
        """
        if score < THRESHOLD_LOW_MAX:
            return "LOW", "ALLOW"
        elif score < THRESHOLD_MEDIUM_MAX:
            return "MEDIUM", "WARN"
        else:
            return "HIGH", "INTERVENE"

    def generate_explanation(self, risk_level: str, action: str, readable_signals: List[str]) -> str:
        """
        Produce a clear, non-technical plain-language explanation of the evaluation.
        """
        if risk_level == "LOW":
            return (
                "Transaction matches normal behavioural profile. "
                "No significant authorised push payment risk indicators detected."
            )
        elif risk_level == "MEDIUM":
            reasons = "; ".join(readable_signals) if readable_signals else "Unusual payment parameters"
            return (
                f"Suspicious transaction characteristics detected ({reasons}). "
                "Review payee details carefully before completing this transfer."
            )
        else:
            reasons = "; ".join(readable_signals) if readable_signals else "Multiple severe risk indicators"
            return (
                f"High-risk pattern detected ({reasons}). "
                "Strong signs of social engineering or push payment deception. "
                "Pre-payment intervention required before confirmation."
            )

    def evaluate_payment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for evaluating a payment:
        1. Extract signals
        2. Calculate risk score
        3. Determine level & recommended action
        4. Synthesize plain-language explanation
        """
        signals = self.extract_signals(data)
        score = self.calculate_risk_score(signals)
        level, action = self.determine_level_and_action(score)
        readable_signals = [desc for _, desc, _ in signals]
        explanation = self.generate_explanation(level, action, readable_signals)

        return {
            "risk_score": score,
            "risk_level": level,
            "signals": readable_signals,
            "explanation": explanation,
            "recommended_action": action,
            "signal_details": [
                {"code": code, "description": desc, "weight": weight}
                for code, desc, weight in signals
            ]
        }


# Global singleton instance
risk_engine = RiskEngine()
