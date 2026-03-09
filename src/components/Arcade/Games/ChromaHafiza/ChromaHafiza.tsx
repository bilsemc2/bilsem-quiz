import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { GamePhase, PuzzlePiece } from './types';
import { LEVEL_CONFIGS, GAME_NAME, TUZO_CODE } from './constants';
import { generatePuzzlePieces } from './utils/patternGenerator';
import GameScene from './components/GameScene';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Info, Brain, ChevronRight } from 'lucide-react';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE, ARCADE_FEEDBACK_TEXTS } from '../../Shared/ArcadeConstants';
import { useArcadeGameSession } from '../../Shared/useArcadeGameSession';

const ChromaHafiza: React.FC = () => {
    const location = useLocation();
    const {
        sessionState,
        startSession,
        addScore,
        advanceLevel,
        finishGame,
        loseLife,
        recordAttempt
    } = useArcadeGameSession({ gameId: 'arcade-chroma-hafiza', initialLevel: 0 });

    const isResolvingRef = useRef(false);
    const roundStartedAtRef = useRef(0);

    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
    const [targetColor, setTargetColor] = useState<string>('');
    const [isRevealing, setIsRevealing] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const initLevel = useCallback((levelIdx: number) => {
        const config = LEVEL_CONFIGS[levelIdx % LEVEL_CONFIGS.length];
        const newPieces = generatePuzzlePieces(config.pieceCount, config.colorCount);
        const distinctColors = Array.from(new Set(newPieces.map((piece) => piece.targetColor)));
        const selectedColor = distinctColors[Math.floor(Math.random() * distinctColors.length)];

        setPieces(newPieces);
        setTargetColor(selectedColor);
        setGamePhase('preview');
        setIsRevealing(true);
        setShowLevelUp(false);

        setTimeout(() => {
            setIsRevealing(false);
            setGamePhase('playing');
            roundStartedAtRef.current = Date.now();
        }, config.previewDuration);
    }, []);

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        startSession();
        setGamePhase('preview');
        setFeedback(null);
        setShowLevelUp(false);
        isResolvingRef.current = false;
        initLevel(0);
    }, [initLevel, startSession]);

    useEffect(() => {
        if (location.state?.autoStart && sessionState.status === 'START') {
            startGame();
        }
    }, [location.state, sessionState.status, startGame]);

    const handlePieceClick = useCallback((id: string) => {
        if (gamePhase !== 'playing' || isResolvingRef.current) {
            return;
        }

        const selectedPiece = pieces.find((piece) => piece.id === id);
        recordAttempt({
            isCorrect: selectedPiece?.targetColor === targetColor,
            responseMs: roundStartedAtRef.current > 0 ? Date.now() - roundStartedAtRef.current : null
        });

        setPieces((previous) => previous.map((piece) => {
            if (piece.id === id) {
                const isCorrect = piece.targetColor === targetColor;
                return { ...piece, isSelected: true, isCorrect };
            }
            return piece;
        }));
    }, [gamePhase, pieces, recordAttempt, targetColor]);

    useEffect(() => {
        if (gamePhase !== 'playing' || isResolvingRef.current) {
            return;
        }

        const piecesForColor = pieces.filter((piece) => piece.targetColor === targetColor);
        const selectedCorrect = piecesForColor.filter((piece) => piece.isSelected);
        const lastSelectedWrongPiece = pieces.find((piece) => piece.isSelected && !piece.isCorrect);

        if (lastSelectedWrongPiece) {
            isResolvingRef.current = true;
            setGamePhase('reveal');
            setIsRevealing(true);
            setFeedback({
                message: ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES[
                    Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES.length)
                ],
                type: 'error'
            });

            const nextSession = loseLife();

            setTimeout(() => {
                setIsRevealing(false);
                setFeedback(null);

                if (nextSession.lives <= 0) {
                    setGamePhase('game_over');
                    void finishGame({
                        status: 'GAME_OVER',
                        metadata: {
                            game_name: GAME_NAME,
                            levels_completed: sessionState.level,
                            final_level: sessionState.level + 1
                        }
                    });
                } else {
                    initLevel(sessionState.level);
                }

                isResolvingRef.current = false;
            }, 2000);

            return;
        }

        if (selectedCorrect.length === piecesForColor.length && piecesForColor.length > 0) {
            isResolvingRef.current = true;
            setGamePhase('reveal');
            setIsRevealing(true);

            const bonus = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionState.level + 1);
            addScore(bonus);
            setFeedback({
                message: ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES[
                    Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES.length)
                ],
                type: 'success'
            });

            setTimeout(() => {
                setIsRevealing(false);
                setFeedback(null);
                setShowLevelUp(true);
                setGamePhase('success');
                isResolvingRef.current = false;
            }, 2000);
        }
    }, [addScore, finishGame, gamePhase, initLevel, loseLife, pieces, sessionState.level, targetColor]);

    const nextLevel = useCallback(() => {
        const nextSession = advanceLevel();
        setShowLevelUp(false);
        initLevel(nextSession.level);
    }, [advanceLevel, initLevel]);

    return (
        <ArcadeGameShell
            gameState={{ ...sessionState, level: sessionState.level + 1 }}
            gameMetadata={{
                id: 'arcade-chroma-hafiza',
                title: GAME_NAME,
                description: (
                    <>
                        <p>🎨 Renkleri hafızanda tut ve hedef renkteki tüm parçaları bul!</p>
                        <p className="mt-2">💡 Önce renkleri gör, sonra parçalar gizlenir — hafızana güven!</p>
                    </>
                ),
                tuzoCode: TUZO_CODE,
                icon: <Brain className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-sky-400',
                containerBgColor: 'bg-sky-200 dark:bg-slate-900'
            }}
            onStart={startGame}
            onRestart={startGame}
            showLevel={true}
            showLives={true}
        >
            <div className="relative w-full flex flex-col h-[calc(100dvh-4rem)]">
                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <main className="flex-1 relative min-h-[50dvh] sm:min-h-[60dvh]">
                    <GameScene
                        pieces={pieces}
                        isRevealing={isRevealing}
                        onPieceClick={handlePieceClick}
                        isGameWon={gamePhase === 'success'}
                    />

                    <AnimatePresence>
                        {(gamePhase === 'playing' || gamePhase === 'reveal') && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 sm:gap-4 z-20"
                            >
                                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 rounded-[2rem] flex items-center justify-center gap-3 sm:gap-5 shadow-neo-sm rotate-2 transition-colors duration-300">
                                    <Target className="text-black dark:text-white w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Hedef Renk</span>
                                        <span className="text-sm sm:text-base font-black text-black dark:text-white uppercase tracking-widest transition-colors duration-300">Bu Rengi Bul</span>
                                    </div>
                                    <div
                                        className="w-20 h-16 sm:w-24 sm:h-20 rounded-2xl border-2 border-black/10 shadow-neo-sm"
                                        style={{ backgroundColor: targetColor }}
                                    />
                                </div>

                                {gamePhase === 'reveal' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-yellow-300 px-4 py-2 mt-2 rounded-xl border-2 border-black/10 flex items-center gap-2 shadow-neo-sm -rotate-2"
                                    >
                                        <Info size={16} className="text-black" strokeWidth={3} />
                                        <span className="text-xs sm:text-sm text-black font-black uppercase tracking-widest">Kontrol Ediliyor...</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {showLevelUp && gamePhase === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
                            >
                                <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[3rem] border-2 border-black/10 dark:border-slate-700 shadow-neo-sm text-center space-y-6 max-w-sm transform rotate-2 transition-colors duration-300">
                                    <div className="text-6xl sm:text-7xl">🎉</div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-emerald-500 uppercase tracking-tighter">BAŞARILI!</h2>
                                    <p className="text-black dark:text-white font-black bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-sm -rotate-2 transition-colors duration-300">
                                        +{ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionState.level + 1)} Puan
                                    </p>
                                    <button
                                        onClick={nextLevel}
                                        className="w-full py-4 sm:py-5 bg-sky-400 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all shadow-neo-sm border-2 border-black/10 text-xl sm:text-2xl"
                                    >
                                        SONRAKİ SEVİYE <ChevronRight size={24} strokeWidth={3} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </ArcadeGameShell>
    );
};

export default ChromaHafiza;
