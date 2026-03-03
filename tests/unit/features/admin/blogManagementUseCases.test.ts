import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createBlogSlug,
    createEmptyBlogFormData,
    shouldShowFixMarkdownAction,
    toCreateBlogPostInput,
    toUpdateBlogPostInput
} from '../../../../src/features/admin/model/blogManagementUseCases.ts';

test('createEmptyBlogFormData returns clean defaults', () => {
    assert.deepEqual(createEmptyBlogFormData(), {
        title: '',
        content: '',
        published: false,
        image_url: '',
        category: ''
    });
});

test('createBlogSlug normalizes Turkish chars and spaces', () => {
    assert.equal(createBlogSlug('Çocuklar İçin Zekâ Oyunu!'), 'cocuklar-icin-zeka-oyunu');
});

test('shouldShowFixMarkdownAction detects non-html content', () => {
    assert.equal(shouldShowFixMarkdownAction('Düz metin içerik'), true);
    assert.equal(shouldShowFixMarkdownAction('<p>HTML içerik</p>'), false);
});

test('toCreateBlogPostInput trims fields and generates slug', () => {
    const payload = toCreateBlogPostInput({
        title: '  Yeni Yazı  ',
        content: 'İçerik',
        published: true,
        image_url: ' https://image ',
        category: '  Eğitim '
    }, 'user-1');

    assert.equal(payload.title, 'Yeni Yazı');
    assert.equal(payload.slug, 'yeni-yazi');
    assert.equal(payload.author_id, 'user-1');
    assert.equal(payload.image_url, 'https://image');
    assert.equal(payload.category, 'Eğitim');
});

test('toUpdateBlogPostInput builds updated_at and slug', () => {
    const payload = toUpdateBlogPostInput({
        title: 'Başlık',
        content: 'İçerik',
        published: false,
        image_url: '',
        category: ''
    });

    assert.equal(payload.slug, 'baslik');
    assert.equal(typeof payload.updated_at, 'string');
});
