import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Account, CreateAccountInput, UpdateAccount } from '@/types';
import { useAuth } from './useAuth';

const ACCOUNTS_QUERY_KEY = ['accounts'];

export function useAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all accounts
  const {
    data: accounts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user,
  });

  // Create account
  const createAccount = useMutation({
    mutationFn: async (input: CreateAccountInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('accounts')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
    },
  });

  // Update account
  const updateAccount = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateAccount }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
    },
  });

  // Delete account
  const deleteAccount = useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Also refresh transactions
    },
  });

  // Calculate total balance
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return {
    accounts,
    isLoading,
    error,
    totalBalance,
    refetch,
    createAccount: createAccount.mutate,
    createAccountAsync: createAccount.mutateAsync,
    isCreating: createAccount.isPending,
    updateAccount: updateAccount.mutate,
    updateAccountAsync: updateAccount.mutateAsync,
    isUpdating: updateAccount.isPending,
    deleteAccount: deleteAccount.mutate,
    deleteAccountAsync: deleteAccount.mutateAsync,
    isDeleting: deleteAccount.isPending,
  };
}

// Hook to get single account
export function useAccount(id: number | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      if (!user || !id) throw new Error('Invalid parameters');

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Account;
    },
    enabled: !!user && !!id,
  });
}
