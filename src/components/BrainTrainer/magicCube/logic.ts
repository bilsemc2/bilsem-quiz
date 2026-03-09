import {
  COLOR_PALETTE,
  FACE_NAMES,
  ICON_PALETTE,
  NET_LAYOUTS,
  OPTION_ROTATIONS,
  PREVIEW_CUBE_SIZE,
} from "./constants.ts";
import type {
  CubeNet,
  FaceContent,
  FaceName,
  FacePose,
  GameOption,
  IconPaletteItem,
  MagicCubeLevelData,
  NetFacePlacement,
  PaletteColor,
} from "./types.ts";

export const getMagicCubeScore = (level: number) => 20 * level;

export const shuffleItems = <T,>(
  items: readonly T[],
  random: () => number = Math.random,
) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const pickRandomNet = (
  random: () => number = Math.random,
  layouts: readonly CubeNet[] = NET_LAYOUTS,
) => {
  return layouts[Math.floor(random() * layouts.length)] ?? layouts[0];
};

export const createFacesData = (
  random: () => number = Math.random,
  colors: readonly PaletteColor[] = COLOR_PALETTE,
  icons: readonly IconPaletteItem[] = ICON_PALETTE,
) => {
  const shuffledColors = shuffleItems(colors, random);
  const shuffledIcons = shuffleItems(icons, random);

  return FACE_NAMES.reduce<Record<FaceName, FaceContent>>((accumulator, face, index) => {
    accumulator[face] = {
      color: shuffledColors[index % shuffledColors.length].hex,
      icon: shuffledIcons[index % shuffledIcons.length].icon,
      name: shuffledIcons[index % shuffledIcons.length].name,
    };
    return accumulator;
  }, {} as Record<FaceName, FaceContent>);
};

export const createOptions = (random: () => number = Math.random): GameOption[] =>
  shuffleItems(OPTION_ROTATIONS, random).map((option) => ({
    id: option.id,
    isCorrect: option.isCorrect,
    rotation: option.rotation,
  }));

export const createMagicCubeLevel = (
  random: () => number = Math.random,
): MagicCubeLevelData => ({
  net: pickRandomNet(random),
  facesData: createFacesData(random),
  options: createOptions(random),
});

export const findFacePlacement = (
  grid: CubeNet["grid"],
  faceName: FaceName,
): NetFacePlacement | null => {
  let facePosition: { row: number; col: number } | null = null;
  let frontPosition: { row: number; col: number } | null = null;

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
    const row = grid[rowIndex];

    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const face = row[colIndex];

      if (face === faceName) {
        facePosition = { row: rowIndex, col: colIndex };
      }
      if (face === "FRONT") {
        frontPosition = { row: rowIndex, col: colIndex };
      }
    }
  }

  if (!facePosition || !frontPosition) {
    return null;
  }

  const resolvedFacePosition = facePosition;
  const resolvedFrontPosition = frontPosition;

  return {
    row: resolvedFacePosition.row,
    col: resolvedFacePosition.col,
    relativeRow: resolvedFacePosition.row - resolvedFrontPosition.row,
    relativeCol: resolvedFacePosition.col - resolvedFrontPosition.col,
  };
};

export const createFacePoseMap = (size = PREVIEW_CUBE_SIZE): Record<FaceName, FacePose> => ({
  FRONT: { rx: 0, ry: 0, rz: 0, tx: 0, ty: 0, tz: size / 2 },
  BACK: { rx: 0, ry: 180, rz: 0, tx: 0, ty: 0, tz: -size / 2 },
  LEFT: { rx: 0, ry: -90, rz: 0, tx: -size / 2, ty: 0, tz: 0 },
  RIGHT: { rx: 0, ry: 90, rz: 0, tx: size / 2, ty: 0, tz: 0 },
  TOP: { rx: 90, ry: 0, rz: 0, tx: 0, ty: -size / 2, tz: 0 },
  BOTTOM: { rx: -90, ry: 0, rz: 0, tx: 0, ty: size / 2, tz: 0 },
});
