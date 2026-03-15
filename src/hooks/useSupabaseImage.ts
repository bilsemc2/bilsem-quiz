import { useState, useEffect } from 'react';
import { loadQuestionImageBlob } from '@/features/content/model/questionImageUseCases';

export const useSupabaseImage = (path: string) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let currentObjectUrl: string | null = null;

        const fetchImage = async () => {
            try {
                setError(null);
                const data = await loadQuestionImageBlob(path);

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
