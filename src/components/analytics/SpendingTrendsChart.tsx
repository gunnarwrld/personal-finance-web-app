import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimeSeriesData } from '@/types';

interface SpendingTrendsChartProps {
  data: TimeSeriesData;
  currency?: string;
}

export const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({ data, currency = 'USD' }) => {
  if (!data || data.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No spending data available for the selected period
      </div>
    );
  }

  const chartData = data.data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: parseFloat(point.value.toFixed(2)),
  }));

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spending Trends</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {currency} {data.total.toFixed(2)}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Average</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {currency} {data.average.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Highest</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {currency} {data.highest.value.toFixed(2)}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Lowest</p>
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {currency} {data.lowest.value.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          <XAxis 
            dataKey="date" 
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
            formatter={(value: number) => [`${currency} ${value.toFixed(2)}`, 'Amount']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Spending"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
