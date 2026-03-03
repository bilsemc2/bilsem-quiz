import {
    profileRepository,
    type ExamSessionSummary,
    type ProfileRepository,
    type ProfileWithClassesRow
} from '@/server/repositories/profileRepository';
import type { ClassInfo, UserProfile } from '@/types/profile';
import { generateReferralCode } from './referralCode';

export interface ProfilePageData {
    userData: UserProfile | null;
    lastExamSession: ExamSessionSummary | null;
}

export type RedeemPromoCodeResult =
    | { status: 'success'; xpReward: number; code: string; newXP: number }
    | { status: 'not_found' | 'expired' | 'usage_limit' | 'already_used' }
    | { status: 'error'; message: string };

const buildAvatarUrl = (avatarUrl: string | null | undefined, email: string): string => {
    if (avatarUrl && avatarUrl.trim().length > 0) {
        return avatarUrl;
    }

    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;
};

const mapClasses = (profileData: ProfileWithClassesRow): ClassInfo[] => {
    const classStudents = profileData.class_students ?? [];
    return classStudents
        .filter((item) => Boolean(item.classes))
        .map((item) => ({
            id: item.classes!.id,
            name: item.classes!.name,
            grade: item.classes!.grade
        }));
};

const mapProfileToUserData = (profileData: ProfileWithClassesRow, fallbackEmail: string): UserProfile => {
    const resolvedEmail =
        typeof profileData.email === 'string' && profileData.email.length > 0
            ? profileData.email
            : fallbackEmail;

    return {
        name: typeof profileData.name === 'string' ? profileData.name : '',
        email: resolvedEmail,
        school: typeof profileData.school === 'string' ? profileData.school : '',
        grade: profileData.grade != null ? String(profileData.grade) : '',
        avatar_url: buildAvatarUrl(profileData.avatar_url, resolvedEmail),
        points: typeof profileData.points === 'number' ? profileData.points : 0,
        experience: typeof profileData.experience === 'number' ? profileData.experience : 0,
        referral_code: typeof profileData.referral_code === 'string' ? profileData.referral_code : '',
        referral_count: typeof profileData.referral_count === 'number' ? profileData.referral_count : 0,
        classes: mapClasses(profileData),
        yetenek_alani:
            typeof profileData.yetenek_alani === 'string' || Array.isArray(profileData.yetenek_alani)
                ? profileData.yetenek_alani
                : ''
    };
};

export const loadProfilePageData = async (
    input: { userId: string; userEmail: string },
    deps: Pick<ProfileRepository, 'getProfileWithClasses' | 'getLatestCompletedExamSession'> = profileRepository
): Promise<ProfilePageData> => {
    const [profileData, lastExamSession] = await Promise.all([
        deps.getProfileWithClasses(input.userId),
        deps.getLatestCompletedExamSession(input.userId)
    ]);

    if (!profileData) {
        return {
            userData: null,
            lastExamSession
        };
    }

    return {
        userData: mapProfileToUserData(profileData, input.userEmail),
        lastExamSession
    };
};

export const refreshReferralCode = async (
    input: { userId: string },
    deps: Pick<ProfileRepository, 'updateReferralCode'> = profileRepository
): Promise<string | null> => {
    try {
        const newCode = generateReferralCode();
        await deps.updateReferralCode(input.userId, newCode);
        return newCode;
    } catch (error) {
        console.error('referral code update failed:', error);
        return null;
    }
};

const normalizePromoCode = (promoCode: string): string => {
    return promoCode.trim().toUpperCase();
};

export const redeemPromoCode = async (
    input: { userId: string; promoCode: string; currentExperience: number },
    deps: Pick<
        ProfileRepository,
        | 'getPromoCodeByCode'
        | 'hasPromoCodeUsage'
        | 'insertPromoCodeUsage'
        | 'updateUserExperience'
        | 'updatePromoCodeCurrentUses'
    > = profileRepository
): Promise<RedeemPromoCodeResult> => {
    const code = normalizePromoCode(input.promoCode);
    if (!code) {
        return { status: 'not_found' };
    }

    try {
        const promoCode = await deps.getPromoCodeByCode(code);
        if (!promoCode) {
            return { status: 'not_found' };
        }

        if (promoCode.expiresAt && new Date(promoCode.expiresAt).getTime() < Date.now()) {
            return { status: 'expired' };
        }

        if (promoCode.currentUses >= promoCode.maxUses) {
            return { status: 'usage_limit' };
        }

        const alreadyUsed = await deps.hasPromoCodeUsage(promoCode.id, input.userId);
        if (alreadyUsed) {
            return { status: 'already_used' };
        }

        await deps.insertPromoCodeUsage(promoCode.id, input.userId);

        const currentXP = Number.isFinite(input.currentExperience) ? input.currentExperience : 0;
        const newXP = currentXP + promoCode.xpReward;
        await deps.updateUserExperience(input.userId, newXP);
        await deps.updatePromoCodeCurrentUses(promoCode.id, promoCode.currentUses + 1);

        return {
            status: 'success',
            xpReward: promoCode.xpReward,
            code: promoCode.code,
            newXP
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { status: 'error', message };
    }
};
