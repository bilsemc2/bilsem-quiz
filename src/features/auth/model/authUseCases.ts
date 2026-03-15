import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import {
    authRepository,
    type CompleteRegistrationProfileInput,
    type AuthProfileRecord,
    type AuthRepository
} from '../../../server/repositories/authRepository.ts';
import { xpRepository, type XPRepository } from '../../../server/repositories/xpRepository.ts';
import {
    clearE2EMockAuthSession,
    isE2EMockAuthEnabled,
    readE2EMockAuthSession,
    signInWithE2EMockCredentials,
    subscribeE2EMockAuthState
} from './e2eMockAuth.ts';

export const SIGNUP_STARTING_XP = 50;

export interface SignInUserInput {
    email: string;
    password: string;
}

export interface SignUpEmailPasswordInput {
    email: string;
    password: string;
    metadata?: Record<string, unknown>;
}

export interface RegisterUserInput {
    email: string;
    name: string;
    school: string;
    grade: number | string;
    password: string;
    confirmPassword: string;
    referralCode?: string;
}

export interface RegisterUserResult {
    startingXP: number;
    referralBonusGranted: boolean;
}

export interface PasswordResetEmailInput {
    email: string;
    siteUrl: string;
}

export interface ResetUserPasswordInput {
    newPassword: string;
    confirmPassword: string;
}

const ensurePasswordIsValid = (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
        throw new Error('Şifreler eşleşmiyor');
    }

    if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
    }
};

const normalizeGrade = (grade: number | string): number => {
    const normalizedGrade = Number.parseInt(String(grade), 10);

    if (!Number.isFinite(normalizedGrade)) {
        throw new Error('Geçerli bir sınıf seçin');
    }

    return normalizedGrade;
};

const normalizeSiteUrl = (siteUrl: string): string => {
    return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
};

