// Bill reminder types
export interface BillReminder {
  id: number;
  user_id: string;
  account_id: number | null;
  title: string;
  amount: number;
  category: string;
  due_date: string;
  is_paid: boolean;
  paid_date: string | null;
  recurring_id: number | null;
  reminder_days_before: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsertBillReminder {
  user_id: string;
  account_id?: number | null;
  title: string;
  amount: number;
  category: string;
  due_date: string;
  is_paid?: boolean;
  paid_date?: string | null;
  recurring_id?: number | null;
  reminder_days_before?: number;
  notes?: string | null;
}

export interface UpdateBillReminder {
  account_id?: number | null;
  title?: string;
  amount?: number;
  category?: string;
  due_date?: string;
  is_paid?: boolean;
  paid_date?: string | null;
  recurring_id?: number | null;
  reminder_days_before?: number;
  notes?: string | null;
}

export interface CreateBillReminderInput {
  account_id?: number;
  title: string;
  amount: number;
  category: string;
  due_date: string;
  reminder_days_before?: number;
  notes?: string;
}

// Bill reminder with account info
export interface BillReminderWithAccount extends BillReminder {
  account?: {
    name: string;
    type: string;
    currency: string;
  };
}

// Bill reminder with status info
export interface BillReminderWithStatus extends BillReminder {
  days_until_due: number;
  is_overdue: boolean;
  is_upcoming: boolean; // Due within reminder_days_before
}
