import type { BudgetWithSpending } from '@/types';

interface BudgetCardProps {
  budget: BudgetWithSpending;
  onEdit?: (budget: BudgetWithSpending) => void;
  onDelete?: (id: number) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const getProgressColor = () => {
    if (budget.isOverBudget) return 'bg-red-500';
    if (budget.percentage >= 90) return 'bg-orange-500';
    if (budget.percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getAlertBadge = () => {
    if (!budget.alert_threshold) return null;
    if (budget.percentage >= budget.alert_threshold) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
          ⚠️ Alert
        </span>
      );
    }
    return null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Default to USD for budgets
    }).format(amount);
  };

  const getPeriodLabel = () => {
    const labels = {
      weekly: 'This Week',
      monthly: 'This Month',
      yearly: 'This Year',
    };
    return labels[budget.period];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{budget.category}</h3>
            {getAlertBadge()}
          </div>
          <p className="text-sm text-gray-500">{getPeriodLabel()}</p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(budget)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit budget"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(budget.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete budget"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Budget amounts */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Spent</p>
          <p className={`text-lg font-semibold ${budget.isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCurrency(budget.spent)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Budget</p>
          <p className="text-lg font-semibold text-gray-900">{formatCurrency(budget.amount)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {budget.percentage.toFixed(1)}% used
          </span>
          <span className={`text-sm font-medium ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {budget.remaining >= 0 ? formatCurrency(budget.remaining) : `${formatCurrency(Math.abs(budget.remaining))} over`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-500 rounded-full`}
            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Over budget warning */}
      {budget.isOverBudget && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ⚠️ You've exceeded this budget by {formatCurrency(Math.abs(budget.remaining))}
          </p>
        </div>
      )}
    </div>
  );
}
