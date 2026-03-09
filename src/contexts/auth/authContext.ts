import { createContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { AuthProfile } from '@/features/auth/model/authSessionModel';

export interface AuthContextValue {
    user: User | null;
    profile: AuthProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { /* default empty implementation */ },
    refreshProfile: async () => { /* default empty implementation */ }
});
