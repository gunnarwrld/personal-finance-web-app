import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG } from '@/config/stripe';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get Stripe instance (singleton pattern)
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    if (!STRIPE_CONFIG.publishableKey) {
      console.warn('Stripe publishable key is not configured');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
};

/**
 * Create a checkout session and redirect to Stripe Checkout
 */
export const createCheckoutSession = async (
  priceId: string,
  customerId?: string
): Promise<{ error?: string }> => {
  try {
    // This will be called via Supabase Edge Function in Phase 8.2
    // For now, we'll prepare the structure
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        priceId,
        customerId,
        successUrl: STRIPE_CONFIG.successUrl,
        cancelUrl: STRIPE_CONFIG.cancelUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId, error } = await response.json();

    if (error) {
      return { error };
    }

    if (!sessionId) {
      return { error: 'No session ID returned' };
    }

    // Redirect to Stripe Checkout
    const stripe = await getStripe();
    if (!stripe) {
      return { error: 'Stripe is not configured' };
    }

    // Use window.location to redirect to Stripe Checkout URL
    // The Edge Function will return the checkout URL
    window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`;

    return {};
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { error: 'Failed to create checkout session' };
  }
};

/**
 * Create a customer portal session and redirect
 */
export const createCustomerPortalSession = async (): Promise<{ error?: string }> => {
  try {
    // This will be called via Supabase Edge Function in Phase 8.2
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        returnUrl: window.location.href,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url, error } = await response.json();

    if (error) {
      return { error };
    }

    // Redirect to Stripe Customer Portal
    window.location.href = url;

    return {};
  } catch (error) {
    console.error('Error creating portal session:', error);
    return { error: 'Failed to create portal session' };
  }
};

/**
 * Format amount for Stripe (convert to cents)
 */
export const formatAmountForStripe = (amount: number, currency: string): number => {
  // Zero decimal currencies
  const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
  
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  
  return Math.round(amount * 100);
};

/**
 * Format amount from Stripe (convert from cents)
 */
export const formatAmountFromStripe = (amount: number, currency: string): number => {
  // Zero decimal currencies
  const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
  
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount;
  }
  
  return amount / 100;
};
