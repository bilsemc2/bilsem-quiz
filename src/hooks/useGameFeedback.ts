import { useState, useCallback, useRef } from 'react';
import { useSound } from './useSound';

export interface FeedbackState {
    correct: boolean;
    message: string;
}

interface UseGameFeedbackOptions {
    /** Feedback süresi (ms). Varsayılan: 2000 */
    duration?: number;
    /** Feedback bitince çağrılır */
    onFeedbackEnd?: (correct: boolean) => void;
    /** Ses efekti çalsın mı? Varsayılan: true */
    enableSound?: boolean;
}

/**
 * BrainTrainer oyunları için paylaşılan feedback hook'u.
 *
 * Kullanım:
 * ```tsx
 * const { feedbackState, showFeedback, isFeedbackActive } = useGameFeedback({
 *   onFeedbackEnd: (correct) => {
 *     if (correct) { nextLevel(); } else { loseLife(); }
 *   }
 * });
 *
 * // Cevap verilince:
 * showFeedback(true, 'Harikasın! ⭐');
 *
 * // Render:
 * <GameFeedbackBanner feedback={feedbackState} />
 * ```
 */
export const useGameFeedback = (options: UseGameFeedbackOptions = {}) => {
    const {
        duration = 2000,
        onFeedbackEnd,
        enableSound = true,
    } = options;

    const [feedbackState, setFeedbackState] = useState<FeedbackState | null>(null);
    const { playSound } = useSound();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(onFeedbackEnd);
    callbackRef.current = onFeedbackEnd;

    const showFeedback = useCallback((correct: boolean, message?: string) => {
        // Önceki timer varsa iptal et
        if (timerRef.current) clearTimeout(timerRef.current);

        const defaultMessage = correct
            ? ['Doğru cevap!', 'Tam isabet!', 'Harika!'][Math.floor(Math.random() * 3)]
            : ['Yanlış cevap!', 'Tekrar dene!', 'Olmadı!'][Math.floor(Math.random() * 3)];

        setFeedbackState({
            correct,
            message: message ?? defaultMessage,
        });

        // Ses efekti
        if (enableSound) {
            playSound(correct ? 'correct' : 'incorrect');
        }

        // Otomatik kapanma
        timerRef.current = setTimeout(() => {
            setFeedbackState(null);
            timerRef.current = null;
            callbackRef.current?.(correct);
        }, duration);
    }, [duration, enableSound, playSound]);

    const dismissFeedback = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        const wasCorrect = feedbackState?.correct ?? false;
        setFeedbackState(null);
        callbackRef.current?.(wasCorrect);
    }, [feedbackState]);

    return {
        /** Aktif feedback state'i (null = feedback yok) */
        feedbackState,
        /** Feedback göster */
        showFeedback,
        /** Feedback'i erken kapat */
        dismissFeedback,
        /** Feedback aktif mi? (grid disable etmek için) */
        isFeedbackActive: feedbackState !== null,
    };
};

export default useGameFeedback;
