import { useState } from 'react';
import { useBillReminders } from '@/hooks/useBillReminders';
import { BillReminderCard } from './BillReminderCard';
import { BillReminderModal } from './BillReminderModal';
import type { BillReminderWithStatus } from '@/types';

export function BillReminderList() {
  const { bills, upcomingBills, overdueBills, markAsPaid, deleteBill, isLoading } = useBillReminders();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<BillReminderWithStatus | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'paid'>('all');

  const handleEdit = (bill: BillReminderWithStatus) => {
    setEditingBill(bill);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this bill reminder?')) {
      deleteBill(id);
    }
  };

  const handleMarkPaid = (id: number) => {
    markAsPaid(id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBill(null);
  };

  const getFilteredBills = () => {
    switch (filter) {
      case 'upcoming':
        return upcomingBills;
      case 'overdue':
        return overdueBills;
      case 'paid':
        return bills.filter(b => b.is_paid);
      default:
        return bills;
    }
  };

  const filteredBills = getFilteredBills();

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
        <h2 className="text-2xl font-bold text-gray-900">Bill Reminders</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Bill
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Overdue</p>
              <p className="text-2xl font-bold text-red-900">{overdueBills.length}</p>
            </div>
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Due Soon</p>
              <p className="text-2xl font-bold text-yellow-900">{upcomingBills.length}</p>
            </div>
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Paid</p>
              <p className="text-2xl font-bold text-green-900">{bills.filter(b => b.is_paid).length}</p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['all', 'upcoming', 'overdue', 'paid'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              filter === f
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bills grid */}
      {filteredBills.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bill reminders</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new bill reminder.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Bill
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBills.map((bill) => (
            <BillReminderCard
              key={bill.id}
              bill={bill}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkPaid={handleMarkPaid}
            />
          ))}
        </div>
      )}

      {/* Bill modal */}
      {isModalOpen && (
        <BillReminderModal
          bill={editingBill}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
