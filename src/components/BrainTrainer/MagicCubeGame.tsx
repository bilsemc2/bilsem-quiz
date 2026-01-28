import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ChevronLeft, RotateCcw, Play, Trophy, Sparkles,
    Square, Circle, Triangle, Star, Heart, Diamond,
    Box, Layers, Zap, Clock
} from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// ------------------ Tip Tanımları ------------------
type FaceName = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

interface FaceContent {
    color: string;
    icon: React.ElementType;
    name: string;
}

interface CubeNet {
    name: string;
    grid: (FaceName | null)[][];
}

interface GameOption {
    rotation: { x: number; y: number };
    isCorrect: boolean;
    id: string;
}

const COLORS = [
    { name: 'Red', hex: '#FF6B6B' },
    { name: 'Teal', hex: '#4ECDC4' },
    { name: 'Yellow', hex: '#FFE66D' },
    { name: 'Orange', hex: '#FF9F43' },
    { name: 'Purple', hex: '#A29BFE' },
    { name: 'Pink', hex: '#FD79A8' }
];

const ICONS = [
    { icon: Square, name: 'Kare' },
    { icon: Circle, name: 'Daire' },
    { icon: Triangle, name: 'Üçgen' },
    { icon: Star, name: 'Yıldız' },
    { icon: Heart, name: 'Kalp' },
    { icon: Diamond, name: 'Baklava' }
];

// 11 Standart Küp Açınımı (Nets)
const NET_LAYOUTS: CubeNet[] = [
    { name: '1-4-1 (T)', grid: [[null, 'TOP', null, null], ['LEFT', 'FRONT', 'RIGHT', 'BACK'], [null, 'BOTTOM', null, null]] },
    { name: '1-4-1 (L)', grid: [['TOP', null, null, null], ['BACK', 'RIGHT', 'FRONT', 'LEFT'], [null, null, null, 'BOTTOM']] },
    { name: '1-4-1 (Z)', grid: [[null, 'TOP', null, null], ['BACK', 'RIGHT', 'FRONT', null], [null, null, 'LEFT', 'BOTTOM']] },
    { name: '2-3-1 (A)', grid: [['TOP', 'BACK', null, null], [null, 'RIGHT', 'FRONT', 'LEFT'], [null, null, null, 'BOTTOM']] },
    { name: '2-3-1 (B)', grid: [['TOP', 'BACK', null, null], [null, 'RIGHT', 'FRONT', null], [null, null, 'LEFT', 'BOTTOM']] },
    { name: '2-2-2 (Basamak)', grid: [['TOP', 'BACK', null], [null, 'RIGHT', 'FRONT'], [null, null, 'LEFT'], [null, null, 'BOTTOM']] },
    { name: '3-3 (Merdiven)', grid: [['TOP', 'BACK', 'RIGHT', null, null], [null, null, 'FRONT', 'LEFT', 'BOTTOM']] },
    { name: '1-4-1 (İnce)', grid: [[null, 'TOP', null, null], [null, 'BACK', null, null], ['LEFT', 'FRONT', 'RIGHT', null], [null, 'BOTTOM', null, null]] },
    { name: '2-3-1 (Karma)', grid: [['TOP', 'BACK', null], [null, 'RIGHT', 'FRONT'], [null, 'LEFT', null], [null, 'BOTTOM', null]] },
    { name: '1-3-2', grid: [[null, 'TOP', null], ['BACK', 'RIGHT', 'FRONT'], [null, 'LEFT', 'BOTTOM']] },
    { name: '3-2-1', grid: [['TOP', 'BACK', 'RIGHT'], [null, null, 'FRONT'], [null, null, 'LEFT'], [null, null, 'BOTTOM']] }
];

const MagicCubeGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isFolding, setIsFolding] = useState(false);
    const [isCorrecting, setIsCorrecting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(45);
    const [lives, setLives] = useState(5);
    const [totalTime, setTotalTime] = useState(180); // 3 dakika
    const gameStartTimeRef = useRef<number>(0);

    // Mevcut Seviye Verileri
    const [currentNet, setCurrentNet] = useState<CubeNet>(NET_LAYOUTS[0]);
    const [facesData, setFacesData] = useState<Record<FaceName, FaceContent>>({} as Record<FaceName, FaceContent>);
    const [options, setOptions] = useState<GameOption[]>([]);

    // ------------------ Küp Verisi Üretici ------------------
    const generateLevel = useCallback(() => {
        setIsFolding(false);
        // Rastgele bir net seç
        const net = NET_LAYOUTS[Math.floor(Math.random() * NET_LAYOUTS.length)];
        setCurrentNet(net);

        // Her yüz için benzersiz bir renk/ikon kombinasyonu
        const newFacesData: Partial<Record<FaceName, FaceContent>> = {};
        const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
        const shuffledIcons = [...ICONS].sort(() => Math.random() - 0.5);

        const faceNames: FaceName[] = ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'];
        faceNames.forEach((name, i) => {
            newFacesData[name] = {
                color: shuffledColors[i % shuffledColors.length].hex,
                icon: shuffledIcons[i % shuffledIcons.length].icon,
                name: shuffledIcons[i % shuffledIcons.length].name
            };
        });
        setFacesData(newFacesData as Record<FaceName, FaceContent>);

        // Seçenekleri oluştur
        const correctOption: GameOption = {
            rotation: { x: -20, y: 35 }, // Sabit bir "güzel" açı
            isCorrect: true,
            id: 'correct'
        };

        const distractorOptions: GameOption[] = [
            { rotation: { x: 160, y: 45 }, isCorrect: false, id: 'wrong-1' },
            { rotation: { x: 45, y: -160 }, isCorrect: false, id: 'wrong-2' }
        ];

        setOptions([...distractorOptions, correctOption].sort(() => Math.random() - 0.5));

        setTimeLeft(45);
        setIsCorrecting(false);
        setIsFolding(false);
        setShowSuccess(false);
    }, []);

    useEffect(() => {
        if (gameStarted && !gameOver && !showSuccess && !isCorrecting && !isFolding) {
            generateLevel();
        }
    }, [gameStarted, gameOver, level, generateLevel, showSuccess, isCorrecting, isFolding]);

    useEffect(() => {
        if (!gameStarted || gameOver || showSuccess || isCorrecting) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    playSound('complete');
                    setIsCorrecting(true);
                    setLives(l => {
                        const newLives = l - 1;
                        if (newLives <= 0) {
                            setTimeout(() => setGameOver(true), 2000);
                        } else {
                            setTimeout(() => {
                                setIsCorrecting(false);
                                if (level === 10) setGameOver(true);
                                else setLevel(lv => lv + 1);
                            }, 2000);
                        }
                        return newLives;
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, gameOver, showSuccess, isCorrecting, playSound, level]);

    // Toplam süre zamanlayıcısı
    useEffect(() => {
        if (!gameStarted || gameOver) return;
        const totalTimer = setInterval(() => {
            setTotalTime(prev => {
                if (prev <= 1) {
                    clearInterval(totalTimer);
                    setGameOver(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(totalTimer);
    }, [gameStarted, gameOver]);

    const handleSelect = (option: GameOption) => {
        if (isCorrecting || showSuccess) return;

        if (option.isCorrect) {
            playSound('correct');
            setScore(s => s + timeLeft * 15);
            if (level === 10) {
                setGameOver(true);
            } else {
                setShowSuccess(true);
                setTimeout(() => {
                    setLevel(l => l + 1);
                    setShowSuccess(false);
                }, 1500);
            }
        } else {
            playSound('incorrect');
            setScore(s => Math.max(0, s - 20));
            setIsFolding(true);
            setIsCorrecting(true);
            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                    setTimeout(() => setGameOver(true), 2500);
                } else {
                    setTimeout(() => {
                        setIsCorrecting(false);
                        if (level === 10) setGameOver(true);
                        else setLevel(lv => lv + 1);
                    }, 2500);
                }
                return newLives;
            });
        }
    };

    // ------------------ 3D Küp Bileşeni ------------------
    const Cube3D = ({ rotation, size = 120, data }: { rotation: { x: number; y: number }; size?: number; data: Record<FaceName, FaceContent> }) => {
        const half = size / 2;
        const faceStyle = (transform: string, color: string) => ({
            position: 'absolute' as const,
            width: size,
            height: size,
            transform,
            backgroundColor: color,
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backfaceVisibility: 'hidden' as const,
            borderRadius: '8px'
        });

        if (!data.FRONT) return null;

        return (
            <div style={{ perspective: '800px', width: size, height: size }}>
                <motion.div
                    animate={{ rotateX: rotation.x, rotateY: rotation.y }}
                    transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* ÖN */}
                    <div style={faceStyle(`translateZ(${half}px)`, data.FRONT.color)}>
                        <data.FRONT.icon size={size * 0.5} color="white" />
                    </div>
                    {/* ARKA */}
                    <div style={faceStyle(`translateZ(-${half}px) rotateY(180deg)`, data.BACK.color)}>
                        <data.BACK.icon size={size * 0.5} color="white" />
                    </div>
                    {/* SOL */}
                    <div style={faceStyle(`translateX(-${half}px) rotateY(-90deg)`, data.LEFT.color)}>
                        <data.LEFT.icon size={size * 0.5} color="white" />
                    </div>
                    {/* SAĞ */}
                    <div style={faceStyle(`translateX(${half}px) rotateY(90deg)`, data.RIGHT.color)}>
                        <data.RIGHT.icon size={size * 0.5} color="white" />
                    </div>
                    {/* ÜST */}
                    <div style={faceStyle(`translateY(-${half}px) rotateX(90deg)`, data.TOP.color)}>
                        <data.TOP.icon size={size * 0.5} color="white" />
                    </div>
                    {/* ALT */}
                    <div style={faceStyle(`translateY(${half}px) rotateX(-90deg)`, data.BOTTOM.color)}>
                        <data.BOTTOM.icon size={size * 0.5} color="white" />
                    </div>
                </motion.div>
            </div>
        );
    };

    // Oyun başladığında süre başlat
    useEffect(() => {
        if (gameStarted && !gameOver) {
            gameStartTimeRef.current = Date.now();
        }
    }, [gameStarted, gameOver]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameOver && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'sihirli-kupler',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    game_name: '3B Görselleştirme (Sihirli Küpler)',
                }
            });
        }
    }, [gameOver, score, level, saveGamePlay]);

    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/5 backdrop-blur-2xl p-12 rounded-[4rem] border-4 border-white/10 text-center max-w-2xl shadow-2xl relative z-10"
                >
                    <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-12">
                        <Box size={60} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-black mb-6 tracking-tight bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent uppercase italic">SİHİRLİ KÜPLER</h1>

                    <div className="text-left space-y-6 mb-12 bg-black/20 p-8 rounded-3xl border border-white/5 shadow-inner">
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-amber-500 flex-shrink-0 flex items-center justify-center font-black">1</div>
                            <p className="text-amber-100 font-bold text-lg">Sol taraftaki açık küp şemasına (net) dikkatlice bak.</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center font-black">2</div>
                            <p className="text-amber-100 font-bold text-lg">Bu şema katlandığında hangi küpün oluşacağını hayal et.</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-red-500 flex-shrink-0 flex items-center justify-center font-black">3</div>
                            <p className="text-amber-100 font-bold text-lg">Yüzeylerdeki renk ve ikon eşleşmelerini kontrol et!</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setGameStarted(true)}
                        className="px-12 py-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-2xl rounded-3xl hover:scale-110 transition-all shadow-[0_10px_0_#9a3412] border-b-4 border-orange-800 active:translate-y-2 active:shadow-none flex items-center gap-4 mx-auto group"
                    >
                        KÜPÜ KATLA! <Play fill="currentColor" />
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050510] p-6 pt-24 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.1),transparent)] pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10 flex flex-col gap-10">
                {/* HUD */}
                <div className="flex items-center justify-between bg-white/5 backdrop-blur-md p-8 rounded-[3rem] shadow-2xl border-2 border-white/10 text-white">
                    <Link to="/atolyeler/tablet-degerlendirme" className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-black transition-all">
                        <ChevronLeft size={28} /> MERKEZ
                    </Link>
                    <div className="flex items-center gap-6">
                        {/* Canlar */}
                        <div className="flex flex-col items-center px-4">
                            <span className="text-red-300/60 text-xs font-black uppercase tracking-widest mb-1">Can</span>
                            <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={18}
                                        className={`transition-all ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-center px-4 border-r border-white/10">
                            <span className="text-amber-300/60 text-xs font-black uppercase tracking-widest mb-1">Blok</span>
                            <div className="text-2xl font-black text-amber-400">{level}<span className="text-amber-900 text-lg">/10</span></div>
                        </div>
                        <div className="flex flex-col items-center px-4 border-r border-white/10">
                            <span className="text-orange-300/60 text-xs font-black uppercase tracking-widest mb-1">Puan</span>
                            <div className="text-2xl font-black text-orange-400">{score}</div>
                        </div>
                        <div className="flex flex-col items-center px-4 border-r border-white/10">
                            <span className="text-red-300/60 text-xs font-black uppercase tracking-widest mb-1">Süre</span>
                            <div className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-amber-400'} transition-all font-mono`}>
                                {timeLeft}s
                            </div>
                        </div>
                        {/* Toplam Süre */}
                        <div className="flex flex-col items-center min-w-[70px]">
                            <span className="text-cyan-300/60 text-xs font-black uppercase tracking-widest mb-1">Toplam</span>
                            <div className={`flex items-center gap-1 text-xl font-black font-mono ${totalTime < 30 ? 'text-red-400 animate-pulse' : 'text-cyan-400'} transition-all`}>
                                <Clock size={16} />
                                {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => { setLevel(1); setScore(0); setLives(5); setTotalTime(180); generateLevel(); }}
                        className="p-4 bg-white/5 text-amber-300 hover:bg-white/10 rounded-2xl transition-all border border-white/10 active:scale-95"
                    >
                        <RotateCcw size={28} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Sol: Açınım (Net) Paneli */}
                    <div className="bg-white/5 backdrop-blur-lg p-10 rounded-[4rem] border-2 border-white/10 shadow-inner flex flex-col items-center gap-8 min-h-[500px] justify-center relative overflow-hidden">
                        <div className="flex items-center gap-4 z-20">
                            <div className="bg-amber-900/40 px-8 py-2 rounded-full text-amber-200 font-black text-xs flex items-center gap-3 border border-amber-500/30 uppercase tracking-widest">
                                <Layers size={20} className="animate-pulse" /> {isFolding ? 'Küp Katlanıyor...' : 'Küp Açınımı'}
                            </div>
                            <button
                                onClick={() => setIsFolding(!isFolding)}
                                className={`p-2 rounded-xl transition-all border-2 flex items-center gap-2 font-black text-xs uppercase tracking-tighter ${isFolding
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30'
                                    }`}
                            >
                                {isFolding ? <RotateCcw size={16} /> : <Play size={16} />}
                                {isFolding ? 'Aç' : 'Katla'}
                            </button>
                        </div>

                        <div
                            className="relative transition-all duration-1000"
                            style={{
                                perspective: '1200px',
                                width: '320px',
                                height: '320px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <motion.div
                                animate={isFolding ? { rotateX: -20, rotateY: 35 } : { rotateX: 0, rotateY: 0 }}
                                transition={{ duration: 2 }}
                                style={{
                                    position: 'relative',
                                    width: '80px',
                                    height: '80px',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                {currentNet.grid.map((row, rIdx) => (
                                    row.map((faceName, cIdx) => {
                                        if (!faceName || !facesData[faceName]) return null;

                                        // FRONT yüzünü merkez (0,0,0) kabul et
                                        // Grid içindeki FRONT koordinatlarını bul
                                        let frontR = 0, frontC = 0;
                                        currentNet.grid.forEach((r, ri) => r.forEach((f, ci) => { if (f === 'FRONT') { frontR = ri; frontC = ci; } }));

                                        const relR = rIdx - frontR;
                                        const relC = cIdx - frontC;
                                        const size = 80;

                                        // Katlanma Hedefleri (FRONT merkezli)
                                        const foldTargets: Record<FaceName, { rx: number, ry: number, rz: number, tx: number, ty: number, tz: number }> = {
                                            FRONT: { rx: 0, ry: 0, rz: 0, tx: 0, ty: 0, tz: size / 2 },
                                            BACK: { rx: 0, ry: 180, rz: 0, tx: 0, ty: 0, tz: -size / 2 },
                                            LEFT: { rx: 0, ry: -90, rz: 0, tx: -size / 2, ty: 0, tz: 0 },
                                            RIGHT: { rx: 0, ry: 90, rz: 0, tx: size / 2, ty: 0, tz: 0 },
                                            TOP: { rx: 90, ry: 0, rz: 0, tx: 0, ty: -size / 2, tz: 0 },
                                            BOTTOM: { rx: -90, ry: 0, rz: 0, tx: 0, ty: size / 2, tz: 0 }
                                        };

                                        const target = foldTargets[faceName];

                                        return (
                                            <motion.div
                                                key={faceName}
                                                initial={false}
                                                animate={isFolding ? {
                                                    x: target.tx,
                                                    y: target.ty,
                                                    z: target.tz,
                                                    rotateX: target.rx,
                                                    rotateY: target.ry,
                                                    rotateZ: target.rz,
                                                } : {
                                                    x: relC * size,
                                                    y: relR * size,
                                                    z: 0,
                                                    rotateX: 0,
                                                    rotateY: 0,
                                                    rotateZ: 0,
                                                }}
                                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                                className="absolute inset-0 rounded-xl border-2 border-white/20 flex items-center justify-center text-white"
                                                style={{
                                                    backgroundColor: facesData[faceName].color,
                                                    backfaceVisibility: 'hidden',
                                                    transformStyle: 'preserve-3d'
                                                }}
                                            >
                                                {React.createElement(facesData[faceName].icon, { size: 40 })}
                                            </motion.div>
                                        );
                                    })
                                ))}
                            </motion.div>
                        </div>

                        <p className="text-amber-300/40 text-[10px] font-black uppercase tracking-[0.3em] italic z-20">
                            {isFolding ? 'Hatanı gör ve doğru katlanışı izle' : 'Yukarıdaki şemayı zihninde katla'}
                        </p>
                    </div>

                    {/* Sağ: Seçenekler Paneli */}
                    <div className="bg-white/5 backdrop-blur-lg p-10 rounded-[4rem] border-2 border-white/10 shadow-2xl flex flex-col items-center gap-8">
                        <h2 className="text-3xl font-black text-white flex items-center gap-3 italic text-center uppercase tracking-tighter">
                            Hangisi Oluşur? <Sparkles className="text-yellow-400" />
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-6 w-full">
                            {options.map((option) => (
                                <motion.button
                                    key={option.id}
                                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,191,0,0.1)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSelect(option)}
                                    className={`bg-white/5 rounded-[3rem] p-10 transition-all border-4 flex flex-col items-center gap-6 group overflow-hidden ${isCorrecting && option.isCorrect ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'border-white/10'
                                        }`}
                                >
                                    <div className="py-8">
                                        <Cube3D rotation={option.rotation} size={100} data={facesData} />
                                    </div>
                                    <div className="h-2 w-20 bg-amber-500/20 rounded-full group-hover:bg-amber-500/50 transition-colors" />
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mesaj Overlays */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }} className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                            <div className="bg-emerald-500 text-white px-12 py-6 rounded-full font-black text-4xl shadow-2xl flex items-center gap-6 border-4 border-white animate-bounce italic">
                                <Zap className="fill-white" /> MUHTEŞEM!
                            </div>
                        </motion.div>
                    )}

                    {gameOver && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#050510]/95 backdrop-blur-3xl">
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/5 rounded-[5rem] p-20 border-2 border-white/20 text-center max-w-2xl w-full shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                                <div className="w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(234,179,8,0.3)] rotate-12">
                                    <Trophy size={100} />
                                </div>
                                <h2 className="text-6xl font-black text-white mb-6 tracking-tighter italic uppercase text-shadow-lg">GÖREV TAMAM</h2>
                                <p className="text-amber-100 font-bold text-3xl mb-14 leading-relaxed italic">
                                    3 Boyutlu Uzayı Fethettin! <br />
                                    <span className="text-7xl text-amber-500 block font-black mt-8 not-italic">{score} <span className="text-2xl text-amber-800">PUAN</span></span>
                                </p>
                                <div className="flex flex-col gap-6">
                                    <button onClick={() => { setLevel(1); setScore(0); setGameOver(false); setGameStarted(true); }} className="w-full py-8 bg-amber-600 text-white font-black rounded-4xl flex items-center justify-center gap-6 shadow-[0_12px_0_#9a3412] border-b-4 border-amber-800 hover:scale-105 transition-all text-3xl active:translate-y-3 active:shadow-none uppercase">YENİDEN BAŞLA</button>
                                    <Link to="/atolyeler/tablet-degerlendirme" className="text-amber-400 font-black text-2xl hover:text-amber-300 transition-colors block mt-8 underline decoration-4 underline-offset-8">ANA ÜSSE DÖN</Link>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .text-shadow-lg { text-shadow: 0 10px 20px rgba(0,0,0,0.5); }
            `}} />
        </div>
    );
};

export default MagicCubeGame;
