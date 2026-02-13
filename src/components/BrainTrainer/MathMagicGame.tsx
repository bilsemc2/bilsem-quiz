import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    ChevronLeft, Zap, Heart, Sparkles, XCircle
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';
import { useSound } from '../../hooks/useSound';

// ============== TYPES ==============
type ColorInfo = {
    name: string;
    bgClass: string;
    textClass: string;
};

type GameCardData = {
    id: string;
    number: number;
    color: ColorInfo;
};

enum QuestionType {
    NUMBER = 'NUMBER',
    COLOR = 'COLOR',
    ADDITION = 'ADDITION',
    SUBTRACTION = 'SUBTRACTION'
}

type QuestionData = {
    type: QuestionType;
    text: string;
    answer: string | number;
    targetIndices: number[];
};

// ============== CONSTANTS ==============
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const COLORS: ColorInfo[] = [
    { name: 'Kırmızı', bgClass: 'bg-red-500', textClass: 'text-red-500' },
    { name: 'Mavi', bgClass: 'bg-blue-500', textClass: 'text-blue-500' },
    { name: 'Yeşil', bgClass: 'bg-green-500', textClass: 'text-green-500' },
    { name: 'Sarı', bgClass: 'bg-yellow-400', textClass: 'text-yellow-400' },
    { name: 'Mor', bgClass: 'bg-purple-500', textClass: 'text-purple-500' },
    { name: 'Turuncu', bgClass: 'bg-orange-500', textClass: 'text-orange-500' },
    { name: 'Pembe', bgClass: 'bg-pink-400', textClass: 'text-pink-400' },
];

const CARD_DISPLAY_TIME = 2000;
const CARD_SEQUENCE_DELAY = 1000;



type Phase = 'welcome' | 'showing' | 'questioning' | 'feedback' | 'game_over' | 'victory';

