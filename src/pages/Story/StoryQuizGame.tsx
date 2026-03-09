import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Sparkles, Home, BookOpenCheck, ChevronLeft } from 'lucide-react';
import { getStories } from './services/stories';
import { Story } from './types';
import BrainTrainerShell from '../../components/BrainTrainer/shared/BrainTrainerShell';
import { useGameEngine } from '../../components/BrainTrainer/shared/useGameEngine';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useSound } from '../../hooks/useSound';
import { supabase } from '../../lib/supabase';
import { aiQuestionPoolRepository } from '@/server/repositories/aiQuestionPoolRepository';
import { aiLearningRepository } from '@/server/repositories/aiLearningRepository';
import {
    createDefaultAbilitySnapshot,
    updateAbilitySnapshotFromSession
} from '@/features/ai/adaptive-difficulty/model/abilitySnapshotUpdateUseCase';
import type { AbilitySnapshot, SessionPerformance } from '@/features/ai/model/types';
import { getAdaptiveDifficultySettings } from '@/features/ai/adaptive-difficulty/model/adaptiveDifficultySettings';
import { calculateTargetDifficultyDecision } from '@/features/ai/adaptive-difficulty/model/difficultyEngine';
import { resolveStoryQuestionAttemptSource } from '@/shared/story/model/questionSource';

const GAME_ID = 'hikaye-quiz';
const MAX_LEVEL = 10;
const TIME_LIMIT = 180;
const INITIAL_LIVES = 3;
const SESSION_TARGET_RESPONSE_MS = 4500;

interface SessionTrackingState {
    answered: number;
    correct: number;
    responseMsTotal: number;
    streakCorrect: number;
    consecutiveWrong: number;
}

const INITIAL_SESSION_TRACKING: SessionTrackingState = {
    answered: 0,
    correct: 0,
    responseMsTotal: 0,
    streakCorrect: 0,
    consecutiveWrong: 0
};

const ADAPTIVE_DIFFICULTY_SETTINGS = getAdaptiveDifficultySettings();

const THEME_ACCENTS: Record<string, { bg: string; text: string; emoji: string; label: string }> = {
    animals: { bg: 'bg-cyber-green', text: 'text-black', emoji: '🦁', label: 'Hayvanlar' },
    adventure: { bg: 'bg-cyber-yellow', text: 'text-black', emoji: '🗺️', label: 'Macera' },
    fantasy: { bg: 'bg-cyber-purple', text: 'text-white', emoji: '🧙', label: 'Fantezi' },
    science: { bg: 'bg-cyber-blue', text: 'text-white', emoji: '🔬', label: 'Bilim' },
    friendship: { bg: 'bg-cyber-pink', text: 'text-black', emoji: '🤝', label: 'Arkadaşlık' },
    'life-lessons': { bg: 'bg-cyber-yellow', text: 'text-black', emoji: '💡', label: 'Hayat Dersleri' },
};

