import type { RecurringTransactionWithAccount } from '@/types';
import { parseLocalDate } from '@/lib/utils';

interface RecurringTransactionCardProps {
  transaction: RecurringTransactionWithAccount;
  onEdit?: (transaction: RecurringTransactionWithAccount) => void;
  onDelete?: (id: number) => void;
  onToggleActive?: (id: number, isActive: boolean) => void;
}

export function RecurringTransactionCard({ transaction, onEdit, onDelete, onToggleActive }: RecurringTransactionCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return parseLocalDate(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
    };
    return labels[freq] || freq;
  };

  const getTypeColor = (type: string) => {
    return type === 'income'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? '↓' : '↑';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow ${
      !transaction.is_active ? 'opacity-60' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{transaction.description}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(transaction.type)}`}>
              {getTypeIcon(transaction.type)} {transaction.type}
            </span>
            {!transaction.is_active && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Paused
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{transaction.category}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onToggleActive && (
            <button
              onClick={() => onToggleActive(transaction.id, !transaction.is_active)}
              className={`p-2 transition-colors ${
                transaction.is_active
                  ? 'text-gray-400 hover:text-orange-600'
                  : 'text-gray-400 hover:text-green-600'
              }`}
              title={transaction.is_active ? 'Pause' : 'Resume'}
            >
              {transaction.is_active ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(transaction)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(transaction.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Transaction details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(transaction.amount, transaction.account?.currency || 'USD')}
          </span>
          <span className="text-sm font-medium text-gray-600">
            {getFrequencyLabel(transaction.frequency)}
          </span>
        </div>

        {transaction.account && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Account:</span>
            <span className="font-medium text-gray-900">{transaction.account.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Start Date:</span>
          <span className="font-medium text-gray-900">{formatDate(transaction.start_date)}</span>
        </div>

        {transaction.end_date && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">End Date:</span>
            <span className="font-medium text-gray-900">{formatDate(transaction.end_date)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Next Occurrence:</span>
          <span className="font-medium text-blue-600">{formatDate(transaction.next_occurrence)}</span>
        </div>

        {transaction.auto_create && transaction.is_active && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            ✓ Automatically creates transactions
          </div>
        )}
      </div>
    </div>
  );
}
