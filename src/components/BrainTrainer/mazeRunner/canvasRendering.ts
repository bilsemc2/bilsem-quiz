import { GAME_COLORS } from "../shared/gameColors";
import { PLAYER_RADIUS } from "./constants";
import type { MazeLevelData, PathPoint, WallSeedSide } from "./types";

export const drawWobblyLine = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: WallSeedSide,
) => {
  context.beginPath();
  context.moveTo(x1, y1);

  const midX = (x1 + x2) / 2 + (y2 - y1) * 0.1 + seed.midOffset;
  const midY = (y1 + y2) / 2 + (x2 - x1) * 0.1 + seed.midOffset;

  context.quadraticCurveTo(midX, midY, x2, y2);
  context.lineWidth = seed.thick;
  context.stroke();
};

export const drawMazeToContext = (
  context: CanvasRenderingContext2D,
  mazeLevel: MazeLevelData,
  size: number,
  collisionMask: boolean,
) => {
  const { maze, cols, rows, wallSeeds } = mazeLevel;
  const cellSize = size / Math.max(cols, rows);

  if (collisionMask) {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, size, size);
    context.strokeStyle = "#FFFFFF";
  } else {
    context.clearRect(0, 0, size, size);
    context.strokeStyle = GAME_COLORS.purple;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowBlur = 5;
    context.shadowColor = GAME_COLORS.purple;
  }

  maze.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      const x = cell.x * cellSize;
      const y = cell.y * cellSize;
      const seed = wallSeeds[rowIndex * cols + columnIndex];

      if (!seed) {
        return;
      }

      if (cell.walls.top) drawWobblyLine(context, x - 2, y, x + cellSize + 2, y, seed.top);
      if (cell.walls.right) drawWobblyLine(context, x + cellSize, y - 2, x + cellSize, y + cellSize + 2, seed.right);
      if (cell.walls.bottom) drawWobblyLine(context, x + cellSize + 2, y + cellSize, x - 2, y + cellSize, seed.bottom);
      if (cell.walls.left) drawWobblyLine(context, x, y + cellSize + 2, x, y - 2, seed.left);
    });
  });

  return cellSize;
};

const drawBlob = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  color: string,
) => {
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 15;
  context.beginPath();
  context.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.3, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
};

export const drawMazeScene = (
  context: CanvasRenderingContext2D,
  mazeLevel: MazeLevelData,
  size: number,
  path: PathPoint[],
  lives: number,
) => {
  const cellSize = drawMazeToContext(context, mazeLevel, size, false);

  drawBlob(context, 0, 0, cellSize, GAME_COLORS.emerald);
  drawBlob(
    context,
    (mazeLevel.cols - 1) * cellSize,
    (mazeLevel.rows - 1) * cellSize,
    cellSize,
    GAME_COLORS.pink,
  );

  if (path.length === 0) {
    return cellSize;
  }

  context.beginPath();
  context.strokeStyle = lives > 1 ? GAME_COLORS.purple : GAME_COLORS.incorrect;
  context.lineWidth = 4;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = context.strokeStyle;
  context.shadowBlur = 10;

  if (path.length > 1) {
    context.moveTo(path[0].x, path[0].y);

    for (let index = 1; index < path.length - 2; index += 1) {
      const controlX = (path[index].x + path[index + 1].x) / 2;
      const controlY = (path[index].y + path[index + 1].y) / 2;
      context.quadraticCurveTo(path[index].x, path[index].y, controlX, controlY);
    }

    if (path.length > 2) {
      context.quadraticCurveTo(
        path[path.length - 2].x,
        path[path.length - 2].y,
        path[path.length - 1].x,
        path[path.length - 1].y,
      );
    } else {
      context.lineTo(path[1].x, path[1].y);
    }
  }

  context.stroke();
  context.shadowBlur = 0;
  const head = path[path.length - 1];
  context.beginPath();
  context.fillStyle = "#ffffff";
  context.arc(head.x, head.y, PLAYER_RADIUS, 0, Math.PI * 2);
  context.fill();

  return cellSize;
};

export const buildCollisionMask = (
  canvas: HTMLCanvasElement,
  mazeLevel: MazeLevelData,
  size: number,
) => {
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return;
  }

  drawMazeToContext(context, mazeLevel, size, true);
};

export const hasCollision = (
  canvas: HTMLCanvasElement | null,
  x: number,
  y: number,
  radius: number = PLAYER_RADIUS - 1,
) => {
  if (!canvas) {
    return false;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return false;
  }

  const points = [
    { x, y },
    { x: x + radius, y },
    { x: x - radius, y },
    { x, y: y + radius },
    { x, y: y - radius },
  ];

  try {
    return points.some((point) => {
      if (point.x < 0 || point.y < 0 || point.x >= canvas.width || point.y >= canvas.height) {
        return true;
      }

      const pixel = context.getImageData(point.x, point.y, 1, 1).data;
      return pixel[0] > 100;
    });
  } catch {
    return false;
  }
};
