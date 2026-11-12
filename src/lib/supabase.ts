import { createClient, FunctionsHttpError } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Where OAuth, magic links and confirmation emails send the user back to.
// Must be allowed under Authentication → URL Configuration in Supabase.
const authRedirectUrl = () => `${window.location.origin}/dashboard`;

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Permanently delete the signed-in user's account and all their data
 * (the delete-account Edge Function removes the auth user; every table
 * cascades from it), then clear the local session.
 */
export const deleteAccount = async () => {
  const { error } = await supabase.functions.invoke('delete-account', {
    body: { confirm: 'DELETE' },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error || 'Could not delete the account');
    }
    throw error;
  }
  // The user no longer exists on the server, so only clear this browser's
  // session; that fires SIGNED_OUT and the app drops its cached data.
  await supabase.auth.signOut({ scope: 'local' });
};

// Helper to sign in with Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: authRedirectUrl(),
    },
  });
  if (error) throw error;
  return data;
};

// Helper to sign in with Apple
export const signInWithApple = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: authRedirectUrl(),
    },
  });
  if (error) throw error;
  return data;
};

// Helper to sign in with Email/Password
export const signInWithEmail = async (email: string, password?: string) => {
  if (password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } else {
    return signInWithOtp(email);
  }
};

// Helper to sign up with Email/Password
export const signUpWithEmail = async (email: string, password?: string) => {
  if (password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authRedirectUrl(),
      }
    });
    if (error) throw error;
    return data;
  } else {
    return signInWithOtp(email);
  }
};

// Helper to sign in with Magic Link (OTP)
export const signInWithOtp = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: authRedirectUrl(),
    },
  });
  if (error) throw error;
  return data;
};

export interface AuthProviderSettings {
  email: boolean;
  google: boolean;
  apple: boolean;
}

/**
 * Which sign-in methods are switched on for this Supabase project. A button
 * for a provider that is off sends the user to a raw "provider is not
 * enabled" error page, so the auth page only shows enabled ones.
 */
export const getAuthProviderSettings = async (): Promise<AuthProviderSettings> => {
  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: { apikey: supabaseAnonKey },
  });
  if (!response.ok) {
    throw new Error(`Auth settings request failed with status ${response.status}`);
  }
  const settings = await response.json();
  return {
    email: !!settings.external?.email,
    google: !!settings.external?.google,
    apple: !!settings.external?.apple,
  };
};
