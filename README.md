# Personal Finance Web Application

> **Note:** This is a private project for personal use.

## Overview

A comprehensive personal finance management application with premium features for tracking income, expenses, and financial health through interactive dashboards, AI-powered insights, and multi-currency support.

Originally built with vanilla JavaScript, the application was completely refactored to React + TypeScript for better type safety, maintainability, and scalability.

## Features

### Core Features
- **Multi-Account Management**: Track multiple bank accounts, credit cards, and cash wallets with currency-specific balances
- **Transaction Tracking**: Record income and expenses with categories, descriptions, and dates
- **Real-time Currency Conversion**: Automatic exchange rate updates with caching for performance
- **Dashboard Analytics**: At-a-glance financial overview with recent transactions and trends
- **Google OAuth Authentication**: Secure, passwordless login
- **Progressive Web App**: Installable on devices with offline support

### Premium Features 🌟
- **Advanced Analytics**: Interactive charts with Recharts for spending trends, category breakdowns, and income/expense comparisons
- **AI-Powered Insights**: Financial analysis using Groq API
  - Spending pattern analysis
  - Budget recommendations
  - Savings opportunities
  - Expense predictions
  - Personalized financial advice
- **Push Notifications**: Budget alerts and financial reminders
- **Stripe Integration**: Secure subscription management with customer portal

## Technology Stack

### Frontend
- **React 18** with **TypeScript** for type-safe component architecture
- **Tailwind CSS** for modern, responsive UI
- **TanStack Query** for server state management and caching
- **Recharts** for data visualization
- **Vite** for fast development and optimized builds
- **Vite PWA Plugin** for Progressive Web App capabilities

### Backend & Services
- **Supabase**: PostgreSQL database, authentication, and real-time subscriptions
- **Stripe**: Payment processing and subscription management
- **Groq API**: AI-powered financial insights (mixtral-8x7b-32768, llama3-70b-8192)
- **Exchange Rate APIs**: Real-time currency conversion

### Security
- Row Level Security (RLS) on all database tables
- Environment variable protection with enhanced `.gitignore`
- Secure API key management
- Google OAuth 2.0 authentication

## Project Structure

```
src/
├── components/          # React components organized by feature
│   ├── ai/             # AI insights components
│   ├── analytics/      # Charts and analytics visualizations
│   ├── auth/           # Authentication flows
│   ├── accounts/       # Account management
│   ├── transactions/   # Transaction handling
│   ├── dashboard/      # Dashboard widgets
│   ├── notifications/  # Notification center
│   └── ui/             # Reusable UI primitives
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication logic
│   ├── useAccounts.ts  # Account data fetching
│   ├── useAI.ts        # AI insights with premium gating
│   └── ...
├── lib/                # Utility functions and configurations
│   ├── supabase.ts     # Supabase client setup
│   ├── groq.ts         # Groq AI service
│   └── validation.ts   # Zod schemas
├── config/             # Application configuration
│   └── groq.ts         # AI prompts and settings
├── types/              # TypeScript type definitions
│   ├── accounts.ts
│   ├── transactions.ts
│   ├── ai.ts
│   └── database.ts     # Supabase schema types
└── pages/              # Page components
```

## Database Schema

### Core Tables
- **accounts**: Financial account information (name, type, balance, currency)
- **transactions**: Income and expense records linked to accounts
- **user_preferences**: User settings (display currency, UI preferences, premium status)
- **currency_rates**: Cached exchange rate data

### Premium Tables
- **user_subscriptions**: Stripe subscription details (tier, status, dates)
- **user_notifications**: Notification history and preferences

**Security**: All tables implement Row Level Security (RLS) policies to ensure users can only access their own data.

## Setup & Configuration

### Prerequisites
- Node.js 18 or higher
- Supabase account
- Stripe account (for premium features)
- Groq API key (for AI features)

### Environment Variables
Create a `.env` file in the root directory (see `.env.example` for template):

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (Public keys only in frontend)
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

# Groq AI
VITE_GROQ_API_KEY=your_groq_api_key
```

**⚠️ Security Note**: Never commit the `.env` file to version control. Only `.env.example` should be tracked.

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Premium Account Setup
To set an account as premium (for testing or personal use):

1. Get the user's email from Supabase Auth dashboard
2. Run SQL in Supabase SQL Editor:

```sql
-- Update user_subscriptions
INSERT INTO user_subscriptions (user_id, subscription_tier, subscription_status, current_period_start, current_period_end)
SELECT id, 'premium', 'active', CURRENT_TIMESTAMP, '2099-12-31'
FROM auth.users WHERE email = 'your_email@example.com'
ON CONFLICT (user_id) DO UPDATE 
SET subscription_tier = 'premium',
    subscription_status = 'active',
    current_period_end = '2099-12-31';

-- Update user_preferences
UPDATE user_preferences 
SET is_premium = true 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your_email@example.com');
```

### Stripe Webhooks (Production)
For subscription management to work, configure Stripe webhooks to call your Supabase Edge Function:

```
Endpoint: https://your-project.supabase.co/functions/v1/stripe-webhook
Events: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, checkout.session.completed
```

## Deployment

Deployed to Vercel with automatic builds on push to main branch.

### Vercel Configuration
- Environment variables configured in Vercel dashboard
- Supabase authentication redirect URLs updated to include production domain
- Build command: `npm run build`
- Output directory: `dist`

### Post-Deployment Checklist
- ✅ Configure Supabase authentication redirect URLs
- ✅ Set up Stripe webhook endpoint
- ✅ Test Google OAuth flow
- ✅ Verify premium features work correctly
- ✅ Check PWA installation

## Security Best Practices

This project follows security best practices outlined in `SECURITY_CHECKLIST.md`:

- ✅ All sensitive data in `.env` (never committed)
- ✅ Enhanced `.gitignore` protecting environment files and secrets
- ✅ `.env.example` contains only placeholders
- ✅ Row Level Security enabled on all database tables
- ✅ Stripe secret keys only in Supabase Edge Functions
- ✅ API keys validated before use

**Before pushing to GitHub:**
1. Run `git status` to verify `.env` is not staged
2. Check `git ls-files | grep env` returns only `.env.example`
3. Search for secrets: `git grep -i "sk_live\|sk_test\|gsk_"`

## Development Notes

### Challenges Solved
- OAuth redirect configuration for development/production environments
- Type safety with comprehensive Supabase schema types
- RLS policies and security best practices
- Multi-currency conversion with caching
- AI integration with premium feature gating

### AI Features Configuration
The Groq AI integration uses three models for different purposes:
- **mixtral-8x7b-32768**: Default model (balanced speed/quality)
- **llama3-70b-8192**: Alternative for complex analysis
- **llama-3.1-70b-versatile**: Creative financial advice

Rate limits: 30 requests/minute, 14,400 requests/day

## Future Enhancements

Potential future improvements:
- Budget tracking with threshold alerts
- Recurring transaction support
- Data export (CSV, PDF reports)
- Advanced transaction search and filtering
- Bank API integration for automatic imports
- Enhanced data visualizations
- Mobile app (React Native)
- Investment tracking

---

**License**: Private project - All rights reserved

**Last Updated**: October 2025
