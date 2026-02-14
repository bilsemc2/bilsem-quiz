import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Target, ChevronLeft, Zap, Brain, Heart, Sparkles, Eye, Timer } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

type Phase = 'welcome' | 'playing' | 'game_over' | 'victory';

interface Round {
    word: string;
    textColor: string;
    correctAnswer: string;
    options: string[];
}

const COLORS = [
    { name: 'KIRMIZI', hex: '#FF6B6B', turkishName: 'Kırmızı' },
    { name: 'MAVİ', hex: '#4ECDC4', turkishName: 'Mavi' },
    { name: 'YEŞİL', hex: '#6BCB77', turkishName: 'Yeşil' },
    { name: 'SARI', hex: '#FFD93D', turkishName: 'Sarı' },
    { name: 'TURUNCU', hex: '#FFA500', turkishName: 'Turuncu' },
    { name: 'MOR', hex: '#9B59B6', turkishName: 'Mor' },
    { name: 'PEMBE', hex: '#FF9FF3', turkishName: 'Pembe' },
    { name: 'BEYAZ', hex: '#FFFFFF', turkishName: 'Beyaz' },
];

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

interface StroopGameProps {
    examMode?: boolean;
}

const StroopGame: React.FC<StroopGameProps> = ({ examMode: examModeProp = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });

    const examMode = examModeProp || location.state?.examMode === true;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const [phase, setPhase] = useState<Phase>('welcome');
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const roundStartTimeRef = useRef<number>(0);
    const reactionTimesRef = useRef<number[]>([]);
    const hasSavedRef = useRef<boolean>(false);

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const generateRound = useCallback((): Round => {
        const wordColorIndex = Math.floor(Math.random() * COLORS.length);
        const textColorIndex = Math.floor(Math.random() * COLORS.length);

        const word = COLORS[wordColorIndex].name;
        const textColor = COLORS[textColorIndex].hex;
        const correctAnswer = COLORS[textColorIndex].name;

        const wrongOptions = COLORS
            .filter(c => c.name !== correctAnswer)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(c => c.name);

        const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);

        return { word, textColor, correctAnswer, options };
    }, []);

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
            game_id: 'stroop-renk',
            score_achieved: score,
            duration_seconds: durationSeconds,
            metadata: {
                correct_count: correctCount,
                wrong_count: wrongCount,
                best_streak: bestStreak,
                average_reaction_ms: avgReaction,
                total_rounds: level,
                accuracy: correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0,
                game_name: 'Stroop Etkisi',
            }
        });
    }, [level, score, correctCount, wrongCount, bestStreak, saveGamePlay, examMode, navigate, submitResult]);

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
            game_id: 'stroop-renk',
            score_achieved: score,
            duration_seconds: durationSeconds,
            metadata: {
                correct_count: correctCount,
                wrong_count: wrongCount,
                best_streak: bestStreak,
                average_reaction_ms: avgReaction,
                levels_completed: MAX_LEVEL,
                victory: true,
                game_name: 'Stroop Etkisi',
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

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
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
        const round = generateRound();
        setCurrentRound(round);
        roundStartTimeRef.current = Date.now();
    }, [generateRound, examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, phase, handleStart, examMode]);

    const handleAnswer = useCallback((answer: string) => {
        if (!currentRound || feedbackState || phase !== 'playing') return;

        const reactionTime = Date.now() - roundStartTimeRef.current;
        reactionTimesRef.current.push(reactionTime);

        const isCorrect = answer === currentRound.correctAnswer;

        if (isCorrect) {
            showFeedback(true);
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            const timeBonus = Math.max(0, Math.floor((3000 - reactionTime) / 100));
            const streakBonus = streak * 10;
            setScore(prev => prev + 100 + timeBonus + streakBonus);
        } else {
            showFeedback(false);
            setWrongCount(prev => prev + 1);
            setStreak(0);
            setLives(prev => prev - 1);
        }

        setTimeout(() => {
            dismissFeedback();
            if (lives <= 1 && !isCorrect) {
                handleGameOver();
            } else if (level >= MAX_LEVEL && isCorrect) {
                handleVictory();
            } else {
                if (isCorrect) setLevel(prev => prev + 1);
                const round = generateRound();
                setCurrentRound(round);
                roundStartTimeRef.current = Date.now();
            }
        }, 1200);
    }, [currentRound, level, streak, bestStreak, generateRound, feedbackState, lives, phase, handleGameOver, handleVictory, showFeedback, dismissFeedback]);

    const averageReactionTime = reactionTimesRef.current.length > 0
        ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
        : 0;

    const accuracy = correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-fuchsia-950 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

                    {phase === 'playing' && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.1)]">
                                <Star className="text-amber-400 fill-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.1)]">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />
                                ))}
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.1)]">
                                <Timer className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} />
                                <span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.1)]">
                                <Target className="text-purple-400" size={18} />
                                <span className="font-bold text-purple-400">{level}/{MAX_LEVEL}</span>
                            </div>

                            {streak > 1 && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/20 border border-pink-500/30 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.1)]">
                                    <Zap className="text-pink-400" size={18} />
                                    <span className="font-bold text-pink-400">x{streak}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)] bg-gradient-to-br from-purple-500 to-purple-600 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)]" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                                <Brain size={52} className="text-white drop-shadow-lg" />
                            </motion.div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">🧠 Stroop Etkisi</h1>
                            <div className="rounded-2xl p-5 mb-6 bg-white/5 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.2)] border border-white/10">
                                <p className="text-slate-400 text-sm mb-3">Örnek:</p>
                                <p className="text-4xl font-black mb-2" style={{ color: '#FF6B6B' }}>MAVİ</p>
                                <p className="text-slate-400 text-sm">Doğru cevap: <span className="text-red-400 font-bold">KIRMIZI</span> (yazının rengi)</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-pink-400" /><span>Kelimenin ne yazdığına değil, <strong>rengine</strong> bak!</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-pink-400" /><span>Hızlı ve doğru cevapla yüksek puan kazan</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-pink-400" /><span>5 can hakkın var, dikkatli ol!</span></li>
                                </ul>
                            </div>
                            <div className="bg-purple-500/10 text-purple-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-purple-500/30">TUZÖ 5.2.1 Seçici Dikkat</div>
                            <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2),inset_0_4px_8px_rgba(255,255,255,0.2),0_8px_24px_rgba(168,85,247,0.4)]">
                                <div className="flex items-center gap-3"><Play size={24} fill="currentColor" /><span>Oyuna Başla</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {phase === 'playing' && currentRound && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md">
                            <p className="text-center text-slate-400 text-sm mb-4">Yazının rengini seç!</p>
                            <AnimatePresence mode="wait">
                                <motion.div key={level} initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -20 }} className="text-center mb-8">
                                    <div className="rounded-3xl p-8 bg-white/5 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.2)] border border-white/10">
                                        <motion.h2 className="text-6xl font-black" style={{ color: currentRound.textColor }} animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>{currentRound.word}</motion.h2>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                            <div className="grid grid-cols-2 gap-3">
                                {currentRound.options.map((option) => (
                                    <motion.button key={option} whileHover={!feedbackState ? { scale: 0.98, y: -2 } : {}} whileTap={!feedbackState ? { scale: 0.95 } : {}} onClick={() => handleAnswer(option)} disabled={feedbackState !== null} className="py-5 px-4 text-xl font-bold rounded-[25%] transition-all" style={{ background: feedbackState && option === currentRound.correctAnswer ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)', border: feedbackState && option === currentRound.correctAnswer ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.1)', cursor: feedbackState ? 'default' : 'pointer', opacity: feedbackState && option !== currentRound.correctAnswer ? 0.5 : 1 }}>
                                        {option}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="gameover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" style={{ background: phase === 'victory' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={phase === 'victory' ? { y: [0, -10, 0], rotate: [0, 5, -5, 0] } : { rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}><Trophy size={52} className="text-white drop-shadow-lg" /></motion.div>
                            <h2 className="text-3xl font-black text-amber-300 mb-2">{phase === 'victory' ? '🎖️ Muhteşem Zafer!' : 'Oyun Bitti!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Tüm seviyeleri başarıyla tamamladın!' : accuracy >= 80 ? 'Harika bir dikkat performansı!' : 'Biraz daha pratik yap!'}</p>
                            <div className="rounded-2xl p-6 mb-8 bg-white/5 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.2)] border border-white/10">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-3xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Doğruluk</p><p className="text-3xl font-bold text-emerald-400">%{accuracy}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Ort. Tepki</p><p className="text-3xl font-bold text-blue-400">{averageReactionTime}ms</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">En İyi Seri</p><p className="text-3xl font-bold text-pink-400">x{bestStreak}</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4 bg-gradient-to-br from-purple-500 to-purple-600 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2),inset_0_4px_8px_rgba(255,255,255,0.2),0_8px_24px_rgba(168,85,247,0.4)]">
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

export default StroopGame;
