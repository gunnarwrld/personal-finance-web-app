import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createCheckoutSession, createCustomerPortalSession } from '@/lib/stripe';
import type { UserSubscription, SubscriptionTier, SubscriptionStatus } from '@/types';
import { useAuth } from './useAuth';

const SUBSCRIPTION_QUERY_KEY = ['user_subscription'];

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  // Update subscription status
  const updateSubscription = useMutation({
    mutationFn: async (updates: Partial<UserSubscription>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          ...updates,
        })
        .select()
        .single();

      if (error) throw error;

      // Update is_premium flag in user_preferences
      if (updates.subscription_status === 'active') {
        await supabase
          .from('user_preferences')
          .update({ is_premium: true })
          .eq('user_id', user.id);
      } else if (updates.subscription_status === 'canceled' || updates.subscription_status === 'incomplete_expired') {
        await supabase
          .from('user_preferences')
          .update({ is_premium: false })
          .eq('user_id', user.id);
      }

      return data as UserSubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['user_preferences'] });
    },
  });

  // Cancel subscription
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          subscription_status: 'canceled' as SubscriptionStatus,
          cancel_at_period_end: true,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update is_premium flag
      await supabase
        .from('user_preferences')
        .update({ is_premium: false })
        .eq('user_id', user.id);

      return data as UserSubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['user_preferences'] });
    },
  });

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

  // Helper functions
  const isPremium = (): boolean => {
    if (!subscription) return false;
    return subscription.subscription_status === 'active' || subscription.subscription_status === 'trialing';
  };

  const isTrialing = (): boolean => {
    return subscription?.subscription_status === 'trialing' || false;
  };

  const daysUntilExpiry = (): number | null => {
    if (!subscription?.current_period_end) return null;
    
    const now = new Date();
    const endDate = new Date(subscription.current_period_end);
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const canAccessFeature = (feature: 'budgets' | 'recurring' | 'bills' | 'transfers' | 'analytics' | 'unlimited_accounts'): boolean => {
    // Free tier always has access to basic features
    if (feature === 'budgets' && subscription?.subscription_tier === 'free') {
      return false; // Budgets are premium only
    }
    if (feature === 'recurring' && subscription?.subscription_tier === 'free') {
      return false; // Recurring transactions are premium only
    }
    if (feature === 'bills' && subscription?.subscription_tier === 'free') {
      return false; // Bill reminders are premium only
    }
    if (feature === 'transfers' && subscription?.subscription_tier === 'free') {
      return true; // Basic transfers allowed
    }
    if (feature === 'analytics' && subscription?.subscription_tier === 'free') {
      return false; // Advanced analytics are premium only
    }
    if (feature === 'unlimited_accounts' && subscription?.subscription_tier === 'free') {
      return false; // Free tier limited to 3 accounts
    }

    return isPremium();
  };

  const getSubscriptionInfo = () => {
    if (!subscription) {
      return {
        tier: 'free' as SubscriptionTier,
        status: null as SubscriptionStatus | null,
        isPremium: false,
        daysLeft: null as number | null,
        isTrialing: false,
      };
    }

    return {
      tier: subscription.subscription_tier,
      status: subscription.subscription_status,
      isPremium: isPremium(),
      daysLeft: daysUntilExpiry(),
      isTrialing: isTrialing(),
    };
  };

  return {
    subscription,
    isLoading,
    error,
    updateSubscription: updateSubscription.mutate,
    updateSubscriptionAsync: updateSubscription.mutateAsync,
    cancelSubscription: cancelSubscription.mutate,
    cancelSubscriptionAsync: cancelSubscription.mutateAsync,
    subscribeToPremium: subscribeToPremium.mutate,
    subscribeToPremiumAsync: subscribeToPremium.mutateAsync,
    openCustomerPortal: openCustomerPortal.mutate,
    openCustomerPortalAsync: openCustomerPortal.mutateAsync,
    isUpdating: updateSubscription.isPending,
    isCanceling: cancelSubscription.isPending,
    isSubscribing: subscribeToPremium.isPending,
    // Helper functions
    isPremium: isPremium(),
    isTrialing: isTrialing(),
    daysUntilExpiry: daysUntilExpiry(),
    canAccessFeature,
    subscriptionInfo: getSubscriptionInfo(),
  };
}
