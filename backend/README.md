# Backend (Node Consolidated)

Phase 1 consolidation sets Node backend as sole owner for:
- WhatsApp webhook + AI response flow
- Payment link + payment webhook handling
- Core API domain routing

## Domain routes

- `GET /health`
- `GET|POST /webhook` (aiops webhook)
- `GET /api/leads/health`, `POST /api/leads/capture`
- `POST /api/leads/landing-submit` (lead capture from landing forms + UTM/source)
- `GET /api/leads/board` (lead status board)
- `GET /api/sales/health`, `POST /api/sales/stage`, `POST /api/sales/qualify`
- `POST /api/sales/proposal/generate`, `POST /api/sales/proposal/:id/accept`
- `POST /api/sales/followups/run`, `POST /api/sales/handoff/hot`
- `GET /api/payments/health`, `POST /api/payments/create-link`, `POST /api/payments/webhook/razorpay`
- `GET /api/delivery/health`, `POST /api/delivery/kickoff`
- `GET /api/aiops/health`
- `GET /api/aiops/dashboard/funnel`, `GET /api/aiops/dashboard/revenue`, `GET /api/aiops/dashboard/overview`

## Run locally

From repo root:

- `npm install`
- `npm install --prefix backend`
- `npm run dev:stack`

Or only backend:

- `npm run dev --prefix backend`
