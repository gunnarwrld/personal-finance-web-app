import React from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
// FREE-MODE: Crown, Check, CreditCard icons no longer needed
// import { Crown, Check, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from '@/components/ui';
// FREE-MODE: SubscriptionModal hidden
// import { SubscriptionModal } from '@/components/subscription';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/useToast';
// FREE-MODE: useSubscription no longer needed
// import { useSubscription } from '@/hooks/useSubscription';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isRefreshing, refreshRatesAsync } = useCurrency();
  const { preferences, updatePreferencesAsync, isUpdating } = useUserPreferences();
  const { success, error: showError } = useToast();
  // FREE-MODE: Subscription state removed
  // const { 
  //   subscription, 
  //   isPremium, 
  //   openCustomerPortal,
  // } = useSubscription();
  // const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // FREE-MODE: Payment success/cancel URL handling disabled
  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const payment = urlParams.get('payment');
  //   if (payment === 'success') {
  //     alert('🎉 Welcome to Premium! Your subscription is now active.');
  //     window.history.replaceState({}, '', '/settings');
  //   } else if (payment === 'cancelled') {
  //     alert('Subscription cancelled. You can try again anytime!');
  //     window.history.replaceState({}, '', '/settings');
  //   }
  // }, []);

  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await updatePreferencesAsync({ display_currency: e.target.value });
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update currency');
    }
  };

  const handleRefreshRates = async () => {
    try {
      await refreshRatesAsync();
      success('Exchange rates updated');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to refresh exchange rates');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to sign out');
    }
  };

  const currencyOptions = SUPPORTED_CURRENCIES.map((currency) => ({
    value: currency,
    label: currency,
  }));

  // FREE-MODE: Subscription management handler disabled
  // const handleManageSubscription = () => {
  //   if (isPremium) { openCustomerPortal(); }
  //   else { setShowSubscriptionModal(true); }
  // };

  // FREE-MODE: premiumFeatures list disabled
  // const premiumFeatures = [
  //   'Unlimited accounts', 'Budget tracking & alerts', 'Recurring transactions',
  //   'Bill reminders', 'Account transfers', 'Advanced analytics',
  //   'Export to CSV/PDF', 'Priority support',
  // ];

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

      {/* FREE-MODE: Entire Subscription Management card hidden */}
      {/* ORIGINAL: Subscription Card with premium plan status, features list,
          manage/upgrade button, and SubscriptionModal was here.
          Search git diff to restore. */}

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
            onClick={handleSignOut}
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
