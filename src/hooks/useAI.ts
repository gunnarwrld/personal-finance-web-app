/**
 * AI Hook
 * React hook for AI-powered financial insights
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as groqService from '@/lib/groq';
import type { AITransaction } from '@/lib/groq';
import type { AIInsight, FinancialSnapshot } from '@/types/ai';

export function useAI(currency: string = 'USD') {
  const [insights, setInsights] = useState<AIInsight[]>([]);

  /**
   * Analyze spending patterns
   */
  const analyzeSpendingMutation = useMutation({
    mutationFn: async (transactions: AITransaction[]) => {
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
