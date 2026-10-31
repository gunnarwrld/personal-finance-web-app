import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Select } from '@/components/ui';
import { useAccounts } from '../../hooks/useAccounts';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { convertCurrency, formatCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency';

export function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const { accounts, isLoading } = useAccounts();
  const { rates } = useCurrency();
  const { preferences } = useUserPreferences();

  // Default to the currency chosen in Settings until the user picks another.
  const currency = selectedCurrency || preferences?.display_currency || 'USD';

  // Convert every account with the stored exchange rates (USD-based).
  const totalBalance = accounts.reduce(
    (sum, account) => sum + convertCurrency(account.balance, account.currency, currency, rates),
    0
  );

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

        <div className="w-28 flex-shrink-0">
          <Select
            value={currency}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCurrency(e.target.value)}
            options={SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }))}
            aria-label="Display currency"
          />
        </div>
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
