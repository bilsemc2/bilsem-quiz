import { StoryTheme } from '../components/types';
import { supabase } from '../../../lib/supabase';
import { generateStoryQuestionSet } from '@/features/ai/question-generation/model/storyQuestionSetUseCase';
import type { AdaptiveQuestion, DifficultyLevel } from '@/features/ai/model/types';
import { aiQuestionPoolRepository } from '@/server/repositories/aiQuestionPoolRepository';
import { aiQuestionPoolSettingsRepository } from '@/server/repositories/aiQuestionPoolSettingsRepository';

// Supabase Edge Function URL
const getEdgeFunctionUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/gemini-proxy`;
};

interface GeneratedQuestion {
  id?: string;
  aiGeneratedQuestionId?: string;
  text: string;
  options: string[];
  correctAnswer: number;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

const resolveTopicFromTheme = (theme: StoryTheme): string => {
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

const normalizeDifficulty = (value: number): DifficultyLevel => {
  if (value <= 1) return 1;
  if (value >= 5) return 5;
  return value as DifficultyLevel;
};

const toStoryQuestionFromAdaptive = (question: AdaptiveQuestion): GeneratedQuestion => ({
  aiGeneratedQuestionId: question.id,
  text: question.stem,
  options: question.options,
  correctAnswer: question.correctIndex,
  feedback: {
    correct: question.explanation || 'Doğru cevap!',
    incorrect: 'Henüz doğru değil, tekrar deneyebilirsin.'
  }
});

const toAdaptiveQuestion = (
  question: GeneratedQuestion,
  topic: string,
  source: 'ai' | 'fallback'
): AdaptiveQuestion => ({
  id: question.aiGeneratedQuestionId || question.id || crypto.randomUUID(),
  topic,
  stem: question.text,
  options: question.options,
  correctIndex: question.correctAnswer,
  explanation: question.feedback.correct || 'Doğru cevap!',
  difficultyLevel: normalizeDifficulty(3),
  source
});

const normalizeQuestionFingerprint = (question: GeneratedQuestion): string => {
  const normalizedText = question.text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const normalizedOptions = question.options
    .map((option) =>
      option
        .toLocaleLowerCase('tr-TR')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter((option) => option.length > 0)
    .sort();

  return `${normalizedText}::${normalizedOptions.join('|')}`;
};

const mergeUniqueQuestions = (base: GeneratedQuestion[], incoming: GeneratedQuestion[]): GeneratedQuestion[] => {
  const seen = new Set<string>();
  const merged: GeneratedQuestion[] = [];

  const append = (question: GeneratedQuestion) => {
    const fingerprint = normalizeQuestionFingerprint(question);
    if (fingerprint.length === 0 || seen.has(fingerprint)) {
      return;
    }
    seen.add(fingerprint);
    merged.push(question);
  };

  base.forEach(append);
  incoming.forEach(append);

  return merged;
};

export async function generateStory(theme: StoryTheme) {
  try {
    // Get the auth session for the function call
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'generateStory',
        theme
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Hikaye oluşturulurken bir hata oluştu');
    }

    const data = await response.json();
    const storyData = data.result;

    // Validate the response
    if (!storyData || typeof storyData !== 'object') {
      throw new Error('Geçersiz hikaye verisi');
    }

    if (!storyData.title || !storyData.content || !storyData.summary) {
      throw new Error('Hikaye verilerinde gerekli alanlar eksik');
    }

    // Validate questions
    if (!storyData.questions || !Array.isArray(storyData.questions)) {
      throw new Error('Hikaye sorularında hata');
    }

    // Validate each question format
    for (const question of storyData.questions) {
      if (!question.text || !Array.isArray(question.options) ||
        question.options.length !== 4 || typeof question.correctAnswer !== 'number' ||
        !question.feedback?.correct || !question.feedback?.incorrect) {
        throw new Error('Soru formatı geçersiz');
      }
    }

    const themeImageMap: Record<string, string> = {
      adventure: '/images/story/adventure.png',
      friendship: '/images/story/friendship.png',
      science: '/images/story/science.png',
      animals: '/images/story/animals.png',
      fantasy: '/images/story/adventure.png',
      'life-lessons': '/images/story/friendship.png',
    };

    return {
      ...storyData,
      image_url: themeImageMap[theme] || '/images/story/adventure.png',
      theme
    };
  } catch (error) {
    console.error('Hikaye oluşturma hatası:', error);
    throw error instanceof Error ? error : new Error('Hikaye oluşturulurken beklenmeyen bir hata oluştu');
  }
}

export async function generateQuestions(story: { title: string; content: string; theme?: StoryTheme; locale?: 'tr' | 'en'; questionCount?: number }) {
  const targetCount = Math.max(1, Math.min(20, Math.round(story.questionCount || 5)));
  const theme = story.theme || 'adventure';
  const locale = story.locale || 'tr';
  const topic = resolveTopicFromTheme(theme);

  const normalizeQuestions = (value: unknown) => {
    if (!Array.isArray(value)) return null;

    const isValid = value.every((item) => {
      if (!item || typeof item !== 'object') return false;
      const question = item as {
        id?: unknown;
        text?: unknown;
        options?: unknown;
        correctAnswer?: unknown;
        feedback?: { correct?: unknown; incorrect?: unknown };
      };

      return (
        typeof question.text === 'string' &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        question.options.every((option) => typeof option === 'string') &&
        typeof question.correctAnswer === 'number' &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < 4 &&
        question.feedback !== undefined &&
        typeof question.feedback.correct === 'string' &&
        typeof question.feedback.incorrect === 'string'
      );
    });

    if (!isValid) {
      return null;
    }

    return value as GeneratedQuestion[];
  };

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  const loadPendingQuestionsFromDB = async (
    userId: string,
    limit: number,
    maxServedCount: number
  ): Promise<GeneratedQuestion[]> => {
    try {
      const pending = await aiQuestionPoolRepository.listPendingQuestions({
        userId,
        topic,
        locale,
        limit,
        maxServedCountBeforeRetire: maxServedCount
      });
      return pending.map(toStoryQuestionFromAdaptive);
    } catch (error) {
      console.error('DB soru havuzu okunamadı:', error);
      return [];
    }
  };

  const persistQuestionsToDB = async (
    userId: string | null,
    questions: GeneratedQuestion[],
    source: 'ai' | 'fallback'
  ): Promise<GeneratedQuestion[]> => {
    if (!userId || questions.length === 0) {
      return questions;
    }

    try {
      const adaptiveQuestions = questions.map((question) => toAdaptiveQuestion(question, topic, source));
      const saved = await aiQuestionPoolRepository.saveGeneratedQuestions({
        userId,
        topic,
        locale,
        questions: adaptiveQuestions
      });
      return saved.map(toStoryQuestionFromAdaptive);
    } catch (error) {
      console.error('AI sorular DB kaydı başarısız:', error);
      return questions;
    }
  };

  const generateFallbackQuestions = async (
    requestedCount: number,
    userId: string | null
  ): Promise<GeneratedQuestion[]> => {
    if (requestedCount <= 0) {
      return [];
    }

    return generateStoryQuestionSet({
      userId: userId || 'guest-user',
      theme,
      locale,
      questionCount: requestedCount
    });
  };

  const ensureMinimumQuestionCount = async (
    existing: GeneratedQuestion[],
    userId: string | null
  ): Promise<GeneratedQuestion[]> => {
    let merged = mergeUniqueQuestions([], existing);
    if (merged.length >= targetCount) {
      return merged.slice(0, targetCount);
    }

    let attempts = 0;
    while (merged.length < targetCount && attempts < 3) {
      const needed = targetCount - merged.length;
      const generationTarget = Math.min(20, Math.max(needed, needed * 2));
      const fallback = await generateFallbackQuestions(generationTarget, userId);
      const persistedFallback = await persistQuestionsToDB(userId, fallback, 'fallback');
      const source = persistedFallback.length > 0 ? persistedFallback : fallback;
      const nextMerged = mergeUniqueQuestions(merged, source);

      if (nextMerged.length === merged.length) {
        break;
      }

      merged = nextMerged;
      attempts += 1;
    }

    return merged.slice(0, targetCount);
  };

  const settings = await aiQuestionPoolSettingsRepository.getEffectiveSettings(topic, locale);
  const maxServedCount = settings.maxServedCount;
  const targetPoolSize = Math.max(targetCount, settings.targetPoolSize);
  const refillBatchSize = settings.refillBatchSize;
  const maxGenerationPerRequest = 20;

  try {
    const userId = await getUserId();
    const pendingCount = userId
      ? await aiQuestionPoolRepository.getPendingQuestionCount({
        userId,
        topic,
        locale,
        maxServedCountBeforeRetire: maxServedCount
      })
      : 0;
    const cachedQuestions = userId
      ? await loadPendingQuestionsFromDB(userId, targetCount, maxServedCount)
      : [];

    if (cachedQuestions.length >= targetCount && pendingCount >= targetPoolSize) {
      return cachedQuestions.slice(0, targetCount);
    }

    const missingCount = targetCount - cachedQuestions.length;
    const refillNeeded = Math.max(0, targetPoolSize - pendingCount);
    const refillCount = refillNeeded > 0 ? Math.max(refillNeeded, refillBatchSize) : 0;
    const generationCount = Math.min(maxGenerationPerRequest, Math.max(missingCount, refillCount));

    if (generationCount <= 0) {
      return cachedQuestions.slice(0, targetCount);
    }

    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'generateQuestions',
        story: {
          ...story,
          questionCount: generationCount
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn('Gemini question generation failed, falling back to adaptive engine:', errorData?.error);
      const fallback = await generateFallbackQuestions(generationCount, userId);
      const persistedFallback = await persistQuestionsToDB(userId, fallback, 'fallback');
      const source = persistedFallback.length > 0 ? persistedFallback : fallback;
      return ensureMinimumQuestionCount(mergeUniqueQuestions(cachedQuestions, source), userId);
    }

    const data = await response.json();
    const result = data.result;
    const normalizedDirect = normalizeQuestions(result);
    if (normalizedDirect && normalizedDirect.length > 0) {
      const newQuestions = normalizedDirect.slice(0, generationCount);
      const persisted = await persistQuestionsToDB(userId, newQuestions, 'ai');
      const source = persisted.length > 0 ? persisted : newQuestions;
      return ensureMinimumQuestionCount(mergeUniqueQuestions(cachedQuestions, source), userId);
    }

    const normalizedNested = normalizeQuestions((result as { questions?: unknown } | null)?.questions);
    if (normalizedNested && normalizedNested.length > 0) {
      const newQuestions = normalizedNested.slice(0, generationCount);
      const persisted = await persistQuestionsToDB(userId, newQuestions, 'ai');
      const source = persisted.length > 0 ? persisted : newQuestions;
      return ensureMinimumQuestionCount(mergeUniqueQuestions(cachedQuestions, source), userId);
    }

    const fallback = await generateFallbackQuestions(generationCount, userId);
    const persistedFallback = await persistQuestionsToDB(userId, fallback, 'fallback');
    const source = persistedFallback.length > 0 ? persistedFallback : fallback;
    return ensureMinimumQuestionCount(mergeUniqueQuestions(cachedQuestions, source), userId);
  } catch (error) {
    console.error('Soru oluşturma hatası:', error);
    const userId = await getUserId();
    const cachedQuestions = userId
      ? await loadPendingQuestionsFromDB(userId, targetCount, maxServedCount)
      : [];
    if (cachedQuestions.length >= targetCount) {
      return cachedQuestions.slice(0, targetCount);
    }

    const missingCount = targetCount - cachedQuestions.length;
    const fallback = await generateFallbackQuestions(missingCount, userId);
    const persistedFallback = await persistQuestionsToDB(userId, fallback, 'fallback');
    const source = persistedFallback.length > 0 ? persistedFallback : fallback;
    return ensureMinimumQuestionCount(mergeUniqueQuestions(cachedQuestions, source), userId);
  }
}

export interface Story {
  id: string;
  title: string;
  animalInfo?: string;
  content: string;
  summary: string;
  theme: StoryTheme;
  image_url: string;
  questions: Array<{
    id?: string;
    aiGeneratedQuestionId?: string;
    text: string;
    options: string[];
    correctAnswer: number;
    feedback: {
      correct: string;
      incorrect: string;
    }
  }>;
}
