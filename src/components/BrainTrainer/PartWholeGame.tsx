import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Play, Star, Trophy, Brain, Sparkles, Smile } from 'lucide-react';
import { useSound } from '../../hooks/useSound';

// ------------------ Tip Tanımları ------------------
type Pattern = {
    defs: string;
    type: string;
    backgroundColor: string;
    foregroundColor: string;
    size: number;
    rotation: number;
    opacity: number;
    id: string;
    props?: any; // Özel geometrik parametreler (kenar sayısı, yol verisi vb.)
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

        let props: any = {};
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
    const distortColor = (hex: string, intensity: number = 10): string => {
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

    // Zamanlayıcı
    useEffect(() => {
        if (!gameStarted || gameOver || showSuccess || isCorrecting) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    playSound('complete');
                    setIsCorrecting(true);
                    setTimeout(() => {
                        if (level === 20) {
                            setGameOver(true);
                        } else {
                            setLevel(l => l + 1);
                        }
                    }, 2000);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, gameOver, showSuccess, isCorrecting, playSound, level]);

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
            setTimeout(() => {
                if (level === 20) {
                    setGameOver(true);
                } else {
                    setLevel(l => l + 1);
                }
            }, 2000);
        }
    };

    const restart = () => {
        setLevel(1);
        setScore(0);
        setGameOver(false);
        setGameStarted(true);
        setShowSuccess(false);
        setIsCorrecting(false);
    };

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
            <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-10 left-10 text-pink-200"><Star size={100} fill="currentColor" /></div>
                <div className="absolute bottom-10 right-10 text-yellow-200 rotate-12"><Sparkles size={120} fill="currentColor" /></div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/80 backdrop-blur-md p-12 rounded-[4rem] border-8 border-white text-center max-w-xl shadow-2xl relative z-10"
                >
                    <div className="w-24 h-24 bg-yellow-400 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
                        <Smile size={60} />
                    </div>
                    <h1 className="text-5xl font-black text-indigo-600 mb-6 tracking-tight">Sonsuz Desenler</h1>
                    <p className="text-gray-500 font-bold mb-10 leading-relaxed text-xl">
                        Milyarlarca farklı desenden eksik parçayı bulmaya hazır mısın? <br />Zihnini çalıştır ve resimleri tamamla!
                    </p>
                    <button
                        onClick={() => setGameStarted(true)}
                        className="px-12 py-6 bg-pink-500 text-white font-black text-2xl rounded-3xl hover:scale-110 transition-all shadow-[0_10px_0_#d81b60] border-b-4 border-pink-700 active:translate-y-2 active:shadow-none flex items-center gap-4 mx-auto group"
                    >
                        Maceraya Başla! <Play fill="currentColor" />
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-sky-50 p-6 pt-24 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-pink-200/40 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-yellow-200/40 rounded-full blur-[100px]" />

            <div className="container mx-auto max-w-5xl relative z-10 flex flex-col gap-10">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-sm p-8 rounded-[3.5rem] shadow-xl border-4 border-white text-indigo-900">
                    <Link to="/atolyeler/tablet-degerlendirme" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-600 font-black transition-all">
                        <ChevronLeft size={28} /> Çıkış
                    </Link>
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col items-center">
                            <span className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Seviye</span>
                            <div className="text-3xl font-black text-pink-500">{level}<span className="text-gray-200 text-lg">/20</span></div>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Puan</span>
                            <div className="text-3xl font-black text-emerald-500">{score}</div>
                        </div>
                        <div className="flex flex-col items-center min-w-[80px]">
                            <span className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Süre</span>
                            <div className={`text-4xl font-black ${timeLeft < 10 ? 'text-red-500 scale-110' : 'text-amber-500'} transition-all font-mono`}>
                                {timeLeft}
                            </div>
                        </div>
                    </div>
                    <button onClick={restart} className="p-4 bg-indigo-100 text-indigo-500 hover:bg-indigo-200 rounded-[2rem] transition-all shadow-md active:scale-90">
                        <RotateCcw size={28} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/60 p-12 rounded-[5rem] border-8 border-white shadow-2xl space-y-8 flex flex-col items-center"
                    >
                        <div className="bg-indigo-50 px-8 py-3 rounded-full text-indigo-600 font-black text-sm flex items-center gap-3 shadow-sm">
                            <Brain size={24} className="animate-bounce" /> MATEMATİKSEL DESENİ İNCELE!
                        </div>
                        <div className="relative p-6 bg-indigo-100/50 rounded-[3.5rem] shadow-inner border-2 border-indigo-100/30">
                            <PatternSVG pattern={gamePattern} size={svgSize} isMain={true} />
                        </div>
                    </motion.div>

                    <div className="bg-white/60 p-12 rounded-[5rem] border-8 border-white shadow-2xl flex flex-col items-center gap-10">
                        <h2 className="text-3xl font-black text-indigo-900 flex items-center gap-3">
                            DOĞRU PARÇAYI BUL! <Sparkles className="text-yellow-400" />
                        </h2>
                        <div className="grid grid-cols-2 gap-8 w-full">
                            {options.map((option, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={!isCorrecting && !showSuccess ? { scale: 1.08, y: -8, rotate: idx % 2 === 0 ? 2 : -2 } : {}}
                                    whileTap={!isCorrecting && !showSuccess ? { scale: 0.95 } : {}}
                                    onClick={() => handleOptionSelect(option)}
                                    className={`bg-white rounded-[3rem] p-4 shadow-xl transition-all border-8 relative group overflow-hidden ${isCorrecting && option.isCorrect
                                            ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)] scale-105'
                                            : 'border-transparent'
                                        } ${!isCorrecting && !showSuccess ? 'hover:border-pink-300' : ''
                                        }`}
                                >
                                    <PatternSVG
                                        pattern={option.pattern}
                                        size={140}
                                        viewBox={`${targetPos.x} ${targetPos.y} ${pieceSize} ${pieceSize}`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/5 group-hover:to-purple-500/5 transition-all pointer-events-none" />
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.3, y: 100 }}
                            animate={{ opacity: 1, scale: 1.2, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: -100 }}
                            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-emerald-400 text-white px-20 py-12 rounded-[5rem] font-black text-6xl shadow-2xl flex items-center gap-8 border-8 border-white animate-pulse">
                                <Smile size={80} fill="currentColor" /> HARİKA!
                            </div>
                        </motion.div>
                    )}

                    {gameOver && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/60 backdrop-blur-3xl"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                className="bg-white rounded-[6rem] p-20 border-8 border-white text-center max-w-2xl w-full shadow-[0_30px_100px_-20px_rgba(0,0,0,0.1)] relative"
                            >
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-400 text-white rounded-full flex items-center justify-center shadow-2xl border-8 border-white">
                                    <Trophy size={90} />
                                </div>
                                <h2 className="text-7xl font-black text-indigo-600 mb-8 mt-12 tracking-tighter">BİTTİ!</h2>
                                <p className="text-gray-400 font-bold text-3xl mb-14 leading-relaxed px-10">
                                    {score > 0 ? "Milyarlarca desen içinden doğru yolu buldun!" : "Üzülme, bir sonraki sefer kesin yapacaksın!"}
                                    <br /><span className="text-6xl text-pink-500 mt-10 block font-black animate-bounce">SKOR: {score}</span>
                                </p>
                                <div className="space-y-6">
                                    <button
                                        onClick={restart}
                                        className="w-full py-10 bg-pink-500 text-white font-black rounded-4xl flex items-center justify-center gap-6 shadow-[0_15px_0_#d81b60] border-b-4 border-pink-700 hover:scale-105 transition-all text-3xl active:translate-y-3 active:shadow-none"
                                    >
                                        <RotateCcw size={40} /> TEKRAR DENE
                                    </button>
                                    <Link
                                        to="/atolyeler/tablet-degerlendirme"
                                        className="text-indigo-300 font-black text-2xl hover:text-indigo-400 transition-colors block mt-12 underline decoration-4 underline-offset-8"
                                    >
                                        KONTROL MERKEZİNE DÖN
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
