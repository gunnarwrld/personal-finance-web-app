// Common utility types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface Analytics {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  monthly_income: number;
  monthly_expenses: number;
  category_breakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}
