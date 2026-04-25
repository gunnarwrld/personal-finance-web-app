# FinanceTracker

> Smart personal finance management with multi-currency support, AI-powered insights, and Stripe-powered premium subscriptions.

## Overview

FinanceTracker is a full-featured personal finance web application built with React and TypeScript. It connects to Supabase for authentication and data persistence, uses Stripe for subscription payments, and integrates Groq AI for intelligent financial insights. The app is installable as a Progressive Web App (PWA).

## Features

### Free Tier
- **Multi-Account Management** — Track multiple bank accounts, wallets, and cards
- **Transaction Tracking** — Record income and expenses with categories
- **Multi-Currency Support** — 8 currencies with live exchange rates via Frankfurter API
- **Google OAuth** — Secure, passwordless authentication via Supabase Auth
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
| **Forms** | React Hook Form + Zod validation |
| **Build** | Vite + vite-plugin-pwa |
| **Backend/DB** | Supabase (PostgreSQL + Auth + Edge Functions + RLS) |
| **Payments** | Stripe (Checkout, Customer Portal, Webhooks via Edge Functions) |
| **AI** | Groq API (mixtral-8x7b, llama3-70b, llama-3.1-70b) |
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

The app is a **client-side SPA** — there is no custom backend server. All server-side logic (Stripe checkout, webhooks, portal sessions) runs as **Supabase Edge Functions** (Deno). The frontend communicates with Supabase directly using the JS client with Row Level Security (RLS) enforcing data isolation per user.

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

In your Supabase SQL Editor, run the migration files from `database_migrations/` in order:
- `006_notifications.sql` — Creates notifications and notification_preferences tables with RLS

> **Note**: Core tables (accounts, transactions, user_preferences, user_subscriptions, currency_rates) should already exist in your Supabase project. If setting up from scratch, you'll need to create them — see the database schema types in `src/types/database.types.ts`.

### 5. Deploy Supabase Edge Functions

See [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) for detailed instructions on deploying:
- `create-checkout-session` — Creates Stripe Checkout sessions
- `create-portal-session` — Creates Stripe Customer Portal sessions
- `stripe-webhooks` — Handles Stripe webhook events

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
| `VITE_GROQ_API_KEY` | ⚠️ | Groq API key for AI features. Required for AI insights. |
| `VITE_CURRENCY_API_URL` | ❌ | Currency API URL (optional — app uses Frankfurter API as default) |
| `VITE_APP_NAME` | ❌ | App display name (default: `FinanceTracker`) |
| `VITE_APP_VERSION` | ❌ | App version (default: `2.0.0`) |
| `VITE_APP_URL` | ❌ | App URL for Stripe redirects (default: `window.location.origin`) |

> ⚠️ = Required for that specific feature to work. The app will still load without them.

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
├── database_migrations/     # SQL migration files for Supabase
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

- **No email/password auth** — Only Google OAuth is supported
- **No server-side rendering** — Pure client-side SPA
- **Groq API key exposed in frontend** — The `VITE_GROQ_API_KEY` is bundled client-side. For production, consider proxying AI requests through a Supabase Edge Function to keep the key server-side.
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
- Set all `VITE_*` environment variables in your Vercel dashboard
- Configure Google OAuth redirect URLs in both Supabase and Google Cloud Console to include your production domain

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
