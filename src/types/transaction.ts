// Transaction types
export type TransactionType = 'income' | 'expense';

export type TransactionCategory = 
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Bills & Utilities'
  | 'Entertainment'
  | 'Health & Fitness'
  | 'Education'
  | 'Salary'
  | 'Freelance'
  | 'Investment'
  | 'Other';

export interface Transaction {
  id: number;
  user_id: string;
  account_id: number;
  amount: number;
  description: string;
  category: TransactionCategory;
  type: TransactionType;
  currency: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface InsertTransaction {
  user_id: string;
  account_id: number;
  amount: number;
  description: string;
  category: TransactionCategory;
  type: TransactionType;
  currency: string;
  date: string;
}

export interface UpdateTransaction {
  account_id?: number;
  amount?: number;
  description?: string;
  category?: TransactionCategory;
  type?: TransactionType;
  currency?: string;
  date?: string;
}

export interface CreateTransactionInput {
  account_id: number;
  amount: number;
  description: string;
  category: TransactionCategory;
  type: TransactionType;
  date: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: TransactionCategory;
  account_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface TransactionWithAccount extends Transaction {
  account?: {
    name: string;
    type: string;
    currency: string;
  };
}
