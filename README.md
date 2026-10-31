# FinanceTracker

> Smart personal finance management with multi-currency support, AI-powered insights, and Stripe-powered premium subscriptions.

## Overview

FinanceTracker is a full-featured personal finance web application built with React and TypeScript. It connects to Supabase for authentication and data persistence, uses Stripe for subscription payments, and integrates Groq AI for intelligent financial insights. The app is installable as a Progressive Web App (PWA).

## Features

### Free Tier
- **Multi-Account Management** — Track multiple bank accounts, wallets, and cards
- **Transaction Tracking** — Record income and expenses with categories
- **Multi-Currency Support** — 8 currencies with live exchange rates via Frankfurter API
- **Sign-in options** — Email + password, magic link, and Google via Supabase Auth (Apple appears automatically once it is enabled in Supabase)
- **Dashboard** — At-a-glance financial overview with recent transactions
- **Progressive Web App** — Installable on mobile and desktop with offline support
- **Dark Mode** — System-aware theme with manual toggle

### Premium Tier ($9.99/mo or $99.99/yr)
- **Advanced Analytics** — Interactive charts (spending trends, category breakdown, income vs expenses) powered by Recharts
- **AI-Powered Insights** — Financial analysis using Groq API (spending patterns, budget recommendations, savings opportunities, expense predictions, personalized advice)
- **Budget Tracking** — Set and monitor category-based budgets with progress bars and alerts
- **Bill Reminders** — Track upcoming and overdue bills
- **Recurring Transactions** — Automate repeating income/expenses
- **Account Transfers** — Move funds between accounts
- **CSV Export** — Download analytics data for external use
- **Unlimited Accounts** — Free tier limited to 3 accounts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **State Management** | TanStack React Query (server state), Zustand (client state) |
| **Routing** | React Router v6 |
| **Charts** | Recharts |
| **Forms** | Zod validation |
| **Build** | Vite + vite-plugin-pwa |
| **Backend/DB** | Supabase (PostgreSQL + Auth + Edge Functions + RLS) |
| **Payments** | Stripe (Checkout, Customer Portal, Webhooks via Edge Functions) |
| **AI** | Groq (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`) via the `groq-proxy` Edge Function |
| **Currency Rates** | Frankfurter API (free, no key required) |

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐
│   React SPA (Vite)  │────▶│   Supabase       │
│   - Components      │     │   - PostgreSQL   │
│   - Hooks           │     │   - Auth (Google)│
│   - TanStack Query  │     │   - RLS Policies │
└────────┬────────────┘     │   - Edge Funcs   │
         │                  └────────┬─────────┘
         │                           │
    ┌────▼────┐              ┌───────▼───────┐
    │ Stripe  │              │  Groq AI API  │
    │ (JS SDK)│              │  (via SDK)    │
    └─────────┘              └───────────────┘
```

The app is a **client-side SPA** — there is no custom backend server. Server-side logic runs as **Supabase Edge Functions** (Deno) and Postgres functions:

- `groq-proxy` — authenticated, rate-limited proxy to Groq; the Groq key never reaches the browser
- `refresh-currency-rates` — fetches ECB rates (Frankfurter) and stores them; clients can only read `currency_rates`
- `create_transaction` / `update_transaction` / `delete_transaction` / `create_account_transfer` / `delete_account_transfer` — Postgres functions that write a ledger row and adjust account balances in one transaction
- `handle_new_user` — trigger that creates a user's preference rows at signup

The frontend talks to Supabase directly with Row Level Security (RLS) enforcing per-user isolation. Stripe checkout/portal/webhook functions are documented in `docs/STRIPE_SETUP.md` but not deployed while the app runs in free mode.

## Setup Instructions

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account with a project
- A [Stripe](https://stripe.com) account (for premium features)
- A [Groq](https://console.groq.com) API key (for AI features)

### 1. Clone the repository

```bash
git clone https://github.com/gunnarwrld/personal-finance-web-app.git
cd personal-finance-web-app
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values (see [Environment Variables](#environment-variables) below).

### 3. Install dependencies

```bash
npm install
```

### 4. Run database migrations

All schema changes live in `supabase/migrations/` and build the full schema from scratch:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

For a local database, `supabase start` followed by `supabase db reset` applies the same files. After changing the schema, regenerate the types with `supabase gen types typescript --linked > src/types/database.types.ts`.

### 5. Deploy Supabase Edge Functions

```bash
supabase secrets set GROQ_API_KEY=<your-groq-api-key>
supabase functions deploy groq-proxy --no-verify-jwt
supabase functions deploy refresh-currency-rates --no-verify-jwt
```

Both functions check the caller's session themselves (`--no-verify-jwt` matches `supabase/config.toml`). For payments, see [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) for the `create-checkout-session`, `create-portal-session` and `stripe-webhooks` functions.

### 6. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL (e.g., `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public API key |
| `VITE_STRIPE_PUBLIC_KEY` | ⚠️ | Stripe publishable key (`pk_test_...` or `pk_live_...`). Required for payments. |
| `VITE_STRIPE_MONTHLY_PRICE_ID` | ⚠️ | Stripe Price ID for the monthly plan. Required for payments. |
| `VITE_STRIPE_YEARLY_PRICE_ID` | ⚠️ | Stripe Price ID for the yearly plan. Required for payments. |
| `VITE_APP_NAME` | ❌ | App display name (default: `FinanceTracker`) |
| `VITE_APP_VERSION` | ❌ | App version (default: `2.0.0`) |
| `VITE_APP_URL` | ❌ | App URL for Stripe redirects (default: `window.location.origin`) |

> ⚠️ = Required for that specific feature to work. The app will still load without them.

The Groq key is **not** a `VITE_` variable: anything prefixed `VITE_` is bundled into the browser. Set it as a Supabase secret (`GROQ_API_KEY`, see step 5).

## Payment Setup (Stripe)

For detailed Stripe integration instructions, see **[docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md)**.

Quick summary:
1. Create products and prices in Stripe Dashboard ($9.99/mo, $99.99/yr)
2. Add Price IDs to `.env`
3. Deploy Supabase Edge Functions (checkout, portal, webhooks)
4. Configure webhook endpoint in Stripe Dashboard
5. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as Supabase secrets

### Local development with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your local Supabase Edge Function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhooks

# Use the webhook signing secret from the output in your Supabase secrets
```

## Folder Structure

```
personal-finance-web-app/
├── src/
│   ├── components/          # React components by feature
│   │   ├── accounts/        # Account CRUD (card, modal, list)
│   │   ├── ai/              # AI insights card and modal
│   │   ├── analytics/       # Charts (spending, categories, income/expense)
│   │   ├── auth/             # Google sign-in button
│   │   ├── bills/            # Bill reminder components
│   │   ├── budgets/          # Budget tracking components
│   │   ├── dashboard/        # Balance card, quick actions, recent transactions
│   │   ├── layout/           # TopBar, BottomNav, Layout wrapper
│   │   ├── notifications/    # Bell icon and dropdown
│   │   ├── quick/            # Quick transaction FAB
│   │   ├── recurring/        # Recurring transaction components
│   │   ├── subscription/     # Upgrade banner and subscription modal
│   │   ├── transactions/     # Transaction CRUD
│   │   └── ui/               # Reusable primitives (Button, Card, Input, Modal, etc.)
│   ├── config/              # App configuration
│   │   ├── groq.ts          # AI model config and prompts
│   │   └── stripe.ts        # Stripe plans, pricing, and config
│   ├── hooks/               # Custom React hooks (one per feature)
│   ├── lib/                 # Utility libraries
│   │   ├── categories.ts    # Category colors and icons
│   │   ├── currency.ts      # Exchange rates and formatting
│   │   ├── groq.ts          # Groq AI client and functions
│   │   ├── stripe.ts        # Stripe checkout/portal helpers
│   │   ├── supabase.ts      # Supabase client and auth helpers
│   │   ├── utils.ts         # General utilities (cn, formatDate, storage, etc.)
│   │   └── validations.ts   # Zod schemas for forms
│   ├── pages/               # Route-level page components
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Router and route definitions
│   ├── main.tsx             # Entry point with React Query provider
│   └── index.css            # Tailwind directives and global styles
├── docs/                    # Additional documentation
│   └── STRIPE_SETUP.md      # Stripe integration guide
├── .env.example             # Environment variable template
├── .gitattributes           # Line ending normalization (LF)
├── PROJECT_STATUS.md        # Development status and notes
├── SECURITY_CHECKLIST.md    # Security verification checklist
├── vite.config.ts           # Vite + PWA configuration
├── tailwind.config.js       # Tailwind theme customization
└── tsconfig.json            # TypeScript configuration
```

## Known Limitations

- **No server-side rendering** — Pure client-side SPA
- **Apple sign-in needs configuring** — Enable the Apple provider in Supabase (Authentication → Providers) to show the button
- **No automated recurring transaction processing** — Recurring transactions need to be triggered manually (a cron job or scheduled function would be needed for full automation)
- **Limited to 8 currencies** — USD, EUR, GBP, JPY, CNY, SEK, AUD, CAD
- **No bank sync** — Manual transaction entry only (no Plaid/Teller integration)
- **Edge Function stubs in docs** — The webhook handler code in `docs/STRIPE_SETUP.md` needs to be deployed as actual Supabase Edge Functions

## Scripts

```bash
npm run dev       # Start development server (Vite)
npm run build     # TypeScript check + production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm run type-check # TypeScript type checking only
```

## Deployment

The app is configured for deployment on **Vercel**:
- Build command: `npm run build`
- Output directory: `dist`
- `vercel.json` rewrites app routes (`/dashboard`, `/settings`, …) to `index.html` so deep links and OAuth / magic-link redirects load the app instead of a 404
- Set all `VITE_*` environment variables in your Vercel dashboard
- In Supabase → Authentication → URL Configuration, set the Site URL to your production domain and allow `https://<your-domain>/**` as a redirect URL
- Configure Google OAuth redirect URLs in both Supabase and Google Cloud Console to include your production domain
- Roll out schema changes before the frontend that depends on them: `supabase db push`, deploy Edge Functions, then merge/deploy

## Security

See [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) for the full security verification checklist.

Key measures:
- ✅ Row Level Security (RLS) on all database tables
- ✅ `.env` never committed (enforced by `.gitignore`)
- ✅ Stripe secret keys only in Supabase Edge Functions (never in frontend)
- ✅ API key validation before use
- ✅ Session-based auth with automatic token refresh

---

**License**: Private — All rights reserved

**Last Updated**: April 2026
