// User and authentication types
export interface User {
  id: string;
  email: string;
  user_metadata: UserMetadata;
  created_at: string;
}

export interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  provider?: string;
}

export interface UserPreferences {
  user_id: string;
  display_currency: string;
  balance_visible: boolean;
  budget_alerts: boolean;
  /** When false, AI insights are hidden and groq-proxy refuses requests. */
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsertUserPreferences {
  user_id: string;
  display_currency?: string;
  balance_visible?: boolean;
  budget_alerts?: boolean;
  ai_enabled?: boolean;
}

export interface UpdateUserPreferences {
  display_currency?: string;
  balance_visible?: boolean;
  budget_alerts?: boolean;
  ai_enabled?: boolean;
}
