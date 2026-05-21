import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Select } from '@/components/ui';
import { useAccounts } from '../../hooks/useAccounts';
import { formatCurrency } from '@/lib/currency';

type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'SEK';

export function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const { accounts, isLoading } = useAccounts();

  // Calculate total balance in selected currency
  const totalBalance = accounts.reduce((sum, account) => {
    // Simple conversion (in a real app, you'd use live exchange rates)
    let amount = account.balance;
    
    if (account.currency !== currency) {
      // Basic conversion rates (USD as base)
      const rates: Record<CurrencyCode, number> = {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        SEK: 10.50,
      };
      
      // Convert to USD first, then to target currency
      const accountCurrency = account.currency as CurrencyCode;
      const inUSD = amount / (rates[accountCurrency] || 1);
      amount = inUSD * rates[currency];
    }
    
    return sum + amount;
  }, 0);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Balance</p>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {showBalance ? formatCurrency(totalBalance, currency) : '••••••'}
            </h2>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? (
                <EyeOff className="w-5 h-5 text-gray-500" />
              ) : (
                <Eye className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <Select
          value={currency}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCurrency(e.target.value as CurrencyCode)}
          options={[
            { value: 'USD', label: 'USD' },
            { value: 'EUR', label: 'EUR' },
            { value: 'GBP', label: 'GBP' },
            { value: 'JPY', label: 'JPY' },
            { value: 'SEK', label: 'SEK' },
          ]}
          className="w-24"
        />
      </div>

      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Accounts:</span>
          <span className="ml-1 font-medium text-gray-900 dark:text-white">{accounts.length}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Active:</span>
          <span className="ml-1 font-medium text-green-600 dark:text-green-400">
            {accounts.filter(a => a.balance > 0).length}
          </span>
        </div>
      </div>
    </Card>
  );
}
