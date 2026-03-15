import {
    bilsemRepository,
    type BilsemInstitutionRecord,
    type BilsemRepository
} from '@/server/repositories/bilsemRepository';

export type BilsemInstitution = BilsemInstitutionRecord;

const normalizeSlug = (slug: string): string => slug.trim();

export const loadBilsemInstitutions = async (
    deps: Pick<BilsemRepository, 'listInstitutions'> = bilsemRepository
): Promise<BilsemInstitution[]> => {
    return deps.listInstitutions();
};

export const loadBilsemInstitutionBySlug = async (
    slug: string,
    deps: Pick<BilsemRepository, 'getInstitutionBySlug'> = bilsemRepository
): Promise<BilsemInstitution | null> => {
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) {
        return null;
    }

    return deps.getInstitutionBySlug(normalizedSlug);
};
