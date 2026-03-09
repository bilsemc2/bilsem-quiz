import { authRepository, type AuthRepository } from '../../../server/repositories/authRepository.ts';
import { xpRepository, type XPRepository } from '../../../server/repositories/xpRepository.ts';

export const loadXPRequirementsMap = async (
    pagePaths: string[],
    deps: Pick<XPRepository, 'getXPRequirementsForPaths'> = xpRepository
): Promise<Record<string, number>> => {
    const requirements = await deps.getXPRequirementsForPaths(pagePaths);

    return requirements.reduce<Record<string, number>>((acc, item) => {
        acc[item.pagePath] = item.requiredXP;
        return acc;
    }, {});
};

export const checkXPBalance = async (
    input: { userId: string; requiredAmount: number },
    deps: Pick<AuthRepository, 'getExperienceByUserId'> = authRepository
): Promise<boolean> => {
    const currentXP = await deps.getExperienceByUserId(input.userId);
    if (currentXP === null) {
        return false;
    }

    return currentXP >= input.requiredAmount;
};

export const performXPTransaction = async (
    input: { action: 'gain' | 'deduct'; amount: number; reason?: string },
    deps: {
        auth: Pick<AuthRepository, 'getAccessToken'>;
        xp: Pick<XPRepository, 'executeXPTransaction'>;
    } = { auth: authRepository, xp: xpRepository }
) => {
    const accessToken = await deps.auth.getAccessToken();
    if (!accessToken) {
        return { success: false as const, status: 401, error: 'Oturum bulunamadı' };
    }

    return deps.xp.executeXPTransaction(input, accessToken);
};
