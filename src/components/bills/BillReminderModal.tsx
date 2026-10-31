import { useEffect, useState } from 'react';
import { useBillReminders } from '@/hooks/useBillReminders';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { BillReminderWithStatus } from '@/types';

interface BillReminderModalProps {
  bill?: BillReminderWithStatus | null;
  onClose: () => void;
}

export function BillReminderModal({ bill, onClose }: BillReminderModalProps) {
  const { createBillAsync, updateBillAsync } = useBillReminders();
  const { accounts } = useAccounts();
  const { user } = useAuth();
  const { error: showError } = useToast();

  const [formData, setFormData] = useState({
    title: bill?.title || '',
    amount: bill?.amount || 0,
    due_date: bill?.due_date ? bill.due_date.split('T')[0] : '',
    account_id: bill?.account_id || (accounts[0]?.id || 0),
    category: bill?.category || '',
    reminder_days_before: bill?.reminder_days_before || 3,
    notes: bill?.notes || '',
  });

  // Accounts may still be loading when the modal opens.
  useEffect(() => {
    if (!formData.account_id && accounts.length > 0) {
      setFormData((prev) => (prev.account_id ? prev : { ...prev, account_id: accounts[0].id }));
    }
  }, [accounts, formData.account_id]);

  const categories = [
    'Rent/Mortgage',
    'Utilities',
    'Internet/Phone',
    'Insurance',
    'Subscriptions',
    'Credit Card',
    'Loan Payment',
    'Healthcare',
    'Education',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      // due_date is a date column: send the picked day as-is.
      if (bill) {
        await updateBillAsync({
          id: bill.id,
          updates: formData,
        });
      } else {
        await createBillAsync({
          ...formData,
          user_id: user.id,
        });
      }
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save bill reminder. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {bill ? 'Edit Bill Reminder' : 'Add Bill Reminder'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bill Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Electric Bill"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account *
            </label>
            <select
              value={formData.account_id || ''}
              onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                {accounts.length > 0 ? 'Select account' : 'Create an account first'}
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Reminder Days Before */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remind Me (days before)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={formData.reminder_days_before}
              onChange={(e) => setFormData({ ...formData, reminder_days_before: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Set to 0 to disable reminders
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {bill ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
