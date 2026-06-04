import { RecurringTransactionList } from '@/components/recurring';
// FREE-MODE: Premium gate removed — all users can access recurring transactions
// import { useSubscription } from '@/hooks/useSubscription';
// import { Link } from 'react-router-dom';

export function RecurringPage() {
  // FREE-MODE: isPremium check removed
  // const { isPremium } = useSubscription();

  // ORIGINAL: if (!isPremium) { return ( ... "Premium Feature" locked UI ... ); }

  return (
    <div className="space-y-6">
      <RecurringTransactionList />
    </div>
  );
}
