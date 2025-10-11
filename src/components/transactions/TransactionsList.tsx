import React, { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { TransactionItem } from './TransactionItem';
import { TransactionModal } from './TransactionModal';
import { Button, Select, SkeletonList } from '@/components/ui';
import { useTransactions } from '@/hooks/useTransactions';
import { getExpenseCategories, getIncomeCategories } from '@/lib/categories';
import type { Transaction, TransactionType, TransactionCategory } from '@/types';

export const TransactionsList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    type: undefined as TransactionType | undefined,
    category: undefined as TransactionCategory | undefined,
  });

  const { transactions, isLoading } = useTransactions(filters);

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleAddNew = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...getExpenseCategories().map((cat) => ({ value: cat, label: cat })),
    ...getIncomeCategories().map((cat) => ({ value: cat, label: cat })),
  ];

  if (isLoading) {
    return <SkeletonList count={5} />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Receipt className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Transactions Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
          {filters.type || filters.category
            ? 'No transactions match your filters. Try adjusting them or add a new transaction.'
            : 'Start tracking your finances by recording your first transaction.'}
        </p>
        <Button onClick={handleAddNew} leftIcon={<Plus className="h-5 w-5" />}>
          Add Your First Transaction
        </Button>

        <TransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          transaction={selectedTransaction}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters and Add Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type Filter */}
            <Select
              value={filters.type || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({ ...filters, type: value ? value as TransactionType : undefined });
              }}
              options={[
                { value: '', label: 'All Types' },
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' },
              ]}
            />

            {/* Category Filter */}
            <Select
              value={filters.category || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({ ...filters, category: value ? value as TransactionCategory : undefined });
              }}
              options={categoryOptions}
            />
          </div>

          {/* Add Transaction Button */}
          <Button
            onClick={handleAddNew}
            leftIcon={<Plus className="h-5 w-5" />}
            className="w-full sm:w-auto"
          >
            Add Transaction
          </Button>
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onClick={handleEdit}
            />
          ))}
        </div>

        {/* Transaction Count */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transaction={selectedTransaction}
      />
    </>
  );
};
