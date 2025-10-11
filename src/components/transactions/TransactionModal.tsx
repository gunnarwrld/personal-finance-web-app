import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button, Input, Select, TextArea } from '@/components/ui';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useToast } from '@/hooks/useToast';
import { transactionSchema } from '@/lib/validations';
import { getIncomeCategories, getExpenseCategories } from '@/lib/categories';
import type { Transaction, TransactionType, TransactionCategory } from '@/types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transaction }) => {
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    account_id: '',
    amount: '',
    category: '' as TransactionCategory | '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createTransactionAsync, updateTransactionAsync, isCreating, isUpdating } = useTransactions();
  const { accounts } = useAccounts();
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        account_id: transaction.account_id.toString(),
        amount: Math.abs(transaction.amount).toString(),
        category: transaction.category,
        description: transaction.description,
        date: transaction.date.split('T')[0],
        notes: '',
      });
    } else {
      setFormData({
        type: 'expense',
        account_id: accounts && accounts.length > 0 ? accounts[0].id.toString() : '',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setErrors({});
  }, [transaction, isOpen, accounts]);

  const categoryOptions = (formData.type === 'income' ? getIncomeCategories() : getExpenseCategories()).map(
    (cat) => ({
      value: cat,
      label: cat,
    })
  );

  const accountOptions = (accounts || []).map((acc) => ({
    value: acc.id.toString(),
    label: `${acc.name} (${acc.currency})`,
  }));

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      type: e.target.value as TransactionType,
      category: '', // Reset category when type changes
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const selectedAccount = accounts?.find((acc) => acc.id === parseInt(formData.account_id));
      if (!selectedAccount) {
        showError('Please select an account');
        return;
      }

      const validatedData = transactionSchema.parse({
        type: formData.type,
        account_id: parseInt(formData.account_id),
        amount: formData.type === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount)),
        currency: selectedAccount.currency,
        category: formData.category as TransactionCategory,
        description: formData.description,
        date: formData.date,
      });

      if (transaction) {
        // Update existing transaction
        await updateTransactionAsync({
          id: transaction.id,
          updates: validatedData,
          oldTransaction: transaction,
        });
        success('Transaction updated successfully');
      } else {
        // Create new transaction
        await createTransactionAsync({
          ...validatedData,
          currency: selectedAccount.currency,
        });
        success('Transaction created successfully');
      }

      onClose();
    } catch (err: any) {
      if (err.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error: any) => {
          fieldErrors[error.path[0]] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        showError(err.message || 'Failed to save transaction');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'Add New Transaction'}
      description={transaction ? 'Update transaction details' : 'Record a new income or expense'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Type Selection */}
          <Select
            label="Type"
            value={formData.type}
            onChange={handleTypeChange}
            options={[
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ]}
            error={errors.type}
          />

          {/* Account Selection */}
          <Select
            label="Account"
            value={formData.account_id}
            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
            options={accountOptions}
            error={errors.account_id}
          />

          {/* Amount */}
          <Input
            label="Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
            placeholder="0.00"
            required
          />

          {/* Category */}
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
            options={categoryOptions}
            error={errors.category}
          />

          {/* Description */}
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={errors.description}
            placeholder="e.g., Grocery shopping"
            required
          />

          {/* Date */}
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            error={errors.date}
            required
          />

          {/* Notes */}
          <TextArea
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            error={errors.notes}
            placeholder="Add any additional notes..."
            rows={3}
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isCreating || isUpdating}
          >
            {transaction ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
