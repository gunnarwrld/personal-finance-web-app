import { useSubscription } from '@/hooks/useSubscription';

export function SubscriptionBanner() {
  const { subscriptionInfo, cancelSubscription, isCanceling } = useSubscription();

  if (subscriptionInfo.isPremium) {
    // Premium user - show status
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h3 className="text-xl font-bold">Premium Member</h3>
              {subscriptionInfo.isTrialing && (
                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
                  Trial
                </span>
              )}
            </div>
            <p className="mt-2 text-blue-100">
              {subscriptionInfo.isTrialing 
                ? `Trial ends in ${subscriptionInfo.daysLeft} days`
                : subscriptionInfo.daysLeft && subscriptionInfo.daysLeft > 0
                  ? `Renews in ${subscriptionInfo.daysLeft} days`
                  : 'Active subscription'
              }
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to cancel your premium subscription?')) {
                cancelSubscription();
              }
            }}
            disabled={isCanceling}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isCanceling ? 'Canceling...' : 'Manage Subscription'}
          </button>
        </div>
      </div>
    );
  }

  // Free user - show upgrade options
  return (
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h3 className="text-2xl font-bold mb-2">Upgrade to Premium</h3>
          <p className="text-indigo-100 mb-4">
            Unlock all features and take control of your finances
          </p>
          
          {/* Features list */}
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Unlimited accounts & budgets
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Recurring transactions & bill reminders
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Advanced analytics & insights
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Priority support
            </li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="flex flex-col gap-3">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
            <p className="text-sm text-indigo-100">Monthly</p>
            <p className="text-3xl font-bold">$4.99<span className="text-lg font-normal">/mo</span></p>
            <button className="mt-3 w-full px-4 py-2 bg-white text-indigo-600 rounded-md font-semibold hover:bg-indigo-50 transition-colors">
              Start Free Trial
            </button>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border-2 border-yellow-400">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-indigo-100">Yearly</p>
              <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                Save 17%
              </span>
            </div>
            <p className="text-3xl font-bold">$49.99<span className="text-lg font-normal">/yr</span></p>
            <p className="text-xs text-indigo-200 mt-1">Just $4.16/month</p>
            <button className="mt-3 w-full px-4 py-2 bg-yellow-400 text-gray-900 rounded-md font-semibold hover:bg-yellow-300 transition-colors">
              Get Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
