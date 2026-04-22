# Archived Legacy API Handlers

These handlers were superseded by consolidated Revenue Core Express domain routes.

Archived in commercialization pass:

- `backend/api/payments/create-link.js`
  - replaced by `POST /api/payments/create-link` in `backend/routes/domains/payments.js`
- `backend/api/webhook/razorpay.js`
  - replaced by `POST /api/payments/webhook/razorpay` in `backend/routes/domains/payments.js`

Related legacy handlers still present in deprecated app surface:

- `apps/ai-os/app/api/payments/create-link/route.js`
- `apps/ai-os/app/api/webhook/razorpay/route.js`
- `apps/ai-os/app/api/payment-success/route.js`
- `apps/ai-os/app/api/payment-failed/route.js`

These can be archived in a follow-up once `apps/ai-os` is fully retired.
