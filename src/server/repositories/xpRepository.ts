import { supabase } from '@/lib/supabase';
import type { XPRequirement as XPRequirementEntity } from '@/types/xpRequirements';

interface XPRequirementPathRow {
    page_path: string;
    required_xp: number;
}

export interface XPPathRequirement {
    pagePath: string;
    requiredXP: number;
}

export interface XPRequirementMutationInput {
    page_path: string;
    required_xp: number;
    description?: string | null;
}

export type XPTransactionAction = 'gain' | 'deduct';

export interface XPTransactionPayload {
    action: XPTransactionAction;
    amount: number;
    reason?: string;
}

export type XPTransactionResult =
    | { success: true; newXP: number; change: number }
    | { success: false; status: number; error: string };

export interface XPRepository {
    getXPRequirementsForPaths: (pagePaths: string[]) => Promise<XPPathRequirement[]>;
    getXPRequirementForPath: (pagePath: string) => Promise<number>;
    listXPRequirements: () => Promise<XPRequirementEntity[]>;
    createXPRequirement: (input: XPRequirementMutationInput) => Promise<XPRequirementEntity>;
    updateXPRequirement: (requirementId: string, input: XPRequirementMutationInput) => Promise<void>;
    deleteXPRequirement: (requirementId: string) => Promise<void>;
    executeXPTransaction: (payload: XPTransactionPayload, accessToken: string) => Promise<XPTransactionResult>;
}

const getXPRequirementsForPaths = async (pagePaths: string[]): Promise<XPPathRequirement[]> => {
    if (pagePaths.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('xp_requirements')
        .select('page_path, required_xp')
        .in('page_path', pagePaths);

    if (error || !data) {
        if (error) {
            console.error('xp requirements fetch failed:', error);
        }
        return [];
    }

    return (data as XPRequirementPathRow[]).map((row) => ({
        pagePath: row.page_path,
        requiredXP: Number(row.required_xp) || 0
    }));
};

const getXPRequirementForPath = async (pagePath: string): Promise<number> => {
    const { data, error } = await supabase
        .from('xp_requirements')
        .select('required_xp')
        .eq('page_path', pagePath)
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error('xp requirement fetch failed:', error);
        }
        return 0;
    }

    return Number(data.required_xp) || 0;
};

const listXPRequirements = async (): Promise<XPRequirementEntity[]> => {
    const { data, error } = await supabase
        .from('xp_requirements')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('xp requirements list failed:', error);
        }
        return [];
    }

    return data as XPRequirementEntity[];
};

const createXPRequirement = async (
    input: XPRequirementMutationInput
): Promise<XPRequirementEntity> => {
    const { data, error } = await supabase
        .from('xp_requirements')
        .insert([{
            page_path: input.page_path,
            required_xp: input.required_xp,
            description: input.description ?? null
        }])
        .select()
        .single();

    if (error || !data) {
        throw error || new Error('XP gereksinimi eklenemedi');
    }

    return data as XPRequirementEntity;
};

const updateXPRequirement = async (
    requirementId: string,
    input: XPRequirementMutationInput
): Promise<void> => {
    const { error } = await supabase
        .from('xp_requirements')
        .update({
            page_path: input.page_path,
            required_xp: input.required_xp,
            description: input.description ?? null
        })
        .eq('id', requirementId);

    if (error) {
        throw error;
    }
};

const deleteXPRequirement = async (requirementId: string): Promise<void> => {
    const { error } = await supabase
        .from('xp_requirements')
        .delete()
        .eq('id', requirementId);

    if (error) {
        throw error;
    }
};

const executeXPTransaction = async (
    payload: XPTransactionPayload,
    accessToken: string
): Promise<XPTransactionResult> => {
    const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xp-transaction`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload)
        }
    );

    let responseBody: unknown = null;
    try {
        responseBody = await response.json();
    } catch {
        responseBody = null;
    }

    if (!response.ok) {
        const message =
            typeof responseBody === 'object' &&
            responseBody !== null &&
            'error' in responseBody &&
            typeof (responseBody as { error?: unknown }).error === 'string'
                ? (responseBody as { error: string }).error
                : 'XP işlemi tamamlanamadı';

        return {
            success: false,
            status: response.status,
            error: message
        };
    }

    const result = responseBody as { newXP?: number; change?: number };
    return {
        success: true,
        newXP: Number(result.newXP) || 0,
        change: Number(result.change) || 0
    };
};

export const xpRepository: XPRepository = {
    getXPRequirementsForPaths,
    getXPRequirementForPath,
    listXPRequirements,
    createXPRequirement,
    updateXPRequirement,
    deleteXPRequirement,
    executeXPTransaction
};
