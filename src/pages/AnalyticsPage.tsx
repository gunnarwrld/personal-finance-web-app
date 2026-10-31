import React, { useState } from 'react';
import { Calendar, Download, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, Button, Select } from '@/components/ui';
import { SpendingTrendsChart, CategoryBreakdownChart, IncomeExpenseChart } from '@/components/analytics';
import { AIInsightsModal } from '@/components/ai';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUserPreferences } from '@/hooks/useUserPreferences';
// FREE-MODE: useSubscription no longer needed
// import { useSubscription } from '@/hooks/useSubscription';
import { toLocalDateString } from '@/lib/utils';
import type { AnalyticsPeriod } from '@/types';

export const AnalyticsPage: React.FC = () => {
  const { preferences } = useUserPreferences();
  // FREE-MODE: isPremium check removed
  // const { isPremium } = useSubscription();
  const [period, setPeriod] = useState<AnalyticsPeriod>('monthly');
  const [showAIModal, setShowAIModal] = useState(false);
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
    if (!summary && !spendingTrends && !categoryBreakdown) return;

    const rows: string[] = [];
    
    // Summary section
    if (summary) {
      rows.push('Analytics Summary');
      rows.push(`Period,${period}`);
      rows.push(`Currency,${displayCurrency}`);
      rows.push(`Total Income,${summary.totalIncome.toFixed(2)}`);
      rows.push(`Total Expenses,${summary.totalExpenses.toFixed(2)}`);
      rows.push(`Net Savings,${summary.netSavings.toFixed(2)}`);
      rows.push(`Savings Rate,${summary.savingsRate.toFixed(1)}%`);
      rows.push(`Top Category,${summary.topSpendingCategory.category},${summary.topSpendingCategory.amount.toFixed(2)}`);
      rows.push('');
    }

    // Spending trends section
    if (spendingTrends && spendingTrends.data.length > 0) {
      rows.push('Spending Trends');
      rows.push('Date,Value,Label,Category');
      spendingTrends.data.forEach((item) => {
        rows.push(`${item.date},${item.value},${item.label || ''},${item.category || ''}`);
      });
      rows.push('');
    }

    // Category breakdown section
    if (categoryBreakdown && categoryBreakdown.length > 0) {
      rows.push('Category Breakdown');
      rows.push('Category,Amount,Percentage');
      categoryBreakdown.forEach((item: { category: string; amount: number; percentage: number }) => {
        rows.push(`${item.category},${item.amount.toFixed(2)},${item.percentage.toFixed(1)}%`);
      });
    }

    // Create and download CSV
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${period}_${toLocalDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <div className="flex gap-2">
          {/* FREE-MODE: AI & Export buttons always shown */}
          {/* ORIGINAL: {isPremium && ( */}
              <Button
                onClick={() => setShowAIModal(true)}
                variant="primary"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                Ask AI
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export
              </Button>
          {/* ORIGINAL: )} */}
        </div>
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

      {/* FREE-MODE: Premium Upgrade Prompt hidden */}
      {/* ORIGINAL:
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
      */}

      {/* AI Insights Modal */}
      <AIInsightsModal 
        isOpen={showAIModal} 
        onClose={() => setShowAIModal(false)}
        currency={displayCurrency}
      />
    </div>
  );
};

