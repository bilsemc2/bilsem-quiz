import { useEffect, useState } from 'react';

import { CELL_SIZE, INITIAL_GRID_SIZE } from '../constants';
import { calculateCanvasSize } from '../logic';

export const useResponsiveCanvasSize = (gridSize: number) => {
    const [canvasSize, setCanvasSize] = useState(() =>
        typeof window === 'undefined'
            ? INITIAL_GRID_SIZE * CELL_SIZE
            : calculateCanvasSize(window.innerWidth, INITIAL_GRID_SIZE, CELL_SIZE)
    );

    useEffect(() => {
        const updateCanvasSize = () => {
            setCanvasSize(calculateCanvasSize(window.innerWidth, gridSize, CELL_SIZE));
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [gridSize]);

    return canvasSize;
};
