import { supabase } from '@/lib/supabase';

export interface GridCell {
    type?: string;
    id?: string;
    svg?: {
        props?: {
            children?: {
                props?: {
                    src?: string;
                    [key: string]: unknown;
                };
                [key: string]: unknown;
            };
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export type PuzzleGrid = Array<Array<GridCell | null>>;

export interface PuzzleData {
    id: string;
    title: string;
    grid: PuzzleGrid;
    created_at: string;
    created_by: string;
    approved: boolean;
}

export interface CreatePuzzleInput {
    grid?: PuzzleGrid;
    title?: string;
    createdBy: string;
    approved: boolean;
}

export interface PuzzleRepository {
    createPuzzle: (input: CreatePuzzleInput) => Promise<PuzzleData[]>;
    listRecentApprovedPuzzles: (limit?: number) => Promise<PuzzleData[]>;
    subscribeToPuzzleInserts: (callback: (puzzle: PuzzleData) => void) => () => void;
    listApprovedPuzzles: () => Promise<PuzzleData[]>;
    listAllPuzzles: () => Promise<PuzzleData[]>;
    listPuzzlesByCreator: (userId: string) => Promise<PuzzleData[]>;
    getPuzzleById: (id: string) => Promise<PuzzleData>;
    updatePuzzleByOwner: (
        id: string,
        userId: string,
        puzzleData: Partial<PuzzleData>
    ) => Promise<PuzzleData | null>;
    updatePuzzleApproval: (id: string, approved: boolean) => Promise<void>;
    deletePuzzleById: (id: string) => Promise<void>;
    deletePuzzleByOwner: (id: string, userId: string) => Promise<void>;
    listPuzzleGrids: () => Promise<Array<Pick<PuzzleData, 'id' | 'grid'>>>;
    updatePuzzleGrid: (id: string, grid: PuzzleGrid) => Promise<void>;
}

const RECENT_PUZZLE_CACHE_TIME_MS = 5 * 60 * 1000;

let recentPuzzleCache: {
    data: PuzzleData[];
    timestamp: number;
} | null = null;

const invalidateRecentPuzzleCache = () => {
    recentPuzzleCache = null;
};

const createPuzzle = async (input: CreatePuzzleInput): Promise<PuzzleData[]> => {
    const { data, error } = await supabase
        .from('puzzles')
        .insert([{
            grid: input.grid,
            title: input.title,
            created_by: input.createdBy,
            approved: input.approved
        }])
        .select('id, title, grid, created_at, created_by, approved');

    if (error) {
        throw error;
    }

    invalidateRecentPuzzleCache();
    return (data ?? []) as PuzzleData[];
};

const listRecentApprovedPuzzles = async (limit = 6): Promise<PuzzleData[]> => {
    if (recentPuzzleCache && Date.now() - recentPuzzleCache.timestamp < RECENT_PUZZLE_CACHE_TIME_MS) {
        return recentPuzzleCache.data;
    }

    const { data, error } = await supabase
        .from('puzzles')
        .select('id, grid, created_at, title, created_by, approved')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !data) {
        if (error) {
            console.error('recent approved puzzles fetch failed:', error);
        }
        return [];
    }

    recentPuzzleCache = {
        data: data as PuzzleData[],
        timestamp: Date.now()
    };

    return recentPuzzleCache.data;
};

const subscribeToPuzzleInserts = (callback: (puzzle: PuzzleData) => void) => {
    const channel = supabase
        .channel('public:puzzles')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'puzzles' },
            (payload: { new: PuzzleData }) => {
                if (!payload.new.approved) {
                    return;
                }

                invalidateRecentPuzzleCache();
                callback(payload.new);
            }
        )
        .subscribe();

    return () => {
        void channel.unsubscribe();
    };
};

const listApprovedPuzzles = async (): Promise<PuzzleData[]> => {
    const { data, error } = await supabase
        .from('puzzles')
        .select('id, title, grid, created_at, created_by, approved')
        .eq('approved', true)
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('approved puzzles fetch failed:', error);
        }
        return [];
    }

    return data as PuzzleData[];
};

const listAllPuzzles = async (): Promise<PuzzleData[]> => {
    const { data, error } = await supabase
        .from('puzzles')
        .select('id, title, grid, created_at, created_by, approved')
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('all puzzles fetch failed:', error);
        }
        return [];
    }

    return data as PuzzleData[];
};

const listPuzzlesByCreator = async (userId: string): Promise<PuzzleData[]> => {
    const { data, error } = await supabase
        .from('puzzles')
        .select('id, title, grid, created_at, created_by, approved')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('puzzles by creator fetch failed:', error);
        }
        return [];
    }

    return data as PuzzleData[];
};

const getPuzzleById = async (id: string): Promise<PuzzleData> => {
    const { data, error } = await supabase
        .from('puzzles')
        .select('id, title, grid, created_at, created_by, approved')
        .eq('id', id)
        .single();

    if (error || !data) {
        throw error || new Error('Bulmaca bulunamadi');
    }

    return data as PuzzleData;
};

const updatePuzzleByOwner = async (
    id: string,
    userId: string,
    puzzleData: Partial<PuzzleData>
): Promise<PuzzleData | null> => {
    const { data, error } = await supabase
        .from('puzzles')
        .update(puzzleData)
        .eq('id', id)
        .eq('created_by', userId)
        .select('id, title, grid, created_at, created_by, approved')
        .maybeSingle();

    if (error) {
        throw error;
    }

    invalidateRecentPuzzleCache();
    return (data as PuzzleData | null) ?? null;
};

const updatePuzzleApproval = async (id: string, approved: boolean): Promise<void> => {
    const { error } = await supabase
        .from('puzzles')
        .update({ approved })
        .eq('id', id);

    if (error) {
        throw error;
    }

    invalidateRecentPuzzleCache();
};

const deletePuzzleById = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('puzzles')
        .delete()
        .eq('id', id);

    if (error) {
        throw error;
    }

    invalidateRecentPuzzleCache();
};

const deletePuzzleByOwner = async (id: string, userId: string): Promise<void> => {
    const { error } = await supabase
        .from('puzzles')
        .delete()
        .eq('id', id)
        .eq('created_by', userId);

    if (error) {
        throw error;
    }

    invalidateRecentPuzzleCache();
};

const listPuzzleGrids = async (): Promise<Array<Pick<PuzzleData, 'id' | 'grid'>>> => {
    const { data, error } = await supabase
        .from('puzzles')
        .select('id, grid');

    if (error || !data) {
        if (error) {
            console.error('puzzle grids fetch failed:', error);
        }
        return [];
    }

    return data as Array<Pick<PuzzleData, 'id' | 'grid'>>;
};

const updatePuzzleGrid = async (id: string, grid: PuzzleGrid): Promise<void> => {
    const { error } = await supabase
        .from('puzzles')
        .update({ grid })
        .eq('id', id);

    if (error) {
        throw error;
    }

    invalidateRecentPuzzleCache();
};

export const puzzleRepository: PuzzleRepository = {
    createPuzzle,
    listRecentApprovedPuzzles,
    subscribeToPuzzleInserts,
    listApprovedPuzzles,
    listAllPuzzles,
    listPuzzlesByCreator,
    getPuzzleById,
    updatePuzzleByOwner,
    updatePuzzleApproval,
    deletePuzzleById,
    deletePuzzleByOwner,
    listPuzzleGrids,
    updatePuzzleGrid
};
