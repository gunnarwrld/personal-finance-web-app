import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Budget, InsertBudget, UpdateBudget, BudgetWithSpending } from '@/types';
import { useAuth } from './useAuth';

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

  // Fetch spending for the current period
  const {
    data: spending,
    isLoading: isSpendingLoading,
  } = useQuery({
    queryKey: ['budget-spending', startDate, endDate],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get current month if no dates provided
      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;

      // Group by category and sum amounts
      const spendingByCategory = (data || []).reduce((acc, transaction) => {
        const category = transaction.category;
        acc[category] = (acc[category] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

      return spendingByCategory;
    },
    enabled: !!user,
  });

  // Combine budgets with spending data
  const budgetsWithSpending: BudgetWithSpending[] = budgets.map(budget => {
    const spent = spending?.[budget.category] || 0;
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
    spending: spending || {},
  };
}
