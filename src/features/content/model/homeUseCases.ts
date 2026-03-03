import { authRepository, type AuthRepository } from '@/server/repositories/authRepository';

const DEFAULT_STUDENT_COUNT_LABEL = '1000+';

export const loadStudentCountLabel = async (
    deps: Pick<AuthRepository, 'getProfilesCount'> = authRepository
): Promise<string> => {
    const count = await deps.getProfilesCount();
    if (count && count > 0) {
        return `${count}+`;
    }

    return DEFAULT_STUDENT_COUNT_LABEL;
};
