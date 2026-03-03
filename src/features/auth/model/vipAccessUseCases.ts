import type { AuthProfileRecord, AuthRepository } from '../../../server/repositories/authRepository.ts';
import type { XPRepository } from '../../../server/repositories/xpRepository.ts';

export interface VipAccessCheckInput {
    userId: string;
    pagePath: string;
}

export interface VipAccessCheckResult {
    hasVipAccess: boolean;
    isPrivileged: boolean;
    shouldDeductXP: boolean;
    requiredXP: number;
    userXP: number;
}

export const checkVipAccessForPath = async (
    input: VipAccessCheckInput,
    deps: {
        auth: Pick<AuthRepository, 'getProfileByUserId'>;
        xp: Pick<XPRepository, 'getXPRequirementForPath'>;
    }
): Promise<VipAccessCheckResult> => {
    const profile = await deps.auth.getProfileByUserId(input.userId);

    if (!profile) {
        return {
            hasVipAccess: false,
            isPrivileged: false,
            shouldDeductXP: false,
            requiredXP: 0,
            userXP: 0
        };
    }

    return evaluateVipAccessProfile(profile, input.pagePath, deps.xp.getXPRequirementForPath);
};

const evaluateVipAccessProfile = async (
    profile: AuthProfileRecord,
    pagePath: string,
    getXPRequirementForPath: (pagePath: string) => Promise<number>
): Promise<VipAccessCheckResult> => {
    const isAdmin = Boolean(profile.is_admin);
    const isTeacher = profile.role === 'teacher';
    const isPrivileged = isAdmin || isTeacher;
    const hasVipFlag = Boolean(profile.is_vip);
    const hasVipAccess = hasVipFlag || isPrivileged;
    const userXP = Number(profile.experience) || 0;

    if (!hasVipAccess) {
        return {
            hasVipAccess: false,
            isPrivileged,
            shouldDeductXP: false,
            requiredXP: 0,
            userXP
        };
    }

    const requiredXP = await getXPRequirementForPath(pagePath);
    const shouldDeductXP = !isPrivileged && requiredXP > 0 && userXP >= requiredXP;

    return {
        hasVipAccess: true,
        isPrivileged,
        shouldDeductXP,
        requiredXP,
        userXP
    };
};

export const deductVipXPForPageVisit = async (
    input: { pagePath: string; requiredXP: number },
    deps: {
        auth: Pick<AuthRepository, 'getAccessToken'>;
        xp: Pick<XPRepository, 'executeXPTransaction'>;
    }
) => {
    if (input.requiredXP <= 0) {
        return { success: true as const, newXP: 0, change: 0 };
    }

    const accessToken = await deps.auth.getAccessToken();
    if (!accessToken) {
        return { success: false as const, status: 401, error: 'Oturum bulunamadı' };
    }

    return deps.xp.executeXPTransaction(
        {
            action: 'deduct',
            amount: input.requiredXP,
            reason: `Sayfa ziyareti: ${input.pagePath}`
        },
        accessToken
    );
};
