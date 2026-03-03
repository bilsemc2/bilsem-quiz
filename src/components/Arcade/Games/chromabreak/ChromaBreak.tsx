import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import BreakoutGame from './components/BreakoutGame';
import QuizMode from './components/QuizMode';
import { GamePhase, TIMING } from './types';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_BASE, ARCADE_SCORE_FORMULA, ARCADE_FEEDBACK_TEXTS } from '../../Shared/ArcadeConstants';

const GAME_ID = 'chromabreak';
const BLOCK_SCORE = ARCADE_SCORE_BASE / 2; // 10 puan per blok

const ChromaBreak: React.FC = () => {
    const location = useLocation();
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const startTimeRef = useRef<number>(0);
    const isResolvingRef = useRef(false);

    const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.IDLE);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [history, setHistory] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const autoStart = location.state?.autoStart ||
        new URLSearchParams(location.search).get('autoStart') === 'true';

    // ─── Save ────────────────────────────────────────────────────────────────
    const saveResult = useCallback(async (finalScore: number) => {
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
                level_reached: level
            }
        });
    }, [saveGamePlay, level, history.length]);

    // ─── Breakout → Quiz transition ──────────────────────────────────────────
    const handleGameOver = useCallback((finalHistory: string[], finalScore: number) => {
        setHistory(finalHistory);
        setScore(finalScore);

        if (finalHistory.length >= 3) {
            setGamePhase(GamePhase.QUIZ_PREP);
            setTimeout(() => {
                setGamePhase(GamePhase.QUIZZING);
            }, TIMING.QUIZ_PREP_DELAY_MS);
        } else {
            // Yeterli blok vurulamadı → can kaybı
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setGamePhase(GamePhase.RESULT);
                    saveResult(finalScore);
                } else {
                    setFeedback({ message: 'Daha fazla blok vurmalısın! 💪', type: 'error' });
                    setTimeout(() => {
                        setFeedback(null);
                        // Aynı seviyede tekrar dene
                        setGamePhase(GamePhase.PLAYING);
                        setHistory([]);
                        setScore(0);
                    }, 2000);
                }
                return newLives;
            });
        }
    }, [saveResult]);

    // ─── Quiz complete ───────────────────────────────────────────────────────
    const handleQuizComplete = useCallback((correct: boolean) => {
        if (isResolvingRef.current) return;
        isResolvingRef.current = true;

        if (correct) {
            const msgs = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;
            setFeedback({ message: msgs[Math.floor(Math.random() * msgs.length)], type: 'success' });
            const bonus = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level);
            setScore(prev => prev + bonus);
            setLevel(prev => prev + 1);

            setTimeout(() => {
                setFeedback(null);
                isResolvingRef.current = false;
                // Sonraki seviyeye geç
                setGamePhase(GamePhase.PLAYING);
                setHistory([]);
            }, 2000);
        } else {
            const msgs = ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES;
            setFeedback({ message: msgs[Math.floor(Math.random() * msgs.length)], type: 'error' });
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setTimeout(() => {
                        setFeedback(null);
                        isResolvingRef.current = false;
                        setGamePhase(GamePhase.RESULT);
                        saveResult(score);
                    }, 2000);
                } else {
                    setTimeout(() => {
                        setFeedback(null);
                        isResolvingRef.current = false;
                        // Aynı seviyede tekrar dene
                        setGamePhase(GamePhase.PLAYING);
                        setHistory([]);
                    }, 2000);
                }
                return newLives;
            });
        }
    }, [score, level, saveResult]);

    // ─── Start / Restart ─────────────────────────────────────────────────────
    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setGamePhase(GamePhase.PLAYING);
        setHistory([]);
        setScore(0);
        setLevel(1);
        setLives(3);
        setFeedback(null);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        isResolvingRef.current = false;
    }, []);

    useEffect(() => {
        if (autoStart && gamePhase === GamePhase.IDLE) {
            startGame();
        }
    }, [autoStart, gamePhase, startGame]);

    const handleBlockHit = useCallback(() => {
        setScore(prev => prev + BLOCK_SCORE);
    }, []);

    // ─── Shell status mapping ────────────────────────────────────────────────
    const shellStatus: 'START' | 'PLAYING' | 'GAME_OVER' | 'SUCCESS' =
        gamePhase === GamePhase.IDLE ? 'START' :
            gamePhase === GamePhase.RESULT ? 'GAME_OVER' : 'PLAYING';

    return (
        <ArcadeGameShell
            gameState={{ score, level, lives, status: shellStatus }}
            gameMetadata={{
                id: GAME_ID,
                title: 'CHROMABREAK',
                description: (
                    <>
                        <p>🎮 Renkli blokları kır ve hafızanı test et!</p>
                        <p className="mt-2">🧠 Her blok vurduğunda rengi hatırla — sonra quiz'de doğru cevapla!</p>
                    </>
                ),
                tuzoCode: '5.4.2 Görsel Kısa Süreli Bellek',
                icon: <span className="text-5xl">🎮</span>,
                iconBgColor: 'bg-sky-300',
                containerBgColor: 'bg-amber-200 dark:bg-slate-900'
            }}
            onStart={startGame}
            onRestart={startGame}
            showLevel={true}
            showLives={true}
        >
            <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10 relative z-10 w-full flex flex-col items-center">

                {/* Feedback Banner */}
                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <AnimatePresence mode="wait">
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
                            className="bg-sky-200 border-2 border-black/10 rounded-[3rem] p-12 shadow-neo-sm w-full max-w-lg text-center rotate-1 relative mt-8 flex flex-col items-center justify-center min-h-[40vh]"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="text-6xl sm:text-7xl mb-6 bg-white p-4 rounded-full border-2 border-black/10 shadow-neo-sm -rotate-3"
                            >
                                🧠
                            </motion.div>
                            <h2 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tighter drop-shadow-[2px_2px_0_#fff]">Hafıza Testi</h2>
                            <p className="text-black font-black mt-4 bg-yellow-300 px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-sm rotate-2">Hazırlanıyor...</p>
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
                </AnimatePresence>
            </main>
        </ArcadeGameShell>
    );
};

export default ChromaBreak;
