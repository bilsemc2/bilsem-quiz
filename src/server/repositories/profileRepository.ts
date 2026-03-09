import { supabase } from '@/lib/supabase';
import {
    examSessionRepository,
    type ExamSessionSummary
} from '@/server/repositories/examSessionRepository';

export type { ExamSessionSummary } from '@/server/repositories/examSessionRepository';

interface ClassInfoRow {
    id: string;
    name: string;
    grade: string;
}

interface ClassStudentRow {
    classes: ClassInfoRow | null;
}

export interface ProfileWithClassesRow {
    id: string;
    name: string | null;
    email: string | null;
    school: string | null;
    grade: string | number | null;
    avatar_url: string | null;
    points: number | null;
    experience: number | null;
    referral_code: string | null;
    referral_count: number | null;
    yetenek_alani: string | string[] | null;
    resim_analiz_hakki?: number | null;
    class_students?: ClassStudentRow[] | null;
}

export interface PromoCode {
    id: string;
    code: string;
    xpReward: number;
    expiresAt: string | null;
    currentUses: number;
    maxUses: number;
}

interface PromoCodeDbRow {
    id: string;
    code: string;
    xp_reward: number;
    expires_at: string | null;
    current_uses: number;
    max_uses: number;
}

export interface MessageRecipientRow {
    id: string;
    name: string | null;
    email: string | null;
    grade: string | number | null;
    is_vip: boolean | null;
    yetenek_alani: string | string[] | null;
}

export interface ProfileRepository {
    getProfileWithClasses: (userId: string) => Promise<ProfileWithClassesRow | null>;
    getLatestCompletedExamSession: (userId: string) => Promise<ExamSessionSummary | null>;
    updateReferralCode: (userId: string, referralCode: string) => Promise<void>;
    getPromoCodeByCode: (code: string) => Promise<PromoCode | null>;
    hasPromoCodeUsage: (promoCodeId: string, studentId: string) => Promise<boolean>;
    insertPromoCodeUsage: (promoCodeId: string, studentId: string) => Promise<void>;
    updateUserExperience: (userId: string, newExperience: number) => Promise<void>;
    updatePromoCodeCurrentUses: (promoCodeId: string, newCurrentUses: number) => Promise<void>;
    listMessageRecipients: (nameQuery?: string) => Promise<MessageRecipientRow[]>;
    listMessageRecipientsByGrade: (grade: number) => Promise<MessageRecipientRow[]>;
    listVipMessageRecipients: () => Promise<MessageRecipientRow[]>;
}

const getProfileWithClasses = async (userId: string): Promise<ProfileWithClassesRow | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*, class_students!left(classes: class_id(id, name, grade))')
        .eq('id', userId)
        .single();

    if (error || !data) {
        if (error) {
            console.error('profile fetch failed:', error);
        }
        return null;
    }

    return data as ProfileWithClassesRow;
};

const getLatestCompletedExamSession = async (userId: string): Promise<ExamSessionSummary | null> => {
    return examSessionRepository.getLatestCompletedExamSession(userId);
};

const updateReferralCode = async (userId: string, referralCode: string): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .update({ referral_code: referralCode })
        .eq('id', userId);

    if (error) {
        throw error;
    }
};

const getPromoCodeByCode = async (code: string): Promise<PromoCode | null> => {
    const { data, error } = await supabase
        .from('promo_codes')
        .select('id, code, xp_reward, expires_at, current_uses, max_uses')
        .eq('code', code)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return null;
    }

    const row = data as PromoCodeDbRow;
    return {
        id: row.id,
        code: row.code,
        xpReward: Number(row.xp_reward) || 0,
        expiresAt: row.expires_at,
        currentUses: Number(row.current_uses) || 0,
        maxUses: Number(row.max_uses) || 0
    };
};

const hasPromoCodeUsage = async (promoCodeId: string, studentId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('promo_code_usage')
        .select('id')
        .eq('promo_code_id', promoCodeId)
        .eq('student_id', studentId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return Boolean(data);
};

const insertPromoCodeUsage = async (promoCodeId: string, studentId: string): Promise<void> => {
    const { error } = await supabase
        .from('promo_code_usage')
        .insert([{ promo_code_id: promoCodeId, student_id: studentId }]);

    if (error) {
        throw error;
    }
};

const updateUserExperience = async (userId: string, newExperience: number): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .update({ experience: newExperience })
        .eq('id', userId);

    if (error) {
        throw error;
    }
};

const updatePromoCodeCurrentUses = async (promoCodeId: string, newCurrentUses: number): Promise<void> => {
    const { error } = await supabase
        .from('promo_codes')
        .update({ current_uses: newCurrentUses })
        .eq('id', promoCodeId);

    if (error) {
        throw error;
    }
};

const listMessageRecipients = async (nameQuery = ''): Promise<MessageRecipientRow[]> => {
    const query = supabase
        .from('profiles')
        .select('id, name, email, grade, is_vip, yetenek_alani')
        .order('name');

    const pattern = `%${nameQuery.trim()}%`;
    const { data, error } = await query.ilike('name', pattern);

    if (error || !data) {
        if (error) {
            console.error('message recipients fetch failed:', error);
        }
        return [];
    }

    return data as MessageRecipientRow[];
};

const listMessageRecipientsByGrade = async (grade: number): Promise<MessageRecipientRow[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, grade, is_vip, yetenek_alani')
        .eq('grade', grade)
        .order('name');

    if (error || !data) {
        if (error) {
            console.error('message recipients by grade fetch failed:', error);
        }
        return [];
    }

    return data as MessageRecipientRow[];
};

const listVipMessageRecipients = async (): Promise<MessageRecipientRow[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, grade, is_vip, yetenek_alani')
        .eq('is_vip', true)
        .order('name');

    if (error || !data) {
        if (error) {
            console.error('vip message recipients fetch failed:', error);
        }
        return [];
    }

    return data as MessageRecipientRow[];
};

export const profileRepository: ProfileRepository = {
    getProfileWithClasses,
    getLatestCompletedExamSession,
    updateReferralCode,
    getPromoCodeByCode,
    hasPromoCodeUsage,
    insertPromoCodeUsage,
    updateUserExperience,
    updatePromoCodeCurrentUses,
    listMessageRecipients,
    listMessageRecipientsByGrade,
    listVipMessageRecipients
};
