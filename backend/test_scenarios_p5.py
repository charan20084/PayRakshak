import urllib.request
import json

def run_scenario(name, payload):
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            'http://127.0.0.1:8000/api/payment/analyze',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=3) as res:
            body = json.loads(res.read())
    except Exception:
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        res = client.post('/api/payment/analyze', json=payload)
        body = res.json()

    print(f"=== {name} ===")
    print(f"Transaction ID: {body['transaction_id']}")
    print(f"Risk Score: {body['risk_score']}")
    print(f"Risk Level: {body['risk_level']}")
    print(f"Action: {body['recommended_action']}")
    print(f"Signals: {body['signals']}")
    ai = body.get('ai_analysis') or {}
    print(f"AI Available: {ai.get('available')}")
    print(f"AI Risk: {ai.get('contextual_risk')}")
    print(f"AI Checks: {ai.get('safety_checks')}")
    print()


if __name__ == '__main__':
    run_scenario('Scenario A (Normal/Low)', {
        'amount': 500.0,
        'beneficiary': 'arjun@upi',
        'new_beneficiary': False,
        'new_device': False,
        'transactions_last_10_min': 0,
        'previous_average': 800.0,
        'context_note': 'Dinner split'
    })

    run_scenario('Scenario B (Medium)', {
        'amount': 6500.0,
        'beneficiary': 'flash.deals@paytm',
        'new_beneficiary': True,
        'new_device': False,
        'transactions_last_10_min': 0,
        'previous_average': 1800.0,
        'context_note': 'Promotional discount purchase'
    })

    run_scenario('Scenario C (High)', {
        'amount': 80000.0,
        'beneficiary': 'refund.help@upi',
        'new_beneficiary': True,
        'new_device': True,
        'transactions_last_10_min': 4,
        'previous_average': 2500.0,
        'context_note': 'Urgent customs refund release'
    })
