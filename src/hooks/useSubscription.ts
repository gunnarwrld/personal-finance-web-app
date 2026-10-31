import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createCheckoutSession, createCustomerPortalSession } from '@/lib/stripe';
import type { UserSubscription, SubscriptionTier, SubscriptionStatus } from '@/types';
import { useAuth } from './useAuth';

const SUBSCRIPTION_QUERY_KEY = ['user_subscription'];

export function useSubscription() {
  const { user } = useAuth();

  // Fetch subscription
  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!user,
  });

  // The subscription row is written only by the Stripe webhook (service
  // role); users can read it but not change it, so there are no client-side
  // update or cancel mutations. Cancelling goes through the Stripe portal.

  // Subscribe to premium (redirects to Stripe Checkout)
  const subscribeToPremium = useMutation({
    mutationFn: async (priceId: string) => {
      const result = await createCheckoutSession(priceId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
  });

  // Open customer portal (redirects to Stripe portal)
  const openCustomerPortal = useMutation({
    mutationFn: async () => {
      const result = await createCustomerPortalSession();
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
  });

  // ────────────────────────────────────────────────────────────────────
  // FREE-MODE OVERRIDE: All users treated as premium.
  // To restore freemium, uncomment the original blocks and remove the
  // override lines directly below each one.
  // ────────────────────────────────────────────────────────────────────

  // Helper functions
  // ORIGINAL isPremium:
  // const isPremium = (): boolean => {
  //   if (!subscription) return false;
  //   return subscription.subscription_status === 'active' || subscription.subscription_status === 'trialing';
  // };
  const isPremium = (): boolean => true; // FREE-MODE OVERRIDE

  // ORIGINAL isTrialing:
  // const isTrialing = (): boolean => {
  //   return subscription?.subscription_status === 'trialing' || false;
  // };
  const isTrialing = (): boolean => false; // FREE-MODE OVERRIDE

  const daysUntilExpiry = (): number | null => {
    if (!subscription?.current_period_end) return null;
    
    const now = new Date();
    const endDate = new Date(subscription.current_period_end);
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // ORIGINAL canAccessFeature:
  // const canAccessFeature = (feature: 'budgets' | 'recurring' | 'bills' | 'transfers' | 'analytics' | 'unlimited_accounts'): boolean => {
  //   if (feature === 'budgets' && subscription?.subscription_tier === 'free') return false;
  //   if (feature === 'recurring' && subscription?.subscription_tier === 'free') return false;
  //   if (feature === 'bills' && subscription?.subscription_tier === 'free') return false;
  //   if (feature === 'transfers' && subscription?.subscription_tier === 'free') return true;
  //   if (feature === 'analytics' && subscription?.subscription_tier === 'free') return false;
  //   if (feature === 'unlimited_accounts' && subscription?.subscription_tier === 'free') return false;
  //   return isPremium();
  // };
  const canAccessFeature = (_feature: 'budgets' | 'recurring' | 'bills' | 'transfers' | 'analytics' | 'unlimited_accounts'): boolean => true; // FREE-MODE OVERRIDE

  const getSubscriptionInfo = () => {
    // FREE-MODE OVERRIDE: Always report as premium
    // ORIGINAL: if (!subscription) return { tier: 'free', ... isPremium: false, ... };
    return {
      tier: (subscription?.subscription_tier || 'premium') as SubscriptionTier,
      status: (subscription?.subscription_status || 'active') as SubscriptionStatus | null,
      isPremium: true, // FREE-MODE OVERRIDE (was: isPremium())
      daysLeft: daysUntilExpiry(),
      isTrialing: false, // FREE-MODE OVERRIDE (was: isTrialing())
    };
  };

  return {
    subscription,
    isLoading,
    error,
    subscribeToPremium: subscribeToPremium.mutate,
    subscribeToPremiumAsync: subscribeToPremium.mutateAsync,
    openCustomerPortal: openCustomerPortal.mutate,
    openCustomerPortalAsync: openCustomerPortal.mutateAsync,
    isSubscribing: subscribeToPremium.isPending,
    // Helper functions
    isPremium: isPremium(),
    isTrialing: isTrialing(),
    daysUntilExpiry: daysUntilExpiry(),
    canAccessFeature,
    subscriptionInfo: getSubscriptionInfo(),
  };
}
