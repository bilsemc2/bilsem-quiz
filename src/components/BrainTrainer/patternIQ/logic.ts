import { GAME_COLORS } from "../shared/gameColors.ts";
import {
  ShapeType,
  TransformationType,
  type LayerConfig,
  type PatternData,
  type WagonState,
} from "./types.ts";

const COLORS = [
  GAME_COLORS.purple,
  GAME_COLORS.incorrect,
  GAME_COLORS.emerald,
  GAME_COLORS.yellow,
  GAME_COLORS.shapes[7],
];

const SHAPES = [
  ShapeType.LINE,
  ShapeType.CIRCLE,
  ShapeType.SQUARE,
  ShapeType.TRIANGLE,
  ShapeType.ARROW,
];

const SHAPE_SIZE_MAP: Record<ShapeType, number> = {
  [ShapeType.LINE]: 42,
  [ShapeType.CIRCLE]: 24,
  [ShapeType.SQUARE]: 24,
  [ShapeType.TRIANGLE]: 28,
  [ShapeType.ARROW]: 34,
};

const getRandomItem = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const normalizeRotation = (rotation: number) =>
  ((rotation % 360) + 360) % 360;

export const generatePattern = (level: number): PatternData => {
  const maxLayers = level <= 5 ? 1 : level <= 12 ? 2 : 3;
  const layerCount = Math.min(getRandomInt(1, maxLayers), 3);
  const difficulty =
    layerCount === 1 ? "Kolay" : layerCount === 2 ? "Orta" : "Zor";
  const layers: LayerConfig[] = [];
  const usedShapes = new Set<ShapeType>();

  for (let i = 0; i < layerCount; i++) {
    let shape = getRandomItem(SHAPES);
    while (usedShapes.has(shape) && usedShapes.size < SHAPES.length) {
      shape = getRandomItem(SHAPES);
    }
    usedShapes.add(shape);

    const transformationTypes = [
      TransformationType.ROTATION,
      TransformationType.CLOCK_MOVE,
      TransformationType.CORNER_MOVE,
    ];

    let transformation = getRandomItem(transformationTypes);
    if (
      (shape === ShapeType.LINE || shape === ShapeType.ARROW) &&
      Math.random() > 0.3
    ) {
      transformation = TransformationType.ROTATION;
    }

    let startValue = 0;
    let stepChange = 0;

    switch (transformation) {
      case TransformationType.ROTATION:
        startValue = getRandomInt(0, 11) * 30;
        stepChange = getRandomItem([30, 45, 90, -30, -45, -90]);
        break;
      case TransformationType.CLOCK_MOVE:
        startValue = getRandomInt(1, 12);
        stepChange = getRandomItem([1, 2, 3, -1, -2]);
        break;
      case TransformationType.CORNER_MOVE:
        startValue = getRandomInt(0, 3);
        stepChange = getRandomItem([1, -1]);
        break;
    }

    layers.push({
      id: `layer-${i}`,
      shape,
      color: COLORS[i % COLORS.length],
      transformation,
      startValue,
      stepChange,
      size: SHAPE_SIZE_MAP[shape],
      offset: transformation === TransformationType.ROTATION ? 0 : 30,
    });
  }

  return {
    id: Date.now().toString(),
    difficulty,
    layers,
    description: layers
      .map((layer) => `${layer.shape} (${layer.transformation})`)
      .join(" | "),
  };
};

export const calculateWagonState = (
  pattern: PatternData,
  wagonIndex: number,
): WagonState => {
  const layerStates = pattern.layers.map((layer) => {
    let rotation = 0;
    let position = 0;

    if (layer.transformation === TransformationType.ROTATION) {
      rotation = layer.startValue + layer.stepChange * wagonIndex;
    } else if (layer.transformation === TransformationType.CLOCK_MOVE) {
      const rawPosition = layer.startValue + layer.stepChange * wagonIndex;
      position = (rawPosition - 1) % 12;
      if (position < 0) {
        position += 12;
      }
      position += 1;
    } else if (layer.transformation === TransformationType.CORNER_MOVE) {
      const rawPosition = layer.startValue + layer.stepChange * wagonIndex;
      position = rawPosition % 4;
      if (position < 0) {
        position += 4;
      }
    }

    return {
      layerId: layer.id,
      rotation,
      position,
      visible: true,
    };
  });

  return { index: wagonIndex, layerStates };
};

export const areWagonStatesEqual = (
  first: WagonState,
  second: WagonState,
): boolean => {
  if (first.layerStates.length !== second.layerStates.length) {
    return false;
  }

  return first.layerStates.every((firstLayerState, index) => {
    const secondLayerState = second.layerStates[index];
    if (!secondLayerState) {
      return false;
    }

    return (
      firstLayerState.layerId === secondLayerState.layerId &&
      Math.abs(
        normalizeRotation(firstLayerState.rotation) -
          normalizeRotation(secondLayerState.rotation),
      ) < 0.1 &&
      firstLayerState.position === secondLayerState.position &&
      firstLayerState.visible === secondLayerState.visible
    );
  });
};

export const generateOptions = (
  pattern: PatternData,
  correctIndex: number,
): WagonState[] => {
  const correctState = calculateWagonState(pattern, correctIndex);
  const options: WagonState[] = [correctState];
  let attempts = 0;

  while (options.length < 4 && attempts < 50) {
    attempts += 1;
    const fakeOption: WagonState = JSON.parse(JSON.stringify(correctState));

    if (fakeOption.layerStates.length > 0) {
      const layerToModify = getRandomItem(fakeOption.layerStates);
      const config = pattern.layers.find(
        (layer) => layer.id === layerToModify.layerId,
      );

      if (config) {
        if (config.transformation === TransformationType.ROTATION) {
          layerToModify.rotation += getRandomItem([90, 180, 270, 45, -45]);
        } else if (config.transformation === TransformationType.CLOCK_MOVE) {
          let offset = getRandomItem([1, 2, 3, 4, 5, 6]);
          if (Math.random() > 0.5) {
            offset *= -1;
          }
          let newPosition = layerToModify.position + offset;
          newPosition = (newPosition - 1) % 12;
          if (newPosition < 0) {
            newPosition += 12;
          }
          layerToModify.position = newPosition + 1;
        } else if (
          config.transformation === TransformationType.CORNER_MOVE
        ) {
          layerToModify.position =
            (layerToModify.position + getRandomItem([1, 2, 3])) % 4;
        }
      }
    }

    if (!options.some((option) => areWagonStatesEqual(option, fakeOption))) {
      options.push(fakeOption);
    }
  }

  const shuffled = [...options];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

export const buildPatternIQFeedbackMessage = (
  correct: boolean,
  level: number,
  maxLevel: number,
) => {
  if (correct) {
    if (level >= maxLevel) {
      return "Doğru vagon! Son örüntüyü de çözdün, oyun tamamlanıyor.";
    }

    return `Doğru vagon! Şimdi ${level + 1}. seviyeye geçiyorsun.`;
  }

  return "Yanlış seçim! Örüntünün sonraki vagonuna tekrar bak.";
};
