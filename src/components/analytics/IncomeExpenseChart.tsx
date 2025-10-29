import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { IncomeExpenseData } from '@/types';

interface IncomeExpenseChartProps {
  data: IncomeExpenseData[];
  currency?: string;
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data, currency = 'USD' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No income/expense data available
      </div>
    );
  }

  const chartData = data.map((item) => ({
    period: item.period,
    Income: parseFloat(item.income.toFixed(2)),
    Expenses: parseFloat(item.expenses.toFixed(2)),
    Net: parseFloat(item.net.toFixed(2)),
  }));

  // Calculate totals
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const totalNet = totalIncome - totalExpenses;
  const avgSavingsRate = data.reduce((sum, item) => sum + item.savingsRate, 0) / data.length;

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income vs Expenses</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Income</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {currency} {totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Expenses</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {currency} {totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${totalNet >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
          <p className="text-xs text-gray-600 dark:text-gray-400">Net Savings</p>
          <p className={`text-lg font-bold ${totalNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
            {currency} {totalNet.toFixed(2)}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Avg Savings Rate</p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {avgSavingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          <XAxis
            dataKey="period"
            className="text-xs"
            tick={{ fill: '#6B7280' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: '#6B7280' }}
            tickFormatter={(value) => `${currency} ${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelStyle={{ color: '#9CA3AF' }}
            formatter={(value: number) => `${currency} ${value.toFixed(2)}`}
          />
          <Legend />
          <Bar dataKey="Income" fill="#10B981" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Expenses" fill="#EF4444" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Net" fill="#3B82F6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
