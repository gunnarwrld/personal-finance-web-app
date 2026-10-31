import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { AuthPage } from '@/pages/AuthPage';
import { Layout } from '@/components/layout/Layout';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { QuickTransactionFAB } from '@/components/quick';

// Pages behind sign-in are split into their own chunks so the auth page does
// not have to download Recharts and the rest of the app first.
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AccountsPage = lazy(() => import('@/pages/AccountsPage').then((m) => ({ default: m.AccountsPage })));
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const BudgetsPage = lazy(() => import('@/pages/BudgetsPage').then((m) => ({ default: m.BudgetsPage })));
const BillsPage = lazy(() => import('@/pages/BillsPage').then((m) => ({ default: m.BillsPage })));
const RecurringPage = lazy(() => import('@/pages/RecurringPage').then((m) => ({ default: m.RecurringPage })));
const NotificationCenterPage = lazy(() =>
  import('@/pages/NotificationCenterPage').then((m) => ({ default: m.NotificationCenterPage }))
);

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/auth" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/bills" element={<BillsPage />} />
              <Route path="/recurring" element={<RecurringPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/notifications" element={<NotificationCenterPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />} />
        </Routes>
      </Suspense>
      {isAuthenticated && <QuickTransactionFAB />}
    </>
  );
}

function ProtectedRoute({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

export default App;
