/**
 * AI Hook
 * React hook for AI-powered financial insights
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as groqService from '@/lib/groq';
import type { AITransaction } from '@/lib/groq';
import type { AIInsight, FinancialSnapshot } from '@/types/ai';
import { useUserPreferences } from './useUserPreferences';

export const AI_DISABLED_MESSAGE = 'AI insights are turned off. You can turn them on in Settings.';

/**
 * Whether the signed-in user allows AI insights (Settings → Privacy).
 * False while preferences load, so nothing AI-related flashes on screen
 * for a user who turned it off. groq-proxy enforces the same flag.
 */
export function useAIEnabled() {
  const { preferences, isLoading } = useUserPreferences();
  return { aiEnabled: preferences?.ai_enabled === true, isLoading };
}

export function useAI(currency: string = 'USD') {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const { aiEnabled } = useAIEnabled();

  /** Stop before any data leaves the app when the user turned AI off. */
  const requireAI = () => {
    if (!aiEnabled) throw new Error(AI_DISABLED_MESSAGE);
  };

  /**
   * Analyze spending patterns
   */
  const analyzeSpendingMutation = useMutation({
    mutationFn: async (transactions: AITransaction[]) => {
      requireAI();
      const content = await groqService.analyzeSpendingPatterns(
        transactions,
        currency
      );

      return content;
    },
    onSuccess: (content) => {
      const insight: AIInsight = {
        id: crypto.randomUUID(),
        type: 'spending_analysis',
        title: 'Spending Pattern Analysis',
        content,
        currency,
        createdAt: new Date(),
      };
      setInsights((prev) => [insight, ...prev]);
    },
  });

  /**
   * Get budget recommendations
   */
  const getBudgetRecommendationsMutation = useMutation({
    mutationFn: async ({
      monthlyIncome,
      expenses,
    }: {
      monthlyIncome: number;
      expenses: Record<string, number>;
    }) => {
      requireAI();
      const content = await groqService.generateBudgetRecommendations(
        monthlyIncome,
        expenses,
        currency
      );

      return content;
    },
    onSuccess: (content) => {
      const insight: AIInsight = {
        id: crypto.randomUUID(),
        type: 'budget_recommendation',
        title: 'Budget Recommendations',
        content,
        currency,
        createdAt: new Date(),
      };
      setInsights((prev) => [insight, ...prev]);
    },
  });

  /**
   * Predict upcoming expenses
   */
  const predictExpensesMutation = useMutation({
    mutationFn: async (historicalData: AITransaction[]) => {
      requireAI();
      const content = await groqService.predictUpcomingExpenses(
        historicalData,
        currency
      );

      return content;
    },
    onSuccess: (content) => {
      const insight: AIInsight = {
        id: crypto.randomUUID(),
        type: 'expense_prediction',
        title: 'Expense Predictions',
        content,
        currency,
        createdAt: new Date(),
      };
      setInsights((prev) => [insight, ...prev]);
    },
  });

  /**
   * Get financial advice
   */
  const getFinancialAdviceMutation = useMutation({
    mutationFn: async ({
      financialSnapshot,
      userGoal,
    }: {
      financialSnapshot: FinancialSnapshot;
      userGoal?: string;
    }) => {
      requireAI();
      const content = await groqService.getFinancialAdvice(
        financialSnapshot,
        currency,
        userGoal
      );

      return content;
    },
    onSuccess: (content) => {
      const insight: AIInsight = {
        id: crypto.randomUUID(),
        type: 'financial_advice',
        title: 'Financial Advice',
        content,
        currency,
        createdAt: new Date(),
      };
      setInsights((prev) => [insight, ...prev]);
    },
  });

  /**
   * Find savings opportunities
   */
  const findSavingsMutation = useMutation({
    mutationFn: async (transactions: AITransaction[]) => {
      requireAI();
      const content = await groqService.findSavingsOpportunities(
        transactions,
        currency
      );

      return content;
    },
    onSuccess: (content) => {
      const insight: AIInsight = {
        id: crypto.randomUUID(),
        type: 'savings_opportunity',
        title: 'Savings Opportunities',
        content,
        currency,
        createdAt: new Date(),
      };
      setInsights((prev) => [insight, ...prev]);
    },
  });

  /**
   * Create goal achievement plan
   */
  const createGoalPlanMutation = useMutation({
    mutationFn: async ({
      goal,
      currentSavings,
    }: {
      goal: {
        name: string;
        target_amount: number;
        target_date?: string;
      };
      currentSavings: number;
    }) => {
      requireAI();
      const content = await groqService.createGoalPlan(
        goal,
        currentSavings,
        currency
      );

      return content;
    },
    onSuccess: (content) => {
      const insight: AIInsight = {
        id: crypto.randomUUID(),
        type: 'goal_plan',
        title: 'Goal Achievement Plan',
        content,
        currency,
        createdAt: new Date(),
      };
      setInsights((prev) => [insight, ...prev]);
    },
  });

  /**
   * Test API connection
   */
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      requireAI();
      return await groqService.testConnection();
    },
  });

  /**
   * Clear insights history
   */
  const clearInsights = () => {
    setInsights([]);
  };

  /**
   * Remove specific insight
   */
  const removeInsight = (id: string) => {
    setInsights((prev) => prev.filter((insight) => insight.id !== id));
  };

  return {
    // State
    insights,
    aiEnabled,

    // Mutations
    analyzeSpending: analyzeSpendingMutation.mutate,
    analyzeSpendingAsync: analyzeSpendingMutation.mutateAsync,
    isAnalyzingSpending: analyzeSpendingMutation.isPending,

    getBudgetRecommendations: getBudgetRecommendationsMutation.mutate,
    getBudgetRecommendationsAsync: getBudgetRecommendationsMutation.mutateAsync,
    isGettingRecommendations: getBudgetRecommendationsMutation.isPending,

    predictExpenses: predictExpensesMutation.mutate,
    predictExpensesAsync: predictExpensesMutation.mutateAsync,
    isPredictingExpenses: predictExpensesMutation.isPending,

    getFinancialAdvice: getFinancialAdviceMutation.mutate,
    getFinancialAdviceAsync: getFinancialAdviceMutation.mutateAsync,
    isGettingAdvice: getFinancialAdviceMutation.isPending,

    findSavings: findSavingsMutation.mutate,
    findSavingsAsync: findSavingsMutation.mutateAsync,
    isFindingSavings: findSavingsMutation.isPending,

    createGoalPlan: createGoalPlanMutation.mutate,
    createGoalPlanAsync: createGoalPlanMutation.mutateAsync,
    isCreatingPlan: createGoalPlanMutation.isPending,

    testConnection: testConnectionMutation.mutate,
    testConnectionAsync: testConnectionMutation.mutateAsync,
    isTestingConnection: testConnectionMutation.isPending,

    // General loading state
    isLoading:
      analyzeSpendingMutation.isPending ||
      getBudgetRecommendationsMutation.isPending ||
      predictExpensesMutation.isPending ||
      getFinancialAdviceMutation.isPending ||
      findSavingsMutation.isPending ||
      createGoalPlanMutation.isPending,

    // Error state
    error:
      analyzeSpendingMutation.error ||
      getBudgetRecommendationsMutation.error ||
      predictExpensesMutation.error ||
      getFinancialAdviceMutation.error ||
      findSavingsMutation.error ||
      createGoalPlanMutation.error,

    // Utilities
    clearInsights,
    removeInsight,
  };
}
