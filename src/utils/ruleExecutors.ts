// Matrix Puzzle System - Rule Executors
// Re-export barrel — preserves all original exports from split modules.

export {
    applyRotation,
    applyMirror,
    applyColorCycle,
    applyColorSwap,
    applyScale,
    applyGridRowShift,
    applyGridColShift,
    applyGridCellToggle,
    applyGridCellInvert,
    applyGridShiftAlternating,
    applyGridEdgeDelete,
    applyGridDiagonalShift,
    applyGridXOR,
    applyBarsShift,
    applyGridRotate,
} from './ruleTransformations.ts';

export {
    applySingleTransformation,
    applyRule,
} from './ruleApplication.ts';

export {
    generateBarsShape,
    generateVerticalBarsShape,
    generateRandomShape,
    generateMatrix,
    areShapesVisuallyEqual,
    generateWrongOption,
} from './matrixGeneration.ts';
