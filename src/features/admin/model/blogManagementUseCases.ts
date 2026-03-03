import type {
    CreateAdminBlogPostInput,
    UpdateAdminBlogPostInput
} from '@/server/repositories/adminBlogRepository';

export interface BlogFormData {
    title: string;
    content: string;
    published: boolean;
    image_url: string;
    category: string;
}

export const createEmptyBlogFormData = (): BlogFormData => ({
    title: '',
    content: '',
    published: false,
    image_url: '',
    category: ''
});

export const createBlogSlug = (title: string): string => {
    if (!title) {
        return '';
    }

    const turkishMap: Record<string, string> = {
        'ç': 'c',
        'Ç': 'c',
        'ğ': 'g',
        'Ğ': 'g',
        'ı': 'i',
        'İ': 'i',
        'ö': 'o',
        'Ö': 'o',
        'ş': 's',
        'Ş': 's',
        'ü': 'u',
        'Ü': 'u'
    };

    let result = title.trim();
    for (const [source, target] of Object.entries(turkishMap)) {
        result = result.split(source).join(target);
    }

    return result
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

export const shouldShowFixMarkdownAction = (content: string): boolean => {
    return Boolean(content && !content.includes('<p') && !content.includes('<div'));
};

export const toCreateBlogPostInput = (
    formData: BlogFormData,
    authorId: string
): CreateAdminBlogPostInput => {
    return {
        title: formData.title.trim(),
        content: formData.content,
        published: formData.published,
        author_id: authorId,
        slug: createBlogSlug(formData.title),
        image_url: formData.image_url.trim(),
        category: formData.category.trim()
    };
};

export const toUpdateBlogPostInput = (formData: BlogFormData): UpdateAdminBlogPostInput => {
    return {
        title: formData.title.trim(),
        content: formData.content,
        published: formData.published,
        slug: createBlogSlug(formData.title),
        image_url: formData.image_url.trim(),
        category: formData.category.trim(),
        updated_at: new Date().toISOString()
    };
};
