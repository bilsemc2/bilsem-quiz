import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, RotateCcw, Play, Trophy, Sparkles,
    Heart, Star, Timer as TimerIcon, Zap, LucideIcon
} from 'lucide-react';
import { useSound } from '../../../hooks/useSound';
import { useGamePersistence } from '../../../hooks/useGamePersistence';
import { useExam } from '../../../contexts/ExamContext';
import GameFeedbackBanner from './GameFeedbackBanner';
import { useGameFeedback } from '../../../hooks/useGameFeedback';

// ─── Types ───────────────────────────────────────────────
export interface GameShellConfig {
    /** Unique game ID for persistence (e.g. 'parca-butun') */
    gameId: string;
    /** Display title */
    title: string;
    /** Icon component from lucide-react */
    icon: LucideIcon;
    /** Short description shown on welcome screen */
    description: string;
    /** How-to-play steps */
    howToPlay: string[];
    /** TUZÖ alignment code (e.g. 'TUZÖ 4.2.1') */
    tuzoCode?: string;
    /** Maximum level (default: 20) */
    maxLevel?: number;
    /** Initial lives (default: 5) */
    initialLives?: number;
    /** Time limit in seconds (default: 180) */
    timeLimit?: number;
    /** Gradient classes for the background */
    bgGradient?: string;
    /** Primary accent color name — used for gradient stops */
    accentFrom?: string;
    accentTo?: string;
}

export interface GameRenderProps {
    level: number;
    score: number;
    lives: number;
    phase: GamePhase;
    /** Call when user answers correctly */
    onCorrect: (bonusPoints?: number) => void;
    /** Call when user answers incorrectly */
    onIncorrect: () => void;
    /** Call to set up a new round (e.g. after level transition) */
    onSetupRound: () => void;
    /** Feedback banner state from useGameFeedback */
    feedbackState: ReturnType<typeof useGameFeedback>['feedbackState'];
    /** Show feedback (correct/incorrect) */
    showFeedback: ReturnType<typeof useGameFeedback>['showFeedback'];
    /** Dismiss feedback */
    dismissFeedback: ReturnType<typeof useGameFeedback>['dismissFeedback'];
}

export type GamePhase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface GameShellProps {
    config: GameShellConfig;
    /** Render function that receives game state and action callbacks */
    children: (props: GameRenderProps) => ReactNode;
}

