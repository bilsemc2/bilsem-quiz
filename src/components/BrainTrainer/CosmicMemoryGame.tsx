import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, RotateCcw, Trophy,
    Star, Zap, Brain, Eye, Heart, Timer as TimerIcon, Play,
    Sparkles
} from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type GameMode = 'NORMAL' | 'REVERSE';
// Phase is managed via GameState.status

interface GameState {
    level: number;
    score: number;
    sequence: number[];
    userSequence: number[];
    isDisplaying: number | null;
    status: 'WAITING' | 'DISPLAYING' | 'INPUT' | 'SUCCESS' | 'FAILURE' | 'GAMEOVER' | 'VICTORY';
    gridSize: number;
    mode: GameMode;
}

const CosmicMemoryGame: React.FC = () => {
    const { playSound } = useSound();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();

    const [gameStarted, setGameStarted] = useState(false);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const [state, setState] = useState<GameState>({
        level: 1,
        score: 0,
        sequence: [],
        userSequence: [],
        isDisplaying: null,
        status: 'WAITING',
        gridSize: 3,
        mode: 'NORMAL'
    });
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(examMode ? examTimeLimit : TIME_LIMIT);

    const generateSequence = useCallback((level: number, size: number) => {
        const length = 2 + Math.floor(level / 2.5); // Difficulty curve
        const newSequence = [];
        for (let i = 0; i < length; i++) {
            newSequence.push(Math.floor(Math.random() * (size * size)));
        }
        return newSequence;
    }, []);

    const startLevel = useCallback(() => {
        const gridSize = state.level <= 5 ? 3 : state.level <= 12 ? 4 : 5;
        const newSequence = generateSequence(state.level, gridSize);
        const mode: GameMode = state.level > 7 ? (Math.random() > 0.5 ? 'REVERSE' : 'NORMAL') : 'NORMAL';

        setState(prev => ({
            ...prev,
            sequence: newSequence,
            userSequence: [],
            isDisplaying: null,
            status: 'DISPLAYING',
            gridSize,
            mode
        }));
    }, [state.level, generateSequence]);

    useEffect(() => {
        if (state.status === 'DISPLAYING') {
            let i = 0;
            const displayTime = Math.max(400, 1000 - state.level * 40);
            const pauseTime = Math.max(200, 400 - state.level * 20);

            const interval = setInterval(() => {
                if (i >= state.sequence.length) {
                    clearInterval(interval);
                    setState(prev => ({ ...prev, status: 'INPUT', isDisplaying: null }));
                    return;
                }

                const currentIdx = state.sequence[i];
                setState(prev => ({ ...prev, isDisplaying: currentIdx }));
                playSound('pop');

                setTimeout(() => {
                    setState(prev => ({ ...prev, isDisplaying: null }));
                }, displayTime);

                i++;
            }, displayTime + pauseTime);
            return () => clearInterval(interval);
        }
    }, [state.status, state.sequence, playSound, state.level]);

    const handleCellClick = (idx: number) => {
        if (state.status !== 'INPUT' || state.isDisplaying !== null) return;

        const nextUserSequence = [...state.userSequence, idx];
        const currentStep = state.userSequence.length;

        let isCorrect = false;
        if (state.mode === 'NORMAL') {
            isCorrect = state.sequence[currentStep] === idx;
        } else {
            isCorrect = state.sequence[state.sequence.length - 1 - currentStep] === idx;
        }

        if (isCorrect) {
            playSound('pop');
            setState(prev => ({ ...prev, userSequence: nextUserSequence }));

            if (nextUserSequence.length === state.sequence.length) {
                playSound('correct');
                showFeedback(true);
                setTimeout(() => {
                    dismissFeedback();
                    if (state.level >= MAX_LEVEL) {
                        setState(prev => ({ ...prev, status: 'VICTORY', score: prev.score + prev.level * 50 }));
                    } else {
                        setState(prev => ({
                            ...prev,
                            status: 'SUCCESS',
                            score: prev.score + (state.level * 10),
                            level: prev.level + 1
                        }));
                    }
                }, 1000);
            }
        } else {
            playSound('incorrect');
            showFeedback(false);
            setLives(l => {
                const newLives = l - 1;
                setTimeout(() => {
                    dismissFeedback();
                    if (newLives <= 0) {
                        setState(prev => ({ ...prev, status: 'GAMEOVER' }));
                    } else {
                        setState(prev => ({ ...prev, status: 'WAITING' }));
                    }
                }, 1000);
                return newLives;
            });
        }
    };

    useEffect(() => {
        if (gameStarted && (state.status === 'WAITING' || state.status === 'SUCCESS')) {
            startLevel();
        }
    }, [gameStarted, state.status, startLevel]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setState({
            level: 1,
            score: 0,
            sequence: [],
            userSequence: [],
            isDisplaying: null,
            status: 'WAITING',
            gridSize: 3,
            mode: 'NORMAL'
        });
        setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setGameStarted(true);
    }, [examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && !gameStarted) handleStart();
    }, [location.state, examMode, gameStarted, handleStart]);

    useEffect(() => {
        if (!gameStarted || state.status === 'GAMEOVER' || state.status === 'VICTORY') return;
        const timer = setInterval(() => {
            setTimeLeft((prev: number) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setState(p => ({ ...p, status: 'GAMEOVER' }));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, state.status]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        const isVictory = state.status === 'VICTORY';

        if (examMode) {
            await submitResult(isVictory || state.level >= 5, state.score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam");
            return;
        }

        await saveGamePlay({
            game_id: 'kozmik-hafiza',
            score_achieved: state.score,
            duration_seconds: duration,
            metadata: { level_reached: state.level, game_name: 'Kozmik Hafıza', victory: isVictory }
        });
    }, [state.status, state.score, state.level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => {
        if (state.status === 'GAMEOVER' || state.status === 'VICTORY') handleFinish();
    }, [state.status, handleFinish]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
                </div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Star size={52} className="text-white fill-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">Kozmik Hafıza</h1>
                    <p className="text-slate-300 mb-8 text-lg">Yıldızların sırasını hatırla! Parlayan ışıkları takip et ve hafızanı kanıtla.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>Parlayan yıldızların sırasını dikkatle izle</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>NORMAL modda aynı sırada, REVERSE modda ters sırada tıkla</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>20 seviyeyi tamamlayarak şampiyon ol!</span></li>
                        </ul>
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30 font-bold uppercase tracking-widest">TUZÖ 5.4.2 Görsel Kısa Süreli Bellek</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl shadow-[0_8px_32px_rgba(99,102,241,0.4)]"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white relative overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(state.status !== 'GAMEOVER' && state.status !== 'VICTORY') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{state.score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-400/20 border border-violet-400/30"><Zap className="text-purple-400" size={18} /><span className="font-bold text-purple-400">{state.level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {(state.status !== 'GAMEOVER' && state.status !== 'VICTORY') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className={`mb-8 flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-xl shadow-2xl ${state.status === 'DISPLAYING' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>{state.status === 'DISPLAYING' ? <><Eye size={24} /> TAKİP ET!</> : <><Brain size={24} /> {state.mode === 'REVERSE' ? 'TERS SIRAYLA TIKLA!' : 'AYNI SIRAYLA TIKLA!'}</>}</motion.div>
                            <div className="grid gap-4 p-8 bg-white/5 backdrop-blur-2xl rounded-[48px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.4)]" style={{ gridTemplateColumns: `repeat(${state.gridSize}, 1fr)`, width: 'min(90vw, 450px)' }}>
                                {Array.from({ length: state.gridSize * state.gridSize }).map((_, idx) => {
                                    const isActive = state.isDisplaying === idx;
                                    const isClicked = state.userSequence.includes(idx);
                                    return (<motion.button key={idx} whileHover={state.status === 'INPUT' ? { scale: 1.05 } : {}} whileTap={state.status === 'INPUT' ? { scale: 0.95 } : {}} onClick={() => handleCellClick(idx)} className="aspect-square rounded-2xl relative overflow-hidden transition-all duration-300" style={{ background: isActive ? 'linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)' : isClicked ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)', boxShadow: isActive ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.4), 0 0 40px rgba(129, 140, 248, 0.6)' : 'inset 0 4px 8px rgba(255,255,255,0.05), inset 0 -4px 8px rgba(0,0,0,0.2)', border: isActive ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)' }}><AnimatePresence>{(isActive || isClicked) && (<motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="flex items-center justify-center w-full h-full"><Star size={state.gridSize === 3 ? 48 : 32} className={isActive ? "text-white fill-white drop-shadow-lg" : "text-indigo-400/40"} /></motion.div>)}</AnimatePresence></motion.button>);
                                })}
                            </div>
                            <div className="mt-8 px-6 py-2 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-300 font-bold text-sm tracking-widest">{state.mode} MODU</div>
                        </motion.div>
                    )}
                    {(state.status === 'GAMEOVER' || state.status === 'VICTORY') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{state.status === 'VICTORY' ? '🎖️ Kozmik Şampiyon!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{state.status === 'VICTORY' ? 'Tüm hafıza görevlerini kusursuz tamamladın!' : 'Hafızan uzay kadar derin ve güçlü!'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{state.score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{state.level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl mb-4 shadow-[0_8px_32px_rgba(99,102,241,0.4)]"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default CosmicMemoryGame;
