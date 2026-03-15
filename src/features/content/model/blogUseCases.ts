import {
    blogRepository,
    type BlogRepository,
    type PublicBlogPost
} from '@/server/repositories/blogRepository';

export type BlogPost = PublicBlogPost;

export type NewsletterSubscriptionStatus = 'success' | 'duplicate' | 'invalid';

const normalizeSlug = (slug: string): string => {
    return slug.trim();
};

const normalizeEmail = (email: string): string => {
    return email.trim();
};

export const loadPublishedBlogPosts = async (
    deps: Pick<BlogRepository, 'listPublishedPosts'> = blogRepository
): Promise<BlogPost[]> => {
    return deps.listPublishedPosts();
};

export const loadPublishedBlogPostBySlug = async (
    slug: string,
    deps: Pick<BlogRepository, 'getPublishedPostBySlug'> = blogRepository
): Promise<BlogPost | null> => {
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) {
        return null;
    }

    return deps.getPublishedPostBySlug(normalizedSlug);
};

export const subscribeNewsletterEmail = async (
    email: string,
    deps: Pick<BlogRepository, 'subscribeToNewsletter'> = blogRepository
): Promise<NewsletterSubscriptionStatus> => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return 'invalid';
    }

    const result = await deps.subscribeToNewsletter(normalizedEmail);
    return result === 'duplicate' ? 'duplicate' : 'success';
};
