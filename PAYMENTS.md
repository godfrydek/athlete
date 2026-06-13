# Payments / Free-Pro-Elite Blueprint

V11 includes product and plan architecture, not real payments yet.

## Safe payment flow

1. Frontend requests checkout from serverless endpoint.
2. Serverless endpoint uses Stripe/Paddle secret key.
3. User pays on hosted checkout page.
4. Provider webhook hits backend.
5. Backend verifies signature.
6. Backend updates Supabase user plan.
7. Frontend reads plan from Supabase.

## Never do this

- Never put Stripe secret key in `app.js` or any frontend file.
- Never trust local-only paywall state for real public paid features.

## Suggested tiers

- Free: local vault, basic tracking, export/import.
- Pro: cloud convenience, advanced analytics, email reports, premium template packs.
- Elite: coach share, server notifications, AI endpoint, advanced programs.
