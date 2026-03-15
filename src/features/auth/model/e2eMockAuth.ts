import type { User } from '@supabase/supabase-js';
import type { AuthProfile } from './authSessionModel';

export interface E2EMockAuthSession {
    user: User;
    profile: AuthProfile;
}

const E2E_MOCK_AUTH_STORAGE_KEY = 'bilsemc2:e2e-mock-auth-session';
const E2E_MOCK_AUTH_EVENT_NAME = 'bilsemc2:e2e-mock-auth-change';
const DEFAULT_MOCK_EXPERIENCE = 500;
const DEFAULT_MOCK_TALENTS = ['genel yetenek', 'Müzik'];
const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

export const isE2EMockAuthEnabled = viteEnv?.VITE_E2E_MOCK_AUTH === '1';

const canUseBrowserStorage = () =>
    isE2EMockAuthEnabled &&
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined';

const slugifyEmail = (email: string) =>
    email
        .trim()
        .toLocaleLowerCase('en-US')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const buildNameFromEmail = (email: string) => {
    const localPart = email.split('@')[0] || 'e2e';
    return localPart
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1))
        .join(' ') || 'E2E Ogrenci';
};

const dispatchMockAuthChange = () => {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(E2E_MOCK_AUTH_EVENT_NAME));
};

export const buildE2EMockAuthSession = (email: string): E2EMockAuthSession => {
    const normalizedEmail = email.trim() || 'e2e.mock@example.com';
    const id = `e2e-${slugifyEmail(normalizedEmail) || 'student'}`;
    const name = buildNameFromEmail(normalizedEmail);
    const createdAt = '2026-03-13T00:00:00.000Z';

    const user = {
        id,
        email: normalizedEmail,
        app_metadata: { provider: 'email' },
        user_metadata: { name },
        aud: 'authenticated',
        created_at: createdAt,
        role: 'authenticated',
    } as User;

    const profile: AuthProfile = {
        id,
        name,
        email: normalizedEmail,
        experience: DEFAULT_MOCK_EXPERIENCE,
        is_admin: false,
        role: null,
        grade: 4,
        school: 'E2E Test School',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`,
        yetenek_alani: DEFAULT_MOCK_TALENTS,
    };

    return { user, profile };
};

export const readE2EMockAuthSession = (): E2EMockAuthSession | null => {
    if (!canUseBrowserStorage()) {
        return null;
    }

    try {
        const rawValue = window.localStorage.getItem(E2E_MOCK_AUTH_STORAGE_KEY);
        if (!rawValue) {
            return null;
        }

        const parsed = JSON.parse(rawValue) as Partial<E2EMockAuthSession>;
        if (!parsed?.user?.id || !parsed?.profile?.id) {
            return null;
        }

        return parsed as E2EMockAuthSession;
    } catch {
        return null;
    }
};

export const writeE2EMockAuthSession = (session: E2EMockAuthSession) => {
    if (!canUseBrowserStorage()) {
        return;
    }

    window.localStorage.setItem(E2E_MOCK_AUTH_STORAGE_KEY, JSON.stringify(session));
    dispatchMockAuthChange();
};

export const clearE2EMockAuthSession = () => {
    if (!canUseBrowserStorage()) {
        return;
    }

    window.localStorage.removeItem(E2E_MOCK_AUTH_STORAGE_KEY);
    dispatchMockAuthChange();
};

export const signInWithE2EMockCredentials = async (input: {
    email: string;
    password: string;
}): Promise<User> => {
    if (!isE2EMockAuthEnabled) {
        throw new Error('E2E mock auth disabled');
    }

    if (!input.email.trim() || !input.password.trim()) {
        throw new Error('Email ve şifre gereklidir');
    }

    const session = buildE2EMockAuthSession(input.email);
    writeE2EMockAuthSession(session);
    return session.user;
};

export const subscribeE2EMockAuthState = (
    callback: (session: E2EMockAuthSession | null) => void
) => {
    if (!canUseBrowserStorage() || typeof window === 'undefined') {
        return {
            unsubscribe: () => {
                // no-op
            }
        };
    }

    const handler = () => {
        callback(readE2EMockAuthSession());
    };

    window.addEventListener(E2E_MOCK_AUTH_EVENT_NAME, handler);

    return {
        unsubscribe: () => {
            window.removeEventListener(E2E_MOCK_AUTH_EVENT_NAME, handler);
        }
    };
};
