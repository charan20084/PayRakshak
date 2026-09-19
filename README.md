# AUTHORISED TO LOSE (Codename: PayRakshak / AREA51)

> ⚠️ **IMPORTANT SAFETY & DEMONSTRATION DISCLAIMER**:  
> **AUTHORISED TO LOSE (PayRakshak / AREA51)** is strictly an academic, educational, and research prototype for demonstrating pre-confirmation risk assessment and intervention against Authorised Push Payment (APP) and social engineering scams.  
> **This system is NOT a live banking application, does NOT process real financial transactions, and must NEVER be connected to live UPI rails, banking networks, or real payment gateways. All names, accounts, VPAs, and messages are synthetic.**

---

## 1. Overview

Authorised Push Payment (APP) scams occur when a victim is deceived or socially engineered into genuinely authorizing a bank or UPI transfer to a fraudster's account. Because traditional fraud systems primarily focus on unauthorized access (account takeovers, stolen PINs, or session hijacking), they often fail to prevent APP fraud where the authenticated account holder performs the transfer themselves.

**AUTHORISED TO LOSE** analyzes behavioural, transaction, and contextual signals *before* payment confirmation, delivering an explainable risk assessment and adaptive user intervention to safeguard users before funds leave their control.

**Core Thesis**: *"Analyze before you confirm."* Traditional security asks *"Did the authorized user make the payment?"* while AUTHORISED TO LOSE asks *"Does the payment context look unusual or potentially scam-induced before the user confirms?"*

---

## 2. Problem

In instant real-time payment systems (such as UPI):
- Transactions are instant and irrevocable once confirmed.
- Two-Factor Authentication (2FA) and device binding confirm user identity and authorization, but cannot assess psychological coercion, impersonation pressure, or accidental overpayment refund manipulation.
- Victims willingly authorize transfers under urgency or deceptive pretexts (e.g., fake customs clearance, utility cut-off threats, fake job task security deposits).

---

## 3. Solution

AUTHORISED TO LOSE introduces a pre-confirmation evaluation pipeline:

```
Simulated Payment Request
  ➔ Behavioural & Transaction Signal Extraction
  ➔ Deterministic Risk Engine Scoring (0 - 100)
  ➔ Contextual AI Narrative & Safety Checklist Appraisal (Gemini)
  ➔ Adaptive Pre-Payment Intervention (LOW / MEDIUM / HIGH)
  ➔ User Decision (Safeguard / Cancel vs Cautioned Confirmation)
  ➔ Outcome Logging & Relational Audit History (MySQL)
```

---

## 4. Key Features

- **Pre-Confirmation Payment Risk Analysis**: Intervenes before irrevocable fund dispatch.
- **Behavioural Deviation Detection**: Compares requested amount against the payer's historical spending average.
- **New Beneficiary Detection**: Flags first-time payees with elevated transaction amounts.
- **Device & Session Anomaly Detection**: Recognizes payments initiated from unrecognised devices or sessions.
- **Rapid Activity & Velocity Tracking**: Detects bursts of rapid transactions in short time windows.
- **Categorized Risk Levels**:
  - **LOW**: Clean payment profile -> Allow to proceed with baseline safety notice.
  - **MEDIUM**: Cautionary signals detected -> Contextual warning with recommended verification steps.
  - **HIGH**: Severe APP scam indicators -> Mandatory multi-step intervention modal requiring explicit review before confirmation can even be reached.
- **Isolated Server-Side Gemini AI Explanations**: Plain-language safety explanations with actionable verification checklists and guaranteed non-blocking fallback.
- **Simulated Transaction Audit Passbook**: Filterable passbook log (`All`, `Low`, `Medium`, `High`) with full signal and risk breakdown.
- **Synthetic Multi-Vector Demo Datasets**: Curated benchmark scenarios covering impersonation, overpayment refund lures, utility threats, and benign personal splits.

---

## 5. Technology Stack

- **Frontend**:
  - React 18 (Vite, React Router v6)
  - Vanilla CSS / Custom Design System (Stitch Dark Theme & Mobile Shell)
  - Lucide React Icons & Axios Client
- **Backend**:
  - FastAPI (Python 3.10+) Asynchronous REST API
  - Pydantic v2 Schema Validation
  - Deterministic Multi-Signal Risk Engine
  - Google Gemini 2.5 Flash Server-Side Contextual Service
- **Database**:
  - MySQL 8.0+ / SQLAlchemy ORM Relational Persistence
  - `transactions` and `risk_analyses` relational schemas

---

## 6. Architecture

```
                 +-----------------------------------+
                 |        React Mobile Shell         |
                 |     (Stitch UI / Dark Mode)       |
                 +-----------------+-----------------+
                                   | HTTP / REST
                                   v
                 +-----------------+-----------------+
                 |         FastAPI Gateway           |
                 |      (/api/payment/analyze)       |
                 +--------+-----------------+--------+
                          |                 |
            +-------------v-----+     +-----v-------------+
            | Deterministic     |     | Isolated Server   |
            | Risk Engine       |     | Gemini AI Service |
            | (Scoring 0 - 100) |     | (Narrative Checks)|
            +-------------+-----+     +-----+-------------+
                          |                 |
                          +--------+--------+
                                   |
                                   v
                 +-----------------+-----------------+
                 |     SQLAlchemy / MySQL DB         |
                 | (Transactions & Risk Analyses)    |
                 +-----------------------------------+
```

---

## 7. Risk Model Methodology

The prototype employs a **deterministic, weighted heuristic rule engine** with clear, configurable signals and baseline thresholds:

