import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AccountTransfer, InsertAccountTransfer, UpdateAccountTransfer } from '@/types';
import { useAuth } from './useAuth';
import { useCurrency } from './useCurrency';

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

  // Create transfer
  const createTransfer = useMutation({
    mutationFn: async (input: InsertAccountTransfer) => {
      if (!user) throw new Error('User not authenticated');

      // Get account details to determine currencies
      const { data: fromAccount, error: fromError } = await supabase
        .from('accounts')
        .select('currency, balance')
        .eq('id', input.from_account_id)
        .single();

      if (fromError) throw fromError;

      const { data: toAccount, error: toError } = await supabase
        .from('accounts')
        .select('currency')
        .eq('id', input.to_account_id)
        .single();

      if (toError) throw toError;

      // Calculate exchange rate and converted amount
      const fromCurrency = input.from_currency || fromAccount.currency;
      const toCurrency = input.to_currency || toAccount.currency;
      
      let exchange_rate = 1.0;
      let converted_amount = input.amount;

      if (fromCurrency !== toCurrency) {
        const fromRate = rates[fromCurrency] || 1;
        const toRate = rates[toCurrency] || 1;
        exchange_rate = toRate / fromRate;
        converted_amount = input.amount * exchange_rate;
      }

      // Create transfer record
      const { data: transfer, error: transferError } = await supabase
        .from('account_transfers')
        .insert([{
          ...input,
          user_id: user.id,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          exchange_rate,
          converted_amount,
        }])
        .select()
        .single();

      if (transferError) throw transferError;

      // Update balances
      // Deduct from source account
      const { error: deductError } = await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance - input.amount })
        .eq('id', input.from_account_id);

      if (deductError) throw deductError;

      // Add to destination account
      const { data: toAccountBalance, error: toBalanceError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', input.to_account_id)
        .single();

      if (toBalanceError) throw toBalanceError;

      const { error: addError } = await supabase
        .from('accounts')
        .update({ balance: toAccountBalance.balance + converted_amount })
        .eq('id', input.to_account_id);

      if (addError) throw addError;

      return transfer as AccountTransfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  // Update transfer
  const updateTransfer = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateAccountTransfer }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('account_transfers')
        .update(updates)
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

      // Revert balances
      // Add back to source account
      const { data: fromAccount, error: fromError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', transfer.from_account_id)
        .single();

      if (fromError) throw fromError;

      const { error: revertFromError } = await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance + transfer.amount })
        .eq('id', transfer.from_account_id);

      if (revertFromError) throw revertFromError;

      // Deduct from destination account
      const { data: toAccount, error: toError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', transfer.to_account_id)
        .single();

      if (toError) throw toError;

      const { error: revertToError } = await supabase
        .from('accounts')
        .update({ balance: toAccount.balance - transfer.converted_amount })
        .eq('id', transfer.to_account_id);

      if (revertToError) throw revertToError;

      // Delete transfer record
      const { error } = await supabase
        .from('account_transfers')
        .delete()
        .eq('id', transfer.id)
        .eq('user_id', user.id);

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
