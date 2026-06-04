/**
 * Groq AI Configuration
 * Models and settings for AI-powered financial insights
 */

export const GROQ_CONFIG = {
  model: 'llama-3.3-70b-versatile', // Fast and capable model for financial analysis
  
  // Model alternatives for different use cases
  models: {
    fast: 'llama-3.1-8b-instant',      // Quick responses
    balanced: 'llama-3.3-70b-versatile',     // Best quality/speed balance
    creative: 'llama-3.1-70b-versatile', // More creative responses
  },
  
  // Default parameters
  temperature: 0.7, // Balanced creativity
  maxTokens: 1024,  // Response length limit
  
  // Rate limiting
  maxRequestsPerMinute: 30,
  maxRequestsPerDay: 14400,
} as const;

export type GroqModel = keyof typeof GROQ_CONFIG.models;

// AI Feature prompts
export const AI_PROMPTS = {
  // Spending analysis
  analyzeSpending: (data: any, currency: string) => `
You are a financial advisor analyzing spending patterns. 
Currency: ${currency}

Transaction Data:
${JSON.stringify(data, null, 2)}

Provide a concise analysis covering:
1. Top spending categories and trends
2. Unusual spending patterns or anomalies
3. Month-over-month comparison
4. 2-3 actionable recommendations to reduce expenses

Keep response under 300 words, use bullet points, be specific with amounts in ${currency}.
`,

  // Budget recommendations
  recommendBudget: (income: number, expenses: any, currency: string) => `
You are a financial advisor creating budget recommendations.
Currency: ${currency}
Monthly Income: ${currency}${income}

Current Expenses by Category:
${JSON.stringify(expenses, null, 2)}

Create a realistic budget plan:
1. Suggest optimal allocation percentages (50/30/20 rule or custom)
2. Identify categories to reduce and by how much
3. Recommend savings targets
4. Provide 3 specific actionable steps

Keep response under 250 words, use ${currency} for all amounts.
`,

  // Expense predictions
  predictExpenses: (historicalData: any, currency: string) => `
You are a financial analyst predicting upcoming expenses.
Currency: ${currency}

Historical Data (last 3 months):
${JSON.stringify(historicalData, null, 2)}

Predict:
1. Expected expenses for next month by category
2. Recurring bills and their amounts
3. Potential unexpected costs to prepare for
4. Recommended emergency fund amount

Keep response under 200 words, use ${currency} for predictions.
`,

  // General financial advice
  financialAdvice: (financialSnapshot: any, currency: string, userGoal?: string) => `
You are a personal finance coach providing tailored advice.
Currency: ${currency}

Financial Snapshot:
${JSON.stringify(financialSnapshot, null, 2)}

${userGoal ? `User Goal: ${userGoal}` : ''}

Provide:
1. Overall financial health assessment (1-10 score with explanation)
2. Top 3 priorities to focus on
3. Quick wins for immediate improvement
4. Long-term strategy recommendations

Keep response under 300 words, be encouraging but realistic, use ${currency}.
`,

  // Savings opportunities
  findSavings: (transactions: any, currency: string) => `
You are a savings expert analyzing spending to find savings opportunities.
Currency: ${currency}

Recent Transactions:
${JSON.stringify(transactions, null, 2)}

Identify:
1. Subscriptions or recurring charges that could be reduced/canceled
2. Categories with overspending potential
3. Specific saving opportunities with estimated amounts
4. Alternative cheaper options for common expenses

Keep response under 250 words, be specific with ${currency} amounts.
`,

  // Goal planning
  planGoal: (goal: any, currentSavings: number, currency: string) => `
You are a financial planner helping achieve a savings goal.
Currency: ${currency}

Goal: ${goal.name}
Target Amount: ${currency}${goal.target_amount}
Current Savings: ${currency}${currentSavings}
Deadline: ${goal.target_date || 'Not set'}

Create a plan:
1. Required monthly savings amount
2. Recommended adjustments to current spending
3. Milestones to track progress
4. Tips to stay motivated and on track

Keep response under 200 words, use ${currency} for all amounts.
`,
} as const;

export type AIPromptType = keyof typeof AI_PROMPTS;
