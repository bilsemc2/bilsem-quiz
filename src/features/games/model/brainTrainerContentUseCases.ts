import {
    brainTrainerContentRepository,
    type BrainTrainerContentRepository,
    type KnowledgeCardRowRecord,
    type SentenceSynonymRowRecord,
    type SynonymRowRecord,
    type VerbalAnalogyRowRecord
} from '@/server/repositories/brainTrainerContentRepository';
import { loadAllPublicDeyimler } from '@/features/content/model/deyimUseCases';
import type { DeyimRecord } from '@/server/repositories/deyimRepository';

export interface BrainTrainerDeyimRow {
    id: number;
    deyim: string;
    aciklama: string;
    ornek: string | null;
}

export const loadSentenceSynonymRows = async (
    deps: Pick<BrainTrainerContentRepository, 'listSentenceSynonymRows'> = brainTrainerContentRepository
): Promise<SentenceSynonymRowRecord[]> => {
    return deps.listSentenceSynonymRows();
};

export const loadSynonymRows = async (
    deps: Pick<BrainTrainerContentRepository, 'listSynonymRows'> = brainTrainerContentRepository
): Promise<SynonymRowRecord[]> => {
    return deps.listSynonymRows();
};

export const loadKnowledgeCardRows = async (
    deps: Pick<BrainTrainerContentRepository, 'listKnowledgeCardRows'> = brainTrainerContentRepository
): Promise<KnowledgeCardRowRecord[]> => {
    return deps.listKnowledgeCardRows();
};

export const loadVerbalAnalogyRows = async (
    deps: Pick<BrainTrainerContentRepository, 'listVerbalAnalogyRows'> = brainTrainerContentRepository
): Promise<VerbalAnalogyRowRecord[]> => {
    return deps.listVerbalAnalogyRows();
};

export const loadBrainTrainerDeyimRows = async (
    deps: { loadAllPublicDeyimler: () => Promise<DeyimRecord[]> } = { loadAllPublicDeyimler }
): Promise<BrainTrainerDeyimRow[]> => {
    const rows = await deps.loadAllPublicDeyimler();
    return rows.map((row) => ({
        id: row.id,
        deyim: row.deyim,
        aciklama: row.aciklama,
        ornek: row.ornek
    }));
};
