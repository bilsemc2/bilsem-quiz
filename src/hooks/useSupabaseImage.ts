import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSupabaseImage = (path: string) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const { data, error } = await supabase.storage
                    .from('questions')
                    .download(path);

                if (error) {
                    throw error;
                }

                if (data) {
                    const url = URL.createObjectURL(data);
                    setImageUrl(url);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Resim yüklenirken bir hata oluştu');
            }
        };

        fetchImage();

        // Cleanup function
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [path]);

    return { imageUrl, error };
};
