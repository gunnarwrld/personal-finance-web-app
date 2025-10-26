import { useState } from 'react';
import { useBudgets } from '@/hooks/useBudgets';
import { useAuth } from '@/hooks/useAuth';
import type { BudgetWithSpending, BudgetPeriod } from '@/types';

interface BudgetModalProps {
  budget?: BudgetWithSpending | null;
  onClose: () => void;
}

export function BudgetModal({ budget, onClose }: BudgetModalProps) {
  const { createBudget, updateBudget } = useBudgets();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    category: budget?.category || '',
    amount: budget?.amount || 0,
    period: budget?.period || 'monthly' as BudgetPeriod,
    alert_threshold: budget?.alert_threshold || 80,
  });

  const categories = [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Travel',
    'Education',
    'Personal Care',
    'Gifts & Donations',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      // Calculate start and end dates based on period
      const now = new Date();
      const start_date = now.toISOString();
      let end_date: string | null = null;

      if (formData.period === 'weekly') {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 7);
        end_date = endDate.toISOString();
      } else if (formData.period === 'monthly') {
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
        end_date = endDate.toISOString();
      } else if (formData.period === 'yearly') {
        const endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 1);
        end_date = endDate.toISOString();
      }

      if (budget) {
        await updateBudget({ id: budget.id, updates: formData });
      } else {
        await createBudget({
          ...formData,
          user_id: user.id,
          start_date,
          end_date,
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Failed to save budget. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {budget ? 'Edit Budget' : 'Create Budget'}
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
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Amount *
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

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period *
            </label>
            <select
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value as BudgetPeriod })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Alert Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.alert_threshold || ''}
              onChange={(e) => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) || 80 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 80"
            />
            <p className="mt-1 text-xs text-gray-500">
              Get notified when spending reaches this percentage
            </p>
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
              {budget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
