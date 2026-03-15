import { storageRepository, type StorageRepository } from '@/server/repositories/storageRepository';

const QUESTIONS_BUCKET = 'questions';

export const loadQuestionImageBlob = async (
    path: string,
    deps: Pick<StorageRepository, 'download'> = storageRepository
): Promise<Blob | null> => {
    const normalizedPath = path.trim();
    if (!normalizedPath) {
        return null;
    }

    return deps.download(QUESTIONS_BUCKET, normalizedPath);
};
