import {
    authRepository,
    type AuthRepository
} from '@/server/repositories/authRepository';
import {
    profileRepository,
    type ProfileRepository,
    type ResimWorkshopProfileRow
} from '@/server/repositories/profileRepository';
import { checkTalentAccess } from '@/features/auth/model/talentAccessUseCases';

export const DEFAULT_RESIM_ANALYSIS_QUOTA = 3;
export const TEACHER_RESIM_ANALYSIS_QUOTA = 999;

export interface ResimWorkshopAccessState {
    hasTalentAccess: boolean;
    userTalents: string[];
    analysisQuota: number;
    isTeacher: boolean;
}

export const EMPTY_RESIM_WORKSHOP_ACCESS_STATE: ResimWorkshopAccessState = {
    hasTalentAccess: false,
    userTalents: [],
    analysisQuota: 0,
    isTeacher: false
};

const normalizeQuota = (quota: number | null | undefined): number => {
    if (quota == null) {
        return DEFAULT_RESIM_ANALYSIS_QUOTA;
    }

    const value = Number(quota);
    if (!Number.isFinite(value)) {
        return DEFAULT_RESIM_ANALYSIS_QUOTA;
    }

    return Math.max(0, Math.round(value));
};

export const mapResimWorkshopAccessState = (
    profile: ResimWorkshopProfileRow | null
): ResimWorkshopAccessState => {
    if (!profile) {
        return EMPTY_RESIM_WORKSHOP_ACCESS_STATE;
    }

    const isTeacher = Boolean(profile.is_admin) || profile.role === 'teacher';
    const talentAccess = checkTalentAccess(
        {
            is_admin: profile.is_admin ?? undefined,
            role: profile.role,
            yetenek_alani: profile.yetenek_alani
        },
        'Resim'
    );

    return {
        hasTalentAccess: isTeacher || talentAccess.hasAccess,
        userTalents: talentAccess.userTalents,
        analysisQuota: isTeacher
            ? TEACHER_RESIM_ANALYSIS_QUOTA
            : normalizeQuota(profile.resim_analiz_hakki),
        isTeacher
    };
};

export const loadResimWorkshopAccess = async (
    userId: string | null | undefined,
    deps: Pick<ProfileRepository, 'getResimWorkshopProfile'> = profileRepository
): Promise<ResimWorkshopAccessState> => {
    if (!userId) {
        return EMPTY_RESIM_WORKSHOP_ACCESS_STATE;
    }

    const profile = await deps.getResimWorkshopProfile(userId);
    return mapResimWorkshopAccessState(profile);
};

export const getNextResimAnalysisQuota = (currentQuota: number): number => {
    return Math.max(0, Math.round(currentQuota) - 1);
};

export const consumeResimAnalysisQuota = async (
    input: {
        currentQuota: number;
        isTeacher: boolean;
    },
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser'>;
        profile: Pick<ProfileRepository, 'updateResimAnalysisQuota'>;
    } = { auth: authRepository, profile: profileRepository }
): Promise<number> => {
    if (input.isTeacher) {
        return TEACHER_RESIM_ANALYSIS_QUOTA;
    }

    const currentQuota = Math.max(0, Math.round(input.currentQuota));
    if (currentQuota <= 0) {
        return 0;
    }

    const user = await deps.auth.getSessionUser();
    if (!user) {
        return currentQuota;
    }

    const nextQuota = getNextResimAnalysisQuota(currentQuota);
    await deps.profile.updateResimAnalysisQuota(user.id, nextQuota);
    return nextQuota;
};