// ============== GAME CARD COMPONENT ==============
const GameCard: React.FC<{
    card: GameCardData;
    isVisible: boolean;
    isTarget?: boolean;
}> = ({ card, isVisible, isTarget = false }) => {
    return (
        <motion.div
            className={`perspective-1000 w-24 h-32 sm:w-32 sm:h-44 transition-all duration-500 ${isTarget ? 'scale-110 z-10' : ''}`}
            style={{ perspective: '1000px' }}
            animate={isTarget && !isVisible ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
        >
            <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isVisible ? 0 : 180 }}
                transition={{ duration: 0.6 }}
            >
                {/* Front Face */}
                <div
                    className={`absolute w-full h-full rounded-2xl border-4 border-white shadow-xl flex flex-col items-center justify-center ${card.color.bgClass}`}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <span className="text-white text-4xl sm:text-6xl font-black drop-shadow-lg">
                        {card.number}
                    </span>
                    <div className="mt-2 bg-white/20 px-2 py-0.5 rounded-full">
                        <p className="text-white font-bold text-xs uppercase">{card.color.name}</p>
                    </div>
                </div>

                {/* Back Face */}
                <div
                    className={`absolute w-full h-full rounded-2xl border-4 shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 ${isTarget ? 'border-amber-400' : 'border-white'}`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <img
                        src="/images/beyninikullan.webp"
                        alt="Kart arkası"
                        className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                    />
                    {isTarget && (
                        <motion.div
                            className="absolute -top-2 -right-2 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        >
                            <span className="text-sm">✨</span>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ============== MAIN COMPONENT ==============
const MathMagicGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();
    const { playSound } = useSound();
    const hasSavedRef = useRef(false);

    // Exam Mode
    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game State
    const [cards, setCards] = useState<GameCardData[]>([]);
    const [visibleIndices, setVisibleIndices] = useState<number[]>([]);
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [numberInput, setNumberInput] = useState('');


    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Back link
    const backLink = examMode ? '/atolyeler/sinav-simulasyonu' : '/atolyeler/bireysel-degerlendirme';

    // Timer
    useEffect(() => {
        if ((phase === 'showing' || phase === 'questioning') && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && (phase === 'showing' || phase === 'questioning')) {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Generate Question
    const generateQuestion = useCallback((currentCards: GameCardData[]) => {
        const types = Object.values(QuestionType);
        const type = types[Math.floor(Math.random() * types.length)];
        const cardIndex = Math.floor(Math.random() * currentCards.length);
        const targetCard = currentCards[cardIndex];

        let q: QuestionData;

        switch (type) {
            case QuestionType.COLOR:
                q = {
                    type,
                    text: `İşaretli kartın RENGİ neydi?`,
                    answer: targetCard.color.name,
                    targetIndices: [cardIndex]
                };
                break;
            case QuestionType.NUMBER:
                q = {
                    type,
                    text: `İşaretli kartın NUMARASI kaçtı?`,
                    answer: targetCard.number,
                    targetIndices: [cardIndex]
                };
                break;
            case QuestionType.ADDITION: {
                const idx2 = (cardIndex + 1) % currentCards.length;
                const card2 = currentCards[idx2];
                q = {
                    type,
                    text: `İşaretli kartların TOPLAMI kaçtır?`,
                    answer: targetCard.number + card2.number,
                    targetIndices: [cardIndex, idx2]
                };
                break;
            }
            case QuestionType.SUBTRACTION: {
                const idx2 = (cardIndex + 1) % currentCards.length;
                const card2 = currentCards[idx2];
                q = {
                    type,
                    text: `İşaretli kartların FARKI kaçtır?`,
                    answer: Math.abs(targetCard.number - card2.number),
                    targetIndices: [cardIndex, idx2]
                };
                break;
            }
            default:
                q = { type: QuestionType.NUMBER, text: 'Hata', answer: 0, targetIndices: [] };
        }

        setQuestion(q);
        setPhase('questioning');
    }, []);

    // Card sequence refs
    const cardSequenceRef = useRef<NodeJS.Timeout[]>([]);

    // Cleanup card sequence timeouts
    const clearCardSequence = useCallback(() => {
        cardSequenceRef.current.forEach(t => clearTimeout(t));
        cardSequenceRef.current = [];
    }, []);

    // Start New Round
    const startNewRound = useCallback(() => {
        clearCardSequence();

        const numCards = Math.min(2 + Math.floor(level / 3), 6);
        const newCards: GameCardData[] = Array.from({ length: numCards }).map(() => ({
            id: Math.random().toString(36).substr(2, 9),
            number: Math.floor(Math.random() * 21),
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));

        setCards(newCards);
        setVisibleIndices([]);
        setPhase('showing');
        setQuestion(null);
        setNumberInput('');

        // Sequential card reveal with proper timing
        let cumulativeDelay = 0;

        newCards.forEach((_, index) => {
            // Open card
            const openTimeout = setTimeout(() => {
                setVisibleIndices(prev => [...prev, index]);
            }, cumulativeDelay);
            cardSequenceRef.current.push(openTimeout);

            // Close card after CARD_DISPLAY_TIME
            const closeTimeout = setTimeout(() => {
                setVisibleIndices(prev => prev.filter(i => i !== index));
            }, cumulativeDelay + CARD_DISPLAY_TIME);
            cardSequenceRef.current.push(closeTimeout);

            cumulativeDelay += CARD_SEQUENCE_DELAY;
        });

        // Generate question after all cards have been shown and closed
        const totalSequenceTime = (newCards.length - 1) * CARD_SEQUENCE_DELAY + CARD_DISPLAY_TIME + 800;
        const questionTimeout = setTimeout(() => {
            generateQuestion(newCards);
        }, totalSequenceTime);
        cardSequenceRef.current.push(questionTimeout);

    }, [level, generateQuestion, clearCardSequence]);

    // Start Game
    const handleStart = useCallback(() => {
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startNewRound();
    }, [examMode, examTimeLimit, startNewRound]);

    // Auto Start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // Game Over
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        window.scrollTo(0, 0);
        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            const passed = level >= 5;
            await submitResult(passed, score, 1000, duration).then(() => {
                navigate("/atolyeler/sinav-simulasyonu/devam");
            });
            return;
        }

        await saveGamePlay({
            game_id: 'sayi-sihirbazi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives }
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    // Victory
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            await submitResult(true, score + 100, 1000, duration).then(() => {
                navigate("/atolyeler/sinav-simulasyonu/devam");
            });
            return;
        }

        await saveGamePlay({
            game_id: 'sayi-sihirbazi',
            score_achieved: score + 100,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true }
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // Handle Answer
    const handleAnswer = useCallback((userAnswer: string | number) => {
        const correct = String(userAnswer).toLowerCase() === String(question?.answer).toLowerCase();
        showFeedback(correct);

        setPhase('feedback');
        playSound(correct ? 'correct' : 'incorrect');

        setTimeout(() => {
            if (correct) {
                setScore(s => s + 10 * level);
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    setLevel(l => l + 1);
                    startNewRound();
                }
            } else {
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    startNewRound();
                }
            }
        }, 1500);
    }, [question, level, lives, playSound, handleVictory, handleGameOver, startNewRound]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ============== RENDER ==============
    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span>Geri</span>
                    </Link>

                    {(phase === 'showing' || phase === 'questioning' || phase === 'feedback') && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-xl">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={16} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-xl">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-xl">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">Lv.{level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {phase === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <span className="text-6xl">🧙‍♂️</span>
                            </motion.div>

                            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.9.1 Çalışma Belleği</span>
                            </div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                Sayı Sihirbazı
                            </h1>

                            <p className="text-slate-400 mb-8">
                                Kartları aklında tut, sonra soruları doğru cevapla! Renk, sayı ve matematik sihri bir arada.
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Sihire Başla!</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Game Board */}
                    {(phase === 'showing' || phase === 'questioning' || phase === 'feedback') && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-4xl"
                        >
                            {/* Cards */}
                            <div className="flex flex-wrap justify-center mb-8 gap-3 min-h-[200px]">
                                {cards.map((card, idx) => (
                                    <GameCard
                                        key={card.id}
                                        card={card}
                                        isVisible={visibleIndices.includes(idx) || phase === 'feedback'}
                                        isTarget={question?.targetIndices.includes(idx)}
                                    />
                                ))}
                            </div>

                            {/* Question Panel */}
                            {phase === 'questioning' && question && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 max-w-2xl mx-auto"
                                >
                                    <div className="flex items-center justify-center gap-3 mb-6">
                                        <Sparkles className="text-amber-400" size={28} />
                                        <h3 className="text-2xl font-bold text-center">{question.text}</h3>
                                        <Sparkles className="text-amber-400" size={28} />
                                    </div>

                                    {question.type === QuestionType.COLOR ? (
                                        <div className="flex flex-wrap justify-center gap-4">
                                            {COLORS.map((color, i) => (
                                                <motion.button
                                                    key={i}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleAnswer(color.name)}
                                                    className={`${color.bgClass} w-16 h-16 rounded-full border-4 border-white shadow-lg`}
                                                    title={color.name}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="mb-6 bg-white/10 w-full p-6 rounded-2xl text-center border border-white/20">
                                                <span className="text-4xl font-bold">{numberInput || '?'}</span>
                                            </div>
                                            <div className="grid grid-cols-5 gap-3 mb-4">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                                                    <motion.button
                                                        key={num}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => numberInput.length < 3 && setNumberInput(p => p + num)}
                                                        className="w-14 h-14 bg-white/10 border border-white/20 rounded-xl text-2xl font-bold hover:bg-white/20 transition-colors"
                                                    >
                                                        {num}
                                                    </motion.button>
                                                ))}
                                            </div>
                                            <div className="flex gap-4 w-full max-w-xs">
                                                <button
                                                    onClick={() => setNumberInput('')}
                                                    className="flex-1 bg-red-500/20 text-red-400 font-bold py-3 rounded-xl hover:bg-red-500/30 transition-colors"
                                                >
                                                    SİL
                                                </button>
                                                <button
                                                    onClick={() => numberInput && handleAnswer(Number(numberInput))}
                                                    disabled={!numberInput}
                                                    className={`flex-[2] py-3 rounded-xl font-bold transition-all ${numberInput ? 'bg-amber-500 text-white hover:bg-amber-400' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                                >
                                                    KONTROL ET!
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Feedback Overlay */}
                            <GameFeedbackBanner feedback={feedbackState} />
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center">
                                <XCircle size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-2xl font-bold text-emerald-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Dene</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Victory */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center"
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <p className="text-4xl font-bold text-amber-400">{score + 100}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MathMagicGame;

