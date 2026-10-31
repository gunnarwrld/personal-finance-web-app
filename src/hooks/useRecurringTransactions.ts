import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RecurringTransaction, InsertRecurringTransaction, UpdateRecurringTransaction } from '@/types';
import { useAuth } from './useAuth';
import { parseLocalDate } from '@/lib/utils';

const RECURRING_QUERY_KEY = ['recurring_transactions'];

export function useRecurringTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all recurring transactions
  const {
    data: recurringTransactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: RECURRING_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          account:accounts(name, type, currency)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('next_occurrence', { ascending: true });

      if (error) throw error;
      return (data || []) as RecurringTransaction[];
    },
    enabled: !!user,
  });

  // Create recurring transaction
  const createRecurring = useMutation({
    mutationFn: async (input: InsertRecurringTransaction) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as RecurringTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
    },
  });

  // Update recurring transaction
  const updateRecurring = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateRecurringTransaction }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as RecurringTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
    },
  });

  // Delete recurring transaction
  const deleteRecurring = useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
    },
  });

  // Get upcoming recurring transactions (next 30 days)
  const upcomingRecurring = recurringTransactions?.filter(r => {
    const nextDate = parseLocalDate(r.next_occurrence);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return nextDate >= today && nextDate <= thirtyDaysFromNow;
  }) || [];

  return {
    recurringTransactions: recurringTransactions || [],
    upcomingRecurring,
    isLoading,
    error,
    createRecurring: createRecurring.mutate,
    createRecurringAsync: createRecurring.mutateAsync,
    updateRecurring: updateRecurring.mutate,
    updateRecurringAsync: updateRecurring.mutateAsync,
    deleteRecurring: deleteRecurring.mutate,
    deleteRecurringAsync: deleteRecurring.mutateAsync,
    isCreating: createRecurring.isPending,
    isUpdating: updateRecurring.isPending,
    isDeleting: deleteRecurring.isPending,
  };
}

// Helper function to calculate next occurrence date
export function calculateNextOccurrence(
  currentDate: Date,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
): Date {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
}
