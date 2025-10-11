import React from 'react';
import { SpendingChart, CategoryBreakdown } from '@/components/analytics';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize your spending patterns and trends
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <SpendingChart />
        <CategoryBreakdown />
      </div>
    </div>
  );
};
