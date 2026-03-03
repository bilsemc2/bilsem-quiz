export interface UserManagementFilters {
    name: string;
    email: string;
    grade: string;
    showOnlyVip: boolean;
    yetenek_alani: string;
}

export interface UserManagementUserLike {
    name?: string | null;
    email?: string | null;
    grade?: number | string | null;
    is_vip?: boolean | null;
    yetenek_alani?: unknown;
}

export const parseYetenekAlani = (value: unknown): string[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter((item): item is string => typeof item === 'string');
            }
        } catch {
            return [value];
        }

        return [value];
    }

    return [];
};

export const formatYetenekAlani = (value: string[]): string[] | null => {
    if (!value || value.length === 0) {
        return null;
    }

    return value;
};

const toLower = (value: string | null | undefined): string => {
    if (!value) {
        return '';
    }

    return value.toLocaleLowerCase('tr-TR');
};

const toGradeNumber = (value: number | string | null | undefined): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim()) {
        const asNumber = Number(value);
        return Number.isFinite(asNumber) ? asNumber : null;
    }

    return null;
};

export const filterAdminUsers = <T extends UserManagementUserLike>(
    users: T[],
    filters: UserManagementFilters
): T[] => {
    const nameFilter = filters.name.trim().toLocaleLowerCase('tr-TR');
    const emailFilter = filters.email.trim().toLocaleLowerCase('tr-TR');
    const gradeFilter = filters.grade.trim() ? Number(filters.grade.trim()) : null;
    const talentFilter = filters.yetenek_alani.trim();

    return users.filter((user) => {
        if (nameFilter && !toLower(user.name).includes(nameFilter)) {
            return false;
        }

        if (emailFilter && !toLower(user.email).includes(emailFilter)) {
            return false;
        }

        if (gradeFilter !== null) {
            const userGrade = toGradeNumber(user.grade);
            if (userGrade !== gradeFilter) {
                return false;
            }
        }

        if (filters.showOnlyVip && !user.is_vip) {
            return false;
        }

        if (talentFilter) {
            const talents = parseYetenekAlani(user.yetenek_alani);
            if (!talents.includes(talentFilter)) {
                return false;
            }
        }

        return true;
    });
};
