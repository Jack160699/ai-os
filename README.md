# Stratxcel (master monorepo)

Single GitHub repository for Stratxcel: corporate site, AI OS, public AI marketing, demos, backend, and shared packages. Legacy standalone repos (**stratxcel-site**, **ai-os**, **honest-asset-management**, **grand-dhillon-website**, consulting demos) should be archived after traffic moves here.

**Merge status:** The former `stratxcel-site` marketing UI is already superseded by `apps/ai-os` (same page/components, plus Razorpay and admin). No additional file copy was required. Hotel / honest-asset / consulting sources are not vendored in-tree; `apps/demo-site` reads optional `NEXT_PUBLIC_DEMO_*` URLs so you can link existing deployments until you physically merge those repos.

Turborepo workspace layout:

- `apps/ai-os` — Next.js AI OS (marketing + `/admin`, APIs including Razorpay)
- `apps/main-site` — Corporate site (stratxcel.in target)
- `apps/ai-marketing` — Public AI product marketing (stratxcel.ai target)
- `apps/demo-site` — Portfolio / demos (demo.stratxcel.in target)
- `packages/*` — `@stratxcel/payments`, `@stratxcel/ui`, `@stratxcel/config`, `@stratxcel/auth`
- `backend/` — Flask bot + APIs (EC2 / systemd)
- `scripts/` — setup and deploy helpers

## Structure

```text
stratxcel/   (repository root; folder may still be named ai-os locally)
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

Create one Vercel project per app. In each project set **Root Directory** to the app path (e.g. `apps/main-site`, `apps/ai-os`, `apps/ai-marketing`, `apps/demo-site`). Each app includes a `vercel.json` that runs **`npm install` and `turbo build` from the repository root** so workspace packages (`@stratxcel/*`) resolve correctly.

1. Root Directory: e.g. `apps/ai-os`
2. Env vars (per app): e.g. `NEXT_PUBLIC_API_URL`, `ADMIN_DASHBOARD_PASSWORD`, `BOT_API_URL`, Razorpay keys for apps that handle payments (`apps/main-site` and `apps/ai-os` for checkout / payment links).
3. For `apps/demo-site`, optionally set `NEXT_PUBLIC_DEMO_HOTEL_URL`, `NEXT_PUBLIC_DEMO_HONEST_ASSET_URL`, `NEXT_PUBLIC_DEMO_PREMIUM_CONSULTING_URL` to point at live demo deployments.
4. Deploy.

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