const buildAvatarUrl = (name: string): string => {
    const encodedName = encodeURIComponent(name);
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodedName}&backgroundColor=b6e3f4,c0aede,d1d4f9&mood=happy`;
};

const toErrorMessage = (error: unknown, fallbackMessage: string): string => {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallbackMessage;
};

const formatSignInError = (error: unknown): string => {
    const message = toErrorMessage(error, 'Giriş yapılamadı');

    if (message.includes('Invalid login credentials')) {
        return 'Email veya şifre hatalı';
    }

    if (message.startsWith('Giriş yapılamadı')) {
        return message;
    }

    return `Giriş yapılamadı: ${message}`;
};

const formatSignUpError = (error: unknown): string => {
    const message = toErrorMessage(error, 'Kayıt yapılamadı');

    if (message.includes('User already registered')) {
        return 'Bu email ile zaten bir hesap var';
    }

    return message;
};

const isAuthSessionMissingError = (error: unknown): boolean => {
    return error instanceof Error && error.name === 'AuthSessionMissingError';
};

export const loadSessionUser = async (
    deps: Pick<AuthRepository, 'getSessionUser'> = authRepository
): Promise<User | null> => {
    if (isE2EMockAuthEnabled) {
        return readE2EMockAuthSession()?.user ?? null;
    }

    return deps.getSessionUser();
};

export const subscribeAuthState = (
    callback: (user: User | null, event: AuthChangeEvent, session: Session | null) => void,
    deps: Pick<AuthRepository, 'onAuthStateChange'> = authRepository
): { unsubscribe: () => void } => {
    if (isE2EMockAuthEnabled) {
        return subscribeE2EMockAuthState((session) => {
            callback(
                session?.user ?? null,
                session ? 'SIGNED_IN' : 'SIGNED_OUT',
                null
            );
        });
    }

    return deps.onAuthStateChange(callback);
};

export const loadUserProfile = async (
    userId: string,
    deps: Pick<AuthRepository, 'getProfileByUserId'> = authRepository
): Promise<AuthProfileRecord | null> => {
    if (isE2EMockAuthEnabled) {
        const session = readE2EMockAuthSession();
        return session?.user.id === userId
            ? session.profile as unknown as AuthProfileRecord
            : null;
    }

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
    if (isE2EMockAuthEnabled) {
        clearE2EMockAuthSession();
        return;
    }

    await deps.signOut();
};

export const signInUser = async (
    input: SignInUserInput,
    deps: Pick<AuthRepository, 'signInWithPassword'> = authRepository
): Promise<void> => {
    if (isE2EMockAuthEnabled) {
        await signInWithE2EMockCredentials(input);
        return;
    }

    try {
        await deps.signInWithPassword({
            email: input.email,
            password: input.password
        });
    } catch (error) {
        throw new Error(formatSignInError(error));
    }
};

export const signUpEmailPassword = async (
    input: SignUpEmailPasswordInput,
    deps: Pick<AuthRepository, 'signUpWithPassword'> = authRepository
): Promise<void> => {
    try {
        await deps.signUpWithPassword({
            email: input.email,
            password: input.password,
            metadata: input.metadata
        });
    } catch (error) {
        throw new Error(formatSignUpError(error));
    }
};

export const requestPasswordResetEmail = async (
    input: PasswordResetEmailInput,
    deps: Pick<AuthRepository, 'requestPasswordReset'> = authRepository
): Promise<void> => {
    try {
        const siteUrl = normalizeSiteUrl(input.siteUrl);
        await deps.requestPasswordReset(
            input.email,
            `${siteUrl}/reset-password?type=recovery`
        );
    } catch (error) {
        throw new Error(toErrorMessage(error, 'Şifre sıfırlama isteği gönderilemedi'));
    }
};

export const loadSessionAccessToken = async (
    deps: Pick<AuthRepository, 'getAccessToken'> = authRepository
): Promise<string | null> => {
    if (isE2EMockAuthEnabled) {
        return 'e2e-mock-access-token';
    }

    return deps.getAccessToken();
};

export const loadSessionUserId = async (
    deps: Pick<AuthRepository, 'getSessionUser'> = authRepository
): Promise<string | null> => {
    const user = await deps.getSessionUser();
    return user?.id ?? null;
};

export const resetUserPassword = async (
    input: ResetUserPasswordInput,
    deps: Pick<AuthRepository, 'updatePassword' | 'signOut'> = authRepository
): Promise<void> => {
    ensurePasswordIsValid(input.newPassword, input.confirmPassword);

    try {
        await deps.updatePassword(input.newPassword);
        await deps.signOut();
    } catch (error) {
        if (isAuthSessionMissingError(error)) {
            return;
        }

        throw new Error(toErrorMessage(error, 'Şifre güncellenirken bir hata oluştu'));
    }
};

export const registerUser = async (
    input: RegisterUserInput,
    deps: Pick<
        AuthRepository,
        | 'getReferrerIdByCode'
        | 'signUpWithPassword'
        | 'completeRegistrationProfile'
        | 'incrementXP'
        | 'signInWithPassword'
    > = authRepository
): Promise<RegisterUserResult> => {
    ensurePasswordIsValid(input.password, input.confirmPassword);

    const grade = normalizeGrade(input.grade);
    const referralCode = input.referralCode?.trim() || '';
    let referrerId: string | null = null;

    if (referralCode) {
        referrerId = await deps.getReferrerIdByCode(referralCode);

        if (!referrerId) {
            throw new Error('Geçersiz referans kodu');
        }
    }

    try {
        const user = await deps.signUpWithPassword({
            email: input.email,
            password: input.password,
            metadata: {
                name: input.name,
                school: input.school,
                grade
            }
        });

        if (!user) {
            throw new Error('Kayıt tamamlanamadı');
        }

        const profilePayload: CompleteRegistrationProfileInput = {
            userId: user.id,
            email: input.email,
            name: input.name,
            school: input.school,
            grade,
            referredBy: referralCode || null,
            avatarUrl: buildAvatarUrl(input.name),
            points: 0,
            experience: SIGNUP_STARTING_XP
        };

        await deps.completeRegistrationProfile(profilePayload);

        if (referrerId) {
            try {
                await deps.incrementXP(referrerId, SIGNUP_STARTING_XP);
            } catch (error) {
                console.error('Referral XP update failed:', error);
            }
        }

        await deps.signInWithPassword({
            email: input.email,
            password: input.password
        });

        return {
            startingXP: SIGNUP_STARTING_XP,
            referralBonusGranted: Boolean(referrerId)
        };
    } catch (error) {
        throw new Error(formatSignUpError(error));
    }
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
