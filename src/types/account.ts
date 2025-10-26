import type { Transaction, InsertTransaction, UpdateTransaction } from './transaction';
import type { UserPreferences, InsertUserPreferences, UpdateUserPreferences } from './user';
import type { CurrencyRates, InsertCurrencyRates, UpdateCurrencyRates } from './currency';

// Database types
export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: Account;
        Insert: InsertAccount;
        Update: UpdateAccount;
      };
      transactions: {
        Row: Transaction;
        Insert: InsertTransaction;
        Update: UpdateTransaction;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: InsertUserPreferences;
        Update: UpdateUserPreferences;
      };
      currency_rates: {
        Row: CurrencyRates;
        Insert: InsertCurrencyRates;
        Update: UpdateCurrencyRates;
      };
    };
  };
}

// Account types
export type AccountType = 'Cash' | 'Card' | 'Bank' | 'Wallet';

// Enhanced account types
export type EnhancedAccountType = 'checking' | 'savings' | 'investment' | 'credit_card' | 'loan' | 'cash';

export interface Account {
  id: number;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  notes: string | null;
  account_type: EnhancedAccountType;
  credit_limit: number | null;
  interest_rate: number | null;
  apy: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsertAccount {
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  notes?: string | null;
  account_type?: EnhancedAccountType;
  credit_limit?: number | null;
  interest_rate?: number | null;
  apy?: number | null;
  is_active?: boolean;
}

export interface UpdateAccount {
  name?: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  notes?: string | null;
  account_type?: EnhancedAccountType;
  credit_limit?: number | null;
  interest_rate?: number | null;
  apy?: number | null;
  is_active?: boolean;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  notes?: string;
}
