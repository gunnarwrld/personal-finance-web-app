import { BillReminderList } from '@/components/bills';
import { useSubscription } from '@/hooks/useSubscription';
import { Link } from 'react-router-dom';

export function BillsPage() {
  const { isPremium } = useSubscription();

  if (!isPremium) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bill Reminders
        </h1>
        
        {/* Premium feature locked */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-16 w-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
            <p className="text-indigo-100 mb-6">
              Bill reminders are available for Premium members. Never miss a payment with automated reminders and tracking.
            </p>
            <Link
              to="/settings"
              className="inline-block px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BillReminderList />
    </div>
  );
}
