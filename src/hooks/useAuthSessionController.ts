import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
    loadSessionUser,
    loadUserProfile,
    signOutUser,
    subscribeAuthState
} from '@/features/auth/model/authUseCases';
import { normalizeAuthProfile } from '@/features/auth/model/authSessionModel';
import type { AuthContextValue } from '@/contexts/auth/authContext';

export const useAuthSessionController = (): AuthContextValue => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<AuthContextValue['profile']>(null);
    const [loading, setLoading] = useState(true);
    const activeUserIdRef = useRef<string | null>(null);
    const isMountedRef = useRef(true);
    const profileRequestIdRef = useRef(0);

    const readProfile = useCallback(async (userId: string) => {
        const data = await loadUserProfile(userId);
        return normalizeAuthProfile(data);
    }, []);

    const syncAuthState = useCallback(async (nextUser: User | null) => {
        const previousUserId = activeUserIdRef.current;

        // Aynı kullanıcı ID'si varsa (örn. TOKEN_REFRESHED) gereksiz re-render'ı önle
        if (nextUser?.id && previousUserId === nextUser.id) {
            return;
        }

        activeUserIdRef.current = nextUser?.id ?? null;

        setUser(nextUser);

        if (!nextUser) {
            setProfile(null);
            setLoading(false);
            return;
        }

        if (previousUserId !== nextUser.id) {
            setProfile(null);
        }

        const requestId = ++profileRequestIdRef.current;
        const nextProfile = await readProfile(nextUser.id);

        if (
            !isMountedRef.current ||
            requestId !== profileRequestIdRef.current ||
            activeUserIdRef.current !== nextUser.id
        ) {
            return;
        }

        setProfile(nextProfile);
        setLoading(false);
    }, [readProfile]);

    useEffect(() => {
        isMountedRef.current = true;

        const loadInitialState = async () => {
            const currentUser = await loadSessionUser();
            if (!isMountedRef.current) {
                return;
            }

            await syncAuthState(currentUser);
        };

        void loadInitialState();

        const subscription = subscribeAuthState((currentUser) => {
            void syncAuthState(currentUser);
        });

        return () => {
            isMountedRef.current = false;
            profileRequestIdRef.current += 1;
            subscription.unsubscribe();
        };
    }, [syncAuthState]);

    const signOut = useCallback(async () => {
        await signOutUser();

        activeUserIdRef.current = null;
        setUser(null);
        setProfile(null);
        setLoading(false);
    }, []);

    const refreshProfile = useCallback(async () => {
        const userId = activeUserIdRef.current;
        if (!userId) {
            return;
        }

        const requestId = ++profileRequestIdRef.current;
        const nextProfile = await readProfile(userId);

        if (
            !isMountedRef.current ||
            requestId !== profileRequestIdRef.current ||
            activeUserIdRef.current !== userId
        ) {
            return;
        }

        setProfile(nextProfile);
    }, [readProfile]);

    return {
        user,
        profile,
        loading,
        signOut,
        refreshProfile
    };
};
