import { supabase } from './supabase';

export interface PuzzleData {
  id: string;
  title: string;
  grid: any[][];
  created_at: string;
  created_by: string;
  approved: boolean;
}

export const savePuzzle = async (puzzleData: PuzzleData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            throw new Error('You do not have permission for this action');
        }

        const { data, error } = await supabase
            .from('puzzles')
            .insert([{
                ...puzzleData,
                created_by: user.id,
                approved: true
            }])
            .select();

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error saving puzzle:', error);
        throw error;
    }
};

// Cache configuration
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
let puzzleCache: {
  data: PuzzleData[];
  timestamp: number;
} | null = null;

// Optimized function for fetching recent puzzles
export const getRecentPuzzles = async (): Promise<PuzzleData[]> => {
  // Return cached data if fresh
  if (puzzleCache && Date.now() - puzzleCache.timestamp < CACHE_TIME) {
    return puzzleCache.data;
  }

  const { data, error } = await supabase
    .from('puzzles')
    .select('id, grid, created_at')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching recent puzzles:', error);
    throw error;
  }

  // Update cache
  puzzleCache = {
    data,
    timestamp: Date.now()
  };

  return data;
};

// Subscribe to real-time puzzle updates
export const subscribeToNewPuzzles = (callback: (puzzle: PuzzleData) => void) => {
  const channel = supabase
    .channel('public:puzzles')
    .on(
      'INSERT',
      (payload) => {
        if (payload.new.approved) {
          // Invalidate cache when new puzzle is added
          puzzleCache = null;
          callback(payload.new);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    channel.unsubscribe();
  };
};

// Original getPuzzles function remains for other use cases
export const getPuzzles = async (): Promise<PuzzleData[]> => {
  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching puzzles:', error);
    throw error;
  }

  return data || [];
};

// Admin fonksiyonları
export const getAllPuzzles = async (): Promise<PuzzleData[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Admin yetkisi gerekli');
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            throw new Error('Admin yetkisi gerekli');
        }

        const { data, error } = await supabase
            .from('puzzles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error getting all puzzles:', error);
        throw error;
    }
};

export const getUserPuzzles = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('puzzles')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user puzzles:', error);
    throw error;
  }
};

export const getPuzzleById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('puzzles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    throw error;
  }
};

export const updatePuzzle = async (id: string, puzzleData: Partial<PuzzleData>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Bulmaca güncellemek için giriş yapmalısınız');
    }

    const { data, error } = await supabase
      .from('puzzles')
      .update(puzzleData)
      .eq('id', id)
      .eq('created_by', user.id) // Sadece kendi bulmacalarını güncelleyebilir
      .select();

    if (error) {
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error('Error updating puzzle:', error);
    throw error;
  }
};

export const approvePuzzle = async (id: string): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Admin yetkisi gerekli');
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            throw new Error('Admin yetkisi gerekli');
        }

        const { error } = await supabase
            .from('puzzles')
            .update({ approved: true })
            .eq('id', id);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error approving puzzle:', error);
        throw error;
    }
};

export const rejectPuzzle = async (id: string): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Admin yetkisi gerekli');
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            throw new Error('Admin yetkisi gerekli');
        }

        const { error } = await supabase
            .from('puzzles')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error rejecting puzzle:', error);
        throw error;
    }
};

export const deletePuzzle = async (id: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Bulmaca silmek için giriş yapmalısınız');
    }

    const { error } = await supabase
      .from('puzzles')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id); // Sadece kendi bulmacalarını silebilir

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting puzzle:', error);
    throw error;
  }
};

export const togglePuzzleStatus = async (id: string, currentStatus: boolean): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Admin yetkisi gerekli');
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            throw new Error('Admin yetkisi gerekli');
        }

        const { error } = await supabase
            .from('puzzles')
            .update({ approved: !currentStatus })
            .eq('id', id);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error toggling puzzle status:', error);
        throw error;
    }
};

export const deletePuzzleByAdmin = async (id: string): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Admin yetkisi gerekli');
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            throw new Error('Admin yetkisi gerekli');
        }

        const { error } = await supabase
            .from('puzzles')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error deleting puzzle:', error);
        throw error;
    }
};

export const fixProfessionImages = async () => {
    try {
        const { data: puzzles, error: fetchError } = await supabase
            .from('puzzles')
            .select('*');

        if (fetchError) throw fetchError;

        for (const puzzle of puzzles || []) {
            let updated = false;
            const newGrid = puzzle.grid.map((row: any[]) => 
                row.map((cell: any) => {
                    if (!cell) return null;
                    if (cell.type === 'profession') {
                        if (cell.id === 'construction' && cell.svg?.props?.children?.props?.src === '/images/professions/unknown.png') {
                            updated = true;
                            return {
                                ...cell,
                                svg: {
                                    ...cell.svg,
                                    props: {
                                        ...cell.svg.props,
                                        children: {
                                            ...cell.svg.props.children,
                                            props: {
                                                ...cell.svg.props.children.props,
                                                src: '/images/professions/construction.png'
                                            }
                                        }
                                    }
                                }
                            };
                        }
                        if (cell.id === 'astronaut' && cell.svg?.props?.children?.props?.src === '/images/professions/unknown.png') {
                            updated = true;
                            return {
                                ...cell,
                                svg: {
                                    ...cell.svg,
                                    props: {
                                        ...cell.svg.props,
                                        children: {
                                            ...cell.svg.props.children,
                                            props: {
                                                ...cell.svg.props.children.props,
                                                src: '/images/professions/astronaut.png'
                                            }
                                        }
                                    }
                                }
                            };
                        }
                    }
                    return cell;
                })
            );

            if (updated) {
                const { error: updateError } = await supabase
                    .from('puzzles')
                    .update({ grid: newGrid })
                    .eq('id', puzzle.id);

                if (updateError) throw updateError;
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error fixing profession images:', error);
        throw error;
    }
};
