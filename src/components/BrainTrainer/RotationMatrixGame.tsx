import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Play, Trophy, Rocket, Sparkles, Compass } from 'lucide-react';
import { useSound } from '../../hooks/useSound';

// ------------------ Tip Tanımları ------------------
type Stick = {
    color: string;
    isVertical: boolean;
    x: number;
    y: number;
    length: number;
};

type Shape = {
    id: string;
    type: 'sticks';
    rotation: number;
    sticks: Stick[];
};

interface GameOption {
    shape: Shape;
    isCorrect: boolean;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#A29BFE', '#55E6C1', '#FD79A8', '#FAB1A0', '#00D2D3', '#54A0FF'];

const RotationMatrixGame: React.FC = () => {
    const { playSound } = useSound();
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [sequence, setSequence] = useState<Shape[]>([]);
    const [targetIndex, setTargetIndex] = useState<number>(-1);
    const [options, setOptions] = useState<GameOption[]>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isCorrecting, setIsCorrecting] = useState(false);
    const [isLevelLoading, setIsLevelLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);

    const svgSize = 100;

    // ------------------ Sonsuz Şekil Motoru (Infinite Shape Engine) ------------------
    const generateShape = useCallback((): Shape => {
        const numSticks = 3 + Math.floor(Math.random() * 4); // 3 ile 6 arası çubuk
        const sticks: Stick[] = [];

        // Asimetriyi sağlamak için bir ana pivot (merkez kaçıklığı) belirle
        const globalOffsetX = (Math.random() - 0.5) * 10;
        const globalOffsetY = (Math.random() - 0.5) * 10;

        for (let i = 0; i < numSticks; i++) {
            const isVertical = Math.random() > 0.5;
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];

            // Her çubuğu ızgara tabanlı ama rastgele offsetlerle yerleştir
            sticks.push({
                color,
                isVertical,
                x: globalOffsetX + (isVertical ? (Math.random() - 0.5) * 44 : (Math.random() - 0.5) * 12),
                y: globalOffsetY + (isVertical ? (Math.random() - 0.5) * 12 : (Math.random() - 0.5) * 44),
                length: 45 + Math.random() * 45 // 45px ile 90px arası rastgele boy
            });
        }

        // Zorunlu bir asimetrik çubuk ekle (180 derece dönüşte aynı görünmemesi için)
        sticks.push({
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            isVertical: Math.random() > 0.5,
            x: 22 + Math.random() * 8,
            y: -22 - Math.random() * 8,
            length: 35
        });

        return {
            id: `inf-${Math.random().toString(36).slice(2, 11)}`,
            type: 'sticks',
            rotation: 0,
            sticks
        };
    }, []);

    const generateLevel = useCallback(() => {
        setIsLevelLoading(true);
        // Dönüş adımı: 45, 90, 135
        const stepRotations = [45, 90, 135];
        const step = stepRotations[Math.floor(Math.random() * stepRotations.length)];
        const baseShape = generateShape();

        const newSequence: Shape[] = [];
        for (let i = 0; i < 9; i++) {
            newSequence.push({
                ...baseShape,
                rotation: (i * step) % 360,
                id: `step-${i}-${Math.random()}`
            });
        }

        const questionIndex = Math.floor(Math.random() * 9);
        setSequence(newSequence);
        setTargetIndex(questionIndex);

        const correctShape = newSequence[questionIndex];
        const correctRot = Math.round(correctShape.rotation % 360);

        const distractors: GameOption[] = [];
        const usedRotations = [correctRot];

        // Yanıltıcılar: 45 derecelik adımlarla unik rotasyonlar
        const allPossibleRotations = [0, 45, 90, 135, 180, 225, 270, 315];

        let safety = 0;
        while (distractors.length < 3 && safety < 100) {
            safety++;
            const randomRot = allPossibleRotations[Math.floor(Math.random() * allPossibleRotations.length)];
            if (!usedRotations.includes(randomRot)) {
                distractors.push({
                    shape: { ...baseShape, rotation: randomRot, id: `wrong-${distractors.length}-${Math.random()}` },
                    isCorrect: false
                });
                usedRotations.push(randomRot);
            }
        }

        const allOptions = [...distractors, { shape: correctShape, isCorrect: true }];
        setOptions(allOptions.sort(() => Math.random() - 0.5));

        setShowSuccess(false);
        setIsCorrecting(false);
        setIsLevelLoading(false);
        setTimeLeft(30);
    }, [generateShape]);

    useEffect(() => {
        if (gameStarted && !gameOver && !showSuccess && !isCorrecting && !isLevelLoading) {
            generateLevel();
        }
    }, [gameStarted, gameOver, level, generateLevel, showSuccess, isCorrecting]);

    useEffect(() => {
        if (!gameStarted || gameOver || showSuccess || isCorrecting) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    playSound('complete');
                    setIsCorrecting(true);
                    setTimeout(() => {
                        if (level === 15) setGameOver(true);
                        else setLevel(l => l + 1);
                    }, 2000);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, gameOver, showSuccess, isCorrecting, playSound, level]);

    const handleOptionSelect = (option: GameOption) => {
        if (isCorrecting || showSuccess || isLevelLoading) return;

        if (option.isCorrect) {
            playSound('correct');
            setScore(s => s + timeLeft * 10);
            if (level === 15) {
                setGameOver(true);
            } else {
                setShowSuccess(true);
                // Başarı mesajından sonra seviye atla
                setTimeout(() => {
                    setLevel(l => l + 1);
                    setShowSuccess(false);
                }, 1500);
            }
        } else {
            playSound('incorrect');
            setScore(s => Math.max(0, s - 10));
            setIsCorrecting(true);
            setTimeout(() => {
                if (level === 15) setGameOver(true);
                else setLevel(l => l + 1);
            }, 2000);
        }
    };

    const ShapeSVG = ({ shape, size }: { shape: Shape; size: number }) => {
        const center = size / 2;
        const stickWidth = 10;
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <motion.g
                    initial={false}
                    animate={{ rotate: shape.rotation }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    style={{ originX: "50%", originY: "50%" }}
                >
                    {shape.sticks.map((stick, i) => (
                        <rect
                            key={i}
                            x={center + stick.x - (stick.isVertical ? stickWidth / 2 : stick.length / 2)}
                            y={center + stick.y - (stick.isVertical ? stick.length / 2 : stickWidth / 2)}
                            width={stick.isVertical ? stickWidth : stick.length}
                            height={stick.isVertical ? stick.length : stickWidth}
                            fill={stick.color}
                            rx={stickWidth / 2}
                            stroke="white"
                            strokeWidth="1.5"
                        />
                    ))}
                    <circle cx={center} cy={center} r="3" fill="white" opacity="0.4" />
                </motion.g>
            </svg>
        );
    };

    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-[#0a0a2e] flex items-center justify-center p-6 relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/5 backdrop-blur-xl p-12 rounded-[4rem] border-4 border-white/20 text-center max-w-2xl shadow-2xl relative z-10"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <Rocket size={60} className="animate-bounce" />
                    </div>
                    <h1 className="text-5xl font-black mb-6 tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent italic uppercase">ASTRO-SEKANS</h1>

                    <div className="text-left space-y-6 mb-12 bg-white/5 p-8 rounded-3xl border border-white/10 shadow-inner">
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center font-black italic">1</div>
                            <p className="text-blue-100 font-bold text-lg">3x3 ızgaradaki 9 kutunun dönüş kuralını saat yönünde (0°, 90°, 180°...) analiz et.</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center font-black italic">2</div>
                            <p className="text-blue-100 font-bold text-lg">Soru işaretli eksik kutuda şeklin hangi açıda durması gerektiğini bul.</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-amber-500 flex-shrink-0 flex items-center justify-center font-black italic">3</div>
                            <p className="text-blue-100 font-bold text-lg">Dönüşler her zaman birbirini takip eder, kuralı bul ve doğruyu seç!</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setGameStarted(true)}
                        className="px-12 py-6 bg-purple-600 text-white font-black text-2xl rounded-3xl hover:scale-110 transition-all shadow-[0_10px_0_#4c1d95] border-b-4 border-purple-800 active:translate-y-2 active:shadow-none flex items-center gap-4 mx-auto group"
                    >
                        Anladım, Yolculuğa Başla! <Play fill="currentColor" />
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05051a] p-6 pt-24 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.15),transparent)] pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10 flex flex-col gap-10">
                <div className="flex items-center justify-between bg-white/5 backdrop-blur-md p-8 rounded-[3rem] shadow-2xl border-2 border-white/10 text-white">
                    <Link to="/atolyeler/tablet-degerlendirme" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-black transition-all">
                        <ChevronLeft size={28} /> MERKEZ
                    </Link>
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col items-center px-6 border-r border-white/10">
                            <span className="text-blue-300/60 text-xs font-black uppercase tracking-widest mb-1 italic">Rota</span>
                            <div className="text-3xl font-black text-blue-400">{level}<span className="text-blue-900 text-lg">/15</span></div>
                        </div>
                        <div className="flex flex-col items-center px-6 border-r border-white/10">
                            <span className="text-purple-300/60 text-xs font-black uppercase tracking-widest mb-1 italic">Enerji</span>
                            <div className="text-3xl font-black text-purple-400">{score}</div>
                        </div>
                        <div className="min-w-[80px] text-center">
                            <span className="text-red-300/60 text-xs font-black uppercase tracking-widest mb-1 italic">Oksijen</span>
                            <div className={`text-4xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-amber-400'} transition-all font-mono`}>
                                {timeLeft}s
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => { setLevel(1); setScore(0); generateLevel(); }}
                        className="p-4 bg-white/5 text-blue-300 hover:bg-white/10 rounded-2xl transition-all border border-white/10 active:scale-95"
                    >
                        <RotateCcw size={28} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* 3x3 Grid Ana Panel */}
                    <div className="bg-white/5 backdrop-blur-lg p-8 rounded-[4rem] border-2 border-white/10 shadow-inner flex flex-col items-center gap-6">
                        <div className="bg-blue-900/40 px-8 py-2 rounded-full text-blue-200 font-black text-xs flex items-center gap-3 border border-blue-500/30 italic">
                            <Compass size={20} className="animate-spin-slow" /> SEKANSI ANALİZ ET
                        </div>

                        <div className="grid grid-cols-3 gap-3 p-4 bg-black/40 rounded-[2.5rem] border-4 border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)] aspect-square w-full max-w-[400px]">
                            {sequence.map((shape, idx) => (
                                <div
                                    key={shape.id}
                                    className={`relative bg-white/5 rounded-2xl flex items-center justify-center border transition-all ${idx === targetIndex ? 'border-4 border-dashed border-blue-500/50 bg-blue-500/10' : 'border-white/10'
                                        }`}
                                >
                                    <span className="absolute top-1 left-2 text-[10px] font-black text-white/20 italic">{idx + 1}</span>
                                    {idx === targetIndex ? (
                                        <div className="text-blue-400/50 font-black text-4xl animate-pulse">?</div>
                                    ) : (
                                        <ShapeSVG shape={shape} size={svgSize - 20} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-blue-300/40 text-[10px] font-black uppercase tracking-[0.2em] italic">1'den 9'a Dönüş Takibini Yap</p>
                    </div>

                    {/* Seçenekler Paneli */}
                    <div className="bg-white/5 backdrop-blur-lg p-10 rounded-[4rem] border-2 border-white/10 shadow-2xl flex flex-col items-center gap-10">
                        <h2 className="text-3xl font-black text-white flex items-center gap-3 italic text-center uppercase tracking-tighter underline decoration-purple-500 decoration-4 underline-offset-8 mb-4">
                            Eksik Parçayı Bul! <Sparkles className="text-yellow-400" />
                        </h2>
                        <div className="grid grid-cols-2 gap-6 w-full">
                            {options.map((option) => (
                                <motion.button
                                    key={option.shape.id}
                                    whileHover={!isCorrecting && !showSuccess ? { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
                                    whileTap={!isCorrecting && !showSuccess ? { scale: 0.95 } : {}}
                                    onClick={() => handleOptionSelect(option)}
                                    className={`bg-white/5 rounded-[3rem] p-6 transition-all border-4 relative group overflow-hidden ${isCorrecting && option.isCorrect
                                        ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                                        : 'border-white/10'
                                        } ${!isCorrecting && !showSuccess ? 'hover:border-purple-500/50' : ''}`}
                                >
                                    <div className="flex items-center justify-center">
                                        <ShapeSVG shape={option.shape} size={svgSize} />
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            key="success-overlay"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1.1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-emerald-500 text-white px-20 py-10 rounded-full font-black text-6xl shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center gap-8 border-4 border-white animate-bounce italic">
                                <Rocket size={60} /> SÜPER!
                            </div>
                        </motion.div>
                    )}

                    {gameOver && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#05051a]/90 backdrop-blur-3xl">
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/5 rounded-[5rem] p-20 border-2 border-white/20 text-center max-w-2xl w-full shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                                <div className="w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(234,179,8,0.3)]"><Trophy size={100} /></div>
                                <h2 className="text-7xl font-black text-white mb-6 tracking-tighter italic uppercase underline decoration-purple-500">TAMAMLANDI</h2>
                                <p className="text-blue-200 font-bold text-3xl mb-14 leading-relaxed italic">Galaksi rotasını başarıyla çizdin!<br /><span className="text-6xl text-purple-400 mt-10 block font-black not-italic">PUAN: {score}</span></p>
                                <div className="space-y-6">
                                    <button onClick={() => { setLevel(1); setScore(0); setGameOver(false); setGameStarted(true); }} className="w-full py-10 bg-purple-600 text-white font-black rounded-4xl flex items-center justify-center gap-6 shadow-[0_15px_0_#4c1d95] border-b-4 border-purple-800 hover:scale-105 transition-all text-3xl active:translate-y-3 active:shadow-none"><RotateCcw size={40} /> YENİ ROTA</button>
                                    <Link to="/atolyeler/tablet-degerlendirme" className="text-blue-400 font-black text-2xl hover:text-blue-300 transition-colors block mt-12 underline decoration-4 underline-offset-8">ANA ÜSSE DÖN</Link>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}} />
        </div>
    );
};

export default RotationMatrixGame;
