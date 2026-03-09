import { useCallback, useRef, useState } from 'react';
import {
    applyGameAttempt,
    createEmptyGamePerformance,
    type GameAttemptInput,
    type GamePerformanceState
} from '../shared/game/performance';

export const useGamePerformanceTracker = (
    initialState: GamePerformanceState = createEmptyGamePerformance()
) => {
    const [performance, setPerformance] = useState<GamePerformanceState>(initialState);
    const performanceRef = useRef<GamePerformanceState>(initialState);

    const resetPerformance = useCallback(() => {
        const next = createEmptyGamePerformance();
        performanceRef.current = next;
        setPerformance(next);
        return next;
    }, []);

    const recordAttempt = useCallback((attempt: GameAttemptInput) => {
        const next = applyGameAttempt(performanceRef.current, attempt);
        performanceRef.current = next;
        setPerformance(next);
        return next;
    }, []);

    return {
        performance,
        performanceRef,
        recordAttempt,
        resetPerformance
    };
};
