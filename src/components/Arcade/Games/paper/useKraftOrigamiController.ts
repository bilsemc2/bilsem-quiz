// KraftOrigami — State management hook

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence.ts';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus.ts';
import { ARCADE_SCORE_BASE, ARCADE_SCORE_FORMULA } from '../../Shared/ArcadeConstants.ts';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects.ts';
import { FoldDirection, PaperState, PunchShape } from './types.ts';
import { calculateUnfoldedPunches, getFoldedDimensions } from './utils.ts';

export type GamePhase = 'idle' | 'playing' | 'finished';

export const PAPER_COLORS = [
    { name: 'Kraft', value: '#d4b483' },
    { name: 'Gökyüzü', value: '#bae6fd' },
    { name: 'Şeftali', value: '#ffedd5' },
    { name: 'Lavanta', value: '#f3e8ff' },
];

export const shapeLabels: Record<PunchShape, string> = {
    [PunchShape.CIRCLE]: 'Daire',
    [PunchShape.HEART]: 'Kalp',
    [PunchShape.STAR]: 'Yıldız',
    [PunchShape.SQUARE]: 'Kare',
};

export function useKraftOrigamiController() {
    const location = useLocation();
    const navigate = useNavigate();
    const { saveGamePlay } = useGamePersistence();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();
    const gameStartTimeRef = useRef<number>(0);
    const isResolvingRef = useRef(false);
    const hasSavedRef = useRef(false);
    const feedbackTimeoutRef = useRef<number | null>(null);

    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [state, setState] = useState<PaperState>({
        folds: [],
        punches: [],
        isUnfolded: false,
        paperColor: PAPER_COLORS[0].value,
    });
    const [currentShape, setCurrentShape] = useState<PunchShape>(PunchShape.CIRCLE);

    const foldedDim = useMemo(() => getFoldedDimensions(state.folds), [state.folds]);

    const finalPunches = useMemo(
        () => (state.isUnfolded ? calculateUnfoldedPunches(state.folds, state.punches) : state.punches),
        [state.folds, state.isUnfolded, state.punches],
    );

    const score = useMemo(() => {
        const foldBonus = state.folds.length * ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, 1);
        const punchBonus = finalPunches.length * Math.round(ARCADE_SCORE_BASE * 0.5);
        return foldBonus + punchBonus;
    }, [finalPunches.length, state.folds.length]);

    const clearFeedbackTimeout = useCallback(() => {
        if (feedbackTimeoutRef.current !== null) {
            window.clearTimeout(feedbackTimeoutRef.current);
            feedbackTimeoutRef.current = null;
        }
    }, []);

    const scheduleFeedbackClear = useCallback((delay: number = 1500) => {
        clearFeedbackTimeout();
        feedbackTimeoutRef.current = window.setTimeout(() => {
            feedbackTimeoutRef.current = null;
            setFeedback(null);
        }, delay);
    }, [clearFeedbackTimeout]);

    const startGame = useCallback(() => {
        clearFeedbackTimeout();
        setGamePhase('playing');
        setState({
            folds: [],
            punches: [],
            isUnfolded: false,
            paperColor: PAPER_COLORS[0].value,
        });
        setCurrentShape(PunchShape.CIRCLE);
        setFeedback(null);
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        gameStartTimeRef.current = Date.now();
        playArcadeSound('start');
        focusPlayArea();
    }, [clearFeedbackTimeout, focusPlayArea, playArcadeSound]);

    useEffect(() => {
        if (location.state?.autoStart && gamePhase === 'idle') {
            startGame();
        }
    }, [gamePhase, location.state, startGame]);

    useEffect(() => clearFeedbackTimeout, [clearFeedbackTimeout]);

    const handleFold = useCallback((direction: FoldDirection) => {
        if (state.isUnfolded || state.folds.length >= 6) {
            return;
        }

        setState((prev) => ({
            ...prev,
            folds: [...prev.folds, direction],
        }));
        playArcadeSound('hit');
        setFeedback({ message: `Katlama ${state.folds.length + 1} hazır. Şimdi şekli yerleştir!`, type: 'success' });
        scheduleFeedbackClear();
    }, [playArcadeSound, scheduleFeedbackClear, state.folds.length, state.isUnfolded]);

    const handlePunch = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (state.isUnfolded || state.folds.length === 0) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const relX = (event.clientX - rect.left) / rect.width;
        const relY = (event.clientY - rect.top) / rect.height;
        const absX = foldedDim.offsetX + relX * foldedDim.width;
        const absY = foldedDim.offsetY + relY * foldedDim.height;

        setState((prev) => ({
            ...prev,
            punches: [...prev.punches, { x: absX, y: absY, shape: currentShape }],
        }));
    }, [currentShape, foldedDim.height, foldedDim.offsetX, foldedDim.offsetY, foldedDim.width, state.folds.length, state.isUnfolded]);

    const toggleUnfold = useCallback(() => {
        setState((prev) => ({ ...prev, isUnfolded: !prev.isUnfolded }));
        if (!state.isUnfolded) {
            playArcadeSound('success');
            setFeedback({ message: 'Simetri açıldı. Deseni inceleyebilirsin!', type: 'success' });
            scheduleFeedbackClear();
        }
    }, [playArcadeSound, scheduleFeedbackClear, state.isUnfolded]);

    const handleReset = useCallback(() => {
        clearFeedbackTimeout();
        setState((prev) => ({ ...prev, folds: [], punches: [], isUnfolded: false }));
        setFeedback(null);
        focusPlayArea();
    }, [clearFeedbackTimeout, focusPlayArea]);

    const finishGame = useCallback(() => {
        if (isResolvingRef.current) {
            return;
        }

        isResolvingRef.current = true;
        clearFeedbackTimeout();
        setGamePhase('finished');

        if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            void saveGamePlay({
                game_id: 'arcade-kraft-origami',
                score_achieved: score,
                duration_seconds: duration,
                metadata: {
                    game_name: 'Kraft Origami',
                    total_folds: state.folds.length,
                    total_punches: state.punches.length,
                    unfolded_holes: finalPunches.length,
                },
            });
        }
    }, [clearFeedbackTimeout, finalPunches.length, saveGamePlay, score, state.folds.length, state.punches.length]);

    const isPunchable = !state.isUnfolded && state.folds.length > 0;
    const currentPaperColorName = PAPER_COLORS.find((paperColor) => paperColor.value === state.paperColor)?.name ?? 'Kraft';

    const instruction =
        gamePhase === 'playing'
            ? state.folds.length === 0
                ? 'Önce kağıdı katla. Görünür alan küçülünce delgeç şekliyle kağıda iz bırakabilirsin.'
                : state.isUnfolded
                    ? 'Deseni açtın. Simetriyi incele, istersen yeniden katla ya da bitir.'
                    : `${shapeLabels[currentShape]} delgeçini seçtin. Görünür kağıt parçasına dokun ve sonra açarak sonucu gör.`
            : 'Kağıdı katla, farklı şekillerle del ve simetriyi açarak kendi desenini oluştur.';

    return {
        gamePhase,
        feedback,
        state,
        setState,
        currentShape,
        setCurrentShape,
        foldedDim,
        finalPunches,
        score,
        isPunchable,
        currentPaperColorName,
        instruction,
        playAreaRef,

        startGame,
        handleFold,
        handlePunch,
        toggleUnfold,
        handleReset,
        finishGame,
        navigate,
    };
}
