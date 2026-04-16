# Stratxcel (master monorepo)

Single **GitHub repository** for Stratxcel: corporate site, AI OS, public AI marketing, demos, backend, and shared packages. Older standalone clones should be archived after DNS and Vercel point at **this** repo only.

**Merge status:** Legacy standalone marketing apps are superseded by `apps/ai-os` (same surface area, plus Razorpay and admin). Demo sources can stay external until merged; `apps/demo-site` supports optional `NEXT_PUBLIC_DEMO_*` URLs.

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

### Frontends (Vercel) — required setup

Deployments clone **whatever Git repository is connected to the Vercel project**. If build logs show a repo URL that is **not** this monorepo, fix it in Vercel first (no amount of `vercel.json` can override the wrong Git remote).

**Step 1 — Connect the correct GitHub repository**

1. Vercel → your project → **Settings** → **Git**.
2. Confirm **Connected Git Repository** is this monorepo only (not any legacy standalone project).  
3. If it still shows an old standalone repo, use **Disconnect** then **Connect Git Repository** and select **this** repo only.

**Step 2 — Root Directory (required for every Vercel project)**

| Vercel project (example) | Root Directory must be |
|--------------------------|-------------------------|
| Corporate / main site | `apps/main-site` |
| AI OS | `apps/ai-os` |
| Public AI marketing | `apps/ai-marketing` |
| Demo portfolio | `apps/demo-site` |

Leave **Root Directory empty** only if you intend to deploy **main site** using the repository root `vercel.json` (see below). For AI OS, marketing, or demos, **always** set the matching `apps/...` path.

**Step 3 — `vercel.json` behavior**

- **Repository root** `vercel.json`: when Root Directory is empty (`.`), install runs at repo root and the build runs `turbo` for **`@stratxcel/main-site`** with output `apps/main-site/.next`.
- **Per app** `apps/<name>/vercel.json`: when Root Directory is `apps/<name>`, install/build use `cd ../..` so `npm install` and `turbo` run from the **monorepo root** (workspace packages resolve).

**Step 4 — Turbo filter ↔ `package.json` name**

| Root Directory | `package.json` `name` | Turbo `--filter` |
|----------------|----------------------|------------------|
| `apps/main-site` | `@stratxcel/main-site` | `@stratxcel/main-site` |
| `apps/ai-os` | `@stratxcel/ai-os` | `@stratxcel/ai-os` |
| `apps/ai-marketing` | `@stratxcel/ai-marketing` | `@stratxcel/ai-marketing` |
| `apps/demo-site` | `@stratxcel/demo-site` | `@stratxcel/demo-site` |

**Step 5 — Environment variables**

Per app: e.g. `NEXT_PUBLIC_API_URL`, `ADMIN_DASHBOARD_PASSWORD`, `BOT_API_URL`, and Razorpay-related vars on apps that handle payments. For `apps/demo-site`, optionally set `NEXT_PUBLIC_DEMO_HOTEL_URL`, `NEXT_PUBLIC_DEMO_HONEST_ASSET_URL`, `NEXT_PUBLIC_DEMO_PREMIUM_CONSULTING_URL`.

**Step 6 — Redeploy**

Trigger a new deployment after Git and Root Directory changes so logs show the correct clone URL and app path.

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