const resolveTopicFromTheme = (theme: Story['theme']): string => {
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

export default function StoryQuizGame() {
    const navigate = useNavigate();
    const { playSound } = useSound();

    const engine = useGameEngine({
        gameId: GAME_ID,
        maxLevel: MAX_LEVEL,
        timeLimit: TIME_LIMIT,
        initialLives: INITIAL_LIVES,
        disableAutoStart: true, // We handle autoStart ourselves (reading phase first)
    });

    const feedback = useGameFeedback({ duration: 1200 });
    const { feedbackState, showFeedback, dismissFeedback } = feedback;

    const [stories, setStories] = useState<Story[]>([]);
    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);

    // Reading is a separate full-screen state BEFORE the shell takes over
    const [isReading, setIsReading] = useState(false);
    const [readingTime, setReadingTime] = useState(0);

    // Quiz state
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [quizResults, setQuizResults] = useState<{ isCorrect: boolean }[]>([]);
    const [sessionPerformanceId, setSessionPerformanceId] = useState<string | null>(null);
    const [sessionTracking, setSessionTracking] = useState<SessionTrackingState>(INITIAL_SESSION_TRACKING);
    const [questionStartedAtMs, setQuestionStartedAtMs] = useState<number>(0);
    const [baselineAbilitySnapshot, setBaselineAbilitySnapshot] = useState<AbilitySnapshot | null>(null);
    const [previousSessionPerformance, setPreviousSessionPerformance] = useState<SessionPerformance | null>(null);

    // Load stories
    useEffect(() => {
        async function loadStories() {
            try {
                const data = await getStories();
                setStories(data.filter(s => s.questions && s.questions.length > 0));
            } catch (error) {
                console.error('Hikayeler yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        }
        loadStories();
    }, []);

    // Reading timer (separate from engine timer)
    useEffect(() => {
        if (!isReading) return;
        const interval = setInterval(() => setReadingTime(p => p + 1), 1000);
        return () => clearInterval(interval);
    }, [isReading]);

    // Start reading phase (picks story, shows reading screen)
    const startReading = useCallback(() => {
        if (stories.length === 0) return;
        const randomStory = stories[Math.floor(Math.random() * stories.length)];
        setStory(randomStory);
        setIsReading(true);
        setReadingTime(0);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setQuizResults([]);
        setSessionPerformanceId(null);
        setSessionTracking(INITIAL_SESSION_TRACKING);
        setQuestionStartedAtMs(0);
        setBaselineAbilitySnapshot(null);
        setPreviousSessionPerformance(null);
        playSound('pop');
    }, [stories, playSound]);

    const getSessionUserId = useCallback(async (): Promise<string | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user?.id ?? null;
        } catch {
            return null;
        }
    }, []);

    const buildSessionMetrics = useCallback((tracking: SessionTrackingState): SessionPerformance => {
        const answered = Math.max(0, tracking.answered);

        if (answered === 0) {
            return {
                recentAccuracy: 0,
                averageResponseMs: 0,
                targetResponseMs: SESSION_TARGET_RESPONSE_MS,
                streakCorrect: 0,
                consecutiveWrong: 0
            };
        }

        return {
            recentAccuracy: tracking.correct / answered,
            averageResponseMs: Math.round(tracking.responseMsTotal / answered),
            targetResponseMs: SESSION_TARGET_RESPONSE_MS,
            streakCorrect: tracking.streakCorrect,
            consecutiveWrong: tracking.consecutiveWrong
        };
    }, []);

    const buildDifficultyDecisionForTracking = useCallback((input: {
        tracking: SessionTrackingState;
        snapshot: AbilitySnapshot;
        userId: string;
        topic: string;
    }) => {
        const previousDifficultyLevel = previousSessionPerformance
            ? calculateTargetDifficultyDecision(
                {
                    userId: input.userId,
                    topic: input.topic,
                    locale: 'tr',
                    abilitySnapshot: input.snapshot,
                    sessionPerformance: previousSessionPerformance
                },
                {
                    settings: ADAPTIVE_DIFFICULTY_SETTINGS
                }
            ).difficultyLevel
            : null;

        return calculateTargetDifficultyDecision({
            userId: input.userId,
            topic: input.topic,
            locale: 'tr',
            abilitySnapshot: input.snapshot,
            sessionPerformance: buildSessionMetrics(input.tracking)
        }, {
            previousSessionPerformance,
            previousDifficultyLevel,
            settings: ADAPTIVE_DIFFICULTY_SETTINGS
        });
    }, [buildSessionMetrics, previousSessionPerformance]);

    const startLearningSession = useCallback(async () => {
        if (!story) {
            return;
        }

        try {
            const userId = await getSessionUserId();
            if (!userId) {
                setSessionPerformanceId(null);
                setBaselineAbilitySnapshot(null);
                setPreviousSessionPerformance(null);
                return;
            }

            const latestSessionPerformance = await aiLearningRepository.getLatestSessionPerformance(userId);
            const currentSnapshot = await aiLearningRepository.getAbilitySnapshot(userId);
            const baselineSnapshot = currentSnapshot ?? createDefaultAbilitySnapshot(userId);
            setBaselineAbilitySnapshot(baselineSnapshot);
            setPreviousSessionPerformance(latestSessionPerformance);

            const sessionId = await aiLearningRepository.createSessionPerformance({
                userId,
                topic: resolveTopicFromTheme(story.theme),
                locale: 'tr',
                metrics: {
                    recentAccuracy: 0,
                    averageResponseMs: 0,
                    targetResponseMs: SESSION_TARGET_RESPONSE_MS,
                    streakCorrect: 0,
                    consecutiveWrong: 0
                },
                totalQuestions: story.questions.length,
                correctAnswers: 0,
                startedAtISO: new Date().toISOString(),
                metadata: {
                    gameId: GAME_ID,
                    storyId: story.id,
                    storyTheme: story.theme
                }
            });

            setSessionPerformanceId(sessionId);
        } catch (error) {
            console.error('session_performance başlatılamadı:', error);
            setSessionPerformanceId(null);
        }
    }, [getSessionUserId, story]);

    const finalizeLearningSession = useCallback(async (tracking: SessionTrackingState) => {
        if (!story || !sessionPerformanceId) {
            return;
        }

        try {
            const userId = await getSessionUserId();
            if (!userId) {
                return;
            }

            const answered = Math.max(0, tracking.answered);
            const topic = resolveTopicFromTheme(story.theme);
            const sessionMetrics = buildSessionMetrics(tracking);
            const currentSnapshot = await aiLearningRepository.getAbilitySnapshot(userId);
            const baselineSnapshot =
                baselineAbilitySnapshot ??
                currentSnapshot ??
                createDefaultAbilitySnapshot(userId);
            const difficultyDecision = buildDifficultyDecisionForTracking({
                tracking,
                snapshot: baselineSnapshot,
                userId,
                topic
            });

            await aiLearningRepository.updateSessionPerformance({
                userId,
                sessionPerformanceId,
                totalQuestions: story.questions.length,
                correctAnswers: tracking.correct,
                endedAtISO: new Date().toISOString(),
                metrics: sessionMetrics,
                metadata: {
                    gameId: GAME_ID,
                    storyId: story.id,
                    storyTheme: story.theme,
                    answeredQuestions: answered,
                    difficultyDecision
                }
            });

            const nextSnapshot = updateAbilitySnapshotFromSession({
                snapshot: baselineSnapshot,
                topic,
                sessionPerformance: sessionMetrics,
                totalQuestions: answered,
                correctAnswers: tracking.correct
            });

            await aiLearningRepository.upsertAbilitySnapshot(nextSnapshot, {
                source: 'hybrid',
                modelVersion: 'rule.v1',
                lastSessionId: sessionPerformanceId,
                context: {
                    gameId: GAME_ID,
                    storyId: story.id,
                    storyTheme: story.theme,
                    difficultyDecision,
                    previousOverallScore: baselineSnapshot.overallScore,
                    nextOverallScore: nextSnapshot.overallScore
                }
            });
        } catch (error) {
            console.error('session_performance güncellenemedi:', error);
        }
    }, [
        baselineAbilitySnapshot,
        buildDifficultyDecisionForTracking,
        buildSessionMetrics,
        getSessionUserId,
        sessionPerformanceId,
        story
    ]);

    // Finish reading → start the engine (quiz begins, timer starts)
    const finishReading = useCallback(() => {
        setIsReading(false);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setQuizResults([]);
        setSessionTracking(INITIAL_SESSION_TRACKING);
        setQuestionStartedAtMs(Date.now());
        void startLearningSession();
        engine.handleStart(); // NOW the shell takes over with HUD + timer
        playSound('pop');
    }, [engine, playSound, startLearningSession]);

    // Restart: reset engine to welcome, pick a new story, start reading
    const handleRestart = useCallback(() => {
        engine.setGamePhase('welcome');
        setSessionPerformanceId(null);
        setSessionTracking(INITIAL_SESSION_TRACKING);
        setQuestionStartedAtMs(0);
        setBaselineAbilitySnapshot(null);
        setPreviousSessionPerformance(null);
        startReading();
    }, [engine, startReading]);

    const markQuestionSolved = useCallback(async (questionId?: string) => {
        if (!questionId) return;

        try {
            const userId = await getSessionUserId();
            if (!userId) return;
            await aiQuestionPoolRepository.markQuestionSolved(userId, questionId);
        } catch (error) {
            console.error('Soru solved durumuna geçirilemedi:', error);
        }
    }, [getSessionUserId]);

    const handleAnswer = (answerIndex: number) => {
        if (!story || feedbackState || selectedAnswer !== null) return;

        const question = story.questions[currentQuestion];
        const isCorrect = answerIndex === question.correctAnswer;
        const responseMs = questionStartedAtMs > 0 ? Math.max(0, Date.now() - questionStartedAtMs) : 0;
        const nextTracking: SessionTrackingState = {
            answered: sessionTracking.answered + 1,
            correct: sessionTracking.correct + (isCorrect ? 1 : 0),
            responseMsTotal: sessionTracking.responseMsTotal + responseMs,
            streakCorrect: isCorrect ? sessionTracking.streakCorrect + 1 : 0,
            consecutiveWrong: isCorrect ? 0 : sessionTracking.consecutiveWrong + 1
        };

        setSelectedAnswer(answerIndex);
        setQuizResults(prev => [...prev, { isCorrect }]);
        setSessionTracking(nextTracking);

        if (sessionPerformanceId) {
            void (async () => {
                try {
                    const userId = await getSessionUserId();
                    if (!userId) {
                        return;
                    }

                    const questionId =
                        question.aiGeneratedQuestionId ||
                        question.id ||
                        `story-${story.id}-q-${currentQuestion + 1}`;
                    const topic = resolveTopicFromTheme(story.theme);
                    const difficultyDecision = buildDifficultyDecisionForTracking({
                        tracking: sessionTracking,
                        snapshot: baselineAbilitySnapshot ?? createDefaultAbilitySnapshot(userId),
                        userId,
                        topic
                    });

                    await aiLearningRepository.recordQuestionAttempt({
                        userId,
                        sessionPerformanceId,
                        questionId,
                        topic,
                        difficultyLevel: difficultyDecision.difficultyLevel,
                        wasCorrect: isCorrect,
                        responseMs,
                        selectedIndex: answerIndex,
                        correctIndex: question.correctAnswer,
                        source: resolveStoryQuestionAttemptSource(question),
                        questionPayload: {
                            storyId: story.id,
                            storyTheme: story.theme,
                            questionNumber: currentQuestion + 1,
                            answeredBeforeQuestion: sessionTracking.answered,
                            answeredAfterQuestion: nextTracking.answered,
                            difficultyDecision
                        }
                    });
                } catch (error) {
                    console.error('question_attempt kaydı başarısız:', error);
                }
            })();
        }

        if (isCorrect) {
            showFeedback(true);
            playSound('correct');
            engine.addScore(20 + (readingTime < 60 ? 10 : 0));
            void markQuestionSolved(question.aiGeneratedQuestionId);
        } else {
            showFeedback(false);
            playSound('incorrect');
            engine.loseLife();
        }

        setTimeout(() => {
            dismissFeedback();
            if (currentQuestion < story.questions.length - 1) {
                setCurrentQuestion(prev => prev + 1);
                setSelectedAnswer(null);
                setQuestionStartedAtMs(Date.now());
            } else {
                const correctCount = [...quizResults, { isCorrect }].filter(r => r.isCorrect).length;
                void finalizeLearningSession(nextTracking);
                if (correctCount >= Math.ceil(story.questions.length * 0.5)) {
                    engine.setGamePhase('victory');
                } else {
                    engine.setGamePhase('game_over');
                }
            }
        }, 1500);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const themeInfo = story ? THEME_ACCENTS[story.theme] || THEME_ACCENTS.adventure : THEME_ACCENTS.adventure;
    const correctCount = quizResults.filter(r => r.isCorrect).length;

    // ============================================================
    // READING PHASE — Full-screen, outside BrainTrainerShell
    // ============================================================
    if (isReading && story) {
        return (
            <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center p-4 sm:p-6 overflow-y-auto relative">
                <div className="relative z-10 w-full max-w-3xl">
                    {/* Back button */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border-2 border-black/10 px-4 py-2 rounded-xl shadow-neo-xs active:translate-y-[2px] active:translate-x-[2px] active:shadow-none font-nunito font-bold"
                        >
                            <ChevronLeft size={20} className="stroke-[3]" />
                            <span>Vazgeç</span>
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-xs -rotate-2">
                            <Clock size={18} className="text-cyber-purple stroke-[3]" />
                            <span className="font-nunito font-black text-black dark:text-white">{formatTime(readingTime)}</span>
                        </div>
                    </div>

                    {/* Theme Badge + Title */}
                    <div className="text-center mb-6">
                        <span className={`inline-block px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-xs font-nunito font-black text-sm uppercase tracking-widest rotate-2 mb-4 ${themeInfo.bg} ${themeInfo.text}`}>
                            {themeInfo.emoji} {themeInfo.label}
                        </span>
                        <h1 className="text-2xl sm:text-4xl font-nunito font-black text-black dark:text-white uppercase tracking-tight">
                            {story.title}
                        </h1>
                    </div>

                    {/* Story Image */}
                    {story.image_url && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl overflow-hidden border-2 border-black/10 shadow-neo-md rotate-1 mb-6"
                        >
                            <img src={story.image_url} alt={story.title} className="w-full aspect-video object-cover" />
                        </motion.div>
                    )}

                    {/* Story Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border-2 border-black/10 shadow-neo-md -rotate-1 mb-6"
                    >
                        <p className="text-black dark:text-white font-nunito text-lg leading-relaxed whitespace-pre-wrap">
                            {story.content}
                        </p>
                    </motion.div>

                    {/* Animal Info */}
                    {story.theme === 'animals' && story.animalInfo && (
                        <div className="p-4 bg-cyber-green border-2 border-black/10 rounded-2xl shadow-neo-xs rotate-1 mb-6">
                            <p className="text-black font-nunito font-bold">
                                <span className="font-black">🤔 Biliyor muydun?</span> {story.animalInfo}
                            </p>
                        </div>
                    )}

                    {/* Finish Reading Button */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={finishReading}
                        className="w-full bg-cyber-green border-2 border-black/10 shadow-neo-sm text-black text-lg sm:text-xl py-4 rounded-2xl hover:-translate-y-1 hover:shadow-neo-md active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 font-nunito font-black uppercase tracking-widest"
                    >
                        <CheckCircle2 size={24} className="stroke-[3]" />
                        Okudum, Sorulara Geç
                    </motion.button>

                    <p className="text-center text-slate-400 dark:text-slate-500 font-nunito font-bold text-sm mt-4">
                        Hikayeyi dikkatlice oku, sorularda bu bilgilere ihtiyacın olacak!
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // WELCOME + QUIZ phases — BrainTrainerShell handles everything
    // ============================================================

    // Custom Welcome Screen
    const WelcomeScreen = (
        <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center justify-center p-4 overflow-hidden relative">
            <div className="relative z-10 w-full max-w-xl">


                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-black/10 shadow-neo-md -rotate-1"
                >
                    <motion.div
                        className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-purple border-3 border-black/20 shadow-neo-md rounded-2xl flex items-center justify-center rotate-3"
                        animate={{ y: [0, -8, 0], rotate: [3, 8, 3] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <BookOpenCheck size={56} className="text-white" strokeWidth={2.5} />
                    </motion.div>

                    <h1 className="text-4xl sm:text-5xl font-nunito font-black mb-4 uppercase text-black dark:text-white tracking-tight">
                        Hikaye Quiz
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-nunito text-lg mb-6">
                        Hikaye oku, sorulara cevap ver, puan kazan!
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-6 border-2 border-black/10 shadow-neo-md text-left rotate-1">
                        <h3 className="text-xl font-nunito font-black text-cyber-blue mb-4 flex items-center gap-2 uppercase">
                            <Sparkles size={24} className="stroke-[3]" /> Nasıl Oynanır
                        </h3>
                        <div className="space-y-2 text-black dark:text-white font-nunito font-bold text-sm">
                            <p>📖 Rastgele bir hikaye okursun</p>
                            <p>❓ Hikaye hakkında sorulara cevap verirsin</p>
                            <p>⏱️ Hızlı okuma bonus puan kazandırır</p>
                            <p>❤️ 3 can hakkın var, dikkatli ol!</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="px-4 py-3 bg-cyber-yellow border-2 border-black/10 rounded-xl shadow-neo-xs inline-block font-nunito font-black text-black animate-pulse">
                            Hikayeler yükleniyor...
                        </div>
                    ) : (
                        <>
                            <div className="bg-cyber-yellow border-2 border-black/10 text-black rounded-xl shadow-neo-xs px-4 py-2 mb-6 inline-block rotate-2">
                                <span className="text-xs font-nunito font-black uppercase tracking-widest">
                                    <Sparkles className="inline w-4 h-4 mr-1" />
                                    {stories.length} hikaye hazır
                                </span>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startReading}
                                disabled={stories.length === 0}
                                className="w-full bg-cyber-green border-2 border-black/10 shadow-neo-md text-black text-lg sm:text-2xl py-4 rounded-2xl hover:-translate-y-1 hover:shadow-neo-md active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-2 font-nunito font-black uppercase tracking-widest disabled:opacity-50"
                            >
                                🎮 Oyuna Başla
                            </motion.button>
                        </>
                    )}

                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cyber-purple border-2 border-black/10 text-white rounded-xl shadow-neo-xs -rotate-2">
                        <span className="text-xs font-nunito font-black uppercase tracking-widest">
                            TUZÖ 6.3.1 Okuduğunu Anlama
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );

    return (
        <BrainTrainerShell
            engine={engine}
            feedback={feedback}
            config={{
                title: 'Hikaye Quiz',
                icon: BookOpenCheck,
                description: 'Hikaye oku, sorulara cevap ver, puan kazan!',
                howToPlay: [
                    'Rastgele bir hikaye okursun.',
                    'Hikaye hakkında sorulara cevap verirsin.',
                    'Hızlı okuma bonus puan kazandırır.',
                ],
                tuzoCode: 'TUZÖ 6.3.1 Okuduğunu Anlama',
                accentColor: 'cyber-purple',
                onRestart: handleRestart,
                maxLevel: MAX_LEVEL,
                customWelcome: WelcomeScreen,
                extraGameOverActions: (
                    <div className="space-y-3 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold uppercase tracking-widest text-xs mb-2">
                                    Doğru/Toplam
                                </p>
                                <p className="text-2xl sm:text-3xl font-black">
                                    <span className="text-cyber-green">{correctCount}</span>
                                    <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                                    <span className="text-black dark:text-white">{story?.questions.length || 0}</span>
                                </p>
                            </div>
                            <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold uppercase tracking-widest text-xs mb-2">
                                    Okuma Süresi
                                </p>
                                <p className="text-2xl sm:text-3xl font-black text-cyber-purple">
                                    {formatTime(readingTime)}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/stories')}
                            className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm text-black dark:text-white text-lg rounded-2xl hover:-translate-y-1 hover:shadow-neo-md active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-2 font-nunito font-black uppercase tracking-widest"
                        >
                            <Home size={20} className="stroke-[3]" />
                            Hikayelere Dön
                        </button>
                    </div>
                ),
            }}
        >
            {() => (
                <div className="w-full h-full flex flex-col items-center justify-start p-4">
                    <AnimatePresence mode="wait">
                        {engine.phase === 'playing' && story && (
                            <motion.div
                                key={`quiz-${currentQuestion}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="w-full max-w-3xl space-y-6"
                            >
                                {/* Progress */}
                                <div className="flex items-center justify-between">
                                    <span className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-xs font-nunito font-black text-black dark:text-white text-sm uppercase tracking-widest rotate-2">
                                        Soru {currentQuestion + 1} / {story.questions.length}
                                    </span>
                                    <span className="px-4 py-2 bg-cyber-yellow border-2 border-black/10 rounded-xl shadow-neo-xs font-nunito font-black text-black text-sm uppercase tracking-widest -rotate-2">
                                        📖 {story.title}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 border-2 border-black/10 shadow-neo-xs">
                                    <motion.div
                                        className="bg-cyber-green h-full rounded-full"
                                        initial={false}
                                        animate={{ width: `${((currentQuestion + 1) / story.questions.length) * 100}%` }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                    />
                                </div>

                                {/* Question Card */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border-2 border-black/10 shadow-neo-md -rotate-1">
                                    <h2 className="text-xl sm:text-2xl font-nunito font-black text-black dark:text-white mb-6">
                                        {story.questions[currentQuestion].text}
                                    </h2>

                                    <div className="space-y-3">
                                        {story.questions[currentQuestion].options.map((option, index) => {
                                            const isSelected = selectedAnswer === index;
                                            const isCorrectAnswer = index === story.questions[currentQuestion].correctAnswer;
                                            const showResult = selectedAnswer !== null;

                                            let btnClass = 'bg-slate-50 dark:bg-slate-700 border-black/10 hover:bg-cyber-yellow/20 hover:-translate-y-1 hover:shadow-neo-sm';
                                            if (showResult) {
                                                if (isCorrectAnswer) {
                                                    btnClass = 'bg-cyber-green border-black/10  translate-y-1 translate-x-1';
                                                } else if (isSelected) {
                                                    btnClass = 'bg-cyber-pink border-black/10  translate-y-1 translate-x-1';
                                                } else {
                                                    btnClass = 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 opacity-50';
                                                }
                                            }

                                            return (
                                                <motion.button
                                                    key={index}
                                                    whileHover={!showResult ? { scale: 1.02 } : {}}
                                                    whileTap={!showResult ? { scale: 0.98 } : {}}
                                                    onClick={() => handleAnswer(index)}
                                                    disabled={showResult}
                                                    className={`w-full p-4 rounded-2xl text-left border-4 shadow-neo-xs transition-all font-nunito font-bold text-black dark:text-white flex items-center gap-3 ${btnClass}`}
                                                >
                                                    <span className={`w-10 h-10 rounded-xl border-2 border-black/10 flex items-center justify-center font-black text-lg shrink-0 ${showResult && isCorrectAnswer ? 'bg-white' : showResult && isSelected ? 'bg-white' : 'bg-white dark:bg-slate-600'}`}>
                                                        {showResult && isCorrectAnswer ? (
                                                            <CheckCircle2 size={20} className="text-cyber-green stroke-[3]" />
                                                        ) : showResult && isSelected ? (
                                                            <XCircle size={20} className="text-cyber-pink stroke-[3]" />
                                                        ) : (
                                                            String.fromCharCode(65 + index)
                                                        )}
                                                    </span>
                                                    <span className="text-base sm:text-lg">{option}</span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Feedback Text */}
                                    {selectedAnswer !== null && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`mt-6 p-4 rounded-2xl border-2 border-black/10 shadow-neo-xs font-nunito font-bold ${selectedAnswer === story.questions[currentQuestion].correctAnswer ? 'bg-cyber-green/20 text-black dark:text-white' : 'bg-cyber-pink/20 text-black dark:text-white'}`}
                                        >
                                            <p>
                                                {selectedAnswer === story.questions[currentQuestion].correctAnswer
                                                    ? story.questions[currentQuestion].feedback.correct
                                                    : story.questions[currentQuestion].feedback.incorrect}
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </BrainTrainerShell>
    );
}
