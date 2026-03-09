import { authRepository, type AuthRepository } from '@/server/repositories/authRepository';
import { xpRepository, type XPRepository } from '@/server/repositories/xpRepository';
import {
    checkUserAccess,
    deductPageVisitXP,
    type AccessCheckInput,
    type AccessCheckResult
} from './accessGateService';

export const checkUserAccessForPath = async (
    input: AccessCheckInput,
    deps: {
        auth: Pick<AuthRepository, 'getAccessProfileByUserId'>;
        xp: Pick<XPRepository, 'getXPRequirementForPath'>;
    } = { auth: authRepository, xp: xpRepository }
): Promise<AccessCheckResult> => checkUserAccess(input, deps);

export const deductXPForPageVisit = async (
    input: { pagePath: string; requiredXP: number },
    deps: {
        auth: Pick<AuthRepository, 'getAccessToken'>;
        xp: Pick<XPRepository, 'executeXPTransaction'>;
    } = { auth: authRepository, xp: xpRepository }
) => deductPageVisitXP(input, deps);
