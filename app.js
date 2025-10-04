// Progressive Web App - Enhanced Personal Finance Tracker
// With account-specific transactions, balance management, and LIVE FX rates via exchangerate.host

class FinanceApp {
    constructor() {
        // Static fallbacks (used only if no live rates available)
        this.currencies = [
            {code: "USD", symbol: "$", name: "US Dollar", rate: 1.0},
            {code: "EUR", symbol: "€", name: "Euro", rate: 0.85},
            {code: "GBP", symbol: "£", name: "British Pound", rate: 0.73},
            {code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 110.0},
            {code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 6.5},
            {code: "SEK", symbol: "kr", name: "Swedish Krona", rate: 10.87},
            {code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.35},
            {code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.25}
        ];

        // LIVE FX state
        this.fxRates = null; // object of { code: rateAgainstBase }
        this.fxBase = 'USD';
        this.lastFxUpdate = null; // timestamp

        // App state
        this.categories = [
            "Food & Dining", "Transportation", "Shopping", "Bills & Utilities",
            "Entertainment", "Health & Fitness", "Education", "Salary", 
            "Freelance", "Investment", "Other"
        ];

        this.accountTypes = ["Cash", "Card", "Bank", "Wallet"];

        this.currentScreen = 'dashboard';
        this.displayCurrency = 'USD';
        this.balanceVisible = true;
        this.accounts = [];
        this.transactions = [];

        // Dayjs relative time setup
        this.setupDayjs();

        this.init();
    }

