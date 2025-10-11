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

  // Create transaction
  const createTransaction = useMutation({
    mutationFn: async (input: CreateTransactionInput & { currency: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update account balance
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', input.account_id)
        .single();

      if (accountError) throw accountError;

      const balanceChange = input.type === 'income' ? input.amount : -input.amount;
      const newBalance = account.balance + balanceChange;

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', input.account_id);

      if (updateError) throw updateError;

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
      oldTransaction 
    }: { 
      id: number; 
      updates: UpdateTransaction; 
      oldTransaction: Transaction;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Revert old transaction's effect on balance
      const oldBalanceChange = oldTransaction.type === 'income' 
        ? -oldTransaction.amount 
        : oldTransaction.amount;

      const { error: revertError } = await supabase
        .from('accounts')
        .update({ balance: supabase.rpc('increment', { x: oldBalanceChange }) })
        .eq('id', oldTransaction.account_id);

      if (revertError) throw revertError;

      // Update transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Apply new transaction's effect on balance
      const newTransaction = transaction as Transaction;
      const newBalanceChange = newTransaction.type === 'income'
        ? newTransaction.amount
        : -newTransaction.amount;

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: supabase.rpc('increment', { x: newBalanceChange }) })
        .eq('id', newTransaction.account_id);

      if (updateError) throw updateError;

      return newTransaction;
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

      // Revert transaction's effect on balance
      const balanceChange = transaction.type === 'income'
        ? -transaction.amount
        : transaction.amount;

      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ balance: supabase.rpc('increment', { x: balanceChange }) })
        .eq('id', transaction.account_id);

      if (balanceError) throw balanceError;

      // Delete transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)
        .eq('user_id', user.id);

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
  const currentMonth = new Date().toISOString().slice(0, 7);
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
