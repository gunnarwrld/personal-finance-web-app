// Budget types
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Budget {
  id: number;
  user_id: string;
  category: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsertBudget {
  user_id: string;
  category: string;
  amount: number;
  period?: BudgetPeriod;
  start_date: string;
  end_date?: string | null;
  alert_threshold?: number;
  is_active?: boolean;
}

export interface UpdateBudget {
  category?: string;
  amount?: number;
  period?: BudgetPeriod;
  start_date?: string;
  end_date?: string | null;
  alert_threshold?: number;
  is_active?: boolean;
}

export interface CreateBudgetInput {
  category: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date?: string;
  alert_threshold?: number;
}

// Budget with spending info
export interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}
