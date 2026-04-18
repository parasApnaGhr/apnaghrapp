# ApnaGhr App

ApnaGhr is a full-stack real estate operations platform built around property discovery, visit booking, field-rider execution, seller referrals, and admin-led business operations. The repository includes a React frontend, a FastAPI backend, mobile wrappers via Capacitor, operational scripts, seed data, and an extensive backend test suite.

## What The Project Does

The platform is not just a listing website. It combines a customer-facing rental journey with internal operations tools for multiple business roles:

- Customers can browse properties, view public share links, book site visits, track assigned riders, manage payments, and use support/profile features.
- Riders can receive and complete property visits, update location, upload proof, and track wallet/task activity.
- Sellers or calling agents can share properties, track referrals, manage follow-ups, monitor commissions, and participate in performance scoring flows.
- Admin and support roles can manage inventory teams, riders, sellers, payouts, performance, tracking, builder workflows, advertising, SEO pages, and operational settings.
- Builders and advertisers get dedicated flows inside the same platform.
- AI-assisted modules support chatbot interactions, ad generation, and property validation.

## Repository Structure

```text
apnaghrapp/
|-- backend/                  # FastAPI app, modular routes, services, tests
|-- frontend/                 # React app with dashboards, public pages, SEO pages
|-- memory/                   # Product notes, PRD, operational docs, credentials notes
|-- scripts/                  # Seed/setup helper scripts
|-- tests/                    # Shared or top-level test scaffolding
|-- uploads/                  # Uploaded media served by backend
|-- production_backup/        # Exported production-like data snapshots
|-- backup_20260408_100649/   # Historical backup set
|-- summary.md                # High-level project summary
|-- .env.example              # Sample environment variables
```

## Tech Stack

### Frontend

- React 19
- React Router
- Axios
- Tailwind CSS
- Radix UI primitives
- Framer Motion
- Capacitor for Android/iOS packaging

### Backend

- FastAPI
- Motor / MongoDB
- JWT authentication
- Cashfree payment integration
- Twilio and Resend hooks for notifications
- AI integrations through OpenAI/Gemini-style service wrappers present in routes

## Major Product Modules

- Authentication and multi-role access control
- Property listing and property detail flows
- Public property sharing with login redirect support
- Visit booking and ride/visit execution workflow
- Real-time or near-real-time rider tracking
- Seller referral, verification, follow-up, leaderboard, and commission system
- Inventory access mode with session-based tracking
- Packers and movers booking
- Advertising module with AI ad generation
- Builder dashboard and related lead/project flows
- Rider onboarding and legal/privacy pages
- Programmatic SEO and blog pages

## Local Development

### 1. Backend

From [backend](/C:/Users/shaur/Documents/apnaghrapp/backend):

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

The backend loads environment variables from `backend/.env`. A sample root-level `.env.example` has been added to document the required values.

### 2. Frontend

From [frontend](/C:/Users/shaur/Documents/apnaghrapp/frontend):

```powershell
npm install
npm start
```

The frontend defaults to relative `/api` routes if `REACT_APP_BACKEND_URL` is not set. For explicit local development, point it to the backend, for example `http://localhost:8001`.

## Configuration Notes

- Primary database variable: `MONGO_URL`
- Supported database aliases in code: `MONGODB_URL`, `MONGODB_URI`
- JWT signing secret is read from `JWT_SECRET`
- Cashfree uses `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, and `CASHFREE_ENVIRONMENT`
- Notification integrations use Twilio and Resend environment variables
- Frontend API base URL uses `REACT_APP_BACKEND_URL`

## Testing

This repository includes a large backend test suite under [backend/tests](/C:/Users/shaur/Documents/apnaghrapp/backend/tests). There are also generated test result artifacts under [test_reports](/C:/Users/shaur/Documents/apnaghrapp/test_reports).

Example:

```powershell
pytest backend/tests
```

## Important Observations

- `backend/server.py` is still a large orchestration file, but several features have already been extracted into `backend/routes/`.
- The repo contains backup exports and production snapshots; those are useful for recovery/reference but should be treated carefully.
- The root documentation was previously missing. `README.md`, `summary.md`, and `.env.example` now provide a working starting point for onboarding.
