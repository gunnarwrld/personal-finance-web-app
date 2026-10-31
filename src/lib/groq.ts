/**
 * Groq AI Service
 * Handles all AI-powered financial insights using Groq API
 */

import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { convertCurrency } from './currency';
import { GROQ_CONFIG, AI_PROMPTS, type GroqModel } from '@/config/groq';
import type { Transaction } from '@/types';

// Rate limiting state
let requestCount = 0;
let lastResetTime = Date.now();

function checkRateLimit() {
  const now = Date.now();
  const timeSinceReset = now - lastResetTime;
  
  // Reset counter every minute
  if (timeSinceReset >= 60000) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  if (requestCount >= GROQ_CONFIG.maxRequestsPerMinute) {
    throw new Error('Rate limit exceeded. Please wait a moment before making another request.');
  }
  
  requestCount++;
}

/** The only transaction fields sent to the AI provider. */
export interface AITransaction {
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
}

/**
 * Strip ids and other account details before transactions leave the app,
 * and convert every amount into one currency so totals add up.
 */
export function toAITransactions(
  transactions: Transaction[],
  currency: string,
  rates: Record<string, number>
): AITransaction[] {
  return transactions.map((t) => ({
    date: t.date,
    description: t.description,
    category: t.category || 'Uncategorized',
    type: t.type,
    amount: Math.round(convertCurrency(Math.abs(t.amount), t.currency || currency, currency, rates) * 100) / 100,
  }));
}

export interface AIRequestOptions {
  model?: GroqModel;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

/**
 * Generate AI completion using Supabase Edge Function
 */
export async function generateCompletion(
  prompt: string,
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  try {
    checkRateLimit();
    
    const { data, error } = await supabase.functions.invoke('groq-proxy', {
      body: {
        prompt,
        options: {
          model: options.model ? GROQ_CONFIG.models[options.model] : GROQ_CONFIG.model,
          temperature: options.temperature ?? GROQ_CONFIG.temperature,
          maxTokens: options.maxTokens ?? GROQ_CONFIG.maxTokens,
        }
      }
    });

    if (error) {
      // Non-2xx responses carry {"error": "..."} from the function; surface
      // that message instead of the generic "non-2xx status code" one.
      if (error instanceof FunctionsHttpError) {
        const body = await error.context.json().catch(() => null);
        throw new Error(body?.error || 'AI service request failed');
      }
      throw error;
    }

    if (!data?.content) {
      throw new Error(data?.error || 'No content received from Edge Function');
    }
    
    return data as AIResponse;
  } catch (error) {
    console.error('Groq API Proxy Error:', error);
    const message = error instanceof Error ? error.message : '';

    if (message.includes('API key')) {
      throw new Error('Invalid Groq API key on the server. Please check your configuration.');
    }

    throw new Error(message || 'Failed to generate AI insights. Please try again.');
  }
}

/**
 * Analyze spending patterns
 */
export async function analyzeSpendingPatterns(
  transactions: AITransaction[],
  currency: string,
  options?: AIRequestOptions
): Promise<string> {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const dates = expenses.map((t) => t.date).sort();
  const data = {
    totalTransactions: expenses.length,
    totalSpent: Math.round(expenses.reduce((sum, t) => sum + t.amount, 0) * 100) / 100,
    categories: expenses.reduce((acc, t) => {
      acc[t.category] = Math.round(((acc[t.category] || 0) + t.amount) * 100) / 100;
      return acc;
    }, {} as Record<string, number>),
    dateRange: {
      from: dates[0],
      to: dates[dates.length - 1],
    },
  };
  
  const prompt = AI_PROMPTS.analyzeSpending(data, currency);
  const response = await generateCompletion(prompt, options);
  return response.content;
}

/**
 * Generate budget recommendations
 */
export async function generateBudgetRecommendations(
  monthlyIncome: number,
  expenses: Record<string, number>,
  currency: string,
  options?: AIRequestOptions
): Promise<string> {
  const prompt = AI_PROMPTS.recommendBudget(monthlyIncome, expenses, currency);
  const response = await generateCompletion(prompt, options);
  return response.content;
}

/**
 * Predict upcoming expenses
 */
export async function predictUpcomingExpenses(
  historicalData: AITransaction[],
  currency: string,
  options?: AIRequestOptions
): Promise<string> {
  const prompt = AI_PROMPTS.predictExpenses(historicalData, currency);
  const response = await generateCompletion(prompt, options);
  return response.content;
}

/**
 * Get general financial advice
 */
export async function getFinancialAdvice(
  financialSnapshot: {
    income: number;
    expenses: number;
    savings: number;
    debts?: number;
    investments?: number;
  },
  currency: string,
  userGoal?: string,
  options?: AIRequestOptions
): Promise<string> {
  const prompt = AI_PROMPTS.financialAdvice(financialSnapshot, currency, userGoal);
  const response = await generateCompletion(prompt, options);
  return response.content;
}

/**
 * Find savings opportunities
 */
export async function findSavingsOpportunities(
  transactions: AITransaction[],
  currency: string,
  options?: AIRequestOptions
): Promise<string> {
  const recentTransactions = transactions.slice(0, 50); // Last 50 transactions
  const prompt = AI_PROMPTS.findSavings(recentTransactions, currency);
  const response = await generateCompletion(prompt, options);
  return response.content;
}

/**
 * Create goal achievement plan
 */
export async function createGoalPlan(
  goal: {
    name: string;
    target_amount: number;
    target_date?: string;
  },
  currentSavings: number,
  currency: string,
  options?: AIRequestOptions
): Promise<string> {
  const prompt = AI_PROMPTS.planGoal(goal, currentSavings, currency);
  const response = await generateCompletion(prompt, options);
  return response.content;
}

/**
 * Test API connectivity
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await generateCompletion('Respond with "OK" if you can read this.', {
      maxTokens: 10,
    });
    return response.content.toLowerCase().includes('ok');
  } catch {
    return false;
  }
}