// ─── Component ───────────────────────────────────────────────
const GameShell: React.FC<GameShellProps> = ({ config, children }) => {
    const {
        gameId, title, icon: Icon, description, howToPlay,
        tuzoCode, maxLevel = 20, initialLives = 5, timeLimit = 180,
        bgGradient = 'from-slate-950 via-indigo-950 to-slate-900',
        accentFrom = 'indigo-500', accentTo = 'purple-600',
    } = config;

    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<GamePhase>('welcome');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(initialLives);
    const [timeLeft, setTimeLeft] = useState(timeLimit);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || timeLimit;

    // ─── Handlers ───────────────────────────────────────
    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLevel(1);
        setLives(initialLives);
        setTimeLeft(examMode ? examTimeLimit : timeLimit);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        playSound('slide');
    }, [playSound, examMode, examTimeLimit, initialLives, timeLimit]);

    const onCorrect = useCallback((bonusPoints?: number) => {
        showFeedback(true);
        playSound('correct');
        setPhase('feedback');
        setTimeout(() => {
            dismissFeedback();
            const points = bonusPoints ?? (100 + level * 20);
            setScore(s => s + points);
            if (level >= maxLevel) {
                setPhase('victory');
            } else {
                setLevel(l => l + 1);
                setPhase('playing');
            }
        }, 1500);
    }, [level, maxLevel, playSound, showFeedback, dismissFeedback]);

    const onIncorrect = useCallback(() => {
        showFeedback(false);
        playSound('incorrect');
        setPhase('feedback');
        setTimeout(() => {
            dismissFeedback();
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) {
                    setTimeout(() => setPhase('game_over'), 500);
                } else {
                    setPhase('playing');
                }
                return nl;
            });
        }, 1500);
    }, [playSound, showFeedback, dismissFeedback]);

    // Auto-start for exam mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, phase, handleStart, examMode]);

    // Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    // Save result on finish
    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5 || phase === 'victory', score, maxLevel * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam");
            return;
        }
        await saveGamePlay({
            game_id: gameId,
            score_achieved: score,
            duration_seconds: duration,
            metadata: { level_reached: level, victory: phase === 'victory' }
        });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate, gameId, maxLevel]);

    useEffect(() => {
        if (phase === 'game_over' || phase === 'victory') handleFinish();
    }, [phase, handleFinish]);

    // ─── Helpers ───────────────────────────────────────
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // ─── Welcome Screen ────────────────────────────────
    if (phase === 'welcome') {
        return (
            <div className={`min-h-screen bg-gradient-to-br ${bgGradient} flex items-center justify-center p-6 text-white relative overflow-hidden`}>
                <div className="fixed inset-0 pointer-events-none">
                    <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-${accentFrom}/10 rounded-full blur-3xl animate-pulse`} />
                    <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-${accentTo}/10 rounded-full blur-3xl`} />
                </div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div
                        className={`w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-${accentFrom} to-${accentTo} rounded-[40%] flex items-center justify-center shadow-2xl`}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Icon size={52} className="text-white drop-shadow-lg" />
                    </motion.div>
                    <h1 className={`text-4xl font-black mb-4 bg-gradient-to-r from-${accentFrom.replace('500', '300')} to-${accentTo.replace('600', '300')} bg-clip-text text-transparent`}>
                        {title}
                    </h1>
                    <p className="text-slate-300 mb-8 text-lg">{description}</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className={`text-lg font-bold text-${accentFrom.replace('500', '300')} mb-3 flex items-center gap-2`}>
                            <Sparkles size={18} /> Nasıl Oynanır?
                        </h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            {howToPlay.map((step, i) => (
                                <li key={step} className="flex items-center gap-2">
                                    <span className={`w-5 h-5 bg-${accentFrom}/30 rounded-full flex items-center justify-center text-[10px]`}>{i + 1}</span>
                                    <span dangerouslySetInnerHTML={{ __html: step }} />
                                </li>
                            ))}
                        </ul>
                    </div>
                    {tuzoCode && (
                        <div className={`bg-${accentFrom}/10 text-${accentFrom.replace('500', '300')} text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-${accentFrom}/30 font-bold uppercase tracking-widest`}>
                            {tuzoCode}
                        </div>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        className={`px-10 py-5 bg-gradient-to-r from-${accentFrom} to-${accentTo} rounded-2xl font-bold text-xl shadow-2xl`}
                    >
                        <div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div>
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    // ─── Main Game Layout ──────────────────────────────
    return (
        <div className={`min-h-screen bg-gradient-to-br ${bgGradient} text-white relative overflow-hidden flex flex-col`}>
            {/* HUD */}
            <div className="relative z-10 p-4 pt-20 text-white">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} /><span>{backLabel}</span>
                    </Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                <Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                {Array.from({ length: initialLives }).map((_, i) => (
                                    <Heart key={`life-${i}`} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                <TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} />
                                <span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: `linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%)`, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                <Zap className="text-indigo-400" size={18} /><span className="font-bold text-indigo-400">Seviye {level}/{maxLevel}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Game Content or End Screens */}
            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                            {children({
                                level, score, lives, phase,
                                onCorrect, onIncorrect,
                                onSetupRound: () => { },
                                feedbackState, showFeedback, dismissFeedback,
                            })}
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div
                                className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-${accentFrom} to-${accentTo} rounded-[40%] flex items-center justify-center shadow-2xl`}
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className={`text-3xl font-black text-${accentFrom.replace('500', '400')} mb-2`}>
                                {phase === 'victory' || level >= 5 ? '🎖️ Harika!' : 'Tebrikler!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {phase === 'victory' || level >= 5
                                    ? 'Muhteşem bir performans seriledin!'
                                    : 'Daha fazla pratikle daha iyi olabilirsin.'}
                            </p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm font-bold">Skor</p>
                                        <p className="text-3xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm font-bold">Seviye</p>
                                        <p className={`text-3xl font-black text-${accentFrom.replace('500', '400')}`}>{level}/{maxLevel}</p>
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className={`px-10 py-5 bg-gradient-to-r from-${accentFrom} to-${accentTo} rounded-2xl font-bold text-xl mb-4 shadow-2xl`}
                            >
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default GameShell;
