import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Moon, Sun, LayoutDashboard, Wallet, PiggyBank, Receipt, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { NotificationBell } from '@/components/notifications';

export const TopBar: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Left: App Name, Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 8h18M3 12h12M3 16h8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="19" cy="5" r="3" fill="currentColor" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                FinanceTracker
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { to: '/accounts', label: 'Accounts', icon: Wallet },
                { to: '/budgets', label: 'Budgets', icon: PiggyBank },
                { to: '/bills', label: 'Bills', icon: Receipt },
                { to: '/analytics', label: 'Analytics', icon: BarChart3 },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right: User Info & Theme Toggle */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* User Avatar */}
            {user && (
              <Link 
                to="/settings" 
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Profile & Settings"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User avatar"
                    className="w-9 h-9 rounded-full ring-2 ring-primary-500"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-primary-500 shadow-sm">
                    {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
