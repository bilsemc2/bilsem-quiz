import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, Trophy, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';

import { BalloonState, GamePhase, QuestionType } from './types';
import { BALLOON_COLORS, POP_DELAY, GAME_ID } from './constants';
import Balloon from './components/Balloon';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';

const NeseliBalonlar: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();

    const [balloons, setBalloons] = useState<BalloonState[]>([]);
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [poppedIndices, setPoppedIndices] = useState<number[]>([]);
    const [userGuesses, setUserGuesses] = useState<number[]>([]);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [level, setLevel] = useState(1);
    const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.NUMBER);

    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    const getLevelConfig = (lvl: number) => {
        const totalBalloons = Math.min(2 + lvl, 8);
        const numToPop = Math.min(Math.floor((lvl + 1) / 2), totalBalloons - 1);
        return { totalBalloons, numToPop };
    };

    const initGame = useCallback((currentLvl: number) => {
        const { totalBalloons } = getLevelConfig(currentLvl);

        const randomNumbers = Array.from({ length: 10 }, (_, i) => i + 1)
            .sort(() => Math.random() - 0.5)
            .slice(0, totalBalloons);

        const shuffledColors = [...BALLOON_COLORS].sort(() => Math.random() - 0.5);

        const newBalloons: BalloonState[] = shuffledColors.slice(0, totalBalloons).map((color, index) => ({
            id: index,
            displayValue: randomNumbers[index],
            color,
            isPopped: false,
            isVisible: true,
        }));

        setQuestionType(Math.random() > 0.5 ? QuestionType.COLOR : QuestionType.NUMBER);
        setBalloons(newBalloons);
        setPoppedIndices([]);
        setUserGuesses([]);
        setPhase('watching');
    }, []);

    const startGame = useCallback(() => {
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
        setLevel(1);
        setScore({ correct: 0, total: 0 });
        initGame(1);
    }, [initGame]);

    const nextLevel = () => {
        const newLvl = level + 1;
        setLevel(newLvl);
        initGame(newLvl);
    };

    const retryLevel = () => {
        initGame(level);
    };

    // Auto-start from Hub
    useEffect(() => {
        if (location.state?.autoStart && phase === 'idle') {
            startGame();
        }
    }, [location.state, phase, startGame]);

    // Watching -> Popping transition
    useEffect(() => {
        if (phase === 'watching') {
            const timer = setTimeout(() => {
                setPhase('popping');
            }, 3000);
            return () => clearTimeout(timer);
        }

        if (phase === 'popping') {
            const { numToPop } = getLevelConfig(level);
            const indices = Array.from({ length: balloons.length }, (_, i) => i)
                .sort(() => 0.5 - Math.random())
                .slice(0, numToPop);

            setPoppedIndices(indices);

            indices.forEach((idx, i) => {
                setTimeout(() => {
                    setBalloons(prev => prev.map(b => b.id === idx ? { ...b, isPopped: true } : b));

                    if (i === indices.length - 1) {
                        setTimeout(() => {
                            setBalloons(prev => prev.map(b => b.isPopped ? { ...b, isVisible: false } : b));
                            setPhase('guessing');
                        }, 1000);
                    }
                }, i * POP_DELAY);
            });
        }
    }, [phase, level, balloons.length]);

    const handleGuess = (id: number) => {
        if (phase !== 'guessing') return;
        if (userGuesses.includes(id)) {
            setUserGuesses(prev => prev.filter(g => g !== id));
        } else if (userGuesses.length < poppedIndices.length) {
            setUserGuesses(prev => [...prev, id]);
        }
    };

    const submitGuesses = () => {
        const isCorrect = userGuesses.length === poppedIndices.length &&
            userGuesses.every(g => poppedIndices.includes(g));

        if (isCorrect) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        setScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
        }));
        setPhase('result');
    };

    // Game Over save logic (max level için)
    useEffect(() => {
        if (phase === 'result' && !hasSavedRef.current) {
            const isSuccess = userGuesses.length === poppedIndices.length && userGuesses.every(g => poppedIndices.includes(g));
            // Her round'da kaydet
            hasSavedRef.current = true;
            saveGamePlay({
                game_id: GAME_ID,
                score_achieved: score.correct * 10 + (isSuccess ? 10 : 0),
                duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
                metadata: { level_reached: level, correct_rounds: score.correct + (isSuccess ? 1 : 0), total_rounds: score.total + 1 }
            });
        }
    }, [phase, level, score, userGuesses, poppedIndices, saveGamePlay]);

    // Reset save guard when continuing
    useEffect(() => {
        if (phase === 'watching') {
            hasSavedRef.current = false;
        }
    }, [phase]);

    const isSuccess = userGuesses.length === poppedIndices.length && userGuesses.every(g => poppedIndices.includes(g));

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-sky-300 via-sky-400 to-blue-500 p-4 md:p-10 select-none pt-20">
            {/* HUD */}
            <div className="fixed top-20 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">
                <div className="flex gap-4 pointer-events-auto">
                    <Link to="/bilsem-zeka" className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-sky-200 hover:bg-sky-50 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-sky-500" />
                        <span className="font-bold text-gray-700">BİLSEM Zeka</span>
                    </Link>
                </div>
                <div className="flex gap-3 pointer-events-auto">
                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-yellow-200">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                        <span className="font-bold text-gray-700">Bölüm {level}</span>
                    </div>
                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-green-200">
                        <Trophy className="w-5 h-5 text-green-500" />
                        <span className="font-bold text-gray-700">{score.correct * 10}</span>
                    </div>
                </div>
            </div>

            {/* Ana Oyun Alanı */}
            <div className="relative w-full max-w-5xl bg-white/60 backdrop-blur-lg rounded-[3rem] p-6 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-4 border-white overflow-hidden mt-16">
                <h1 className="text-center text-3xl md:text-4xl font-black text-sky-800 mb-8 drop-shadow-sm">
                    🎈 NEŞELİ BALONLAR 🎈
                </h1>

                {/* Balonlar Gösterim Alanı */}
                <div className="flex flex-wrap justify-center gap-6 md:gap-10 min-h-[300px] items-start mb-10">
                    {balloons.map((balloon) => (
                        <div key={balloon.id} className="relative group">
                            <Balloon
                                color={balloon.color}
                                isPopped={balloon.isPopped && phase !== 'result'}
                                isVisible={balloon.isVisible || (phase === 'result' && poppedIndices.includes(balloon.id))}
                                displayLabel={(phase === 'watching' || phase === 'idle') ? balloon.displayValue : undefined}
                                highlighted={userGuesses.includes(balloon.id)}
                            />
                            {phase === 'guessing' && !balloon.isVisible && (
                                <div
                                    onClick={() => handleGuess(balloon.id)}
                                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-4 border-dashed flex items-center justify-center cursor-pointer transition-all ${userGuesses.includes(balloon.id)
                                        ? 'bg-yellow-200 border-yellow-500 scale-110'
                                        : 'bg-white/30 border-white/50 hover:bg-white/50'
                                        }`}
                                >
                                    <span className="text-4xl font-black text-white/60">?</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Dinamik Kontrol Paneli */}
                <div className="flex flex-col items-center">
                    <AnimatePresence mode="wait">
                        {phase === 'idle' && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={startGame}
                                className="group relative px-16 py-6 bg-gradient-to-r from-green-400 to-green-500 text-white font-black text-3xl rounded-full shadow-[0_10px_0_#15803d] hover:translate-y-1 hover:shadow-[0_5px_0_#15803d] transition-all flex items-center gap-4"
                            >
                                <Play className="w-8 h-8" fill="white" /> OYNA
                            </motion.button>
                        )}

                        {phase === 'watching' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-4 animate-bounce"
                            >
                                <div className="text-3xl font-black text-sky-700 bg-sky-100 px-8 py-3 rounded-full border-b-4 border-sky-300">
                                    Balonları Aklında Tut! 🧠
                                </div>
                            </motion.div>
                        )}

                        {phase === 'popping' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-3xl font-black text-pink-600 animate-pulse bg-pink-50 px-8 py-3 rounded-full border-b-4 border-pink-200"
                            >
                                Dikkat! Patlıyorlar! 💥
                            </motion.div>
                        )}

                        {phase === 'guessing' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full max-w-3xl space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-2xl md:text-4xl font-black text-sky-800 mb-4 bg-sky-50 py-4 rounded-3xl border-b-4 border-sky-200">
                                        Hangi {poppedIndices.length} balonun <span className="text-pink-500">{questionType === QuestionType.NUMBER ? 'RAKAMI' : 'RENGİ'}</span> patladı?
                                    </h2>
                                </div>

                                <div className="flex justify-center">
                                    {questionType === QuestionType.NUMBER ? (
                                        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 bg-white/40 p-6 rounded-[2rem] border-2 border-white shadow-inner">
                                            {balloons.map((b) => (
                                                <button
                                                    key={b.id}
                                                    onClick={() => handleGuess(b.id)}
                                                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl font-black text-2xl transition-all shadow-md ${userGuesses.includes(b.id)
                                                        ? 'bg-yellow-400 text-white translate-y-2 shadow-none scale-110'
                                                        : 'bg-white text-sky-500 hover:bg-sky-50'
                                                        }`}
                                                >
                                                    {b.displayValue}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/40 p-6 rounded-[2rem] border-2 border-white shadow-inner">
                                            {balloons.map((b) => (
                                                <button
                                                    key={b.id}
                                                    onClick={() => handleGuess(b.id)}
                                                    className={`px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-md flex items-center gap-3 border-b-4 ${userGuesses.includes(b.id)
                                                        ? 'bg-yellow-100 border-yellow-400 translate-y-2 shadow-none scale-105'
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: b.color.primary }}></div>
                                                    {b.color.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-center gap-6">
                                    <div className="text-2xl font-black text-sky-800">
                                        Seçilen: {userGuesses.length} / {poppedIndices.length}
                                    </div>
                                    <button
                                        onClick={submitGuesses}
                                        disabled={userGuesses.length !== poppedIndices.length}
                                        className={`px-20 py-5 rounded-full font-black text-2xl shadow-xl transition-all ${userGuesses.length === poppedIndices.length
                                            ? 'bg-yellow-400 text-white hover:scale-105 active:scale-95 border-b-8 border-yellow-600'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed border-b-8 border-gray-400'
                                            }`}
                                    >
                                        TAMAMDIR! ✅
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {phase === 'result' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-8"
                            >
                                <div className={`text-6xl md:text-8xl font-black drop-shadow-lg ${isSuccess ? 'text-green-500' : 'text-pink-500'}`}>
                                    {isSuccess ? 'HARİKA! 🎉' : 'Olsun! 🍭'}
                                </div>

                                <div className="bg-white/60 p-8 rounded-[3rem] border-4 border-white inline-block shadow-xl">
                                    <p className="text-2xl font-black text-sky-800 mb-6">İşte Patlayan Balonlar:</p>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {poppedIndices.map(idx => (
                                            <div key={idx} className="flex flex-col items-center animate-bounce" style={{ animationDelay: `${idx * 100}ms` }}>
                                                <div className="w-16 h-20 rounded-full mb-2 shadow-md" style={{ backgroundColor: balloons[idx].color.primary }}></div>
                                                <div className="text-xl font-black text-sky-900 bg-white px-4 py-1 rounded-full shadow-sm">
                                                    {balloons[idx].displayValue}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 justify-center pt-6">
                                    {isSuccess ? (
                                        <button
                                            onClick={nextLevel}
                                            className="px-12 py-6 bg-gradient-to-r from-green-400 to-green-500 text-white font-black text-2xl rounded-full shadow-[0_8px_0_#15803d] hover:translate-y-1 hover:shadow-[0_4px_0_#15803d] transition-all"
                                        >
                                            SONRAKİ BÖLÜM 🚀
                                        </button>
                                    ) : (
                                        <button
                                            onClick={retryLevel}
                                            className="px-12 py-6 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-black text-2xl rounded-full shadow-[0_8px_0_#c2410c] hover:translate-y-1 hover:shadow-[0_4px_0_#c2410c] transition-all"
                                        >
                                            TEKRAR DENE 🔄
                                        </button>
                                    )}
                                    <button
                                        onClick={startGame}
                                        className="px-10 py-6 bg-white text-sky-600 font-black text-xl rounded-full shadow-[0_8px_0_#0369a1] hover:translate-y-1 hover:shadow-[0_4px_0_#0369a1] transition-all"
                                    >
                                        EN BAŞA DÖN
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Decorations */}
            <div className="mt-10 flex gap-10 opacity-60">
                <span className="text-yellow-400 text-5xl animate-spin" style={{ animationDuration: '10s' }}>☀️</span>
                <span className="text-white text-5xl animate-pulse">☁️</span>
                <span className="text-sky-400 text-4xl">🐦</span>
            </div>
        </div>
    );
};

export default NeseliBalonlar;
