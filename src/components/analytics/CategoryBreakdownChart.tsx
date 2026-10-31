import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { CategorySpendingBreakdown } from '@/types';

interface CategoryBreakdownChartProps {
  data: CategorySpendingBreakdown[];
  currency?: string;
}

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#14B8A6', // teal
  '#6366F1', // indigo
];

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({ data, currency = 'USD' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No category data available
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.category,
    value: parseFloat(item.amount.toFixed(2)),
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  const percentageFor = (name: string) => chartData.find((item) => item.name === name)?.percentage ?? 0;

  const renderCustomLabel = ({ name }: { name?: string }) => {
    return `${percentageFor(name ?? '').toFixed(1)}%`;
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => [`${currency} ${value.toFixed(2)}`, 'Amount']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {value} ({percentageFor(value).toFixed(1)}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Category List */}
      <div className="mt-6 space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Top Categories</h4>
        {chartData.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {currency} {item.value.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
