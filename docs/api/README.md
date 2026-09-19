# PayRakshak (AREA51) API Specification

The PayRakshak backend provides a high-performance, asynchronous REST API powered by FastAPI, SQLAlchemy (MySQL), and isolated server-side Google Gemini 2.5 Flash contextual appraisals.

---

## 1. Health Endpoints

### `GET /health` & `GET /api/health`
Returns service health status.

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "PayRakshak API"
}
```

---

## 2. Payment Analysis Endpoints

### `POST /api/payment/analyze`
Evaluates an incoming payment attempt using the deterministic multi-signal risk engine (Phase 2), calls the Gemini Contextual AI appraisal service (Phase 3), persists the transaction & risk decision to MySQL (Phase 4), and returns the risk evaluation.

**Request Payload:**
```json
{
  "amount": 80000.0,
  "beneficiary": "refund.help@upi",
  "new_beneficiary": true,
  "new_device": true,
  "transactions_last_10_min": 4,
  "previous_average": 2500.0,
  "location_changed": false,
  "unusual_time": false,
  "context_note": "Urgent customs refund release"
}
```

**Response (200 OK):**
```json
{
  "transaction_id": 1,
  "amount": 80000.0,
  "beneficiary": "refund.help@upi",
  "risk_score": 100.0,
  "risk_level": "HIGH",
  "signals": [
    "Transaction amount (INR 80,000) is significantly above historical average (INR 2,500, 32.0x)",
    "New beneficiary with no prior transaction history",
    "Transaction initiated from an unrecognised device or session",
    "Unusually rapid activity (4 transactions initiated in last 10 minutes)",
    "Context contains urgency/pressure indicators ('urgent, refund, customs')"
  ],
  "explanation": "Multiple high-risk behavioural and contextual signals detected. Pre-payment intervention required.",
  "recommended_action": "INTERVENE",
  "ai_analysis": {
    "available": true,
    "contextual_risk": "HIGH",
    "app_indicators": [
      "Overpayment / Accidental Refund Scam Pattern",
      "High Urgency Pressure"
    ],
    "explanation": "High contextual risk: typical accidental overpayment refund lure pattern.",
    "safety_checks": [
      "Verify beneficiary details independently via bank statement.",
      "Never return supposed accidental payments without verifying bank balance."
    ]
  },
  "created_at": "2026-09-18T22:30:00"
}
```

---

## 3. Transaction History & Audit Passbook

### `GET /api/history`
Retrieves stored transactions with linked risk analyses from MySQL database in descending chronological order. Falls back to realistic synthetic seed records if the database table is initially unpopulated.

**Query Parameters:**
- `risk_level` *(optional, string)*: Filter results by risk level: `LOW`, `MEDIUM`, or `HIGH`.

**Example Request:**
`GET /api/history?risk_level=HIGH`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "transaction_ref": "TXN000001",
    "beneficiary": "refund.help@upi",
    "payee_name": "Refund Help",
    "amount": 80000.0,
    "risk_level": "HIGH",
    "risk_score": 100.0,
    "action": "INTERVENE",
    "status": "SAFEGUARDED",
    "signals": [
      "Transaction amount (INR 80,000) is significantly above historical average (INR 2,500, 32.0x)",
      "New beneficiary with no prior transaction history"
    ],
    "explanation": "Multiple high-risk behavioural and contextual signals detected.",
    "ai_analysis": {
      "available": true,
      "contextual_risk": "HIGH",
      "app_indicators": ["Overpayment scam lure"],
      "explanation": "High contextual risk: typical accidental overpayment refund pattern.",
      "safety_checks": [
        "Check bank statement directly before sending money."
      ]
    },
    "new_beneficiary": true,
    "new_device": true,
    "previous_average": 2500.0,
    "created_at": "2026-09-18T22:30:00"
  }
]
```
