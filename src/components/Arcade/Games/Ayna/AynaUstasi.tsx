import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE, ARCADE_FEEDBACK_TEXTS } from '../../Shared/ArcadeConstants';
import { Target, Level } from './types';
import GameCanvas from './components/GameCanvas';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_LEVELS: Level[] = [
    {
        id: 1,
        title: "Gece Yansımaları",
        description: "Karanlıkta parlayan hedefleri vurmak için sol tarafa çizim yap!",
        targets: [
            { id: '1-1', x: 200, y: 150, hit: false },
            { id: '1-2', x: 200, y: 350, hit: false },
        ],
        backgroundPrompt: "Static"
    },
    {
        id: 2,
        title: "Karanlık Köşeler",
        description: "Karanlığın içindeki hedefleri bulmaya çalış!",
        targets: [
            { id: '2-1', x: 100, y: 100, hit: false },
            { id: '2-2', x: 300, y: 100, hit: false },
            { id: '2-3', x: 100, y: 400, hit: false },
            { id: '2-4', x: 300, y: 400, hit: false },
        ],
        backgroundPrompt: "Static"
    }
];

type GamePhase = 'idle' | 'playing' | 'finished';

const AynaUstasi: React.FC = () => {
    const location = useLocation();
    const { saveGamePlay } = useGamePersistence();
    const gameStartTimeRef = useRef<number>(0);
    const isResolvingRef = useRef(false);
    const hasSavedRef = useRef(false);

    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const [levels, setLevels] = useState<Level[]>(INITIAL_LEVELS);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [totalScore, setTotalScore] = useState(0);

    const currentLevel = levels[currentLevelIdx] ?? levels[levels.length - 1];
    const totalHits = currentLevel?.targets.filter(t => t.hit).length || 0;
    const totalTargets = currentLevel?.targets.length || 0;

    // Auto-start from Arcade Hub
    useEffect(() => {
        if (location.state?.autoStart && gamePhase === 'idle') {
            startGame();
        }
    }, [location.state]);

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setGamePhase('playing');
        setCurrentLevelIdx(0);
        setLevels(INITIAL_LEVELS.map(l => ({
            ...l,
            targets: l.targets.map(t => ({ ...t, hit: false }))
        })));
        setTotalScore(0);
        setResetTrigger(prev => prev + 1);
        setFeedback(null);
        setShowLevelUp(false);
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        gameStartTimeRef.current = Date.now();
    }, []);

    const generateProceduralLevel = (num: number): Level => {
        const targetCount = Math.min(3 + Math.floor(num / 1.5), 12);
        const types = ['circle', 'random', 'shapes'];
        const type = types[Math.floor(Math.random() * types.length)];
        const targets: Target[] = [];

        if (type === 'circle') {
            const centerX = 200;
            const centerY = 250;
            const radius = 80 + Math.random() * 80;
            for (let i = 0; i < targetCount; i++) {
                const angle = (i / targetCount) * Math.PI * 2;
                targets.push({
                    id: `p-${num}-${i}`,
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                    hit: false
                });
            }
        } else {
            for (let i = 0; i < targetCount; i++) {
                targets.push({
                    id: `p-${num}-${i}`,
                    x: 60 + Math.random() * 280,
                    y: 60 + Math.random() * 380,
                    hit: false
                });
            }
        }

        return {
            id: Date.now(),
            title: `Karanlık Bölüm #${num}`,
            description: "Neon hedefleri avlama zamanı!",
            targets,
            backgroundPrompt: "Procedural"
        };
    };

    const handleTargetHit = (targetId: string) => {
        if (isResolvingRef.current) return;

        setLevels(prev => {
            const newLevels = [...prev];
            const target = newLevels[currentLevelIdx].targets.find(t => t.id === targetId);
            if (target && !target.hit) {
                target.hit = true;
                const hitScore = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, currentLevelIdx + 1);
                setTotalScore(s => s + hitScore);
            }
            return newLevels;
        });
    };

    const handleDrawComplete = () => {
        if (!currentLevel || isResolvingRef.current) return;
        const hits = currentLevel.targets.filter(t => t.hit).length;
        const total = currentLevel.targets.length;

        if (hits === total) {
            isResolvingRef.current = true;
            const msgs = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;
            setFeedback({ message: msgs[Math.floor(Math.random() * msgs.length)], type: 'success' });

            setTimeout(() => {
                setFeedback(null);
                setShowLevelUp(true);
                isResolvingRef.current = false;
            }, 1500);
        }
    };

    const nextLevel = () => {
        setShowLevelUp(false);
        if (currentLevelIdx >= levels.length - 1) {
            const newLevel = generateProceduralLevel(levels.length + 1);
            setLevels(prev => [...prev, newLevel]);
        }
        setCurrentLevelIdx(prev => prev + 1);
        setResetTrigger(prev => prev + 1);
    };

    const resetLevel = () => {
        setLevels(prev => {
            const newLevels = [...prev];
            newLevels[currentLevelIdx].targets = newLevels[currentLevelIdx].targets.map(t => ({ ...t, hit: false }));
            return newLevels;
        });
        setResetTrigger(prev => prev + 1);
        setShowLevelUp(false);
    };

    const endGame = () => {
        setGamePhase('finished');
        if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'arcade-ayna-ustasi',
                score_achieved: totalScore,
                duration_seconds: duration,
                metadata: {
                    game_name: 'Ayna Ustası',
                    levels_completed: currentLevelIdx + 1
                }
            });
        }
    };

    // ─── Shell status mapping ────────────────────────────────────────────
    const shellStatus: 'START' | 'PLAYING' | 'GAME_OVER' =
        gamePhase === 'idle' ? 'START' :
            gamePhase === 'finished' ? 'GAME_OVER' : 'PLAYING';

    return (
        <ArcadeGameShell
            gameState={{ score: totalScore, level: currentLevelIdx + 1, lives: 1, status: shellStatus }}
            gameMetadata={{
                id: 'arcade-ayna-ustasi',
                title: 'AYNA USTASI',
                description: (
                    <>
                        <p>🪞 Sol tarafta çiz, sağ tarafta ayna görüntüsüyle hedefleri vur!</p>
                        <p className="mt-2">🧠 Ayna simetrisi ve görsel-uzamsal algı testi!</p>
                    </>
                ),
                tuzoCode: '3.2.1 Ayna Simetrisi',
                icon: <span className="text-5xl">🪞</span>,
                iconBgColor: 'bg-sky-400',
                containerBgColor: 'bg-rose-200 dark:bg-slate-900'
            }}
            onStart={startGame}
            onRestart={startGame}
            showLevel={true}
            showLives={false}
            allowMobileScroll
        >
            <div className="w-full min-h-[60dvh] flex flex-col items-center py-4 px-2 md:py-8 md:px-4 bg-sky-200 dark:bg-slate-900 font-sans transition-colors duration-300">

                {/* Feedback Banner */}
                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <main className="w-full max-w-5xl flex flex-col bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-black/10 dark:border-slate-700 shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] p-4 md:p-8 relative transition-colors duration-300">
                    {/* Level info + controls */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b-8 border-black/10 pb-6">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="bg-sky-400 text-black w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border-2 border-black/10 shadow-neo-sm rotate-3">
                                {currentLevelIdx + 1}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-black dark:text-white uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)] transition-colors duration-300">{currentLevel.title}</h2>
                                <div className="flex gap-2 mt-2">
                                    {Array.from({ length: totalTargets }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-4 w-6 rounded-full border-2 border-black/10 transition-all duration-300 ${i < totalHits ? 'bg-emerald-400 shadow-neo-sm w-12' : 'bg-slate-200'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={resetLevel}
                                className="px-6 py-3 bg-yellow-300 text-black rounded-xl font-black uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 border-2 border-black/10 shadow-neo-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                Sıfırla
                            </button>
                            <button
                                onClick={endGame}
                                className="px-6 py-3 bg-red-400 text-black rounded-xl font-black uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 border-2 border-black/10 shadow-neo-sm"
                            >
                                Bitir
                            </button>
                        </div>
                    </div>

                    <GameCanvas
                        targets={currentLevel.targets}
                        onTargetHit={handleTargetHit}
                        onDrawComplete={handleDrawComplete}
                        resetTrigger={resetTrigger}
                    />

                    {/* Level complete overlay (mid-game transition) */}
                    <AnimatePresence>
                        {showLevelUp && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 p-6 sm:p-10 rounded-[3rem] shadow-neo-sm text-center max-w-sm w-full transform rotate-2 transition-colors duration-300"
                                >
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h2 className="text-3xl md:text-4xl font-black mb-3 text-emerald-500 uppercase tracking-tighter">MÜKEMMEL!</h2>
                                    <p className="text-sm font-black text-rose-500 mb-6 bg-slate-100 dark:bg-slate-700 border-2 border-black/10 inline-block px-4 py-2 rounded-xl shadow-neo-sm -rotate-1 transition-colors duration-300">
                                        Tüm simetrileri buldun!
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                                        <button
                                            onClick={resetLevel}
                                            className="flex-1 py-3 bg-amber-300 active:translate-y-2 active:shadow-none hover:-translate-y-1 hover:shadow-neo-sm border-2 border-black/10 shadow-neo-sm rounded-2xl font-black text-lg uppercase transition-all text-black"
                                        >
                                            TEKRAR
                                        </button>
                                        <button
                                            onClick={nextLevel}
                                            className="flex-1 py-3 bg-sky-400 active:translate-y-2 active:shadow-none hover:-translate-y-1 hover:shadow-neo-sm border-2 border-black/10 shadow-neo-sm text-black rounded-2xl font-black text-lg transition-all uppercase"
                                        >
                                            SIRADAKİ ➔
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </ArcadeGameShell>
    );
};

export default AynaUstasi;
