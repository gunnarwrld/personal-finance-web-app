import { useContext, useState } from 'react';
import { AuthContext } from '@/contexts/authContext';
import {
  signInWithGoogle as signInWithGoogleFn,
  signInWithApple as signInWithAppleFn,
  signInWithEmail as signInWithEmailFn,
  signUpWithEmail as signUpWithEmailFn,
  signOut as signOutFn,
} from '@/lib/supabase';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Busy/error state is per caller, so one sign-in button spinning does not
  // make every other button on the page spin too.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>, fallbackMessage: string) => {
    try {
      setError(null);
      setIsLoading(true);
      await action();
    } catch (err) {
      const message = err instanceof Error ? err.message : fallbackMessage;
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user: context.user,
    session: context.session,
    loading: context.loading,
    isLoading,
    error,
    isAuthenticated: !!context.user,
    signInWithGoogle: () => run(signInWithGoogleFn, 'Failed to sign in'),
    signInWithApple: () => run(signInWithAppleFn, 'Failed to sign in'),
    signInWithEmail: (email: string, password?: string) =>
      run(() => signInWithEmailFn(email, password), 'Failed to sign in'),
    signUpWithEmail: (email: string, password?: string) =>
      run(() => signUpWithEmailFn(email, password), 'Failed to sign up'),
    signOut: () => run(signOutFn, 'Failed to sign out'),
  };
}
