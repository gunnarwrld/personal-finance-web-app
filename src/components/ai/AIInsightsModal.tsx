/**
 * AI Insights Modal Component
 * Interactive modal for AI-powered financial insights and advice
 */

import { useState } from 'react';
import { X, Sparkles, TrendingUp, Lightbulb, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAI } from '@/hooks/useAI';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/useToast';
import { toAITransactions, type AITransaction } from '@/lib/groq';
import { parseLocalDate } from '@/lib/utils';

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
}

type InsightType = 'spending' | 'budget' | 'savings' | 'advice' | 'predictions';

export function AIInsightsModal({ isOpen, onClose, currency = 'USD' }: AIInsightsModalProps) {
  const [selectedType, setSelectedType] = useState<InsightType | null>(null);
  const [userGoal, setUserGoal] = useState('');
  
  const { transactions } = useTransactions();
  const { rates } = useCurrency();
  const { error: showError } = useToast();
  
  const {
    insights,
    isLoading,
    analyzeSpendingAsync,
    getBudgetRecommendationsAsync,
    findSavingsAsync,
    getFinancialAdviceAsync,
    predictExpensesAsync,
    clearInsights,
  } = useAI(currency);

  if (!isOpen) return null;

  // Amounts are stored positive; `type` says whether money came in or went out.
  const sumBy = (items: AITransaction[], type: AITransaction['type']) =>
    items.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0);

  const since = (items: AITransaction[], from: Date) =>
    items.filter((t) => parseLocalDate(t.date) >= from);

  const handleGenerateInsight = async () => {
    if (!selectedType || !transactions || transactions.length === 0) return;

    const all = toAITransactions(transactions, currency, rates);
    // Windows start at local midnight: transaction dates parse as midnight,
    // so a cutoff carrying the current time would drop the boundary day.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    try {
      switch (selectedType) {
        case 'spending': {
          const recent = since(all, thirtyDaysAgo);
          if (recent.length === 0) {
            showError('No transactions found in the last 30 days');
            return;
          }
          await analyzeSpendingAsync(recent);
          break;
        }

        case 'budget': {
          const now = new Date();
          const monthly = since(all, new Date(now.getFullYear(), now.getMonth(), 1));
          if (monthly.length === 0) {
            showError('No transactions found this month');
            return;
          }
          const expenses: Record<string, number> = {};
          monthly
            .filter((t) => t.type === 'expense')
            .forEach((t) => {
              expenses[t.category] = (expenses[t.category] || 0) + t.amount;
            });
          await getBudgetRecommendationsAsync({ monthlyIncome: sumBy(monthly, 'income'), expenses });
          break;
        }

        case 'savings':
          await findSavingsAsync(all.slice(0, 50));
          break;

        case 'advice': {
          const recent = since(all, thirtyDaysAgo);
          const income = sumBy(recent, 'income');
          const expenses = sumBy(recent, 'expense');
          await getFinancialAdviceAsync({
            financialSnapshot: { income, expenses, savings: income - expenses },
            userGoal: userGoal || undefined,
          });
          break;
        }

        case 'predictions': {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          threeMonthsAgo.setHours(0, 0, 0, 0);
          await predictExpensesAsync(since(all, threeMonthsAgo));
          break;
        }
      }
      setSelectedType(null);
      setUserGoal('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate insights');
    }
  };

  const insightOptions = [
    {
      type: 'spending' as InsightType,
      icon: TrendingUp,
      title: 'Analyze Spending',
      description: 'Get insights about your spending patterns and trends',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      disabled: !transactions || transactions.length === 0,
    },
    {
      type: 'budget' as InsightType,
      icon: DollarSign,
      title: 'Budget Recommendations',
      description: 'Receive personalized budget allocation advice',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      disabled: !transactions || transactions.length === 0,
    },
    {
      type: 'savings' as InsightType,
      icon: Lightbulb,
      title: 'Find Savings',
      description: 'Discover opportunities to reduce expenses',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      disabled: !transactions || transactions.length === 0,
    },
    {
      type: 'advice' as InsightType,
      icon: Sparkles,
      title: 'Financial Advice',
      description: 'Get personalized financial health assessment',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      disabled: !transactions || transactions.length === 0,
    },
    {
      type: 'predictions' as InsightType,
      icon: TrendingUp,
      title: 'Predict Expenses',
      description: 'Forecast upcoming expenses based on history',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      disabled: !transactions || transactions.length === 0,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Financial Insights
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by Groq AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Insight Options */}
          {insights.length === 0 && !isLoading && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                What would you like to know?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {insightOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setSelectedType(option.type)}
                    disabled={option.disabled}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedType === option.type
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : option.disabled
                        ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`inline-flex p-2 rounded-lg mb-3 ${option.bgColor}`}>
                      <option.icon className={`h-5 w-5 ${option.color}`} />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {option.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Optional Goal Input for Financial Advice */}
              {selectedType === 'advice' && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Any specific financial goal? (Optional)
                  </label>
                  <input
                    type="text"
                    value={userGoal}
                    onChange={(e) => setUserGoal(e.target.value)}
                    placeholder="e.g., Save for a house, Pay off debt, Build emergency fund..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              )}

              {/* Generate Button */}
              {selectedType && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleGenerateInsight}
                    variant="primary"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    leftIcon={<Sparkles className="h-4 w-4" />}
                  >
                    Generate Insights
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Analyzing your financial data...
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This may take a few moments
              </p>
            </div>
          )}

          {/* Insights Display */}
          {insights.length > 0 && !isLoading && (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-600">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(insight.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {insight.content}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-3">
                <Button
                  onClick={clearInsights}
                  variant="outline"
                  className="flex-1"
                >
                  Ask Another Question
                </Button>
                <Button
                  onClick={onClose}
                  variant="primary"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!transactions || transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Transaction Data
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add some transactions to get AI-powered insights about your finances.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
