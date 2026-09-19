"""
Database seeding script for PayRakshak.
Populates MySQL database with rich synthetic demo transactions across Low, Medium, and High risk profiles.

Run via: `python seed_demo_data.py`
"""

import sys
from datetime import datetime, timedelta
from app.database.connection import SessionLocal, engine
from app.database.base import Base
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis

DEMO_SEED_RECORDS = [
    {
        "amount": 450.0,
        "beneficiary": "grocery.store@okaxis",
        "new_beneficiary": False,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 600.0,
        "location_changed": False,
        "risk_score": 0.0,
        "risk_level": "LOW",
        "action": "ALLOW",
        "signals": [],
        "explanation": "Transaction is completely within normal baseline spending and device profile.",
        "ai_analysis": {
            "available": True,
            "contextual_risk": "LOW",
            "app_indicators": [],
            "explanation": "Routine recurring grocery purchase from recognized device.",
            "safety_checks": ["Standard payment security confirmed."]
        },
        "days_ago": 3
    },
    {
        "amount": 1250.0,
        "beneficiary": "priya.sharma@okhdfcbank",
        "new_beneficiary": False,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 1000.0,
        "location_changed": False,
        "risk_score": 0.0,
        "risk_level": "LOW",
        "action": "ALLOW",
        "signals": [],
        "explanation": "Regular peer-to-peer transfer to known personal contact.",
        "ai_analysis": {
            "available": True,
            "contextual_risk": "LOW",
            "app_indicators": [],
            "explanation": "Known contact transfer within standard variation.",
            "safety_checks": ["Standard UPI transfer clearance."]
        },
        "days_ago": 2
    },
    {
        "amount": 7200.0,
        "beneficiary": "megasale.electronics@paytm",
        "new_beneficiary": True,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 1500.0,
        "location_changed": False,
        "risk_score": 38.0,
        "risk_level": "MEDIUM",
        "action": "WARN",
        "signals": [
            "Transaction amount (INR 7,200) is notably higher than historical average (INR 1,500, 4.8x)",
            "New beneficiary with no prior transaction history"
        ],
        "explanation": "Higher-than-usual amount directed to a newly added merchant beneficiary.",
        "ai_analysis": {
            "available": True,
            "contextual_risk": "MEDIUM",
            "app_indicators": ["Unfamiliar merchant domain", "Above average outlay"],
            "explanation": "First-time payment to an unfamiliar merchant with elevated price point.",
            "safety_checks": [
                "Verify merchant returns and refund policies before proceeding.",
                "Ensure website domain matches official vendor brand."
            ]
        },
        "days_ago": 1
    },
    {
        "amount": 85000.0,
        "beneficiary": "customs.clearance.dept@upi",
        "new_beneficiary": True,
        "new_device": True,
        "transactions_last_10_min": 4,
        "previous_average": 2000.0,
        "location_changed": True,
        "risk_score": 100.0,
        "risk_level": "HIGH",
        "action": "INTERVENE",
        "signals": [
            "Transaction amount (INR 85,000) is significantly above historical average (INR 2,000, 42.5x)",
            "New beneficiary with no prior transaction history",
            "Transaction initiated from an unrecognised device or session",
            "Unusually rapid activity (4 transactions initiated in last 10 minutes)",
            "Context contains urgency/pressure indicators ('urgent, customs, clearance, fine')"
        ],
        "explanation": "High-risk APP scam pattern detected: urgent authority impersonation lure with high velocity and new device anomaly.",
        "ai_analysis": {
            "available": True,
            "contextual_risk": "HIGH",
            "app_indicators": [
                "Government / Authority Impersonation Lure",
                "Extreme High Pressure Urgency",
                "Severe Amount Deviation"
            ],
            "explanation": "Simulates classic APP scam: victim coerced into paying urgent customs clearance release fee.",
            "safety_checks": [
                "NEVER send funds via personal UPI to clear customs or pay government fines.",
                "Official agencies never demand immediate instant UPI transfers over phone/chat.",
                "Contact official customs or police helpline directly to verify."
            ]
        },
        "days_ago": 0
    }
]


def seed_database():
    print("=================================================")
    print("PAYRAKSHAK DATABASE DEMO SEEDER")
    print("=================================================")

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        count_existing = db.query(Transaction).count()
        print(f"Current transactions in MySQL: {count_existing}")

        print("Seeding demo transactions...")
        for rec in DEMO_SEED_RECORDS:
            txn_date = datetime.now() - timedelta(days=rec["days_ago"], hours=2)
            txn = Transaction(
                amount=rec["amount"],
                beneficiary=rec["beneficiary"],
                new_beneficiary=rec["new_beneficiary"],
                new_device=rec["new_device"],
                transactions_last_10_min=rec["transactions_last_10_min"],
                previous_average=rec["previous_average"],
                location_changed=rec["location_changed"],
                transaction_time=txn_date,
                created_at=txn_date
            )
            db.add(txn)
            db.flush()

            analysis = RiskAnalysis(
                transaction_id=txn.id,
                risk_score=rec["risk_score"],
                risk_level=rec["risk_level"],
                action=rec["action"],
                triggered_signals=rec["signals"],
                explanation=rec["explanation"],
                ai_analysis=rec["ai_analysis"],
                created_at=txn_date
            )
            db.add(analysis)

        db.commit()
        total_now = db.query(Transaction).count()
        print(f"Successfully seeded {len(DEMO_SEED_RECORDS)} demo transactions.")
        print(f"Total transactions in database now: {total_now}")
        print("=================================================")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
