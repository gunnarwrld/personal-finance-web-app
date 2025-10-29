import React, { useState, useEffect } from 'react';
import { LogOut, RefreshCw, Crown, Check, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from '@/components/ui';
import { SubscriptionModal } from '@/components/subscription';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useSubscription } from '@/hooks/useSubscription';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isRefreshing, refreshRatesAsync } = useCurrency();
  const { preferences, updatePreferencesAsync, isUpdating } = useUserPreferences();
  const { 
    subscription, 
    isPremium, 
    openCustomerPortal,
  } = useSubscription();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Check for payment success/cancel in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    
    if (payment === 'success') {
      alert('🎉 Welcome to Premium! Your subscription is now active.');
      // Clear the URL parameter
      window.history.replaceState({}, '', '/settings');
    } else if (payment === 'cancelled') {
      alert('Subscription cancelled. You can try again anytime!');
      // Clear the URL parameter
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

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

  const handleManageSubscription = () => {
    if (isPremium) {
      // Open Stripe Customer Portal
      openCustomerPortal();
    } else {
      // Show subscription modal
      setShowSubscriptionModal(true);
    }
  };

  const premiumFeatures = [
    'Unlimited accounts',
    'Budget tracking & alerts',
    'Recurring transactions',
    'Bill reminders',
    'Account transfers',
    'Advanced analytics',
    'Export to CSV/PDF',
    'Priority support',
  ];

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

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Plan Status */}
            <div className={`p-4 rounded-lg border-2 ${isPremium ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isPremium ? 'Premium Plan' : 'Free Plan'}
                </h3>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500 text-white text-sm font-medium">
                    <Crown className="h-4 w-4" />
                    Active
                  </span>
                )}
              </div>
              {isPremium ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    You have full access to all premium features
                  </p>
                  {subscription && (
                    <>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Plan: <span className="font-medium capitalize">{subscription.subscription_tier?.replace('_', ' ')}</span>
                      </p>
                      {subscription.subscription_status === 'active' && subscription.current_period_end && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Renews on: <span className="font-medium">
                            {new Date(subscription.current_period_end).toLocaleDateString()}
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Limited to 3 accounts and basic features
                </p>
              )}
            </div>

            {/* Premium Features List */}
            {!isPremium && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Premium Features:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {premiumFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4">
              {isPremium ? (
                <Button
                  onClick={handleManageSubscription}
                  variant="outline"
                  className="w-full"
                  leftIcon={<CreditCard className="h-5 w-5" />}
                >
                  Manage Subscription
                </Button>
              ) : (
                <Button
                  onClick={handleManageSubscription}
                  variant="primary"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  leftIcon={<Crown className="h-5 w-5" />}
                >
                  Upgrade to Premium
                </Button>
              )}
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                {isPremium 
                  ? 'Manage billing, update payment method, or cancel subscription' 
                  : 'Unlock all features with a premium subscription'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)}
      />

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
