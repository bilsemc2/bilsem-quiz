import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Heart, Trophy, Play, RefreshCw, ChevronLeft, ShieldAlert } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Balloon from './components/Balloon';
import Cloud from './components/Cloud';
import { Difficulty, GameState, Pattern, FloatingBalloon } from './types';
import { generateLocalPattern } from './services/patternService';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';

const COLORS = ['#FF5F5D', '#3F7C85', '#72F2EB', '#FFD166', '#06D6A0', '#EF476F'];
const COLOR_NAMES: Record<string, string> = {
    '#FF5F5D': 'Kırmızı',
    '#3F7C85': 'Turkuaz',
    '#72F2EB': 'Açık Mavi',
    '#FFD166': 'Sarı',
    '#06D6A0': 'Yeşil',
    '#EF476F': 'Pembe'
};

const RenkliBalon: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();

    const [gameState, setGameState] = useState<GameState>({
        score: 0,
        level: 1,
        lives: 3,
        status: 'START',
    });

    const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);
    const [activeBalloons, setActiveBalloons] = useState<FloatingBalloon[]>([]);
    const [poppedId, setPoppedId] = useState<string | null>(null);
    const [laserPath, setLaserPath] = useState<{ x: number; y: number } | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const gameContainerRef = useRef<HTMLDivElement>(null);
    const spawnTimerRef = useRef<number | null>(null);
    const gameStartTimeRef = useRef<number>(0);

    const startNewPattern = useCallback((level: number) => {
        let diff = Difficulty.EASY;
        if (level > 10) diff = Difficulty.HARD;
        else if (level > 5) diff = Difficulty.MEDIUM;

        const pattern = generateLocalPattern(diff);
        setCurrentPattern(pattern);
        setPoppedId(null);
        setLaserPath(null);
        setActiveBalloons([]);
        setFeedback(null);
    }, []);

    const startGame = () => {
        setGameState({ score: 0, level: 1, lives: 3, status: 'PLAYING' });
        gameStartTimeRef.current = Date.now();
        startNewPattern(1);
    };

    // Auto-start from Hub
    useEffect(() => {
        if (location.state?.autoStart && gameState.status === 'START') {
            startGame();
        }
    }, [location.state, gameState.status]);

    // Balloon Spawning
    useEffect(() => {
        if (gameState.status !== 'PLAYING' || !currentPattern) return;

        const spawnBalloon = () => {
            const roll = Math.random();
            let value: number;
            let color: string;

            if (roll > 0.7) {
                value = currentPattern.answer;
                color = currentPattern.targetColor;
            } else if (roll > 0.5) {
                value = currentPattern.answer;
                const otherColors = COLORS.filter(c => c !== currentPattern.targetColor);
                color = otherColors[Math.floor(Math.random() * otherColors.length)];
            } else if (roll > 0.3) {
                const wrongOptions = currentPattern.options.filter(o => o !== currentPattern.answer);
                value = wrongOptions.length > 0 ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)] : currentPattern.answer + 1;
                color = currentPattern.targetColor;
            } else {
                const wrongOptions = currentPattern.options.filter(o => o !== currentPattern.answer);
                value = wrongOptions.length > 0 ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)] : currentPattern.answer + 1;
                const otherColors = COLORS.filter(c => c !== currentPattern.targetColor);
                color = otherColors[Math.floor(Math.random() * otherColors.length)];
            }

            const newBalloon: FloatingBalloon = {
                id: Math.random().toString(36).substr(2, 9),
                value,
                color,
                x: 10 + Math.random() * 80,
                speed: 5 + Math.random() * 2 - (gameState.level * 0.1),
                startTime: Date.now()
            };

            setActiveBalloons(prev => [...prev, newBalloon]);
        };

        const interval = Math.max(700, 1800 - (gameState.level * 80));
        spawnTimerRef.current = window.setInterval(spawnBalloon, interval);

        return () => {
            if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
        };
    }, [gameState.status, gameState.level, currentPattern]);

    // Balloon Lifecycle & Game Over Check
    useEffect(() => {
        const checkBalloons = setInterval(() => {
            const now = Date.now();
            setActiveBalloons(prev => {
                const remaining = prev.filter(b => {
                    const duration = (now - b.startTime) / 1000;
                    const isOffScreen = duration > b.speed;

                    if (isOffScreen && b.value === currentPattern?.answer && b.color === currentPattern?.targetColor && poppedId !== b.id) {
                        setGameState(gs => ({ ...gs, lives: Math.max(0, gs.lives - 1) }));
                        setFeedback("Hedef balon kaçtı!");
                    }

                    return !isOffScreen;
                });

                return remaining;
            });
        }, 100);

        return () => clearInterval(checkBalloons);
    }, [currentPattern, poppedId]);

    // Game Over Handler
    useEffect(() => {
        if (gameState.lives <= 0 && gameState.status === 'PLAYING') {
            setGameState(gs => ({ ...gs, status: 'GAME_OVER' }));
            saveGamePlay({
                game_id: 'renkli-balon',
                score_achieved: gameState.score,
                duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
                metadata: { level_reached: gameState.level }
            });
        }
    }, [gameState.lives, gameState.status, gameState.score, gameState.level, saveGamePlay]);

    const handleShoot = async (balloon: FloatingBalloon, event: React.MouseEvent) => {
        if (gameState.status !== 'PLAYING' || poppedId) return;

        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const containerRect = gameContainerRef.current?.getBoundingClientRect();
        if (containerRect) {
            setLaserPath({
                x: rect.left + rect.width / 2 - containerRect.left,
                y: rect.top + rect.height / 2 - containerRect.top
            });
        }

        await new Promise(r => setTimeout(r, 100));

        const isCorrectValue = balloon.value === currentPattern?.answer;
        const isCorrectColor = balloon.color === currentPattern?.targetColor;

        if (isCorrectValue && isCorrectColor) {
            setPoppedId(balloon.id);
            setFeedback("Harika! Doğru balon!");
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
            });

            setGameState(prev => ({
                ...prev,
                score: prev.score + (20 * prev.level),
                level: prev.level + 1
            }));

            setTimeout(() => {
                startNewPattern(gameState.level + 1);
            }, 1000);
        } else {
            let msg = "Yanlış balon!";
            if (isCorrectValue && !isCorrectColor) msg = "Numara doğru ama renk yanlış!";
            else if (!isCorrectValue && isCorrectColor) msg = "Renk doğru ama numara yanlış!";

            setFeedback(msg);

            setActiveBalloons(prev => prev.map(b => {
                if (b.value === currentPattern?.answer && b.color === currentPattern?.targetColor) {
                    return { ...b, isHighlighted: true };
                }
                return b;
            }));

            setGameState(prev => ({
                ...prev,
                lives: Math.max(0, prev.lives - 1),
            }));

            setActiveBalloons(prev => prev.filter(b => b.id !== balloon.id));

            setTimeout(() => {
                setActiveBalloons(prev => prev.map(b => ({ ...b, isHighlighted: false })));
            }, 2000);
        }

        setTimeout(() => {
            setLaserPath(null);
            setFeedback(null);
        }, 2000);
    };

    return (
        <div
            ref={gameContainerRef}
            className="relative w-full min-h-screen overflow-hidden bg-sky-400 select-none flex flex-col items-center pt-16"
        >
            <Cloud top="10%" delay={0} duration={45} />
            <Cloud top="35%" delay={7} duration={60} />
            <Cloud top="65%" delay={20} duration={50} />

            {/* HUD */}
            <div className="absolute top-20 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">
                <div className="flex gap-4 pointer-events-auto">
                    <Link to="/bilsem-zeka" className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-blue-200 hover:bg-blue-50 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-blue-500" />
                        <span className="font-bold text-gray-700">Arcade</span>
                    </Link>
                    <div className="bg-white/90 backdrop-blur px-5 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-blue-200">
                        <Trophy className="text-yellow-500 w-6 h-6" />
                        <span className="text-xl font-bold text-gray-700">{gameState.score}</span>
                    </div>
                    <div className="bg-white/90 backdrop-blur px-5 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-blue-200">
                        <Target className="text-blue-500 w-6 h-6" />
                        <span className="text-xl font-bold text-gray-700">Seviye {gameState.level}</span>
                    </div>
                </div>
                <div className="bg-white/90 backdrop-blur px-5 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-red-200 pointer-events-auto">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Heart
                            key={i}
                            className={`w-6 h-6 transition-all duration-300 ${i < gameState.lives ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-300 scale-75 opacity-50'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Mission Area */}
            <AnimatePresence mode='wait'>
                {gameState.status === 'PLAYING' && currentPattern && (
                    <motion.div
                        initial={{ y: -120, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -120, opacity: 0 }}
                        className="absolute top-32 z-20 w-full flex flex-col items-center px-4"
                    >
                        <div className="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border-4 border-white/80 shadow-2xl flex flex-col md:flex-row items-center gap-8 max-w-4xl">
                            <div>
                                <h2 className="text-blue-600 text-lg font-bold mb-4 uppercase tracking-wider text-center md:text-left">Örüntü Görevi</h2>
                                <div className="flex gap-3 md:gap-5 items-end justify-center">
                                    {currentPattern.sequence.map((val, i) => (
                                        <div key={`p-${i}`} className="flex flex-col items-center">
                                            <div
                                                className={`w-14 h-16 rounded-[50%_50%_50%_50%/40%_40%_60%_60%] flex items-center justify-center text-white text-xl font-bold shadow-md ${val === '?' ? 'bg-gray-400 animate-pulse scale-110' : ''}`}
                                                style={{ backgroundColor: val === '?' ? undefined : COLORS[i % COLORS.length] }}
                                            >
                                                {val}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-20 w-px bg-blue-200 hidden md:block"></div>

                            <div className="flex flex-col items-center">
                                <h2 className="text-red-500 text-lg font-bold mb-2 uppercase tracking-wider">Hedef Balon</h2>
                                <div className="flex items-center gap-4 bg-white/50 p-3 rounded-2xl border-2 border-white">
                                    <div
                                        className="w-10 h-12 rounded-[50%_50%_50%_50%/40%_40%_60%_60%] shadow-lg animate-bounce"
                                        style={{ backgroundColor: currentPattern.targetColor }}
                                    ></div>
                                    <span className="text-gray-800 font-black text-xl">{COLOR_NAMES[currentPattern.targetColor]}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gameplay Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {activeBalloons.map((balloon) => (
                    <motion.div
                        key={balloon.id}
                        initial={{ y: '110vh', x: `${balloon.x}vw` }}
                        animate={{ y: '-30vh' }}
                        transition={{ duration: balloon.speed, ease: "linear" }}
                        className="absolute pointer-events-auto"
                        style={{ left: 0 }}
                    >
                        <Balloon
                            value={balloon.value}
                            color={balloon.color}
                            isPopping={poppedId === balloon.id}
                            isHighlighted={balloon.isHighlighted}
                            onClick={(e) => { handleShoot(balloon, e); }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Laser Visual */}
            {laserPath && (
                <motion.div
                    initial={{ height: 0, opacity: 1 }}
                    animate={{ height: '110vh', opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute bottom-0 w-1.5 bg-red-500 shadow-[0_0_20px_#f00,0_0_40px_#f00] z-40 origin-bottom"
                    style={{
                        rotate: `${Math.atan2(laserPath.x - (window.innerWidth / 2), window.innerHeight - laserPath.y) * (180 / Math.PI)}deg`,
                        height: `${Math.sqrt(Math.pow(laserPath.x - (window.innerWidth / 2), 2) + Math.pow(window.innerHeight - laserPath.y, 2))}px`,
                        position: 'absolute',
                        bottom: '0px',
                        left: '50%'
                    }}
                />
            )}

            {/* Feedback Messages */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-4 rounded-full shadow-2xl font-black text-2xl flex items-center gap-3 border-4 border-white text-center ${feedback.includes('Harika') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}
                    >
                        {!feedback.includes('Harika') && <ShieldAlert className="w-8 h-8 shrink-0" />}
                        {feedback}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Start Overlay */}
            <AnimatePresence>
                {gameState.status === 'START' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full text-center shadow-2xl border-[12px] border-blue-400">
                            <div className="w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Target className="w-14 h-14 text-blue-500" />
                            </div>
                            <h1 className="text-5xl text-gray-800 mb-6 tracking-tight font-black">RENKLİ BALON AVI</h1>
                            <div className="space-y-4 text-gray-600 mb-10 text-lg font-medium bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
                                <p>1. Örüntüdeki <span className="text-blue-600 font-bold">eksik sayıyı</span> bul.</p>
                                <p>2. <span className="text-red-500 font-bold">Hedef rengi</span> kontrol et.</p>
                                <p>3. Gökyüzünde sadece o <span className="underline decoration-wavy">renk</span> ve <span className="underline decoration-wavy">numara</span> ikilisini vur!</p>
                            </div>
                            <button
                                onClick={startGame}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-3xl py-5 rounded-[2rem] shadow-xl transform active:scale-95 transition-all flex items-center justify-center gap-3 font-black"
                            >
                                <Play fill="white" className="w-8 h-8" /> BAŞLA!
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Game Over Overlay */}
                {gameState.status === 'GAME_OVER' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-red-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-6"
                    >
                        <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full text-center shadow-2xl border-[12px] border-red-500">
                            <h2 className="text-6xl text-red-600 mb-4 font-black">OYUN BİTTİ</h2>
                            <p className="text-2xl text-gray-500 mb-8 font-bold italic">Dikkatli patlatmalıydın!</p>

                            <div className="bg-red-50 rounded-[2rem] p-8 mb-10 border-4 border-red-100 shadow-inner">
                                <p className="text-red-400 uppercase text-sm font-black tracking-[0.2em] mb-2">TOPLAM PUANIN</p>
                                <p className="text-8xl font-black text-gray-800 tabular-nums">{gameState.score}</p>
                                <div className="flex justify-center gap-4 mt-4">
                                    <div className="bg-white px-4 py-1 rounded-full border-2 border-red-200 text-red-600 font-bold">
                                        Seviye {gameState.level}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/bilsem-zeka" className="bg-slate-600 hover:bg-slate-700 text-white text-xl py-4 rounded-2xl shadow-lg font-bold flex items-center justify-center gap-2">
                                    <ChevronLeft className="w-6 h-6" /> Arcade
                                </Link>
                                <button
                                    onClick={startGame}
                                    className="bg-red-500 hover:bg-red-600 text-white text-xl py-4 rounded-2xl shadow-xl transform active:scale-95 transition-all flex items-center justify-center gap-2 font-black"
                                >
                                    <RefreshCw className="w-6 h-6" /> Tekrar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Laser Base Decoration */}
            <div className="absolute bottom-0 w-full h-12 bg-green-500 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-32 h-16 bg-gray-800 rounded-t-[3rem] shadow-2xl flex items-center justify-center">
                    <div className="w-8 h-12 bg-gradient-to-t from-gray-700 to-gray-600 rounded-t-xl -translate-y-6 shadow-inner border-t-8 border-red-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RenkliBalon;
