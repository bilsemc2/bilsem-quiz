import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    profile: any | null;
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
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);


    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setProfile(data);
        }
    };

    const handleXPGain = async () => {
        if (!user) return;

        try {
            // Optimistic update
            const currentXP = profile?.experience || 0;
            const newXP = currentXP + 1;
            setProfile((prev: any) => prev ? { ...prev, experience: newXP } : null);

            // Persist to DB
            const { error } = await supabase
                .from('profiles')
                .update({ experience: newXP })
                .eq('id', user.id);

            if (error) throw error;
        } catch (err) {
            console.error('Error in global XP gain:', err);
        }
    };

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) fetchProfile(currentUser.id);
            setLoading(false);
        });

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) fetchProfile(currentUser.id);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);


    useEffect(() => {
        if (user?.id) {
            updateLastSeen();
            const interval = setInterval(updateLastSeen, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [user]);

    const updateLastSeen = async () => {
        if (user?.id) {
            await supabase
                .from('profiles')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', user.id);
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
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
