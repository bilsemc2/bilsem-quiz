import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Timer } from 'lucide-react';
import { GameState, PerformanceStats } from './types';
import { GAME_DURATION } from './constants';
import Menu from './components/Menu';
import GameCanvas from './components/GameCanvas';
import GameOver from './components/GameOver';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';

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

    // Auto-start from Hub
    useEffect(() => {
        if (location.state?.autoStart && gameState === GameState.MENU) {
            startGame();
        }
    }, [location.state, gameState]);

    useEffect(() => {
        const saved = localStorage.getItem('tersNavigator_highScore');
        if (saved) setHighScore(parseInt(saved, 10));
    }, []);

    const startGame = () => {
        setGameState(GameState.PLAYING);
        setTimeLeft(GAME_DURATION);
        setStats({ score: 0, accuracy: 0, averageTime: 0, rounds: 0 });
        totalCorrectRef.current = 0;
        totalRoundsRef.current = 0;
        totalTimeRef.current = 0;
        gameStartTimeRef.current = Date.now();
    };

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
    }, [gameState]);

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

        saveGamePlay({
            game_id: 'ters-navigator',
            score_achieved: finalStats.score,
            duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
            metadata: { accuracy: finalStats.accuracy, rounds: finalStats.rounds }
        });
    }, [stats.score, highScore, saveGamePlay]);

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

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-2 sm:p-4 pt-16 sm:pt-20 relative touch-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
            {/* Back to Arcade */}
            <div className="absolute top-16 sm:top-20 left-2 sm:left-4 z-50">
                <Link to="/bilsem-zeka" className="flex items-center gap-1.5 sm:gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900/50 backdrop-blur px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-800">
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-bold text-xs sm:text-sm">BİLSEM Zeka</span>
                </Link>
            </div>

            {/* Timer During Play */}
            {gameState === GameState.PLAYING && (
                <div className="absolute top-16 sm:top-20 right-2 sm:right-4 z-50 flex items-center gap-1.5 sm:gap-3 bg-slate-900/70 backdrop-blur-md border border-slate-700 rounded-full px-3 sm:px-5 py-1.5 sm:py-3 shadow-xl">
                    <Timer className={`w-4 h-4 sm:w-6 sm:h-6 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`} />
                    <span className={`text-xl sm:text-3xl font-black tabular-nums ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>{timeLeft}</span>
                </div>
            )}

            {/* Score During Play - Hidden on very small screens to avoid clutter */}
            {gameState === GameState.PLAYING && (
                <div className="hidden sm:block absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/70 backdrop-blur-md border border-slate-700 rounded-full px-6 py-3 shadow-xl">
                    <span className="text-2xl font-black text-yellow-400">{stats.score}</span>
                    <span className="text-slate-500 text-sm font-bold ml-2">puan</span>
                </div>
            )}

            {/* Game Content */}
            {gameState === GameState.MENU && (
                <Menu onStart={startGame} highScore={highScore} />
            )}

            {gameState === GameState.PLAYING && (
                <div className="w-full max-w-5xl">
                    <GameCanvas onRoundComplete={handleRoundComplete} />
                </div>
            )}

            {gameState === GameState.GAME_OVER && (
                <GameOver
                    stats={stats}
                    onRestart={startGame}
                    onMenu={() => setGameState(GameState.MENU)}
                />
            )}
        </div>
    );
};

export default TersNavigator;
