import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon, Target,
    ChevronLeft, Zap, Heart, Search, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useSound } from '../../hooks/useSound';

// ─── Puzzle Generator ────────────────────────────────────────
class PuzzleGenerator {
    static generate(seed: string): string {
        const size = 512; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d'); if (!ctx) return '';
        const s = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const rand = (i: number) => { const x = Math.sin(s + i) * 10000; return x - Math.floor(x); };
        const grad = ctx.createLinearGradient(0, 0, size, size); const baseHue = Math.floor(rand(1) * 360);
        grad.addColorStop(0, `hsl(${baseHue}, 50%, 85%)`); grad.addColorStop(1, `hsl(${(baseHue + 60) % 360}, 50%, 80%)`);
        ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 250; i++) {
            const x = rand(i * 2.5) * size; const y = rand(i * 3.7) * size; const sz = 15 + rand(i * 4.2) * 85;
            const h = Math.floor(rand(i * 5.1) * 360); const op = 0.4 + rand(i * 6.3) * 0.4; const t = Math.floor(rand(i * 7.8) * 6);
            ctx.save(); ctx.translate(x, y); ctx.rotate(rand(i * 8.9) * Math.PI * 2);
            ctx.fillStyle = `hsla(${h}, 75%, 55%, ${op})`; ctx.strokeStyle = `hsla(${h}, 85%, 25%, 0.7)`; ctx.lineWidth = 1.5 + rand(i * 9.2) * 2;
            ctx.beginPath();
            if (t === 0) ctx.rect(-sz / 2, -sz / 2, sz, sz);
            else if (t === 1) ctx.arc(0, 0, sz / 2, 0, Math.PI * 2);
            else if (t === 2) { ctx.moveTo(0, -sz / 2); ctx.lineTo(sz / 2, sz / 2); ctx.lineTo(-sz / 2, sz / 2); }
            else if (t === 3) { for (let j = 0; j < 5; j++) { ctx.lineTo(Math.cos((j * 72) * Math.PI / 180) * sz / 2, Math.sin((j * 72) * Math.PI / 180) * sz / 2); ctx.lineTo(Math.cos((j * 72 + 36) * Math.PI / 180) * sz / 4, Math.sin((j * 72 + 36) * Math.PI / 180) * sz / 4); } }
            else if (t === 4) { for (let j = 0; j < 6; j++) ctx.lineTo(Math.cos((j * 60) * Math.PI / 180) * sz / 2, Math.sin((j * 60) * Math.PI / 180) * sz / 2); }
            else ctx.ellipse(0, 0, sz / 2, sz / 4, 0, 0, Math.PI * 2);
            ctx.closePath(); ctx.fill(); if (rand(i) > 0.4) ctx.stroke(); ctx.restore();
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 0.5;
        for (let i = 0; i < size; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke(); }
        const imgData = ctx.getImageData(0, 0, size, size); const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) { const n = (rand(i * 0.1) - 0.5) * 20; d[i] = Math.max(0, Math.min(255, d[i] + n)); d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n)); d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n)); }
        ctx.putImageData(imgData, 0, 0); return canvas.toDataURL('image/png');
    }
}

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const SELECTION_SIZE = 100;
const GAME_ID = 'puzzle-master';

