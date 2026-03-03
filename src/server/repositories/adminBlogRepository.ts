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

export interface AdminBlogPost {
    id: string;
    title: string;
    content: string;
    published: boolean;
    created_at: string;
    updated_at: string;
    author_id: string;
    slug: string;
    image_url: string;
    category: string;
}

export interface CreateAdminBlogPostInput {
    title: string;
    content: string;
    published: boolean;
    author_id: string;
    slug: string;
    image_url: string;
    category: string;
}

export interface UpdateAdminBlogPostInput {
    title: string;
    content: string;
    published: boolean;
    slug: string;
    image_url: string;
    category: string;
    updated_at: string;
}

export interface AdminBlogRepository {
    listPosts: () => Promise<AdminBlogPost[]>;
    createPost: (input: CreateAdminBlogPostInput) => Promise<void>;
    updatePost: (postId: string, input: UpdateAdminBlogPostInput) => Promise<void>;
    updatePostContent: (postId: string, content: string, updatedAtISO: string) => Promise<void>;
    deletePost: (postId: string) => Promise<void>;
}

const mapBlogPostRow = (row: BlogPostRow): AdminBlogPost => {
    return {
        id: row.id,
        title: row.title,
        content: row.content,
        published: Boolean(row.published),
        created_at: row.created_at,
        updated_at: row.updated_at,
        author_id: row.author_id,
        slug: row.slug,
        image_url: row.image_url ?? '',
        category: row.category ?? ''
    };
};

const listPosts = async (): Promise<AdminBlogPost[]> => {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, published, created_at, updated_at, author_id, slug, image_url, category')
        .order('created_at', { ascending: false });

    if (error || !data) {
        throw error ?? new Error('Blog yazıları yüklenemedi');
    }

    return (data as BlogPostRow[]).map(mapBlogPostRow);
};

const createPost = async (input: CreateAdminBlogPostInput): Promise<void> => {
    const { error } = await supabase
        .from('blog_posts')
        .insert(input);

    if (error) {
        throw error;
    }
};

const updatePost = async (postId: string, input: UpdateAdminBlogPostInput): Promise<void> => {
    const { error } = await supabase
        .from('blog_posts')
        .update(input)
        .eq('id', postId);

    if (error) {
        throw error;
    }
};

const updatePostContent = async (postId: string, content: string, updatedAtISO: string): Promise<void> => {
    const { error } = await supabase
        .from('blog_posts')
        .update({
            content,
            updated_at: updatedAtISO
        })
        .eq('id', postId);

    if (error) {
        throw error;
    }
};

const deletePost = async (postId: string): Promise<void> => {
    const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

    if (error) {
        throw error;
    }
};

export const adminBlogRepository: AdminBlogRepository = {
    listPosts,
    createPost,
    updatePost,
    updatePostContent,
    deletePost
};
