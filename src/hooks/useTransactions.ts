import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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

/** The filter methods of a PostgREST query that `applyTransactionFilters` uses. */
interface FilterableQuery {
  eq(column: string, value: string | number): this;
  gte(column: string, value: string): this;
  lte(column: string, value: string): this;
  ilike(column: string, pattern: string): this;
}

/** Applies the Transactions filters; shared by the list and the CSV export. */
function applyTransactionFilters<Q extends FilterableQuery>(
  query: Q,
  filters?: TransactionFilters
): Q {
  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.account_id) query = query.eq('account_id', filters.account_id);
  if (filters?.date_from) query = query.gte('date', filters.date_from);
  if (filters?.date_to) query = query.lte('date', filters.date_to);
  if (filters?.search) query = query.ilike('description', `%${filters.search}%`);
  return query;
}

/** One row of the transactions CSV export. */
export interface ExportTransaction {
  date: string;
  description: string;
  category: string;
  type: string;
  amount: number;
  currency: string | null;
  account_name: string | null;
}

// PostgREST caps each response (1000 rows by default, and a project can set a
// lower `max-rows`), so the export asks for this many at a time and keeps going
// until it has as many rows as the exact count says exist.
const EXPORT_PAGE_SIZE = 1000;

function exportPageQuery(
  userId: string,
  filters: TransactionFilters | undefined,
  from: number,
  withCount: boolean
) {
  return applyTransactionFilters(
    supabase
      .from('transactions')
      .select('date, description, category, type, amount, currency, account:accounts(name)', {
        count: withCount ? 'exact' : undefined,
      })
      .eq('user_id', userId),
    filters
  )
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    // A unique tiebreaker, so rows can't swap places between pages.
    .order('id', { ascending: false })
    .range(from, from + EXPORT_PAGE_SIZE - 1);
}

/**
 * Fetches every transaction of `userId` that matches `filters`, in the same
 * order as the Transactions page, page by page so the export is not cut off at
 * the PostgREST row limit. RLS still applies; the user id filter just keeps the
 * query on the owner's index.
 */
export async function fetchTransactionsForExport(
  userId: string,
  filters?: TransactionFilters
): Promise<ExportTransaction[]> {
  const rows: ExportTransaction[] = [];
  let total: number | null = null;

  while (total === null || rows.length < total) {
    const { data, error, count } = await exportPageQuery(userId, filters, rows.length, total === null);
    if (error) throw error;
    if (total === null) total = count ?? 0;
    if (!data || data.length === 0) break; // Rows were deleted mid-export.

    for (const t of data) {
      rows.push({
        date: t.date,
        description: t.description,
        category: t.category,
        type: t.type,
        amount: Number(t.amount),
        currency: t.currency,
        account_name: t.account?.name ?? null,
      });
    }
  }

  return rows;
}

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
    isPlaceholderData,
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

      query = applyTransactionFilters(query, filters);

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
    // When the page or search changes, keep showing the previous results (and
    // their page count) until the new ones arrive, instead of an empty list.
    placeholderData: keepPreviousData,
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
    /** True while the previous page/search is shown and the new one loads. */
    isPlaceholderData,
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
