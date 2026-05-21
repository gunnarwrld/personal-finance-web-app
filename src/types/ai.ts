/**
 * AI Types
 * TypeScript types for AI-powered features
 */

export interface AIInsight {
  id: string;
  type: AIInsightType;
  title: string;
  content: string;
  currency: string;
  createdAt: Date;
  metadata?: {
    model?: string;
    tokens?: number;
  };
}

export type AIInsightType = 
  | 'spending_analysis'
  | 'budget_recommendation'
  | 'expense_prediction'
  | 'financial_advice'
  | 'savings_opportunity'
  | 'goal_plan';

export interface AIRequestStatus {
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export interface AIAnalysisData {
  transactions: any[];
  budgets?: any[];
  goals?: any[];
  currency: string;
}

export interface FinancialSnapshot {
  income: number;
  expenses: number;
  savings: number;
  debts?: number;
  investments?: number;
  netWorth?: number;
}

export interface SpendingTrend {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface BudgetRecommendation {
  category: string;
  currentAmount: number;
  suggestedAmount: number;
  savingsPotential: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ExpensePrediction {
  category: string;
  predictedAmount: number;
  confidence: 'high' | 'medium' | 'low';
  basedOn: string;
}
