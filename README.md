# Stratxcel monorepo (ai-os)

Turborepo workspace for Stratxcel surfaces and shared packages:

- `apps/ai-os` — Next.js AI OS (marketing + `/admin`, APIs including Razorpay)
- `apps/main-site` — Corporate site (stratxcel.in target)
- `apps/ai-marketing` — Public AI product marketing (stratxcel.ai target)
- `apps/demo-site` — Portfolio / demos (demo.stratxcel.in target)
- `packages/*` — `@stratxcel/payments`, `@stratxcel/ui`, `@stratxcel/config`, `@stratxcel/auth`
- `backend/` — Flask bot + APIs (EC2 / systemd)
- `scripts/` — setup and deploy helpers

## Structure

```text
ai-os/
  apps/
    ai-os/
    main-site/
    ai-marketing/
    demo-site/
  packages/
    payments/
    ui/
    config/
    auth/
  backend/
  docs/
  scripts/
  turbo.json
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
- `ADMIN_DASHBOARD_PASSWORD` (`apps/ai-os` `/admin` auth)
- `NEXT_PUBLIC_API_URL` (Next app → backend base URL, e.g. `http://127.0.0.1:5000`)

## Local development

1. Install once:
   - `powershell -ExecutionPolicy Bypass -File scripts/setup-dev.ps1`
2. Start both services:
   - `npm run dev`

Expected ports:

- AI OS (default `turbo run dev`): `http://localhost:3000`
- Main site: `http://localhost:3001` (`npm run dev` in `apps/main-site` or filter turbo)
- Backend: `http://127.0.0.1:5000`

## Verification checklist

- AI OS site: `http://localhost:3000`
- Admin UI: `http://localhost:3000/admin`
- Main corporate site: `http://localhost:3001`
- Backend health: `http://127.0.0.1:5000/`
- Backend metrics API: `http://127.0.0.1:5000/dashboard.json`
- Frontend build: `npm run build`

## Deployment

### Frontends (Vercel)

Create one Vercel project per app under `apps/` (e.g. root directory `apps/main-site` for stratxcel.in, `apps/ai-os` for ai.stratxcel.in).

1. Set project root to the app folder (e.g. `apps/ai-os`).
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

