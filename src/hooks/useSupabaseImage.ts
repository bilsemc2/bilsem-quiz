import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSupabaseImage = (path: string) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let currentObjectUrl: string | null = null;

        const fetchImage = async () => {
            try {
                setError(null);
                const { data, error } = await supabase.storage
                    .from('questions')
                    .download(path);

                if (error) {
                    throw error;
                }

                if (data) {
                    currentObjectUrl = URL.createObjectURL(data);
                    setImageUrl(currentObjectUrl);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Resim yüklenirken bir hata oluştu');
            }
        };

        fetchImage();

        // Cleanup function
        return () => {
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
            }
        };
    }, [path]);

    return { imageUrl, error };
};
