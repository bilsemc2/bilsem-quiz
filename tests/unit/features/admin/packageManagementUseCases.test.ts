import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createEmptyPackageFormData,
    toPackageMutationInput
} from '../../../../src/features/admin/model/packageManagementUseCases.ts';

test('createEmptyPackageFormData builds default form values', () => {
    const formData = createEmptyPackageFormData(7);

    assert.equal(formData.type, 'bundle');
    assert.equal(formData.sort_order, 7);
    assert.equal(formData.is_active, true);
    assert.deepEqual(formData.includes, []);
});

test('toPackageMutationInput maps conditional fields and feature lines', () => {
    const payload = toPackageMutationInput({
        slug: 'pro',
        name: 'Pro',
        description: '',
        price: 1000,
        price_renewal: 500,
        type: 'credit_based',
        initial_credits: 10,
        xp_required: 999,
        features: 'A\n\nB',
        includes: ['genel_yetenek'],
        payment_url: '',
        whatsapp_url: '',
        qr_code_url: '',
        is_recommended: false,
        is_active: true,
        sort_order: 1
    });

    assert.equal(payload.initial_credits, 10);
    assert.equal(payload.xp_required, null);
    assert.deepEqual(payload.features, ['A', 'B']);
    assert.equal(payload.description, null);
});
