import React, { useState } from 'react';
import { Calendar, Download, TrendingUp } from 'lucide-react';
import { Card, CardContent, Button, Select } from '@/components/ui';
import { SpendingTrendsChart, CategoryBreakdownChart, IncomeExpenseChart } from '@/components/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useSubscription } from '@/hooks/useSubscription';
import type { AnalyticsPeriod } from '@/types';

export const AnalyticsPage: React.FC = () => {
  const { preferences } = useUserPreferences();
  const { isPremium } = useSubscription();
  const [period, setPeriod] = useState<AnalyticsPeriod>('monthly');
  const displayCurrency = preferences?.display_currency || 'USD';

  const {
    spendingTrends,
    categoryBreakdown,
    incomeExpenseData,
    summary,
    isLoading,
  } = useAnalytics({
    period,
    displayCurrency,
  });

  const periodOptions = [
    { value: 'daily', label: 'Daily (Last 30 days)' },
    { value: 'weekly', label: 'Weekly (Last 12 weeks)' },
    { value: 'monthly', label: 'Monthly (Last 12 months)' },
    { value: 'yearly', label: 'Yearly (Last 5 years)' },
  ];

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export analytics data');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize your spending patterns and financial trends
          </p>
        </div>
        {isPremium && (
          <Button
            onClick={handleExport}
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export
          </Button>
        )}
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Period:
              </span>
            </div>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
              options={periodOptions}
              className="w-full sm:w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Income
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {displayCurrency} {summary.totalIncome.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {displayCurrency} {summary.totalExpenses.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500 rotate-180" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Net Savings
                </p>
                <p className={`text-2xl font-bold mt-1 ${summary.netSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {displayCurrency} {summary.netSavings.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {summary.savingsRate.toFixed(1)}% savings rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Top Category
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {summary.topSpendingCategory.category}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {displayCurrency} {summary.topSpendingCategory.amount.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            {/* Spending Trends */}
            <Card>
              <CardContent className="pt-6">
                {spendingTrends && (
                  <SpendingTrendsChart data={spendingTrends} currency={displayCurrency} />
                )}
              </CardContent>
            </Card>

            {/* Income vs Expenses */}
            <Card>
              <CardContent className="pt-6">
                {incomeExpenseData && (
                  <IncomeExpenseChart data={incomeExpenseData} currency={displayCurrency} />
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardContent className="pt-6">
                {categoryBreakdown && (
                  <CategoryBreakdownChart data={categoryBreakdown} currency={displayCurrency} />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Premium Upgrade Prompt */}
      {!isPremium && (
        <Card className="border-2 border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Unlock Premium Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get access to advanced insights, export capabilities, and AI-powered financial advice
              </p>
              <Button variant="primary" className="bg-gradient-to-r from-yellow-500 to-orange-500">
                Upgrade to Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

