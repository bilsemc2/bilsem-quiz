
import { FoldDirection, Punch } from "./types";

type FoldBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const INITIAL_BOUNDS: FoldBounds = {
  minX: 0,
  maxX: 1,
  minY: 0,
  maxY: 1,
};

const getNextBounds = (bounds: FoldBounds, fold: FoldDirection): FoldBounds => {
  const midX = (bounds.minX + bounds.maxX) / 2;
  const midY = (bounds.minY + bounds.maxY) / 2;

  switch (fold) {
    case FoldDirection.LEFT:
      return { ...bounds, maxX: midX };
    case FoldDirection.RIGHT:
      return { ...bounds, minX: midX };
    case FoldDirection.UP:
      return { ...bounds, maxY: midY };
    case FoldDirection.DOWN:
      return { ...bounds, minY: midY };
    default:
      return bounds;
  }
};

const getExpandedBounds = (bounds: FoldBounds, fold: FoldDirection): FoldBounds => {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  switch (fold) {
    case FoldDirection.LEFT:
      return { ...bounds, maxX: bounds.minX + width * 2 };
    case FoldDirection.RIGHT:
      return { ...bounds, minX: bounds.maxX - width * 2 };
    case FoldDirection.UP:
      return { ...bounds, maxY: bounds.minY + height * 2 };
    case FoldDirection.DOWN:
      return { ...bounds, minY: bounds.maxY - height * 2 };
    default:
      return bounds;
  }
};

/**
 * Calculates all resulting hole positions on a 1x1 flat paper
 * based on the folds applied and the original punch coordinates.
 * Punches are expected to be in absolute coordinates (0-1 of the full sheet).
 */
export const calculateUnfoldedPunches = (folds: FoldDirection[], punches: Punch[]): Punch[] => {
  let results: Punch[] = [...punches];

  // Calculate bounds of the currently folded visible piece.
  let currentBounds: FoldBounds = { ...INITIAL_BOUNDS };
  folds.forEach((fold) => {
    currentBounds = getNextBounds(currentBounds, fold);
  });

  // We process folds in reverse to "unfold"
  // Each step mirrors points across the active fold edge.
  for (let i = folds.length - 1; i >= 0; i--) {
    const fold = folds[i];
    const nextResults: Punch[] = [];

    for (const punch of results) {
      nextResults.push(punch);

      const mirroredPunch = { ...punch };

      if (fold === FoldDirection.LEFT || fold === FoldDirection.RIGHT) {
        const axisX = fold === FoldDirection.LEFT ? currentBounds.maxX : currentBounds.minX;
        mirroredPunch.x = 2 * axisX - punch.x;
      } else {
        const axisY = fold === FoldDirection.UP ? currentBounds.maxY : currentBounds.minY;
        mirroredPunch.y = 2 * axisY - punch.y;
      }

      nextResults.push(mirroredPunch);
    }

    results = nextResults;
    currentBounds = getExpandedBounds(currentBounds, fold);
  }

  return results;
};

export const getFoldedDimensions = (folds: FoldDirection[]) => {
  let bounds: FoldBounds = { ...INITIAL_BOUNDS };
  folds.forEach((fold) => {
    bounds = getNextBounds(bounds, fold);
  });

  return {
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    offsetX: bounds.minX,
    offsetY: bounds.minY,
  };
};
