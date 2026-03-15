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
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { useArcadeGameSession, type ArcadeFinishOptions } from '../../Shared/useArcadeGameSession';
type FeedbackState = { message: string; type: 'success' | 'error' } | null;

interface UseNeseliBalonlarGameOptions {
    autoStart?: boolean;
    onGameStart?: () => void;
}

export const useNeseliBalonlarGame = ({ autoStart, onGameStart }: UseNeseliBalonlarGameOptions = {}) => {
    const { playArcadeSound } = useArcadeSoundEffects();
    const {
        sessionState,
        startSession,
        addScore,
        advanceLevel,
        loseLife,
        finishGame,
        saveResult,
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
    const pendingGameOverSaveRef = useRef<ArcadeFinishOptions | null>(null);
    const clearScheduledTimeouts = useCallback(() => {
        timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
        timeoutIdsRef.current = [];
    }, []);
    const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
        const timeoutId = window.setTimeout(() => {
            timeoutIdsRef.current = timeoutIdsRef.current.filter((currentTimeoutId) => currentTimeoutId !== timeoutId);
            callback();
        }, delay);
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
        clearScheduledTimeouts();
        pendingGameOverSaveRef.current = null;
        playArcadeSound('start');
        startSession();
        setFeedback(null);
        isResolvingRef.current = false;
        promptStartedAtRef.current = 0;
        initLevel(1);
        onGameStart?.();
    }, [clearScheduledTimeouts, initLevel, onGameStart, playArcadeSound, startSession]);

    useEffect(() => {
        if (autoStart && sessionState.status === 'START') {
            handleStartGame();
        }
    }, [autoStart, handleStartGame, sessionState.status]);

    useEffect(() => () => {
        clearScheduledTimeouts();

        if (pendingGameOverSaveRef.current) {
            void saveResult(pendingGameOverSaveRef.current);
            pendingGameOverSaveRef.current = null;
        }
    }, [clearScheduledTimeouts, saveResult]);

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
                playArcadeSound('hit');

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
        playArcadeSound,
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
        const pendingGameOverResult = !isCorrect && nextLives <= 0
            ? {
                levelReached: sessionState.level,
                livesRemaining: 0,
            } satisfies ArcadeFinishOptions
            : null;

        recordAttempt({ isCorrect, responseMs });

        if (isCorrect) {
            const messages = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;
            playArcadeSound('levelUp');
            setFeedback({
                message: messages[Math.floor(Math.random() * messages.length)],
                type: 'success'
            });
            addScore(ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionState.level));
        } else {
            const messages = ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES;
            playArcadeSound('fail');
            setFeedback({
                message: messages[Math.floor(Math.random() * messages.length)],
                type: 'error'
            });
            loseLife();
        }

        setPhase('result');
        pendingGameOverSaveRef.current = pendingGameOverResult;

        scheduleTimeout(() => {
            setFeedback(null);
            isResolvingRef.current = false;
            promptStartedAtRef.current = 0;

            if (pendingGameOverResult) {
                pendingGameOverSaveRef.current = null;
                setPhase('gameover');
                void finishGame({ ...pendingGameOverResult, status: 'GAME_OVER' });
                return;
            }

            if (isCorrect) {
                pendingGameOverSaveRef.current = null;
                advanceLevel();
                initLevel(nextLevel);
                return;
            }

            pendingGameOverSaveRef.current = null;
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
        playArcadeSound,
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
