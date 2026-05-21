import { z } from 'zod';
import type { TransactionCategory, TransactionType } from '@/types';

/**
 * Account validation schema
 */
export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Name is too long'),
  type: z.enum(['Cash', 'Card', 'Bank', 'Wallet'] as const),
  balance: z.number().min(0, 'Balance cannot be negative'),
  currency: z.string().length(3, 'Currency code must be 3 characters'),
  bank_name: z.string().max(100).optional().nullable(),
  account_number: z.string().max(50).optional().nullable(),
  account_holder: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type AccountFormData = z.infer<typeof accountSchema>;

/**
 * Transaction validation schema
 */
export const transactionSchema = z.object({
  account_id: z.number().int().positive('Please select an account'),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(200, 'Description is too long'),
  category: z.string() as z.ZodType<TransactionCategory>,
  type: z.enum(['income', 'expense'] as const),
  date: z.string().min(1, 'Date is required'),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

/**
 * User preferences validation schema
 */
export const userPreferencesSchema = z.object({
  display_currency: z.string().length(3),
  balance_visible: z.boolean(),
  budget_alerts: z.boolean(),
});

export type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>;

/**
 * Validate transaction against account balance (for expenses)
 */
export function validateTransactionBalance(
  amount: number,
  accountBalance: number,
  type: TransactionType
): { valid: boolean; message?: string } {
  if (type === 'expense' && amount > accountBalance) {
    return {
      valid: false,
      message: `Insufficient balance. Available: ${accountBalance}`,
    };
  }
  return { valid: true };
}
