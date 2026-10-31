import type { BillReminderWithStatus } from '@/types';
import { parseLocalDate } from '@/lib/utils';

interface BillReminderCardProps {
  bill: BillReminderWithStatus;
  onEdit?: (bill: BillReminderWithStatus) => void;
  onDelete?: (id: number) => void;
  onMarkPaid?: (id: number) => void;
}

export function BillReminderCard({ bill, onEdit, onDelete, onMarkPaid }: BillReminderCardProps) {
  const getStatusBadge = () => {
    if (bill.is_paid) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Paid
        </span>
      );
    }
    if (bill.is_overdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ! Overdue
        </span>
      );
    }
    if (bill.is_upcoming) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⚠ Due Soon
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Scheduled
      </span>
    );
  };

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

  const getDaysText = () => {
    if (bill.is_paid) return null;
    if (bill.is_overdue) {
      return (
        <p className="text-sm text-red-600 font-medium">
          {Math.abs(bill.days_until_due)} days overdue
        </p>
      );
    }
    if (bill.days_until_due === 0) {
      return <p className="text-sm text-orange-600 font-medium">Due today!</p>;
    }
    if (bill.days_until_due === 1) {
      return <p className="text-sm text-yellow-600 font-medium">Due tomorrow</p>;
    }
    return (
      <p className="text-sm text-gray-600">
        Due in {bill.days_until_due} days
      </p>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border-l-4 ${
      bill.is_paid ? 'border-green-500' :
      bill.is_overdue ? 'border-red-500' :
      bill.is_upcoming ? 'border-yellow-500' :
      'border-gray-300'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{bill.title}</h3>
            {getStatusBadge()}
          </div>
          {bill.category && (
            <p className="text-sm text-gray-500">{bill.category}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!bill.is_paid && onMarkPaid && (
            <button
              onClick={() => onMarkPaid(bill.id)}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
              title="Mark as paid"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(bill)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit bill"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(bill.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete bill"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Bill details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(bill.amount, bill.account?.currency || 'USD')}
          </span>
          {getDaysText()}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Due Date:</span>
          <span className="font-medium text-gray-900">{formatDate(bill.due_date)}</span>
        </div>

        {bill.account && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Account:</span>
            <span className="font-medium text-gray-900">{bill.account.name}</span>
          </div>
        )}

        {bill.reminder_days_before > 0 && !bill.is_paid && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            🔔 Reminder set for {bill.reminder_days_before} days before due date
          </div>
        )}

        {bill.notes && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">{bill.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
