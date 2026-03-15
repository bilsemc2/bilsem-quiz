import assert from 'node:assert/strict';
import test from 'node:test';
import {
    loadAllPublicDeyimler,
    loadPublicDeyimGallery,
    loadPublicDeyimList
} from '../../../../src/features/content/model/deyimUseCases.ts';

test('loadPublicDeyimList trims search term and normalizes invalid pagination', async () => {
    let capturedInput: {
        searchTerm?: string;
        page: number;
        pageSize: number;
        orderBy: 'id' | 'deyim';
    } | null = null;

    const result = await loadPublicDeyimList(
        {
            searchTerm: '  atasozu  ',
            page: 0,
            pageSize: Number.NaN
        },
        {
            listPublicDeyimler: async (input) => {
                capturedInput = input;
                return {
                    items: [
                        {
                            id: 1,
                            deyim: 'Damlaya damlaya gol olur',
                            aciklama: 'Aciklama',
                            ornek: null
                        }
                    ],
                    totalCount: 1
                };
            }
        }
    );

    assert.deepEqual(capturedInput, {
        searchTerm: 'atasozu',
        page: 1,
        pageSize: 1,
        orderBy: 'id',
        signal: undefined
    });
    assert.equal(result.totalCount, 1);
    assert.equal(result.deyimler[0].id, 1);
});

test('loadPublicDeyimGallery uses alphabetical ordering', async () => {
    let capturedOrderBy: 'id' | 'deyim' | null = null;

    await loadPublicDeyimGallery(
        {
            searchTerm: '',
            page: 2,
            pageSize: 20
        },
        {
            listPublicDeyimler: async (input) => {
                capturedOrderBy = input.orderBy;
                return {
                    items: [],
                    totalCount: 0
                };
            }
        }
    );

    assert.equal(capturedOrderBy, 'deyim');
});

test('loadAllPublicDeyimler delegates to repository', async () => {
    const deyimler = await loadAllPublicDeyimler({
        listAllPublicDeyimler: async () => [
            {
                id: 5,
                deyim: 'Agzi var dili yok',
                aciklama: 'Sessiz',
                ornek: null
            }
        ]
    });

    assert.equal(deyimler.length, 1);
    assert.equal(deyimler[0].deyim, 'Agzi var dili yok');
});
