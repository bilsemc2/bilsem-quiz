import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Star, Timer, CheckCircle2, XCircle, ChevronLeft, Zap, Target, AlertCircle, Heart, Eye } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useSound } from '../../hooks/useSound';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

type Phase = 'welcome' | 'playing' | 'game_over' | 'victory';
type GameMode = 'simple' | 'selective';
type RoundState = 'waiting' | 'ready' | 'go' | 'early' | 'result';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const COLORS = [
    { name: 'Yeşil', value: 'green', hex: '#10b981' },
    { name: 'Kırmızı', value: 'red', hex: '#ef4444' },
    { name: 'Mavi', value: 'blue', hex: '#3b82f6' },
    { name: 'Sarı', value: 'yellow', hex: '#eab308' },
];

interface ReactionTimeGameProps {
    examMode?: boolean;
}

const ReactionTimeGame: React.FC<ReactionTimeGameProps> = ({ examMode: examModeProp = false }) => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });

    const examMode = examModeProp || location.state?.examMode === true;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const [phase, setPhase] = useState<Phase>('welcome');
    const [gameMode, setGameMode] = useState<GameMode>('simple');
    const [roundState, setRoundState] = useState<RoundState>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [targetColor] = useState<string>('green');
    const [currentColor, setCurrentColor] = useState<string>('red');
    const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const roundStartTimeRef = useRef<number>(0);
    const reactionTimesRef = useRef<number[]>([]);
    const hasSavedRef = useRef<boolean>(false);

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        const avgReaction = reactionTimesRef.current.length > 0
            ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
            : 0;

        if (examMode) {
            const accuracy = correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
            const passed = accuracy >= 60 && correctCount >= 8;
            await submitResult(passed, score, 1000, durationSeconds);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }

        await saveGamePlay({
            game_id: 'tepki-suresi',
            score_achieved: score,
            duration_seconds: durationSeconds,
            metadata: {
                game_mode: gameMode,
                correct_count: correctCount,
                wrong_count: wrongCount,
                best_streak: bestStreak,
                average_reaction_ms: avgReaction,
                total_rounds: level,
                accuracy: correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0,
                game_name: 'Tepki Süresi',
            }
        });
    }, [level, score, correctCount, wrongCount, bestStreak, saveGamePlay, examMode, navigate, submitResult, gameMode]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        const avgReaction = reactionTimesRef.current.length > 0
            ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
            : 0;

        if (examMode) {
            await submitResult(true, score, 1000, durationSeconds);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }

        await saveGamePlay({
            game_id: 'tepki-suresi',
            score_achieved: score,
            duration_seconds: durationSeconds,
            metadata: {
                correct_count: correctCount,
                wrong_count: wrongCount,
                best_streak: bestStreak,
                average_reaction_ms: avgReaction,
                levels_completed: MAX_LEVEL,
                victory: true,
                game_name: 'Tepki Süresi',
            }
        });
    }, [score, correctCount, wrongCount, bestStreak, saveGamePlay, examMode, navigate, submitResult]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft, handleGameOver]);

    const startRound = useCallback(() => {
        setRoundState('waiting');
        setCurrentReactionTime(null);
        const waitTime = 1500 + Math.random() * 2500;
        timeoutRef.current = setTimeout(() => {
            setRoundState('ready');
            if (gameMode === 'selective') {
                const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
                setCurrentColor(randomColor.value);
            }
            timeoutRef.current = setTimeout(() => {
                setRoundState('go');
                roundStartTimeRef.current = performance.now();
            }, 200 + Math.random() * 300);
        }, waitTime);
    }, [gameMode]);

    const handleStart = useCallback((mode: GameMode = 'simple') => {
        window.scrollTo(0, 0);
        setGameMode(mode);
        setPhase('playing');
        setRoundState('waiting');
        setLevel(1);
        setScore(0);
        setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        setCorrectCount(0);
        setWrongCount(0);
        reactionTimesRef.current = [];
        setStreak(0);
        setBestStreak(0);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setTimeout(() => startRound(), 500);
    }, [startRound, examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart('simple');
        }
    }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    const handleClick = useCallback(() => {
        if (phase !== 'playing') return;

        if (roundState === 'waiting' || roundState === 'ready') {
            setRoundState('early');
            playSound('incorrect');
            showFeedback(false);
            setWrongCount(prev => prev + 1);
            setStreak(0);
            setLives(l => l - 1);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setTimeout(() => {
                dismissFeedback();
                if (lives <= 1) {
                    handleGameOver();
                } else if (level < MAX_LEVEL) {
                    setLevel(prev => prev + 1);
                    startRound();
                } else {
                    handleVictory();
                }
            }, 1200);
        } else if (roundState === 'go') {
            const reactionTime = performance.now() - roundStartTimeRef.current;
            setCurrentReactionTime(Math.round(reactionTime));
            if (gameMode === 'selective' && currentColor !== targetColor) {
                setRoundState('result');
                playSound('incorrect');
                showFeedback(false);
                setWrongCount(prev => prev + 1);
                setStreak(0);
                setLives(l => l - 1);
            } else {
                setRoundState('result');
                playSound('correct');
                showFeedback(true);
                setCorrectCount(prev => prev + 1);
                setStreak(prev => {
                    const newStreak = prev + 1;
                    if (newStreak > bestStreak) setBestStreak(newStreak);
                    return newStreak;
                });
                reactionTimesRef.current.push(Math.round(reactionTime));
                const timeScore = Math.max(0, 500 - Math.round(reactionTime));
                setScore(prev => prev + Math.round(timeScore / 2) + 50 + (streak * 10));
            }
            setTimeout(() => {
                dismissFeedback();
                const isCorrect = !(gameMode === 'selective' && currentColor !== targetColor);
                if (lives <= 1 && !isCorrect) {
                    handleGameOver();
                } else if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    setLevel(prev => prev + 1);
                    startRound();
                }
            }, 1200);
        }
    }, [phase, roundState, level, gameMode, currentColor, targetColor, startRound, lives, streak, bestStreak, playSound, showFeedback, dismissFeedback, handleGameOver, handleVictory]);

    const handleWait = useCallback(() => {
        if (phase !== 'playing' || gameMode !== 'selective' || roundState !== 'go') return;
        if (currentColor !== targetColor) {
            setRoundState('result');
            setCurrentReactionTime(null);
            playSound('correct');
            showFeedback(true);
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            setScore(prev => prev + 75 + (streak * 5));
            setTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    setLevel(prev => prev + 1);
                    startRound();
                }
            }, 1200);
        }
    }, [phase, gameMode, roundState, currentColor, targetColor, level, startRound, streak, bestStreak, playSound, showFeedback, dismissFeedback, handleVictory]);

    useEffect(() => {
        if (gameMode === 'selective' && roundState === 'go') {
            const timeout = setTimeout(() => {
                if (roundState === 'go') handleWait();
            }, 1500);
            return () => clearTimeout(timeout);
        }
    }, [gameMode, roundState, handleWait]);

    const averageReaction = reactionTimesRef.current.length > 0
        ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
        : 0;

    const accuracy = correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
    const bestReaction = reactionTimesRef.current.length > 0 ? Math.min(...reactionTimesRef.current) : 0;

    const getColorHex = (color: string) => {
        switch (color) {
            case 'green': return '#10b981';
            case 'red': return '#ef4444';
            case 'blue': return '#3b82f6';
            case 'yellow': return '#eab308';
            default: return '#10b981';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

                    {phase === 'playing' && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                <Star className="text-amber-400 fill-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                <Timer className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} />
                                <span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                <Target className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{level}/{MAX_LEVEL}</span>
                            </div>
                            {streak > 1 && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)', border: '1px solid rgba(251, 191, 36, 0.5)' }}>
                                    <Zap className="text-amber-400" size={18} />
                                    <span className="font-bold text-amber-400">x{streak}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                                <Zap size={52} className="text-white drop-shadow-lg" />
                            </motion.div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">⚡ Tepki Süresi</h1>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2"><Eye size={20} /> Mod Seç</h3>
                            </div>
                            <div className="space-y-4 mb-6 text-left">
                                <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleStart('simple')} className="w-full p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2)', border: '2px solid rgba(16, 185, 129, 0.5)' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)' }}><Zap size={28} className="text-white" /></div>
                                        <div><h3 className="text-xl font-bold text-emerald-300">Basit Tepki</h3><p className="text-slate-400 text-sm">Yeşil görünce hemen tıkla!</p></div>
                                    </div>
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleStart('selective')} className="w-full p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2)', border: '2px solid rgba(251, 191, 36, 0.5)' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)', boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)' }}><Target size={28} className="text-white" /></div>
                                        <div><h3 className="text-xl font-bold text-amber-300">Seçmeli Tepki</h3><p className="text-slate-400 text-sm">Sadece yeşile tıkla, diğerlerinde bekle!</p></div>
                                    </div>
                                </motion.button>
                            </div>
                            <div className="bg-amber-500/10 text-amber-300 text-xs px-4 py-2 rounded-full inline-block border border-amber-500/30">TUZÖ 8.1.1 Tepki Hızı</div>
                        </motion.div>
                    )}

                    {phase === 'playing' && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-xl">
                            {gameMode === 'selective' && (
                                <div className="rounded-2xl p-4 mb-4 flex items-center justify-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    <span className="text-slate-400">Hedef:</span>
                                    <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#10b981' }} />
                                    <span className="text-emerald-400 font-bold">YEŞİL</span>
                                </div>
                            )}
                            <motion.button onClick={handleClick} className="w-full aspect-video rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all" style={{ background: roundState === 'waiting' ? 'linear-gradient(135deg, #374151 0%, #1F2937 100%)' : roundState === 'ready' ? 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' : roundState === 'go' ? `linear-gradient(135deg, ${getColorHex(gameMode === 'selective' ? currentColor : 'green')} 0%, ${getColorHex(gameMode === 'selective' ? currentColor : 'green')}CC 100%)` : roundState === 'early' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'linear-gradient(135deg, #374151 0%, #1F2937 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.3)' }} whileHover={{ scale: roundState === 'go' ? 1.02 : 1 }} whileTap={{ scale: 0.98 }}>
                                {roundState === 'waiting' && <><Timer className="w-16 h-16 text-slate-400 mx-auto mb-4" /><p className="text-2xl font-bold text-slate-300">Bekle...</p></>}
                                {roundState === 'ready' && <><AlertCircle className="w-16 h-16 text-amber-900 mx-auto mb-4 animate-pulse" /><p className="text-2xl font-bold text-amber-900">Hazırlan!</p></>}
                                {roundState === 'go' && <><Zap className="w-20 h-20 text-white mx-auto mb-4" /><p className="text-4xl font-black text-white">{gameMode === 'selective' && currentColor !== targetColor ? 'BEKLEME!' : 'TIKLA!'}</p></>}
                                {roundState === 'early' && <><XCircle className="w-16 h-16 text-white mx-auto mb-4" /><p className="text-2xl font-bold text-white">Çok Erken!</p></>}
                                {roundState === 'result' && (
                                    <div className="text-center">
                                        {currentReactionTime !== null ? <><CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" /><p className="text-4xl font-black text-emerald-400">{currentReactionTime} ms</p></> : <><CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" /><p className="text-2xl font-bold text-emerald-400">Doğru Bekleme!</p></>}
                                    </div>
                                )}
                            </motion.button>
                            <div className="flex justify-center items-center gap-6 mt-6 text-sm text-slate-400">
                                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>{correctCount} Başarılı</span></div>
                                {bestReaction > 0 && <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /><span>En iyi: {bestReaction}ms</span></div>}
                            </div>
                        </motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ background: phase === 'victory' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={phase === 'victory' ? { y: [0, -10, 0], rotate: [0, 5, -5, 0] } : { rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}><Trophy size={52} className="text-white drop-shadow-lg" /></motion.div>
                            <h2 className="text-3xl font-black text-amber-300 mb-2">{phase === 'victory' ? '🎖️ Muhteşem Zafer!' : 'Oyun Bitti!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Tüm seviyeleri başarıyla tamamladın!' : accuracy >= 80 ? 'Harika tepki süresi!' : 'Biraz daha pratik yap!'}</p>
                            <div className="rounded-2xl p-6 mb-8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Ortalama</p><p className="text-2xl font-bold text-sky-400 font-mono">{averageReaction}ms</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">En İyi</p><p className="text-2xl font-bold text-emerald-400 font-mono">{bestReaction}ms</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Başarılı</p><p className="text-2xl font-bold text-purple-400">{correctCount}/{MAX_LEVEL}</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPhase('welcome')} className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4" style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)', boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(251, 191, 36, 0.4)' }}>
                                <div className="flex items-center justify-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default ReactionTimeGame;
