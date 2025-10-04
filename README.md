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

## 🚀 Getting Started

### Prerequisites
- Google Cloud Console account (for OAuth)
- Supabase account (for database)
- Web hosting platform (Vercel, Netlify, etc.)

### 1. Database Setup
1. Create a new Supabase project
2. Go to **SQL Editor** in your Supabase dashboard
3. Run the entire `database_setup.sql` file to create tables and policies

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Set up OAuth consent screen if needed
6. Add authorized redirect URIs:
   - `https://your-domain.com`
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

### 3. Supabase Configuration
1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth Client ID and Secret
4. Set **Site URL** to your deployed domain

### 4. Deploy the App
1. Upload all files to your preferred hosting platform:
   - `index.html` (main app file)
   - `style.css` (all styling)
   - `app.js` (complete application logic)
   - `manifest.json` (PWA configuration)
   - `sw.js` (service worker for offline support)

2. **For Vercel/Netlify**: Simply drag the folder or connect your GitHub repo

3. **Environment Variables**: The app uses hardcoded Supabase credentials in the JS file. For production, consider using environment variables.

## 📁 File Structure

```
financetracker-pwa/
├── index.html              # Main HTML shell
├── style.css              # Complete CSS styling
├── app.js                 # Full application logic
├── manifest.json          # PWA manifest
├── sw.js                 # Service worker
├── database_setup.sql    # Database schema
└── README.md            # This file
```

## 🔧 Configuration

### Supabase Credentials
Update the credentials in `app.js`:

```javascript
this.supabaseUrl = 'https://your-project.supabase.co';
this.supabaseKey = 'your-anon-key';
```

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

## 🚀 Deployment Options

### Recommended: Vercel
1. Connect your GitHub repository
2. Deploy automatically
3. Set custom domain if needed
4. Environment variables handled automatically

### Alternative: Netlify
1. Drag folder to Netlify
2. Or connect Git repository
3. Set up custom domain
4. Configure redirects if needed

### Manual: Any Static Host
- GitHub Pages
- AWS S3 + CloudFront
- Google Cloud Storage
- Any web server

## 🔄 Future Enhancements

- [ ] Recurring transactions
- [ ] Budget tracking with alerts
- [ ] Goal setting and tracking
- [ ] Data export (CSV, PDF)
- [ ] Multiple user support
- [ ] Push notifications
- [ ] Dark mode theme
- [ ] Advanced analytics

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify Supabase and Google OAuth configuration
3. Ensure all database tables are created properly
4. Check network connectivity for real-time features

## 📄 License

MIT License - feel free to use and modify for your needs.

---

**Enjoy managing your finances beautifully and securely! 💰✨**