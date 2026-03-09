import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { POP_DELAY, GAME_ID } from './constants';
import {
    buildQuestionText,
    createAnswerOptions,
    createLevelBalloons,
    createPopSequence,
    getNextUserGuesses,
    getWatchDuration,
    pickQuestionType,
    resolveGuesses,
    shouldHideRemainingBalloons
} from './logic';
import type { BalloonState, GamePhase } from './types';
import { QuestionType } from './types';
import {
    ARCADE_FEEDBACK_TEXTS,
    ARCADE_SCORE_BASE,
    ARCADE_SCORE_FORMULA
} from '../../Shared/ArcadeConstants';
import { useArcadeGameSession } from '../../Shared/useArcadeGameSession';
type FeedbackState = { message: string; type: 'success' | 'error' } | null;

export const useNeseliBalonlarGame = (autoStart?: boolean) => {
    const {
        sessionState,
        startSession,
        addScore,
        advanceLevel,
        loseLife,
        finishGame,
        recordAttempt
    } = useArcadeGameSession({ gameId: GAME_ID });
    const [balloons, setBalloons] = useState<BalloonState[]>([]);
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [poppedIndices, setPoppedIndices] = useState<number[]>([]);
    const [popOrder, setPopOrder] = useState<number[]>([]);
    const [userGuesses, setUserGuesses] = useState<number[]>([]);
    const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.NUMBER);
    const [feedback, setFeedback] = useState<FeedbackState>(null);
    const balloonsRef = useRef<BalloonState[]>([]);
    const promptStartedAtRef = useRef(0);
    const isResolvingRef = useRef(false);
    const timeoutIdsRef = useRef<number[]>([]);
    const clearScheduledTimeouts = useCallback(() => {
        timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
        timeoutIdsRef.current = [];
    }, []);
    const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
        const timeoutId = window.setTimeout(callback, delay);
        timeoutIdsRef.current.push(timeoutId);
        return timeoutId;
    }, []);
    const setNextBalloons = useCallback((updater: (current: BalloonState[]) => BalloonState[]) => {
        setBalloons((current) => {
            const next = updater(current);
            balloonsRef.current = next;
            return next;
        });
    }, []);

    const initLevel = useCallback((level: number) => {
        const nextBalloons = createLevelBalloons(level);
        balloonsRef.current = nextBalloons;
        setQuestionType(pickQuestionType(level));
        setBalloons(nextBalloons);
        setPoppedIndices([]);
        setPopOrder([]);
        setUserGuesses([]);
        setPhase('watching');
    }, []);

    const handleStartGame = useCallback(() => {
        window.scrollTo(0, 0);
        clearScheduledTimeouts();
        startSession();
        setFeedback(null);
        isResolvingRef.current = false;
        promptStartedAtRef.current = 0;
        initLevel(1);
    }, [clearScheduledTimeouts, initLevel, startSession]);

    useEffect(() => {
        if (autoStart && sessionState.status === 'START') {
            handleStartGame();
        }
    }, [autoStart, handleStartGame, sessionState.status]);

    useEffect(() => clearScheduledTimeouts, [clearScheduledTimeouts]);

    useEffect(() => {
        if (phase !== 'watching' && phase !== 'popping') {
            return undefined;
        }

        clearScheduledTimeouts();

        if (phase === 'watching') {
            scheduleTimeout(() => setPhase('popping'), getWatchDuration(sessionState.level));
            return clearScheduledTimeouts;
        }

        const nextPopOrder = createPopSequence(balloonsRef.current, sessionState.level);
        setPoppedIndices(nextPopOrder);
        setPopOrder(nextPopOrder);

        nextPopOrder.forEach((id, index) => {
            scheduleTimeout(() => {
                setNextBalloons((current) =>
                    current.map((balloon) =>
                        balloon.id === id ? { ...balloon, isPopped: true } : balloon
                    )
                );

                if (index === nextPopOrder.length - 1) {
                    scheduleTimeout(() => {
                        setNextBalloons((current) =>
                            current.map((balloon) =>
                                balloon.isPopped ? { ...balloon, isVisible: false } : balloon
                            )
                        );
                        setPhase('guessing');
                        promptStartedAtRef.current = Date.now();
                    }, 1000);
                }
            }, index * POP_DELAY);
        });

        return clearScheduledTimeouts;
    }, [
        clearScheduledTimeouts,
        phase,
        scheduleTimeout,
        sessionState.level,
        setNextBalloons
    ]);

    const answerOptions = useMemo(() => {
        return createAnswerOptions(questionType, balloons, sessionState.level, poppedIndices);
    }, [balloons, poppedIndices, questionType, sessionState.level]);

    const questionText = useMemo(() => {
        return buildQuestionText(questionType, poppedIndices.length);
    }, [poppedIndices.length, questionType]);

    const handleGuess = useCallback((optionId: number) => {
        if (phase !== 'guessing' || isResolvingRef.current) {
            return;
        }

        setUserGuesses((current) =>
            getNextUserGuesses(questionType, current, optionId, poppedIndices.length)
        );
    }, [phase, poppedIndices.length, questionType]);

    const submitGuesses = useCallback(() => {
        if (phase !== 'guessing' || isResolvingRef.current) {
            return;
        }

        isResolvingRef.current = true;
        const isCorrect = resolveGuesses(
            questionType,
            userGuesses,
            poppedIndices,
            popOrder,
            balloonsRef.current
        );
        const responseMs = promptStartedAtRef.current > 0
            ? Date.now() - promptStartedAtRef.current
            : null;
        const nextLevel = sessionState.level + 1;
        const nextLives = isCorrect ? sessionState.lives : Math.max(0, sessionState.lives - 1);

        recordAttempt({ isCorrect, responseMs });

        if (isCorrect) {
            const messages = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;
            setFeedback({
                message: messages[Math.floor(Math.random() * messages.length)],
                type: 'success'
            });
            addScore(ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionState.level));
        } else {
            const messages = ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES;
            setFeedback({
                message: messages[Math.floor(Math.random() * messages.length)],
                type: 'error'
            });
            loseLife();
        }

        setPhase('result');

        scheduleTimeout(() => {
            setFeedback(null);
            isResolvingRef.current = false;
            promptStartedAtRef.current = 0;

            if (!isCorrect && nextLives <= 0) {
                setPhase('gameover');
                void finishGame({ status: 'GAME_OVER' });
                return;
            }

            if (isCorrect) {
                advanceLevel();
                initLevel(nextLevel);
                return;
            }

            initLevel(sessionState.level);
        }, 2000);
    }, [
        addScore,
        advanceLevel,
        finishGame,
        initLevel,
        loseLife,
        phase,
        popOrder,
        poppedIndices,
        questionType,
        recordAttempt,
        scheduleTimeout,
        sessionState.level,
        sessionState.lives,
        userGuesses
    ]);

    return {
        sessionState,
        balloons,
        phase,
        poppedIndices,
        popOrder,
        userGuesses,
        questionType,
        feedback,
        answerOptions,
        questionText,
        shouldHideRemaining: shouldHideRemainingBalloons(sessionState.level),
        watchDurationMs: getWatchDuration(sessionState.level),
        handleStartGame,
        handleGuess,
        submitGuesses
    };
};
