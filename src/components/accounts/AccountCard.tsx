import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, CreditCard, Wallet } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/currency';
import type { Account } from '@/types';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: number) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getAccountIcon = () => {
    switch (account.type) {
      case 'Card':
        return <CreditCard className="h-6 w-6" />;
      case 'Bank':
      case 'Wallet':
      case 'Cash':
      default:
        return <Wallet className="h-6 w-6" />;
    }
  };

  const getAccountTypeLabel = () => {
    return account.type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${account.name}"?`)) {
      onDelete(account.id);
    }
    setShowMenu(false);
  };

  return (
    <Card variant="elevated" className="relative">
      <div className="flex items-start justify-between">
        {/* Left: Icon and Info */}
        <div className="flex items-start gap-3 flex-1">
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
            {getAccountIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
              {account.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getAccountTypeLabel()}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {formatCurrency(account.balance, account.currency)}
            </p>
          </div>
        </div>

        {/* Right: Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Account options"
          >
            <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              {/* Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    onEdit(account);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
                >
                  <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors rounded-b-lg"
                >
                  <Trash2 className="h-4 w-4 text-danger-600" />
                  <span className="text-sm text-danger-600">Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
