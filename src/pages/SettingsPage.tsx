import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Input, Modal } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { deleteAccount } from '@/lib/supabase';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/useToast';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isRefreshing, refreshRatesAsync } = useCurrency();
  const { preferences, updatePreferencesAsync, isUpdating } = useUserPreferences();
  const { success, error: showError } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const aiEnabled = preferences?.ai_enabled === true;

  const handleToggleAI = async () => {
    try {
      await updatePreferencesAsync({ ai_enabled: !aiEnabled });
      success(aiEnabled ? 'AI insights turned off' : 'AI insights turned on');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update the AI setting');
    }
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Signs out on success; the router then sends the user to /auth.
      await deleteAccount();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete the account');
      setIsDeleting(false);
    }
  };

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

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id="ai-setting-label" className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  AI insights
                </p>
                <p id="ai-setting-description" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  When on, clicking an AI action sends a summary of your transactions (dates,
                  descriptions, categories and amounts) to Groq to generate the answer. Nothing is sent
                  unless you click one. When off, AI features are hidden and the server refuses AI requests.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={aiEnabled}
                aria-labelledby="ai-setting-label"
                aria-describedby="ai-setting-description"
                onClick={handleToggleAI}
                disabled={!preferences || isUpdating}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
                  aiEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    aiEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Read the{' '}
              <Link to="/privacy" className="text-primary-600 dark:text-primary-400 underline">
                privacy notice
              </Link>{' '}
              for what FinanceTracker stores and where.
            </p>
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

      {/* Delete account */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Permanently delete your account and everything in it: accounts, transactions, budgets,
            bills, recurring items, notifications and settings. This cannot be undone.
          </p>
          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="danger"
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete my account
          </Button>
        </CardContent>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="Delete your account?"
        description="All of your data is deleted right away and cannot be recovered."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label='Type "DELETE" to confirm'
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            autoComplete="off"
            disabled={isDeleting}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
              disabled={deleteConfirmText !== 'DELETE'}
            >
              Delete account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
