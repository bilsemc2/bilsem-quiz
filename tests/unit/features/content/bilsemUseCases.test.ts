import assert from 'node:assert/strict';
import test from 'node:test';
import {
    loadBilsemInstitutionBySlug,
    loadBilsemInstitutions
} from '../../../../src/features/content/model/bilsemUseCases.ts';

test('loadBilsemInstitutions returns repository items as-is', async () => {
    const institutions = await loadBilsemInstitutions({
        listInstitutions: async () => [
            {
                id: '1',
                il_adi: 'Ankara',
                ilce_adi: 'Cankaya',
                kurum_adi: 'Ankara Bilsem',
                kurum_tur_adi: 'Bilim ve Sanat Merkezi',
                adres: 'Adres',
                telefon_no: '0312',
                fax_no: '',
                web_adres: 'ornek.com',
                slug: 'ankara-bilsem'
            }
        ]
    });

    assert.equal(institutions.length, 1);
    assert.equal(institutions[0].slug, 'ankara-bilsem');
});

test('loadBilsemInstitutionBySlug trims slug before querying', async () => {
    let receivedSlug = '';

    const institution = await loadBilsemInstitutionBySlug('  izmir-bilsem  ', {
        getInstitutionBySlug: async (slug) => {
            receivedSlug = slug;
            return {
                id: '2',
                il_adi: 'Izmir',
                ilce_adi: 'Konak',
                kurum_adi: 'Izmir Bilsem',
                kurum_tur_adi: 'Bilim ve Sanat Merkezi',
                adres: 'Adres',
                telefon_no: '0232',
                fax_no: '',
                web_adres: '',
                slug
            };
        }
    });

    assert.equal(receivedSlug, 'izmir-bilsem');
    assert.equal(institution?.slug, 'izmir-bilsem');
});

test('loadBilsemInstitutionBySlug returns null for blank input', async () => {
    const institution = await loadBilsemInstitutionBySlug('   ', {
        getInstitutionBySlug: async () => {
            throw new Error('Should not be called');
        }
    });

    assert.equal(institution, null);
});
