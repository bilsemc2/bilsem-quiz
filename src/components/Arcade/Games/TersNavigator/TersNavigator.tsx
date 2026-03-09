import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Timer, Navigation } from 'lucide-react';
import { GameState, PerformanceStats } from './types';
import { GAME_DURATION } from './constants';
import Menu from './components/Menu';
import GameCanvas from './components/GameCanvas';
import GameOver from './components/GameOver';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';

const TersNavigator: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();

    const [gameState, setGameState] = useState<GameState>(GameState.MENU);
    const [stats, setStats] = useState<PerformanceStats>({ score: 0, accuracy: 0, averageTime: 0, rounds: 0 });
    const [highScore, setHighScore] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION);

    const totalCorrectRef = useRef(0);
    const totalRoundsRef = useRef(0);
    const totalTimeRef = useRef(0);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    useEffect(() => {
        const saved = localStorage.getItem('tersNavigator_highScore');
        if (saved) setHighScore(parseInt(saved, 10));
    }, []);

    const startGame = () => {
        window.scrollTo(0, 0);
        hasSavedRef.current = false;
        setGameState(GameState.PLAYING);
        setTimeLeft(GAME_DURATION);
        setStats({ score: 0, accuracy: 0, averageTime: 0, rounds: 0 });
        totalCorrectRef.current = 0;
        totalRoundsRef.current = 0;
        totalTimeRef.current = 0;
        gameStartTimeRef.current = Date.now();
    };

    // Auto-start from Hub
    useEffect(() => {
        if (location.state?.autoStart && gameState === GameState.MENU) {
            startGame();
        }
    }, [location.state, gameState]);

    const endGame = useCallback(() => {
        const finalStats: PerformanceStats = {
            score: stats.score,
            accuracy: totalRoundsRef.current > 0 ? totalCorrectRef.current / totalRoundsRef.current : 0,
            averageTime: totalRoundsRef.current > 0 ? totalTimeRef.current / totalRoundsRef.current : 0,
            rounds: totalRoundsRef.current
        };
        setStats(finalStats);
        setGameState(GameState.GAME_OVER);

        if (finalStats.score > highScore) {
            setHighScore(finalStats.score);
            localStorage.setItem('tersNavigator_highScore', finalStats.score.toString());
        }

        if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            saveGamePlay({
                game_id: 'ters-navigator',
                score_achieved: finalStats.score,
                duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
                metadata: { accuracy: finalStats.accuracy, rounds: finalStats.rounds }
            });
        }
    }, [stats.score, highScore, saveGamePlay]);

    useEffect(() => {
        if (gameState !== GameState.PLAYING) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [endGame, gameState]);

    const handleRoundComplete = useCallback((isCorrect: boolean, reactionTime: number) => {
        totalRoundsRef.current += 1;
        totalTimeRef.current += reactionTime;

        if (isCorrect) {
            totalCorrectRef.current += 1;
            const baseScore = 10;
            const speedBonus = Math.max(0, Math.round((2 - reactionTime) * 5));
            setStats(prev => ({ ...prev, score: prev.score + baseScore + speedBonus }));
        }
    }, []);

    // Map local GameState enum → ArcadeGameShell status string
    const shellStatus: 'START' | 'PLAYING' | 'GAME_OVER' =
        gameState === GameState.MENU ? 'START'
            : gameState === GameState.PLAYING ? 'PLAYING'
                : 'GAME_OVER';

    // Süre sayacı — ArcadeGameShell HUD'una eklenir
    const timerHud = (
        <div className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl shadow-neo-sm flex items-center gap-1.5 sm:gap-2 border-2 border-black/10 rotate-1 transition-colors duration-300 ${timeLeft <= 10 ? 'bg-red-300 animate-pulse' : 'bg-blue-300 dark:bg-slate-700'}`}>
            <Timer className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[3px] ${timeLeft <= 10 ? 'text-red-700' : 'text-black dark:text-white'}`} />
            <span className={`text-base sm:text-lg font-black leading-none bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border-2 border-black/10 dark:border-slate-700 tabular-nums transition-colors duration-300 ${timeLeft <= 10 ? 'text-red-700' : 'text-black dark:text-white'}`}>{timeLeft}s</span>
        </div>
    );

    return (
        <ArcadeGameShell
            gameState={{ score: stats.score, level: 1, lives: 1, status: shellStatus }}
            gameMetadata={{
                id: 'ters-navigator',
                title: 'TERS NAVİGATÖR',
                description: (
                    <>
                        <p>🧭 Ekrandaki <strong>kelimeyi</strong> oku — ama yönü değil harfin gösterdiği <strong>oku</strong> izle!</p>
                        <p className="mt-2">⚡ Hızlı karar ver, süreni iyi kullan. {GAME_DURATION} saniyede kaç puan toplarsan o kadar iyisin!</p>
                    </>
                ),
                tuzoCode: '5.8.1 Bilişsel Esneklik',
                icon: <Navigation className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-blue-400',
                containerBgColor: 'bg-sky-200 dark:bg-slate-900'
            }}
            onStart={startGame}
            onRestart={startGame}
            showLevel={false}
            showLives={false}
            hudExtras={timerHud}
        >
            {/* Menu Screen */}
            {gameState === GameState.MENU && (
                <Menu onStart={startGame} highScore={highScore} />
            )}

            {/* Play Area */}
            {gameState === GameState.PLAYING && (
                <div className="w-full max-w-5xl pt-32 sm:pt-28">
                    <GameCanvas onRoundComplete={handleRoundComplete} />
                </div>
            )}

            {/* Game Over Screen — istatistik gösterir */}
            {gameState === GameState.GAME_OVER && (
                <div className="pt-20">
                    <GameOver
                        stats={stats}
                        onRestart={startGame}
                        onMenu={() => setGameState(GameState.MENU)}
                    />
                </div>
            )}
        </ArcadeGameShell>
    );
};

export default TersNavigator;
