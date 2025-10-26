import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { BillsPage } from '@/pages/BillsPage';
import { RecurringPage } from '@/pages/RecurringPage';
import { Layout } from '@/components/layout/Layout';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { QuickTransactionFAB } from '@/components/quick';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
      <QuickTransactionFAB />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/auth" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" />} />
      
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/bills" element={<BillsPage />} />
          <Route path="/recurring" element={<RecurringPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} />} />
    </Routes>
  );
}

function ProtectedRoute({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return <Outlet />;
}

export default App;
