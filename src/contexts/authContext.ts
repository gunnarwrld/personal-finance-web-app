import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the stored session (or tokens in the URL) has been processed. */
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
