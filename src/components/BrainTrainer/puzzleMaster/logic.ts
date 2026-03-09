import {
  DEFAULT_SELECTION,
  PUZZLE_SIZE,
  SELECTION_SIZE,
  TARGET_HIT_MARGIN,
  TARGET_PADDING,
} from "./constants.ts";
import type {
  PointerSelectionInput,
  SelectionPosition,
  TargetBox,
} from "./types.ts";

export const createDefaultSelection = (): SelectionPosition => ({
  x: DEFAULT_SELECTION.x,
  y: DEFAULT_SELECTION.y,
});

export const calculatePuzzleMasterScore = (level: number) => 50 * level;

export const isSelectionCorrect = (
  selection: SelectionPosition,
  targetBox: TargetBox,
  margin = TARGET_HIT_MARGIN,
) => {
  return (
    Math.abs(selection.x - targetBox.x) < margin &&
    Math.abs(selection.y - targetBox.y) < margin
  );
};

export const clampSelectionCoordinate = (value: number) => {
  return Math.max(0, Math.min(value, PUZZLE_SIZE - SELECTION_SIZE));
};

export const getSelectionFromPointer = ({
  clientX,
  clientY,
  rectLeft,
  rectTop,
  rectWidth,
  rectHeight,
}: PointerSelectionInput): SelectionPosition => {
  const scaleX = PUZZLE_SIZE / rectWidth;
  const scaleY = PUZZLE_SIZE / rectHeight;
  const halfSelection = SELECTION_SIZE / 2;

  return {
    x: clampSelectionCoordinate((clientX - rectLeft) * scaleX - halfSelection),
    y: clampSelectionCoordinate((clientY - rectTop) * scaleY - halfSelection),
  };
};

export const getRandomTargetBox = (
  random = Math.random,
): TargetBox => {
  const maxStart = PUZZLE_SIZE - TARGET_PADDING * 2 - SELECTION_SIZE;

  return {
    x: TARGET_PADDING + Math.floor(random() * maxStart),
    y: TARGET_PADDING + Math.floor(random() * maxStart),
    width: SELECTION_SIZE,
    height: SELECTION_SIZE,
  };
};
