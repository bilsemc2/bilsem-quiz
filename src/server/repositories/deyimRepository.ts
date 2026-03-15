import { supabase } from '@/lib/supabase';

export interface DeyimRecord {
    id: number;
    deyim: string;
    aciklama: string;
    ornek: string | null;
    child_safe?: boolean;
    image_filename?: string | null;
}

export interface PaginatedPublicDeyimInput {
    searchTerm?: string;
    page: number;
    pageSize: number;
    orderBy: 'id' | 'deyim';
    signal?: AbortSignal;
}

export interface PaginatedPublicDeyimResult {
    items: DeyimRecord[];
    totalCount: number;
}

export interface DeyimRepository {
    listPublicDeyimler: (input: PaginatedPublicDeyimInput) => Promise<PaginatedPublicDeyimResult>;
    listAllPublicDeyimler: () => Promise<DeyimRecord[]>;
}

const DEYIM_SELECT_FIELDS = 'id, deyim, aciklama, ornek, child_safe, image_filename';

const listPublicDeyimler = async (
    input: PaginatedPublicDeyimInput
): Promise<PaginatedPublicDeyimResult> => {
    let query = supabase
        .from('deyimler')
        .select(DEYIM_SELECT_FIELDS, { count: 'exact' })
        .eq('child_safe', true);

    if (input.searchTerm) {
        query = query.ilike('deyim', `%${input.searchTerm}%`);
    }

    if (input.signal) {
        query = query.abortSignal(input.signal);
    }

    const from = (input.page - 1) * input.pageSize;
    const to = from + input.pageSize - 1;

    const { data, count, error } = await query
        .order(input.orderBy, { ascending: true })
        .range(from, to);

    if (error || !data) {
        if (error) {
            console.error('public deyimler fetch failed:', error);
        }
        return { items: [], totalCount: 0 };
    }

    return {
        items: data as DeyimRecord[],
        totalCount: count ?? 0
    };
};

const listAllPublicDeyimler = async (): Promise<DeyimRecord[]> => {
    const { data, error } = await supabase
        .from('deyimler')
        .select(DEYIM_SELECT_FIELDS)
        .eq('child_safe', true);

    if (error || !data) {
        if (error) {
            console.error('all public deyimler fetch failed:', error);
        }
        return [];
    }

    return data as DeyimRecord[];
};

export const deyimRepository: DeyimRepository = {
    listPublicDeyimler,
    listAllPublicDeyimler
};
