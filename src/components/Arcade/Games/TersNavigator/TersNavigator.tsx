import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, Navigation, Play, RotateCcw, Star, Target, Timer } from 'lucide-react';
import { GameState, PerformanceStats } from './types';
import { GAME_DURATION } from './constants';
import Menu from './components/Menu';
import GameCanvas from './components/GameCanvas';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { KidCard, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';

const getRank = (score: number) => {
    if (score > 600) return 'Zihin Ustası';
    if (score > 400) return 'Odaklanma Uzmanı';
    if (score > 200) return 'Hızlı Düşünür';
    return 'Çaylak';
};

const TersNavigator: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();

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

    const startGame = useCallback(() => {
        hasSavedRef.current = false;
        setGameState(GameState.PLAYING);
        setTimeLeft(GAME_DURATION);
        setStats({ score: 0, accuracy: 0, averageTime: 0, rounds: 0 });
        totalCorrectRef.current = 0;
        totalRoundsRef.current = 0;
        totalTimeRef.current = 0;
        gameStartTimeRef.current = Date.now();
        playArcadeSound('start');
        focusPlayArea();
    }, [focusPlayArea, playArcadeSound]);

    // Auto-start from Hub
    useEffect(() => {
        if (location.state?.autoStart && gameState === GameState.MENU) {
            startGame();
        }
    }, [location.state, gameState, startGame]);

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

        let earnedScore = 0;
        if (isCorrect) {
            totalCorrectRef.current += 1;
            const baseScore = 10;
            const speedBonus = Math.max(0, Math.round((2 - reactionTime) * 5));
            earnedScore = baseScore + speedBonus;
            playArcadeSound('success');
        } else {
            playArcadeSound('fail');
        }

        setStats(prev => ({
            score: prev.score + earnedScore,
            accuracy: totalRoundsRef.current > 0 ? totalCorrectRef.current / totalRoundsRef.current : 0,
            averageTime: totalRoundsRef.current > 0 ? totalTimeRef.current / totalRoundsRef.current : 0,
            rounds: totalRoundsRef.current
        }));
    }, [playArcadeSound]);

    const accuracyLabel = stats.rounds > 0 ? `%${Math.round(stats.accuracy * 100)}` : 'Hazır';
    const averageTimeLabel = stats.rounds > 0 ? `${stats.averageTime.toFixed(2)} sn` : 'Isınma';
    const rank = getRank(Math.max(stats.score, highScore));

    const overlay = gameState === GameState.MENU ? (
        <KidGameStatusOverlay
            tone="blue"
            icon={Navigation}
            title="Ters Navigator"
            description="Kelimeyi oku, ama aynı yönü seçme. Yazının anlattığı yönün tam tersine basarak hedefe ilerle."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: startGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
        >
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-white/85 px-4 py-4 text-left shadow-neo-sm dark:border-white/10 dark:bg-slate-900/75">
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Kritik Kural
                    </div>
                    <div className="mt-2 text-xl font-black text-black dark:text-white">
                        YUKARI görürsen AŞAĞI seç.
                    </div>
                </div>
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/35 px-4 py-4 text-left shadow-neo-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-600">
                        Hedef
                    </div>
                    <div className="mt-2 text-sm font-bold leading-relaxed text-slate-700">
                        60 saniye boyunca hızlı cevap ver, puanını büyüt ve rekorunu geç.
                    </div>
                </div>
            </div>
        </KidGameStatusOverlay>
    ) : gameState === GameState.GAME_OVER ? (
        <KidGameStatusOverlay
            tone="purple"
            icon={Brain}
            title="Süre Doldu"
            description="Ters yön refleksini güzel kullandın. Bir tur daha açıp hızını ve doğruluğunu yükseltebilirsin."
            stats={[
                { label: 'Puan', value: stats.score, tone: 'yellow' },
                { label: 'Doğruluk', value: `%${Math.round(stats.accuracy * 100)}`, tone: 'emerald' },
                { label: 'Tur', value: stats.rounds, tone: 'blue' },
            ]}
            actions={[
                { label: 'Tekrar Oyna', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: startGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        >
            <KidCard accentColor="orange" animate={false}>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Bugünkü Ünvanın
                </div>
                <div className="mt-2 text-3xl font-black tracking-tight text-black dark:text-white">
                    {getRank(stats.score)}
                </div>
                <div className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    En iyi skorun: {Math.max(highScore, stats.score)} puan
                </div>
            </KidCard>
        </KidGameStatusOverlay>
    ) : null;

    return (
        <KidGameShell
            title="Ters Navigator"
            subtitle="Kelimeyi oku, tam ters yöndeki oku seç ve hedefe hızlıca ilerle."
            instruction="Ortadaki yazı hangi yönü söylüyorsa tam ters oka dokun. Hız bonusu da puan getirir."
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Ketleyici Kontrol', variant: 'difficulty' },
                { label: 'TUZÖ 6.1.1', variant: 'tuzo' },
            ]}
            stats={[
                {
                    label: 'Süre',
                    value: `${timeLeft}s`,
                    tone: timeLeft <= 10 ? 'pink' : 'blue',
                    icon: Timer,
                    emphasis: timeLeft <= 10 ? 'danger' : 'default',
                    helper: timeLeft <= 10 ? 'Son saniyeler' : 'Hızını koru',
                },
                { label: 'Puan', value: stats.score, tone: 'yellow', icon: Star, helper: 'Doğru yanıtta bonus var' },
                { label: 'Tur', value: stats.rounds, tone: 'emerald', icon: Target, helper: `${accuracyLabel} doğruluk` },
                { label: 'Rekor', value: highScore, tone: 'orange', icon: Brain, helper: rank },
            ]}
            supportTitle="Ters Ok Rehberi"
            supportDescription="Kuralları kısa tut, elini hızlı kullan ve son saniyelerde paniğe kapılma."
            playAreaRef={playAreaRef}
            playAreaClassName="min-h-[720px]"
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-pink/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Kritik Kural
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Yazı hangi yönü söylüyorsa tam ters oka bas. Okuma refleksini ters çevirmen gerekiyor.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/30 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Puan İpucu
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Her doğru cevap 10 puan kazandırır. 2 saniyeden hızlıysan ekstra hız puanı da alırsın.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Tempo
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Ortalama tepki süren şu an <span className="font-black text-black dark:text-white">{averageTimeLabel}</span>. Kısa ve net karar ver.
                        </p>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            {gameState === GameState.PLAYING && (
                <div className="flex min-h-[640px] items-center justify-center">
                    <GameCanvas onRoundComplete={handleRoundComplete} />
                </div>
            )}
            {gameState !== GameState.PLAYING && (
                <div className="flex min-h-[640px] items-center justify-center">
                    <Menu highScore={highScore} showStartButton={false} />
                </div>
            )}
        </KidGameShell>
    );
};

export default TersNavigator;
