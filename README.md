# PayRakshak

PayRakshak is a simulated UPI payment security application that evaluates transaction and contextual risk **before payment confirmation**. It demonstrates explainable risk scoring, warnings, and verification prompts for potentially scam-induced payments.

> **Simulation only:** This academic and educational prototype does not transfer real money or connect to banking, UPI, or payment gateway infrastructure. Use synthetic names, payment identifiers, and messages only. Never enter real banking credentials or UPI PINs.

## Live Application

| Component | URL |
| --- | --- |
| Frontend | [pay-rakshak.vercel.app](https://pay-rakshak.vercel.app) |
| Backend API | [payrakshak.onrender.com](https://payrakshak.onrender.com) |
| Swagger API documentation | [Interactive API docs](https://payrakshak.onrender.com/docs) |

## Overview

An Authorised Push Payment (APP) scam persuades a legitimate user to authorize a payment under a misleading pretext. PayRakshak explores a complementary question to identity verification: does the payment context look unusual before the user confirms it?

The principle is **"Analyze before you confirm."** A React interface submits simulated payment details to FastAPI. A deterministic rule engine evaluates the supplied signals, and optional Gemini analysis adds contextual explanations and safety checks. The user reviews the result before deciding whether to continue with a simulated balance deduction.

Earlier project material uses **AUTHORISED TO LOSE** and **AREA51**; some source files and API service labels retain those names.

## Key Features

- **Simulated payment entry:** Choose a synthetic contact or enter a demo UPI identifier, amount, and context note.
- **Behavioral simulation controls:** Adjust the spending baseline, device novelty, recent transaction count, location change, and unusual timing.
- **Explainable risk assessment:** Receive a 0-100 score, LOW/MEDIUM/HIGH classification, triggered signals, explanation, and recommended action.
- **Adaptive security review:** Low-risk review, medium-risk caution, and a high-risk warning modal followed by detailed review. Users can continue or cancel; high risk does not automatically block confirmation.
- **Optional AI-assisted guidance:** Server-side Gemini requests provide contextual indicators and verification suggestions, with fallback guidance when unavailable.
- **Demo balance:** Start with INR 200,000, add simulated funds, reset the balance, and check for insufficient funds during confirmation.
- **Passbook:** View recent analyzed transactions and risk details, filtered by risk level.
- **Presentation presets:** Reproduce low-, medium-, and high-risk examples and inspect the analysis response in the review interface.

Behavioral flags and baselines are supplied by the client. They are not automatically collected from devices, bank records, location services, or a learned spending profile.

## System Architecture

```text
User
  |
  v
Vercel - React / Vite frontend
  |
  | HTTPS / JSON
  v
Render - Python FastAPI backend
  |-- Deterministic risk engine
  |-- SQLAlchemy --> Supabase PostgreSQL
  `-- HTTPX ------> Google Gemini API (optional contextual analysis)
```

- **Frontend:** Payment forms, simulation controls, review and confirmation screens, balance display, and passbook. Axios centralizes backend requests.
- **Backend:** Validates requests, computes risk, requests optional AI context, persists analyses, and manages the shared demo balance.
- **Database:** Stores the demo account, analyzed transactions, and associated risk assessments.
- **Gemini:** Explains supplied context. It does not determine the numerical score, authorize payments, or change the balance.

## Technology Stack

| Category | Technologies used |
| --- | --- |
| Frontend | React 18, React DOM, React Router DOM 6, Vite 5, JavaScript/JSX, custom CSS, Axios, Lucide React |
| Backend | Python, FastAPI, Uvicorn, Pydantic 2, pydantic-settings, HTTPX, python-dotenv |
| Database | Supabase PostgreSQL, SQLAlchemy 2, psycopg2-binary; PyMySQL remains a legacy dependency |
| AI / risk analysis | Weighted Python rules and regular expressions; optional Google Gemini REST API |
| Deployment | Vercel frontend, Render backend, Supabase database |
| Development tools | npm, Python virtual environments, pytest, FastAPI TestClient, Git |

Dependency declarations are in [frontend/package.json](frontend/package.json) and [backend/requirements.txt](backend/requirements.txt). Version ranges do not establish the exact versions installed in production.

## Project Structure

```text
PayRakshak/
|-- README.md
|-- .gitignore
|-- backend/
|   |-- .env.example
|   |-- requirements.txt
|   |-- init_db.py
|   |-- migrate_db.py
|   |-- seed_demo_data.py
|   |-- test_phase7_e2e.py
|   |-- test_scenarios_p5.py
|   |-- verify_phase2.py
|   |-- verify_phase3.py
|   |-- app/
|   |   |-- main.py
|   |   |-- api/          # Payment, history, and legacy risk routes
|   |   |-- core/         # Settings and constants
|   |   |-- database/     # SQLAlchemy engine, sessions, metadata
|   |   |-- models/       # Account, transaction, risk analysis
|   |   |-- schemas/      # Pydantic request/response schemas
|   |   |-- services/     # Risk engine, Gemini, explanation helper
|   |   `-- utils/
|   `-- tests/
|-- frontend/
|   |-- .env.example
|   |-- package.json
|   |-- package-lock.json
|   |-- vite.config.js
|   |-- index.html
|   `-- src/
|       |-- App.jsx
|       |-- main.jsx
|       |-- index.css
|       |-- components/  # Common controls and mobile layout
|       |-- pages/       # Home, Payment, RiskWarning, Confirmation,
|       |                # Result, History
|       |-- services/    # Central Axios API client
|       |-- constants/
|       |-- utils/
|       |-- hooks/       # Placeholder
|       `-- assets/      # Placeholder
|-- data/
|   |-- synthetic_transactions/
|   |-- synthetic_messages/
|   `-- evaluation/
`-- docs/
    |-- api/
    |-- architecture/
    |-- evaluation/
    |-- report/
    `-- screenshots/     # Placeholder; no screenshot images committed
```

## How PayRakshak Works

1. **Enter a simulated payment.** Choose a recipient, amount, note, and optional behavioral parameters.
2. **Request analysis.** The frontend submits `POST /api/payment/analyze`. FastAPI/Pydantic validates the input.
3. **Evaluate risk.** Rules calculate the score, level, signals, explanation, and recommended action. If configured, the backend also awaits Gemini contextual analysis.
4. **Save the assessment.** The backend stores a transaction with status `ANALYZED` and a linked risk analysis before returning the result. Analysis does not deduct the balance.
5. **Review the result.** All three risk levels have a review screen. High risk initially opens an intervention modal. Continuing leads to confirmation; cancellation leads to a cancellation result without a deduction.
6. **Confirm the simulation.** `POST /api/payment/confirm` checks the requested amount against the shared demo balance. Sufficient funds produce `SUCCESS` and a deduction; insufficient funds produce `INSUFFICIENT_FUNDS` without a deduction. A matching transaction, when supplied, is marked `CONFIRMED` or `FAILED_INSUFFICIENT_FUNDS`.
7. **Inspect the passbook.** History returns recent transactions with linked assessments. It can include analyzed attempts that were never confirmed.

Cancellation currently changes frontend navigation only; it does not persist a cancellation status. Confirmation checks funds but does not enforce the risk recommendation on the server. See [Limitations](#limitations) for additional demo behavior.

## Risk Analysis / Security Engine

The implementation in [risk_engine.py](backend/app/services/risk_engine.py) is a **deterministic weighted heuristic engine**, not a trained machine-learning model.

### Inputs and scoring

Requests accept `amount`, `beneficiary`, `new_beneficiary`, `new_device`, `transactions_last_10_min`, `previous_average`, `location_changed`, `unusual_time`, optional `transaction_time`, and optional `context_note`. The frontend currently sends the timing flag rather than a transaction timestamp.

| Signal | Condition | Points |
| --- | --- | ---: |
| Amount deviation | Amount / positive previous average >= 5 | 30 |
| Amount deviation | Ratio >= 2.5 and < 5 | 18 |
| Amount deviation | Ratio >= 1.5 and < 2.5 | 8 |
| High amount without baseline | No positive previous average and amount >= INR 25,000 | 15 |
| New beneficiary | `new_beneficiary` is true | 20 |
| New device | `new_device` is true | 18 |
| High velocity | At least 4 transactions in the last 10 minutes | 25 |
| Moderate velocity | 2 or 3 transactions in the last 10 minutes | 14 |
| Unusual timing | Timing flag is true, or supplied timestamp hour is 00:00-04:59 | 12 |
| Location change | `location_changed` is true | 15 |
| Context keywords | At least one configured whole-word keyword matches | 15 |

Only one amount tier and one velocity tier apply. Keyword matching is case-insensitive and includes `urgent`, `lottery`, `prize`, `refund`, `verify`, `immediate`, `customs`, `police`, `courier`, `blocked`, `kyc`, `penalty`, `otp`, and `ticket`. Multiple matches contribute 15 points in total.

Weights are summed, clamped to 0-100, and rounded to one decimal place.

| Score | Classification | Recommended action |
| --- | --- | --- |
| < 35 | LOW | `ALLOW` |
| >= 35 and < 70 | MEDIUM | `WARN` |
| >= 70 | HIGH | `INTERVENE` |

The payment API returns `transaction_id`, payment details, `risk_score`, `risk_level`, readable `signals`, `explanation`, `recommended_action`, `ai_analysis`, and `created_at`. Weighted `signal_details` are computed internally but are not exposed by the payment response schema.

### Gemini's role

[gemini_service.py](backend/app/services/gemini_service.py) calls the Google REST endpoint configured for **`gemini-1.5-flash`**. This is the model named in the source; successful availability of that external model is not guaranteed.

The backend sends payment metadata, the context note, detected signals, and the deterministic risk level. Gemini supplies a contextual classification, APP indicators, an explanation, and safety checks. It cannot override the rule engine's score or recommended action.

Missing configuration, request failures, timeouts, and parsing errors use fallback guidance with `available: false`. The HTTP client timeout is eight seconds; AI analysis is awaited within the payment request. The fallback's `contextual_risk` value of `LOW` does not replace the deterministic risk level.

## Demonstration Scenarios

The payment screen contains these presets. Scores follow the current rules with each preset's inputs; they are not measured fraud-detection accuracy.

| Preset | Synthetic recipient | Amount | Main inputs | Score / result |
| --- | --- | ---: | --- | --- |
| Normal | `arjun@upi` | INR 500 | Average INR 800; known recipient; no extra flags | 0 / LOW |
| Suspicious | `flash.deals@paytm` | INR 6,500 | Average INR 1,800; new recipient | 38 / MEDIUM |
| APP scam | `refund.help@upi` | INR 80,000 | Average INR 2,500; new recipient and device; velocity 4; urgency/refund note | 100 / HIGH |

Additional examples are in [synthetic transactions](data/synthetic_transactions), [synthetic messages](data/synthetic_messages), and [evaluation data](data/evaluation). Evaluation targets in those files are goals, not verified benchmark results.

## API Endpoints

These routes are registered in the current FastAPI source. Request and response schemas are available through [Swagger](https://payrakshak.onrender.com/docs).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/` | Service information and links to health/docs |
| GET | `/health` | Basic API status |
| GET | `/api/health` | Alternate basic API status route |
| GET | `/api/payment/balance` | Retrieve or initialize the shared demo account |
| POST | `/api/payment/balance/reset` | Reset the demo balance to INR 200,000 |
| POST | `/api/payment/balance/topup` | Add a positive amount, up to INR 10,000,000 per request |
| POST | `/api/payment/analyze` | Evaluate and persist a payment attempt and assessment |
| POST | `/api/payment/confirm` | Check funds and deduct a simulated payment amount |
| POST | `/api/risk/evaluate` | Legacy route; currently calls an unimplemented engine method |
| GET | `/api/history` | Read recent analyses; optional `risk_level=LOW`, `MEDIUM`, or `HIGH` |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc UI |
| GET | `/openapi.json` | Generated OpenAPI schema |

Use `/api/payment/analyze` for the implemented risk workflow. The legacy `/api/risk/evaluate` handler calls `evaluate_transaction`, which the current `RiskEngine` does not define.

Health endpoints return static service status (`AREA51 API`); they do not verify database connectivity or Gemini availability. History selects the latest 50 transactions by descending ID, then applies the risk filter. An empty database result or database read failure triggers synthetic sample history.

## Database

Production uses **Supabase PostgreSQL through SQLAlchemy and psycopg2**, rather than the Supabase browser SDK. Only the backend accesses the database.

| Table | Purpose |
| --- | --- |
| `demo_accounts` | Shared simulated account, balance, currency, and update time |
| `transactions` | Amount, beneficiary, supplied behavioral fields, status, and timestamps |
| `risk_analyses` | One-to-one transaction assessment: score, level, action, JSON signals, explanation, and JSON AI result |

PostgreSQL connections set the search path to `payrakshak,public`. Startup attempts to create the application schema and missing tables. Explicit schema metadata also depends on `DATABASE_URL` being present in the process environment; exporting it keeps these settings aligned.

[init_db.py](backend/init_db.py) creates and checks tables. [migrate_db.py](backend/migrate_db.py) creates missing tables and ensures the demo account exists; it is not a versioned migration system. `create_all` does not upgrade columns in existing tables.

The transaction model does not separately store the raw context note or unusual-time flag. Resetting the balance does not clear history. [seed_demo_data.py](backend/seed_demo_data.py) appends synthetic transactions with prewritten assessments; rerunning it adds more records.

## Local Development

### Prerequisites

- Python with `venv` and pip. Python 3.10+ is the baseline in the existing project instructions; no Python runtime version is pinned in the repository.
- Node.js and npm compatible with Vite 5. No Node runtime version is pinned in `package.json`.
- A separate development PostgreSQL database or Supabase project with permission to create the application schema and tables.
- An optional Gemini API key. The deterministic flow works without it when the database is available.

### Backend

From the repository root:

```sh
cd backend
python -m venv venv
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1
```

```sh
# macOS / Linux
source venv/bin/activate
```

Install dependencies:

```sh
python -m pip install -r requirements.txt
```

Set `DATABASE_URL` in this terminal to your development SQLAlchemy PostgreSQL connection string. Replace the placeholders privately:

```powershell
# Windows PowerShell
$env:DATABASE_URL = 'postgresql+psycopg2://<user>:<password>@<host>:<port>/<database>'
$env:DEBUG = 'false'
```

```sh
# macOS / Linux
export DATABASE_URL='postgresql+psycopg2://<user>:<password>@<host>:<port>/<database>'
export DEBUG=false
```

Settings also support `backend/.env` when launched from `backend/`. A [template](backend/.env.example) exists, but configure your own PostgreSQL connection rather than relying on legacy defaults. Never commit credentials.

Initialize and run:

```sh
python init_db.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open [local Swagger docs](http://127.0.0.1:8000/docs) or the [health endpoint](http://127.0.0.1:8000/health). Startup logs database initialization failures without preventing the API from starting, so a health response alone does not confirm database setup.

### Frontend

In a second terminal, from the repository root:

```sh
cd frontend
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). With `VITE_API_BASE_URL` unset or empty, Vite proxies `/api` and `/health` to `http://127.0.0.1:8000`.

For a production build and local preview:

```sh
npm run build
npm run preview
```

Build output is `frontend/dist/`. The proxy is configured for the development server; previewing a build that calls the backend directly needs a build-time API base URL and an allowed browser origin.

### Tests and demo data

From `backend/`, the focused rule-engine tests do not require database access:

```sh
python -m pytest tests/test_risk_engine.py
```

For the broader suite, initialize a **separate development/test database** first:

```sh
python -m pytest tests
```

API tests use the configured database and can insert transactions or reset/deduct the demo balance. Some Gemini tests use AnyIO asynchronous test support; dependencies for every asynchronous backend are not explicitly declared in `requirements.txt`. These commands do not imply that the full suite currently passes.

Optional scripts, also from `backend/`:

```sh
python seed_demo_data.py
python test_phase7_e2e.py
```

The end-to-end script targets the local API and falls back to FastAPI TestClient. Legacy `verify_phase2.py` and `verify_phase3.py` contain MySQL-specific verification and are not the PostgreSQL setup path.

## Environment Variables

| Variable | Used by | Purpose / requirement |
| --- | --- | --- |
| `DATABASE_URL` | Backend settings and SQLAlchemy | Required operational database configuration. Keep server-side; export it for consistent PostgreSQL schema metadata. |
| `GEMINI_API_KEY` | Backend Gemini service | Optional secret enabling external contextual analysis. Omit for fallback guidance. |
| `DEBUG` | Backend database engine | Controls SQLAlchemy SQL logging; set to `false` for hosted use. Defaults to `true`. |
| `VITE_API_BASE_URL` | Frontend Axios client | Public build-time API origin. Use `https://payrakshak.onrender.com` on Vercel; omit locally to use the Vite proxy. |

The settings class also declares `ENVIRONMENT`, `HOST`, `PORT`, and `CORS_ORIGINS`, but the current application does not use them to select behavior, bind Uvicorn, or configure active CORS middleware. Set binding through the Uvicorn command. Render's `$PORT` in the deployment command below is supplied by the hosting environment.

All frontend `VITE_` configuration is public. Never place database credentials, service-role keys, access tokens, or Gemini secrets there.

## Deployment

The production topology is **Vercel → Render → Supabase**. No Vercel manifest, Render Blueprint, or pinned hosting runtime configuration is committed. The settings below follow the source layout and scripts; hosting dashboard values must be configured separately.

| Service | Configuration matching this repository |
| --- | --- |
| Vercel | Root directory `frontend`; install `npm install`; build `npm run build`; output `dist`; set `VITE_API_BASE_URL` to the public Render origin before building. |
| Render | Root directory `backend`; install `pip install -r requirements.txt`; start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`; health path `/health`. |
| Supabase | Supply the PostgreSQL connection string privately as Render's `DATABASE_URL`; ensure the database role can access/create the `payrakshak` schema and tables. |

Configure `GEMINI_API_KEY` on Render only if AI context is wanted, and set `DEBUG=false`. Changing Vite environment values requires rebuilding the frontend. React uses `BrowserRouter`; the host must serve `index.html` for application routes such as `/send` and `/history` when opened directly.

## CORS / Production Configuration

Active `CORSMiddleware` in [backend/app/main.py](backend/app/main.py) explicitly allows:

- `https://pay-rakshak.vercel.app`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

It enables credentials and allows all methods and headers for those origins. `CORS_ORIGINS` and its settings helper are not wired into this middleware; changing that environment variable alone does not change the allowlist. Additional preview domains or local ports need corresponding middleware configuration.

## Security Considerations

- Database and Gemini configuration are read by the backend. The frontend communicates with FastAPI and does not need database credentials.
- FastAPI/Pydantic validates required fields, positive payment amounts, nonnegative behavioral counters/baselines, and the top-up limit.
- `.gitignore` excludes local environment files, virtual environments, build output, and caches.
- CORS controls browser origins; it does not authenticate users or prevent direct API requests.
- When Gemini is enabled, transaction metadata and the context note are sent to Google. Use synthetic content only.
- SQL logging is controlled by `DEBUG`, and some API errors include exception text. Logging and error handling remain prototype behavior.

No enterprise security certification, financial regulatory compliance, or production fraud-prevention guarantee is claimed.

## Screenshots / Demo

No application screenshot images are currently committed. `docs/screenshots/` contains a placeholder README and `.gitkeep`; `frontend/src/assets/` contains only `.gitkeep`. Use the [live frontend](https://pay-rakshak.vercel.app) and the three payment presets for a demonstration.

## Limitations

- **Simulation:** No banking/UPI integration, real identity verification, PIN/OTP authentication, or money movement is implemented.
- **Shared state:** There is one shared demo account, with no implemented user authentication or per-user isolation.
- **Prototype confirmation:** The backend accepts a client-supplied amount and optional transaction ID. It does not require prior analysis, enforce agreement with the stored amount, prevent repeat confirmations, or enforce high-risk review. Balance updates have no explicit concurrency locking.
- **Incomplete decision history:** Cancellation is not persisted. Passbook labels are largely derived from risk recommendations rather than the actual confirmation outcome, except for insufficient-funds failures.
- **Presentation fallbacks:** Balance, top-up, reset, and confirmation screens can display locally simulated outcomes after API failures. History can show synthetic samples. These displays do not prove a database write succeeded.
- **Illustrative UI content:** Home-page recent activity and parts of the high-risk story-consistency display are hardcoded, not verified bank receipts or independently observed incoming transfers.
- **Unvalidated risk performance:** Rules use client-supplied signals and keyword matches. Synthetic examples do not establish real-world accuracy, false-positive rates, or financial suitability.
- **External and legacy components:** Gemini depends on API/model availability. The legacy risk endpoint is incomplete, and some supporting documentation/scripts retain older MySQL terminology.

This prototype is intended for demonstration, research, and academic evaluation, not production financial-security decisions.

## Future Improvements

These are proposed work, not existing capabilities:

- Add authentication and isolate demo accounts and histories by user.
- Bind confirmation to a stored analysis and amount; add idempotency and concurrency-safe balance updates.
- Persist cancellation/review decisions and display actual transaction outcomes consistently.
- Clearly distinguish offline demonstration data from successfully persisted backend results.
- Repair or retire the legacy risk route, add versioned database migrations, and modernize PostgreSQL test setup.
- Validate risk rules against broader labeled synthetic scenarios and publish measured results.
- Make the Gemini model configurable and maintain verified integration tests for supported models.
- Add application screenshots and synchronize supporting documentation.
