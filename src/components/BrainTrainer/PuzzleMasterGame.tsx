import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Brain, Heart, Search, Scissors, LayoutGrid, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Puzzle Generator Utility (Migrated from original) ---
class PuzzleGenerator {
    static generate(seed: string): string {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        const s = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const random = (i: number) => {
            const x = Math.sin(s + i) * 10000;
            return x - Math.floor(x);
        };

        const grad = ctx.createLinearGradient(0, 0, size, size);
        const baseHue = Math.floor(random(1) * 360);
        grad.addColorStop(0, `hsl(${baseHue}, 40%, 90%)`);
        grad.addColorStop(1, `hsl(${(baseHue + 60) % 360}, 40%, 85%)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < 250; i++) {
            const x = random(i * 2.5) * size;
            const y = random(i * 3.7) * size;
            const shapeSize = 15 + random(i * 4.2) * 85;
            const hue = Math.floor(random(i * 5.1) * 360);
            const opacity = 0.4 + random(i * 6.3) * 0.4;
            const type = Math.floor(random(i * 7.8) * 6);

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(random(i * 8.9) * Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 75%, 55%, ${opacity})`;
            ctx.strokeStyle = `hsla(${hue}, 85%, 25%, 0.7)`;
            ctx.lineWidth = 1.5 + random(i * 9.2) * 2;
            ctx.beginPath();
            if (type === 0) ctx.rect(-shapeSize / 2, -shapeSize / 2, shapeSize, shapeSize);
            else if (type === 1) ctx.arc(0, 0, shapeSize / 2, 0, Math.PI * 2);
            else if (type === 2) {
                ctx.moveTo(0, -shapeSize / 2);
                ctx.lineTo(shapeSize / 2, shapeSize / 2);
                ctx.lineTo(-shapeSize / 2, shapeSize / 2);
            } else if (type === 3) {
                for (let j = 0; j < 5; j++) {
                    ctx.lineTo(Math.cos((j * 72) * Math.PI / 180) * shapeSize / 2, Math.sin((j * 72) * Math.PI / 180) * shapeSize / 2);
                    ctx.lineTo(Math.cos((j * 72 + 36) * Math.PI / 180) * shapeSize / 4, Math.sin((j * 72 + 36) * Math.PI / 180) * shapeSize / 4);
                }
            } else if (type === 4) {
                for (let j = 0; j < 6; j++) ctx.lineTo(Math.cos((j * 60) * Math.PI / 180) * shapeSize / 2, Math.sin((j * 60) * Math.PI / 180) * shapeSize / 2);
            } else ctx.ellipse(0, 0, shapeSize / 2, shapeSize / 4, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            if (random(i) > 0.4) ctx.stroke();
            ctx.restore();
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < size; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
        }

        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const n = (random(i * 0.1) - 0.5) * 20;
            data[i] = Math.max(0, Math.min(255, data[i] + n));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL('image/png');
    }
}

// --- Game Constants ---
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const SELECTION_SIZE = 100;

type Phase = 'welcome' | 'playing' | 'game_over' | 'victory';

interface GameLevel {
    imageUrl: string;
    targetBox: { x: number; y: number; width: number; height: number };
    targetThumbnail: string;
}

const PuzzleMasterGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [levelNumber, setLevelNumber] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [gameLevel, setGameLevel] = useState<GameLevel | null>(null);
    const [selection, setSelection] = useState({ x: 206, y: 206 });
    const [isDragging, setIsDragging] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const generateLevel = useCallback((_isNewImage: boolean) => {
        setIsLoading(true);
        setIsCorrect(null);

        // Seed generation
        const seed = `puzzle-${Date.now()}-${Math.random()}`;
        const imageUrl = PuzzleGenerator.generate(seed);

        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, 512, 512);

            const tx = 10 + Math.floor(Math.random() * (492 - SELECTION_SIZE));
            const ty = 10 + Math.floor(Math.random() * (492 - SELECTION_SIZE));

            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = SELECTION_SIZE;
            thumbCanvas.height = SELECTION_SIZE;
            const thumbCtx = thumbCanvas.getContext('2d');
            if (thumbCtx) {
                thumbCtx.drawImage(canvas, tx, ty, SELECTION_SIZE, SELECTION_SIZE, 0, 0, SELECTION_SIZE, SELECTION_SIZE);
            }

            setGameLevel({
                imageUrl,
                targetBox: { x: tx, y: ty, width: SELECTION_SIZE, height: SELECTION_SIZE },
                targetThumbnail: thumbCanvas.toDataURL('image/png')
            });
            setIsLoading(false);
            setSelection({ x: 206, y: 206 });
        };
    }, []);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevelNumber(1);
        setTimeLeft(TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        generateLevel(true);
    }, [hasSavedRef, generateLevel]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await saveGamePlay({
            game_id: 'puzzle-master',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: levelNumber, final_lives: lives }
        });
    }, [saveGamePlay, score, levelNumber, lives, hasSavedRef]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await saveGamePlay({
            game_id: 'puzzle-master',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true }
        });
    }, [saveGamePlay, score, hasSavedRef]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (phase !== 'playing' || isLoading || isCorrect !== null) return;
        setIsDragging(true);
        updateSelection(e);
    };

    const updateSelection = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const scale = 512 / rect.width;
        let x = (e.clientX - rect.left) * scale - SELECTION_SIZE / 2;
        let y = (e.clientY - rect.top) * scale - SELECTION_SIZE / 2;
        x = Math.max(0, Math.min(x, 512 - SELECTION_SIZE));
        y = Math.max(0, Math.min(y, 512 - SELECTION_SIZE));
        setSelection({ x, y });
    };

    const handleCheck = () => {
        if (!gameLevel) return;
        const dx = Math.abs(selection.x - gameLevel.targetBox.x);
        const dy = Math.abs(selection.y - gameLevel.targetBox.y);

        if (dx < 20 && dy < 20) {
            setIsCorrect(true);
            setScore(prev => prev + 10 * levelNumber);
            if (levelNumber >= MAX_LEVEL) {
                handleVictory();
            } else {
                setTimeout(() => {
                    setLevelNumber(prev => prev + 1);
                    generateLevel(levelNumber % 10 === 0);
                }, 1500);
            }
        } else {
            setIsCorrect(false);
            const newLives = lives - 1;
            setLives(newLives);
            if (newLives <= 0) {
                handleGameOver();
            } else {
                setTimeout(() => setIsCorrect(null), 1500);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white font-sans">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link to="/atolyeler/bireysel-degerlendirme" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span className="font-bold">Seviyeler</span>
                    </Link>

                    {phase === 'playing' && (
                        <div className="flex items-center gap-3 md:gap-6 scale-90 md:scale-100">
                            <div className="flex items-center gap-2 bg-amber-500/20 px-3 py-1.5 md:px-4 md:py-2 rounded-xl">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 md:px-4 md:py-2 rounded-xl">
                                <Heart className="text-red-400" size={18} />
                                <span className="font-bold text-red-400">{lives}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 md:px-4 md:py-2 rounded-xl">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 md:px-4 md:py-2 rounded-xl">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">Lvl {levelNumber}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
                                <Brain size={48} className="text-white" />
                            </div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Puzzle Master</h1>
                            <p className="text-slate-400 mb-8 font-medium">Hedef parçayı büyük görsel üzerinde bul ve işaretle. Dikkatli ol, sınırlı vaktin ve canın var!</p>
                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">3 Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 flex items-center gap-3">
                                <Play size={24} fill="currentColor" /> Başla
                            </motion.button>
                        </motion.div>
                    )}

                    {phase === 'playing' && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                            <div className="lg:col-span-3 space-y-6 flex flex-col items-center">
                                <div className="w-full bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col items-center">
                                    <p className="text-[10px] font-black text-indigo-400 mb-4 tracking-widest uppercase flex items-center gap-2">
                                        <Search size={14} /> BU PARÇAYI BUL
                                    </p>
                                    <div className="w-40 h-40 bg-slate-900 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-inner">
                                        {gameLevel?.targetThumbnail ? (
                                            <img src={gameLevel.targetThumbnail} alt="Target" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full animate-pulse bg-slate-800" />
                                        )}
                                    </div>
                                </div>

                                <div className="hidden lg:block w-full bg-slate-800/30 backdrop-blur-xl p-6 rounded-3xl border border-white/5">
                                    <h3 className="text-[10px] font-black text-slate-400 mb-4 tracking-widest uppercase flex items-center gap-2">
                                        <LayoutGrid size={14} /> REHBER
                                    </h3>
                                    <div className="space-y-3 text-[11px] font-bold text-slate-400">
                                        <div className="flex gap-3 items-center">
                                            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">1</span>
                                            <span>Hedef parçayı analiz et.</span>
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">2</span>
                                            <span>Tabloda konumunu bul.</span>
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">3</span>
                                            <span>Kontrol et ve ilerle!</span>
                                        </div>
                                    </div>
                                </div>

                                {isCorrect === false && (
                                    <motion.div initial={{ x: -10 }} animate={{ x: 0 }} className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 w-full">
                                        <AlertCircle className="text-red-400 shrink-0" size={20} />
                                        <p className="text-xs text-red-200 font-bold">Desen Yanlış! <br /><span className="opacity-60 text-[10px]">Parçayı tekrar incele.</span></p>
                                    </motion.div>
                                )}
                            </div>

                            <div className="lg:col-span-9 bg-slate-800/40 backdrop-blur-2xl p-2 md:p-4 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                                <div className="relative aspect-square bg-slate-950 rounded-[2rem] overflow-hidden cursor-crosshair border border-white/5 shadow-inner" onMouseDown={handleMouseDown} onMouseMove={(e) => isDragging && updateSelection(e)} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}>
                                    {isLoading && (
                                        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="mt-4 text-indigo-400 font-black tracking-widest text-[10px]">ANALİZ EDİLİYOR</p>
                                        </div>
                                    )}
                                    {gameLevel?.imageUrl && <img src={gameLevel.imageUrl} className="w-full h-full object-cover select-none" draggable={false} alt="Puzzle Board" />}

                                    <div className={`absolute pointer-events-none transition-all duration-150 rounded-xl border-4
                    ${isCorrect === true ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]' : isCorrect === false ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'border-white/90 shadow-2xl'}
                  `} style={{ left: `${(selection.x / 512) * 100}%`, top: `${(selection.y / 512) * 100}%`, width: `${(SELECTION_SIZE / 512) * 100}%`, height: `${(SELECTION_SIZE / 512) * 100}%` }}>
                                        <div className={`absolute -top-10 left-0 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-md shadow-lg
                      ${isCorrect === true ? 'bg-emerald-500' : isCorrect === false ? 'bg-red-500' : 'bg-indigo-600/90'}
                    `}>
                                            {isCorrect === true ? 'Buldun!' : isCorrect === false ? 'Hata!' : 'Hedef'}
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                            <div className="w-full h-px bg-white" />
                                            <div className="h-full w-px bg-white absolute" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex-1 text-center md:text-left">
                                        <p className="text-xl md:text-2xl font-black italic tracking-tight text-white/90 mb-2">Desenin yerini belirle</p>
                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sistem Aktif</span>
                                        </div>
                                    </div>
                                    <button onClick={handleCheck} disabled={isLoading || isCorrect !== null} className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-30 text-white px-12 py-5 rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest">
                                        <Scissors size={20} /> Analiz Et
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {phase === 'game_over' && (
                        <motion.div key="game_over" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center shadow-lg shadow-red-500/20">
                                <XCircle size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">Geliştirmen Gerekiyor</h2>
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/5">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-2">Puan</p>
                                        <p className="text-4xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-2">Seviye</p>
                                        <p className="text-4xl font-black text-emerald-400">{levelNumber}</p>
                                    </div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 flex items-center gap-3">
                                <RotateCcw size={24} /> Baştan Başla
                            </motion.button>
                        </motion.div>
                    )}

                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/20 animate-bounce">
                                <Trophy size={48} className="text-white" />
                            </div>
                            <h2 className="text-4xl font-black text-amber-400 mb-4 tracking-tight">ANALİZ ŞAMPİYONU!</h2>
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] p-10 mb-8 border border-amber-500/20 shadow-2xl">
                                <p className="text-6xl font-black text-amber-400 mb-2">{score}</p>
                                <p className="text-slate-400 uppercase tracking-[0.3em] font-black text-xs">Maksimum Skor Başarımı</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-black text-lg shadow-xl shadow-amber-500/20 flex items-center gap-3">
                                <RotateCcw size={24} /> Yeniden Meydan Oku
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PuzzleMasterGame;
