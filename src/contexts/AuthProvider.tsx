import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AuthContext } from './authContext';

// Name of the service worker runtime cache for Supabase API responses
// (see vite.config.ts). It holds the signed-in user's data.
const SUPABASE_RESPONSE_CACHE = 'supabase-cache';

/**
 * Single owner of the Supabase auth subscription. Every useAuth() call reads
 * from here instead of opening its own listener and /auth/v1/user request.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // INITIAL_SESSION fires once the stored session or the OAuth / magic-link
    // tokens in the URL have been processed. Supabase also re-emits SIGNED_IN
    // every time the tab becomes visible; nothing here navigates, so that no
    // longer bounces the user back to the dashboard.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUserId = nextSession?.user.id ?? null;

      if (userIdRef.current !== null && userIdRef.current !== nextUserId) {
        // Signed out or switched accounts: drop everything cached for the
        // previous user so the next one never sees it.
        queryClient.clear();
        if ('caches' in window) {
          void caches.delete(SUPABASE_RESPONSE_CACHE);
        }
      }
      userIdRef.current = nextUserId;

      setSession((prev) =>
        prev &&
        nextSession &&
        prev.access_token === nextSession.access_token &&
        prev.user.updated_at === nextSession.user.updated_at
          ? prev
          : nextSession
      );
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
