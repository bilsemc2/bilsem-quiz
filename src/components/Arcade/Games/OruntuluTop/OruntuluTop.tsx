import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Target } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ARCADE_SCORE_BASE, ARCADE_SCORE_FORMULA } from '../../Shared/ArcadeConstants';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import { useArcadeGameSession } from '../../Shared/useArcadeGameSession';
import { COLOR_CONFIG } from './constants';
import {
    collectMatchingBubbles,
    createInitialBubbles,
    ensureTargetAccessible,
    generatePatternDefinition
} from './logic';
import { createExplosionParticles } from './physics';
import OruntuluTopCanvas from './OruntuluTopCanvas';
import type { Bubble, BubbleColor, Particle } from './types';
import { useOruntuluTopCanvas } from './useOruntuluTopCanvas';

const OruntuluTop: React.FC = () => {
    const location = useLocation();
    const {
        sessionState,
        sessionRef,
        startSession,
        addScore,
        advanceLevel,
        loseLife,
        finishGame,
        recordAttempt
    } = useArcadeGameSession({ gameId: 'oruntulu-top' });

    const bubblesRef = useRef<Bubble[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const targetColorRef = useRef<BubbleColor | null>(null);
    const isResolvingRef = useRef(false);

    const [currentPattern, setCurrentPattern] = useState<BubbleColor[]>([]);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const generateNextPattern = useCallback(() => {
        const nextPattern = generatePatternDefinition();
        setCurrentPattern(nextPattern.pattern);
        targetColorRef.current = nextPattern.correct;
        return nextPattern.correct;
    }, []);

    const {
        canvasRef,
        containerRef,
        getLayoutSnapshot,
        handlePointerStart,
        handlePointerMove,
        handlePointerEnd
    } = useOruntuluTopCanvas({
        isPlaying: sessionState.status === 'PLAYING',
        feedbackActive: feedback !== null,
        isResolvingRef,
        bubblesRef,
        particlesRef,
        onBubbleHit: (hitBubble) => {
            if (isResolvingRef.current || sessionRef.current.status !== 'PLAYING') {
                return;
            }

            isResolvingRef.current = true;

            if (hitBubble.color === targetColorRef.current) {
                const matches = collectMatchingBubbles(hitBubble, bubblesRef.current);
                matches.forEach((bubble) => {
                    bubble.active = false;
                    particlesRef.current.push(
                        ...createExplosionParticles(bubble.x, bubble.y, COLOR_CONFIG[bubble.color].hex)
                    );
                });

                const earnedScore =
                    ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionRef.current.level) +
                    (matches.length * 100);

                recordAttempt({ isCorrect: true, responseMs: null });
                addScore(earnedScore);
                advanceLevel();
                setFeedback({ type: 'success', msg: `Harika! +${earnedScore} puan 🎯` });

                setTimeout(() => {
                    setFeedback(null);
                    isResolvingRef.current = false;

                    if (bubblesRef.current.filter((bubble) => bubble.active).length < 10) {
                        const layout = getLayoutSnapshot();
                        const nextBubbles = createInitialBubbles(layout);
                        const nextTarget = generateNextPattern();
                        bubblesRef.current = ensureTargetAccessible(
                            nextBubbles,
                            nextTarget,
                            layout.gridCols
                        );
                    } else {
                        const nextTarget = generateNextPattern();
                        bubblesRef.current = ensureTargetAccessible(
                            bubblesRef.current,
                            nextTarget,
                            getLayoutSnapshot().gridCols
                        );
                    }
                }, 1500);

                return;
            }

            const nextSession = loseLife();
            recordAttempt({ isCorrect: false, responseMs: null });
            setFeedback({ type: 'error', msg: 'Yanlış renk! Örüntüyü kontrol et.' });

            setTimeout(() => {
                setFeedback(null);
                isResolvingRef.current = false;
            }, 1500);

            if (nextSession.lives <= 0) {
                void finishGame({ status: 'GAME_OVER' });
            }
        }
    });

    const initGrid = useCallback(() => {
        const layout = getLayoutSnapshot();
        const nextBubbles = createInitialBubbles(layout);
        const nextTarget = generateNextPattern();
        bubblesRef.current = ensureTargetAccessible(
            nextBubbles,
            nextTarget,
            layout.gridCols
        );
    }, [generateNextPattern, getLayoutSnapshot]);

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        startSession();
        setFeedback(null);
        isResolvingRef.current = false;
        particlesRef.current = [];
        initGrid();
    }, [initGrid, startSession]);

    useEffect(() => {
        if (location.state?.autoStart && sessionState.status === 'START') {
            startGame();
        }
    }, [location.state, sessionState.status, startGame]);

    return (
        <ArcadeGameShell
            gameState={sessionState}
            gameMetadata={{
                id: 'oruntulu-top',
                title: 'ÖRÜNTÜ AVCISI',
                description: (
                    <>
                        <p>1. Örüntüdeki <span className="inline-block rotate-1 rounded border-2 border-black/10 bg-white px-2 py-0.5 text-rose-500">eksik balonu</span> bul.</p>
                        <p>2. Sapanla o renkteki balonu vur!</p>
                        <p>3. Yanlış renk can kaybettirir. <span className="font-black text-rose-500">Dikkatli ol!</span></p>
                    </>
                ),
                tuzoCode: '5.3.1 Örüntü Tamamlama',
                icon: <Target className="h-14 w-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-emerald-400',
                containerBgColor: 'bg-sky-200 dark:bg-slate-900'
            }}
            onStart={startGame}
            onRestart={startGame}
            showLevel={true}
            showLives={true}
        >
            <OruntuluTopCanvas
                containerRef={containerRef}
                canvasRef={canvasRef}
                isPlaying={sessionState.status === 'PLAYING'}
                currentPattern={currentPattern}
                feedback={feedback}
                onPointerStart={handlePointerStart}
                onPointerMove={handlePointerMove}
                onPointerEnd={handlePointerEnd}
            />
        </ArcadeGameShell>
    );
};

export default OruntuluTop;
