import assert from 'node:assert/strict';
import test from 'node:test';
import {
    loadBrainTrainerDeyimRows,
    loadKnowledgeCardRows,
    loadSentenceSynonymRows,
    loadSynonymRows,
    loadVerbalAnalogyRows
} from '../../../../src/features/games/model/brainTrainerContentUseCases.ts';

test('loadSentenceSynonymRows delegates to the repository', async () => {
    const rows = await loadSentenceSynonymRows({
        listSentenceSynonymRows: async () => [
            {
                id: 1,
                cumle: 'Cumle',
                secenek_a: 'A',
                secenek_b: 'B',
                secenek_c: 'C',
                secenek_d: 'D',
                dogru_cevap: 'a',
                dogru_kelime: 'Kelime'
            }
        ]
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].dogru_kelime, 'Kelime');
});

test('loadSynonymRows delegates to the repository', async () => {
    const rows = await loadSynonymRows({
        listSynonymRows: async () => [
            {
                id: 2,
                kelime: 'Hizli',
                secenek_a: 'Seri',
                secenek_b: 'Yavas',
                secenek_c: 'Durgun',
                secenek_d: 'Agir',
                dogru_cevap: 'a',
                es_anlami: 'Seri'
            }
        ]
    });

    assert.equal(rows[0].kelime, 'Hizli');
});

test('loadKnowledgeCardRows and loadVerbalAnalogyRows delegate to the repository', async () => {
    const knowledgeRows = await loadKnowledgeCardRows({
        listKnowledgeCardRows: async () => [
            {
                id: 'card-1',
                icerik: 'Bilgi karti'
            }
        ]
    });

    const analogyRows = await loadVerbalAnalogyRows({
        listVerbalAnalogyRows: async () => [
            {
                id: 3,
                soru_metni: 'Kalem : Yazmak',
                secenek_a: 'Kitap',
                secenek_b: 'Okumak',
                secenek_c: null,
                secenek_d: null,
                dogru_cevap: 'b',
                aciklama: null
            }
        ]
    });

    assert.equal(knowledgeRows[0].icerik, 'Bilgi karti');
    assert.equal(analogyRows[0].soru_metni, 'Kalem : Yazmak');
});

test('loadBrainTrainerDeyimRows normalizes public deyimler into brain trainer rows', async () => {
    const rows = await loadBrainTrainerDeyimRows({
        loadAllPublicDeyimler: async () => [
            {
                id: 4,
                deyim: 'etekleri zil calmak',
                aciklama: 'cok sevinmek',
                ornek: 'Ornek',
                child_safe: true,
                image_filename: null
            }
        ]
    });

    assert.deepEqual(rows, [
        {
            id: 4,
            deyim: 'etekleri zil calmak',
            aciklama: 'cok sevinmek',
            ornek: 'Ornek'
        }
    ]);
});
