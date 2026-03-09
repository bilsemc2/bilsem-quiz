import type { AuthProfileRecord } from '@/server/repositories/authRepository';

export interface AuthProfile {
    id: string;
    name: string;
    email: string;
    experience: number;
    is_vip?: boolean;
    is_admin?: boolean;
    role?: string | null;
    grade?: number | string | null;
    school?: string | null;
    avatar_url?: string;
    last_seen?: string | null;
    yetenek_alani?: string | string[] | null;
    [key: string]: unknown;
}

export const normalizeAuthProfile = (profile: AuthProfileRecord | null): AuthProfile | null => {
    if (!profile) {
        return null;
    }

    return {
        ...profile,
        experience: Number(profile.experience) || 0
    };
};
