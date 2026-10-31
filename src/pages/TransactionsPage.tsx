import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction } from '@/types';

const PAGE_SIZE = 20;

export const TransactionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Wait for a pause in typing before querying, and start again from page 1.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { transactions, count, totalPages, isLoading } = useTransactions(
    search ? { search } : undefined,
    { page, limit: PAGE_SIZE }
  );

  // Deleting the last row of the last page leaves that page empty.
  useEffect(() => {
    if (!isLoading && totalPages >= 1 && page > totalPages) {
      setPage(totalPages);
    }
  }, [isLoading, page, totalPages]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Transactions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Every income and expense. Select one to edit or delete it.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <Input
          type="search"
          placeholder="Search descriptions"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          leftIcon={<Search className="h-5 w-5" />}
          aria-label="Search transactions"
        />

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {search ? `No transactions match "${search}"` : 'No transactions yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onClick={setEditingTransaction}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages} · {count} transactions
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      <TransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />
    </div>
  );
};
