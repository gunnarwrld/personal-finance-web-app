# FinanceTracker

> A free personal finance tracker: enter your accounts, transactions, budgets and bills by hand, in any of 8 currencies, with on-demand AI insights.

**Live demo:** https://personal-finance-web-app-psi.vercel.app

`npm run type-check` and `npm run lint` check the frontend; `npm run test:db` runs the database tests (see [Database tests](#database-tests)).

## Overview

FinanceTracker is a free personal finance web application built with React and TypeScript. There are no plans, payments or feature limits: every feature below is available to every account. Supabase handles authentication and data persistence, and Groq AI provides financial insights when you ask for them. The app is installable as a Progressive Web App (PWA).

## Features

- **Multi-Account Management** — Track bank accounts, wallets, and cards, with no limit on how many
- **Transaction Tracking** — Record, edit, and delete income and expenses with categories
- **Account Transfers** — Move funds between accounts
- **Budget Tracking** — Set and monitor category-based budgets with progress bars and alerts
- **Bill Reminders** — Track upcoming and overdue bills
- **Recurring Transactions** — Schedule repeating income and expenses and see what is coming up (see [Known Limitations](#known-limitations))
- **Analytics** — Interactive charts (spending trends, category breakdown, income vs expenses) powered by Recharts, with a CSV download of the analytics view
- **Multi-Currency Support** — 8 currencies with live exchange rates via Frankfurter API
- **AI-Powered Insights** — Spending patterns, budget recommendations, savings opportunities, expense predictions, and personalized advice from Groq. Nothing is sent until you click an AI action. Each request goes through the `groq-proxy` Edge Function and includes only what that insight needs: the selected transactions' dates, descriptions, categories, types, and amounts, summary totals, and any goal you type. Transaction IDs, account names, and your user ID are not sent to Groq.
- **Sign-in options** — Email + password, magic link, and Google via Supabase Auth (Apple appears automatically once it is enabled in Supabase)
- **Dashboard** — At-a-glance financial overview with recent transactions
- **Progressive Web App** — Installable on mobile and desktop with offline support
- **Dark Mode** — System-aware theme with manual toggle

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
| **AI** | Groq (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`) via the `groq-proxy` Edge Function |
| **Currency Rates** | Frankfurter API (free, no key required) |

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐
│   React SPA (Vite)  │────▶│   Supabase       │
│   - Components      │     │   - PostgreSQL   │
│   - Hooks           │     │   - Auth         │
│   - TanStack Query  │     │   - RLS Policies │
└─────────────────────┘     │   - Edge Funcs   │
                            └────────┬─────────┘
                                     │
                            ┌────────▼─────────┐
                            │  Groq AI API     │
                            │  Frankfurter API │
                            └──────────────────┘
```

The app is a **client-side SPA** — there is no custom backend server. Server-side logic runs as **Supabase Edge Functions** (Deno) and Postgres functions:

- `groq-proxy` — authenticated, rate-limited proxy to Groq; the Groq key never reaches the browser
- `refresh-currency-rates` — fetches ECB rates (Frankfurter) and stores them; clients can only read `currency_rates`
- `create_transaction` / `update_transaction` / `delete_transaction` / `create_account_transfer` / `delete_account_transfer` — Postgres functions that write a ledger row and adjust account balances in one transaction
- `handle_new_user` — trigger that creates a user's preference rows at signup

The frontend talks to Supabase directly with Row Level Security (RLS) enforcing per-user isolation. The schema still contains a `user_subscriptions` table from an earlier paid tier; the app no longer reads or writes it, and clients can only read their own row. A later migration will drop it.

## Setup Instructions

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account with a project
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

For a local database, `supabase start` followed by `supabase db reset` applies the same files and loads the demo data in `supabase/seed.sql`. After changing the schema, regenerate the types with `supabase gen types typescript --linked > src/types/database.types.ts`.

### 5. Deploy Supabase Edge Functions

```bash
supabase secrets set GROQ_API_KEY=<your-groq-api-key>
supabase functions deploy groq-proxy --no-verify-jwt
supabase functions deploy refresh-currency-rates --no-verify-jwt
```

Both functions check the caller's session themselves (`--no-verify-jwt` matches `supabase/config.toml`).

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
| `VITE_APP_NAME` | ❌ | App display name (default: `FinanceTracker`) |
| `VITE_APP_VERSION` | ❌ | App version (default: `2.0.0`) |

The Groq key is **not** a `VITE_` variable: anything prefixed `VITE_` is bundled into the browser. Set it as a Supabase secret (`GROQ_API_KEY`, see step 5).

## Folder Structure

```
personal-finance-web-app/
├── src/
│   ├── components/          # React components by feature
│   │   ├── accounts/        # Account CRUD (card, modal, list)
│   │   ├── ai/              # AI insights card and modal
│   │   ├── analytics/       # Charts (spending, categories, income/expense)
│   │   ├── auth/             # Email, Google, and Apple sign-in
│   │   ├── bills/            # Bill reminder components
│   │   ├── budgets/          # Budget tracking components
│   │   ├── dashboard/        # Balance card, quick actions, recent transactions
│   │   ├── layout/           # TopBar, BottomNav, Layout wrapper
│   │   ├── notifications/    # Bell icon and dropdown
│   │   ├── quick/            # Quick transaction FAB
│   │   ├── recurring/        # Recurring transaction components
│   │   ├── transactions/     # Transaction CRUD
│   │   └── ui/               # Reusable primitives (Button, Card, Input, Modal, etc.)
│   ├── config/              # App configuration
│   │   └── groq.ts          # AI model config and prompts
│   ├── hooks/               # Custom React hooks (one per feature)
│   ├── lib/                 # Utility libraries
│   │   ├── categories.ts    # Category colors and icons
│   │   ├── currency.ts      # Exchange rates and formatting
│   │   ├── groq.ts          # Groq AI client and functions
│   │   ├── supabase.ts      # Supabase client and auth helpers
│   │   ├── utils.ts         # General utilities (cn, formatDate, storage, etc.)
│   │   └── validations.ts   # Zod schemas for forms
│   ├── pages/               # Route-level page components
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Router and route definitions
│   ├── main.tsx             # Entry point with React Query provider
│   └── index.css            # Tailwind directives and global styles
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
- **No full data export** — The CSV download covers the analytics view only; there is no transaction-level export yet
- **Best-effort AI rate limit** — `groq-proxy` counts requests in memory per function instance, so limits reset on cold starts and are not shared between instances

## Scripts

```bash
npm run dev       # Start development server (Vite)
npm run build     # TypeScript check + production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm run type-check # TypeScript type checking only
npm run test:db   # pgTAP tests against the local Supabase database
```

## Database tests

`supabase/tests/` holds [pgTAP](https://pgtap.org) tests, run with `supabase test db` (`npm run test:db`). They check:

- RLS is on for every public table, every policy is scoped to `auth.uid()` (except the read-only `currency_rates` policy), and `user_subscriptions` and `currency_rates` cannot be written by clients.
- One user cannot read, insert, update or delete another user's rows in any table, or point their own rows at someone else's account; `anon` sees nothing.
- The balance RPCs (`create_transaction`, `update_transaction`, `delete_transaction`, `create_account_transfer`, `delete_account_transfer`) are `SECURITY INVOKER` with an empty `search_path`, can be called only by signed-in users, and refuse other users' accounts, transactions and transfers.
- Account balances equal the ledger after creating, editing (amount, type and account) and deleting transactions, after creating and deleting transfers, and after rejected calls.
- `handle_new_user` is a `SECURITY DEFINER` trigger no client can call.

Each test file runs in a transaction that is rolled back and creates its own users, so the tests need no data and leave none behind. `05_seed.sql` also checks the demo data when `seed.sql` is loaded and is skipped otherwise.

The tests run against whichever local stack `supabase start` brought up, which needs Docker. `supabase db reset` **erases** that local database, so if your local stack holds data you want to keep, run the tests on a separate copy instead:

```bash
mkdir -p /tmp/ft-test && cp -R supabase /tmp/ft-test/   # any folder outside the repo
# in /tmp/ft-test/supabase/config.toml: change project_id and every port (e.g. 543xx -> 563xx)
supabase start --workdir /tmp/ft-test
supabase db reset --workdir /tmp/ft-test   # migrations + seed
supabase test db --workdir /tmp/ft-test
supabase stop --workdir /tmp/ft-test --no-backup
```

### Demo data

`supabase/seed.sql` loads on `supabase db reset` (local stacks only, never on `db push`). It creates two made-up users, `alex.demo@example.test` and `sam.sample@example.test`, both with the password `demo-password-123`, plus accounts, transactions, transfers, budgets, a recurring payment, bill reminders and notifications. Transactions and transfers go through the same RPCs the app uses, so balances are consistent with the ledger.

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
- ✅ Groq API key stored only as a Supabase secret (never in the browser bundle)
- ✅ API key validation before use
- ✅ Session-based auth with automatic token refresh

---

**License**: Private — All rights reserved

**Last Updated**: November 2026
