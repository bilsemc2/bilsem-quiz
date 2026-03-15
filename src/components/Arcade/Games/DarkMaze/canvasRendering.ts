import { createCanvasElement } from "@/utils/createCanvasElement";
import type { Cell, GridPosition } from './types';

interface DrawMazeSceneOptions {
    canvas: HTMLCanvasElement;
    maze: Cell[][];
    playerPos: GridPosition;
    isIlluminated: boolean;
    energy: number;
    gridSize: number;
    canvasSize: number;
}

export const getScaledCellSize = (canvasSize: number, gridSize: number): number => {
    return canvasSize / gridSize;
};

export const drawMazeScene = ({
    canvas,
    maze,
    playerPos,
    isIlluminated,
    energy,
    gridSize,
    canvasSize
}: DrawMazeSceneOptions) => {
    const context = canvas.getContext('2d');

    if (!context) {
        return;
    }

    const scaledCellSize = getScaledCellSize(canvasSize, gridSize);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#475569';
    context.lineWidth = 2 * (scaledCellSize / 40);

    for (let row = 0; row < gridSize; row += 1) {
        for (let column = 0; column < gridSize; column += 1) {
            const cell = maze[row]?.[column];

            if (!cell) {
                continue;
            }

            const x = column * scaledCellSize;
            const y = row * scaledCellSize;

            if (cell.walls[0]) {
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x + scaledCellSize, y);
                context.stroke();
            }

            if (cell.walls[1]) {
                context.beginPath();
                context.moveTo(x + scaledCellSize, y);
                context.lineTo(x + scaledCellSize, y + scaledCellSize);
                context.stroke();
            }

            if (cell.walls[2]) {
                context.beginPath();
                context.moveTo(x + scaledCellSize, y + scaledCellSize);
                context.lineTo(x, y + scaledCellSize);
                context.stroke();
            }

            if (cell.walls[3]) {
                context.beginPath();
                context.moveTo(x, y + scaledCellSize);
                context.lineTo(x, y);
                context.stroke();
            }

            if (cell.hasBattery) {
                context.fillStyle = '#10b981';
                context.beginPath();
                context.arc(
                    x + scaledCellSize / 2,
                    y + scaledCellSize / 2,
                    scaledCellSize * 0.1,
                    0,
                    Math.PI * 2
                );
                context.fill();
            }

            if (cell.hasLogo) {
                context.fillStyle = '#f59e0b';
                context.beginPath();
                context.arc(
                    x + scaledCellSize / 2,
                    y + scaledCellSize / 2,
                    scaledCellSize * 0.15,
                    0,
                    Math.PI * 2
                );
                context.fill();
            }
        }
    }

    const playerX = playerPos.c * scaledCellSize + scaledCellSize / 2;
    const playerY = playerPos.r * scaledCellSize + scaledCellSize / 2;
    context.fillStyle = '#f43f5e';
    context.beginPath();
    context.arc(playerX, playerY, scaledCellSize * 0.25, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#6366f1';
    context.fillRect(
        (gridSize - 1) * scaledCellSize + scaledCellSize * 0.125,
        (gridSize - 1) * scaledCellSize + scaledCellSize * 0.125,
        scaledCellSize * 0.75,
        scaledCellSize * 0.75
    );

    if (isIlluminated) {
        return;
    }

    const innerRadius = scaledCellSize * 0.25;
    const outerRadius = (energy > 0 ? 80 : 20) * (scaledCellSize / 40);
    const gradient = context.createRadialGradient(
        playerX,
        playerY,
        innerRadius,
        playerX,
        playerY,
        outerRadius
    );

    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    const darknessLayer = createCanvasElement({
        width: canvas.width,
        height: canvas.height,
    });
    const darknessContext = darknessLayer.getContext('2d');

    if (!darknessContext) {
        return;
    }

    darknessContext.fillStyle = 'rgba(0, 0, 0, 0.95)';
    darknessContext.fillRect(0, 0, canvas.width, canvas.height);
    darknessContext.globalCompositeOperation = 'destination-out';
    darknessContext.fillStyle = gradient;
    darknessContext.fillRect(0, 0, canvas.width, canvas.height);

    context.drawImage(darknessLayer, 0, 0);
};
