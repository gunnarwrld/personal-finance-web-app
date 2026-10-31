import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Budget, InsertBudget, UpdateBudget, BudgetWithSpending } from '@/types';
import { useAuth } from './useAuth';
import { useCurrency } from './useCurrency';
import { useUserPreferences } from './useUserPreferences';
import { convertCurrency } from '@/lib/currency';
import { toLocalDateString } from '@/lib/utils';

const BUDGETS_QUERY_KEY = ['budgets'];

export function useBudgets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all budgets for user
  const {
    data: budgets,
    isLoading,
    error,
  } = useQuery({
    queryKey: BUDGETS_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return (data || []) as Budget[];
    },
    enabled: !!user,
  });

  // Create budget
  const createBudget = useMutation({
    mutationFn: async (input: InsertBudget) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
    },
  });

  // Update budget
  const updateBudget = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateBudget }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
    },
  });

  // Delete budget (soft delete by setting is_active to false)
  const deleteBudget = useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('budgets')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
    },
  });

  return {
    budgets: budgets || [],
    isLoading,
    error,
    createBudget: createBudget.mutate,
    createBudgetAsync: createBudget.mutateAsync,
    updateBudget: updateBudget.mutate,
    updateBudgetAsync: updateBudget.mutateAsync,
    deleteBudget: deleteBudget.mutate,
    deleteBudgetAsync: deleteBudget.mutateAsync,
    isCreating: createBudget.isPending,
    isUpdating: updateBudget.isPending,
    isDeleting: deleteBudget.isPending,
  };
}

// Hook to get budgets with spending data
export function useBudgetsWithSpending(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  const { budgets, isLoading: isBudgetsLoading } = useBudgets();
  const { rates } = useCurrency();
  const { preferences } = useUserPreferences();
  // Budgets are set in the user's display currency; expenses from accounts in
  // other currencies are converted before they are compared.
  const currency = preferences?.display_currency || 'USD';

  // Fetch spending for the current period
  const {
    data: expenses,
    isLoading: isSpendingLoading,
  } = useQuery({
    queryKey: ['budget-spending', startDate, endDate],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get current month if no dates provided
      const now = new Date();
      const start = startDate || toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
      const end = endDate || toLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));

      const { data, error } = await supabase
        .from('transactions')
        .select('category, amount, currency')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Group by category and sum amounts in the display currency
  const spending = (expenses || []).reduce((acc, transaction) => {
    const amount = convertCurrency(transaction.amount, transaction.currency || currency, currency, rates);
    acc[transaction.category] = (acc[transaction.category] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  // Combine budgets with spending data
  const budgetsWithSpending: BudgetWithSpending[] = budgets.map(budget => {
    const spent = spending[budget.category] || 0;
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;
    const isOverBudget = spent > budget.amount;

    return {
      ...budget,
      spent,
      remaining,
      percentage,
      isOverBudget,
    };
  });

  return {
    budgets: budgetsWithSpending,
    isLoading: isBudgetsLoading || isSpendingLoading,
    spending,
    currency,
  };
}
