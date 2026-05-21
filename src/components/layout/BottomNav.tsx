import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, PiggyBank, Receipt, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Wallet, label: 'Accounts' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/bills', icon: Receipt, label: 'Bills' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center px-3 h-full gap-1 transition-colors flex-shrink-0',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
