import {
    deyimRepository,
    type DeyimRecord,
    type DeyimRepository
} from '@/server/repositories/deyimRepository';

export type PublicDeyim = DeyimRecord;

export interface LoadPublicDeyimPageInput {
    searchTerm?: string;
    page: number;
    pageSize: number;
    signal?: AbortSignal;
}

export interface LoadPublicDeyimPageResult {
    deyimler: PublicDeyim[];
    totalCount: number;
}

const normalizeSearchTerm = (searchTerm?: string): string => {
    return (searchTerm ?? '').trim();
};

const normalizePositiveInteger = (value: number, fallbackValue: number): number => {
    if (!Number.isFinite(value) || value < 1) {
        return fallbackValue;
    }

    return Math.floor(value);
};

export const loadPublicDeyimList = async (
    input: LoadPublicDeyimPageInput,
    deps: Pick<DeyimRepository, 'listPublicDeyimler'> = deyimRepository
): Promise<LoadPublicDeyimPageResult> => {
    const result = await deps.listPublicDeyimler({
        searchTerm: normalizeSearchTerm(input.searchTerm),
        page: normalizePositiveInteger(input.page, 1),
        pageSize: normalizePositiveInteger(input.pageSize, 1),
        orderBy: 'id',
        signal: input.signal
    });

    return {
        deyimler: result.items,
        totalCount: result.totalCount
    };
};

export const loadPublicDeyimGallery = async (
    input: LoadPublicDeyimPageInput,
    deps: Pick<DeyimRepository, 'listPublicDeyimler'> = deyimRepository
): Promise<LoadPublicDeyimPageResult> => {
    const result = await deps.listPublicDeyimler({
        searchTerm: normalizeSearchTerm(input.searchTerm),
        page: normalizePositiveInteger(input.page, 1),
        pageSize: normalizePositiveInteger(input.pageSize, 1),
        orderBy: 'deyim',
        signal: input.signal
    });

    return {
        deyimler: result.items,
        totalCount: result.totalCount
    };
};

export const loadAllPublicDeyimler = async (
    deps: Pick<DeyimRepository, 'listAllPublicDeyimler'> = deyimRepository
): Promise<PublicDeyim[]> => {
    return deps.listAllPublicDeyimler();
};
