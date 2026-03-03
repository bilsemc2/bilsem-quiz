import { supabase } from '@/lib/supabase';
import type { Package } from '@/types/package';

export interface UpsertPackageInput {
    slug: string;
    name: string;
    description: string | null;
    price: number;
    price_renewal: number | null;
    type: Package['type'];
    initial_credits: number | null;
    xp_required: number | null;
    features: string[];
    includes: string[];
    payment_url: string | null;
    whatsapp_url: string | null;
    qr_code_url: string | null;
    is_recommended: boolean;
    is_active: boolean;
    sort_order: number;
}

interface PackageRow {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    price: number | null;
    price_renewal: number | null;
    type: Package['type'];
    initial_credits: number | null;
    xp_required: number | null;
    features: unknown;
    includes: unknown;
    payment_url: string | null;
    whatsapp_url: string | null;
    qr_code_url: string | null;
    is_recommended: boolean | null;
    is_active: boolean | null;
    sort_order: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface AdminPackageRepository {
    listPackages: () => Promise<Package[]>;
    listActivePackages: () => Promise<Package[]>;
    createPackage: (input: UpsertPackageInput) => Promise<void>;
    updatePackage: (packageId: string, input: UpsertPackageInput) => Promise<void>;
    deletePackage: (packageId: string) => Promise<void>;
}

const normalizeStringArray = (value: unknown): string[] => {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter((item): item is string => typeof item === 'string');
            }
        } catch {
            return [];
        }
    }

    return [];
};

const mapPackageRow = (row: PackageRow): Package => {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        price: Number(row.price) || 0,
        price_renewal: row.price_renewal !== null ? Number(row.price_renewal) : null,
        type: row.type,
        initial_credits: row.initial_credits !== null ? Number(row.initial_credits) : null,
        xp_required: row.xp_required !== null ? Number(row.xp_required) : null,
        features: normalizeStringArray(row.features),
        includes: normalizeStringArray(row.includes),
        payment_url: row.payment_url,
        whatsapp_url: row.whatsapp_url,
        qr_code_url: row.qr_code_url,
        is_recommended: Boolean(row.is_recommended),
        is_active: Boolean(row.is_active),
        sort_order: Number(row.sort_order) || 0,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
};

const listPackages = async (): Promise<Package[]> => {
    const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error || !data) {
        if (error) {
            console.error('admin packages fetch failed:', error);
        }
        return [];
    }

    return (data as PackageRow[]).map(mapPackageRow);
};

const listActivePackages = async (): Promise<Package[]> => {
    const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error || !data) {
        if (error) {
            console.error('active packages fetch failed:', error);
        }
        return [];
    }

    return (data as PackageRow[]).map(mapPackageRow);
};

const createPackage = async (input: UpsertPackageInput): Promise<void> => {
    const { error } = await supabase
        .from('packages')
        .insert(input);

    if (error) {
        throw error;
    }
};

const updatePackage = async (packageId: string, input: UpsertPackageInput): Promise<void> => {
    const { error } = await supabase
        .from('packages')
        .update(input)
        .eq('id', packageId);

    if (error) {
        throw error;
    }
};

const deletePackage = async (packageId: string): Promise<void> => {
    const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', packageId);

    if (error) {
        throw error;
    }
};

export const adminPackageRepository: AdminPackageRepository = {
    listPackages,
    listActivePackages,
    createPackage,
    updatePackage,
    deletePackage
};
