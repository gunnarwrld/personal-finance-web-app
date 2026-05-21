import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import { useTransactions } from '../../hooks/useTransactions';
import { format, eachDayOfInterval, subMonths } from 'date-fns';

export function SpendingChart() {
  const { transactions, isLoading } = useTransactions();

  // Generate data for the last 30 days
  const chartData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subMonths(today, 1);
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTransactions = transactions.filter(t => t.date === dayStr);

      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: format(day, 'MMM d'),
        income,
        expenses,
      };
    });
  }, [transactions]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Income vs Expenses (Last 30 Days)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickMargin={10}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickMargin={10}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
            }}
            formatter={(value: number) => `$${value.toFixed(2)}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Income"
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
            name="Expenses"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
