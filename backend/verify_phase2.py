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

def run_verification():
    print("--- 1. Testing GET /health ---")
    status_code, data = get_json("/health")
    print(f"Status: {status_code}, Response: {data}")
    assert status_code == 200 and data["status"] == "ok"

    print("\n--- 2. Testing Scenario 1 (LOW / ALLOW) ---")
    s1_payload = {
        "amount": 950.0,
        "beneficiary": "local-dairy@oksbi",
        "new_beneficiary": False,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 900.0,
        "location_changed": False,
        "unusual_time": False
    }
    status_code, s1_res = post_json("/api/payment/analyze", s1_payload)
    print(f"Status: {status_code}")
    print(f"Result: Score={s1_res['risk_score']}, Level={s1_res['risk_level']}, Action={s1_res['recommended_action']}")
    print(f"Explanation: {s1_res['explanation']}")
    assert s1_res["risk_level"] == "LOW" and s1_res["recommended_action"] == "ALLOW"

    print("\n--- 3. Testing Scenario 2 (MEDIUM / WARN) ---")
    s2_payload = {
        "amount": 5200.0,
        "beneficiary": "electronics-outlet@ybl",
        "new_beneficiary": True,
        "new_device": False,
        "transactions_last_10_min": 0,
        "previous_average": 1800.0,
        "location_changed": False,
        "unusual_time": False
    }
    status_code, s2_res = post_json("/api/payment/analyze", s2_payload)
    print(f"Status: {status_code}")
    print(f"Result: Score={s2_res['risk_score']}, Level={s2_res['risk_level']}, Action={s2_res['recommended_action']}")
    print(f"Signals: {s2_res['signals']}")
    assert s2_res["risk_level"] == "MEDIUM" and s2_res["recommended_action"] == "WARN"

    print("\n--- 4. Testing Scenario 3 (HIGH / INTERVENE) ---")
    s3_payload = {
        "amount": 80000.0,
        "beneficiary": "overseas-support-desk@fakeupi",
        "new_beneficiary": True,
        "new_device": True,
        "transactions_last_10_min": 4,
        "previous_average": 4000.0,
        "location_changed": True,
        "unusual_time": True,
        "context_note": "Urgent police verification fee required immediately"
    }
    status_code, s3_res = post_json("/api/payment/analyze", s3_payload)
    print(f"Status: {status_code}")
    print(f"Result: Score={s3_res['risk_score']}, Level={s3_res['risk_level']}, Action={s3_res['recommended_action']}")
    print(f"Signals: {s3_res['signals']}")
    assert s3_res["risk_level"] == "HIGH" and s3_res["recommended_action"] == "INTERVENE"

    print("\n--- 5. Verifying Direct MySQL Persistence ---")
    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="Charan@2008",
        database="payrakshak"
    )
    cursor = conn.cursor()
    cursor.execute("SELECT id, amount, beneficiary, created_at FROM transactions ORDER BY id DESC LIMIT 3;")
    txns = cursor.fetchall()
    print("Latest 3 transactions in MySQL:")
    for t in txns:
        print(f"  Txn ID {t[0]}: Amount=₹{t[1]}, Beneficiary={t[2]}, Created={t[3]}")

    cursor.execute("SELECT id, transaction_id, risk_score, risk_level, action FROM risk_analyses ORDER BY id DESC LIMIT 3;")
    analyses = cursor.fetchall()
    print("Latest 3 risk_analyses in MySQL:")
    for a in analyses:
        print(f"  Analysis ID {a[0]}: TxnID={a[1]}, Score={a[2]}, Level={a[3]}, Action={a[4]}")

    conn.close()
    print("\nALL PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_verification()
