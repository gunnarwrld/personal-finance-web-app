import React from 'react';
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { getCategoryIcon, getCategoryColor } from '@/lib/categories';
import type { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onClick }) => {
  const isIncome = transaction.type === 'income';
  const IconComponent = getCategoryIcon(transaction.category);
  const color = getCategoryColor(transaction.category);

  return (
    <div
      onClick={() => onClick?.(transaction)}
      className={`flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700' : ''
      }`}
    >
      {/* Category Icon */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      {/* Transaction Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">
          {transaction.description}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="capitalize">{transaction.category.replace('_', ' ')}</span>
          <span>•</span>
          <span>{formatDate(transaction.date)}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="flex-shrink-0 text-right">
        <p
          className={`text-lg font-semibold ${
            isIncome
              ? 'text-success-600 dark:text-success-400'
              : 'text-danger-600 dark:text-danger-400'
          }`}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
        </p>
      </div>
    </div>
  );
};
