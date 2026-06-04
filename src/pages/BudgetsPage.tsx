import { BudgetList } from '@/components/budgets';
// FREE-MODE: Premium gate removed — all users can access budgets
// import { useSubscription } from '@/hooks/useSubscription';
// import { Link } from 'react-router-dom';

export function BudgetsPage() {
  // FREE-MODE: isPremium check removed
  // const { isPremium } = useSubscription();

  // ORIGINAL: if (!isPremium) { return ( ... "Premium Feature" locked UI ... ); }

  return (
    <div className="space-y-6">
      <BudgetList />
    </div>
  );
}
