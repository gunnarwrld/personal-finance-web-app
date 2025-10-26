import React from 'react';
import { BalanceCard, QuickActions, RecentTransactions } from '@/components/dashboard';
import { SubscriptionBanner } from '@/components/subscription';
import { useBudgetsWithSpending } from '@/hooks/useBudgets';
import { useBillReminders } from '@/hooks/useBillReminders';
import { useSubscription } from '@/hooks/useSubscription';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { budgets } = useBudgetsWithSpending();
  const { upcomingBills, overdueBills } = useBillReminders();
  const { isPremium } = useSubscription();

  // Show top 3 budgets by percentage used
  const topBudgets = budgets
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your financial status
        </p>
      </div>

      {/* Subscription Banner */}
      <SubscriptionBanner />

      {/* Balance Card */}
      <BalanceCard />

      {/* Premium Features Grid */}
      {isPremium && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Budget Overview Widget */}
          {topBudgets.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Budget Overview
                </h2>
                <Link
                  to="/budgets"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {topBudgets.map((budget) => (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {budget.category}
                      </span>
                      <span className={`font-semibold ${budget.isOverBudget ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {budget.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          budget.isOverBudget
                            ? 'bg-red-500'
                            : budget.percentage >= 90
                            ? 'bg-orange-500'
                            : budget.percentage >= 75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Bills Widget */}
          {(upcomingBills.length > 0 || overdueBills.length > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bill Reminders
                </h2>
                <Link
                  to="/bills"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {overdueBills.slice(0, 2).map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-red-900 dark:text-red-100">
                        {bill.title}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {Math.abs(bill.days_until_due)} days overdue
                      </p>
                    </div>
                    <span className="text-lg font-bold text-red-900 dark:text-red-100">
                      ${bill.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                {upcomingBills.slice(0, 2).map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">
                        {bill.title}
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Due in {bill.days_until_due} days
                      </p>
                    </div>
                    <span className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                      ${bill.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  );
};
