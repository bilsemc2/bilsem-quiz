import { supabase } from '@/lib/supabase';

export interface StorageRepository {
    download: (bucket: string, path: string) => Promise<Blob | null>;
}

const download = async (bucket: string, path: string): Promise<Blob | null> => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

    if (error) {
        console.error('storage download failed:', error);
        return null;
    }

    return data ?? null;
};

export const storageRepository: StorageRepository = {
    download
};
