import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { FALLBACK_RATES } from '@/lib/currency';
import type { CurrencyRates } from '@/types';

const CURRENCY_RATES_QUERY_KEY = ['currency_rates'];
// The ECB publishes once per working day; older than this means the shared
// row has not been refreshed recently.
const RATES_MAX_AGE_MS = 1000 * 60 * 60 * 12;

const isOlderThan = (timestamp: string | null | undefined, ms: number) =>
  !timestamp || Date.now() - new Date(timestamp).getTime() > ms;

/**
 * Ask the refresh-currency-rates edge function for fresh rates. Clients can
 * only read the currency_rates table; the function fetches the rates from the
 * ECB itself, so no client can write made-up values.
 */
async function requestRatesRefresh(): Promise<CurrencyRates> {
  const { data, error } = await supabase.functions.invoke('refresh-currency-rates');
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error || 'Failed to refresh exchange rates');
    }
    throw error;
  }
  return data as CurrencyRates;
}

export function useCurrency() {
  const queryClient = useQueryClient();

  // Fetch currency rates from database
  const {
    data: ratesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: CURRENCY_RATES_QUERY_KEY,
    queryFn: async (): Promise<CurrencyRates> => {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data && !isOlderThan(data.last_updated, RATES_MAX_AGE_MS)) {
        return data as CurrencyRates;
      }

      // Stored rates are missing or stale: refresh them, but never fail the
      // query over it — old rates beat no rates.
      try {
        return await requestRatesRefresh();
      } catch (refreshError) {
        console.warn('Could not refresh exchange rates, using stored ones:', refreshError);
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

  // Refresh currency rates on demand (Settings page)
  const refreshRates = useMutation({
    mutationFn: requestRatesRefresh,
    onSuccess: (data) => {
      queryClient.setQueryData(CURRENCY_RATES_QUERY_KEY, data);
    },
  });

  const rates = ratesData?.rates || FALLBACK_RATES;
  const lastUpdated = ratesData?.last_updated;

  // Check if rates are stale (older than 6 hours)
  const isStale = isOlderThan(lastUpdated, 1000 * 60 * 60 * 6);

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
