import { supabase } from '@/lib/supabase';

export interface BilsemInstitutionRecord {
    id: string;
    il_adi: string;
    ilce_adi: string;
    kurum_adi: string;
    kurum_tur_adi: string;
    adres: string;
    telefon_no: string;
    fax_no: string;
    web_adres: string;
    slug: string;
}

export interface BilsemRepository {
    listInstitutions: () => Promise<BilsemInstitutionRecord[]>;
    getInstitutionBySlug: (slug: string) => Promise<BilsemInstitutionRecord | null>;
}

const BILSEM_SELECT_FIELDS =
    'id, il_adi, ilce_adi, kurum_adi, kurum_tur_adi, adres, telefon_no, fax_no, web_adres, slug';

const listInstitutions = async (): Promise<BilsemInstitutionRecord[]> => {
    const { data, error } = await supabase
        .from('bilsem_kurumlari')
        .select(BILSEM_SELECT_FIELDS)
        .order('il_adi', { ascending: true });

    if (error || !data) {
        if (error) {
            console.error('bilsem institutions list failed:', error);
        }
        return [];
    }

    return data as BilsemInstitutionRecord[];
};

const getInstitutionBySlug = async (slug: string): Promise<BilsemInstitutionRecord | null> => {
    const { data, error } = await supabase
        .from('bilsem_kurumlari')
        .select(BILSEM_SELECT_FIELDS)
        .eq('slug', slug)
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error('bilsem institution fetch failed:', error);
        }
        return null;
    }

    return data as BilsemInstitutionRecord;
};

export const bilsemRepository: BilsemRepository = {
    listInstitutions,
    getInstitutionBySlug
};
