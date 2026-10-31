import { useEffect, useState } from 'react';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getExpenseCategories, getIncomeCategories } from '@/lib/categories';
import { toLocalDateString } from '@/lib/utils';
import type { RecurringTransactionWithAccount, RecurringFrequency } from '@/types';

interface RecurringTransactionModalProps {
  transaction?: RecurringTransactionWithAccount | null;
  onClose: () => void;
}

export function RecurringTransactionModal({ transaction, onClose }: RecurringTransactionModalProps) {
  const { createRecurringAsync, updateRecurringAsync } = useRecurringTransactions();
  const { accounts } = useAccounts();
  const { user } = useAuth();
  const { error: showError } = useToast();

  const [formData, setFormData] = useState({
    account_id: transaction?.account_id || (accounts[0]?.id || 0),
    type: transaction?.type || ('expense' as 'income' | 'expense'),
    category: transaction?.category || '',
    amount: transaction?.amount || 0,
    description: transaction?.description || '',
    frequency: transaction?.frequency || ('monthly' as RecurringFrequency),
    start_date: transaction?.start_date ? transaction.start_date.split('T')[0] : toLocalDateString(),
    end_date: transaction?.end_date ? transaction.end_date.split('T')[0] : '',
    auto_create: transaction?.auto_create ?? true,
  });

  // Same category names as one-off transactions, so generated entries line
  // up with budgets and analytics.
  const categories = {
    expense: getExpenseCategories(),
    income: getIncomeCategories(),
  };

  // Accounts may still be loading when the modal opens.
  useEffect(() => {
    if (!formData.account_id && accounts.length > 0) {
      setFormData((prev) => (prev.account_id ? prev : { ...prev, account_id: accounts[0].id }));
    }
  }, [accounts, formData.account_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      // Dates are date columns: send the picked days as-is. Editing other
      // fields must not reset the schedule, so next_occurrence only follows
      // the start date when it is new or was changed.
      const startDateChanged = !transaction || transaction.start_date.split('T')[0] !== formData.start_date;
      const data = {
        ...formData,
        user_id: user.id,
        end_date: formData.end_date || null,
        next_occurrence: startDateChanged ? formData.start_date : transaction.next_occurrence,
      };

      if (transaction) {
        await updateRecurringAsync({ id: transaction.id, updates: data });
      } else {
        await createRecurringAsync(data);
      }
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save recurring transaction. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {transaction ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {['income', 'expense'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type as 'income' | 'expense', category: '' })}
                  className={`px-4 py-2 rounded-md font-medium capitalize ${
                    formData.type === type
                      ? type === 'income'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select category</option>
              {categories[formData.type].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Monthly rent payment"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
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

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringFrequency })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Auto Create */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_create"
              checked={formData.auto_create}
              onChange={(e) => setFormData({ ...formData, auto_create: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="auto_create" className="ml-2 block text-sm text-gray-900">
              Automatically create transactions
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {transaction ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
