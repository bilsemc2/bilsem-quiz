import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, RotateCcw, Play, Trophy, Sparkles,
    Square, Circle, Triangle, Star, Heart, Diamond,
    Box, Timer as TimerIcon, Eye, Zap
} from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ------------------ Constants ------------------
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type FaceName = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';
interface FaceContent { color: string; icon: React.ElementType; name: string; }
interface CubeNet { name: string; grid: (FaceName | null)[][]; }
interface GameOption { rotation: { x: number; y: number }; isCorrect: boolean; id: string; }

const COLORS = [
    { name: 'Red', hex: '#FF6B6B' }, { name: 'Teal', hex: '#4ECDC4' }, { name: 'Yellow', hex: '#FFE66D' },
    { name: 'Orange', hex: '#FF9F43' }, { name: 'Purple', hex: '#A29BFE' }, { name: 'Pink', hex: '#FD79A8' }
];
const ICONS = [
    { icon: Square, name: 'Kare' }, { icon: Circle, name: 'Daire' }, { icon: Triangle, name: 'Üçgen' },
    { icon: Star, name: 'Yıldız' }, { icon: Heart, name: 'Kalp' }, { icon: Diamond, name: 'Baklava' }
];

const NET_LAYOUTS: CubeNet[] = [
    { name: '1-4-1 (T)', grid: [[null, 'TOP', null, null], ['LEFT', 'FRONT', 'RIGHT', 'BACK'], [null, 'BOTTOM', null, null]] },
    { name: '1-4-1 (L)', grid: [['TOP', null, null, null], ['BACK', 'RIGHT', 'FRONT', 'LEFT'], [null, null, null, 'BOTTOM']] },
    { name: '1-4-1 (Z)', grid: [[null, 'TOP', null, null], ['BACK', 'RIGHT', 'FRONT', null], [null, null, 'LEFT', 'BOTTOM']] },
    { name: '2-3-1 (A)', grid: [['TOP', 'BACK', null, null], [null, 'RIGHT', 'FRONT', 'LEFT'], [null, null, null, 'BOTTOM']] },
    { name: '2-2-2 (Basamak)', grid: [['TOP', 'BACK', null], [null, 'RIGHT', 'FRONT'], [null, null, 'LEFT'], [null, null, 'BOTTOM']] },
    { name: '3-3 (Merdiven)', grid: [['TOP', 'BACK', 'RIGHT', null, null], [null, null, 'FRONT', 'LEFT', 'BOTTOM']] }
];

