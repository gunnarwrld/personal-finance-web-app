import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Pages are lazy-loaded; keep the navigation visible while one loads. */}
          <Suspense
            fallback={
              <div className="flex justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