    setupDayjs() {
        try {
            if (typeof dayjs !== 'undefined' && dayjs.extend) {
                // Try to extend with relative time plugin
                if (window.dayjs_plugin_relativeTime) {
                    dayjs.extend(window.dayjs_plugin_relativeTime);
                } else {
                    // Load the plugin manually if not available
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
            console.warn('dayjs setup failed, will use fallback time formatting:', e);
        }
    }

    init() {
        console.log('Initializing FinanceApp...');
        this.loadData();
        this.setupEventListeners();
        this.populateCurrencySelectors();
        this.renderUI();
        this.showScreen('dashboard');
        this.registerServiceWorker();
        
        // Ensure navigation is working
        setTimeout(() => {
            this.ensureNavigationVisible();
            this.setupNavigationEvents();
        }, 100);

        // Load saved FX from storage if available
        this.loadSavedFxRates();

        // Initial fetch of live FX rates with delay to ensure UI is ready
        setTimeout(() => {
            this.fetchFxRates('USD');
        }, 500);

        // Background updates every 6 hours
        this.fxInterval = setInterval(() => {
            this.fetchFxRates(this.fxBase || 'USD');
        }, 3600000 * 6);

        // Render last update info on load
        setTimeout(() => {
            this.renderFxUpdateInfo();
        }, 200);

        console.log('FinanceApp initialization complete');
    }

    loadSavedFxRates() {
        try {
            const savedRates = localStorage.getItem('financeApp_fxRates');
            const savedTs = localStorage.getItem('financeApp_fxTimestamp');
            if (savedRates) {
                this.fxRates = JSON.parse(savedRates);
                console.log('Loaded saved FX rates:', Object.keys(this.fxRates || {}).length, 'currencies');
            }
            if (savedTs) {
                this.lastFxUpdate = parseInt(savedTs, 10);
                console.log('Last FX update:', new Date(this.lastFxUpdate));
            }
        } catch (e) {
            console.warn('Failed to load saved FX rates:', e);
        }
    }

    ensureNavigationVisible() {
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'flex';
            bottomNav.style.position = 'fixed';
            bottomNav.style.bottom = '0';
            bottomNav.style.left = '0';
            bottomNav.style.right = '0';
            bottomNav.style.zIndex = '1000';
            bottomNav.style.visibility = 'visible';
            bottomNav.style.opacity = '1';
            console.log('Navigation bar made visible');
        } else {
            console.error('Navigation bar not found in DOM');
        }
    }

    setupNavigationEvents() {
        console.log('Setting up navigation events...');
        document.querySelectorAll('.nav-btn').forEach((btn, index) => {
            console.log(`Setting up navigation button ${index}:`, btn.dataset.screen);
            
            // Remove existing listeners and add new ones
            btn.replaceWith(btn.cloneNode(true));
            const newBtn = document.querySelectorAll('.nav-btn')[index];
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const screen = newBtn.dataset.screen;
                console.log('Navigation clicked:', screen);
                this.showScreen(screen);
            });
        });
        console.log('Navigation events setup complete');
    }

    // Data Management
    loadData() {
        try {
            const savedAccounts = localStorage.getItem('financeApp_accounts');
            const savedTransactions = localStorage.getItem('financeApp_transactions');
            const savedCurrency = localStorage.getItem('financeApp_displayCurrency');
            const savedBalanceVisible = localStorage.getItem('financeApp_balanceVisible');

            if (savedAccounts) {
                this.accounts = JSON.parse(savedAccounts);
            } else {
                // Seed with sample account (SEK)
                this.accounts = [{
                    id: 1,
                    name: "Spärbanken",
                    type: "Bank",
                    balance: 6202.00,
                    currency: "SEK",
                    bankName: "Spärbanken",
                    accountNumber: "****45-2",
                    createdAt: new Date().toISOString()
                }];
                this.saveData();
            }

            if (savedTransactions) {
                this.transactions = JSON.parse(savedTransactions);
            }

            if (savedCurrency) {
                this.displayCurrency = savedCurrency;
            }

            if (savedBalanceVisible !== null) {
                this.balanceVisible = JSON.parse(savedBalanceVisible);
            }

            console.log('Data loaded - Accounts:', this.accounts.length, 'Transactions:', this.transactions.length);
        } catch (e) {
            console.warn('Failed to load data from storage:', e);
        }
    }

    saveData() {
        try {
            localStorage.setItem('financeApp_accounts', JSON.stringify(this.accounts));
            localStorage.setItem('financeApp_transactions', JSON.stringify(this.transactions));
            localStorage.setItem('financeApp_displayCurrency', this.displayCurrency);
            localStorage.setItem('financeApp_balanceVisible', JSON.stringify(this.balanceVisible));
        } catch (e) {
            console.warn('Failed to save data to storage:', e);
        }
    }

    // LIVE FX: Fetch and manage rates
    async fetchFxRates(base = 'USD') {
        console.log('Fetching FX rates with base:', base);
        const refreshBtn = document.getElementById('refreshFxBtn');
        
        try {
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.classList.add('loading');
                refreshBtn.textContent = '';
            }
            
            const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`;
            console.log('Fetching from URL:', url);
            
            const res = await fetch(url);
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const data = await res.json();
            console.log('FX API response:', data);
            
            if (data && data.rates && typeof data.rates === 'object') {
                this.fxRates = data.rates;
                this.fxBase = data.base || base;
                this.lastFxUpdate = Date.now();
                
                // Persist to storage
                try {
                    localStorage.setItem('financeApp_fxRates', JSON.stringify(this.fxRates));
                    localStorage.setItem('financeApp_fxTimestamp', String(this.lastFxUpdate));
                } catch (e) {
                    console.warn('Failed to save FX rates to storage:', e);
                }

                // Update currency list dynamically from API keys
                this.updateCurrenciesFromRates();
                
                // Update UI
                this.renderFxUpdateInfo();
                this.renderUI();
                
                console.log('FX rates updated successfully. Base:', this.fxBase, 'Currencies:', Object.keys(this.fxRates).length);
                
                // Show success message
                this.showToast('Exchange rates updated successfully!', 'success');
            } else {
                throw new Error('Invalid FX API response format');
            }
        } catch (e) {
            console.error('FX fetch failed:', e);
            this.showToast('Unable to update rates. Using last saved data.', 'error');
            
            // If we have no saved rates, show fallback message
            if (!this.fxRates) {
                console.log('No saved rates available, using static fallback rates');
            }
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.classList.remove('loading');
                refreshBtn.textContent = 'Refresh Exchange Rates';
            }
        }
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
                    // Fallback if dayjs relative time is not available
                    const now = Date.now();
                    const diff = now - this.lastFxUpdate;
                    const minutes = Math.floor(diff / (1000 * 60));
                    const hours = Math.floor(minutes / 60);
                    const days = Math.floor(hours / 24);
                    
                    let timeAgo;
                    if (days > 0) {
                        timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
                    } else if (hours > 0) {
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

    updateCurrenciesFromRates() {
        if (!this.fxRates) return;
        
        const symbolMap = {
            USD: '$', EUR: '€', GBP: '£', SEK: 'kr', NOK: 'kr', DKK: 'kr', JPY: '¥', CNY: '¥',
            AUD: 'A$', CAD: 'C$', CHF: 'Fr', NZD: '$', INR: '₹', ZAR: 'R', RUB: '₽',
            KRW: '₩', SGD: '$', HKD: '$', MXN: '$', BRL: 'R$', TRY: '₺', PLN: 'zł',
            CZK: 'Kč', HUF: 'Ft', ILS: '₪', AED: 'د.إ', SAR: '﷼', THB: '฿', PHP: '₱', 
            RON: 'lei', BGN: 'лв'
        };

        // Build new currencies list with rates relative to fxBase
        const codes = Object.keys(this.fxRates).sort();
        this.currencies = codes.map(code => ({
            code,
            symbol: symbolMap[code] || code,
            name: code, // Could be enhanced with full names
            rate: this.fxRates[code]
        }));

        // Ensure base currency is present with rate 1
        if (!this.fxRates[this.fxBase]) {
            this.fxRates[this.fxBase] = 1;
        }
        if (!this.currencies.find(c => c.code === this.fxBase)) {
            this.currencies.unshift({ 
                code: this.fxBase, 
                symbol: symbolMap[this.fxBase] || this.fxBase, 
                name: this.fxBase, 
                rate: 1 
            });
        }

        console.log('Updated currencies from API:', this.currencies.length, 'currencies available');

        // Update dropdowns and lists with new codes
        this.refreshCurrencySelectorsOptions();
    }

    refreshCurrencySelectorsOptions() {
        const selects = [
            document.getElementById('displayCurrency'),
            document.getElementById('settingsCurrencySelect')
        ].filter(Boolean);

        selects.forEach(sel => {
            const current = this.displayCurrency;
            sel.innerHTML = '';
            this.currencies
                .slice() // copy
                .sort((a, b) => a.code.localeCompare(b.code))
                .forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.code;
                    opt.textContent = `${c.code}`;
                    sel.appendChild(opt);
                });
            sel.value = current;
        });

        // Currency selector modal list
        this.populateCurrencySelectors();
    }

    // Transactions
    createTransaction(transactionData) {
        const account = this.accounts.find(a => a.id === parseInt(transactionData.accountId));
        if (!account) {
            throw new Error('Account not found');
        }

        const validation = this.validateTransaction(
            transactionData.amount, 
            transactionData.accountId, 
            transactionData.type
        );
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        const newTransaction = {
            id: Date.now(),
            amount: parseFloat(transactionData.amount),
            description: transactionData.description,
            category: transactionData.category,
            type: transactionData.type,
            accountId: parseInt(transactionData.accountId),
            date: transactionData.date || new Date().toISOString().split('T')[0],
            currency: account.currency,
            createdAt: new Date().toISOString()
        };

        if (transactionData.type === 'expense') {
            account.balance -= parseFloat(transactionData.amount);
        } else {
            account.balance += parseFloat(transactionData.amount);
        }

        this.transactions.push(newTransaction);
        this.saveData();
        this.renderUI();
        
        console.log('Transaction created:', newTransaction);
        return newTransaction;
    }

    validateTransaction(amount, accountId, type) {
        const account = this.accounts.find(a => a.id === parseInt(accountId));
        if (!account) {
            return { valid: false, message: 'Please select an account' };
        }
        if (type === 'expense' && parseFloat(amount) > account.balance) {
            return { 
                valid: false, 
                message: `Insufficient balance. Account balance: ${this.formatCurrency(account.balance, account.currency)}` 
            };
        }
        return { valid: true };
    }

    // Currency Conversion: Prefer LIVE fxRates
    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;

        if (this.fxRates && this.fxBase) {
            // Convert via fxBase using live rates
            const rates = this.fxRates;
            const base = this.fxBase;

            // First to base
            let amountInBase = amount;
            if (fromCurrency !== base) {
                const fromRate = rates[fromCurrency];
                if (!fromRate || fromRate === 0) {
                    console.warn(`No rate for ${fromCurrency}, falling back to static rates`);
                    return this.convertCurrencyStatic(amount, fromCurrency, toCurrency);
                }
                amountInBase = amount / fromRate;
            }
            
            // Then to target
            if (toCurrency === base) return amountInBase;
            const toRate = rates[toCurrency];
            if (!toRate || toRate === 0) {
                console.warn(`No rate for ${toCurrency}, falling back to static rates`);
                return this.convertCurrencyStatic(amount, fromCurrency, toCurrency);
            }
            return amountInBase * toRate;
        }

        // Fallback to static currency table
        return this.convertCurrencyStatic(amount, fromCurrency, toCurrency);
    }

    convertCurrencyStatic(amount, fromCurrency, toCurrency) {
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
                const account = this.accounts.find(a => a.id === t.accountId);
                const convertedAmount = this.convertCurrency(t.amount, account?.currency || t.currency, this.displayCurrency);
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
                const account = this.accounts.find(a => a.id === t.accountId);
                const convertedAmount = this.convertCurrency(t.amount, account?.currency || t.currency, this.displayCurrency);
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
                    <div class="account-meta">${account.type}${account.accountNumber ? ' • ' + account.accountNumber : ''}</div>
                </div>
            </div>
            <div class="account-balance">
                <div class="primary-balance">${this.formatCurrency(account.balance, account.currency)}</div>
                <div class="converted-balance">≈ ${this.formatCurrency(convertedBalance, this.displayCurrency)}</div>
                <button class="add-money-btn" data-add-money="${account.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                </button>
            </div>
        `;
        // Attach handler
        const btn = card.querySelector('[data-add-money]');
        if (btn) {
            btn.addEventListener('click', () => this.showAddMoneyModal(account.id));
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
            .slice(0, 5);

        transactionsList.innerHTML = recentTransactions.map(transaction => {
            const account = this.accounts.find(a => a.id === transaction.accountId);
            const convertedAmount = this.convertCurrency(
                transaction.amount, 
                account?.currency || transaction.currency, 
                this.displayCurrency
            );

            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-icon ${transaction.type}">
                            ${transaction.type === 'expense' ? '-' : '+'}
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-description">${transaction.description}</div>
                            <div class="transaction-meta">
                                <span>${transaction.category}</span>
                                <span>•</span>
                                <span class="transaction-account">from ${account?.name || 'Unknown Account'}</span>
                                <span>•</span>
                                <span>${new Date(transaction.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'expense' ? '-' : '+'}${this.formatCurrency(convertedAmount, this.displayCurrency)}
                    </div>
                </div>
            `;
        }).join('');
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
            const account = this.accounts.find(a => a.id === expense.accountId);
            const convertedAmount = this.convertCurrency(
                expense.amount, 
                account?.currency || expense.currency, 
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

    setupTransactionValidation() {
        const amountInput = document.getElementById('transactionAmount');
        const accountSelect = document.getElementById('accountSelect');
        const typeSelect = document.getElementById('transactionType');
        const warningDiv = document.getElementById('balanceWarning');
        const submitBtn = document.getElementById('submitTransactionBtn');
        const dateInput = document.getElementById('transactionDate');

        if (!amountInput || !accountSelect || !typeSelect) return;

        if (dateInput) {
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
                const validation = this.validateTransaction(amount, accountId, type);
                if (!validation.valid) {
                    if (warningDiv) {
                        warningDiv.textContent = validation.message;
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

    // Event Listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Balance toggle
        const toggleBalance = document.getElementById('toggleBalance');
        if (toggleBalance) {
            toggleBalance.addEventListener('click', (e) => {
                e.preventDefault();
                this.balanceVisible = !this.balanceVisible;
                this.saveData();
                this.updateNetWorth();
            });
        }

        // Currency selector modal open
        const currencySelector = document.getElementById('currencySelector');
        if (currencySelector) {
            currencySelector.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal('currencySelectorModal');
            });
        }

        // Display currency change (Accounts screen)
        const displayCurrency = document.getElementById('displayCurrency');
        if (displayCurrency) {
            displayCurrency.addEventListener('change', (e) => {
                this.displayCurrency = e.target.value;
                this.saveData();
                this.renderUI();
            });
        }

        // Settings currency change (Settings screen)
        const settingsCurrencySelect = document.getElementById('settingsCurrencySelect');
        if (settingsCurrencySelect) {
            settingsCurrencySelect.addEventListener('change', (e) => {
                this.displayCurrency = e.target.value;
                this.saveData();
                this.renderUI();
            });
        }

        // Manual refresh FX
        const refreshFxBtn = document.getElementById('refreshFxBtn');
        if (refreshFxBtn) {
            refreshFxBtn.addEventListener('click', () => {
                console.log('Manual FX refresh clicked');
                this.fetchFxRates(this.fxBase || 'USD');
            });
        }

        // Modal controls (close)
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = e.currentTarget.dataset.modal;
                this.hideModal(modalId);
            });
        });

        // Add account/transaction buttons
        const addAccountBtn = document.getElementById('addAccountBtn');
        const addAccountFab = document.getElementById('addAccountFab');
        const addTransactionBtn = document.getElementById('addTransactionBtn');

        if (addAccountBtn) {
            addAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal('addAccountModal');
            });
        }
        if (addAccountFab) {
            addAccountFab.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal('addAccountModal');
            });
        }
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal('addTransactionModal');
            });
        }

        // Forms
        const addAccountForm = document.getElementById('addAccountForm');
        const addTransactionForm = document.getElementById('addTransactionForm');

        if (addAccountForm) {
            addAccountForm.addEventListener('submit', (e) => this.handleAddAccount(e));
        }
        if (addTransactionForm) {
            addTransactionForm.addEventListener('submit', (e) => this.handleAddTransaction(e));
        }

        // Currency selection in modal
        document.addEventListener('click', (e) => {
            const opt = e.target.closest('.currency-option');
            if (opt) {
                const currencyCode = opt.dataset.currency;
                this.displayCurrency = currencyCode;
                this.saveData();
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
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeNavBtn = document.querySelector(`[data-screen="${screenName}"]`);
        if (activeNavBtn) activeNavBtn.classList.add('active');

        // Update screens
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        const target = document.getElementById(screenName);
        if (target) target.classList.add('active');

        this.currentScreen = screenName;
        this.renderUI();
        
        console.log('Screen shown:', screenName);
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            if (modalId === 'addTransactionModal') {
                setTimeout(() => {
                    this.populateAccountSelectors();
                    this.setupTransactionValidation();
                }, 50);
            }
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    // Form Handlers
    handleAddAccount(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newAccount = {
            id: Date.now(),
            name: formData.get('accountName'),
            type: formData.get('accountType'),
            balance: parseFloat(formData.get('initialBalance')) || 0,
            currency: formData.get('currency'),
            bankName: formData.get('bankName') || '',
            accountNumber: formData.get('accountNumber') || '',
            createdAt: new Date().toISOString()
        };
        this.accounts.push(newAccount);
        this.saveData();
        this.renderUI();
        this.hideModal('addAccountModal');
        e.target.reset();
        this.showNotification('Account added successfully!');
    }

    handleAddTransaction(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const transactionData = {
            amount: formData.get('amount'),
            description: formData.get('description'),
            category: formData.get('category'),
            type: formData.get('type'),
            accountId: formData.get('accountId'),
            date: formData.get('date')
        };
        try {
            this.createTransaction(transactionData);
            this.hideModal('addTransactionModal');
            e.target.reset();
            this.showNotification('Transaction added successfully!');
        } catch (error) {
            const warningDiv = document.getElementById('balanceWarning');
            if (warningDiv) {
                warningDiv.textContent = error.message;
                warningDiv.classList.add('error');
            }
        }
    }

    showAddMoneyModal(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        if (account) {
            const amount = prompt(`Add money to ${account.name}:`, '100');
            if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                const transactionData = {
                    amount: amount,
                    description: `Deposit to ${account.name}`,
                    category: 'Other',
                    type: 'income',
                    accountId: accountId,
                    date: new Date().toISOString().split('T')[0]
                };
                try {
                    this.createTransaction(transactionData);
                    this.showNotification('Money added successfully!');
                } catch (error) {
                    this.showNotification('Error adding money: ' + error.message);
                }
            }
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showToast(message, type = 'warning') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (document.body.contains(toast)) document.body.removeChild(toast);
            }, 300);
        }, 2500);
    }

    // PWA Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const swCode = `
                    const CACHE_NAME = 'finance-app-v1';
                    const urlsToCache = [
                        '/',
                        '/index.html',
                        '/style.css',
                        '/app.js'
                    ];

                    self.addEventListener('install', event => {
                        event.waitUntil(
                            caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
                        );
                    });

                    self.addEventListener('fetch', event => {
                        event.respondWith(
                            caches.match(event.request).then(response => {
                                return response || fetch(event.request);
                            })
                        );
                    });
                `;
                const blob = new Blob([swCode], { type: 'application/javascript' });
                const swUrl = URL.createObjectURL(blob);
                await navigator.serviceWorker.register(swUrl);
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
}

// Initialize the app when DOM is loaded (guard to avoid double-init)
(function initOnce(){
    if (window.financeApp) return;
    const start = () => {
        if (!window.financeApp) {
            console.log('Starting FinanceApp...');
            window.financeApp = new FinanceApp();
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();