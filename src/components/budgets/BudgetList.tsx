import { useState } from 'react';
import { useBudgets, useBudgetsWithSpending } from '@/hooks/useBudgets';
import { BudgetCard } from './BudgetCard';
import { BudgetModal } from './BudgetModal';
import type { BudgetWithSpending } from '@/types';

export function BudgetList() {
  const { budgets, isLoading } = useBudgetsWithSpending();
  const { deleteBudget } = useBudgets();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null);

  const handleEdit = (budget: BudgetWithSpending) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      deleteBudget(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Budgets</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Budget
        </button>
      </div>

      {/* Budget cards grid */}
      {budgets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No budgets</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new budget.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Budget
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Budget modal */}
      {isModalOpen && (
        <BudgetModal
          budget={editingBudget}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
