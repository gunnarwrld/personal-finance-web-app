import type { Currency, ExchangeRateResponse } from '@/types';

// Supported currencies
export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

// Export supported currency codes
export const SUPPORTED_CURRENCIES = CURRENCIES.map(c => c.code);

// Fallback exchange rates (used when API is unavailable)
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CNY: 6.5,
  SEK: 10.87,
  AUD: 1.35,
  CAD: 1.25,
};

/**
 * Fetch current exchange rates from external API
 */
export const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  try {
    const apiUrl = import.meta.env.VITE_CURRENCY_API_URL || 'https://api.exchangerate.host/latest';
    const response = await fetch(`${apiUrl}?base=USD`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data: ExchangeRateResponse = await response.json();
    
    if (data.success && data.rates) {
      return data.rates;
    }

    throw new Error('Invalid exchange rate response');
  } catch (error) {
    console.error('Failed to fetch exchange rates, using fallback:', error);
    return FALLBACK_RATES;
  }
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
};

/**
 * Format currency amount with symbol
 */
export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;

  // Format with 2 decimal places and thousands separator
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  return `${symbol}${formatted}`;
};

/**
 * Get currency by code
 */
export const getCurrency = (code: string): Currency | undefined => {
  return CURRENCIES.find(c => c.code === code);
};

/**
 * Validate if currency code is supported
 */
export const isSupportedCurrency = (code: string): boolean => {
  return CURRENCIES.some(c => c.code === code);
};
