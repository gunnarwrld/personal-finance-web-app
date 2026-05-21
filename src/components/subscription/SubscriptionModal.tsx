import React, { useState } from 'react';
import { X, Check, Zap, Star, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '@/config/stripe';
import type { SubscriptionInterval } from '@/config/stripe';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { subscribeToPremiumAsync, isSubscribing } = useSubscription();
  const [selectedInterval, setSelectedInterval] = useState<SubscriptionInterval>('year');

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    const plan = selectedInterval === 'month' ? SUBSCRIPTION_PLANS.monthly : SUBSCRIPTION_PLANS.yearly;
    try {
      await subscribeToPremiumAsync(plan.priceId);
      // Redirect happens automatically in the mutation
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    }
  };

  const selectedPlan = selectedInterval === 'month' ? SUBSCRIPTION_PLANS.monthly : SUBSCRIPTION_PLANS.yearly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-bold text-center mb-2">Upgrade to Premium</h2>
          <p className="text-center text-blue-100 text-lg">
            Unlock all features and take control of your finances
          </p>
        </div>

        <div className="p-8">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setSelectedInterval('month')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedInterval === 'month'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedInterval('year')}
              className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
                selectedInterval === 'year'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>

          {/* Pricing */}
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">
                ${selectedPlan.amount}
              </span>
              <span className="text-xl text-gray-600 dark:text-gray-400">
                / {selectedPlan.interval}
              </span>
            </div>
            {selectedInterval === 'year' && (
              <p className="mt-2 text-green-600 dark:text-green-400 font-medium">
                That's only ${(selectedPlan.amount / 12).toFixed(2)}/month
              </p>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {selectedPlan.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Unlimited
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No limits on accounts or transactions
                </p>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  AI Insights
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Smart recommendations powered by AI
                </p>
              </div>
              <div className="text-center">
                <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Priority Support
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get help when you need it most
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isSubscribing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : (
              `Subscribe Now - $${selectedPlan.amount}/${selectedPlan.interval}`
            )}
          </button>

          {/* Fine print */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Cancel anytime. No hidden fees. Secure payment powered by Stripe.
          </p>
        </div>
      </div>
    </div>
  );
};
