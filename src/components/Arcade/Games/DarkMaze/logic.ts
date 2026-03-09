import type {
    Cell,
    GridPosition,
    MoveDirection,
    Point2D
} from './types.ts';

export interface MoveResolution {
    position: GridPosition;
    moved: boolean;
    collectedBattery: boolean;
    collectedLogo: boolean;
    reachedExit: boolean;
}

const DIRECTION_DELTAS: Record<MoveDirection, GridPosition> = {
    up: { r: -1, c: 0 },
    down: { r: 1, c: 0 },
    left: { r: 0, c: -1 },
    right: { r: 0, c: 1 }
};

const DIRECTION_WALL_INDEX: Record<MoveDirection, number> = {
    up: 0,
    right: 1,
    down: 2,
    left: 3
};

export const calculateCanvasSize = (
    viewportWidth: number,
    gridSize: number,
    cellSize: number,
    gutter: number = 48,
    maxWidth: number = 600
): number => {
    const idealSize = gridSize * cellSize;
    const availableWidth = Math.min(maxWidth, viewportWidth - gutter);

    return Math.min(idealSize, availableWidth);
};

export const resolveMoveOutcome = (
    maze: Cell[][],
    playerPos: GridPosition,
    direction: MoveDirection,
    gridSize: number
): MoveResolution => {
    const currentCell = maze[playerPos.r]?.[playerPos.c];

    if (!currentCell) {
        return {
            position: playerPos,
            moved: false,
            collectedBattery: false,
            collectedLogo: false,
            reachedExit: false
        };
    }

    const delta = DIRECTION_DELTAS[direction];
    const nextPosition = {
        r: playerPos.r + delta.r,
        c: playerPos.c + delta.c
    };

    if (
        nextPosition.r < 0 ||
        nextPosition.r >= gridSize ||
        nextPosition.c < 0 ||
        nextPosition.c >= gridSize ||
        currentCell.walls[DIRECTION_WALL_INDEX[direction]]
    ) {
        return {
            position: playerPos,
            moved: false,
            collectedBattery: false,
            collectedLogo: false,
            reachedExit: false
        };
    }

    const nextCell = maze[nextPosition.r]?.[nextPosition.c];

    if (!nextCell) {
        return {
            position: playerPos,
            moved: false,
            collectedBattery: false,
            collectedLogo: false,
            reachedExit: false
        };
    }

    return {
        position: nextPosition,
        moved: true,
        collectedBattery: nextCell.hasBattery,
        collectedLogo: nextCell.hasLogo,
        reachedExit: nextPosition.r === gridSize - 1 && nextPosition.c === gridSize - 1
    };
};

export const clearCollectedItems = (
    maze: Cell[][],
    position: GridPosition,
    collectedBattery: boolean,
    collectedLogo: boolean
): Cell[][] => {
    if (!collectedBattery && !collectedLogo) {
        return maze;
    }

    return maze.map((row, rowIndex) =>
        rowIndex === position.r
            ? row.map((cell, columnIndex) =>
                columnIndex === position.c
                    ? {
                        ...cell,
                        hasBattery: collectedBattery ? false : cell.hasBattery,
                        hasLogo: collectedLogo ? false : cell.hasLogo
                    }
                    : cell
            )
            : row
    );
};

export const clampJoystickPosition = (
    dx: number,
    dy: number,
    radius: number
): Point2D => {
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= radius) {
        return { x: dx, y: dy };
    }

    return {
        x: (dx / distance) * radius,
        y: (dy / distance) * radius
    };
};

export const getActiveDirection = (
    joystickPos: Point2D,
    threshold: number
): MoveDirection | null => {
    const distance = Math.sqrt(
        joystickPos.x * joystickPos.x + joystickPos.y * joystickPos.y
    );

    if (distance < threshold) {
        return null;
    }

    if (Math.abs(joystickPos.x) > Math.abs(joystickPos.y)) {
        return joystickPos.x > 0 ? 'right' : 'left';
    }

    return joystickPos.y > 0 ? 'down' : 'up';
};

export const getSwipeDirection = (
    start: Point2D,
    end: Point2D,
    threshold: number
): MoveDirection | null => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > threshold) {
            return 'right';
        }

        if (dx < -threshold) {
            return 'left';
        }

        return null;
    }

    if (dy > threshold) {
        return 'down';
    }

    if (dy < -threshold) {
        return 'up';
    }

    return null;
};
