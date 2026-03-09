import type {
    ExamSessionRepository,
    SaveExamSessionInput
} from '../../../server/repositories/examSessionRepository';
import type { AppError, Result } from '../../../shared/types/result';

export const persistCompletedExamSession = async (
    input: SaveExamSessionInput,
    deps?: Pick<ExamSessionRepository, 'saveExamSession'>
): Promise<Result<void, AppError>> => {
    const repository = deps ?? (await import('../../../server/repositories/examSessionRepository')).examSessionRepository;
    return repository.saveExamSession(input);
};
