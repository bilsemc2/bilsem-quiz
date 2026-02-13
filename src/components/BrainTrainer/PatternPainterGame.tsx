import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Palette, Heart,
    Sparkles, CheckCircle2, HelpCircle, Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useSound } from '../../hooks/useSound';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ============== CONSTANTS ==============
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'desen-boyama';

const COLORS = ['#FF3366', '#00BFFF', '#00FF7F', '#FFD700', '#9B59B6', '#FF6B35', '#00CED1', '#E91E63'];
const PATTERN_TYPES = ['checkered', 'stripes', 'diagonal', 'center-out', 'random-repeating'] as const;
type PatternType = typeof PATTERN_TYPES[number];
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface GameLevel { size: number; patternType: PatternType; gapPos: { r: number; c: number }; grid: string[][]; correctOption: string[][]; }

const generatePattern = (size: number, type: PatternType): string[][] => {
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
    const palette = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 4);
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            switch (type) {
                case 'checkered': grid[r][c] = palette[(r + c) % 2]; break;
                case 'stripes': grid[r][c] = palette[r % 2]; break;
                case 'diagonal': grid[r][c] = palette[(r + c) % palette.length]; break;
                case 'center-out': const dist = Math.max(Math.abs(r - Math.floor(size / 2)), Math.abs(c - Math.floor(size / 2))); grid[r][c] = palette[dist % palette.length]; break;
                default: const br = Math.floor(r / 2), bc = Math.floor(c / 2); grid[r][c] = palette[(br + bc) % palette.length]; break;
            }
        }
    }
    return grid;
};

const createLevel = (idx: number): GameLevel => {
    const size = idx < 5 ? 6 : idx < 10 ? 7 : idx < 15 ? 8 : 9;
    const type = PATTERN_TYPES[idx % PATTERN_TYPES.length];
    const grid = generatePattern(size, type);
    const gs = 2, gr = Math.floor(Math.random() * (size - gs)), gc = Math.floor(Math.random() * (size - gs));
    const corr: string[][] = Array.from({ length: gs }, (_, r) => Array.from({ length: gs }, (_, c) => grid[gr + r][gc + c]));
    return { size, patternType: type, gapPos: { r: gr, c: gc }, grid, correctOption: corr };
};

const PatternPainterGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [currentLevel, setCurrentLevel] = useState<GameLevel | null>(null);
    const [userPainting, setUserPainting] = useState<(string | null)[][]>([]);
    const [activeColor, setActiveColor] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const availableColors = useMemo(() => {
        if (!currentLevel) return COLORS.slice(0, 4);
        return Array.from(new Set(currentLevel.grid.flat()));
    }, [currentLevel]);

    const setupLevel = useCallback((lvl: number) => {
        const nl = createLevel(lvl - 1); setCurrentLevel(nl);
        setUserPainting(Array.from({ length: 2 }, () => Array(2).fill(null)));
        const colors = Array.from(new Set(nl.grid.flat())); setActiveColor(colors[0]);
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        setupLevel(1); playSound('slide');
    }, [setupLevel, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handlePaintTile = (r: number, c: number) => {
        if (!activeColor || phase !== 'playing') return;
        const np = userPainting.map(row => [...row]); np[r][c] = activeColor;
        setUserPainting(np); playSound('pop');
    };

    const handleCheck = () => {
        if (!currentLevel || phase !== 'playing') return;
        const complete = userPainting.every(row => row.every(cell => cell !== null));
        if (!complete) return;
        const correct = JSON.stringify(userPainting) === JSON.stringify(currentLevel.correctOption);
        showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        setPhase('feedback');
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(s => s + 10 * level);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); setPhase('playing'); setupLevel(level + 1); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                    else { setPhase('playing'); setUserPainting(Array.from({ length: 2 }, () => Array(2).fill(null))); }
                    return nl;
                });
            }
        }, 1500);
    };

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

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    const getTileStyle = (color: string, isGap: boolean = false) => ({
        backgroundColor: color,
        boxShadow: isGap ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3)' : `inset 0 -6px 12px rgba(0,0,0,0.15), inset 0 6px 12px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.2)`,
        borderRadius: '32%',
    });

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-950 via-fuchsia-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-pink-400 to-fuchsia-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Palette size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-pink-300 via-fuchsia-300 to-purple-300 bg-clip-text text-transparent">Desen Boyama</h1>
                    <p className="text-slate-300 mb-8 text-lg">Örüntüdeki boşluğu doğru renklerle doldur ve deseni tamamla. Renkli bir mantık yolculuğuna hazır mısın?</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-pink-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-pink-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Büyük <strong>desendeki kuralı</strong> anlamaya çalış</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-pink-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Renk paletinden uygun renkleri seçerek <strong>boşluğu boya</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-pink-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Tüm kutuları boyayınca <strong>kontrol et</strong> butonuna bas</span></li>
                        </ul>
                    </div>
                    <div className="bg-pink-500/10 text-pink-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-pink-500/30 font-bold uppercase tracking-widest">TUZÖ 5.3.2 Desen Analizi</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-fuchsia-950 to-slate-900 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}><Zap className="text-emerald-400" size={18} /><span className="font-bold text-emerald-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && currentLevel && (
                        <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 border border-white/10 shadow-3xl text-center">
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-6 flex items-center justify-center gap-2"><Eye size={16} /> Deseni İncele</p>
                                <div className="grid gap-1.5 p-3 bg-white/5 rounded-[40px] border border-white/5 shadow-inner mx-auto mb-6" style={{ gridTemplateColumns: `repeat(${currentLevel.size}, 1fr)`, width: 'min(70vw, 320px)', aspectRatio: '1' }}>
                                    {currentLevel.grid.map((row, r) => row.map((color, c) => {
                                        const gr = r - currentLevel.gapPos.r, gc = c - currentLevel.gapPos.c;
                                        const isInGap = gr >= 0 && gr < 2 && gc >= 0 && gc < 2;
                                        const pc = isInGap ? userPainting[gr]?.[gc] : null;
                                        return <div key={`${r}-${c}`} className="w-full h-full" style={isInGap && !pc ? { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '35%', border: '1.5px dashed rgba(255,255,255,0.2)' } : getTileStyle(isInGap ? (pc || color) : color, isInGap)} />;
                                    }))}
                                </div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 border border-white/10 shadow-3xl">
                                <h2 className="text-2xl font-black text-center mb-8 flex items-center justify-center gap-3">Boşluğu Tamamla ✨</h2>
                                <div className="grid grid-cols-2 gap-4 w-48 mx-auto mb-10">
                                    {Array.from({ length: 2 }).map((_, r) => Array.from({ length: 2 }).map((_, c) => (
                                        <motion.button key={`${r}-${c}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handlePaintTile(r, c)} className="w-20 h-20 flex items-center justify-center relative transition-all" style={userPainting[r][c] ? getTileStyle(userPainting[r][c]!, true) : { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '35%', border: '2px dashed rgba(255,255,255,0.2)' }}>
                                            {!userPainting[r][c] && <HelpCircle className="text-white/20" size={24} />}
                                        </motion.button>
                                    )))}
                                </div>
                                <div className="flex flex-wrap justify-center gap-3 mb-8 p-4 bg-white/5 rounded-3xl border border-white/5">
                                    {availableColors.map((color, idx) => (
                                        <motion.button key={idx} whileHover={{ scale: 1.15, y: -4 }} whileTap={{ scale: 0.9 }} onClick={() => { setActiveColor(color); playSound('pop'); }} className="w-12 h-12 relative" style={{ ...getTileStyle(color), outline: activeColor === color ? '3px solid white' : 'none', outlineOffset: 3 }}>
                                            {activeColor === color && <Sparkles className="absolute -top-2 -right-2 text-yellow-300 drop-shadow-lg" size={14} />}
                                        </motion.button>
                                    ))}
                                </div>
                                <div className="flex gap-4">
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setUserPainting(Array.from({ length: 2 }, () => Array(2).fill(null))); playSound('slide'); }} className="flex-1 py-4 bg-white/5 rounded-2xl font-bold border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"><RotateCcw size={20} /><span>Temizle</span></motion.button>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCheck} className="flex-[1.5] py-4 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-2xl font-bold shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"><CheckCircle2 size={20} /><span>Kontrol Et</span></motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-fuchsia-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-pink-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Desen Ressamı!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Görsel örüntüleri algılama ve estetik tamamlama yeteneğin tek kelimeyle harika!' : 'Daha fazla pratikle desenlerin gizli kurallarını çok daha hızlı çözebilirsin.'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default PatternPainterGame;
