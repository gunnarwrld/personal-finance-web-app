import { BillReminderList } from '@/components/bills';
// FREE-MODE: Premium gate removed — all users can access bills
// import { useSubscription } from '@/hooks/useSubscription';
// import { Link } from 'react-router-dom';

export function BillsPage() {
  // FREE-MODE: isPremium check removed
  // const { isPremium } = useSubscription();

  // ORIGINAL: if (!isPremium) { return ( ... "Premium Feature" locked UI ... ); }

  return (
    <div className="space-y-6">
      <BillReminderList />
    </div>
  );
}
