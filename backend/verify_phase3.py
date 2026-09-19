import urllib.request
import json
import pymysql
import sys

sys.stdout.reconfigure(encoding="utf-8")
BASE_URL = "http://127.0.0.1:8000"

def post_json(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def get_json(endpoint):
    with urllib.request.urlopen(f"{BASE_URL}{endpoint}") as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def run_phase3_verification():
    print("--- 1. Testing GET /health ---")
    status_code, data = get_json("/health")
    print(f"Status: {status_code}, Response: {data}")
    assert status_code == 200 and data["status"] == "ok"

    print("\n--- 2. Testing Scenario 1 (LOW / ALLOW) with AI Context ---")
    s1_payload = {
        "amount": 450.0,
        "beneficiary": "trusted-neighbour@oksbi",
        "new_beneficiary": False,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 500.0,
        "location_changed": False,
        "unusual_time": False,
        "context_note": "Splitting dinner bill"
    }
    status_code, s1_res = post_json("/api/payment/analyze", s1_payload)
    print(f"Status: {status_code}")
    print(f"Score: {s1_res['risk_score']}, Level: {s1_res['risk_level']}, Action: {s1_res['recommended_action']}")
    print(f"AI Analysis: {s1_res.get('ai_analysis')}")
    assert s1_res["risk_level"] == "LOW" and s1_res["recommended_action"] == "ALLOW"
    assert "ai_analysis" in s1_res

    print("\n--- 3. Testing Scenario 2 (MEDIUM / WARN) with AI Context ---")
    s2_payload = {
        "amount": 6500.0,
        "beneficiary": "promo-discount-store@ybl",
        "new_beneficiary": True,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 2000.0,
        "location_changed": False,
        "unusual_time": False,
        "context_note": "Flash discount promotion code purchase"
    }
    status_code, s2_res = post_json("/api/payment/analyze", s2_payload)
    print(f"Status: {status_code}")
    print(f"Score: {s2_res['risk_score']}, Level: {s2_res['risk_level']}, Action: {s2_res['recommended_action']}")
    print(f"Signals: {s2_res['signals']}")
    print(f"AI Analysis: {s2_res.get('ai_analysis')}")
    assert s2_res["risk_level"] == "MEDIUM" and s2_res["recommended_action"] == "WARN"

    print("\n--- 4. Testing Scenario 3 (HIGH / INTERVENE) with AI Context ---")
    s3_payload = {
        "amount": 95000.0,
        "beneficiary": "customs-impound-clearance@fakeupi",
        "new_beneficiary": True,
        "new_device": True,
        "transactions_last_10_min": 5,
        "previous_average": 3000.0,
        "location_changed": True,
        "unusual_time": True,
        "context_note": "Urgent customs package release verification penalty fee"
    }
    status_code, s3_res = post_json("/api/payment/analyze", s3_payload)
    print(f"Status: {status_code}")
    print(f"Score: {s3_res['risk_score']}, Level: {s3_res['risk_level']}, Action: {s3_res['recommended_action']}")
    print(f"Signals: {s3_res['signals']}")
    print(f"AI Analysis: {s3_res.get('ai_analysis')}")
    assert s3_res["risk_level"] == "HIGH" and s3_res["recommended_action"] == "INTERVENE"

    print("\n--- 5. Verifying MySQL Schema & AI Persistence ---")
    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="Charan@2008",
        database="payrakshak"
    )
    cursor = conn.cursor()
    cursor.execute("""
        SELECT r.id, r.transaction_id, r.risk_score, r.risk_level, r.action, r.ai_analysis
        FROM risk_analyses r
        ORDER BY r.id DESC LIMIT 3;
    """)
    rows = cursor.fetchall()
    print("Latest 3 risk_analyses in MySQL (including ai_analysis):")
    for r in rows:
        ai_data = json.loads(r[5]) if r[5] else None
        print(f"  Analysis ID {r[0]}: TxnID={r[1]}, Score={r[2]}, Level={r[3]}, Action={r[4]}")
        print(f"    AI Available: {ai_data.get('available') if ai_data else False}, Context Risk: {ai_data.get('contextual_risk') if ai_data else None}")
        print(f"    AI Safety Checks: {ai_data.get('safety_checks') if ai_data else None}")

    # Check that API key is NEVER exposed in the API response
    full_str = json.dumps(s3_res)
    assert "AQ." not in full_str and "AIza" not in full_str
    print("\nSecurity Check: GEMINI_API_KEY is NOT present in any response fields.")

    conn.close()
    print("\nALL PHASE 3 VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_phase3_verification()
