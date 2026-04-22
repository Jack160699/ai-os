# Phase 1 Consolidation

## Decisions

1. Node backend (`backend/server.js`) is the sole owner for webhook, AI response flow, and payments APIs.
2. `apps/stratxcel-os` is the sole admin frontend target.
3. Python webhook runtime (`backend/run.py` / `backend/app/whatsapp/*`) is kept only for controlled migration fallback, not primary.

## Duplicate modules to archive (next cleanup PR)

### Backend
- `backend/api/payments/create-link.js` (Next-style handler duplicate; replaced by Express route `routes/domains/payments.js`)
- `backend/api/webhook/razorpay.js` (duplicate webhook logic; replaced by Express route `routes/domains/payments.js`)
- `backend/run.py` + `backend/app/whatsapp/*` (duplicate webhook + AI ownership)

### Frontend
- `apps/ai-os/*` admin surfaces duplicated by `apps/stratxcel-os/*`.

## Migration steps

1. Point Meta WhatsApp webhook URL to Node backend `/webhook`.
2. Point Razorpay webhook URL to Node backend `/api/payments/webhook/razorpay`.
3. Keep Python services stopped in non-dev env.
4. Verify Supabase tables:
   - `messages`
   - `leads`
   - `payment_events` (new, optional but recommended)

## Safety notes

- Phase 1 does not hard-delete Python/legacy modules.
- Archive/delete should happen only after 1-2 weeks stable production traffic on Node path.
