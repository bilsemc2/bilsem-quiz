import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    JOYSTICK_MOVE_COOLDOWN_MS,
    JOYSTICK_MOVE_THRESHOLD,
    JOYSTICK_RADIUS
} from '../constants';
import {
    clampJoystickPosition,
    getActiveDirection
} from '../logic';

interface UseVirtualJoystickConfig {
    enabled: boolean;
    onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const useVirtualJoystick = ({
    enabled,
    onMove
}: UseVirtualJoystickConfig) => {
    const joystickRef = useRef<HTMLDivElement>(null);
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMoveRef = useRef(0);

    const handleJoystickStart = useCallback(() => {
        if (!enabled || !joystickRef.current) {
            return;
        }

        setIsDragging(true);
    }, [enabled]);

    const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
        if (!enabled || !joystickRef.current || !isDragging) {
            return;
        }

        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const nextJoystickPos = clampJoystickPosition(
            clientX - centerX,
            clientY - centerY,
            JOYSTICK_RADIUS
        );

        setJoystickPos(nextJoystickPos);

        const direction = getActiveDirection(nextJoystickPos, JOYSTICK_MOVE_THRESHOLD);
        const now = Date.now();

        if (direction && now - lastMoveRef.current > JOYSTICK_MOVE_COOLDOWN_MS) {
            lastMoveRef.current = now;
            onMove(direction);
        }
    }, [enabled, isDragging, onMove]);

    const handleJoystickEnd = useCallback(() => {
        setIsDragging(false);
        setJoystickPos({ x: 0, y: 0 });
    }, []);

    useEffect(() => {
        if (!enabled) {
            handleJoystickEnd();
        }
    }, [enabled, handleJoystickEnd]);

    const activeDirection = useMemo(() => {
        return getActiveDirection(joystickPos, JOYSTICK_MOVE_THRESHOLD);
    }, [joystickPos]);

    return {
        joystickRef,
        joystickPos,
        isDragging,
        activeDirection,
        handleJoystickStart,
        handleJoystickMove,
        handleJoystickEnd
    };
};
