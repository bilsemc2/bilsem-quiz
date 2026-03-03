import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import {
    authRepository,
    type AuthProfileRecord,
    type AuthRepository
} from '@/server/repositories/authRepository';
import { xpRepository, type XPRepository } from '@/server/repositories/xpRepository';

export const loadSessionUser = async (
    deps: Pick<AuthRepository, 'getSessionUser'> = authRepository
): Promise<User | null> => {
    return deps.getSessionUser();
};

export const subscribeAuthState = (
    callback: (user: User | null, event: AuthChangeEvent, session: Session | null) => void,
    deps: Pick<AuthRepository, 'onAuthStateChange'> = authRepository
): { unsubscribe: () => void } => {
    return deps.onAuthStateChange(callback);
};

export const loadUserProfile = async (
    userId: string,
    deps: Pick<AuthRepository, 'getProfileByUserId'> = authRepository
): Promise<AuthProfileRecord | null> => {
    return deps.getProfileByUserId(userId);
};

export const touchUserLastSeen = async (
    userId: string,
    deps: Pick<AuthRepository, 'updateLastSeen'> = authRepository
): Promise<void> => {
    await deps.updateLastSeen(userId, new Date().toISOString());
};

export const signOutUser = async (
    deps: Pick<AuthRepository, 'signOut'> = authRepository
): Promise<void> => {
    await deps.signOut();
};

export const gainXPForCurrentSession = async (
    amount: number,
    reason: string = 'Zaman bazlı XP',
    deps: {
        auth: Pick<AuthRepository, 'getAccessToken'>;
        xp: Pick<XPRepository, 'executeXPTransaction'>;
    } = { auth: authRepository, xp: xpRepository }
) => {
    const accessToken = await deps.auth.getAccessToken();
    if (!accessToken) {
        return { success: false as const, error: 'Oturum bulunamadı', status: 401 };
    }

    return deps.xp.executeXPTransaction({ action: 'gain', amount, reason }, accessToken);
};
