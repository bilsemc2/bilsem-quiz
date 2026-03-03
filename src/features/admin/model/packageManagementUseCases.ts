import type { UpsertPackageInput } from '@/server/repositories/adminPackageRepository';
import type { Package } from '@/types/package';

export interface PackageFormData {
    slug: string;
    name: string;
    description: string;
    price: number;
    price_renewal: number;
    type: Package['type'];
    initial_credits: number;
    xp_required: number;
    features: string;
    includes: string[];
    payment_url: string;
    whatsapp_url: string;
    qr_code_url: string;
    is_recommended: boolean;
    is_active: boolean;
    sort_order: number;
}

export const createEmptyPackageFormData = (sortOrder: number): PackageFormData => {
    return {
        slug: '',
        name: '',
        description: '',
        price: 0,
        price_renewal: 0,
        type: 'bundle',
        initial_credits: 0,
        xp_required: 0,
        features: '',
        includes: [],
        payment_url: '',
        whatsapp_url: '',
        qr_code_url: '',
        is_recommended: false,
        is_active: true,
        sort_order: sortOrder
    };
};

export const toPackageFormData = (pkg: Package): PackageFormData => {
    return {
        slug: pkg.slug,
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price,
        price_renewal: pkg.price_renewal || 0,
        type: pkg.type,
        initial_credits: pkg.initial_credits || 0,
        xp_required: pkg.xp_required || 0,
        features: pkg.features.join('\n'),
        includes: pkg.includes,
        payment_url: pkg.payment_url || '',
        whatsapp_url: pkg.whatsapp_url || '',
        qr_code_url: pkg.qr_code_url || '',
        is_recommended: pkg.is_recommended,
        is_active: pkg.is_active,
        sort_order: pkg.sort_order
    };
};

export const toPackageMutationInput = (
    formData: PackageFormData
): UpsertPackageInput => {
    const featuresArray = formData.features
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean);

    return {
        slug: formData.slug,
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        price_renewal: formData.price_renewal || null,
        type: formData.type,
        initial_credits: formData.type === 'credit_based' ? formData.initial_credits : null,
        xp_required: formData.type === 'xp_based' ? formData.xp_required : null,
        features: featuresArray,
        includes: formData.includes,
        payment_url: formData.payment_url || null,
        whatsapp_url: formData.whatsapp_url || null,
        qr_code_url: formData.qr_code_url || null,
        is_recommended: formData.is_recommended,
        is_active: formData.is_active,
        sort_order: formData.sort_order
    };
};
