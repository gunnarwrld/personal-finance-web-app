# Project Status

**Updated**: November 11, 2026
**Status**: Live on Vercel, free to use, no paid tier

## What the App Does

- Accounts, transactions (create, edit, delete), and transfers between accounts
- Budgets, bill reminders, and recurring transaction schedules
- Analytics charts with a CSV download of the analytics view
- Multi-currency display with ECB exchange rates (8 currencies)
- On-demand AI insights through the `groq-proxy` Edge Function
- Email/password, magic link, and Google sign-in
- Installable PWA with offline support

Every feature is available to every account. The Stripe checkout, customer portal, pricing and upgrade UI, and premium gating were removed in November 2026.

## Backend

- **Supabase**: Postgres with Row Level Security on every table, Postgres functions for writes that change account balances, and two Edge Functions (`groq-proxy`, `refresh-currency-rates`)
- **Leftover table**: `user_subscriptions` is still in the schema from the old paid tier. The app no longer uses it; it stays until a migration drops it, and the migrations that created it are kept as applied history.

## AI

- **Models**: `llama-3.3-70b-versatile` (default), `llama-3.1-8b-instant`
- **Limits in `groq-proxy`**: 5 requests per minute per user and 25 per minute across all users, counted in memory per function instance (best-effort)
- **Data sent to Groq**: only what each insight needs (transaction dates, descriptions, categories, types and amounts, summary totals, and any goal the user types); no IDs or account names

## Not Done Yet

- [ ] Transaction-level CSV export
- [ ] In-app privacy notice and a way to turn AI off
- [x] Automated tests (RLS isolation, balance integrity): `npm run test:db`
- [x] A demo seed with fake data (`supabase/seed.sql`)
- [ ] Automatic creation of recurring transactions
- [ ] A migration that drops `user_subscriptions`

## Release Order

Schema changes ship before the frontend that depends on them: apply migrations (`supabase db push`), deploy Edge Functions, then merge to `main` (Vercel deploys `main` automatically).

---

**Version**: 2.0.0
