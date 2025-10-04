// FinanceTracker - Complete PWA with Supabase Integration
// Authentication-first design with full CRUD operations

class FinanceApp {
    constructor() {
        // Supabase configuration
        this.supabaseUrl = 'https://pmeajlxzukzhcmjmclbf.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZWFqbHh6dWt6aGNtam1jbGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTQ0MDEsImV4cCI6MjA3NTE3MDQwMX0.FUn2vZ2AbM5jqrP1NFyl4sbtbvljkrPhgdT91sNhtdc';
        this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);

        // App state
        this.user = null;
        this.accounts = [];
        this.transactions = [];
        this.currencyRates = {};
        this.lastFxUpdate = null;
        this.displayCurrency = 'USD';
        this.balanceVisible = true;
        this.currentScreen = 'dashboard';
        this.isLoading = false;
        this.offlineQueue = [];
        this.realtimeChannels = [];

        // Data
        this.categories = [
            'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities',
            'Entertainment', 'Health & Fitness', 'Education', 'Salary',
            'Freelance', 'Investment', 'Other'
        ];

        this.currencies = [
            {code: 'USD', symbol: '$', name: 'US Dollar'},
            {code: 'EUR', symbol: '€', name: 'Euro'},
            {code: 'GBP', symbol: '£', name: 'British Pound'},
            {code: 'JPY', symbol: '¥', name: 'Japanese Yen'},
            {code: 'CNY', symbol: '¥', name: 'Chinese Yuan'},
            {code: 'SEK', symbol: 'kr', name: 'Swedish Krona'},
            {code: 'AUD', symbol: 'A$', name: 'Australian Dollar'},
            {code: 'CAD', symbol: 'C$', name: 'Canadian Dollar'}
        ];

        this.accountTypes = ['Cash', 'Card', 'Bank', 'Wallet'];

