// Recurring transaction types
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: number;
  user_id: string;
  account_id: number;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_occurrence: string;
  last_created_at: string | null;
  is_active: boolean;
  auto_create: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsertRecurringTransaction {
  user_id: string;
  account_id: number;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string | null;
  next_occurrence: string;
  is_active?: boolean;
  auto_create?: boolean;
}

export interface UpdateRecurringTransaction {
  account_id?: number;
  description?: string;
  amount?: number;
  category?: string;
  type?: 'income' | 'expense';
  frequency?: RecurringFrequency;
  start_date?: string;
  end_date?: string | null;
  next_occurrence?: string;
  is_active?: boolean;
  auto_create?: boolean;
}

export interface CreateRecurringTransactionInput {
  account_id: number;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
}

// Recurring transaction with account info
export interface RecurringTransactionWithAccount extends RecurringTransaction {
  account?: {
    name: string;
    type: string;
    currency: string;
  };
}
