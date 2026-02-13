import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, Play, Star, Timer,
    Zap, Heart, Grid3X3, Eye, EyeOff, Sparkles, Brain
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ─── Platform Standards ─────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'memorize' | 'hidden' | 'question' | 'feedback' | 'game_over' | 'victory';

interface CellData {
    gridIndex: number; // 0-8 arası 3x3 grid'deki konumu
    value: number;     // Gösterilen sayı
}

interface QuestionData {
    text: string;
    answer: number;
    options: number[];
}

// ─── Soru Üretici ───────────────────────────────────
function generateQuestion(cells: CellData[], level: number): QuestionData {
    const posName = (idx: number) => `${idx + 1}. kutu`;

    const questionTypes = [
        // Tip 1: Belirli kutudaki sayı
        () => {
            const cell = cells[Math.floor(Math.random() * cells.length)];
            return { text: `${posName(cell.gridIndex)}'da hangi sayı var?`, answer: cell.value };
        },
        // Tip 2: Belirli sayının kutusu
        () => {
            const cell = cells[Math.floor(Math.random() * cells.length)];
            return { text: `${cell.value} sayısı kaçıncı kutuda?`, answer: cell.gridIndex + 1 };
        },
        // Tip 3: En büyük sayının kutusu
        () => {
            const maxCell = [...cells].sort((a, b) => b.value - a.value)[0];
            return { text: `En büyük sayı kaçıncı kutuda?`, answer: maxCell.gridIndex + 1 };
        },
        // Tip 4: En küçük sayının kutusu
        () => {
            const minCell = [...cells].sort((a, b) => a.value - b.value)[0];
            return { text: `En küçük sayı kaçıncı kutuda?`, answer: minCell.gridIndex + 1 };
        },
    ];

    // Level 5+ iki sayının toplamı
    if (level >= 5 && cells.length >= 2) {
        questionTypes.push(() => {
            const shuffled = [...cells].sort(() => Math.random() - 0.5);
            const c1 = shuffled[0], c2 = shuffled[1];
            return {
                text: `${posName(c1.gridIndex)} + ${posName(c2.gridIndex)} toplamı?`,
                answer: c1.value + c2.value,
            };
        });
    }

    // Level 10+ fark sorusu
    if (level >= 10 && cells.length >= 2) {
        questionTypes.push(() => {
            const shuffled = [...cells].sort(() => Math.random() - 0.5);
            const c1 = shuffled[0], c2 = shuffled[1];
            const bigger = Math.max(c1.value, c2.value);
            const smaller = Math.min(c1.value, c2.value);
            return {
                text: `${posName(c1.gridIndex)} ile ${posName(c2.gridIndex)} farkı?`,
                answer: bigger - smaller,
            };
        });
    }

    const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const q = randomType();

    // 4 seçenek üret
    const opts = new Set([q.answer]);
    let attempts = 0;
    while (opts.size < 4 && attempts < 50) {
        const offset = Math.floor(Math.random() * 8) - 4;
        const fake = q.answer + (offset === 0 ? 1 : offset);
        if (fake > 0) opts.add(fake);
        attempts++;
    }
    // Fallback
    while (opts.size < 4) opts.add(q.answer + opts.size);

    return {
        text: q.text,
        answer: q.answer,
        options: [...opts].sort(() => Math.random() - 0.5),
    };
}

// ─── Hücre Üretici ──────────────────────────────────
function generateCells(level: number): CellData[] {
    const cellCount = Math.min(7, 3 + Math.floor((level - 1) / 3)); // 3→7 hücre
    const maxNumber = Math.min(30, 9 + level * 2);                  // Sayı aralığı artar

    const allIndices = Array.from({ length: 9 }, (_, i) => i);
    const shuffledIndices = allIndices.sort(() => Math.random() - 0.5);
    const selectedIndices = shuffledIndices.slice(0, cellCount);

    const usedValues = new Set<number>();
    return selectedIndices.map(gridIndex => {
        let value: number;
        do {
            value = Math.floor(Math.random() * maxNumber) + 1;
        } while (usedValues.has(value));
        usedValues.add(value);
        return { gridIndex, value };
    });
}