const MagicCubeGame: React.FC = () => {
    const { playSound } = useSound();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState<'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory'>('welcome');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [isFolding, setIsFolding] = useState(false);
    const [currentNet, setCurrentNet] = useState<CubeNet>(NET_LAYOUTS[0]);
    const [facesData, setFacesData] = useState<Record<FaceName, FaceContent>>({} as Record<FaceName, FaceContent>);
    const [options, setOptions] = useState<GameOption[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateLevel = useCallback((_lvl: number) => {
        setIsFolding(false);
        const net = NET_LAYOUTS[Math.floor(Math.random() * NET_LAYOUTS.length)];
        setCurrentNet(net);
        const newFacesData: Partial<Record<FaceName, FaceContent>> = {};
        const sc = [...COLORS].sort(() => Math.random() - 0.5);
        const si = [...ICONS].sort(() => Math.random() - 0.5);
        ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'].forEach((n, i) => { newFacesData[n as FaceName] = { color: sc[i % sc.length].hex, icon: si[i % si.length].icon, name: si[i % si.length].name }; });
        setFacesData(newFacesData as Record<FaceName, FaceContent>);
        const cor: GameOption = { rotation: { x: -20, y: 35 }, isCorrect: true, id: 'correct' };
        const w1: GameOption = { rotation: { x: 160, y: 45 }, isCorrect: false, id: 'w1' };
        const w2: GameOption = { rotation: { x: 45, y: -160 }, isCorrect: false, id: 'w2' };
        setOptions([cor, w1, w2].sort(() => Math.random() - 0.5));
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setGameState('playing'); setLevel(1); setScore(0); setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        generateLevel(1); playSound('slide');
    }, [generateLevel, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && gameState === 'welcome') handleStart(); }, [location.state, gameState, handleStart, examMode]);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setGameState('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [gameState, timeLeft]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(gameState === 'victory' || level >= 5, score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam"); return;
        }
        await saveGamePlay({ game_id: 'sihirli-kupler', score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, victory: gameState === 'victory' } });
    }, [gameState, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (gameState === 'game_over' || gameState === 'victory') handleFinish(); }, [gameState, handleFinish]);

    const handleSelect = (opt: GameOption) => {
        if (feedbackState || gameState !== 'playing') return;
        const ok = opt.isCorrect; showFeedback(ok); playSound(ok ? 'correct' : 'incorrect');
        if (ok) {
            setScore(p => p + 20 * level);
            setTimeout(() => { dismissFeedback(); if (level >= MAX_LEVEL) setGameState('victory'); else { setLevel(l => l + 1); generateLevel(level + 1); } }, 1500);
        } else {
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => setGameState('game_over'), 1500);
                else { setIsFolding(true); setTimeout(() => { dismissFeedback(); generateLevel(level); }, 1500); }
                return nl;
            });
        }
    };

    const Cube3D = ({ rotation, size = 100, data }: { rotation: { x: number; y: number }; size?: number; data: Record<FaceName, FaceContent> }) => {
        const h = size / 2; if (!data.FRONT) return null;
        const face = (t: string, c: string, _icon: React.ElementType) => ({ position: 'absolute' as const, width: size, height: size, transform: t, backgroundColor: c, border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden' as const, borderRadius: '12px', boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)' });
        return (
            <div style={{ perspective: '800px', width: size, height: size }}>
                <motion.div animate={{ rotateX: rotation.x, rotateY: rotation.y }} transition={{ type: 'spring', stiffness: 60, damping: 15 }} style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}>
                    <div style={face(`translateZ(${h}px)`, data.FRONT.color, data.FRONT.icon)}><data.FRONT.icon size={size * 0.5} color="white" /></div>
                    <div style={face(`translateZ(-${h}px) rotateY(180deg)`, data.BACK.color, data.BACK.icon)}><data.BACK.icon size={size * 0.5} color="white" /></div>
                    <div style={face(`translateX(-${h}px) rotateY(-90deg)`, data.LEFT.color, data.LEFT.icon)}><data.LEFT.icon size={size * 0.5} color="white" /></div>
                    <div style={face(`translateX(${h}px) rotateY(90deg)`, data.RIGHT.color, data.RIGHT.icon)}><data.RIGHT.icon size={size * 0.5} color="white" /></div>
                    <div style={face(`translateY(-${h}px) rotateX(90deg)`, data.TOP.color, data.TOP.icon)}><data.TOP.icon size={size * 0.5} color="white" /></div>
                    <div style={face(`translateY(${h}px) rotateX(-90deg)`, data.BOTTOM.color, data.BOTTOM.icon)}><data.BOTTOM.icon size={size * 0.5} color="white" /></div>
                </motion.div>
            </div>
        );
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (gameState === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0], rotateY: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}><Box size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Sihirli Küpler</h1>
                    <p className="text-slate-400 mb-8 text-lg">Küp açınımını zihninde katla ve oluşacak doğru küpü bul! Üç boyutlu düşünme becerini test et.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-orange-400" /><span>Küp açınımını <strong>dikkatle incele</strong></span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-orange-400" /><span>Harita üzerindeki sembolleri zihninde <strong>eşleştir</strong></span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-orange-400" /><span>Katlandığında hangi küpün oluşacağını <strong>işaretle</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-amber-500/10 text-amber-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-amber-500/30 font-bold uppercase tracking-widest">TUZÖ 4.2.1 3B Uzayda Görselleştirme</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 text-white relative overflow-hidden">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(gameState !== 'game_over' && gameState !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}><Zap className="text-amber-400" size={18} /><span className="font-bold text-amber-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-120px)]">
                <AnimatePresence mode="wait">
                    {(gameState === 'playing' || gameState === 'feedback') && facesData.FRONT && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-5xl">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                <div className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-3xl flex flex-col items-center gap-8">
                                    <div className="relative w-[300px] h-[300px] flex items-center justify-center" style={{ perspective: '1200px' }}>
                                        <motion.div animate={isFolding ? { rotateX: -20, rotateY: 35 } : { rotateX: 0, rotateY: 0 }} transition={{ duration: 2 }} style={{ position: 'relative', width: '60px', height: '60px', transformStyle: 'preserve-3d' }}>
                                            {currentNet.grid.map((row, rIdx) => row.map((f, cIdx) => {
                                                if (!f || !facesData[f]) return null;
                                                let fR = 0, fC = 0; currentNet.grid.forEach((r, ri) => r.forEach((x, ci) => { if (x === 'FRONT') { fR = ri; fC = ci; } }));
                                                const relR = rIdx - fR, relC = cIdx - fC; const s = 60;
                                                const T: Record<FaceName, any> = { FRONT: { rx: 0, ry: 0, rz: 0, tx: 0, ty: 0, tz: s / 2 }, BACK: { rx: 0, ry: 180, rz: 0, tx: 0, ty: 0, tz: -s / 2 }, LEFT: { rx: 0, ry: -90, rz: 0, tx: -s / 2, ty: 0, tz: 0 }, RIGHT: { rx: 0, ry: 90, rz: 0, tx: s / 2, ty: 0, tz: 0 }, TOP: { rx: 90, ry: 0, rz: 0, tx: 0, ty: -s / 2, tz: 0 }, BOTTOM: { rx: -90, ry: 0, rz: 0, tx: 0, ty: s / 2, tz: 0 } };
                                                const t = T[f];
                                                return <motion.div key={f} animate={isFolding ? { x: t.tx, y: t.ty, z: t.tz, rotateX: t.rx, rotateY: t.ry, rotateZ: t.rz } : { x: relC * s, y: relR * s, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0 rounded-lg border-2 border-white/20 flex items-center justify-center shadow-xl" style={{ backgroundColor: facesData[f].color, backfaceVisibility: 'hidden', transformStyle: 'preserve-3d' }}>{React.createElement(facesData[f].icon, { size: 30, color: 'white' })}</motion.div>
                                            }))}
                                        </motion.div>
                                    </div>
                                    <button onClick={() => setIsFolding(!isFolding)} className="px-6 py-2 bg-white/10 rounded-full text-xs font-bold hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10 uppercase tracking-widest">{isFolding ? <RotateCcw size={14} /> : <Play size={14} />}{isFolding ? 'Aç' : 'Katla'}</button>
                                </div>
                                <div className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-3xl text-center">
                                    <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-amber-400">DOĞRU KÜPÜ SEÇ</h2>
                                    <div className="grid grid-cols-3 gap-6">
                                        {options.map(opt => {
                                            const showR = feedbackState !== null; const isCor = opt.isCorrect;
                                            return <motion.button key={opt.id} whileHover={!showR ? { scale: 1.05, y: -4 } : {}} whileTap={!showR ? { scale: 0.95 } : {}} onClick={() => handleSelect(opt)} disabled={showR} className={`p-6 rounded-3xl transition-all duration-300 border ${showR ? (isCor ? 'bg-emerald-500 border-white' : 'opacity-20 bg-slate-800 border-transparent') : 'bg-white/5 border-white/10 hover:border-amber-400 hover:bg-white/10 shadow-xl'}`}><Cube3D rotation={opt.rotation} size={80} data={facesData} /></motion.button>
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {(gameState === 'game_over' || gameState === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{gameState === 'victory' || level >= 5 ? '🎖️ Küp Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{(gameState === 'victory' || level >= 5) ? 'Üç boyutlu uzayda nesneleri döndürme yeteneğin gerçekten mükemmel!' : 'Daha fazla pratikle zihninde canlandırma becerini geliştirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-orange-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default MagicCubeGame;
