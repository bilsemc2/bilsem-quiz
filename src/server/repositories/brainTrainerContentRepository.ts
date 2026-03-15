import { supabase } from '@/lib/supabase';

export interface SentenceSynonymRowRecord {
    id: number;
    cumle: string;
    secenek_a: string;
    secenek_b: string;
    secenek_c: string;
    secenek_d: string;
    dogru_cevap: string;
    dogru_kelime: string;
}

export interface SynonymRowRecord {
    id: number;
    kelime: string;
    secenek_a: string;
    secenek_b: string;
    secenek_c: string;
    secenek_d: string;
    dogru_cevap: string;
    es_anlami: string;
}

export interface KnowledgeCardRowRecord {
    id: string;
    icerik: string;
}

export interface VerbalAnalogyRowRecord {
    id: number;
    soru_metni: string;
    secenek_a: string | null;
    secenek_b: string | null;
    secenek_c: string | null;
    secenek_d: string | null;
    dogru_cevap: string | null;
    aciklama: string | null;
}

export interface BrainTrainerContentRepository {
    listSentenceSynonymRows: () => Promise<SentenceSynonymRowRecord[]>;
    listSynonymRows: () => Promise<SynonymRowRecord[]>;
    listKnowledgeCardRows: () => Promise<KnowledgeCardRowRecord[]>;
    listVerbalAnalogyRows: () => Promise<VerbalAnalogyRowRecord[]>;
}

const listSentenceSynonymRows = async (): Promise<SentenceSynonymRowRecord[]> => {
    const { data, error } = await supabase
        .from('cumle_ici_es_anlam_sorulari')
        .select('id, cumle, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, dogru_kelime')
        .limit(100);

    if (error || !data) {
        if (error) {
            console.error('sentence synonym rows fetch failed:', error);
        }
        return [];
    }

    return data as SentenceSynonymRowRecord[];
};

const listSynonymRows = async (): Promise<SynonymRowRecord[]> => {
    const { data, error } = await supabase
        .from('es_anlam_sorulari')
        .select('id, kelime, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, es_anlami')
        .limit(100);

    if (error || !data) {
        if (error) {
            console.error('synonym rows fetch failed:', error);
        }
        return [];
    }

    return data as SynonymRowRecord[];
};

const listKnowledgeCardRows = async (): Promise<KnowledgeCardRowRecord[]> => {
    const { data, error } = await supabase
        .from('bilgi_kartlari')
        .select('id, icerik')
        .eq('is_active', true)
        .limit(100);

    if (error || !data) {
        if (error) {
            console.error('knowledge card rows fetch failed:', error);
        }
        return [];
    }

    return data as KnowledgeCardRowRecord[];
};

const listVerbalAnalogyRows = async (): Promise<VerbalAnalogyRowRecord[]> => {
    const { data, error } = await supabase
        .from('analoji_sorulari')
        .select('id, soru_metni, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, aciklama')
        .limit(100);

    if (error || !data) {
        if (error) {
            console.error('verbal analogy rows fetch failed:', error);
        }
        return [];
    }

    return data as VerbalAnalogyRowRecord[];
};

export const brainTrainerContentRepository: BrainTrainerContentRepository = {
    listSentenceSynonymRows,
    listSynonymRows,
    listKnowledgeCardRows,
    listVerbalAnalogyRows
};
