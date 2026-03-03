export interface QuizizzCodeItem {
    id: string;
    code: string;
    subject: string;
    grade: string;
    scheduled_time: string;
    is_active: boolean;
}

export interface QuizizzProfileData {
    grade?: string | number | null;
    is_vip?: boolean;
}

export interface QuizizzUseCaseDeps {
    getProfileByUserId: (userId: string) => Promise<QuizizzProfileData | null>;
    listActiveCodesByGrade: (grade: string) => Promise<QuizizzCodeItem[]>;
    listCompletedCodeIds: (userId: string) => Promise<string[]>;
    markCodeCompleted: (userId: string, codeId: string) => Promise<void>;
    unmarkCodeCompleted: (userId: string, codeId: string) => Promise<void>;
}

export interface QuizizzDashboardData {
    userGrade: string | null;
    isVip: boolean;
    codes: QuizizzCodeItem[];
    completedCodeIds: string[];
}

export interface ToggleQuizizzCompletionResult {
    changed: boolean;
    isCompleted: boolean;
}

const normalizeGrade = (grade: string | number | null | undefined): string | null => {
    if (typeof grade === 'number' && Number.isFinite(grade)) {
        return String(Math.round(grade));
    }

    if (typeof grade === 'string') {
        const trimmed = grade.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    return null;
};

const uniqueStringList = (values: string[]): string[] => {
    const unique = new Set(values.map((value) => value.trim()).filter(Boolean));
    return Array.from(unique);
};

export const loadQuizizzDashboardData = async (
    userId: string,
    deps: QuizizzUseCaseDeps
): Promise<QuizizzDashboardData> => {
    const profile = await deps.getProfileByUserId(userId);
    const userGrade = normalizeGrade(profile?.grade);
    const isVip = Boolean(profile?.is_vip);

    if (!profile || !userGrade) {
        return {
            userGrade,
            isVip,
            codes: [],
            completedCodeIds: []
        };
    }

    const [codes, completedCodeIds] = await Promise.all([
        deps.listActiveCodesByGrade(userGrade),
        deps.listCompletedCodeIds(userId)
    ]);

    return {
        userGrade,
        isVip,
        codes,
        completedCodeIds: uniqueStringList(completedCodeIds)
    };
};

export const toggleQuizizzCompletion = async (
    input: {
        userId: string;
        codeId: string;
        isVip: boolean;
        isCompleted: boolean;
    },
    deps: Pick<QuizizzUseCaseDeps, 'markCodeCompleted' | 'unmarkCodeCompleted'>
): Promise<ToggleQuizizzCompletionResult> => {
    if (!input.isVip) {
        return {
            changed: false,
            isCompleted: input.isCompleted
        };
    }

    if (input.isCompleted) {
        await deps.unmarkCodeCompleted(input.userId, input.codeId);
        return {
            changed: true,
            isCompleted: false
        };
    }

    await deps.markCodeCompleted(input.userId, input.codeId);
    return {
        changed: true,
        isCompleted: true
    };
};
