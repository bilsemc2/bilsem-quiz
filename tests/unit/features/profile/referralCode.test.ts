import assert from 'node:assert/strict';
import test from 'node:test';
import { generateReferralCode } from '../../../../src/features/profile/model/referralCode.ts';

test('generateReferralCode returns uppercase alpha numeric code', () => {
    const code = generateReferralCode(() => 0.123456789, 6);

    assert.equal(code.length, 6);
    assert.match(code, /^[A-Z0-9]{6}$/);
});

test('generateReferralCode supports custom lengths', () => {
    const code = generateReferralCode(() => 0.42, 10);

    assert.equal(code.length, 10);
    assert.match(code, /^[A-Z0-9]{10}$/);
});
