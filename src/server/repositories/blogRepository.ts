import { supabase } from '@/lib/supabase';

interface BlogPostRow {
    id: string;
    title: string;
    content: string;
    published: boolean | null;
    created_at: string;
    updated_at: string;
    author_id: string;
    slug: string;
    image_url: string | null;
    category: string | null;
}

export interface PublicBlogPost {
    id: string;
    title: string;
    content: string;
    published: boolean;
    created_at: string;
    updated_at: string;
    author_id: string;
    slug: string;
    image_url?: string;
    category?: string;
}

export type NewsletterSubscriptionResult = 'created' | 'duplicate';

export interface BlogRepository {
    listPublishedPosts: () => Promise<PublicBlogPost[]>;
    getPublishedPostBySlug: (slug: string) => Promise<PublicBlogPost | null>;
    subscribeToNewsletter: (email: string) => Promise<NewsletterSubscriptionResult>;
}

const mapBlogPostRow = (row: BlogPostRow): PublicBlogPost => {
    return {
        id: row.id,
        title: row.title,
        content: row.content,
        published: Boolean(row.published),
        created_at: row.created_at,
        updated_at: row.updated_at,
        author_id: row.author_id,
        slug: row.slug,
        image_url: row.image_url ?? undefined,
        category: row.category ?? undefined
    };
};

const isDuplicateSubscriptionError = (error: unknown): boolean => {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
};

const listPublishedPosts = async (): Promise<PublicBlogPost[]> => {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, published, created_at, updated_at, author_id, slug, image_url, category')
        .eq('published', true)
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('published blog posts fetch failed:', error);
        }
        return [];
    }

    return (data as BlogPostRow[]).map(mapBlogPostRow);
};

const getPublishedPostBySlug = async (slug: string): Promise<PublicBlogPost | null> => {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, published, created_at, updated_at, author_id, slug, image_url, category')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error('published blog post fetch failed:', error);
        }
        return null;
    }

    return mapBlogPostRow(data as BlogPostRow);
};

const subscribeToNewsletter = async (email: string): Promise<NewsletterSubscriptionResult> => {
    const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email }]);

    if (!error) {
        return 'created';
    }

    if (isDuplicateSubscriptionError(error)) {
        return 'duplicate';
    }

    throw error;
};

export const blogRepository: BlogRepository = {
    listPublishedPosts,
    getPublishedPostBySlug,
    subscribeToNewsletter
};
