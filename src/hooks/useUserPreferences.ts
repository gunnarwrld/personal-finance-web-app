import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserPreferences, UpdateUserPreferences } from '@/types';
import { useAuth } from './useAuth';

const USER_PREFERENCES_QUERY_KEY = ['user_preferences'];

export function useUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user preferences
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    queryKey: USER_PREFERENCES_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // A database trigger creates this row at signup; this covers accounts
        // created before that trigger worked. Column defaults fill the rest.
        const { data: created, error: createError } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        return created as UserPreferences;
      }

      if (error) throw error;
      return data as UserPreferences;
    },
    enabled: !!user,
  });

  // Update preferences
  const updatePreferences = useMutation({
    mutationFn: async (updates: UpdateUserPreferences) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PREFERENCES_QUERY_KEY });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    updatePreferencesAsync: updatePreferences.mutateAsync,
    isUpdating: updatePreferences.isPending,
  };
}
