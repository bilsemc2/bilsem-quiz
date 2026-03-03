import { supabase } from '@/lib/supabase';

export interface AdminManagedUserRecord {
    id: string;
    email: string | null;
    name: string | null;
    points: number | null;
    experience: number | null;
    is_vip: boolean | null;
    is_active: boolean | null;
    grade?: number | string | null;
    referred_by?: string | null;
    yetenek_alani?: string[] | string | null;
    resim_analiz_hakki?: number | null;
    class_students?: {
        classes: { id: string; name: string; grade: number } | null;
    }[] | null;
}

export interface UpdateAdminManagedUserInput {
    name: string;
    email: string;
    points: number;
    experience: number;
    grade: number;
    referred_by: string | null;
    yetenek_alani: string[] | null;
    resim_analiz_hakki: number;
}

export interface ResetUserPasswordInput {
    targetUserId: string;
    newPassword: string;
    accessToken: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
}

export interface AdminUserRepository {
    listUsers: () => Promise<AdminManagedUserRecord[]>;
    setUserVipStatus: (userId: string, isVip: boolean) => Promise<void>;
    updateUser: (userId: string, input: UpdateAdminManagedUserInput) => Promise<void>;
    deleteUser: (userId: string) => Promise<number>;
    resetAllXp: () => Promise<void>;
    resetUserPassword: (input: ResetUserPasswordInput) => Promise<void>;
}

const listUsers = async (): Promise<AdminManagedUserRecord[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*, class_students(classes(id, name, grade))')
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('admin users fetch failed:', error);
        }
        return [];
    }

    return data as AdminManagedUserRecord[];
};

const setUserVipStatus = async (userId: string, isVip: boolean): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .update({ is_vip: isVip })
        .eq('id', userId);

    if (error) {
        throw error;
    }
};

const updateUser = async (userId: string, input: UpdateAdminManagedUserInput): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .update({
            name: input.name,
            email: input.email,
            points: input.points,
            experience: input.experience,
            grade: input.grade,
            referred_by: input.referred_by,
            yetenek_alani: input.yetenek_alani,
            resim_analiz_hakki: input.resim_analiz_hakki
        })
        .eq('id', userId);

    if (error) {
        throw error;
    }
};

const deleteUser = async (userId: string): Promise<number> => {
    const { error, count } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .eq('id', userId);

    if (error) {
        throw error;
    }

    return count ?? 0;
};

const resetAllXp = async (): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .update({ experience: 0 })
        .gte('experience', 0);

    if (error) {
        throw error;
    }
};

const resetUserPassword = async (input: ResetUserPasswordInput): Promise<void> => {
    const response = await fetch(`${input.supabaseUrl}/functions/v1/admin-reset-password`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${input.accessToken}`,
            'Content-Type': 'application/json',
            apikey: input.supabaseAnonKey
        },
        body: JSON.stringify({
            targetUserId: input.targetUserId,
            newPassword: input.newPassword
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result?.error || 'Şifre güncellenemedi');
    }
};

export const adminUserRepository: AdminUserRepository = {
    listUsers,
    setUserVipStatus,
    updateUser,
    deleteUser,
    resetAllXp,
    resetUserPassword
};
