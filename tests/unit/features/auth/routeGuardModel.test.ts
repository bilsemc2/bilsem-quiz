import assert from 'node:assert/strict';
import test from 'node:test';
import {
    formatUserTalent,
    getRoleDeniedCopy,
    getTalentDeniedCopy,
    shouldSkipXPCheck
} from '../../../../src/components/guards/routeGuardModel.ts';

test('shouldSkipXPCheck respects explicit skip option', () => {
    assert.equal(shouldSkipXPCheck({ skipXPCheck: true }, false), true);
});

test('shouldSkipXPCheck enables XP bypass in arcade mode', () => {
    assert.equal(shouldSkipXPCheck({ skipXPCheck: false }, true), true);
});

test('formatUserTalent joins arrays and handles empty values', () => {
    assert.equal(formatUserTalent(['Müzik', 'Resim']), 'Müzik, Resim');
    assert.equal(formatUserTalent(null), 'Belirtilmemiş');
});

test('getRoleDeniedCopy uses privileged copy for restricted routes', () => {
    const copy = getRoleDeniedCopy({ requireAdmin: true, requireTeacher: false });

    assert.equal(copy.title, 'Bu Sayfa için Yetkiniz Yok');
    assert.match(copy.description, /öğretmen veya yönetici/);
});

test('getTalentDeniedCopy formats current user talent', () => {
    const copy = getTalentDeniedCopy('Müzik', ['Resim', 'Genel Yetenek']);

    assert.equal(copy.title, 'Bu Bölüm Profilinize Uygun Değil');
    assert.match(copy.description, /Müzik/);
    assert.equal(copy.userTalent, 'Resim, Genel Yetenek');
});
