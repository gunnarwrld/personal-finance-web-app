// Supabase-Integrated Personal Finance Tracker
// Full CRUD operations with real-time sync and Google authentication
// Demo mode available for testing when OAuth is not configured

class FinanceApp {
    constructor() {
        // Initialize Supabase client
        this.supabaseUrl = 'https://pmeajlxzukzhcmjmclbf.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZWFqbHh6dWt6aGNtam1jbGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTQ0MDEsImV4cCI6MjA3NTE3MDQwMX0.FUn2vZ2AbM5jqrP1NFyl4sbtbvljkrPhgdT91sNhtdc';
        
        this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);

        // Demo mode for when OAuth is not configured
        this.demoMode = false;
        this.authTimeout = null;
        this.demoUser = {
            id: 'demo-user-123',
            email: 'demo@financetracker.com',
            user_metadata: {
                avatar_url: null
            }
        };

        // App state
        this.user = null;
        this.currentScreen = 'auth';
        this.displayCurrency = 'USD';
        this.balanceVisible = true;
        this.accounts = [];
        this.transactions = [];
        this.currencyRates = {};
        this.lastFxUpdate = null;
        
        // Offline queue for when connection is lost
        this.offlineQueue = [];
        this.isOnline = navigator.onLine;
        this.realtimeEnabled = true;
        
        // Edit states
        this.editingAccount = null;
        this.editingTransaction = null;
        
        // Currency data
        this.currencies = [
            {code: "USD", symbol: "$", name: "US Dollar"},
            {code: "EUR", symbol: "€", name: "Euro"},
            {code: "GBP", symbol: "£", name: "British Pound"},
            {code: "JPY", symbol: "¥", name: "Japanese Yen"},
            {code: "CNY", symbol: "¥", name: "Chinese Yuan"},
            {code: "SEK", symbol: "kr", name: "Swedish Krona"},
            {code: "AUD", symbol: "A$", name: "Australian Dollar"},
            {code: "CAD", symbol: "C$", name: "Canadian Dollar"}
        ];

        this.categories = [
            "Food & Dining", "Transportation", "Shopping", "Bills & Utilities",
            "Entertainment", "Health & Fitness", "Education", "Salary", 
            "Freelance", "Investment", "Other"
        ];

        this.accountTypes = ["Cash", "Card", "Bank", "Wallet"];

