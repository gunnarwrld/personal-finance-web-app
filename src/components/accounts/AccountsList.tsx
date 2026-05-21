import React, { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { AccountCard } from './AccountCard';
import { AccountModal } from './AccountModal';
import { Button, SkeletonCard } from '@/components/ui';
import { useAccounts } from '@/hooks/useAccounts';
import { useToast } from '@/hooks/useToast';
import type { Account } from '@/types';

export const AccountsList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const { accounts, isLoading, deleteAccount } = useAccounts();
  const { success } = useToast();

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    deleteAccount(id);
    success('Account deleted successfully');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const handleAddNew = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Wallet className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Accounts Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
          Start tracking your finances by adding your first account. You can add checking accounts, savings accounts, or credit cards.
        </p>
        <Button onClick={handleAddNew} leftIcon={<Plus className="h-5 w-5" />}>
          Add Your First Account
        </Button>

        <AccountModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          account={selectedAccount}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Add Account Button */}
        <Button
          onClick={handleAddNew}
          leftIcon={<Plus className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Add Account
        </Button>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        account={selectedAccount}
      />
    </>
  );
};
