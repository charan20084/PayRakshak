"""
Simulated transaction history endpoints for PayRakshak (AREA51).
Retrieves simulated transactions and persisted risk analyses from MySQL database.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis

router = APIRouter(prefix="/api/history", tags=["History"])

# Baseline synthetic demo transactions for demo presentation when database has no records
SYNTHETIC_DEMO_SEED = [
    {
        "id": 901,
        "transaction_ref": "TXN000901",
        "beneficiary": "refund.help@upi",
        "payee_name": "Refund Help Desk",
        "amount": 80000.0,
        "risk_level": "HIGH",
        "risk_score": 100.0,
        "action": "INTERVENE",
        "status": "INTERVENED / SAFEGUARDED",
        "signals": [
            "Transaction amount (INR 80,000) is significantly above historical average (INR 2,500, 32.0x)",
            "New beneficiary with no prior transaction history",
            "Transaction initiated from an unrecognised device or session",
            "Unusually rapid activity (4 transactions initiated in last 10 minutes)",
            "Context contains urgency/pressure indicators ('urgent, refund, customs')"
        ],
        "explanation": "Multiple high-risk behavioural and contextual signals detected. Review required before proceeding.",
        "ai_analysis": {
            "available": True,
            "contextual_risk": "HIGH",
            "app_indicators": ["Excessive refund request", "Urgent pressure keyword"],
            "explanation": "High contextual risk: typical accidental overpayment refund lure pattern.",
            "safety_checks": [
                "Verify beneficiary details independently via bank phone or statement.",
                "Confirm whether funds were genuinely received in your bank account."
            ]
        },
        "context_note": "Urgent customs refund verification release",
        "created_at": "2026-09-18T22:30:00Z"
    },
    {
        "id": 902,
        "transaction_ref": "TXN000902",
        "beneficiary": "flash.deals@paytm",
        "payee_name": "Flash Deals Outlet",
        "amount": 6500.0,
        "risk_level": "MEDIUM",
        "risk_score": 38.0,
        "action": "WARN",
        "status": "WARNED / REVIEWED",
        "signals": [
            "Transaction amount (INR 6,500) is notably higher than historical average (INR 1,800, 3.6x)",
            "New beneficiary with no prior transaction history"
        ],
        "explanation": "Elevated payment amount to first-time beneficiary. Cautionary review recommended.",
        "ai_analysis": {
            "available": True,
            "contextual_risk": "MEDIUM",
            "app_indicators": ["New merchant payee"],
            "explanation": "Transfer amount exceeds normal baseline for an unverified merchant.",
            "safety_checks": [
                "Check seller reviews and domain authenticity before sending funds."
            ]
        },
        "context_note": "Promotional discount purchase",
        "created_at": "2026-09-18T20:15:00Z"
    },
    {
        "id": 903,
        "transaction_ref": "TXN000903",
        "beneficiary": "arjun@upi",
        "payee_name": "Arjun",
        "amount": 500.0,
        "risk_level": "LOW",
        "risk_score": 0.0,
        "action": "ALLOW",
        "status": "VERIFIED SAFE",
        "signals": [],
        "explanation": "Transaction matches normal behavioural profile. No significant risk indicators detected.",
        "ai_analysis": {
            "available": True,
            "contextual_risk": "LOW",
            "app_indicators": [],
            "explanation": "Routine transfer to known personal contact within historical limits.",
            "safety_checks": [
                "Standard peer-to-peer clearance."
            ]
        },
        "context_note": "Dinner split",
        "created_at": "2026-09-18T18:40:00Z"
    }
]


@router.get("", response_model=List[Dict[str, Any]])
async def get_transaction_history(
    risk_level: Optional[str] = Query(None, description="Optional filter: LOW, MEDIUM, or HIGH"),
    db: Session = Depends(get_db)
):
    """
    Retrieve stored simulated transaction history from MySQL database.
    Integrates live Transaction and RiskAnalysis relational records.
    Falls back to synthetic demo seed if database table is initially empty.
    """
    try:
        query = db.query(Transaction).options(joinedload(Transaction.risk_analysis)).order_by(Transaction.id.desc())
        transactions = query.limit(50).all()

        if not transactions:
            # Seed dataset if no transactions yet recorded
            if risk_level:
                return [t for t in SYNTHETIC_DEMO_SEED if t.get("risk_level") == risk_level.upper()]
            return SYNTHETIC_DEMO_SEED

        results: List[Dict[str, Any]] = []
        for txn in transactions:
            ra = txn.risk_analysis
            r_level = (ra.risk_level if ra and ra.risk_level else "LOW").upper()
            
            # Apply risk filter if requested
            if risk_level and r_level != risk_level.upper():
                continue

            r_score = float(ra.risk_score) if ra and ra.risk_score is not None else 0.0
            r_action = ra.action if ra and ra.action else "ALLOW"
            r_signals = ra.triggered_signals if ra and ra.triggered_signals else []
            r_explanation = ra.explanation if ra and ra.explanation else "Normal simulated transaction."
            r_ai = ra.ai_analysis if ra and ra.ai_analysis else None

            # Friendly name helper
            raw_vpa = txn.beneficiary or "unknown@upi"
            payee_name = raw_vpa.split("@")[0].replace(".", " ").title()

            # Determine user-friendly status
            if getattr(txn, "status", None) == "FAILED_INSUFFICIENT_FUNDS":
                status_label = "FAILED (INSUFFICIENT BALANCE)"
            elif r_action == "INTERVENE":
                status_label = "SAFEGUARDED"
            elif r_action == "WARN":
                status_label = "WARNED / REVIEWED"
            else:
                status_label = "COMPLETED"

            results.append({
                "id": txn.id,
                "transaction_ref": f"TXN{txn.id:06d}",
                "beneficiary": raw_vpa,
                "payee_name": payee_name,
                "amount": float(txn.amount),
                "risk_level": r_level,
                "risk_score": r_score,
                "action": r_action,
                "status": status_label,
                "signals": r_signals,
                "explanation": r_explanation,
                "ai_analysis": r_ai,
                "new_beneficiary": txn.new_beneficiary,
                "new_device": txn.new_device,
                "previous_average": txn.previous_average,
                "created_at": txn.created_at.isoformat() if txn.created_at else datetime.utcnow().isoformat()
            })

        return results

    except Exception as exc:
        # Graceful fallback to synthetic demo dataset if database read fails
        if risk_level:
            return [t for t in SYNTHETIC_DEMO_SEED if t.get("risk_level") == risk_level.upper()]
        return SYNTHETIC_DEMO_SEED