// ─── Ezberleme süresi (level arttıkça azalır) ──────
function getMemorizeTime(level: number): number {
    return Math.max(1500, 4000 - (level - 1) * 150);
}

// ─── Component ──────────────────────────────────────
const MatrixEchoGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();

    // examMode — location.state'ten okunur
    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    // Feedback — ref-based callback to avoid declaration order issues
    const feedbackEndRef = useRef<(correct: boolean) => void>(() => { });

    const { feedbackState, showFeedback } = useGameFeedback({
        onFeedbackEnd: (correct: boolean) => feedbackEndRef.current(correct),
    });

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game-specific state
    const [cells, setCells] = useState<CellData[]>([]);
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
    const livesRef = useRef(INITIAL_LIVES);
    const levelRef = useRef(1);

    // Back link
    const backLink = location.state?.arcadeMode ? '/bilsem-zeka' : '/atolyeler/bireysel-degerlendirme';
    const backLabel = location.state?.arcadeMode ? 'Arcade' : 'Geri';

    // ─── Global Timer ───────────────────────────────
    useEffect(() => {
        if ((phase === 'memorize' || phase === 'hidden' || phase === 'question') && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && (phase === 'memorize' || phase === 'hidden' || phase === 'question')) {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // ─── Body Scroll Lock ───────────────────────────
    useEffect(() => {
        const isActive = phase !== 'welcome';
        if (isActive) {
            window.scrollTo(0, 0);
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            document.documentElement.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.documentElement.style.overflow = '';
        };
    }, [phase]);

    // ─── Start Round: Generate cells + show them ────
    const startRound = useCallback((lvl: number) => {
        const newCells = generateCells(lvl);
        setCells(newCells);
        setQuestion(null);
        setSelectedAnswer(null);
        setPhase('memorize');

        // Ezberleme süresi sonrası gizle
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = setTimeout(() => {
            setPhase('hidden');
            // Kısa geçiş → soru sor
            phaseTimerRef.current = setTimeout(() => {
                setQuestion(generateQuestion(newCells, lvl));
                setPhase('question');
            }, 600);
        }, getMemorizeTime(lvl));
    }, []);

    // Cleanup phase timers
    useEffect(() => {
        return () => { if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current); };
    }, []);

    // ─── Start Game ─────────────────────────────────
    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('memorize');
        setScore(0);
        setLives(INITIAL_LIVES);
        livesRef.current = INITIAL_LIVES;
        setLevel(1);
        levelRef.current = 1;
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startRound(1);
    }, [examMode, examTimeLimit, startRound]);

    // ─── Auto-start ─────────────────────────────────
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // ─── Handle Answer ──────────────────────────────
    const handleAnswer = useCallback((selected: number) => {
        if (phase !== 'question' || feedbackState || !question) return;

        setSelectedAnswer(selected);
        const isCorrect = selected === question.answer;
        showFeedback(isCorrect);
        setPhase('feedback');

        if (isCorrect) {
            setScore(prev => prev + (levelRef.current * 100) + (timeLeft > 0 ? 50 : 0));
        } else {
            const newLives = livesRef.current - 1;
            livesRef.current = newLives;
            setLives(newLives);
        }
    }, [phase, feedbackState, question, showFeedback, timeLeft]);

    // ─── Game Over ──────────────────────────────────
    const handleGameOver = useCallback(() => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            (async () => {
                await submitResult(level >= 5, score, 1000, duration);
                navigate('/atolyeler/sinav-simulasyonu/devam');
            })();
            return;
        }

        saveGamePlay({
            game_id: 'matris-yankisi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    // ─── Victory ────────────────────────────────────
    const handleVictory = useCallback(() => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            (async () => {
                await submitResult(true, score, 1000, duration);
                navigate('/atolyeler/sinav-simulasyonu/devam');
            })();
            return;
        }

        saveGamePlay({
            game_id: 'matris-yankisi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // ─── Wire up feedback end to round transitions ──
    feedbackEndRef.current = (correct: boolean) => {
        const currentLives = livesRef.current;
        const currentLevel = levelRef.current;

        if (!correct && currentLives <= 0) {
            handleGameOver();
            return;
        }

        if (correct && currentLevel >= MAX_LEVEL) {
            handleVictory();
            return;
        }

        const nextLevel = correct ? currentLevel + 1 : currentLevel;
        if (correct) {
            levelRef.current = nextLevel;
            setLevel(nextLevel);
        }
        startRound(nextLevel);
    };

    // ─── Format Time ────────────────────────────────
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ─── Render ─────────────────────────────────────
    const isPlaying = phase === 'memorize' || phase === 'hidden' || phase === 'question' || phase === 'feedback';

    return (
        <div
            className={`min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 text-white ${isPlaying ? 'overflow-hidden h-screen' : ''}`}
            style={isPlaying ? { touchAction: 'none', overscrollBehavior: 'none' } : {}}
        >
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 pt-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-3">
                    <Link
                        to={backLink}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

                    {isPlaying && (
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Score */}
                            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-3 py-2 rounded-xl">
                                <Star className="text-amber-400 fill-amber-400" size={16} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>

                            {/* Lives */}
                            <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-xl">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={14}
                                        className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'}
                                    />
                                ))}
                            </div>

                            {/* Timer */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${timeLeft <= 30
                                ? 'bg-red-500/20 border-red-500/30'
                                : 'bg-blue-500/20 border-blue-500/30'
                                }`}>
                                <Timer className={timeLeft <= 30 ? 'text-red-400' : 'text-blue-400'} size={16} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 rounded-xl">
                                <Zap className="text-emerald-400" size={16} />
                                <span className="font-bold text-emerald-400 text-sm">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* ───── Welcome Screen ───── */}
                    {phase === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)',
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Grid3X3 size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                🧩 Matris Yankısı
                            </h1>

                            {/* Nasıl Oynanır */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-teal-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-cyan-400 flex-shrink-0" />
                                        <span>3x3 matristeki <strong>sayıları ezberle</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-cyan-400 flex-shrink-0" />
                                        <span>Kutular kapandıktan sonra <strong>soruyu cevapla</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-cyan-400 flex-shrink-0" />
                                        <span>Her doğru cevap seni bir sonraki seviyeye taşır!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap justify-center gap-3 mb-6">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={14} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={14} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Zap className="text-emerald-400" size={14} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full">
                                <span className="text-[9px] font-black text-teal-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-teal-400">5.9.2 Görsel Çalışma Belleği</span>
                            </div>

                            <br />

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(20, 184, 166, 0.4)',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ───── Game Board ───── */}
                    {(phase === 'memorize' || phase === 'hidden' || phase === 'question' || phase === 'feedback') && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex flex-col items-center gap-6"
                        >
                            {/* Status Message */}
                            <div className={`rounded-2xl px-6 py-3 text-center border-2 ${phase === 'memorize' ? 'border-teal-500/50' :
                                phase === 'hidden' ? 'border-purple-500/50' :
                                    'border-cyan-500/50'
                                }`}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                }}
                            >
                                {phase === 'memorize' && (
                                    <div className="flex items-center gap-3 text-teal-400 font-bold">
                                        <Eye className="animate-pulse" size={20} />
                                        <span>Sayıları Ezberle!</span>
                                    </div>
                                )}
                                {phase === 'hidden' && (
                                    <div className="flex items-center gap-3 text-purple-400 font-bold">
                                        <EyeOff size={20} />
                                        <span>Sayılar Gizleniyor...</span>
                                    </div>
                                )}
                                {(phase === 'question' || phase === 'feedback') && (
                                    <div className="flex items-center gap-3 text-cyan-400 font-bold">
                                        <Brain size={20} />
                                        <span>Hatırla ve Cevapla!</span>
                                    </div>
                                )}
                            </div>

                            {/* 3x3 Matrix */}
                            <div
                                className="grid grid-cols-3 gap-3 p-4 rounded-3xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                {Array.from({ length: 9 }).map((_, idx) => {
                                    const cell = cells.find(c => c.gridIndex === idx);
                                    const showNumber = phase === 'memorize' ||
                                        (phase === 'feedback' && feedbackState);

                                    return (
                                        <motion.div
                                            key={idx}
                                            className="w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-[25%] flex items-center justify-center relative"
                                            animate={
                                                phase === 'memorize' && cell
                                                    ? { scale: [1, 1.02, 1] }
                                                    : {}
                                            }
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            style={{
                                                background: cell
                                                    ? showNumber
                                                        ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.4) 0%, rgba(13, 148, 136, 0.3) 100%)'
                                                        : 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0.2) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                                boxShadow: cell
                                                    ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)'
                                                    : 'inset 0 -3px 6px rgba(0,0,0,0.2)',
                                                border: cell
                                                    ? showNumber
                                                        ? '2px solid rgba(20, 184, 166, 0.5)'
                                                        : '2px solid rgba(99, 102, 241, 0.3)'
                                                    : '1px solid rgba(255,255,255,0.08)',
                                            }}
                                        >
                                            {cell && (
                                                <AnimatePresence mode="wait">
                                                    {showNumber ? (
                                                        <motion.span
                                                            key="number"
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            className="text-3xl sm:text-4xl font-black text-white"
                                                        >
                                                            {cell.value}
                                                        </motion.span>
                                                    ) : (
                                                        <motion.span
                                                            key="hidden"
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            className="text-2xl"
                                                        >
                                                            ❓
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                            )}

                                            {/* Position Number */}
                                            <div className="absolute top-1 right-1.5 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-white/40">{idx + 1}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Question + Options */}
                            {(phase === 'question' || phase === 'feedback') && question && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full max-w-md space-y-4"
                                >
                                    <div
                                        className="rounded-2xl p-4 text-center"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                        }}
                                    >
                                        <h3 className="text-lg sm:text-xl font-bold text-white">{question.text}</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {question.options.map((opt, i) => {
                                            const isCorrect = opt === question.answer;
                                            const isSelected = selectedAnswer === opt;
                                            const showResult = phase === 'feedback';

                                            let bgStyle = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)';
                                            let borderStyle = '1px solid rgba(255,255,255,0.1)';
                                            let opacity = 1;

                                            if (showResult) {
                                                if (isCorrect) {
                                                    bgStyle = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                                                    borderStyle = '2px solid #10B981';
                                                } else if (isSelected && !isCorrect) {
                                                    bgStyle = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
                                                    borderStyle = '2px solid #EF4444';
                                                } else {
                                                    opacity = 0.4;
                                                }
                                            }

                                            return (
                                                <motion.button
                                                    key={i}
                                                    whileHover={!feedbackState ? { scale: 1.03 } : {}}
                                                    whileTap={!feedbackState ? { scale: 0.95 } : {}}
                                                    onClick={() => handleAnswer(opt)}
                                                    disabled={phase === 'feedback'}
                                                    className="py-5 text-xl sm:text-2xl font-bold rounded-2xl transition-all min-h-[80px]"
                                                    style={{
                                                        background: bgStyle,
                                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                                        border: borderStyle,
                                                        cursor: phase === 'feedback' ? 'default' : 'pointer',
                                                        opacity,
                                                    }}
                                                >
                                                    {opt}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ───── Game Over ───── */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)',
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Grid3X3 size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-red-400 mb-2">Oyun Bitti!</h2>
                            <p className="text-slate-400 mb-6">
                                {level >= 10 ? 'Harika bir performanstı! 🎉' : level >= 5 ? 'İyi iş! 💪' : 'Tekrar deneyelim! 🧠'}
                            </p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-3xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-3xl font-bold text-teal-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(20, 184, 166, 0.4)',
                                }}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>

                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">
                                Geri Dön
                            </Link>
                        </motion.div>
                    )}

                    {/* ───── Victory ───── */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)',
                                }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <p className="text-slate-400 mb-6">Tüm {MAX_LEVEL} seviyeyi tamamladın!</p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(245, 158, 11, 0.4)',
                                }}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>

                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">
                                Geri Dön
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Banner */}
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default MatrixEchoGame;
