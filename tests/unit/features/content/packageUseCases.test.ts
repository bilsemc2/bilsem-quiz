import assert from 'node:assert/strict';
import test from 'node:test';
import {
    filterPackagesByIncludes,
    loadActivePackages
} from '../../../../src/features/content/model/packageUseCases.ts';

test('loadActivePackages returns active packages from the repository', async () => {
    const packages = await loadActivePackages({
        listActivePackages: async () => [
            {
                id: 'pkg-1',
                slug: 'vip',
                name: 'VIP',
                description: 'Aciklama',
                price: 1200,
                price_renewal: null,
                type: 'bundle',
                initial_credits: null,
                xp_required: null,
                features: ['A'],
                includes: ['atolye'],
                payment_url: null,
                whatsapp_url: null,
                qr_code_url: null,
                is_recommended: true,
                is_active: true,
                sort_order: 1
            }
        ]
    });

    assert.equal(packages.length, 1);
    assert.equal(packages[0].slug, 'vip');
    assert.equal(packages[0].is_active, true);
});

test('filterPackagesByIncludes returns only packages matching the required includes', () => {
    const filtered = filterPackagesByIncludes(
        [
            {
                id: 'pkg-1',
                slug: 'genel',
                name: 'Genel',
                description: null,
                price: 100,
                price_renewal: null,
                type: 'bundle',
                initial_credits: null,
                xp_required: null,
                features: [],
                includes: ['genel_yetenek'],
                payment_url: null,
                whatsapp_url: null,
                qr_code_url: null,
                is_recommended: false,
                is_active: true,
                sort_order: 1
            },
            {
                id: 'pkg-2',
                slug: 'muzik',
                name: 'Muzik',
                description: null,
                price: 200,
                price_renewal: null,
                type: 'bundle',
                initial_credits: null,
                xp_required: null,
                features: [],
                includes: ['muzik'],
                payment_url: null,
                whatsapp_url: null,
                qr_code_url: null,
                is_recommended: false,
                is_active: true,
                sort_order: 2
            }
        ],
        ['muzik']
    );

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].slug, 'muzik');
});
