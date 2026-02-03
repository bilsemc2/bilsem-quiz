import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { GamePhase, PuzzlePiece } from './types';
import { LEVEL_CONFIGS, GAME_NAME, TUZO_CODE } from './constants';
import { generatePuzzlePieces } from './utils/patternGenerator';
import GameScene from './components/GameScene';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy, Brain, Target, ChevronRight, ArrowLeft, Heart, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

const ChromaHafiza: React.FC = () => {
    const location = useLocation();
    const { saveGamePlay } = useGamePersistence();
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    const [level, setLevel] = useState(0);
    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
    const [targetColor, setTargetColor] = useState<string>('');
    const [isRevealing, setIsRevealing] = useState(false);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);

    const currentLevelConfig = useMemo(() => LEVEL_CONFIGS[level % LEVEL_CONFIGS.length], [level]);

    // Auto-start from Arcade Hub
    useEffect(() => {
        if (location.state?.autoStart && gamePhase === 'idle') {
            startGame();
        }
    }, [location.state]);

    const startGame = useCallback(() => {
        setGamePhase('preview');
        setLevel(0);
        setScore(0);
        setLives(3);
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
        initLevel(0);
    }, []);

    const initLevel = useCallback((levelIdx: number) => {
        const config = LEVEL_CONFIGS[levelIdx % LEVEL_CONFIGS.length];
        const newPieces = generatePuzzlePieces(config.pieceCount, config.colorCount);
        // Pick a random color present in the pieces as the target
        const distinctColors = Array.from(new Set(newPieces.map(p => p.targetColor)));
        const selectedColor = distinctColors[Math.floor(Math.random() * distinctColors.length)];

        setPieces(newPieces);
        setTargetColor(selectedColor);
        setGamePhase('preview');
        setIsRevealing(true);

        setTimeout(() => {
            setIsRevealing(false);
            setGamePhase('playing');
        }, config.previewDuration);
    }, []);

    // Handle click on 3D piece
    const handlePieceClick = (id: string) => {
        if (gamePhase !== 'playing') return;

        setPieces(prev => prev.map(p => {
            if (p.id === id) {
                const isCorrect = p.targetColor === targetColor;
                return { ...p, isSelected: true, isCorrect };
            }
            return p;
        }));
    };

    // Check win/loss condition
    useEffect(() => {
        if (gamePhase !== 'playing') return;

        const piecesForColor = pieces.filter(p => p.targetColor === targetColor);
        const selectedCorrect = piecesForColor.filter(p => p.isSelected);
        const lastSelected = pieces.find(p => p.isSelected && !p.isCorrect);

        // Check for error
        if (lastSelected) {
            setGamePhase('reveal');
            setIsRevealing(true);
            setLives(l => l - 1);

            setTimeout(() => {
                setIsRevealing(false);
                if (lives <= 1) {
                    setGamePhase('game_over');
                } else {
                    // Reset and retry same level
                    initLevel(level);
                }
            }, 2000);
            return;
        }

        // Check for win
        if (selectedCorrect.length === piecesForColor.length && piecesForColor.length > 0) {
            setGamePhase('reveal');
            setIsRevealing(true);
            confetti({
                particleCount: 50,
                spread: 30,
                origin: { y: 0.8 },
                colors: [targetColor, '#ffffff']
            });

            setTimeout(() => {
                setIsRevealing(false);
                setGamePhase('success');
                setScore(s => s + (level + 1) * 100);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: [targetColor, '#ffffff']
                });
            }, 2000);
        }
    }, [pieces, targetColor, gamePhase, level, lives, initLevel]);

    // Save game on game over
    useEffect(() => {
        if (gamePhase === 'game_over' && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'arcade-chroma-hafiza',
                score_achieved: score,
                duration_seconds: duration,
                metadata: {
                    game_name: GAME_NAME,
                    levels_completed: level,
                    final_level: level + 1
                }
            });
        }
    }, [gamePhase, score, level, saveGamePlay]);

    const nextLevel = () => {
        setLevel(l => l + 1);
        initLevel(level + 1);
    };

    const restart = () => {
        hasSavedRef.current = false;
        startGame();
    };

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";

    // Idle Screen
    if (gamePhase === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-950 to-purple-950 text-white pt-24 pb-12 flex flex-col items-center justify-center">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full text-center border border-white/20 mx-4">
                    <motion.div
                        className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-600 rounded-[40%] flex items-center justify-center"
                        style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Brain size={52} className="text-white drop-shadow-lg" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight mb-4">
                        {GAME_NAME}
                    </h1>
                    <p className="text-slate-400 font-medium text-lg mb-4 max-w-md mx-auto">
                        Renkleri hafızanda tut ve hedef renkteki tüm parçaları bul!
                    </p>
                    <div className="bg-blue-500/20 text-blue-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-blue-500/30">
                        TUZÖ {TUZO_CODE}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startGame}
                        className="w-full px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-black text-xl flex items-center gap-3 justify-center mx-auto"
                        style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                    >
                        <Play size={24} className="fill-white" /> BAŞLA
                    </motion.button>
                    <Link
                        to={backLink}
                        className="mt-4 inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm"
                    >
                        <ArrowLeft size={16} /> Arcade'e Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-screen h-screen bg-[#0a0a0c] text-white overflow-hidden flex flex-col font-sans">

            {/* Background UI Accents */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]" />
            </div>

            {/* Header UI */}
            <header className="relative z-10 p-6 pt-24 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link to={backLink} className="text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                        <Brain className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight">{GAME_NAME}</h1>
                        <p className="text-xs text-white/40 font-medium tracking-widest uppercase">Seviye {level + 1}</p>
                    </div>
                </div>

                <div className="flex gap-6 items-center">
                    {/* Lives */}
                    <div className="flex items-center gap-1 px-3 py-2 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-500/30">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Heart key={i} size={16} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                        ))}
                    </div>
                    {/* Score */}
                    <div className="text-right px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-xl border border-amber-500/30">
                        <p className="text-xs text-white/40 uppercase tracking-widest">Puan</p>
                        <p className="text-xl font-bold font-mono tracking-tighter">{score.toLocaleString()}</p>
                    </div>
                </div>
            </header>

            {/* Main Gameplay Area */}
            <main className="flex-1 relative">
                <GameScene
                    pieces={pieces}
                    isRevealing={isRevealing}
                    onPieceClick={handlePieceClick}
                    isGameWon={gamePhase === 'success'}
                />

                {/* HUD Elements */}
                <AnimatePresence>
                    {(gamePhase === 'playing' || gamePhase === 'reveal') && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
                        >
                            <div className="px-6 py-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center gap-5 shadow-2xl">
                                <Target className="text-white/40" size={20} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Hedef Renk</span>
                                    <span className="text-sm font-black uppercase tracking-widest">Bu Rengi Bul</span>
                                </div>
                                <div
                                    className="w-14 h-9 rounded-xl shadow-inner shadow-black/40 border border-white/10"
                                    style={{ backgroundColor: targetColor, boxShadow: `0 0 30px ${targetColor}66` }}
                                />
                            </div>

                            {gamePhase === 'reveal' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/10 px-4 py-2 rounded-full border border-white/20 flex items-center gap-2"
                                >
                                    <Info size={14} className="text-blue-400" />
                                    <span className="text-xs font-bold uppercase tracking-tighter">Kontrol Ediliyor...</span>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Overlay Screens */}
            <AnimatePresence>
                {gamePhase === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-green-500/10 backdrop-blur-sm pointer-events-none"
                    >
                        <div className="pointer-events-auto bg-black/90 p-12 rounded-[4rem] border border-white/20 shadow-2xl text-center space-y-8 max-w-sm">
                            <div className="w-28 h-28 bg-white text-black rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-white/20 relative">
                                <Trophy size={56} className="relative z-10" />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 bg-green-500 rounded-full blur-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-5xl font-black italic tracking-tighter uppercase">BAŞARILI!</h2>
                                <p className="text-white/40 text-sm font-bold tracking-[0.2em] uppercase">+{(level + 1) * 100} Puan</p>
                            </div>
                            <button
                                onClick={nextLevel}
                                className="w-full py-5 bg-white text-black font-black rounded-3xl flex items-center justify-center gap-2 hover:bg-green-400 transition-colors shadow-lg"
                            >
                                SONRAKİ SEVİYE <ChevronRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {gamePhase === 'game_over' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-red-950/40 backdrop-blur-xl"
                    >
                        <div className="bg-black/90 p-12 rounded-[4rem] border border-red-500/30 shadow-2xl text-center space-y-8 max-w-sm">
                            <div className="space-y-4">
                                <h2 className="text-5xl font-black text-red-500 italic tracking-tighter leading-tight">OYUN BİTTİ</h2>
                                <p className="text-white/50 font-medium">Toplam Puan: <span className="text-white font-bold">{score}</span></p>
                                <p className="text-white/50 font-medium">Ulaşılan Seviye: <span className="text-white font-bold">{level + 1}</span></p>
                            </div>
                            <button
                                onClick={restart}
                                className="w-full py-5 bg-red-600 text-white font-black rounded-3xl flex items-center justify-center gap-2 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                            >
                                TEKRAR DENE <RotateCcw size={20} />
                            </button>
                            <Link
                                to={backLink}
                                className="block text-slate-500 hover:text-white transition-colors font-bold text-sm"
                            >
                                Arcade'e Dön
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChromaHafiza;
