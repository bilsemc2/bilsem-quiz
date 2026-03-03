import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildPushNotificationInput,
    buildSubscriberLabel,
    isPushNotificationDraftValid
} from '../../../../src/features/admin/model/pushNotificationAdminUseCases.ts';

test('isPushNotificationDraftValid checks non-empty title and body', () => {
    assert.equal(
        isPushNotificationDraftValid({ title: 'Duyuru', body: 'Yeni oyun eklendi', url: '/' }),
        true
    );
    assert.equal(
        isPushNotificationDraftValid({ title: ' ', body: 'Yeni oyun eklendi', url: '/' }),
        false
    );
});

test('buildPushNotificationInput trims text and defaults url', () => {
    const input = buildPushNotificationInput({
        draft: { title: ' Başlık ', body: ' Mesaj ', url: ' ' },
        accessToken: 'token-1',
        supabaseUrl: 'https://example.supabase.co'
    });

    assert.equal(input.title, 'Başlık');
    assert.equal(input.body, 'Mesaj');
    assert.equal(input.url, '/');
    assert.equal(input.accessToken, 'token-1');
});

test('buildSubscriberLabel formats subscriber count fallback', () => {
    assert.equal(buildSubscriberLabel(12), 'Tüm Abonelere Gönder (12)');
    assert.equal(buildSubscriberLabel(null), 'Tüm Abonelere Gönder (0)');
});
