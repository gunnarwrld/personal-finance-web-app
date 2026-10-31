import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { 
  Transaction, 
  CreateTransactionInput, 
  UpdateTransaction,
  TransactionFilters,
  PaginationParams 
} from '@/types';
import { useAuth } from './useAuth';
import { toLocalDateString } from '@/lib/utils';

const TRANSACTIONS_QUERY_KEY = ['transactions'];

export function useTransactions(
  filters?: TransactionFilters,
  pagination?: PaginationParams
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch transactions with filters and pagination
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, filters, pagination],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters?.date_from) {
        query = query.gte('date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('date', filters.date_to);
      }
      if (filters?.search) {
        query = query.ilike('description', `%${filters.search}%`);
      }

      // Apply pagination
      if (pagination) {
        const { page, limit } = pagination;
        const start = (page - 1) * limit;
        const end = start + limit - 1;
        query = query.range(start, end);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        transactions: data as Transaction[],
        count: count || 0,
        page: pagination?.page || 1,
        limit: pagination?.limit || data.length,
        total_pages: pagination ? Math.ceil((count || 0) / pagination.limit) : 1,
      };
    },
    enabled: !!user,
  });

  // Balance changes happen inside these database functions, in the same
  // transaction as the ledger write, so a failed or concurrent request can no
  // longer leave an account balance out of sync with its transactions.

  // Create transaction
  const createTransaction = useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data: transaction, error } = await supabase.rpc('create_transaction', {
        p_account_id: input.account_id,
        p_type: input.type,
        p_amount: input.amount,
        p_category: input.category,
        p_description: input.description,
        p_date: input.date,
      });

      if (error) throw error;
      return transaction as Transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  // Update transaction
  const updateTransaction = useMutation({
    mutationFn: async ({
      id,
      updates,
      oldTransaction,
    }: {
      id: number;
      updates: UpdateTransaction;
      oldTransaction: Transaction;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data: transaction, error } = await supabase.rpc('update_transaction', {
        p_id: id,
        p_account_id: updates.account_id ?? oldTransaction.account_id,
        p_type: updates.type ?? oldTransaction.type,
        p_amount: updates.amount ?? oldTransaction.amount,
        p_category: updates.category ?? oldTransaction.category,
        p_description: updates.description ?? oldTransaction.description,
        p_date: updates.date ?? oldTransaction.date,
      });

      if (error) throw error;
      return transaction as Transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  // Delete transaction
  const deleteTransaction = useMutation({
    mutationFn: async (transaction: Transaction) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('delete_transaction', { p_id: transaction.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const transactions = data?.transactions || [];
  const count = data?.count || 0;
  const totalPages = data?.total_pages || 1;

  // Calculate monthly statistics
  const currentMonth = toLocalDateString().slice(0, 7);
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    transactions,
    count,
    totalPages,
    isLoading,
    error,
    monthlyIncome,
    monthlyExpenses,
    refetch,
    createTransaction: createTransaction.mutate,
    createTransactionAsync: createTransaction.mutateAsync,
    isCreating: createTransaction.isPending,
    updateTransaction: updateTransaction.mutate,
    updateTransactionAsync: updateTransaction.mutateAsync,
    isUpdating: updateTransaction.isPending,
    deleteTransaction: deleteTransaction.mutate,
    deleteTransactionAsync: deleteTransaction.mutateAsync,
    isDeleting: deleteTransaction.isPending,
  };
}

// Hook to get single transaction
export function useTransaction(id: number | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      if (!user || !id) throw new Error('Invalid parameters');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Transaction;
    },
    enabled: !!user && !!id,
  });
}
