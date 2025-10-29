import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type {
  AnalyticsPeriod,
  TimeSeriesData,
  CategorySpendingBreakdown,
  IncomeExpenseData,
  MonthlyComparison,
  AnalyticsSummary,
  ChartDataPoint,
} from '@/types';

const ANALYTICS_QUERY_KEY = ['analytics'];

interface UseAnalyticsOptions {
  period?: AnalyticsPeriod;
  startDate?: Date;
  endDate?: Date;
  accountIds?: number[];
  categories?: string[];
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { user } = useAuth();
  const { period = 'monthly', startDate, endDate, accountIds, categories } = options;

  // Helper function to get date range based on period
  const getDateRange = (): { start: Date; end: Date } => {
    const end = endDate || new Date();
    let start = startDate || new Date();

    if (!startDate) {
      switch (period) {
        case 'daily':
          start = new Date(end);
          start.setDate(start.getDate() - 30); // Last 30 days
          break;
        case 'weekly':
          start = new Date(end);
          start.setDate(start.getDate() - 84); // Last 12 weeks
          break;
        case 'monthly':
          start = new Date(end);
          start.setMonth(start.getMonth() - 12); // Last 12 months
          break;
        case 'yearly':
          start = new Date(end);
          start.setFullYear(start.getFullYear() - 5); // Last 5 years
          break;
        case 'all':
          start = new Date(2020, 0, 1); // Arbitrary start date
          break;
      }
    }

    return { start, end };
  };

