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

        const isAdmin = user.email === 'yaprakyesili@msn.com';

        const { data, error } = await supabase
            .from('puzzles')
            .insert([{
                ...puzzleData,
                created_by: user.id,
                approved: isAdmin // Admin ise otomatik onayla
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
        if (!user || user.email !== 'yaprakyesili@msn.com') {
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
        if (!user || user.email !== 'yaprakyesili@msn.com') {
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
        if (!user || user.email !== 'yaprakyesili@msn.com') {
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
        if (!user || user.email !== 'yaprakyesili@msn.com') {
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
        if (!user || user.email !== 'yaprakyesili@msn.com') {
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
