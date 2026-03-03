import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

export interface AuthProfileRecord {
    id: string;
    email: string;
    name: string;
    experience: number;
    is_vip?: boolean;
    is_admin?: boolean;
    role?: string | null;
    avatar_url?: string;
    yetenek_alani?: string | string[] | null;
    grade?: number | string | null;
    school?: string | null;
    last_seen?: string | null;
    [key: string]: unknown;
}

export interface AccessProfileRecord {
    experience: number;
    is_admin: boolean;
    role: string | null;
    yetenek_alani: string | string[] | null;
}

export interface AuthRepository {
    getProfilesCount: () => Promise<number | null>;
    getSessionUser: () => Promise<User | null>;
    onAuthStateChange: (
        callback: (user: User | null, event: AuthChangeEvent, session: Session | null) => void
    ) => { unsubscribe: () => void };
    getProfileByUserId: (userId: string) => Promise<AuthProfileRecord | null>;
    getAccessProfileByUserId: (userId: string) => Promise<AccessProfileRecord | null>;
    getExperienceByUserId: (userId: string) => Promise<number | null>;
    updateLastSeen: (userId: string, lastSeenISO: string) => Promise<void>;
    signOut: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
}

const getProfilesCount = async (): Promise<number | null> => {
    const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

    if (error) {
        console.error('profiles count fetch failed:', error);
        return null;
    }

    return count ?? null;
};

const getSessionUser = async (): Promise<User | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
};

const onAuthStateChange = (
    callback: (user: User | null, event: AuthChangeEvent, session: Session | null) => void
) => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user ?? null, event, session);
    });

    return data.subscription;
};

const getProfileByUserId = async (userId: string): Promise<AuthProfileRecord | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, experience, is_vip, is_admin, role, avatar_url, yetenek_alani, grade, school, last_seen')
        .eq('id', userId)
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error('profile fetch failed:', error);
        }
        return null;
    }

    return {
        ...data,
        experience: Number(data.experience) || 0
    } as AuthProfileRecord;
};

const getAccessProfileByUserId = async (userId: string): Promise<AccessProfileRecord | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('experience, is_admin, role, yetenek_alani')
        .eq('id', userId)
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error('access profile fetch failed:', error);
        }
        return null;
    }

    return {
        experience: Number(data.experience) || 0,
        is_admin: Boolean(data.is_admin),
        role: typeof data.role === 'string' ? data.role : null,
        yetenek_alani:
            typeof data.yetenek_alani === 'string' || Array.isArray(data.yetenek_alani)
                ? data.yetenek_alani
                : null
    };
};

const getExperienceByUserId = async (userId: string): Promise<number | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('experience')
        .eq('id', userId)
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error('experience fetch failed:', error);
        }
        return null;
    }

    return Number(data.experience) || 0;
};

const updateLastSeen = async (userId: string, lastSeenISO: string): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .update({ last_seen: lastSeenISO })
        .eq('id', userId);

    if (error) {
        console.error('last seen update failed:', error);
    }
};

const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
};

const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
};

export const authRepository: AuthRepository = {
    getProfilesCount,
    getSessionUser,
    onAuthStateChange,
    getProfileByUserId,
    getAccessProfileByUserId,
    getExperienceByUserId,
    updateLastSeen,
    signOut,
    getAccessToken
};