        this.init();
    }

    async init() {
        console.log('Initializing FinanceTracker...');

        try {
            // Setup dayjs for relative time
            if (typeof dayjs !== 'undefined') {
                dayjs.extend(dayjs_plugin_relativeTime);
            }

            // Check authentication status
            await this.checkAuthStatus();

            // Setup event listeners
            this.setupEventListeners();
            this.setupAuthStateListener();

            // Setup periodic currency updates
            this.setupPeriodicUpdates();

            // Setup service worker
            this.registerServiceWorker();

        } catch (error) {
            console.error('App initialization error:', error);
            this.showToast('Failed to initialize app', 'error');
        }
    }

    async checkAuthStatus() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();

            if (error) {
                console.error('Auth check error:', error);
                this.showScreen('auth');
                return;
            }

            if (user) {
                console.log('User authenticated:', user.email);
                await this.setUser(user);
                this.showScreen('app');
                await this.loadUserData();
            } else {
                console.log('User not authenticated');
                this.showScreen('auth');
            }
        } catch (error) {
            console.error('Auth status check failed:', error);
            this.showScreen('auth');
        }
    }

    setupAuthStateListener() {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);

            try {
                if (event === 'SIGNED_IN' && session?.user) {
                    await this.setUser(session.user);
                    this.clearAuthFragment();
                    this.showScreen('app');
                    await this.loadUserData();
                    this.showToast('Welcome back!', 'success');
                } else if (event === 'SIGNED_OUT') {
                    this.user = null;
                    this.accounts = [];
                    this.transactions = [];
                    this.cleanupRealtimeSubscriptions();
                    this.showScreen('auth');
                    this.showToast('Signed out successfully', 'info');
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                this.showToast('Authentication error occurred', 'error');
            }
        });
    }

    clearAuthFragment() {
        if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, null, window.location.pathname);
        }
    }

    async setUser(user) {
        this.user = user;

        // Update UI with user info
        const elements = [
            { id: 'user-name', content: user.user_metadata?.full_name || user.email },
            { id: 'user-avatar', attr: 'src', content: user.user_metadata?.avatar_url || '' },
            { id: 'settings-user-name', content: user.user_metadata?.full_name || user.email },
            { id: 'settings-user-email', content: user.email },
            { id: 'settings-user-avatar', attr: 'src', content: user.user_metadata?.avatar_url || '' },
            { id: 'welcome-message', content: `Welcome back${user.user_metadata?.full_name ? ', ' + user.user_metadata.full_name.split(' ')[0] : ''}!` }
        ];

        elements.forEach(({ id, content, attr }) => {
            const element = document.getElementById(id);
            if (element) {
                if (attr) {
                    element.setAttribute(attr, content);
                } else {
                    element.textContent = content;
                }
            }
        });
    }

    setupEventListeners() {
        // Authentication
        const signInBtn = document.getElementById('google-signin-btn');
        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        const signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.switchScreen(screen);
            });
        });

        // Quick actions
        const addTransactionBtn = document.getElementById('add-transaction-btn');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => this.showTransactionModal());
        }

        const addAccountBtns = document.querySelectorAll('#add-account-btn, #add-account-fab');
        addAccountBtns.forEach(btn => {
            btn.addEventListener('click', () => this.showAccountModal());
        });

        // Settings
        const refreshFxBtn = document.getElementById('refresh-fx-btn');
        if (refreshFxBtn) {
            refreshFxBtn.addEventListener('click', () => this.fetchCurrencyRates(true));
        }

        const balanceToggle = document.getElementById('balance-toggle');
        if (balanceToggle) {
            balanceToggle.addEventListener('click', () => this.toggleBalanceVisibility());
        }

        const displayCurrency = document.getElementById('display-currency');
        if (displayCurrency) {
            displayCurrency.addEventListener('change', (e) => {
                this.displayCurrency = e.target.value;
                this.saveUserPreferences();
                this.updateUI();
            });
        }

        // Modal overlay
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processOfflineQueue();
            this.showToast('Back online', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('You are offline', 'info');
        });
    }

    async signInWithGoogle() {
        const signInBtn = document.getElementById('google-signin-btn');
        const signInText = document.getElementById('signin-text');
        const authError = document.getElementById('auth-error');

        try {
            // Update button state
            signInBtn.disabled = true;
            signInText.textContent = 'Signing in...';
            authError.style.display = 'none';

            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) {
                throw error;
            }

            // OAuth redirect will happen automatically

        } catch (error) {
            console.error('Sign in error:', error);

            // Reset button state
            signInBtn.disabled = false;
            signInText.textContent = 'Continue with Google';

            // Show error
            authError.textContent = error.message || 'Failed to sign in. Please try again.';
            authError.style.display = 'block';
        }
    }

    async signOut() {
        try {
            this.showLoading(true);

            const { error } = await this.supabase.auth.signOut();

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error('Sign out error:', error);
            this.showToast('Failed to sign out', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showScreen(screen) {
        const authScreen = document.getElementById('auth-screen');
        const appScreen = document.getElementById('app-screen');

        if (screen === 'auth') {
            authScreen.style.display = 'flex';
            appScreen.style.display = 'none';
        } else {
            authScreen.style.display = 'none';
            appScreen.style.display = 'block';
            this.switchScreen('dashboard');
        }
    }

    switchScreen(screenName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.screen === screenName);
        });

        // Update screen visibility
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });

        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.style.display = 'block';
            this.currentScreen = screenName;
        }

        // Update screen-specific data
        if (screenName === 'analytics') {
            this.updateAnalytics();
        }
    }

    async loadUserData() {
        try {
            this.showLoading(true);

            // Load user preferences
            await this.loadUserPreferences();

            // Load accounts
            await this.loadAccounts();

            // Load transactions
            await this.loadTransactions();

            // Load currency rates
            await this.loadCurrencyRates();

            // Setup realtime subscriptions
            this.setupRealtimeSubscriptions();

            // Update UI
            this.updateUI();

            this.showToast('Data loaded successfully', 'success');

        } catch (error) {
            console.error('Failed to load user data:', error);
            this.showToast('Failed to load data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadUserPreferences() {
        try {
            const { data, error } = await this.supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', this.user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // Not found error
                throw error;
            }

            if (data) {
                this.displayCurrency = data.display_currency || 'USD';
                this.balanceVisible = data.balance_visible !== false;
            } else {
                // Create default preferences
                await this.saveUserPreferences();
            }

        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }

    async saveUserPreferences() {
        try {
            const { error } = await this.supabase
                .from('user_preferences')
                .upsert({
                    user_id: this.user.id,
                    display_currency: this.displayCurrency,
                    balance_visible: this.balanceVisible
                });

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    async loadAccounts() {
        try {
            const { data, error } = await this.supabase
                .from('accounts')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            this.accounts = data || [];

        } catch (error) {
            console.error('Failed to load accounts:', error);
            throw error;
        }
    }

    async loadTransactions() {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .select('*')
                .eq('user_id', this.user.id)
                .order('date', { ascending: false })
                .limit(100);

            if (error) {
                throw error;
            }

            this.transactions = data || [];

        } catch (error) {
            console.error('Failed to load transactions:', error);
            throw error;
        }
    }

    async loadCurrencyRates() {
        try {
            const { data, error } = await this.supabase
                .from('currency_rates')
                .select('*')
                .order('last_updated', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                this.currencyRates = data.rates;
                this.lastFxUpdate = new Date(data.last_updated);
            }

            // Fetch fresh rates if none exist or they're old
            const oneHour = 60 * 60 * 1000;
            if (!this.lastFxUpdate || (Date.now() - this.lastFxUpdate.getTime()) > oneHour) {
                await this.fetchCurrencyRates();
            }

        } catch (error) {
            console.error('Failed to load currency rates:', error);
            // Use fallback rates
            this.currencyRates = {
                USD: 1.0, EUR: 0.85, GBP: 0.73, JPY: 110.0,
                CNY: 6.5, SEK: 10.87, AUD: 1.35, CAD: 1.25
            };
        }
    }

    async fetchCurrencyRates(manual = false) {
        try {
            if (manual) {
                const refreshBtn = document.getElementById('refresh-fx-btn');
                if (refreshBtn) {
                    refreshBtn.disabled = true;
                    refreshBtn.textContent = 'Updating...';
                }
            }

            const response = await fetch('https://api.exchangerate.host/latest?base=USD');
            const data = await response.json();

            if (data.success && data.rates) {
                this.currencyRates = data.rates;
                this.lastFxUpdate = new Date();

                // Save to database
                await this.supabase
                    .from('currency_rates')
                    .upsert({
                        base_currency: 'USD',
                        rates: this.currencyRates,
                        last_updated: new Date().toISOString()
                    });

                this.updateFxUpdateInfo();
                this.updateUI();

                if (manual) {
                    this.showToast('Exchange rates updated', 'success');
                }
            }

        } catch (error) {
            console.error('Failed to fetch currency rates:', error);
            if (manual) {
                this.showToast('Failed to update rates', 'error');
            }
        } finally {
            if (manual) {
                const refreshBtn = document.getElementById('refresh-fx-btn');
                if (refreshBtn) {
                    refreshBtn.disabled = false;
                    refreshBtn.textContent = 'Refresh';
                }
            }
        }
    }

    setupRealtimeSubscriptions() {
        if (!this.user) return;

        // Accounts subscription
        const accountsChannel = this.supabase
            .channel('accounts_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'accounts',
                    filter: `user_id=eq.${this.user.id}`
                },
                () => {
                    console.log('Accounts updated');
                    this.loadAccounts().then(() => this.updateUI());
                }
            )
            .subscribe();

        // Transactions subscription
        const transactionsChannel = this.supabase
            .channel('transactions_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: `user_id=eq.${this.user.id}`
                },
                () => {
                    console.log('Transactions updated');
                    this.loadTransactions().then(() => this.updateUI());
                }
            )
            .subscribe();

        this.realtimeChannels = [accountsChannel, transactionsChannel];
    }

    cleanupRealtimeSubscriptions() {
        this.realtimeChannels.forEach(channel => {
            this.supabase.removeChannel(channel);
        });
        this.realtimeChannels = [];
    }

    setupPeriodicUpdates() {
        // Update currency rates every 6 hours
        setInterval(() => {
            this.fetchCurrencyRates();
        }, 6 * 60 * 60 * 1000);
    }

    updateUI() {
        this.updateDashboard();
        this.updateAccounts();
        this.updateAnalytics();
        this.updateSettings();
        this.populateDropdowns();
    }

    updateDashboard() {
        const totalBalance = this.calculateTotalBalance();
        const monthlyIncome = this.calculateMonthlyIncome();
        const monthlyExpenses = this.calculateMonthlyExpenses();

        // Update balance display
        const balanceElement = document.getElementById('total-balance');
        if (balanceElement) {
            balanceElement.textContent = this.balanceVisible ? 
                this.formatCurrency(totalBalance, this.displayCurrency) : '••••••';
        }

        const accountsCount = document.getElementById('accounts-count');
        if (accountsCount) {
            accountsCount.textContent = `${this.accounts.length} account${this.accounts.length !== 1 ? 's' : ''}`;
        }

        // Update monthly summaries
        const incomeElement = document.getElementById('monthly-income');
        if (incomeElement) {
            incomeElement.textContent = this.formatCurrency(monthlyIncome, this.displayCurrency);
        }

        const expensesElement = document.getElementById('monthly-expenses');
        if (expensesElement) {
            expensesElement.textContent = this.formatCurrency(monthlyExpenses, this.displayCurrency);
        }

        // Update recent transactions
        this.updateRecentTransactions();
    }

    updateRecentTransactions() {
        const container = document.getElementById('recent-transactions-list');
        if (!container) return;

        const recentTransactions = this.transactions.slice(0, 5);

        if (recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No transactions yet</p>
                    <p>Start by adding your first transaction</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentTransactions.map(transaction => {
            const account = this.accounts.find(acc => acc.id === transaction.account_id);
            const isIncome = transaction.type === 'income';

            return `
                <div class="transaction-item">
                    <div class="transaction-icon ${transaction.type}">
                        ${isIncome ? '+' : '−'}
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-meta">
                            <span>${transaction.category}</span>
                            ${account ? ` • from ${account.name}` : ''}
                            • ${this.formatDate(transaction.date)}
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${isIncome ? '+' : '−'}${this.formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateAccounts() {
        const totalBalance = this.calculateTotalBalance();

        // Update accounts total balance
        const balanceElement = document.getElementById('accounts-total-balance');
        if (balanceElement) {
            balanceElement.textContent = this.formatCurrency(totalBalance, this.displayCurrency);
        }

        const countElement = document.getElementById('accounts-total-count');
        if (countElement) {
            countElement.textContent = `Across ${this.accounts.length} account${this.accounts.length !== 1 ? 's' : ''}`;
        }

        // Update accounts list
        const container = document.getElementById('accounts-list');
        if (!container) return;

        if (this.accounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No accounts yet</p>
                    <p>Add an account to start tracking</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.accounts.map(account => {
            const convertedBalance = this.convertCurrency(account.balance, account.currency, this.displayCurrency);

            return `
                <div class="account-card">
                    <div class="account-header">
                        <div class="account-info">
                            <h4>${account.name}</h4>
                            <span class="account-type">${account.type}${account.bank_name ? ` • ${account.bank_name}` : ''}</span>
                        </div>
                        <button class="account-menu">⋯</button>
                    </div>
                    <div class="account-balance">
                        <div class="account-balance-main">
                            ${this.formatCurrency(account.balance, account.currency)}
                        </div>
                        ${account.currency !== this.displayCurrency ? 
                            `<div class="account-balance-converted">
                                ≈ ${this.formatCurrency(convertedBalance, this.displayCurrency)}
                            </div>` : ''
                        }
                    </div>
                    <div class="account-actions">
                        <button class="account-action primary" onclick="app.addMoneyToAccount(${account.id})">
                            Add Money
                        </button>
                        <button class="account-action secondary" onclick="app.editAccount(${account.id})">
                            Edit
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateAnalytics() {
        const monthlyIncome = this.calculateMonthlyIncome();
        const monthlyExpenses = this.calculateMonthlyExpenses();
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;

        // Update analytics cards
        const incomeElement = document.getElementById('analytics-income');
        if (incomeElement) {
            incomeElement.textContent = this.formatCurrency(monthlyIncome, this.displayCurrency);
        }

        const expensesElement = document.getElementById('analytics-expenses');
        if (expensesElement) {
            expensesElement.textContent = this.formatCurrency(monthlyExpenses, this.displayCurrency);
        }

        const savingsRateElement = document.getElementById('savings-rate');
        if (savingsRateElement) {
            savingsRateElement.textContent = `${savingsRate.toFixed(1)}%`;
        }

        // Update category breakdown
        this.updateCategoryBreakdown();
    }

    updateCategoryBreakdown() {
        const container = document.getElementById('category-breakdown');
        if (!container) return;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyExpenses = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'expense' && 
                   transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
        });

        if (monthlyExpenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No expenses yet</p>
                    <p>Start tracking to see your spending breakdown</p>
                </div>
            `;
            return;
        }

        // Group by category
        const categoryTotals = {};
        monthlyExpenses.forEach(transaction => {
            const convertedAmount = this.convertCurrency(transaction.amount, transaction.currency, this.displayCurrency);
            categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + convertedAmount;
        });

        // Sort by amount
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a);

        container.innerHTML = sortedCategories.map(([category, amount]) => `
            <div class="category-item">
                <span class="category-name">${category}</span>
                <span class="category-amount">${this.formatCurrency(amount, this.displayCurrency)}</span>
            </div>
        `).join('');
    }

    updateSettings() {
        // Update currency display
        const currencyElement = document.getElementById('current-currency');
        if (currencyElement) {
            currencyElement.textContent = this.displayCurrency;
        }

        // Update FX info
        this.updateFxUpdateInfo();
    }

    updateFxUpdateInfo() {
        const element = document.getElementById('fx-last-update');
        if (!element) return;

        if (this.lastFxUpdate && typeof dayjs !== 'undefined') {
            try {
                element.textContent = dayjs(this.lastFxUpdate).fromNow();
            } catch (error) {
                element.textContent = this.lastFxUpdate.toLocaleDateString();
            }
        } else {
            element.textContent = 'Never updated';
        }
    }

    populateDropdowns() {
        // Populate currency selectors
        const currencySelectors = document.querySelectorAll('#display-currency');
        currencySelectors.forEach(select => {
            select.innerHTML = this.currencies.map(currency => 
                `<option value="${currency.code}" ${currency.code === this.displayCurrency ? 'selected' : ''}>${currency.code}</option>`
            ).join('');
        });
    }

    // Account Management
    showAccountModal(accountId = null) {
        const isEdit = accountId !== null;
        const account = isEdit ? this.accounts.find(a => a.id === accountId) : null;

        const modalContent = `
            <div class="modal-header">
                <h3>${isEdit ? 'Edit Account' : 'Add Account'}</h3>
                <button class="modal-close" onclick="app.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="account-form">
                    <div class="form-group">
                        <label class="form-label">Account Name</label>
                        <input type="text" class="form-input" name="name" value="${account?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Account Type</label>
                        <select class="form-select" name="type" required>
                            ${this.accountTypes.map(type => 
                                `<option value="${type}" ${account?.type === type ? 'selected' : ''}>${type}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Initial Balance</label>
                        <input type="number" class="form-input" name="balance" value="${account?.balance || 0}" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Currency</label>
                        <select class="form-select" name="currency" required>
                            ${this.currencies.map(currency => 
                                `<option value="${currency.code}" ${account?.currency === currency.code ? 'selected' : ''}>${currency.code} - ${currency.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Bank Name (Optional)</label>
                        <input type="text" class="form-input" name="bank_name" value="${account?.bank_name || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Account Number (Optional)</label>
                        <input type="text" class="form-input" name="account_number" value="${account?.account_number || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Account Holder (Optional)</label>
                        <input type="text" class="form-input" name="account_holder" value="${account?.account_holder || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notes (Optional)</label>
                        <textarea class="form-input" name="notes" rows="3">${account?.notes || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Update Account' : 'Add Account'}</button>
                        ${isEdit ? '<button type="button" class="btn btn-danger" onclick="app.deleteAccount(' + accountId + ')">Delete</button>' : ''}
                    </div>
                </form>
            </div>
        `;

        this.showModal(modalContent);

        // Handle form submission
        document.getElementById('account-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const accountData = Object.fromEntries(formData.entries());

            try {
                if (isEdit) {
                    await this.updateAccount(accountId, accountData);
                } else {
                    await this.createAccount(accountData);
                }
                this.closeModal();
            } catch (error) {
                console.error('Account operation failed:', error);
                this.showToast('Failed to save account', 'error');
            }
        });
    }

    async createAccount(accountData) {
        try {
            const { data, error } = await this.supabase
                .from('accounts')
                .insert([{
                    user_id: this.user.id,
                    name: accountData.name,
                    type: accountData.type,
                    balance: parseFloat(accountData.balance),
                    currency: accountData.currency,
                    bank_name: accountData.bank_name || null,
                    account_number: accountData.account_number || null,
                    account_holder: accountData.account_holder || null,
                    notes: accountData.notes || null
                }])
                .select()
                .single();

            if (error) {
                throw error;
            }

            this.accounts.unshift(data);
            this.updateUI();
            this.showToast('Account created successfully', 'success');

        } catch (error) {
            console.error('Failed to create account:', error);
            throw error;
        }
    }

    async updateAccount(accountId, accountData) {
        try {
            const { data, error } = await this.supabase
                .from('accounts')
                .update({
                    name: accountData.name,
                    type: accountData.type,
                    balance: parseFloat(accountData.balance),
                    currency: accountData.currency,
                    bank_name: accountData.bank_name || null,
                    account_number: accountData.account_number || null,
                    account_holder: accountData.account_holder || null,
                    notes: accountData.notes || null
                })
                .eq('id', accountId)
                .eq('user_id', this.user.id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            const accountIndex = this.accounts.findIndex(a => a.id === accountId);
            if (accountIndex !== -1) {
                this.accounts[accountIndex] = data;
            }

            this.updateUI();
            this.showToast('Account updated successfully', 'success');

        } catch (error) {
            console.error('Failed to update account:', error);
            throw error;
        }
    }

    async deleteAccount(accountId) {
        if (!confirm('Are you sure you want to delete this account? This will also delete all associated transactions.')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('accounts')
                .delete()
                .eq('id', accountId)
                .eq('user_id', this.user.id);

            if (error) {
                throw error;
            }

            this.accounts = this.accounts.filter(a => a.id !== accountId);
            this.transactions = this.transactions.filter(t => t.account_id !== accountId);

            this.updateUI();
            this.closeModal();
            this.showToast('Account deleted successfully', 'success');

        } catch (error) {
            console.error('Failed to delete account:', error);
            this.showToast('Failed to delete account', 'error');
        }
    }

    editAccount(accountId) {
        this.showAccountModal(accountId);
    }

    addMoneyToAccount(accountId) {
        this.showTransactionModal(null, accountId, 'income');
    }

    // Transaction Management
    showTransactionModal(transactionId = null, preselectedAccountId = null, preselectedType = 'expense') {
        if (this.accounts.length === 0) {
            this.showToast('Please add an account first', 'info');
            return;
        }

        const isEdit = transactionId !== null;
        const transaction = isEdit ? this.transactions.find(t => t.id === transactionId) : null;

        const modalContent = `
            <div class="modal-header">
                <h3>${isEdit ? 'Edit Transaction' : 'Add Transaction'}</h3>
                <button class="modal-close" onclick="app.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="transaction-form">
                    <div class="form-group">
                        <label class="form-label">Transaction Type</label>
                        <select class="form-select" name="type" required>
                            <option value="expense" ${(transaction?.type || preselectedType) === 'expense' ? 'selected' : ''}>Expense</option>
                            <option value="income" ${(transaction?.type || preselectedType) === 'income' ? 'selected' : ''}>Income</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Account</label>
                        <select class="form-select" name="account_id" required>
                            ${this.accounts.map(account => 
                                `<option value="${account.id}" ${(transaction?.account_id || preselectedAccountId) == account.id ? 'selected' : ''}>
                                    ${account.name} - ${this.formatCurrency(account.balance, account.currency)}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Amount</label>
                        <input type="number" class="form-input" name="amount" value="${transaction?.amount || ''}" step="0.01" min="0.01" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <input type="text" class="form-input" name="description" value="${transaction?.description || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select class="form-select" name="category" required>
                            ${this.categories.map(category => 
                                `<option value="${category}" ${transaction?.category === category ? 'selected' : ''}>${category}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date</label>
                        <input type="date" class="form-input" name="date" value="${transaction?.date || new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Update Transaction' : 'Add Transaction'}</button>
                        ${isEdit ? '<button type="button" class="btn btn-danger" onclick="app.deleteTransaction(' + transactionId + ')">Delete</button>' : ''}
                    </div>
                </form>
            </div>
        `;

        this.showModal(modalContent);

        // Handle form submission
        document.getElementById('transaction-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const transactionData = Object.fromEntries(formData.entries());

            try {
                if (isEdit) {
                    await this.updateTransaction(transactionId, transactionData);
                } else {
                    await this.createTransaction(transactionData);
                }
                this.closeModal();
            } catch (error) {
                console.error('Transaction operation failed:', error);
                this.showToast('Failed to save transaction', 'error');
            }
        });
    }

    async createTransaction(transactionData) {
        try {
            const accountId = parseInt(transactionData.account_id);
            const amount = parseFloat(transactionData.amount);
            const account = this.accounts.find(a => a.id === accountId);

            if (!account) {
                throw new Error('Account not found');
            }

            // Check for sufficient balance if it's an expense
            if (transactionData.type === 'expense' && account.balance < amount) {
                throw new Error(`Insufficient balance. Account balance: ${this.formatCurrency(account.balance, account.currency)}`);
            }

            // Create transaction
            const { data: transactionResult, error: transactionError } = await this.supabase
                .from('transactions')
                .insert([{
                    user_id: this.user.id,
                    account_id: accountId,
                    amount: amount,
                    description: transactionData.description,
                    category: transactionData.category,
                    type: transactionData.type,
                    currency: account.currency,
                    date: transactionData.date
                }])
                .select()
                .single();

            if (transactionError) {
                throw transactionError;
            }

            // Update account balance
            const newBalance = transactionData.type === 'income' 
                ? account.balance + amount 
                : account.balance - amount;

            const { error: accountError } = await this.supabase
                .from('accounts')
                .update({ balance: newBalance })
                .eq('id', accountId);

            if (accountError) {
                throw accountError;
            }

            // Update local state
            account.balance = newBalance;
            this.transactions.unshift(transactionResult);

            this.updateUI();
            this.showToast('Transaction created successfully', 'success');

        } catch (error) {
            console.error('Failed to create transaction:', error);
            this.showToast(error.message || 'Failed to create transaction', 'error');
            throw error;
        }
    }

    async updateTransaction(transactionId, transactionData) {
        try {
            const oldTransaction = this.transactions.find(t => t.id === transactionId);
            if (!oldTransaction) {
                throw new Error('Transaction not found');
            }

            const oldAccount = this.accounts.find(a => a.id === oldTransaction.account_id);
            const newAccountId = parseInt(transactionData.account_id);
            const newAccount = this.accounts.find(a => a.id === newAccountId);
            const newAmount = parseFloat(transactionData.amount);

            if (!oldAccount || !newAccount) {
                throw new Error('Account not found');
            }

            // Revert old transaction effect
            if (oldTransaction.type === 'income') {
                oldAccount.balance -= oldTransaction.amount;
            } else {
                oldAccount.balance += oldTransaction.amount;
            }

            // Apply new transaction effect
            if (transactionData.type === 'income') {
                newAccount.balance += newAmount;
            } else {
                if (newAccount.balance < newAmount) {
                    throw new Error(`Insufficient balance. Account balance: ${this.formatCurrency(newAccount.balance, newAccount.currency)}`);
                }
                newAccount.balance -= newAmount;
            }

            // Update transaction
            const { data, error: transactionError } = await this.supabase
                .from('transactions')
                .update({
                    account_id: newAccountId,
                    amount: newAmount,
                    description: transactionData.description,
                    category: transactionData.category,
                    type: transactionData.type,
                    date: transactionData.date
                })
                .eq('id', transactionId)
                .eq('user_id', this.user.id)
                .select()
                .single();

            if (transactionError) {
                throw transactionError;
            }

            // Update account balances
            const updatePromises = [];

            if (oldAccount.id !== newAccount.id) {
                updatePromises.push(
                    this.supabase.from('accounts').update({ balance: oldAccount.balance }).eq('id', oldAccount.id)
                );
            }

            updatePromises.push(
                this.supabase.from('accounts').update({ balance: newAccount.balance }).eq('id', newAccount.id)
            );

            await Promise.all(updatePromises);

            // Update local state
            const transactionIndex = this.transactions.findIndex(t => t.id === transactionId);
            if (transactionIndex !== -1) {
                this.transactions[transactionIndex] = data;
            }

            this.updateUI();
            this.showToast('Transaction updated successfully', 'success');

        } catch (error) {
            console.error('Failed to update transaction:', error);
            this.showToast(error.message || 'Failed to update transaction', 'error');
            throw error;
        }
    }

    async deleteTransaction(transactionId) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        try {
            const transaction = this.transactions.find(t => t.id === transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            const account = this.accounts.find(a => a.id === transaction.account_id);
            if (!account) {
                throw new Error('Account not found');
            }

            // Revert transaction effect on account balance
            const newBalance = transaction.type === 'income' 
                ? account.balance - transaction.amount 
                : account.balance + transaction.amount;

            // Delete transaction
            const { error: transactionError } = await this.supabase
                .from('transactions')
                .delete()
                .eq('id', transactionId)
                .eq('user_id', this.user.id);

            if (transactionError) {
                throw transactionError;
            }

            // Update account balance
            const { error: accountError } = await this.supabase
                .from('accounts')
                .update({ balance: newBalance })
                .eq('id', account.id);

            if (accountError) {
                throw accountError;
            }

            // Update local state
            account.balance = newBalance;
            this.transactions = this.transactions.filter(t => t.id !== transactionId);

            this.updateUI();
            this.closeModal();
            this.showToast('Transaction deleted successfully', 'success');

        } catch (error) {
            console.error('Failed to delete transaction:', error);
            this.showToast(error.message || 'Failed to delete transaction', 'error');
        }
    }

    // Utility functions
    calculateTotalBalance() {
        return this.accounts.reduce((total, account) => {
            return total + this.convertCurrency(account.balance, account.currency, this.displayCurrency);
        }, 0);
    }

    calculateMonthlyIncome() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        return this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'income' && 
                       transactionDate.getMonth() === currentMonth &&
                       transactionDate.getFullYear() === currentYear;
            })
            .reduce((total, transaction) => {
                return total + this.convertCurrency(transaction.amount, transaction.currency, this.displayCurrency);
            }, 0);
    }

    calculateMonthlyExpenses() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        return this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'expense' && 
                       transactionDate.getMonth() === currentMonth &&
                       transactionDate.getFullYear() === currentYear;
            })
            .reduce((total, transaction) => {
                return total + this.convertCurrency(transaction.amount, transaction.currency, this.displayCurrency);
            }, 0);
    }

    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        const fromRate = this.currencyRates[fromCurrency] || 1;
        const toRate = this.currencyRates[toCurrency] || 1;

        // Convert to USD first, then to target currency
        const usdAmount = amount / fromRate;
        return usdAmount * toRate;
    }

    formatCurrency(amount, currency) {
        const currencyInfo = this.currencies.find(c => c.code === currency);
        const symbol = currencyInfo?.symbol || currency;

        return `${symbol}${Math.abs(amount).toFixed(2)}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    toggleBalanceVisibility() {
        this.balanceVisible = !this.balanceVisible;
        this.saveUserPreferences();
        this.updateUI();

        const toggleBtn = document.getElementById('balance-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.balanceVisible ? '👁️' : '🙈';
        }
    }

    // UI helpers
    showModal(content) {
        const overlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');

        if (overlay && modalContent) {
            modalContent.innerHTML = content;
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; cursor: pointer;">×</button>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Offline support
    processOfflineQueue() {
        // Process any queued operations when back online
        // Implementation depends on specific requirements
        console.log('Processing offline queue...');
    }

    // Service worker registration
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
});

// Make app globally available for onclick handlers
window.app = null;