| Signal | Evaluation Condition | Base Weight |
|---|---|---|
| **Amount Deviation Ratio** | Amount > 3x historical baseline (tiered up to 10x+) | +25 to +40 pts |
| **New Beneficiary** | Payee not previously in trusted contact book | +15 pts |
| **Unrecognised Device** | Transaction initiated from unfamiliar device/session | +20 pts |
| **Rapid Velocity** | > 3 transactions initiated within last 10 minutes | +25 pts |
| **Urgency / Pressure Context** | Note contains pressure keywords (*urgent, refund, customs, police*) | +20 pts |

### Risk Thresholds
- **Score < 35**: **LOW** (`ALLOW`)
- **Score 35 – 69**: **MEDIUM** (`WARN`)
- **Score >= 70**: **HIGH** (`INTERVENE`)

*Note: The numerical risk score and risk level are strictly determined by the deterministic rule engine. Gemini provides contextual explanations and safety checklists, and never unilaterally overrides the deterministic risk score.*

---

## 8. Demonstration Scenarios

The prototype includes three pre-configured synthetic demo scenarios accessible from the quick preset buttons on the payment screen:

1. **Scenario 1 — LOW (Routine Personal Transfer)**
   - *Payee*: `arjun@upi` (Saved contact)
   - *Amount*: ₹500 (Historical average: ₹800)
   - *Behavior*: Score 0.0 -> LOW -> Allow -> Direct Confirmation -> Success.
2. **Scenario 2 — MEDIUM (Unfamiliar Merchant with Moderate Deviation)**
   - *Payee*: `flash.deals@paytm` (New merchant)
   - *Amount*: ₹6,500 (Historical average: ₹1,800, 3.6x deviation)
   - *Behavior*: Score 38.0 -> MEDIUM -> Cautionary Warning Screen -> Review & Continue OR Cancel.
3. **Scenario 3 — HIGH (Overpayment Refund Lure / APP Scam Vector)**
   - *Payee*: `refund.help@upi` (New beneficiary)
   - *Amount*: ₹80,000 (Historical average: ₹2,500, 32.0x deviation)
   - *Signals*: New Device + Rapid Velocity (4 txns/10 min) + Urgency keywords.
   - *Behavior*: Score 100.0 -> HIGH -> Multi-step Intervention Modal -> Mandatory Review -> Safeguard Cancel OR Cautioned Confirmation.

---

## 9. Security & Privacy

- **Zero Client-Side Secret Exposure**: `GEMINI_API_KEY` and MySQL database credentials exist strictly on the backend and are never sent to the browser.
- **Git Protection**: `.env`, virtual environments, build directories, and caches are listed in `.gitignore`.
- **Synthetic Data Isolation**: No real personal identifying information (PII), live bank credentials, or UPI PINs are ever collected or processed.

---

## 10. Research Limitations

This project is a research prototype and synthetic demonstration. Real-world deployment in consumer banking would require:
- Training and validating against massive, representative banking transaction datasets.
- Compliance with banking regulations, privacy laws, and NPCI/RBI security guidelines.
- Continuous model drift monitoring and adversarial evasion testing.

---

## 11. Project Structure

```
PayRakshak/
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example
│   ├── .env
│   ├── requirements.txt
│   ├── seed_demo_data.py
│   ├── test_phase7_e2e.py
│   ├── test_scenarios_p5.py
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── constants.py
│   │   ├── api/
│   │   │   ├── payment.py
│   │   │   ├── risk.py
│   │   │   └── history.py
│   │   ├── schemas/
│   │   │   ├── payment.py
│   │   │   └── risk.py
│   │   ├── models/
│   │   │   ├── transaction.py
│   │   │   └── risk_analysis.py
│   │   ├── services/
│   │   │   ├── risk_engine.py
│   │   │   ├── gemini_service.py
│   │   │   └── explanation_service.py
│   │   └── database/
│   │       ├── base.py
│   │       └── connection.py
│   └── tests/
│       ├── test_health.py
│       ├── test_payment_api.py
│       ├── test_history_api.py
│       ├── test_phase7_e2e.py
│       ├── test_risk_engine.py
│       └── test_gemini_service.py
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── common/
│       │   │   └── ApiHealthBadge.jsx
│       │   └── layout/
│       │       └── MobileShell.jsx
│       ├── pages/
│       │   ├── Home/
│       │   │   └── HomePage.jsx
│       │   ├── Payment/
│       │   │   └── PaymentPage.jsx
│       │   ├── RiskWarning/
│       │   │   └── RiskWarningPage.jsx
│       │   ├── Confirmation/
│       │   │   └── ConfirmationPage.jsx
│       │   ├── Result/
│       │   │   └── ResultPage.jsx
│       │   └── History/
│       │       └── HistoryPage.jsx
│       └── services/
│           └── api.js
├── data/
│   ├── synthetic_transactions/
│   │   └── synthetic_demo_scenarios.json
│   ├── synthetic_messages/
│   │   └── synthetic_scam_messages.json
│   └── evaluation/
│       └── synthetic_eval_dataset.json
└── docs/
    ├── api/
    │   └── README.md
    ├── architecture/
    └── report/
```

---

## 12. Getting Started & Running Locally

### Backend Setup (FastAPI)
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - API Docs: `http://127.0.0.1:8000/docs`
   - Health Check: `http://127.0.0.1:8000/health`

### Frontend Setup (Vite React)
1. Open a new terminal in `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Open in browser: `http://localhost:5173`

### Run Automated Tests
```bash
# In backend/ directory:
pytest

# Standalone end-to-end verification:
python test_phase7_e2e.py

# Optional: Seed demo transactions into MySQL:
python seed_demo_data.py
```
