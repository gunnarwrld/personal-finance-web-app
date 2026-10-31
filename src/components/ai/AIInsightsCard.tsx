/**
 * AI Insights Card Component
 * Displays AI-powered financial insights on the dashboard
 */

import { useState } from 'react';
// FREE-MODE: useNavigate no longer needed (was used by premium upsell CTA)
// import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Lightbulb, AlertCircle, Loader2, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAI } from '@/hooks/useAI';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/useToast';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { toAITransactions } from '@/lib/groq';
import { parseLocalDate } from '@/lib/utils';
// FREE-MODE: useSubscription no longer needed here
// import { useSubscription } from '@/hooks/useSubscription';

export function AIInsightsCard() {
  // FREE-MODE: isPremium check removed
  // const { isPremium } = useSubscription();
  const { transactions } = useTransactions();
  const { preferences } = useUserPreferences();
  const { rates } = useCurrency();
  const currency = preferences?.display_currency || 'USD';
  // const navigate = useNavigate(); // FREE-MODE: unused
  const { 
    insights, 
    isAIAvailable, 
    analyzeSpendingAsync,
    isAnalyzingSpending,
    findSavingsAsync,
    isFindingSavings,
    clearInsights 
  } = useAI(currency);

  const [selectedInsight, setSelectedInsight] = useState<number>(0);

  const { error: showError } = useToast();

  const handleAnalyzeSpending = async () => {
    if (transactions && transactions.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTransactions = transactions.filter(
        (t) => parseLocalDate(t.date) >= thirtyDaysAgo
      );
      
      if (recentTransactions.length > 0) {
        try {
          await analyzeSpendingAsync(toAITransactions(recentTransactions, currency, rates));
        } catch (err) {
          showError(err instanceof Error ? err.message : 'Failed to analyze spending');
        }
      } else {
        showError('No transactions found in the last 30 days');
      }
    }
  };

  const handleFindSavings = async () => {
    if (transactions && transactions.length > 0) {
      try {
        await findSavingsAsync(toAITransactions(transactions.slice(0, 50), currency, rates));
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to find savings');
      }
    }
  };

  // FREE-MODE: Premium upsell card removed — AI always accessible
  // ORIGINAL: if (!isPremium) { return ( ... upgrade CTA ... ); }

  if (!isAIAvailable) {
    return (
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Insights Unavailable
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI features are not configured. Please add your Groq API key to enable AI insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isLoading = isAnalyzingSpending || isFindingSavings;

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Financial Insights
            </h3>
          </div>
          {insights.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearInsights}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        {insights.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleAnalyzeSpending}
              disabled={isLoading || !transactions || transactions.length === 0}
              leftIcon={isAnalyzingSpending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              className="w-full"
            >
              Analyze Spending
            </Button>
            <Button
              variant="outline"
              onClick={handleFindSavings}
              disabled={isLoading || !transactions || transactions.length === 0}
              leftIcon={isFindingSavings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              className="w-full"
            >
              Find Savings
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && insights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analyzing your financial data...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              This may take a few moments
            </p>
          </div>
        )}

        {/* Insights Display */}
        {insights.length > 0 && (
          <div className="space-y-4">
            {/* Insight Tabs */}
            {insights.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {insights.map((insight, index) => (
                  <button
                    key={insight.id}
                    onClick={() => setSelectedInsight(index)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      selectedInsight === index
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {insight.title}
                  </button>
                ))}
              </div>
            )}

            {/* Active Insight */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {insights[selectedInsight]?.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Generated {new Date(insights[selectedInsight]?.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {insights[selectedInsight]?.content}
                </div>
              </div>
            </div>

            {/* Generate More Insights */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyzeSpending}
                disabled={isLoading}
                leftIcon={<TrendingUp className="h-3 w-3" />}
              >
                Analyze Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFindSavings}
                disabled={isLoading}
                leftIcon={<Lightbulb className="h-3 w-3" />}
              >
                More Insights
              </Button>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && insights.length === 0 && (!transactions || transactions.length === 0) && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add some transactions to get AI-powered insights about your spending.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
