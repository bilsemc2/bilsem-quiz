import assert from 'node:assert/strict';
import test from 'node:test';
import {
    loadPublishedBlogPostBySlug,
    loadPublishedBlogPosts,
    subscribeNewsletterEmail
} from '../../../../src/features/content/model/blogUseCases.ts';

test('loadPublishedBlogPosts delegates to the repository', async () => {
    const posts = await loadPublishedBlogPosts({
        listPublishedPosts: async () => [
            {
                id: 'post-1',
                title: 'Bilsem Hazirlik',
                content: 'Icerik',
                published: true,
                created_at: '2026-03-12T10:00:00.000Z',
                updated_at: '2026-03-12T10:00:00.000Z',
                author_id: 'author-1',
                slug: 'bilsem-hazirlik',
                image_url: 'https://example.com/image.png',
                category: 'Egitim'
            }
        ]
    });

    assert.equal(posts.length, 1);
    assert.equal(posts[0].slug, 'bilsem-hazirlik');
});

test('loadPublishedBlogPostBySlug trims slug and returns null for blank input', async () => {
    let receivedSlug = '';

    const post = await loadPublishedBlogPostBySlug('  bilsem-yazi  ', {
        getPublishedPostBySlug: async (slug) => {
            receivedSlug = slug;
            return {
                id: 'post-2',
                title: 'Yazi',
                content: 'Icerik',
                published: true,
                created_at: '2026-03-12T11:00:00.000Z',
                updated_at: '2026-03-12T11:00:00.000Z',
                author_id: 'author-2',
                slug,
                image_url: undefined,
                category: undefined
            };
        }
    });

    assert.equal(receivedSlug, 'bilsem-yazi');
    assert.equal(post?.slug, 'bilsem-yazi');

    const blankPost = await loadPublishedBlogPostBySlug('   ', {
        getPublishedPostBySlug: async () => {
            throw new Error('Should not be called');
        }
    });

    assert.equal(blankPost, null);
});

test('subscribeNewsletterEmail trims email and maps duplicate subscriptions', async () => {
    let receivedEmail = '';

    const status = await subscribeNewsletterEmail('  veli@example.com  ', {
        subscribeToNewsletter: async (email) => {
            receivedEmail = email;
            return 'duplicate';
        }
    });

    assert.equal(receivedEmail, 'veli@example.com');
    assert.equal(status, 'duplicate');

    const invalid = await subscribeNewsletterEmail('   ', {
        subscribeToNewsletter: async () => 'created'
    });

    assert.equal(invalid, 'invalid');
});
