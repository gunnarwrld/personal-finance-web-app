import { useMemo } from 'react';
import { Card } from '../ui/Card';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrency } from '@/lib/currency';
import { getCategoryIcon, getCategoryColor } from '@/lib/categories';
import type { TransactionCategory } from '@/types';

export function CategoryBreakdown() {
  const { transactions, isLoading } = useTransactions();

  // Calculate spending by category
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const categoryMap = new Map<TransactionCategory, number>();
    expenses.forEach(transaction => {
      const current = categoryMap.get(transaction.category) || 0;
      categoryMap.set(transaction.category, current + transaction.amount);
    });

    // Convert to array and sort by amount
    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (categoryData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Spending by Category
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No expense data yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Start tracking your expenses to see the breakdown
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Spending by Category
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Total: {formatCurrency(totalExpenses, 'USD')}
        </span>
      </div>

      <div className="space-y-4">
        {categoryData.map(({ category, amount, percentage }) => {
          const IconComponent = getCategoryIcon(category);
          const color = getCategoryColor(category);
          
          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(amount, 'USD')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
