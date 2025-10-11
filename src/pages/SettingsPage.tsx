import React from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isRefreshing, refreshRatesAsync } = useCurrency();
  const { preferences, updatePreferencesAsync, isUpdating } = useUserPreferences();

  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await updatePreferencesAsync({ display_currency: e.target.value });
    } catch (error) {
      console.error('Failed to update currency:', error);
    }
  };

  const handleRefreshRates = async () => {
    try {
      await refreshRatesAsync();
    } catch (error) {
      console.error('Failed to refresh rates:', error);
    }
  };

  const currencyOptions = SUPPORTED_CURRENCIES.map((currency) => ({
    value: currency,
    label: currency,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full ring-4 ring-primary-500"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-bold text-xl ring-4 ring-primary-500">
                  {(user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Currency Selection */}
            <div>
              <Select
                label="Default Currency"
                value={preferences?.display_currency || 'USD'}
                onChange={handleCurrencyChange}
                options={currencyOptions}
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All amounts will be displayed in this currency
              </p>
            </div>

            {/* Refresh Exchange Rates */}
            <div>
              <Button
                onClick={handleRefreshRates}
                isLoading={isRefreshing}
                leftIcon={<RefreshCw className="h-4 w-4" />}
                variant="outline"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh Exchange Rates'}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Update currency exchange rates manually
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={signOut}
            variant="danger"
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
