// Analytics types for data visualization and insights

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'donut';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ChartDataPoint {
  date: string; // ISO date string
  value: number;
  label?: string;
  category?: string;
}

export interface TimeSeriesData {
  period: AnalyticsPeriod;
  data: ChartDataPoint[];
  total: number;
  average: number;
  highest: ChartDataPoint;
  lowest: ChartDataPoint;
}

export interface CategorySpendingBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  color?: string;
}

export interface IncomeExpenseData {
  period: string; // e.g., "2024-10", "2024-Q3", "2024"
  income: number;
  expenses: number;
  net: number;
  savingsRate: number; // percentage
}

export interface SpendingTrend {
  category: string;
  current: number;
  previous: number;
  change: number; // percentage
  trend: 'up' | 'down' | 'stable';
}

export interface MonthlyComparison {
  month: string;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  topCategory: string;
  topCategoryAmount: number;
}

export interface BudgetPerformance {
  budgetId: number;
  category: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  daysRemaining: number;
  projectedSpending: number;
  onTrack: boolean;
}

export interface AccountGrowth {
  accountId: number;
  accountName: string;
  currency: string;
  startBalance: number;
  endBalance: number;
  growth: number; // absolute
  growthPercentage: number;
  transactions: number;
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  dateRange: DateRange;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  topSpendingCategory: CategorySpendingBreakdown;
  transactionCount: number;
  averageTransactionSize: number;
  budgetsOnTrack: number;
  budgetsTotal: number;
}

export interface AnalyticsFilters {
  dateRange?: DateRange;
  period?: AnalyticsPeriod;
  accountIds?: number[];
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
  type?: 'income' | 'expense' | 'all';
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  type: 'transactions' | 'budgets' | 'analytics' | 'summary';
  dateRange: DateRange;
  includeCharts?: boolean;
  filters?: AnalyticsFilters;
}

// AI Insights types
export interface AIInsight {
  id: string;
  type: 'spending_pattern' | 'budget_recommendation' | 'savings_tip' | 'prediction' | 'warning';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  category?: string;
  amount?: number;
  actionable: boolean;
  action?: {
    label: string;
    route?: string;
    callback?: () => void;
  };
  createdAt: Date;
}

export interface AIAnalysisRequest {
  userId: string;
  analysisType: 'spending_patterns' | 'budget_optimization' | 'financial_advice' | 'expense_prediction';
  dateRange: DateRange;
  categories?: string[];
}

export interface AIAnalysisResponse {
  insights: AIInsight[];
  summary: string;
  confidence: number; // 0-1
  suggestions: string[];
  generatedAt: Date;
}

// Chart configuration types
export interface ChartConfig {
  type: ChartType;
  title: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  colors?: string[];
  height?: number;
  responsive?: boolean;
}

export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface BarChartData {
  name: string;
  value: number;
  compareValue?: number;
  label?: string;
}

export interface LineChartData {
  date: string;
  value: number;
  series?: string;
}

export interface AreaChartData {
  date: string;
  income: number;
  expenses: number;
  net?: number;
}
