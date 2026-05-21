import React from 'react';
import { AccountsList } from '@/components/accounts';

export const AccountsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Accounts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bank accounts and wallets
          </p>
        </div>
      </div>

      {/* Accounts List */}
      <AccountsList />
    </div>
  );
};
