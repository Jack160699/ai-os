# Backend

Flask WhatsApp bot + analytics API.

## Key endpoints

- `GET /` health
- `GET /webhook` WhatsApp verification
- `POST /webhook` WhatsApp messages
- `GET /dashboard` internal HTML dashboard
- `GET /dashboard.json` structured analytics API

## Run locally

From repo root:

- `python backend/run.py`

Or with monorepo command:

- `npm run dev`
