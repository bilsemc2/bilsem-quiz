import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, Trophy, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import BreakoutGame from './components/BreakoutGame';
import QuizMode from './components/QuizMode';
import { GamePhase, TIMING } from './types';

const GAME_ID = 'chromabreak';

const ChromaBreak: React.FC = () => {
    const location = useLocation();
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const startTimeRef = useRef<number>(0);

    const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.IDLE);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [history, setHistory] = useState<string[]>([]);
    const [lastQuizResult, setLastQuizResult] = useState<boolean | null>(null);

    // Hub'dan autoStart kontrolü
    const searchParams = new URLSearchParams(location.search);
    const autoStart = searchParams.get('autoStart') === 'true';

    // saveResult defined first (used by handleGameOver and handleQuizComplete)
    const saveResult = useCallback(async (finalScore: number, quizCorrect: boolean) => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await saveGamePlay({
            game_id: GAME_ID,
            score_achieved: finalScore,
            duration_seconds: duration,
            difficulty_played: `level-${level}`,
            metadata: {
                blocks_hit: history.length,
                quiz_correct: quizCorrect,
                level_reached: level
            }
        });
    }, [saveGamePlay, level, history.length]);

    const handleGameOver = useCallback((finalHistory: string[], finalScore: number) => {
        setHistory(finalHistory);
        setScore(finalScore);

        if (finalHistory.length >= 3) {
            setGamePhase(GamePhase.QUIZ_PREP);
            setTimeout(() => {
                setGamePhase(GamePhase.QUIZZING);
            }, TIMING.QUIZ_PREP_DELAY_MS);
        } else {
            setGamePhase(GamePhase.RESULT);
            saveResult(finalScore, false);
        }
    }, [saveResult]);

    const handleQuizComplete = useCallback((correct: boolean) => {
        setLastQuizResult(correct);

        if (correct) {
            setLevel(prev => prev + 1);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#06b6d4', '#3b82f6', '#8b5cf6']
            });
        }

        saveResult(score, correct);
        setGamePhase(GamePhase.RESULT);
    }, [score, saveResult]);

    const startGame = useCallback(() => {
        setGamePhase(GamePhase.PLAYING);
        setHistory([]);
        setScore(0);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    // autoStart useEffect - must be after startGame definition
    useEffect(() => {
        if (autoStart && gamePhase === GamePhase.IDLE) {
            startGame();
        }
    }, [autoStart, gamePhase, startGame]);

    const handleBlockHit = useCallback(() => {
        setScore(prev => prev + 10);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link
                        to="/bilsem-zeka"
                        className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-medium">BİLSEM Zeka</span>
                    </Link>

                    <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                        CHROMABREAK
                    </h1>

                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-yellow-400">
                            <Trophy size={16} />
                            <span className="font-bold">{score}</span>
                        </div>
                        <div className="flex items-center gap-1 text-cyan-400">
                            <Zap size={16} />
                            <span className="font-bold">Lv.{level}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 relative z-10">
                <AnimatePresence mode="wait">
                    {/* IDLE Phase - Start Screen */}
                    {gamePhase === GamePhase.IDLE && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center justify-center min-h-[70vh] text-center"
                        >
                            <div
                                className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[40%] flex items-center justify-center mx-auto mb-8"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                            >
                                <span className="text-5xl">🎮</span>
                            </div>
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">ChromaBreak</h2>
                            <p className="text-slate-400 max-w-md mb-8">
                                Renkli blokları kır ve hafızanı test et!
                                Her blok vurduğunda rengi hatırla - sonra quiz'de doğru cevapla!
                            </p>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl text-xl font-bold"
                                style={{ boxShadow: '0 8px 32px rgba(6, 182, 212, 0.4)' }}
                            >
                                <Play size={24} />
                                Başla
                            </motion.button>

                            <div className="mt-8 grid grid-cols-3 gap-6 text-slate-500 text-sm">
                                <div>
                                    <div className="text-cyan-400 font-bold mb-1">🎯 HEDEF</div>
                                    <div>Blokları Kır</div>
                                </div>
                                <div>
                                    <div className="text-cyan-400 font-bold mb-1">🧠 HATIRLA</div>
                                    <div>Renk Sırasını</div>
                                </div>
                                <div>
                                    <div className="text-cyan-400 font-bold mb-1">📝 TEST</div>
                                    <div>Hafıza Quizi</div>
                                </div>
                            </div>
                            <div className="mt-6 bg-cyan-500/20 text-cyan-300 text-xs px-4 py-2 rounded-full inline-block border border-cyan-500/30">
                                TUZÖ 5.4.2 Görsel Kısa Süreli Bellek
                            </div>
                        </motion.div>
                    )}

                    {/* PLAYING Phase */}
                    {gamePhase === GamePhase.PLAYING && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <BreakoutGame
                                level={level}
                                onGameOver={handleGameOver}
                                onBlockHit={handleBlockHit}
                            />
                        </motion.div>
                    )}

                    {/* QUIZ PREP Phase */}
                    {gamePhase === GamePhase.QUIZ_PREP && (
                        <motion.div
                            key="prep"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="text-6xl mb-6"
                            >
                                🧠
                            </motion.div>
                            <h2 className="text-3xl font-bold text-white">Hafıza Testi</h2>
                            <p className="text-slate-400 mt-2">Hazırlanıyor...</p>
                        </motion.div>
                    )}

                    {/* QUIZZING Phase */}
                    {gamePhase === GamePhase.QUIZZING && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <QuizMode
                                history={history}
                                level={level}
                                onQuizComplete={handleQuizComplete}
                            />
                        </motion.div>
                    )}

                    {/* RESULT Phase */}
                    {gamePhase === GamePhase.RESULT && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="text-8xl mb-6"
                            >
                                {lastQuizResult ? '🎉' : history.length < 3 ? '💪' : '🔄'}
                            </motion.div>

                            <h2 className={`text-4xl font-bold mb-4 ${lastQuizResult ? 'text-green-400' : 'text-orange-400'}`}>
                                {lastQuizResult ? 'Harika!' : history.length < 3 ? 'Tekrar Dene!' : 'Hafıza Hatası'}
                            </h2>

                            <p className="text-slate-300 mb-6 max-w-md">
                                {lastQuizResult
                                    ? `Seviye ${level}'e yükseldin! Hafızan keskin.`
                                    : history.length < 3
                                        ? 'Quiz için daha fazla blok vurmalısın!'
                                        : 'Renk sıralamasını hatırlayamadın. Tekrar dene!'}
                            </p>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
                                <div className="grid grid-cols-2 gap-8 text-center">
                                    <div>
                                        <div className="text-3xl font-bold text-amber-400">{score}</div>
                                        <div className="text-sm text-slate-400">Skor</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-cyan-400">{history.length}</div>
                                        <div className="text-sm text-slate-400">Blok</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={startGame}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold"
                                    style={{ boxShadow: '0 6px 24px rgba(6, 182, 212, 0.4)' }}
                                >
                                    <Play size={20} />
                                    Tekrar Oyna
                                </motion.button>
                                <Link
                                    to="/bilsem-zeka"
                                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-bold transition-colors"
                                >
                                    BİLSEM Zeka'ya Dön
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default ChromaBreak;
