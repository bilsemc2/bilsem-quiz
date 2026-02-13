import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw, Trophy, Timer as TimerIcon, Play, Star, Heart, Grid3X3, Eye, EyeOff, Plus, Sparkles, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'hedef-sayi';
const GRID_SIZE = 16;

interface Card {
    id: string; value: number; isRevealed: boolean; isSolved: boolean;
}

type Phase = 'welcome' | 'preview' | 'playing' | 'feedback' | 'game_over' | 'victory';

const TargetGridGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [cards, setCards] = useState<Card[]>([]);
    const [targetSum, setTargetSum] = useState(0);
    const [_selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [currentSum, setCurrentSum] = useState(0);
    const [previewTimer, setPreviewTimer] = useState(3);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const generateGrid = useCallback((lvl: number) => {
        const newCards: Card[] = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            newCards.push({
                id: Math.random().toString(36).substr(2, 9),
                value: Math.floor(Math.random() * 9) + 1,
                isRevealed: true,
                isSolved: false
            });
        }
        const numToCombine = Math.random() > 0.7 && lvl > 5 ? 3 : 2;
        const targetIndices: number[] = [];
        while (targetIndices.length < numToCombine) {
            const idx = Math.floor(Math.random() * GRID_SIZE);
            if (!targetIndices.includes(idx)) targetIndices.push(idx);
        }
        setTargetSum(targetIndices.reduce((acc, idx) => acc + newCards[idx].value, 0));
        setCards(newCards); setSelectedIndices([]); setCurrentSum(0);
        setPreviewTimer(Math.max(1, 4 - Math.floor(lvl / 5)));
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0); setLevel(1); setLives(INITIAL_LIVES); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        setPhase('preview'); generateGrid(1); playSound('slide');
    }, [generateGrid, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'preview' && previewTimer > 0) {
            const t = setTimeout(() => setPreviewTimer(p => p - 1), 1000);
            return () => clearTimeout(t);
        } else if (phase === 'preview' && previewTimer === 0) {
            setPhase('playing'); setCards(p => p.map(c => ({ ...c, isRevealed: false }))); playSound('signal_disappear');
        }
    }, [phase, previewTimer, playSound]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5 || phase === 'victory', score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam"); return;
        }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, victory: phase === 'victory' } });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(); }, [phase, handleFinish]);

    const handleCard = (idx: number) => {
        if (phase !== 'playing' || cards[idx].isRevealed || cards[idx].isSolved || feedbackState) return;
        const card = cards[idx]; const newSum = currentSum + card.value;
        setCurrentSum(newSum); setSelectedIndices(p => [...p, idx]); setCards(p => p.map((c, i) => i === idx ? { ...c, isRevealed: true } : c));
        playSound('grid_flip');
        if (newSum === targetSum) {
            showFeedback(true); playSound('correct'); setScore(p => p + 20 * level);
            setTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); setPhase('preview'); generateGrid(level + 1); }
            }, 1000);
        } else if (newSum > targetSum) {
            showFeedback(false); playSound('incorrect');
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                else {
                    setTimeout(() => {
                        dismissFeedback(); setCards(p => p.map(c => ({ ...c, isRevealed: false })));
                        setSelectedIndices([]); setCurrentSum(0);
                    }, 1000);
                }
                return nl;
            });
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Grid3X3 size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Hedef Sayı</h1>
                    <p className="text-slate-400 mb-8 text-lg">Sayıları ezberle, hedef toplamı bul ve zihinden hesaplama becerini geliştir. Hızlı ve doğru karar ver!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>Sayıları <strong>kısa sürede ezberle</strong> - sonra gizlenecekler</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>Hedef sayıya ulaşan <strong>doğru kartları seç</strong></span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>Toplamı aşmamaya <strong>dikkat et</strong> - can kaybedersin</span></li>
                        </ul>
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30 font-bold uppercase tracking-widest">TUZÖ 5.4.2 Görsel Kısa Süreli Bellek</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}><Zap className="text-fuchsia-400" size={18} /><span className="font-bold text-fuchsia-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'preview') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6 w-full max-w-lg">
                            <div className="w-full bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-3xl text-center">
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Hesaplanacak Sayı</span>
                                <div className="text-6xl font-black text-white mb-2">{targetSum}</div>
                                <div className="flex items-center justify-center gap-2 text-slate-400"><Plus size={16} /><span>Toplam: </span><span className="text-xl font-bold text-white">{currentSum}</span></div>
                            </div>
                            {phase === 'preview' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 px-6 py-2 bg-indigo-500 rounded-full font-bold shadow-lg shadow-indigo-500/40"><TimerIcon size={18} className="animate-pulse" /><span>Ezberle: {previewTimer}s</span></motion.div>}
                            <div className="grid grid-cols-4 gap-4 p-6 bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-inner w-full">
                                {cards.map((card, i) => (
                                    <motion.button key={card.id} whileHover={phase === 'playing' && !card.isRevealed ? { scale: 1.05 } : {}} whileTap={phase === 'playing' && !card.isRevealed ? { scale: 0.95 } : {}} onClick={() => handleCard(i)} disabled={phase === 'preview' || card.isRevealed || feedbackState !== null} className="aspect-square rounded-2xl flex items-center justify-center text-3xl font-black transition-all" style={{ background: card.isRevealed ? 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)' : 'rgba(255,255,255,0.05)', boxShadow: card.isRevealed ? '0 0 20px rgba(129, 140, 248, 0.5), inset 0 -4px 8px rgba(0,0,0,0.2)' : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)', border: card.isRevealed ? '2px solid #818CF8' : '1px solid rgba(255,255,255,0.1)', color: card.isRevealed ? '#fff' : 'transparent' }}>
                                        {card.isRevealed ? card.value : <EyeOff className="text-white/10" size={24} />}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-violet-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Hesaplama Dahisi!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Görsel hafızan ve hızlı hesaplama yeteneğin mükemmel seviyede!' : 'Daha fazla pratikle görsel belleğini ve sayısal zekanı geliştirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-indigo-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default TargetGridGame;