        this.init();
    }

    async init() {
        console.log('Initializing Supabase Finance App...');
        
        // Setup dayjs
        this.setupDayjs();
        
        // Setup offline/online detection
        this.setupOfflineHandling();
        
        // Setup event listeners first
        this.setupEventListeners();
        
        // Check authentication state
        await this.checkAuthState();
        
        // Setup realtime subscriptions if authenticated
        if (this.user && !this.demoMode) {
            await this.setupRealtimeSubscriptions();
            await this.loadUserData();
        } else if (this.user && this.demoMode) {
            await this.loadDemoData();
        }
        
        // Always try to sync currency rates
        await this.syncCurrencyRates();
        
        console.log('App initialization complete');
    }

    setupDayjs() {
        try {
            if (typeof dayjs !== 'undefined' && dayjs.extend) {
                if (window.dayjs_plugin_relativeTime) {
                    dayjs.extend(window.dayjs_plugin_relativeTime);
                } else {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/dayjs@1/plugin/relativeTime.js';
                    script.onload = () => {
                        if (window.dayjs_plugin_relativeTime) {
                            dayjs.extend(window.dayjs_plugin_relativeTime);
                        }
                    };
                    document.head.appendChild(script);
                }
            }
        } catch (e) {
            console.warn('dayjs setup failed:', e);
        }
    }

    setupOfflineHandling() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            if (!this.demoMode) {
                this.processOfflineQueue();
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
        });

        this.updateConnectionStatus();
    }

    updateConnectionStatus() {
        const indicators = document.querySelectorAll('.sync-indicator');
        const offlineStatus = document.getElementById('offlineStatus');
        
        indicators.forEach(indicator => {
            const dot = indicator.querySelector('.sync-dot');
            if (dot) {
                dot.classList.toggle('offline', !this.isOnline);
            }
        });

        if (offlineStatus) {
            offlineStatus.textContent = this.demoMode ? 'Demo Mode' : (this.isOnline ? 'Connected' : 'Offline');
        }
    }

    async processOfflineQueue() {
        if (!this.isOnline || this.offlineQueue.length === 0 || this.demoMode) return;

        console.log('Processing offline queue:', this.offlineQueue.length, 'items');
        
        for (const operation of this.offlineQueue) {
            try {
                await this.executeOperation(operation);
            } catch (error) {
                console.error('Failed to process queued operation:', error);
            }
        }
        
        this.offlineQueue = [];
        await this.loadUserData();
    }

    async executeOperation(operation) {
        if (this.demoMode) return;
        
        const { type, data } = operation;
        
        switch (type) {
            case 'create_account':
                await this.createAccountInDB(data);
                break;
            case 'update_account':
                await this.updateAccountInDB(data.id, data);
                break;
            case 'delete_account':
                await this.deleteAccountFromDB(data.id);
                break;
            case 'create_transaction':
                await this.createTransactionInDB(data);
                break;
            case 'update_transaction':
                await this.updateTransactionInDB(data.id, data);
                break;
            case 'delete_transaction':
                await this.deleteTransactionFromDB(data.id);
                break;
        }
    }

    // Demo data for testing when OAuth is not available
    async loadDemoData() {
        this.accounts = [
            {
                id: 1,
                name: "Main Checking",
                type: "Bank",
                balance: 2580.45,
                currency: "USD",
                bank_name: "Chase Bank",
                account_number: "****1234",
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                name: "Savings Account",
                type: "Bank",
                balance: 15420.80,
                currency: "USD",
                bank_name: "Chase Bank",
                account_number: "****5678",
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                name: "Credit Card",
                type: "Card",
                balance: -1240.30,
                currency: "USD",
                bank_name: "Capital One",
                account_number: "****9876",
                created_at: new Date().toISOString()
            }
        ];

        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        this.transactions = [
            {
                id: 1,
                account_id: 1,
                amount: 85.50,
                description: "Grocery Store",
                category: "Food & Dining",
                type: "expense",
                currency: "USD",
                date: today.toISOString().split('T')[0],
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                account_id: 1,
                amount: 3200.00,
                description: "Monthly Salary",
                category: "Salary",
                type: "income",
                currency: "USD",
                date: thisMonth.toISOString().split('T')[0],
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                account_id: 3,
                amount: 45.20,
                description: "Gas Station",
                category: "Transportation",
                type: "expense",
                currency: "USD",
                date: new Date(today.getTime() - 86400000).toISOString().split('T')[0],
                created_at: new Date().toISOString()
            },
            {
                id: 4,
                account_id: 1,
                amount: 120.00,
                description: "Electricity Bill",
                category: "Bills & Utilities",
                type: "expense",
                currency: "USD",
                date: new Date(today.getTime() - 172800000).toISOString().split('T')[0],
                created_at: new Date().toISOString()
            },
            {
                id: 5,
                account_id: 1,
                amount: 500.00,
                description: "Freelance Project",
                category: "Freelance",
                type: "income",
                currency: "USD",
                date: new Date(today.getTime() - 259200000).toISOString().split('T')[0],
                created_at: new Date().toISOString()
            }
        ];

        console.log('Demo data loaded - Accounts:', this.accounts.length, 'Transactions:', this.transactions.length);
    }

    // Authentication
    async checkAuthState() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session?.user) {
                this.user = session.user;
                this.showMainApp();
            } else {
                this.showAuthScreen();
                
                // Set up automatic demo mode fallback after 3 seconds
                this.authTimeout = setTimeout(() => {
                    console.log('Auto-starting demo mode after timeout');
                    this.startDemoMode();
                }, 3000);
            }

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                
                // Clear timeout if auth state changes
                if (this.authTimeout) {
                    clearTimeout(this.authTimeout);
                    this.authTimeout = null;
                }
                
                if (event === 'SIGNED_IN' && session?.user) {
                    this.user = session.user;
                    this.demoMode = false;
                    this.showMainApp();
                    this.setupRealtimeSubscriptions();
                    this.loadUserData();
                    this.syncCurrencyRates();
                } else if (event === 'SIGNED_OUT') {
                    this.user = null;
                    this.demoMode = false;
                    this.showAuthScreen();
                    this.cleanup();
                }
            });
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthScreen();
            
            // Immediate fallback to demo mode on auth error
            setTimeout(() => {
                console.log('Auth check failed, starting demo mode');
                this.startDemoMode();
            }, 1000);
        }
    }

    async signInWithGoogle() {
        console.log('Starting Google sign in process...');
        
        // Clear any existing timeout
        if (this.authTimeout) {
            clearTimeout(this.authTimeout);
            this.authTimeout = null;
        }
        
        try {
            this.setSyncStatus('auth', true);
            
            // Set up immediate fallback timer
            const fallbackTimeout = setTimeout(() => {
                console.log('OAuth timeout, starting demo mode');
                this.startDemoMode();
            }, 2000);
            
            const { error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });

            // Clear fallback if we get here
            clearTimeout(fallbackTimeout);

            if (error) {
                console.error('Google OAuth error:', error);
                throw error;
            }
            
        } catch (error) {
            console.error('Google sign in failed:', error);
            // Immediate demo mode on any error
            this.startDemoMode();
        } finally {
            this.setSyncStatus('auth', false);
        }
    }

    startDemoMode() {
        console.log('Starting demo mode');
        
        // Clear any error states and timeouts
        if (this.authTimeout) {
            clearTimeout(this.authTimeout);
            this.authTimeout = null;
        }
        this.setSyncStatus('auth', false);
        
        // Prevent multiple demo mode starts
        if (this.demoMode) {
            console.log('Demo mode already active');
            return;
        }
        
        // Set demo mode
        this.demoMode = true;
        this.user = this.demoUser;
        
        // Show warning toast
        this.showToast('Demo mode active - OAuth not configured. All changes are temporary.', 'warning');
        
        // Load demo data and show main app
        this.loadDemoData().then(() => {
            this.showMainApp();
            this.syncCurrencyRates();
        }).catch(error => {
            console.error('Failed to load demo data:', error);
            this.showMainApp(); // Show anyway
        });
    }

    async signOut() {
        try {
            if (this.demoMode) {
                this.demoMode = false;
                this.user = null;
                this.showAuthScreen();
                this.cleanup();
                this.showToast('Demo session ended', 'success');
                return;
            }
            
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            this.showToast('Signed out successfully', 'success');
        } catch (error) {
            console.error('Sign out failed:', error);
            this.showToast('Failed to sign out', 'error');
        }
    }

    showAuthScreen() {
        this.currentScreen = 'auth';
        this.showScreen('auth');
        this.setSyncStatus('auth', false);
        
        // Add demo mode button after 1 second
        setTimeout(() => {
            this.addDemoModeButton();
        }, 1000);
    }

    addDemoModeButton() {
        const authContent = document.querySelector('.auth-content');
        if (authContent && !document.getElementById('demoModeBtn')) {
            const demoBtn = document.createElement('button');
            demoBtn.id = 'demoModeBtn';
            demoBtn.className = 'btn btn--outline';
            demoBtn.style.marginTop = '16px';
            demoBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>
                Try Demo Mode
            `;
            demoBtn.addEventListener('click', () => this.startDemoMode());
            authContent.appendChild(demoBtn);
        }
    }

    showMainApp() {
        if (this.user) {
            this.updateUserProfile();
            this.showScreen('dashboard');
            this.currentScreen = 'dashboard';
            
            // Make sure navigation is visible and working
            setTimeout(() => {
                this.ensureNavigationVisible();
                this.renderUI();
            }, 100);
        }
    }

    ensureNavigationVisible() {
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'flex';
            bottomNav.style.visibility = 'visible';
            bottomNav.style.opacity = '1';
        }
    }

    updateUserProfile() {
        if (!this.user) return;

        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');
        const defaultAvatar = document.getElementById('defaultAvatar');

        if (userEmail) {
            userEmail.textContent = this.demoMode ? 'Demo User' : (this.user.email || 'Unknown User');
        }

        if (this.user.user_metadata?.avatar_url && userAvatar && defaultAvatar && !this.demoMode) {
            userAvatar.src = this.user.user_metadata.avatar_url;
            userAvatar.style.display = 'block';
            defaultAvatar.style.display = 'none';
        }
    }

    cleanup() {
        // Clean up subscriptions and reset state
        this.accounts = [];
        this.transactions = [];
        if (this.realtimeSubscription) {
            this.realtimeSubscription.unsubscribe();
        }
        if (this.authTimeout) {
            clearTimeout(this.authTimeout);
            this.authTimeout = null;
        }
    }

    // Real-time subscriptions
    async setupRealtimeSubscriptions() {
        if (!this.user || !this.realtimeEnabled || this.demoMode) return;

        try {
            // Subscribe to accounts changes
            this.supabase
                .channel('accounts-changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${this.user.id}` },
                    (payload) => this.handleAccountChange(payload)
                )
                .subscribe();

            // Subscribe to transactions changes
            this.supabase
                .channel('transactions-changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${this.user.id}` },
                    (payload) => this.handleTransactionChange(payload)
                )
                .subscribe();

            console.log('Real-time subscriptions setup complete');
        } catch (error) {
            console.error('Failed to setup realtime subscriptions:', error);
        }
    }

    handleAccountChange(payload) {
        console.log('Account change:', payload);
        this.setSyncStatus('accounts', true);
        
        setTimeout(async () => {
            await this.loadAccounts();
            this.renderUI();
            this.setSyncStatus('accounts', false);
        }, 500);
    }

    handleTransactionChange(payload) {
        console.log('Transaction change:', payload);
        this.setSyncStatus('balance', true);
        
        setTimeout(async () => {
            await this.loadTransactions();
            await this.loadAccounts(); // Refresh balances
            this.renderUI();
            this.setSyncStatus('balance', false);
        }, 500);
    }

    setSyncStatus(type, syncing) {
        const indicators = {
            'auth': document.getElementById('syncStatus'),
            'accounts': document.getElementById('accountsSync'),
            'balance': document.getElementById('balanceSync')
        };

        const indicator = indicators[type];
        if (indicator) {
            const dot = indicator.querySelector('.sync-dot');
            if (dot) {
                dot.classList.toggle('syncing', syncing);
            }
            
            const span = indicator.querySelector('span');
            if (span) {
                if (this.demoMode) {
                    span.textContent = 'Demo Mode';
                } else {
                    span.textContent = syncing ? 'Syncing...' : 'Synced';
                }
            }
        }
    }

    // Database operations
    async loadUserData() {
        if (!this.user || this.demoMode) return;

        try {
            await Promise.all([
                this.loadAccounts(),
                this.loadTransactions(),
                this.loadCurrencyRates()
            ]);
            
            this.renderUI();
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.showToast('Failed to load data', 'error');
        }
    }

    async loadAccounts() {
        if (!this.user || this.demoMode) return;

        try {
            const { data, error } = await this.supabase
                .from('accounts')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.accounts = data || [];
            console.log('Loaded accounts:', this.accounts.length);
        } catch (error) {
            console.error('Failed to load accounts:', error);
            throw error;
        }
    }

    async loadTransactions() {
        if (!this.user || this.demoMode) return;

        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .select('*')
                .eq('user_id', this.user.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.transactions = data || [];
            console.log('Loaded transactions:', this.transactions.length);
        } catch (error) {
            console.error('Failed to load transactions:', error);
            throw error;
        }
    }

    async createAccountInDB(accountData) {
        if (this.demoMode) {
            // Simulate database operation in demo mode
            const newAccount = {
                id: Date.now(),
                user_id: this.user.id,
                name: accountData.name,
                type: accountData.type,
                balance: parseFloat(accountData.balance) || 0,
                currency: accountData.currency,
                bank_name: accountData.bankName || null,
                account_number: accountData.accountNumber || null,
                account_holder: accountData.accountHolder || null,
                notes: accountData.notes || null,
                created_at: new Date().toISOString()
            };
            
            this.accounts.push(newAccount);
            return newAccount;
        }

        const { data, error } = await this.supabase
            .from('accounts')
            .insert({
                user_id: this.user.id,
                name: accountData.name,
                type: accountData.type,
                balance: parseFloat(accountData.balance) || 0,
                currency: accountData.currency,
                bank_name: accountData.bankName || null,
                account_number: accountData.accountNumber || null,
                account_holder: accountData.accountHolder || null,
                notes: accountData.notes || null
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateAccountInDB(accountId, accountData) {
        if (this.demoMode) {
            const accountIndex = this.accounts.findIndex(a => a.id === accountId);
            if (accountIndex >= 0) {
                this.accounts[accountIndex] = {
                    ...this.accounts[accountIndex],
                    name: accountData.name,
                    type: accountData.type,
                    balance: parseFloat(accountData.balance),
                    currency: accountData.currency,
                    bank_name: accountData.bankName || null,
                    account_number: accountData.accountNumber || null,
                    account_holder: accountData.accountHolder || null,
                    notes: accountData.notes || null,
                    updated_at: new Date().toISOString()
                };
                return this.accounts[accountIndex];
            }
            throw new Error('Account not found');
        }

        const { data, error } = await this.supabase
            .from('accounts')
            .update({
                name: accountData.name,
                type: accountData.type,
                balance: parseFloat(accountData.balance),
                currency: accountData.currency,
                bank_name: accountData.bankName || null,
                account_number: accountData.accountNumber || null,
                account_holder: accountData.accountHolder || null,
                notes: accountData.notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', accountId)
            .eq('user_id', this.user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteAccountFromDB(accountId) {
        if (this.demoMode) {
            // Remove transactions for this account
            this.transactions = this.transactions.filter(t => t.account_id !== accountId);
            // Remove the account
            this.accounts = this.accounts.filter(a => a.id !== accountId);
            return;
        }

        // First delete all transactions for this account
        await this.supabase
            .from('transactions')
            .delete()
            .eq('account_id', accountId)
            .eq('user_id', this.user.id);

        // Then delete the account
        const { error } = await this.supabase
            .from('accounts')
            .delete()
            .eq('id', accountId)
            .eq('user_id', this.user.id);

        if (error) throw error;
    }

    async createTransactionInDB(transactionData) {
        if (this.demoMode) {
            // Find account and update balance
            const account = this.accounts.find(a => a.id === parseInt(transactionData.accountId));
            if (!account) throw new Error('Account not found');

            const amount = parseFloat(transactionData.amount);
            account.balance = transactionData.type === 'expense' 
                ? account.balance - amount 
                : account.balance + amount;

            // Create transaction
            const newTransaction = {
                id: Date.now(),
                user_id: this.user.id,
                account_id: parseInt(transactionData.accountId),
                amount: amount,
                description: transactionData.description,
                category: transactionData.category,
                type: transactionData.type,
                currency: account.currency,
                date: transactionData.date,
                created_at: new Date().toISOString()
            };

            this.transactions.unshift(newTransaction);
            return newTransaction;
        }

        // First, update account balance
        const account = this.accounts.find(a => a.id === parseInt(transactionData.accountId));
        if (!account) throw new Error('Account not found');

        const amount = parseFloat(transactionData.amount);
        const newBalance = transactionData.type === 'expense' 
            ? account.balance - amount 
            : account.balance + amount;

        // Update account balance
        await this.supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', account.id)
            .eq('user_id', this.user.id);

        // Create transaction
        const { data, error } = await this.supabase
            .from('transactions')
            .insert({
                user_id: this.user.id,
                account_id: parseInt(transactionData.accountId),
                amount: amount,
                description: transactionData.description,
                category: transactionData.category,
                type: transactionData.type,
                currency: account.currency,
                date: transactionData.date
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateTransactionInDB(transactionId, transactionData) {
        if (this.demoMode) {
            // Get original transaction to calculate balance adjustment
            const originalTransaction = this.transactions.find(t => t.id === transactionId);
            if (!originalTransaction) throw new Error('Transaction not found');

            const account = this.accounts.find(a => a.id === originalTransaction.account_id);
            if (!account) throw new Error('Account not found');

            // Reverse original transaction
            const originalAmount = originalTransaction.amount;
            const newAmount = parseFloat(transactionData.amount);
            
            let balanceAdjustment = 0;
            if (originalTransaction.type === 'expense') {
                balanceAdjustment += originalAmount; // Add back
            } else {
                balanceAdjustment -= originalAmount; // Subtract back
            }

            // Apply new transaction
            if (transactionData.type === 'expense') {
                balanceAdjustment -= newAmount;
            } else {
                balanceAdjustment += newAmount;
            }

            account.balance += balanceAdjustment;

            // Update transaction
            const transactionIndex = this.transactions.findIndex(t => t.id === transactionId);
            if (transactionIndex >= 0) {
                this.transactions[transactionIndex] = {
                    ...this.transactions[transactionIndex],
                    amount: newAmount,
                    description: transactionData.description,
                    category: transactionData.category,
                    type: transactionData.type,
                    date: transactionData.date,
                    updated_at: new Date().toISOString()
                };
                return this.transactions[transactionIndex];
            }
            throw new Error('Transaction not found');
        }

        // Get original transaction to calculate balance adjustment
        const originalTransaction = this.transactions.find(t => t.id === transactionId);
        if (!originalTransaction) throw new Error('Transaction not found');

        const account = this.accounts.find(a => a.id === originalTransaction.account_id);
        if (!account) throw new Error('Account not found');

        // Reverse original transaction
        const originalAmount = originalTransaction.amount;
        const newAmount = parseFloat(transactionData.amount);
        
        let balanceAdjustment = 0;
        if (originalTransaction.type === 'expense') {
            balanceAdjustment += originalAmount; // Add back
        } else {
            balanceAdjustment -= originalAmount; // Subtract back
        }

        // Apply new transaction
        if (transactionData.type === 'expense') {
            balanceAdjustment -= newAmount;
        } else {
            balanceAdjustment += newAmount;
        }

        const newBalance = account.balance + balanceAdjustment;

        // Update account balance
        await this.supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', account.id)
            .eq('user_id', this.user.id);

        // Update transaction
        const { data, error } = await this.supabase
            .from('transactions')
            .update({
                amount: newAmount,
                description: transactionData.description,
                category: transactionData.category,
                type: transactionData.type,
                date: transactionData.date,
                updated_at: new Date().toISOString()
            })
            .eq('id', transactionId)
            .eq('user_id', this.user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteTransactionFromDB(transactionId) {
        if (this.demoMode) {
            // Get transaction to reverse balance change
            const transaction = this.transactions.find(t => t.id === transactionId);
            if (!transaction) throw new Error('Transaction not found');

            const account = this.accounts.find(a => a.id === transaction.account_id);
            if (!account) throw new Error('Account not found');

            // Reverse transaction effect on balance
            const balanceAdjustment = transaction.type === 'expense' 
                ? transaction.amount  // Add back expense
                : -transaction.amount; // Subtract back income

            account.balance += balanceAdjustment;

            // Remove transaction
            this.transactions = this.transactions.filter(t => t.id !== transactionId);
            return;
        }

        // Get transaction to reverse balance change
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) throw new Error('Transaction not found');

        const account = this.accounts.find(a => a.id === transaction.account_id);
        if (!account) throw new Error('Account not found');

        // Reverse transaction effect on balance
        const balanceAdjustment = transaction.type === 'expense' 
            ? transaction.amount  // Add back expense
            : -transaction.amount; // Subtract back income

        const newBalance = account.balance + balanceAdjustment;

        // Update account balance
        await this.supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', account.id)
            .eq('user_id', this.user.id);

        // Delete transaction
        const { error } = await this.supabase
            .from('transactions')
            .delete()
            .eq('id', transactionId)
            .eq('user_id', this.user.id);

        if (error) throw error;
    }

    // Currency rates management
    async syncCurrencyRates() {
        try {
            console.log('Syncing currency rates...');
            
            const response = await fetch('https://api.exchangerate.host/latest?base=USD');
            const data = await response.json();
            
            if (data && data.rates) {
                if (!this.demoMode) {
                    // Save to database
                    await this.supabase
                        .from('currency_rates')
                        .upsert({
                            base_currency: 'USD',
                            rates: data.rates,
                            last_updated: new Date().toISOString()
                        }, {
                            onConflict: 'base_currency'
                        });
                }

                this.currencyRates = data.rates;
                this.lastFxUpdate = Date.now();
                
                this.updateCurrenciesFromRates();
                this.renderFxUpdateInfo();
                this.renderUI();
                
                console.log('Currency rates synced successfully');
            }
        } catch (error) {
            console.error('Failed to sync currency rates:', error);
            // Load cached rates from database
            if (!this.demoMode) {
                await this.loadCurrencyRates();
            }
        }
    }

    async loadCurrencyRates() {
        if (this.demoMode) return;
        
        try {
            const { data, error } = await this.supabase
                .from('currency_rates')
                .select('*')
                .eq('base_currency', 'USD')
                .single();

            if (data && !error) {
                this.currencyRates = data.rates;
                this.lastFxUpdate = new Date(data.last_updated).getTime();
                this.updateCurrenciesFromRates();
                this.renderFxUpdateInfo();
            }
        } catch (error) {
            console.error('Failed to load currency rates:', error);
        }
    }

    updateCurrenciesFromRates() {
        if (!this.currencyRates || Object.keys(this.currencyRates).length === 0) return;

        const symbolMap = {
            USD: '$', EUR: '€', GBP: '£', SEK: 'kr', NOK: 'kr', DKK: 'kr', 
            JPY: '¥', CNY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'Fr'
        };

        // Update currencies with live rates
        const codes = Object.keys(this.currencyRates).sort();
        this.currencies = codes.map(code => ({
            code,
            symbol: symbolMap[code] || code,
            name: code,
            rate: this.currencyRates[code]
        }));

        // Ensure USD is included with rate 1
        if (!this.currencies.find(c => c.code === 'USD')) {
            this.currencies.unshift({ 
                code: 'USD', 
                symbol: '$', 
                name: 'US Dollar', 
                rate: 1 
            });
        }

        this.populateCurrencySelectors();
    }

    renderFxUpdateInfo() {
        const el = document.getElementById('fxLastUpdateText');
        if (!el) return;
        
        if (this.lastFxUpdate) {
            try {
                if (typeof dayjs !== 'undefined' && dayjs().fromNow) {
                    const rel = dayjs(this.lastFxUpdate).fromNow();
                    el.textContent = `Rates updated: ${rel}`;
                } else {
                    const minutes = Math.floor((Date.now() - this.lastFxUpdate) / (1000 * 60));
                    const hours = Math.floor(minutes / 60);
                    
                    let timeAgo;
                    if (hours > 0) {
                        timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
                    } else if (minutes > 0) {
                        timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
                    } else {
                        timeAgo = 'just now';
                    }
                    
                    el.textContent = `Rates updated: ${timeAgo}`;
                }
            } catch (e) {
                el.textContent = `Rates updated: ${new Date(this.lastFxUpdate).toLocaleString()}`;
            }
        } else {
            el.textContent = 'Rates updated: --';
        }
    }

    // CRUD Operations with offline support
    async createAccount(accountData) {
        try {
            if (this.isOnline && !this.demoMode) {
                const newAccount = await this.createAccountInDB(accountData);
                this.showToast('Account created successfully!', 'success');
                return newAccount;
            } else if (this.demoMode) {
                const newAccount = await this.createAccountInDB(accountData);
                this.renderUI();
                this.showToast('Account created in demo mode!', 'success');
                return newAccount;
            } else {
                this.offlineQueue.push({ type: 'create_account', data: accountData });
                this.showToast('Account saved offline. Will sync when connected.', 'success');
                return null;
            }
        } catch (error) {
            console.error('Failed to create account:', error);
            this.showToast('Failed to create account', 'error');
            throw error;
        }
    }

    async updateAccount(accountId, accountData) {
        try {
            if (this.isOnline && !this.demoMode) {
                const updatedAccount = await this.updateAccountInDB(accountId, accountData);
                this.showToast('Account updated successfully!', 'success');
                return updatedAccount;
            } else if (this.demoMode) {
                const updatedAccount = await this.updateAccountInDB(accountId, accountData);
                this.renderUI();
                this.showToast('Account updated in demo mode!', 'success');
                return updatedAccount;
            } else {
                this.offlineQueue.push({ type: 'update_account', data: { id: accountId, ...accountData } });
                this.showToast('Account updated offline. Will sync when connected.', 'success');
                return null;
            }
        } catch (error) {
            console.error('Failed to update account:', error);
            this.showToast('Failed to update account', 'error');
            throw error;
        }
    }

    async deleteAccount(accountId) {
        try {
            if (this.isOnline && !this.demoMode) {
                await this.deleteAccountFromDB(accountId);
                this.showToast('Account deleted successfully!', 'success');
            } else if (this.demoMode) {
                await this.deleteAccountFromDB(accountId);
                this.renderUI();
                this.showToast('Account deleted in demo mode!', 'success');
            } else {
                this.offlineQueue.push({ type: 'delete_account', data: { id: accountId } });
                this.showToast('Account deleted offline. Will sync when connected.', 'success');
            }
        } catch (error) {
            console.error('Failed to delete account:', error);
            this.showToast('Failed to delete account', 'error');
            throw error;
        }
    }

    async createTransaction(transactionData) {
        try {
            if (this.isOnline && !this.demoMode) {
                const newTransaction = await this.createTransactionInDB(transactionData);
                this.showToast('Transaction created successfully!', 'success');
                return newTransaction;
            } else if (this.demoMode) {
                const newTransaction = await this.createTransactionInDB(transactionData);
                this.renderUI();
                this.showToast('Transaction created in demo mode!', 'success');
                return newTransaction;
            } else {
                this.offlineQueue.push({ type: 'create_transaction', data: transactionData });
                this.showToast('Transaction saved offline. Will sync when connected.', 'success');
                return null;
            }
        } catch (error) {
            console.error('Failed to create transaction:', error);
            this.showToast('Failed to create transaction', 'error');
            throw error;
        }
    }

    async updateTransaction(transactionId, transactionData) {
        try {
            if (this.isOnline && !this.demoMode) {
                const updatedTransaction = await this.updateTransactionInDB(transactionId, transactionData);
                this.showToast('Transaction updated successfully!', 'success');
                return updatedTransaction;
            } else if (this.demoMode) {
                const updatedTransaction = await this.updateTransactionInDB(transactionId, transactionData);
                this.renderUI();
                this.showToast('Transaction updated in demo mode!', 'success');
                return updatedTransaction;
            } else {
                this.offlineQueue.push({ type: 'update_transaction', data: { id: transactionId, ...transactionData } });
                this.showToast('Transaction updated offline. Will sync when connected.', 'success');
                return null;
            }
        } catch (error) {
            console.error('Failed to update transaction:', error);
            this.showToast('Failed to update transaction', 'error');
            throw error;
        }
    }

    async deleteTransaction(transactionId) {
        try {
            if (this.isOnline && !this.demoMode) {
                await this.deleteTransactionFromDB(transactionId);
                this.showToast('Transaction deleted successfully!', 'success');
            } else if (this.demoMode) {
                await this.deleteTransactionFromDB(transactionId);
                this.renderUI();
                this.showToast('Transaction deleted in demo mode!', 'success');
            } else {
                this.offlineQueue.push({ type: 'delete_transaction', data: { id: transactionId } });
                this.showToast('Transaction deleted offline. Will sync when connected.', 'success');
            }
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            this.showToast('Failed to delete transaction', 'error');
            throw error;
        }
    }

    // Currency conversion
    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;

        if (this.currencyRates && Object.keys(this.currencyRates).length > 0) {
            const fromRate = this.currencyRates[fromCurrency] || 1;
            const toRate = this.currencyRates[toCurrency] || 1;
            
            // Convert through USD base
            const usdAmount = amount / fromRate;
            return usdAmount * toRate;
        }

        // Fallback to static rates
        const fromRate = this.currencies.find(c => c.code === fromCurrency)?.rate || 1;
        const toRate = this.currencies.find(c => c.code === toCurrency)?.rate || 1;
        const usdAmount = amount / fromRate;
        return usdAmount * toRate;
    }

    getCurrencySymbol(currencyCode) {
        return this.currencies.find(c => c.code === currencyCode)?.symbol || currencyCode;
    }

    formatCurrency(amount, currencyCode) {
        const symbol = this.getCurrencySymbol(currencyCode);
        return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    // UI Rendering
    renderUI() {
        if (!this.user) return;
        
        this.updateNetWorth();
        this.updateMonthlySummary();
        this.updateAccountsList();
        this.updateTransactionsList();
        this.updateAnalytics();
        this.updateCurrencySelectors();
    }

    updateNetWorth() {
        const totalBalance = this.accounts.reduce((total, account) => {
            const convertedAmount = this.convertCurrency(account.balance, account.currency, this.displayCurrency);
            return total + convertedAmount;
        }, 0);

        const balanceElement = document.getElementById('totalBalance');
        const currencyBtn = document.getElementById('currencySelector');
        const accountBalanceElement = document.getElementById('totalAccountBalance');

        if (balanceElement) {
            balanceElement.textContent = this.formatCurrency(totalBalance, this.displayCurrency);
            balanceElement.classList.toggle('balance-hidden', !this.balanceVisible);
        }

        if (currencyBtn) {
            currencyBtn.textContent = this.displayCurrency;
        }

        if (accountBalanceElement) {
            accountBalanceElement.textContent = this.formatCurrency(totalBalance, this.displayCurrency);
        }
    }

    updateMonthlySummary() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyIncome = this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'income' && 
                       transactionDate.getMonth() === currentMonth && 
                       transactionDate.getFullYear() === currentYear;
            })
            .reduce((total, t) => {
                const convertedAmount = this.convertCurrency(t.amount, t.currency, this.displayCurrency);
                return total + convertedAmount;
            }, 0);

        const monthlyExpenses = this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'expense' && 
                       transactionDate.getMonth() === currentMonth && 
                       transactionDate.getFullYear() === currentYear;
            })
            .reduce((total, t) => {
                const convertedAmount = this.convertCurrency(t.amount, t.currency, this.displayCurrency);
                return total + convertedAmount;
            }, 0);

        document.querySelectorAll('.income-amount').forEach(el => {
            el.textContent = this.formatCurrency(monthlyIncome, this.displayCurrency);
        });

        document.querySelectorAll('.expense-amount').forEach(el => {
            el.textContent = this.formatCurrency(monthlyExpenses, this.displayCurrency);
        });

        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;
        const savingsRateElement = document.querySelector('.savings-rate');
        if (savingsRateElement) {
            savingsRateElement.textContent = `${Math.max(0, savingsRate).toFixed(1)}%`;
        }
    }

    updateAccountsList() {
        const accountsList = document.getElementById('accountsList');
        if (!accountsList) return;

        if (this.accounts.length === 0) {
            accountsList.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <p>No accounts yet</p>
                    <span>Add your first account to start tracking your finances</span>
                </div>
            `;
            return;
        }

        accountsList.innerHTML = '';
        this.accounts.forEach(account => {
            const accountCard = this.createAccountCard(account);
            accountsList.appendChild(accountCard);
        });
    }

    createAccountCard(account) {
        const convertedBalance = this.convertCurrency(account.balance, account.currency, this.displayCurrency);
        const card = document.createElement('div');
        card.className = 'account-card';
        card.innerHTML = `
            <div class="account-info">
                <div class="account-icon ${account.type.toLowerCase()}">
                    ${this.getAccountIcon(account.type)}
                </div>
                <div class="account-details">
                    <div class="account-name">${account.name}</div>
                    <div class="account-meta">${account.type}${account.account_number ? ' • ' + account.account_number : ''}</div>
                </div>
            </div>
            <div class="account-balance">
                <div class="primary-balance">${this.formatCurrency(account.balance, account.currency)}</div>
                <div class="converted-balance">≈ ${this.formatCurrency(convertedBalance, this.displayCurrency)}</div>
            </div>
            <div class="account-actions">
                <button class="account-action-btn edit" data-edit-account="${account.id}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="account-action-btn delete" data-delete-account="${account.id}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            </div>
        `;
        
        // Add event listeners
        const editBtn = card.querySelector('[data-edit-account]');
        const deleteBtn = card.querySelector('[data-delete-account]');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditAccountModal(account);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDeleteConfirmation(
                    'Delete Account',
                    `Are you sure you want to delete "${account.name}"? This will also delete all associated transactions.`,
                    () => this.handleDeleteAccount(account.id)
                );
            });
        }
        
        return card;
    }

    getAccountIcon(type) {
        const icons = {
            'Bank': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 21h18"/>
                        <path d="M5 21V7l8-4v18"/>
                        <path d="M19 21V11l-6-4"/>
                     </svg>`,
            'Card': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                     </svg>`,
            'Cash': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="l7-7 5 5 5-5"/>
                     </svg>`,
            'Wallet': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
                          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
                       </svg>`
        };
        return icons[type] || icons['Bank'];
    }

    updateTransactionsList() {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;

        if (this.transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 12h8"/>
                    </svg>
                    <p>No transactions yet</p>
                    <span>Start tracking your finances by adding your first transaction</span>
                </div>
            `;
            return;
        }

        const recentTransactions = this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        transactionsList.innerHTML = recentTransactions.map(transaction => {
            const account = this.accounts.find(a => a.id === transaction.account_id);
            const convertedAmount = this.convertCurrency(
                transaction.amount, 
                transaction.currency, 
                this.displayCurrency
            );

            return `
                <div class="transaction-item" data-transaction-id="${transaction.id}">
                    <div class="transaction-info">
                        <div class="transaction-icon ${transaction.type}">
                            ${transaction.type === 'expense' ? '-' : '+'}
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-description">${transaction.description}</div>
                            <div class="transaction-meta">
                                <span>${transaction.category}</span>
                                <span>•</span>
                                <span class="transaction-account">${account?.name || 'Unknown Account'}</span>
                                <span>•</span>
                                <span>${new Date(transaction.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'expense' ? '-' : '+'}${this.formatCurrency(convertedAmount, this.displayCurrency)}
                    </div>
                    <div class="transaction-actions">
                        <button class="transaction-action-btn edit" data-edit-transaction="${transaction.id}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="transaction-action-btn delete" data-delete-transaction="${transaction.id}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for transaction actions
        transactionsList.querySelectorAll('[data-edit-transaction]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const transactionId = parseInt(btn.dataset.editTransaction);
                const transaction = this.transactions.find(t => t.id === transactionId);
                if (transaction) {
                    this.showEditTransactionModal(transaction);
                }
            });
        });

        transactionsList.querySelectorAll('[data-delete-transaction]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const transactionId = parseInt(btn.dataset.deleteTransaction);
                const transaction = this.transactions.find(t => t.id === transactionId);
                if (transaction) {
                    this.showDeleteConfirmation(
                        'Delete Transaction',
                        `Are you sure you want to delete the transaction "${transaction.description}"?`,
                        () => this.handleDeleteTransaction(transactionId)
                    );
                }
            });
        });
    }

    updateAnalytics() {
        const spendingChart = document.getElementById('spendingChart');
        if (!spendingChart) return;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyExpenses = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'expense' && 
                   transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });

        if (monthlyExpenses.length === 0) {
            spendingChart.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c.34 0 .68.02 1.01.07"/>
                        <path d="M16 2v6h6"/>
                    </svg>
                    <p>No expenses yet</p>
                    <span>Start tracking to see your spending breakdown</span>
                </div>
            `;
            return;
        }

        const categoryTotals = {};
        monthlyExpenses.forEach(expense => {
            const convertedAmount = this.convertCurrency(
                expense.amount, 
                expense.currency, 
                this.displayCurrency
            );
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + convertedAmount;
        });

        const totalExpenses = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

        spendingChart.innerHTML = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .map(([category, amount]) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100).toFixed(1) : '0.0';
                return `
                    <div class="category-item">
                        <div class="category-info">
                            <span class="category-name">${category}</span>
                            <span class="category-amount">${this.formatCurrency(amount, this.displayCurrency)}</span>
                        </div>
                        <div class="category-bar">
                            <div class="category-progress" style="width: ${percentage}%"></div>
                        </div>
                        <span class="category-percentage">${percentage}%</span>
                    </div>
                `;
            }).join('');
    }

    updateCurrencySelectors() {
        const currencySelectors = document.querySelectorAll('#displayCurrency, .currency-select, #settingsCurrencySelect');
        currencySelectors.forEach(selector => {
            if (selector) selector.value = this.displayCurrency;
        });
    }

    populateCurrencySelectors() {
        const currencyList = document.getElementById('currencyList');
        if (currencyList) {
            currencyList.innerHTML = this.currencies.map(currency => `
                <div class="currency-option ${currency.code === this.displayCurrency ? 'selected' : ''}" data-currency="${currency.code}">
                    <div class="currency-info">
                        <div class="currency-code">${currency.code}</div>
                        <div class="currency-name">${currency.name}</div>
                    </div>
                    <div class="currency-symbol">${currency.symbol}</div>
                </div>
            `).join('');
        }
    }

    populateAccountSelectors() {
        const accountSelect = document.getElementById('accountSelect');
        if (accountSelect) {
            accountSelect.innerHTML = '<option value="">Choose account...</option>';
            this.accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${account.name} - ${this.formatCurrency(account.balance, account.currency)}`;
                accountSelect.appendChild(option);
            });
        }
    }

    // Event Listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Auth button
        const signInBtn = document.getElementById('signInBtn');
        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        // Sign out button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }

        // Navigation
        document.querySelectorAll('.nav-btn').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const screen = btn.dataset.screen;
                this.showScreen(screen);
            });
        });

        // Balance toggle
        const toggleBalance = document.getElementById('toggleBalance');
        if (toggleBalance) {
            toggleBalance.addEventListener('click', () => {
                this.balanceVisible = !this.balanceVisible;
                this.updateNetWorth();
            });
        }

        // Currency selector
        const currencySelector = document.getElementById('currencySelector');
        if (currencySelector) {
            currencySelector.addEventListener('click', () => {
                this.showModal('currencySelectorModal');
            });
        }

        // Display currency changes
        const displayCurrency = document.getElementById('displayCurrency');
        if (displayCurrency) {
            displayCurrency.addEventListener('change', (e) => {
                this.displayCurrency = e.target.value;
                this.renderUI();
            });
        }

        const settingsCurrencySelect = document.getElementById('settingsCurrencySelect');
        if (settingsCurrencySelect) {
            settingsCurrencySelect.addEventListener('change', (e) => {
                this.displayCurrency = e.target.value;
                this.renderUI();
            });
        }

        // Refresh FX button
        const refreshFxBtn = document.getElementById('refreshFxBtn');
        if (refreshFxBtn) {
            refreshFxBtn.addEventListener('click', () => this.syncCurrencyRates());
        }

        // Realtime toggle
        const realtimeToggle = document.getElementById('realtimeToggle');
        if (realtimeToggle) {
            realtimeToggle.addEventListener('change', (e) => {
                this.realtimeEnabled = e.target.checked;
                if (this.realtimeEnabled && !this.demoMode) {
                    this.setupRealtimeSubscriptions();
                }
            });
        }

        // Add buttons
        const addAccountBtn = document.getElementById('addAccountBtn');
        const addAccountFab = document.getElementById('addAccountFab');
        const addTransactionBtn = document.getElementById('addTransactionBtn');

        if (addAccountBtn) {
            addAccountBtn.addEventListener('click', () => this.showAddAccountModal());
        }
        if (addAccountFab) {
            addAccountFab.addEventListener('click', () => this.showAddAccountModal());
        }
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => this.showAddTransactionModal());
        }

        // Forms
        const addAccountForm = document.getElementById('addAccountForm');
        const addTransactionForm = document.getElementById('addTransactionForm');

        if (addAccountForm) {
            addAccountForm.addEventListener('submit', (e) => this.handleAccountForm(e));
        }
        if (addTransactionForm) {
            addTransactionForm.addEventListener('submit', (e) => this.handleTransactionForm(e));
        }

        // Modal controls
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = e.currentTarget.dataset.modal;
                this.hideModal(modalId);
            });
        });

        // Currency selection
        document.addEventListener('click', (e) => {
            const opt = e.target.closest('.currency-option');
            if (opt) {
                const currencyCode = opt.dataset.currency;
                this.displayCurrency = currencyCode;
                this.renderUI();
                this.hideModal('currencySelectorModal');
            }
        });

        // Close modals on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        console.log('Event listeners setup complete');
    }

    // Screen Navigation
    showScreen(screenName) {
        console.log('Showing screen:', screenName);
        
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeNavBtn = document.querySelector(`[data-screen="${screenName}"]`);
        if (activeNavBtn) activeNavBtn.classList.add('active');

        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        const target = document.getElementById(screenName);
        if (target) target.classList.add('active');

        this.currentScreen = screenName;
        
        if (this.user) {
            this.renderUI();
        }
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            
            // Reset edit states
            if (modalId === 'addAccountModal') {
                this.resetAccountModal();
            } else if (modalId === 'addTransactionModal') {
                this.resetTransactionModal();
            }
        }
    }

    showAddAccountModal() {
        this.editingAccount = null;
        this.resetAccountModal();
        this.showModal('addAccountModal');
    }

    showEditAccountModal(account) {
        this.editingAccount = account;
        
        // Populate form
        const form = document.getElementById('addAccountForm');
        form.accountName.value = account.name;
        form.accountType.value = account.type;
        form.initialBalance.value = account.balance;
        form.currency.value = account.currency;
        form.bankName.value = account.bank_name || '';
        form.accountNumber.value = account.account_number || '';
        
        // Update modal UI
        document.getElementById('accountModalTitle').textContent = 'Edit Account';
        document.getElementById('saveAccountBtn').querySelector('.btn-text').textContent = 'Save Changes';
        document.getElementById('deleteAccountBtn').classList.remove('hidden');
        
        this.showModal('addAccountModal');
    }

    resetAccountModal() {
        document.getElementById('accountModalTitle').textContent = 'Add Account';
        document.getElementById('saveAccountBtn').querySelector('.btn-text').textContent = 'Add Account';
        document.getElementById('deleteAccountBtn').classList.add('hidden');
        document.getElementById('addAccountForm').reset();
    }

    showAddTransactionModal() {
        this.editingTransaction = null;
        this.resetTransactionModal();
        this.populateAccountSelectors();
        this.setupTransactionValidation();
        this.showModal('addTransactionModal');
    }

    showEditTransactionModal(transaction) {
        this.editingTransaction = transaction;
        this.populateAccountSelectors();
        
        // Populate form
        const form = document.getElementById('addTransactionForm');
        form.type.value = transaction.type;
        form.accountId.value = transaction.account_id;
        form.amount.value = transaction.amount;
        form.description.value = transaction.description;
        form.category.value = transaction.category;
        form.date.value = transaction.date;
        
        // Update modal UI
        document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
        document.getElementById('submitTransactionBtn').querySelector('.btn-text').textContent = 'Save Changes';
        document.getElementById('deleteTransactionBtn').classList.remove('hidden');
        
        this.setupTransactionValidation();
        this.showModal('addTransactionModal');
    }

    resetTransactionModal() {
        document.getElementById('transactionModalTitle').textContent = 'Add Transaction';
        document.getElementById('submitTransactionBtn').querySelector('.btn-text').textContent = 'Add Transaction';
        document.getElementById('deleteTransactionBtn').classList.add('hidden');
        
        const form = document.getElementById('addTransactionForm');
        form.reset();
        form.date.value = new Date().toISOString().split('T')[0];
    }

    setupTransactionValidation() {
        const amountInput = document.getElementById('transactionAmount');
        const accountSelect = document.getElementById('accountSelect');
        const typeSelect = document.getElementById('transactionType');
        const warningDiv = document.getElementById('balanceWarning');
        const submitBtn = document.getElementById('submitTransactionBtn');
        const dateInput = document.getElementById('transactionDate');

        if (!amountInput || !accountSelect || !typeSelect) return;

        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        const validateForm = () => {
            const amount = parseFloat(amountInput.value) || 0;
            const accountId = parseInt(accountSelect.value);
            const type = typeSelect.value;

            if (warningDiv) {
                warningDiv.textContent = '';
                warningDiv.className = 'validation-message';
            }

            amountInput.classList.remove('error', 'warning');

            if (amount > 0 && accountId && type === 'expense') {
                const account = this.accounts.find(a => a.id === accountId);
                if (account && amount > account.balance) {
                    if (warningDiv) {
                        warningDiv.textContent = `Insufficient balance. Account balance: ${this.formatCurrency(account.balance, account.currency)}`;
                        warningDiv.classList.add('error');
                    }
                    amountInput.classList.add('error');
                    if (submitBtn) submitBtn.disabled = true;
                    return false;
                }
            }
            
            if (submitBtn) submitBtn.disabled = false;
            return true;
        };

        amountInput.addEventListener('input', validateForm);
        accountSelect.addEventListener('change', validateForm);
        typeSelect.addEventListener('change', validateForm);
    }

    showDeleteConfirmation(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        
        const confirmOk = document.getElementById('confirmOk');
        const confirmCancel = document.getElementById('confirmCancel');
        
        const handleConfirm = () => {
            onConfirm();
            this.hideModal('confirmModal');
            confirmOk.removeEventListener('click', handleConfirm);
            confirmCancel.removeEventListener('click', handleCancel);
        };
        
        const handleCancel = () => {
            this.hideModal('confirmModal');
            confirmOk.removeEventListener('click', handleConfirm);
            confirmCancel.removeEventListener('click', handleCancel);
        };
        
        confirmOk.addEventListener('click', handleConfirm);
        confirmCancel.addEventListener('click', handleCancel);
        
        this.showModal('confirmModal');
    }

    // Form Handlers
    async handleAccountForm(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('saveAccountBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        try {
            // Show loading state
            btnText.style.opacity = '0';
            btnLoading.classList.remove('hidden');
            submitBtn.disabled = true;
            
            const formData = new FormData(e.target);
            const accountData = {
                name: formData.get('accountName'),
                type: formData.get('accountType'),
                balance: parseFloat(formData.get('initialBalance')) || 0,
                currency: formData.get('currency'),
                bankName: formData.get('bankName') || '',
                accountNumber: formData.get('accountNumber') || ''
            };

            if (this.editingAccount) {
                await this.updateAccount(this.editingAccount.id, accountData);
            } else {
                await this.createAccount(accountData);
            }

            this.hideModal('addAccountModal');
            e.target.reset();
            
            // Reload data to reflect changes (only if not demo mode)
            if (!this.demoMode) {
                await this.loadUserData();
            }
        } catch (error) {
            console.error('Form submission failed:', error);
        } finally {
            // Reset button state
            btnText.style.opacity = '1';
            btnLoading.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }

    async handleTransactionForm(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitTransactionBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        try {
            // Show loading state
            btnText.style.opacity = '0';
            btnLoading.classList.remove('hidden');
            submitBtn.disabled = true;
            
            const formData = new FormData(e.target);
            const transactionData = {
                amount: formData.get('amount'),
                description: formData.get('description'),
                category: formData.get('category'),
                type: formData.get('type'),
                accountId: formData.get('accountId'),
                date: formData.get('date')
            };

            if (this.editingTransaction) {
                await this.updateTransaction(this.editingTransaction.id, transactionData);
            } else {
                await this.createTransaction(transactionData);
            }

            this.hideModal('addTransactionModal');
            e.target.reset();
            
            // Reload data to reflect changes (only if not demo mode)
            if (!this.demoMode) {
                await this.loadUserData();
            }
        } catch (error) {
            console.error('Form submission failed:', error);
            const warningDiv = document.getElementById('balanceWarning');
            if (warningDiv) {
                warningDiv.textContent = error.message;
                warningDiv.classList.add('error');
            }
        } finally {
            // Reset button state
            btnText.style.opacity = '1';
            btnLoading.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }

    async handleDeleteAccount(accountId) {
        try {
            await this.deleteAccount(accountId);
            if (!this.demoMode) {
                await this.loadUserData();
            }
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    }

    async handleDeleteTransaction(transactionId) {
        try {
            await this.deleteTransaction(transactionId);
            if (!this.demoMode) {
                await this.loadUserData();
            }
        } catch (error) {
            console.error('Failed to delete transaction:', error);
        }
    }

    // Utility methods
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app
(function initApp() {
    if (window.financeApp) return;
    
    const start = () => {
        if (!window.financeApp) {
            console.log('Starting Supabase Finance App...');
            window.financeApp = new FinanceApp();
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();