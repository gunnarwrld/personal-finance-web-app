import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG } from '@/config/stripe';
import { supabase } from './supabase';

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
  priceId: string
): Promise<{ error?: string }> => {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { error: 'You must be logged in to subscribe' };
    }

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        successUrl: STRIPE_CONFIG.successUrl,
        cancelUrl: STRIPE_CONFIG.cancelUrl,
      },
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      return { error: error.message || 'Failed to create checkout session' };
    }

    if (data?.error) {
      return { error: data.error };
    }

    if (!data?.url) {
      return { error: 'No checkout URL returned' };
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url;

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
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { error: 'You must be logged in to access the customer portal' };
    }

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: {
        returnUrl: window.location.href,
      },
    });

    if (error) {
      console.error('Error creating portal session:', error);
      return { error: error.message || 'Failed to create portal session' };
    }

    if (data?.error) {
      return { error: data.error };
    }

    if (!data?.url) {
      return { error: 'No portal URL returned' };
    }

    // Redirect to Stripe Customer Portal
    window.location.href = data.url;

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
