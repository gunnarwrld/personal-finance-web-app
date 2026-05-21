/**
 * Groq AI Service
 * Handles all AI-powered financial insights using Groq API
 */

import Groq from 'groq-sdk';
import { GROQ_CONFIG, AI_PROMPTS, type GroqModel } from '@/config/groq';

// Initialize Groq client
let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = GROQ_CONFIG.apiKey;
    
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      throw new Error('Groq API key is not configured. Please add VITE_GROQ_API_KEY to your .env file.');
    }
    
    groqClient = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for client-side usage
    });
  }
  
  return groqClient;
}

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
 * Generate AI completion using Groq
 */
export async function generateCompletion(
  prompt: string,
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  try {
    checkRateLimit();
    
    const client = getGroqClient();
    const model = options.model 
      ? GROQ_CONFIG.models[options.model] 
      : GROQ_CONFIG.model;
    
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature ?? GROQ_CONFIG.temperature,
      max_tokens: options.maxTokens ?? GROQ_CONFIG.maxTokens,
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    return {
      content,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
      model: response.model,
    };
  } catch (error: any) {
    console.error('Groq API Error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('API key')) {
      throw new Error('Invalid Groq API key. Please check your configuration.');
    }
    
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    
    if (error.status === 500) {
      throw new Error('AI service temporarily unavailable. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to generate AI insights. Please try again.');
  }
}

/**
 * Analyze spending patterns
 */
export async function analyzeSpendingPatterns(
  transactions: any[],
  currency: string,
  options?: AIRequestOptions
): Promise<string> {
  const data = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
    categories: transactions.reduce((acc, t) => {
      const cat = t.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>),
    dateRange: {
      from: transactions[0]?.transaction_date,
      to: transactions[transactions.length - 1]?.transaction_date,
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
  historicalData: any[],
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
  transactions: any[],
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
