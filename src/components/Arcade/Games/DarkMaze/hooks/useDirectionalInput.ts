import { useCallback, useEffect, useRef } from 'react';

import { SWIPE_THRESHOLD } from '../constants';
import { getSwipeDirection } from '../logic';
import type { MoveDirection, Point2D } from '../types';

export const useDirectionalInput = (
    onMove: (direction: MoveDirection) => void
) => {
    const touchStartRef = useRef<Point2D | null>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const keyToDirection: Partial<Record<string, MoveDirection>> = {
                ArrowUp: 'up',
                ArrowDown: 'down',
                ArrowLeft: 'left',
                ArrowRight: 'right'
            };
            const direction = keyToDirection[event.key];

            if (!direction) {
                return;
            }

            event.preventDefault();
            onMove(direction);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onMove]);

    const handleTouchStart = useCallback((point: Point2D) => {
        touchStartRef.current = point;
    }, []);

    const handleTouchEnd = useCallback((point: Point2D) => {
        if (!touchStartRef.current) {
            return;
        }

        const direction = getSwipeDirection(touchStartRef.current, point, SWIPE_THRESHOLD);

        if (direction) {
            onMove(direction);
        }

        touchStartRef.current = null;
    }, [onMove]);

    return {
        handleTouchStart,
        handleTouchEnd
    };
};
