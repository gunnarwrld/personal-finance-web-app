// Subscription types
export type SubscriptionTier = 'free' | 'premium';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export interface UserSubscription {
  id: number;
  user_id: string;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsertUserSubscription {
  user_id: string;
  subscription_tier?: SubscriptionTier;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: SubscriptionStatus | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  trial_end?: string | null;
}

export interface UpdateUserSubscription {
  subscription_tier?: SubscriptionTier;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: SubscriptionStatus | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  trial_end?: string | null;
}

// Subscription status helpers
export interface SubscriptionInfo extends UserSubscription {
  is_premium: boolean;
  is_trial: boolean;
  days_until_renewal: number | null;
  is_expiring_soon: boolean; // Expires within 7 days
}
