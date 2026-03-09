import type { GuardOptions } from './guardTypes';

export const shouldSkipXPCheck = (
    options: Pick<GuardOptions, 'skipXPCheck'>,
    isArcadeMode: boolean
) => Boolean(options.skipXPCheck || isArcadeMode);

export const formatUserTalent = (userTalent: string | string[] | null): string => {
    if (Array.isArray(userTalent) && userTalent.length > 0) {
        return userTalent.join(', ');
    }

    if (typeof userTalent === 'string' && userTalent.trim().length > 0) {
        return userTalent;
    }

    return 'Belirtilmemiş';
};

export const getRoleDeniedCopy = (
    options: Pick<GuardOptions, 'requireAdmin' | 'requireTeacher'>
) => {
    if (options.requireAdmin || options.requireTeacher) {
        return {
            title: 'Bu Sayfa için Yetkiniz Yok',
            description: 'Bu içeriğe erişmek için öğretmen veya yönetici yetkisi gerekiyor.'
        };
    }

    return {
        title: 'Bu Sayfa için Yetkiniz Yok',
        description: 'Bu içeriğe erişmek için gerekli rol sizde bulunmuyor.'
    };
};

export const getTalentDeniedCopy = (
    requiredTalent: string | undefined,
    userTalent: string | string[] | null
) => ({
    title: 'Bu Bölüm Profilinize Uygun Değil',
    description: `Bu bölüm sadece yetenek alanı ${requiredTalent || 'tanımlı'} olan öğrenciler içindir.`,
    userTalent: formatUserTalent(userTalent)
});
