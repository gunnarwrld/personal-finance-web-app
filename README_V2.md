# FinanceTracker V2 - React + TypeScript

> Modern, type-safe personal finance management application

## 🎯 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State**: TanStack Query (React Query) + Zustand
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **PWA**: Vite PWA Plugin
- **Charts**: Recharts
- **Validation**: Zod
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (already configured)

### Installation

```bash
# Install dependencies
npm install

# Create .env file (already created with your credentials)
# Just verify it has the correct values

# Start development server
npm run dev
```

Visit `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Run TypeScript checks
npm run lint         # Run ESLint
```

## 📁 Project Structure

```
src/
├── components/       # Reusable React components
│   ├── ui/          # Basic UI components
│   ├── layout/      # Layout components
│   ├── auth/        # Authentication components
│   ├── accounts/    # Account management
│   ├── transactions/# Transaction management
│   ├── dashboard/   # Dashboard components
│   └── analytics/   # Analytics & charts
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── pages/           # Page components
├── types/           # TypeScript type definitions
├── App.tsx          # Main app component
├── main.tsx         # App entry point
└── index.css        # Global styles
```

## 🎨 Features

### ✅ Implemented

- Full TypeScript type safety
- Google OAuth authentication
- Multi-account management
- Transaction tracking (income/expense)
- Real-time currency conversion
- User preferences
- Responsive mobile-first design
- PWA support with offline capability
- Dark mode ready

### 🚧 In Progress

- UI components (Button, Card, Modal, etc.)
- Page components (Dashboard, Accounts, etc.)
- Charts and analytics
- Transaction pagination
- Search and filters

## 🔐 Environment Variables

Required environment variables (in `.env`):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CURRENCY_API_URL=https://api.exchangerate.host/latest
```

## 🗄️ Database

The app uses your existing Supabase database with the following tables:

- `accounts` - User financial accounts
- `transactions` - Income and expense transactions
- `user_preferences` - User settings
- `currency_rates` - Exchange rate cache

No data migration needed! The new app works with existing data.

## 📱 PWA Configuration

The app is configured as a Progressive Web App with:

- Service worker for offline support
- App manifest for installation
- Caching strategies for optimal performance
- Background sync for offline transactions

## 🧪 Testing

```bash
# Coming soon: Testing setup
npm run test
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Deploy to Vercel/Netlify

```bash
# Vercel
vercel deploy

# Netlify
netlify deploy
```

### Environment Variables for Production

Set these in your hosting platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CURRENCY_API_URL` (optional)

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- Vercel for Vite
- TanStack for React Query
- The React and TypeScript communities

---

**Built with ❤️ using React + TypeScript**
