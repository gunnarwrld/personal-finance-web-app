// Account transfer types
export interface AccountTransfer {
  id: number;
  user_id: string;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  converted_amount: number;
  description: string | null;
  transfer_date: string;
  created_at: string;
  updated_at: string;
}

export interface InsertAccountTransfer {
  user_id: string;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  from_currency: string;
  to_currency: string;
  exchange_rate?: number;
  converted_amount: number;
  description?: string | null;
  transfer_date?: string;
}

export interface UpdateAccountTransfer {
  from_account_id?: number;
  to_account_id?: number;
  amount?: number;
  from_currency?: string;
  to_currency?: string;
  exchange_rate?: number;
  converted_amount?: number;
  description?: string | null;
  transfer_date?: string;
}

export interface CreateAccountTransferInput {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  description?: string;
  transfer_date?: string;
}

// Transfer with account info
export interface AccountTransferWithAccounts extends AccountTransfer {
  from_account?: {
    name: string;
    type: string;
    currency: string;
  };
  to_account?: {
    name: string;
    type: string;
    currency: string;
  };
}
