import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { fetchExchangeRates, FALLBACK_RATES } from '@/lib/currency';
import type { CurrencyRates } from '@/types';

const CURRENCY_RATES_QUERY_KEY = ['currency_rates'];

export function useCurrency() {
  const queryClient = useQueryClient();

  // Fetch currency rates from database
  const {
    data: ratesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: CURRENCY_RATES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return data as CurrencyRates;
      }

      // No data in database, return fallback
      return {
        id: 0,
        base_currency: 'USD',
        rates: FALLBACK_RATES,
        last_updated: new Date().toISOString(),
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
  });

  // Refresh currency rates
  const refreshRates = useMutation({
    mutationFn: async () => {
      const rates = await fetchExchangeRates();

      const { data, error } = await supabase
        .from('currency_rates')
        .upsert({
          base_currency: 'USD',
          rates,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as CurrencyRates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENCY_RATES_QUERY_KEY });
    },
  });

  const rates = ratesData?.rates || FALLBACK_RATES;
  const lastUpdated = ratesData?.last_updated;

  // Check if rates are stale (older than 6 hours)
  const isStale = lastUpdated 
    ? Date.now() - new Date(lastUpdated).getTime() > 1000 * 60 * 60 * 6
    : true;

  return {
    rates,
    lastUpdated,
    isStale,
    isLoading,
    error,
    refreshRates: refreshRates.mutate,
    refreshRatesAsync: refreshRates.mutateAsync,
    isRefreshing: refreshRates.isPending,
  };
}
