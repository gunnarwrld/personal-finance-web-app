import { createClient } from '@supabase/supabase-js';
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

// Helper to sign in with Google
export const signInWithGoogle = async () => {
  // Use localhost for development, production URL for deployed version
  const isDevelopment = window.location.hostname === 'localhost';
  const redirectUrl = isDevelopment 
    ? `http://localhost:${window.location.port}/dashboard`
    : `${window.location.origin}/dashboard`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  if (error) throw error;
  return data;
};

// Helper to sign in with Apple
export const signInWithApple = async () => {
  const isDevelopment = window.location.hostname === 'localhost';
  const redirectUrl = isDevelopment 
    ? `http://localhost:${window.location.port}/dashboard`
    : `${window.location.origin}/dashboard`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: redirectUrl,
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
        emailRedirectTo: `${window.location.origin}/dashboard`,
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
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });
  if (error) throw error;
  return data;
};