interface GameLevel { imageUrl: string; targetBox: { x: number; y: number; width: number; height: number }; targetThumbnail: string; }
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const PuzzleMasterGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [gameLevel, setGameLevel] = useState<GameLevel | null>(null);
    const [selection, setSelection] = useState({ x: 206, y: 206 });
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateLevel = useCallback(() => {
        setIsLoading(true); const seed = `puzzle-${Date.now()}-${Math.random()}`;
        const imageUrl = PuzzleGenerator.generate(seed); const img = new Image(); img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.drawImage(img, 0, 0, 512, 512);
            const tx = 10 + Math.floor(Math.random() * (492 - SELECTION_SIZE));
            const ty = 10 + Math.floor(Math.random() * (492 - SELECTION_SIZE));
            const thumbCanvas = document.createElement('canvas'); thumbCanvas.width = SELECTION_SIZE; thumbCanvas.height = SELECTION_SIZE;
            const thumbCtx = thumbCanvas.getContext('2d');
            if (thumbCtx) thumbCtx.drawImage(canvas, tx, ty, SELECTION_SIZE, SELECTION_SIZE, 0, 0, SELECTION_SIZE, SELECTION_SIZE);
            setGameLevel({ imageUrl, targetBox: { x: tx, y: ty, width: SELECTION_SIZE, height: SELECTION_SIZE }, targetThumbnail: thumbCanvas.toDataURL('image/png') });
            setIsLoading(false); setSelection({ x: 206, y: 206 });
        };
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setLives(INITIAL_LIVES); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        generateLevel(); playSound('slide');
    }, [generateLevel, playSound, examMode, examTimeLimit]);

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

    const updateSelection = (e: React.MouseEvent | React.TouchEvent) => {
        const board = document.getElementById('puzzle-board'); if (!board) return;
        const rect = board.getBoundingClientRect(); const scale = 512 / rect.width;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        let x = (clientX - rect.left) * scale - SELECTION_SIZE / 2;
        let y = (clientY - rect.top) * scale - SELECTION_SIZE / 2;
        x = Math.max(0, Math.min(x, 512 - SELECTION_SIZE));
        y = Math.max(0, Math.min(y, 512 - SELECTION_SIZE));
        setSelection({ x, y });
    };

    const handleCheck = () => {
        if (!gameLevel || phase !== 'playing' || feedbackState) return;
        const dx = Math.abs(selection.x - gameLevel.targetBox.x);
        const dy = Math.abs(selection.y - gameLevel.targetBox.y);
        const correct = dx < 25 && dy < 25;
        showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(p => p + 20 * level);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); generateLevel(); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                    return nl;
                });
            }
        }, 1500);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-950 via-pink-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 bg-gradient-to-br from-rose-400 to-pink-600 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Search size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-rose-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent">Puzzle Master</h1>
                    <p className="text-slate-300 mb-8 text-lg">Karmaşık desenler içindeki küçük parçaları bul ve yerini tespit et. Görsel analiz yeteneğini konuştur!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-rose-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-rose-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Sol taraftaki <strong>hedef parçayı</strong> dikkatlice incele</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-rose-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Büyük tabloda bu parçanın <strong>yerini bul</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-rose-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Seçim kutusunu sürükle ve <strong>Kontrol Et</strong> butonuna bas</span></li>
                        </ul>
                    </div>
                    <div className="bg-rose-500/10 text-rose-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-rose-500/30 font-bold uppercase tracking-widest">TUZÖ 5.3.2 Görsel Analiz</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-950 via-pink-950 to-slate-900 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(225, 29, 72, 0.1) 100%)', border: '1px solid rgba(244, 63, 94, 0.3)' }}><Zap className="text-rose-400" size={18} /><span className="font-bold text-rose-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-1 flex flex-col gap-4">
                                <div className="bg-white/5 backdrop-blur-2xl rounded-[32px] p-6 border border-white/10 shadow-3xl text-center">
                                    <p className="text-xs font-bold text-rose-300 mb-4 tracking-widest uppercase flex items-center justify-center gap-2"><Search size={14} />Bu Parçayı Bul</p>
                                    <div className="aspect-square rounded-2xl overflow-hidden border-2 border-rose-500/30 shadow-inner bg-slate-900">
                                        {gameLevel?.targetThumbnail ? <img src={gameLevel.targetThumbnail} alt="Target" className="w-full h-full object-cover" /> : <div className="w-full h-full animate-pulse bg-slate-800" />}
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-3 flex flex-col items-center gap-6">
                                <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-4 border border-white/10 shadow-3xl w-full">
                                    <div id="puzzle-board" className="relative aspect-square rounded-2xl overflow-hidden cursor-crosshair touch-none" onMouseDown={(e) => { setIsDragging(true); updateSelection(e); }} onMouseMove={(e) => isDragging && updateSelection(e)} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)} onTouchStart={(e) => { setIsDragging(true); updateSelection(e); }} onTouchMove={(e) => isDragging && updateSelection(e)} onTouchEnd={() => setIsDragging(false)}>
                                        {isLoading && <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /><p className="mt-4 text-rose-400 font-bold text-sm">Yükleniyor...</p></div>}
                                        {gameLevel?.imageUrl && <img src={gameLevel.imageUrl} className="w-full h-full object-cover select-none" draggable={false} alt="Board" />}
                                        <div className={`absolute pointer-events-none transition-all duration-150 rounded-xl border-4 ${feedbackState?.correct === true ? 'border-emerald-400' : feedbackState?.correct === false ? 'border-red-400' : 'border-white/80'}`} style={{ left: `${(selection.x / 512) * 100}%`, top: `${(selection.y / 512) * 100}%`, width: `${(SELECTION_SIZE / 512) * 100}%`, height: `${(SELECTION_SIZE / 512) * 100}%`, boxShadow: feedbackState?.correct === true ? '0 0 30px rgba(52, 211, 153, 0.5)' : feedbackState?.correct === false ? '0 0 30px rgba(248, 113, 113, 0.5)' : '0 0 20px rgba(255,255,255,0.3)' }}><div className="absolute inset-0 flex items-center justify-center opacity-40"><div className="w-full h-px bg-white" /><div className="h-full w-px bg-white absolute" /></div></div>
                                    </div>
                                </div>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCheck} disabled={isLoading || phase !== 'playing' || feedbackState !== null} className="px-12 py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl font-bold text-xl shadow-2xl disabled:opacity-50"><div className="flex items-center gap-3"><Target size={28} /><span>Kontrol Et</span></div></motion.button>
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-rose-500 to-fuchsia-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Görsel Analiz Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'En karmaşık desenlerin bile içindeki detayları saniyeler içinde fark ediyorsun!' : 'Daha fazla pratikle görsel dikkatini ve analiz yeteneğini geliştirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-rose-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default PuzzleMasterGame;
