import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AccountTransfer, CreateAccountTransferInput, UpdateAccountTransfer } from '@/types';
import { useAuth } from './useAuth';
import { useCurrency } from './useCurrency';
import { toLocalDateString } from '@/lib/utils';

const TRANSFERS_QUERY_KEY = ['account_transfers'];

export function useAccountTransfers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { rates } = useCurrency();

  // Fetch all transfers
  const {
    data: transfers,
    isLoading,
    error,
  } = useQuery({
    queryKey: TRANSFERS_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('account_transfers')
        .select(`
          *,
          from_account:from_account_id(name, type, currency),
          to_account:to_account_id(name, type, currency)
        `)
        .eq('user_id', user.id)
        .order('transfer_date', { ascending: false });

      if (error) throw error;
      return (data || []) as AccountTransfer[];
    },
    enabled: !!user,
  });

  // Balance changes happen inside these database functions, in the same
  // transaction as the transfer row, so the two accounts cannot drift apart.

  // Create transfer
  const createTransfer = useMutation({
    mutationFn: async (input: CreateAccountTransferInput) => {
      if (!user) throw new Error('User not authenticated');

      // The database uses rate 1 when both accounts share a currency.
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, currency')
        .in('id', [input.from_account_id, input.to_account_id]);

      if (accountsError) throw accountsError;

      const fromCurrency = accounts?.find((a) => a.id === input.from_account_id)?.currency || 'USD';
      const toCurrency = accounts?.find((a) => a.id === input.to_account_id)?.currency || 'USD';
      const exchangeRate = (rates[toCurrency] || 1) / (rates[fromCurrency] || 1);

      const { data: transfer, error } = await supabase.rpc('create_account_transfer', {
        p_from_account_id: input.from_account_id,
        p_to_account_id: input.to_account_id,
        p_amount: input.amount,
        p_exchange_rate: exchangeRate,
        p_description: input.description,
        p_transfer_date: input.transfer_date ?? toLocalDateString(),
      });

      if (error) throw error;
      return transfer as AccountTransfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  // Update transfer details. Amounts and accounts are fixed once created:
  // delete and recreate the transfer to change them, so balances stay right.
  const updateTransfer = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Pick<UpdateAccountTransfer, 'description' | 'transfer_date'> }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('account_transfers')
        .update({ description: updates.description, transfer_date: updates.transfer_date })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as AccountTransfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSFERS_QUERY_KEY });
    },
  });

  // Delete transfer and revert balances
  const deleteTransfer = useMutation({
    mutationFn: async (transfer: AccountTransfer) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('delete_account_transfer', { p_id: transfer.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  return {
    transfers: transfers || [],
    isLoading,
    error,
    createTransfer: createTransfer.mutate,
    createTransferAsync: createTransfer.mutateAsync,
    updateTransfer: updateTransfer.mutate,
    updateTransferAsync: updateTransfer.mutateAsync,
    deleteTransfer: deleteTransfer.mutate,
    deleteTransferAsync: deleteTransfer.mutateAsync,
    isCreating: createTransfer.isPending,
    isUpdating: updateTransfer.isPending,
    isDeleting: deleteTransfer.isPending,
  };
}
