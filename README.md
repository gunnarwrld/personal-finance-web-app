# 💸 FinanceTracker PWA

A modern Progressive Web App for personal finance and expense tracking, built with a beautiful Revolut/Monzo-inspired design, real-time currency conversion, Google authentication, and Supabase database integration.

## ✨ Features

### 🎨 Modern UI & UX
- **Beautiful Design**: Purple-to-blue gradients, card-based layouts, smooth animations
- **Responsive**: Works perfectly on mobile, tablet, and desktop
- **PWA**: Installable as a native app with offline capability
- **Authentication-First**: Clean Google sign-in flow with no alternative options

### 💰 Finance Management
- **Multi-Account Support**: Cash, Card, Bank, Wallet accounts with multi-currency
- **Transaction Tracking**: Income and expenses with category organization
- **Account-Specific Transactions**: Automatic balance updates when adding transactions
- **Real-time Currency Conversion**: Live exchange rates updated every 6 hours
- **Analytics Dashboard**: Spending breakdown, savings rate, monthly summaries

### 🔒 Security & Sync
- **Google OAuth**: Secure authentication with Google accounts
- **Cloud Database**: Supabase PostgreSQL with Row Level Security
- **Real-time Sync**: Changes appear instantly across all devices
- **Offline Support**: Basic functionality when disconnected

### 📊 Analytics & Insights
- **Spending Breakdown**: Category-wise expense analysis
- **Monthly Summaries**: Income vs expenses tracking
- **Savings Rate**: Automatic calculation and tracking
- **Beautiful Charts**: Visual representation of financial data

### Supported Currencies
- USD (US Dollar)
- EUR (Euro)  
- GBP (British Pound)
- JPY (Japanese Yen)
- CNY (Chinese Yuan)
- SEK (Swedish Krona)
- AUD (Australian Dollar)
- CAD (Canadian Dollar)

### Transaction Categories
- Food & Dining
- Transportation
- Shopping
- Bills & Utilities
- Entertainment
- Health & Fitness
- Education
- Salary
- Freelance
- Investment
- Other

## 🎯 Key Functionality

### Account Management
- ✅ Create, Read, Update, Delete accounts
- ✅ Multi-currency support with conversion
- ✅ Bank details and account numbers
- ✅ Real-time balance updates

### Transaction Management
- ✅ Income and expense tracking
- ✅ Account selection with balance validation
- ✅ Category organization
- ✅ Date and description tracking
- ✅ Automatic balance adjustments

### Real-time Features
- ✅ Live currency exchange rates
- ✅ Cross-device synchronization
- ✅ Instant UI updates
- ✅ Realtime database subscriptions

### Analytics
- ✅ Monthly income/expense summaries
- ✅ Savings rate calculation
- ✅ Category-wise spending breakdown
- ✅ Visual charts and insights

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **PWA**: Service Worker, Web App Manifest
- **API**: exchangerate.host for currency rates
- **Styling**: Custom CSS with CSS Variables

## 🔍 Security Features

- **Row Level Security**: Database policies ensure users only see their data
- **OAuth Integration**: Secure Google authentication
- **API Key Management**: Proper separation of public/private keys
- **Input Validation**: Client and server-side validation
- **HTTPS Only**: Secure connections required

## 📱 PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline Support**: Basic functionality when disconnected
- **Background Sync**: Sync data when connection restored
- **Push Notifications**: Ready for future implementation
- **App-like Experience**: Native feel on all platforms

## 🔄 Future Enhancements

- [ ] Recurring transactions
- [ ] Budget tracking with alerts
- [ ] Goal setting and tracking
- [ ] Data export (CSV, PDF)
- [ ] Multiple user support
- [ ] Push notifications
- [ ] Dark mode theme
- [ ] Advanced analytics

**Enjoy managing your finances beautifully and securely! 💰✨**