  // Fetch spending trends over time
  const { data: spendingTrends, isLoading: isLoadingTrends } = useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'spending-trends', period, startDate, endDate, accountIds],
    queryFn: async (): Promise<TimeSeriesData> => {
      if (!user) throw new Error('User not authenticated');

      const { start, end } = getDateRange();

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())
        .order('date', { ascending: true });

      if (accountIds && accountIds.length > 0) {
        query = query.in('account_id', accountIds);
      }

      if (categories && categories.length > 0) {
        query = query.in('category', categories);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group transactions by period
      const groupedData: Record<string, number> = {};
      data.forEach((tx) => {
        const date = new Date(tx.date);
        let key: string;

        switch (period) {
          case 'daily':
            key = date.toISOString().split('T')[0];
            break;
          case 'weekly':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'monthly':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'yearly':
            key = String(date.getFullYear());
            break;
          default:
            key = date.toISOString().split('T')[0];
        }

        groupedData[key] = (groupedData[key] || 0) + tx.amount;
      });

      const chartData: ChartDataPoint[] = Object.entries(groupedData)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const total = chartData.reduce((sum, point) => sum + point.value, 0);
      const average = chartData.length > 0 ? total / chartData.length : 0;
      const highest = chartData.reduce((max, point) => (point.value > max.value ? point : max), chartData[0] || { date: '', value: 0 });
      const lowest = chartData.reduce((min, point) => (point.value < min.value ? point : min), chartData[0] || { date: '', value: Infinity });

      return {
        period,
        data: chartData,
        total,
        average,
        highest,
        lowest,
      };
    },
    enabled: !!user,
  });

  // Fetch category breakdown
  const { data: categoryBreakdown, isLoading: isLoadingCategories } = useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'category-breakdown', period, startDate, endDate, accountIds],
    queryFn: async (): Promise<CategorySpendingBreakdown[]> => {
      if (!user) throw new Error('User not authenticated');

      const { start, end } = getDateRange();

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString());

      if (accountIds && accountIds.length > 0) {
        query = query.in('account_id', accountIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by category
      const categoryMap: Record<string, { amount: number; count: number }> = {};
      let total = 0;

      data.forEach((tx) => {
        const category = tx.category || 'Uncategorized';
        if (!categoryMap[category]) {
          categoryMap[category] = { amount: 0, count: 0 };
        }
        categoryMap[category].amount += tx.amount;
        categoryMap[category].count += 1;
        total += tx.amount;
      });

      // Convert to array and calculate percentages
      const breakdown: CategorySpendingBreakdown[] = Object.entries(categoryMap)
        .map(([category, { amount, count }]) => ({
          category,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          transactionCount: count,
        }))
        .sort((a, b) => b.amount - a.amount);

      return breakdown;
    },
    enabled: !!user,
  });

  // Fetch income vs expenses
  const { data: incomeExpenseData, isLoading: isLoadingIncomeExpense } = useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'income-expense', period, startDate, endDate, accountIds],
    queryFn: async (): Promise<IncomeExpenseData[]> => {
      if (!user) throw new Error('User not authenticated');

      const { start, end } = getDateRange();

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start.toISOString())
        .lte('date', end.toISOString());

      if (accountIds && accountIds.length > 0) {
        query = query.in('account_id', accountIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by period
      const periodMap: Record<string, { income: number; expenses: number }> = {};

      data.forEach((tx) => {
        const date = new Date(tx.date);
        let key: string;

        switch (period) {
          case 'monthly':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'yearly':
            key = String(date.getFullYear());
            break;
          default:
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!periodMap[key]) {
          periodMap[key] = { income: 0, expenses: 0 };
        }

        if (tx.type === 'income') {
          periodMap[key].income += tx.amount;
        } else {
          periodMap[key].expenses += tx.amount;
        }
      });

      // Convert to array
      const incomeExpenseArray: IncomeExpenseData[] = Object.entries(periodMap)
        .map(([period, { income, expenses }]) => ({
          period,
          income,
          expenses,
          net: income - expenses,
          savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      return incomeExpenseArray;
    },
    enabled: !!user,
  });

  // Fetch monthly comparison
  const { data: monthlyComparison, isLoading: isLoadingMonthly } = useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'monthly-comparison', startDate, endDate, accountIds],
    queryFn: async (): Promise<MonthlyComparison[]> => {
      if (!user) throw new Error('User not authenticated');

      const { start, end } = getDateRange();

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start.toISOString())
        .lte('date', end.toISOString());

      if (accountIds && accountIds.length > 0) {
        query = query.in('account_id', accountIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by month
      const monthMap: Record<string, {
        income: number;
        expenses: number;
        categories: Record<string, number>;
      }> = {};

      data.forEach((tx) => {
        const date = new Date(tx.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthMap[key]) {
          monthMap[key] = { income: 0, expenses: 0, categories: {} };
        }

        if (tx.type === 'income') {
          monthMap[key].income += tx.amount;
        } else {
          monthMap[key].expenses += tx.amount;
          const category = tx.category || 'Uncategorized';
          monthMap[key].categories[category] = (monthMap[key].categories[category] || 0) + tx.amount;
        }
      });

      // Convert to array
      const comparison: MonthlyComparison[] = Object.entries(monthMap)
        .map(([monthYear, { income, expenses, categories }]) => {
          const [year] = monthYear.split('-');
          const topCategoryEntry = Object.entries(categories).sort(([, a], [, b]) => b - a)[0];

          return {
            month: monthYear,
            year: parseInt(year),
            income,
            expenses,
            savings: income - expenses,
            topCategory: topCategoryEntry?.[0] || 'None',
            topCategoryAmount: topCategoryEntry?.[1] || 0,
          };
        })
        .sort((a, b) => a.month.localeCompare(b.month));

      return comparison;
    },
    enabled: !!user,
  });

  // Get analytics summary
  const getAnalyticsSummary = (): AnalyticsSummary | null => {
    if (!incomeExpenseData || !categoryBreakdown || !spendingTrends) return null;

    const dateRange = getDateRange();
    const totalIncome = incomeExpenseData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = incomeExpenseData.reduce((sum, d) => sum + d.expenses, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      period,
      dateRange,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      topSpendingCategory: categoryBreakdown[0] || { category: 'None', amount: 0, percentage: 0, transactionCount: 0 },
      transactionCount: spendingTrends.data.length,
      averageTransactionSize: spendingTrends.average,
      budgetsOnTrack: 0, // TODO: Calculate from budgets
      budgetsTotal: 0, // TODO: Calculate from budgets
    };
  };

  return {
    spendingTrends,
    categoryBreakdown,
    incomeExpenseData,
    monthlyComparison,
    summary: getAnalyticsSummary(),
    isLoading: isLoadingTrends || isLoadingCategories || isLoadingIncomeExpense || isLoadingMonthly,
  };
}
