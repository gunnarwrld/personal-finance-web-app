// Stripe Price IDs (will be set after creating products in Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  monthly: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || '',
  yearly: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || '',
} as const;

// Stripe Configuration — must be declared BEFORE isStripeConfigured to avoid TDZ error
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
  currency: 'usd',
  monthlyPriceId: STRIPE_PRICE_IDS.monthly,
  yearlyPriceId: STRIPE_PRICE_IDS.yearly,
  successUrl: `${import.meta.env.VITE_APP_URL || window.location.origin}/settings?payment=success`,
  cancelUrl: `${import.meta.env.VITE_APP_URL || window.location.origin}/settings?payment=cancelled`,
} as const;

// Validate price IDs are configured
export const isStripeConfigured = (): boolean => {
  return !!(
    STRIPE_CONFIG.publishableKey &&
    STRIPE_PRICE_IDS.monthly &&
    STRIPE_PRICE_IDS.yearly &&
    !STRIPE_PRICE_IDS.monthly.includes('placeholder') &&
    !STRIPE_PRICE_IDS.yearly.includes('placeholder')
  );
};

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Monthly Premium',
    priceId: STRIPE_PRICE_IDS.monthly,
    amount: 9.99,
    currency: 'USD',
    interval: 'month' as const,
    features: [
      'Unlimited accounts',
      'Advanced analytics & reports',
      'AI-powered insights',
      'Priority support',
      'Export data',
      'Custom categories',
    ],
  },
  yearly: {
    name: 'Yearly Premium',
    priceId: STRIPE_PRICE_IDS.yearly,
    amount: 99.99,
    currency: 'USD',
    interval: 'year' as const,
    features: [
      'Unlimited accounts',
      'Advanced analytics & reports',
      'AI-powered insights',
      'Priority support',
      'Export data',
      'Custom categories',
      '2 months free',
    ],
    savings: 20,
  },
} as const;

export type SubscriptionInterval = 'month' | 'year';
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS];
