import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button, Input, Select } from '@/components/ui';
import { useAccounts } from '@/hooks/useAccounts';
import { useToast } from '@/hooks/useToast';
import { accountSchema } from '@/lib/validations';
import { CURRENCIES } from '@/lib/currency';
import type { Account, AccountType } from '@/types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'Bank', label: 'Bank Account' },
  { value: 'Card', label: 'Credit/Debit Card' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Wallet', label: 'Digital Wallet' },
];

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, account }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Bank' as AccountType,
    currency: 'USD',
    balance: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createAccountAsync, updateAccountAsync, isCreating, isUpdating } = useAccounts();
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance: account.balance.toString(),
      });
    } else {
      setFormData({
        name: '',
        type: 'Bank',
        currency: 'USD',
        balance: '0',
      });
    }
    setErrors({});
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate with Zod
      const validatedData = accountSchema.parse({
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        balance: parseFloat(formData.balance),
      });

      // Convert null to undefined for the API
      const accountData = {
        ...validatedData,
        bank_name: validatedData.bank_name || undefined,
        account_number: validatedData.account_number || undefined,
        account_holder: validatedData.account_holder || undefined,
        notes: validatedData.notes || undefined,
      };

      if (account) {
        // Update existing account
        await updateAccountAsync({
          id: account.id,
          updates: accountData,
        });
        success('Account updated successfully');
      } else {
        // Create new account
        await createAccountAsync(accountData);
        success('Account created successfully');
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
        showError(err.message || 'Failed to save account');
      }
    }
  };

  const currencyOptions = CURRENCIES.map((currency) => ({
    value: currency.code,
    label: `${currency.code} (${currency.symbol})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? 'Edit Account' : 'Create New Account'}
      description={account ? 'Update your account details' : 'Add a new account to track your finances'}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Account Name */}
          <Input
            label="Account Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="e.g., Main Checking"
            required
          />

          {/* Account Type */}
          <Select
            label="Account Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
            options={ACCOUNT_TYPES}
            error={errors.type}
          />

          {/* Currency */}
          <Select
            label="Currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            options={currencyOptions}
            error={errors.currency}
          />

          {/* Initial Balance */}
          <Input
            label={account ? 'Current Balance' : 'Initial Balance'}
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
            error={errors.balance}
            placeholder="0.00"
            required
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
            {account ? 'Update Account' : 'Create Account'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
