import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Play, Trophy, Brain, Sparkles, Smile, Heart, Clock } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// ------------------ Tip Tanımları ------------------
interface PatternProps {
    points?: number;
    sides?: number;
    lines?: number;
    pathData?: string;
}

type Pattern = {
    defs: string;
    type: string;
    backgroundColor: string;
    foregroundColor: string;
    size: number;
    rotation: number;
    opacity: number;
    id: string;
    props?: PatternProps;
};

interface GameOption {
    pattern: Pattern[];
    isCorrect: boolean;
}

// Çocuk dostu, canlı renk paleti
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#A29BFE', '#55E6C1', '#FD79A8', '#FAB1A0', '#00D2D3', '#54A0FF', '#5F27CD', '#FF9F43'];
const PATTERN_TYPES = ['dots', 'stripes', 'zigzag', 'waves', 'checkerboard', 'crosshatch', 'star', 'polygon', 'scribble', 'burst'];

const PartWholeGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [gamePattern, setGamePattern] = useState<Pattern[]>([]);
    const [options, setOptions] = useState<GameOption[]>([]);
    const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isCorrecting, setIsCorrecting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [lives, setLives] = useState(5);
    const [totalTime, setTotalTime] = useState(180); // 3 dakika = 180 saniye
    const gameStartTimeRef = useRef<number>(0);

    const svgSize = 300;
    const pieceSize = 100;

    // ------------------ Desen Generator ------------------
    const getPatternDefs = useCallback((pattern: Pattern): string => {
        const strokeWidth = pattern.size / 6;
        const { size, backgroundColor, foregroundColor, type, id, props } = pattern;

        const baseRect = `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>`;

        switch (type) {
            case 'dots':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${foregroundColor}"/></pattern>`;
            case 'stripes':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<rect width="${size}" height="${size / 3}" fill="${foregroundColor}"/></pattern>`;
            case 'zigzag':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="M0 0 L${size / 2} ${size} L${size} 0" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/></pattern>`;
            case 'waves':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="M0 ${size / 2} Q${size / 4} 0 ${size / 2} ${size / 2} T${size} ${size / 2}" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/></pattern>`;
            case 'checkerboard':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<rect width="${size / 2}" height="${size / 2}" fill="${foregroundColor}"/><rect x="${size / 2}" y="${size / 2}" width="${size / 2}" height="${size / 2}" fill="${foregroundColor}"/></pattern>`;
            case 'crosshatch':
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="M0 0 L${size} ${size} M0 ${size} L${size} 0" stroke="${foregroundColor}" stroke-width="${strokeWidth}"/></pattern>`;

            case 'star': {
                const points = props?.points || 5;
                const innerRadius = size / 4;
                const outerRadius = size / 2.5;
                let path = '';
                for (let i = 0; i < points * 2; i++) {
                    const angle = (i * Math.PI) / points;
                    const r = i % 2 === 0 ? outerRadius : innerRadius;
                    const x = size / 2 + Math.cos(angle) * r;
                    const y = size / 2 + Math.sin(angle) * r;
                    path += (i === 0 ? 'M' : 'L') + `${x},${y}`;
                }
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="${path}Z" fill="${foregroundColor}"/></pattern>`;
            }

            case 'polygon': {
                const sides = props?.sides || 6;
                const radius = size / 2.5;
                let path = '';
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI) / sides;
                    const x = size / 2 + Math.cos(angle) * radius;
                    const y = size / 2 + Math.sin(angle) * radius;
                    path += (i === 0 ? 'M' : 'L') + `${x},${y}`;
                }
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="${path}Z" fill="${foregroundColor}"/></pattern>`;
            }

            case 'scribble': {
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="${props?.pathData}" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}" stroke-linecap="round"/></pattern>`;
            }

            case 'burst': {
                const lines = props?.lines || 8;
                let path = '';
                for (let i = 0; i < lines; i++) {
                    const angle = (i * 2 * Math.PI) / lines;
                    const x2 = size / 2 + Math.cos(angle) * (size / 2);
                    const y2 = size / 2 + Math.sin(angle) * (size / 2);
                    path += `M${size / 2},${size / 2} L${x2},${y2} `;
                }
                return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}<path d="${path}" stroke="${foregroundColor}" stroke-width="${strokeWidth}"/></pattern>`;
            }

            default: return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${baseRect}</pattern>`;
        }
    }, []);

    const generatePattern = useCallback((): Pattern => {
        const type = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
        const backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const foregroundColor = COLORS.filter(c => c !== backgroundColor)[Math.floor(Math.random() * (COLORS.length - 1))];
        const size = 30 + Math.random() * 40;

        const props: PatternProps = {};
        if (type === 'star') props.points = 4 + Math.floor(Math.random() * 5);
        if (type === 'polygon') props.sides = 3 + Math.floor(Math.random() * 6);
        if (type === 'burst') props.lines = 6 + Math.floor(Math.random() * 10);
        if (type === 'scribble') {
            const points = Array.from({ length: 4 }, () => ({
                x: Math.random() * size,
                y: Math.random() * size
            }));
            props.pathData = `M${points[0].x},${points[0].y} Q${points[1].x},${points[1].y} ${points[2].x},${points[2].y} T${points[3].x},${points[3].y}`;
        }

        const base: Pattern = {
            defs: '',
            type,
            backgroundColor,
            foregroundColor,
            size,
            rotation: Math.random() * 360,
            opacity: 0.85 + Math.random() * 0.15,
            id: `pattern-${Math.random().toString(36).slice(2, 11)}`,
            props
        };
        return { ...base, defs: getPatternDefs(base) };
    }, [getPatternDefs]);

    // Mikro renk sapması
    const distortColor = (hex: string | undefined, intensity: number = 10): string => {
        // Güvenlik kontrolü
        if (!hex || typeof hex !== 'string' || hex.length < 7) {
            return '#888888'; // Fallback renk
        }
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const adjust = (c: number) => Math.max(0, Math.min(255, c + Math.round((Math.random() - 0.5) * intensity)));
        return `#${adjust(r).toString(16).padStart(2, '0')}${adjust(g).toString(16).padStart(2, '0')}${adjust(b).toString(16).padStart(2, '0')}`;
    };

    const generateLevel = useCallback(() => {
        const numShapes = Math.min(level + 1, 8);
        const newPattern = Array.from({ length: numShapes }, () => generatePattern());
        setGamePattern(newPattern);

        const x = Math.floor(Math.random() * (svgSize - pieceSize));
        const y = Math.floor(Math.random() * (svgSize - pieceSize));
        setTargetPos({ x, y });

        const correctOption: GameOption = { pattern: newPattern, isCorrect: true };
        const distractors: GameOption[] = Array.from({ length: 3 }, () => {
            const wrongPattern = newPattern.map(p => {
                const updatedP = {
                    ...p,
                    id: `pattern-${Math.random().toString(36).slice(2, 11)}`,
                    rotation: p.rotation + (Math.random() - 0.5) * (level + 5),
                    size: p.size * (0.95 + Math.random() * 0.1),
                    backgroundColor: distortColor(p.backgroundColor, 12),
                    foregroundColor: distortColor(p.foregroundColor, 12),
                    opacity: Math.max(0.5, p.opacity * (0.95 + Math.random() * 0.1))
                };
                return { ...updatedP, defs: getPatternDefs(updatedP) };
            });
            return { pattern: wrongPattern, isCorrect: false };
        });

        setOptions([...distractors, correctOption].sort(() => Math.random() - 0.5));
        setShowSuccess(false);
        setIsCorrecting(false);
        setTimeLeft(30);
    }, [level, generatePattern, getPatternDefs]);

    useEffect(() => {
        if (gameStarted && !gameOver && !showSuccess && !isCorrecting) {
            generateLevel();
        }
    }, [gameStarted, gameOver, level, generateLevel, showSuccess, isCorrecting]);

    // Soru zamanlayıcısı
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
                            setTimeout(() => setGameOver(true), 1500);
                        } else {
                            setTimeout(() => {
                                setIsCorrecting(false);
                                if (level === 20) {
                                    setGameOver(true);
                                } else {
                                    setLevel(lv => lv + 1);
                                }
                            }, 1500);
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

    const handleOptionSelect = (option: GameOption) => {
        if (isCorrecting || showSuccess) return;

        if (option.isCorrect) {
            playSound('correct');
            setScore(s => s + timeLeft * 10);
            if (level === 20) {
                setGameOver(true);
            } else {
                setShowSuccess(true);
                setTimeout(() => {
                    setLevel(l => l + 1);
                    setShowSuccess(false);
                }, 1200);
            }
        } else {
            playSound('incorrect');
            setScore(s => Math.max(0, s - 10));
            setIsCorrecting(true);
            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                    setTimeout(() => setGameOver(true), 1500);
                } else {
                    setTimeout(() => {
                        setIsCorrecting(false);
                        if (level === 20) {
                            setGameOver(true);
                        } else {
                            setLevel(lv => lv + 1);
                        }
                    }, 1500);
                }
                return newLives;
            });
        }
    };

    const restart = () => {
        setOptions([]); // Önce seçenekleri temizle
        setGamePattern([]); // Desenini temizle
        setLevel(1);
        setScore(0);
        setLives(5);
        setTotalTime(180);
        setGameOver(false);
        setGameStarted(true);
        setShowSuccess(false);
        setIsCorrecting(false);
        gameStartTimeRef.current = Date.now();
    };

    // Yeni soru yenileme fonksiyonu
    const nextQuestion = useCallback(() => {
        if (isCorrecting || showSuccess || gameOver) return;
        setScore(s => Math.max(0, s - 15)); // Puan cezası
        generateLevel();
    }, [isCorrecting, showSuccess, gameOver, generateLevel]);

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
                game_id: 'parca-butun',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    game_name: 'Parça Bütün İlişkisi',
                }
            });
        }
    }, [gameOver, score, level, saveGamePlay]);

    // ------------------ Render Component ------------------
    const PatternSVG = ({ pattern, size, viewBox, isMain = false }: { pattern: Pattern[], size: number, viewBox?: string, isMain?: boolean }) => (
        <svg
            width={size}
            height={size}
            viewBox={viewBox || `0 0 ${svgSize} ${svgSize}`}
            className="rounded-[2.5rem] bg-white shadow-xl overflow-hidden border-4 border-white"
        >
            {pattern.map((p, i) => (
                <React.Fragment key={`${p.id}-${i}`}>
                    <defs dangerouslySetInnerHTML={{ __html: p.defs }} />
                    <rect
                        x="0" y="0" width={svgSize} height={svgSize}
                        fill={`url(#${p.id})`}
                        opacity={p.opacity}
                        transform={`rotate(${p.rotation} ${svgSize / 2} ${svgSize / 2})`}
                    />
                </React.Fragment>
            ))}
            {isMain && (
                <motion.rect
                    layoutId="white-gap"
                    x={targetPos.x}
                    y={targetPos.y}
                    width={pieceSize}
                    height={pieceSize}
                    fill="white"
                    stroke="#f0f0f0"
                    strokeWidth="1"
                    rx="15"
                />
            )}
        </svg>
    );

    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6 pt-24 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/15 rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px]" />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-800/50 backdrop-blur-xl p-12 rounded-[3rem] border border-white/10 text-center max-w-xl shadow-2xl relative z-10"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-purple-500/30">
                        <Brain size={48} className="text-white" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-bold uppercase tracking-widest mb-6">
                        <Sparkles size={16} /> Beyin Egzersizi
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">Parça <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Bütün</span></h1>
                    <p className="text-slate-400 font-medium mb-10 leading-relaxed text-lg">
                        Milyarlarca farklı desenden eksik parçayı bulmaya hazır mısın?<br />Zihnini çalıştır ve resimleri tamamla!
                    </p>
                    <button
                        onClick={() => setGameStarted(true)}
                        className="px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-xl rounded-2xl hover:scale-105 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center gap-4 mx-auto"
                    >
                        <Play fill="currentColor" size={24} /> Oyuna Başla
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 pt-24 relative overflow-hidden flex flex-col items-center">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/15 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[150px]" />

            <div className="container mx-auto max-w-5xl relative z-10 flex flex-col gap-8">
                {/* Header Bar */}
                <div className="flex items-center justify-between bg-slate-800/50 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                    <Link to="/atolyeler/tablet-degerlendirme" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-bold transition-all">
                        <ChevronLeft size={24} /> Geri
                    </Link>
                    <div className="flex items-center gap-6">
                        {/* Canlar */}
                        <div className="flex flex-col items-center">
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Can</span>
                            <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={20}
                                        className={`transition-all ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Seviye</span>
                            <div className="text-2xl font-black text-white">{level}<span className="text-slate-600 text-sm">/20</span></div>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Puan</span>
                            <div className="text-2xl font-black text-emerald-400">{score}</div>
                        </div>
                        {/* Soru Süresi */}
                        <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Soru</span>
                            <div className={`text-2xl font-black font-mono ${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-amber-400'} transition-all`}>
                                {timeLeft}
                            </div>
                        </div>
                        {/* Toplam Süre */}
                        <div className="flex flex-col items-center min-w-[70px]">
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Toplam</span>
                            <div className={`flex items-center gap-1 text-xl font-black font-mono ${totalTime < 30 ? 'text-red-400 animate-pulse' : 'text-cyan-400'} transition-all`}>
                                <Clock size={16} />
                                {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={nextQuestion}
                        disabled={isCorrecting || showSuccess}
                        className="p-3 bg-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/30 rounded-xl transition-all border border-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        title="Yeni soru (puan cezası)"
                    >
                        <RefreshCw size={20} />
                        <span className="text-sm font-bold hidden sm:inline">Soru Yenile</span>
                    </button>
                </div>

                {/* Game Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800/50 backdrop-blur-xl p-10 rounded-3xl border border-white/10 space-y-6 flex flex-col items-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-bold">
                            <Brain size={20} /> Deseni İncele
                        </div>
                        <div className="relative p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                            <PatternSVG pattern={gamePattern} size={svgSize} isMain={true} />
                        </div>
                    </motion.div>

                    <div className="bg-slate-800/50 backdrop-blur-xl p-10 rounded-3xl border border-white/10 flex flex-col items-center gap-8">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            Doğru Parçayı Bul <Sparkles className="text-amber-400" size={24} />
                        </h2>
                        <div className="grid grid-cols-2 gap-6 w-full">
                            {options.length > 0 && options.map((option, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={!isCorrecting && !showSuccess ? { scale: 1.05, y: -4 } : {}}
                                    whileTap={!isCorrecting && !showSuccess ? { scale: 0.98 } : {}}
                                    onClick={() => handleOptionSelect(option)}
                                    className={`bg-slate-700/50 rounded-2xl p-4 transition-all border-2 relative group overflow-hidden ${isCorrecting && option.isCorrect
                                        ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)] scale-105'
                                        : 'border-white/5'
                                        } ${!isCorrecting && !showSuccess ? 'hover:border-purple-500/50 hover:bg-slate-600/50' : ''}`}
                                >
                                    <PatternSVG
                                        pattern={option.pattern}
                                        size={140}
                                        viewBox={`${targetPos.x} ${targetPos.y} ${pieceSize} ${pieceSize}`}
                                    />
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.3, y: 100 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: -100 }}
                            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-16 py-10 rounded-3xl font-black text-5xl shadow-2xl flex items-center gap-6 border border-white/20">
                                <Smile size={60} fill="currentColor" /> Harika!
                            </div>
                        </motion.div>
                    )}

                    {gameOver && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-16 border border-white/10 text-center max-w-lg w-full shadow-2xl relative"
                            >
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-28 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/30">
                                    <Trophy size={56} />
                                </div>
                                <h2 className="text-5xl font-black text-white mb-6 mt-8">Oyun Bitti!</h2>
                                <p className="text-slate-400 font-medium text-xl mb-4">
                                    {score > 0 ? "Milyarlarca desen içinden doğru yolu buldun!" : "Üzülme, bir sonraki sefer kesin yapacaksın!"}
                                </p>
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-10">
                                    Skor: {score}
                                </div>
                                <div className="space-y-4">
                                    <button
                                        onClick={restart}
                                        className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl flex items-center justify-center gap-4 shadow-lg shadow-purple-500/30 hover:scale-105 transition-all text-xl"
                                    >
                                        <RefreshCw size={28} /> Tekrar Oyna
                                    </button>
                                    <Link
                                        to="/atolyeler/tablet-degerlendirme"
                                        className="block py-4 text-slate-400 font-bold text-lg hover:text-white transition-colors"
                                    >
                                        Kontrol Merkezine Dön
                                    </Link>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PartWholeGame;
