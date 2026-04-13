# ai-os Monorepo

Single source of truth for the Stratxcel ecosystem:

- `frontend/` - Next.js website + `/admin` dashboard UI
- `backend/` - Flask WhatsApp bot + `/dashboard.json` analytics API
- `shared/` - shared branding/config artifacts
- `scripts/` - setup and operational scripts

## Structure

```text
ai-os/
  frontend/
  backend/
  shared/
  scripts/
  .env
  .env.example
  package.json
```

## Environment

Copy `.env.example` to `.env` and fill values:

- `OPENAI_API_KEY`
- `WHATSAPP_TOKEN` (or `WHATSAPP_ACCESS_TOKEN`)
- `VERIFY_TOKEN` (or `WHATSAPP_VERIFY_TOKEN`)
- `WHATSAPP_PHONE_NUMBER_ID`
- `BOOKING_URL`
- `GOOGLE_SHEETS_WEBHOOK_URL`
- `ADMIN_ALERT_NUMBER`
- `DASHBOARD_PASSWORD` (backend admin/dashboard auth)
- `ADMIN_DASHBOARD_PASSWORD` (frontend `/admin` auth)
- `NEXT_PUBLIC_API_URL` (frontend -> backend base URL, e.g. `http://127.0.0.1:5000`)

## Local development

1. Install once:
   - `powershell -ExecutionPolicy Bypass -File scripts/setup-dev.ps1`
2. Start both services:
   - `npm run dev`

Expected ports:

- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:5000`

## Verification checklist

- Website: `http://localhost:3000`
- Admin UI: `http://localhost:3000/admin`
- Backend health: `http://127.0.0.1:5000/`
- Backend metrics API: `http://127.0.0.1:5000/dashboard.json`
- Frontend build: `npm run build`

## Deployment

### Frontend (Vercel)

1. Set project root to `frontend/`.
2. Add env vars:
   - `NEXT_PUBLIC_API_URL=https://<your-backend-domain>`
   - `ADMIN_DASHBOARD_PASSWORD=<password>`
3. Deploy.

### Backend (VPS / Render / Railway / Docker-ready path)

- Source in `backend/`.
- For VPS + systemd/nginx:
  - `backend/deploy.sh`
  - `backend/ai-os.service`
  - `backend/nginx.conf`
- Docker:
  - `docker build -f backend/Dockerfile -t ai-os-backend .`
  - `docker run --env-file .env -p 5000:5000 ai-os-backend`
- Ensure root `.env` is present and readable by backend process.

