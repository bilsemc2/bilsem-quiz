import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import {
    gainXPForCurrentSession,
    loadSessionUser,
    loadUserProfile,
    signOutUser,
    subscribeAuthState,
    touchUserLastSeen
} from '@/features/auth/model/authUseCases';

export interface Profile {
    id: string;
    name: string;
    email: string;
    experience: number;
    is_admin?: boolean;
    grade?: number | string | null;
    school?: string | null;
    avatar_url?: string;
    last_seen?: string | null;
    yetenek_alani?: string | string[] | null;
    [key: string]: unknown;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    handleXPGain?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { /* default empty implementation */ },
    refreshProfile: async () => { /* default empty implementation */ },
    handleXPGain: async () => { /* default empty implementation */ }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);


    const fetchProfile = async (userId: string) => {
        const data = await loadUserProfile(userId);
        if (data) {
            setProfile({
                ...data,
                experience: Number(data.experience) || 0
            });
        }
    };

    const handleXPGain = async () => {
        if (!user) return;

        try {
            const result = await gainXPForCurrentSession(1, 'Zaman bazlı XP');

            if (result.success) {
                setProfile((prev) => prev ? { ...prev, experience: result.newXP } : null);
            } else if (result.status === 429) {
                // Rate limited - silently ignore
            }
        } catch (err) {
            console.error('Error in XP gain:', err);
        }
    };

    useEffect(() => {
        let isActive = true;

        const loadInitialState = async () => {
            const currentUser = await loadSessionUser();
            if (!isActive) return;

            setUser(currentUser);
            if (currentUser) {
                await fetchProfile(currentUser.id);
            } else {
                setProfile(null);
            }
            if (isActive) {
                setLoading(false);
            }
        };

        loadInitialState();

        const subscription = subscribeAuthState(async (currentUser) => {
            if (!isActive) return;

            setUser(currentUser);
            if (currentUser) {
                await fetchProfile(currentUser.id);
            } else {
                setProfile(null);
            }

            if (isActive) {
                setLoading(false);
            }
        });

        return () => {
            isActive = false;
            subscription.unsubscribe();
        };
    }, []);


    const updateLastSeen = useCallback(async () => {
        if (user?.id) {
            await touchUserLastSeen(user.id);
        }
    }, [user]);

    useEffect(() => {
        if (user?.id) {
            updateLastSeen();
            const interval = setInterval(updateLastSeen, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [user, updateLastSeen]);

    const signOut = async () => {
        await signOutUser();
        setProfile(null);
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            signOut,
            refreshProfile,
            handleXPGain
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
