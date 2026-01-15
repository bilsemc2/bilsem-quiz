
import { FoldDirection, Punch } from "./types";

/**
 * Calculates all resulting hole positions on a 1x1 flat paper
 * based on the folds applied and the original punch coordinates.
 * Punches are expected to be in absolute coordinates (0-1 of the full sheet).
 */
export const calculateUnfoldedPunches = (folds: FoldDirection[], punches: Punch[]): Punch[] => {
  let results: Punch[] = [...punches];
  
  // Start with the dimensions of the final folded piece
  let currentWidth = 1;
  let currentHeight = 1;
  folds.forEach(f => {
    if (f === FoldDirection.VERTICAL) currentWidth /= 2;
    if (f === FoldDirection.HORIZONTAL) currentHeight /= 2;
  });

  // We process folds in reverse to "unfold"
  // Each step, we mirror across the boundary of the current piece
  for (let i = folds.length - 1; i >= 0; i--) {
    const fold = folds[i];
    const nextResults: Punch[] = [];
    
    // The axis to mirror across is the current boundary of the paper
    const mirrorAxis = (fold === FoldDirection.VERTICAL) ? currentWidth : currentHeight;

    for (const punch of results) {
      // Fix: Pushing the original punch object directly instead of an invalid functional call.
      nextResults.push(punch); // Keep original
      
      const mirroredPunch = { ...punch };
      if (fold === FoldDirection.VERTICAL) {
        // Mirror X: newX = mirrorAxis + (mirrorAxis - oldX) = 2 * mirrorAxis - oldX
        mirroredPunch.x = 2 * mirrorAxis - punch.x;
      } else {
        // Mirror Y: newY = mirrorAxis + (mirrorAxis - oldY) = 2 * mirrorAxis - oldY
        mirroredPunch.y = 2 * mirrorAxis - punch.y;
      }
      nextResults.push(mirroredPunch);
    }

    // Expand the current bounds for the next unfolding step
    if (fold === FoldDirection.VERTICAL) currentWidth *= 2;
    else currentHeight *= 2;

    results = nextResults;
  }

  return results;
};

export const getFoldedDimensions = (folds: FoldDirection[]) => {
  let width = 1;
  let height = 1;
  folds.forEach(f => {
    if (f === FoldDirection.VERTICAL) width /= 2;
    if (f === FoldDirection.HORIZONTAL) height /= 2;
  });
  return { width, height };
};
