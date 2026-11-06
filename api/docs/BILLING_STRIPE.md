# Stripe subscription plans

Subscriptions map to the existing per-user server AI allowance (`UserAiUsagePolicy`, see PERSONAL_AI_AND_BILLING.md).

## Setup
1. Create a recurring Price per plan in Stripe, and enable the Customer Portal (Settings → Billing → Customer portal).
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `BILLING_PLANS` (see `.env.example`). Each plan: `key`, `name`, `priceId`, and optional `monthlyRequests` / `monthlyTokens` / `monthlyCostUsd` (omit or null = no cap).
3. Add a webhook endpoint `https://<api>/api/billing/webhook` for `checkout.session.completed` and `customer.subscription.created|updated|deleted`.
4. Run `db:migrate:deploy` and `db:generate`.

## Behavior
- `GET /api/billing/plans`, `POST /api/billing/checkout {planKey}`, `POST /api/billing/portal` (authenticated). Prices are resolved server-side from `BILLING_PLANS`.
- Webhooks are signature-verified and idempotent (`stripe_events`). `active`, `trialing` and `past_due` grant the plan's limits; other states end it.
- When a subscription ends, the user gets the plan with key `free` (a plan without `priceId`) if defined; otherwise they return to unlimited server usage, which is the current default for all users.
- The webhook overwrites a subscriber's policy; manual admin edits for that user are replaced on the next subscription event.
- Dashboard: `BillingPlans.vue` on the User Settings page lists plans, starts Checkout and opens the portal. It hides itself when `STRIPE_SECRET_KEY` is unset.
- Local webhooks: `pnpm dev` also runs `api/scripts/stripe-listen.js` (`pnpm --filter foligo-api run dev:stripe`). It uses the Stripe CLI (`~/.local/bin/stripe` or on PATH) with the sandbox key, forwards events to the local API, and saves `STRIPE_WEBHOOK_SECRET` to `api/.env` (restarting the API when it changes). It exits quietly if the key isn't an `sk_test_` key or the CLI is missing.
- Not included: tax and invoice configuration (handle in Stripe).
