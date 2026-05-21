// Currency types
export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface CurrencyRates {
  id: number;
  base_currency: string;
  rates: Record<string, number>;
  last_updated: string;
}

export interface InsertCurrencyRates {
  base_currency: string;
  rates: Record<string, number>;
  last_updated: string;
}

export interface UpdateCurrencyRates {
  base_currency?: string;
  rates?: Record<string, number>;
  last_updated?: string;
}

export interface ExchangeRateResponse {
  success: boolean;
  base: string;
  date: string;
  rates: Record<string, number>;
}
