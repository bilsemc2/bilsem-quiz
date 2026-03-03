import type { StoryTheme, Question } from '../../../../shared/story/types.ts';
import type { AdaptiveQuestionRequest, SessionPerformance, AbilitySnapshot, AdaptiveQuestion } from '../../model/types.ts';

interface StoryQuestionSetInput {
    userId: string;
    theme: StoryTheme;
    locale: 'tr' | 'en';
    questionCount: number;
}

type GenerateAdaptiveQuestionFn = (
    request: AdaptiveQuestionRequest
) => Promise<{ question: AdaptiveQuestion; usedFallback: boolean }>;

interface LearningRepository {
    getAbilitySnapshot: (userId: string) => Promise<AbilitySnapshot | null>;
    getLatestSessionPerformance: (userId: string) => Promise<SessionPerformance | null>;
}

const themeToTopic = (theme: StoryTheme): string => {
    switch (theme) {
        case 'animals':
            return 'hafıza ve sınıflama';
        case 'adventure':
            return 'problem çözme';
        case 'fantasy':
            return 'yaratıcı mantık';
        case 'science':
            return 'analitik düşünme';
        case 'friendship':
            return 'sözel anlama';
        case 'life-lessons':
            return 'çıkarım ve mantık';
        default:
            return 'mantık';
    }
};

const createDefaultSnapshot = (userId: string): AbilitySnapshot => ({
    userId,
    overallScore: 50,
    dimensions: {
        memory: 50,
        logic: 50,
        attention: 50,
        verbal: 50,
        spatial: 50,
        processing_speed: 50
    },
    updatedAtISO: new Date().toISOString()
});

const createDefaultPerformance = (): SessionPerformance => ({
    recentAccuracy: 0.65,
    averageResponseMs: 4500,
    targetResponseMs: 4500,
    streakCorrect: 0,
    consecutiveWrong: 0
});

const toStoryQuestion = (stemPrefix: string, index: number, data: {
    stem: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}): Question => ({
    text: `${stemPrefix} ${index + 1}: ${data.stem}`,
    options: data.options,
    correctAnswer: data.correctIndex,
    feedback: {
        correct: data.explanation || 'Doğru cevap!',
        incorrect: 'Henüz doğru değil, tekrar deneyebilirsin.'
    }
});

const evolvePerformance = (
    previous: SessionPerformance,
    wasFallback: boolean
): SessionPerformance => ({
    ...previous,
    streakCorrect: wasFallback ? 0 : Math.min(10, previous.streakCorrect + 1),
    recentAccuracy: wasFallback
        ? Math.max(0.4, previous.recentAccuracy - 0.05)
        : Math.min(0.9, previous.recentAccuracy + 0.03)
});

const loadLearningRepository = async (): Promise<LearningRepository | null> => {
    try {
        const module = await import('../../../../server/repositories/aiLearningRepository.ts');
        return module.aiLearningRepository;
    } catch {
        return null;
    }
};

export const generateStoryQuestionSet = async (
    input: StoryQuestionSetInput,
    generateQuestionImpl?: GenerateAdaptiveQuestionFn
): Promise<Question[]> => {
    let generateQuestion: GenerateAdaptiveQuestionFn;

    if (generateQuestionImpl) {
        generateQuestion = generateQuestionImpl;
    } else {
        const module = await import('./questionGenerationUseCase.ts');
        generateQuestion = module.generateAdaptiveQuestion;
    }

    const topic = themeToTopic(input.theme);
    const learningRepository = await loadLearningRepository();
    let storedSnapshot: AbilitySnapshot | null = null;
    let storedPerformance: SessionPerformance | null = null;

    if (learningRepository) {
        try {
            [storedSnapshot, storedPerformance] = await Promise.all([
                learningRepository.getAbilitySnapshot(input.userId),
                learningRepository.getLatestSessionPerformance(input.userId)
            ]);
        } catch {
            storedSnapshot = null;
            storedPerformance = null;
        }
    }

    const snapshot = storedSnapshot ?? createDefaultSnapshot(input.userId);
    let performance = storedPerformance ?? createDefaultPerformance();
    const previousQuestionIds: string[] = [];
    const questions: Question[] = [];

    for (let i = 0; i < input.questionCount; i++) {
        const request: AdaptiveQuestionRequest = {
            userId: input.userId,
            topic,
            locale: input.locale,
            abilitySnapshot: snapshot,
            sessionPerformance: performance,
            previousQuestionIds
        };

        const { question, usedFallback } = await generateQuestion(request);
        previousQuestionIds.push(question.id);
        performance = evolvePerformance(performance, usedFallback);
        questions.push(
            toStoryQuestion('Soru', i, {
                stem: question.stem,
                options: question.options,
                correctIndex: question.correctIndex,
                explanation: question.explanation
            })
        );
    }

    return questions;
};
