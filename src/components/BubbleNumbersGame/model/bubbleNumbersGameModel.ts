import type { PowerUpType } from '../powerups/types';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const BUBBLE_MIN_SIZE = 40;
export const BUBBLE_MAX_SIZE = 80;
export const INITIAL_TIME = 60;
export const LEVEL_UP_DELAY_MS = 3000;
export const HINT_DURATION_MS = 3000;
export const EXTRA_TIME_SECONDS = 10;
export const WRONG_ANSWER_SCORE_PENALTY = 5;
export const WRONG_ANSWER_TIME_PENALTY = 2;

export type BubbleOperation = '+' | '-' | '*';
export type BubbleRandom = () => number;

export interface LevelSettings {
  bubbleCount: number;
  bubbleSpeed: number;
  operations: BubbleOperation[];
  maxNumber: number;
  timeBonus: number;
}

export interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
  operation: string;
  result: number;
  popping?: boolean;
  popProgress?: number;
  highlighted?: boolean;
}

export interface BubbleLevelState {
  bubbles: Bubble[];
  targetNumber: number;
  settings: LevelSettings;
}

export const LEVEL_SETTINGS: Record<number, LevelSettings> = {
  1: {
    bubbleCount: 8,
    bubbleSpeed: 40,
    operations: ['+'],
    maxNumber: 10,
    timeBonus: 10
  },
  2: {
    bubbleCount: 10,
    bubbleSpeed: 50,
    operations: ['+', '-'],
    maxNumber: 15,
    timeBonus: 12
  },
  3: {
    bubbleCount: 12,
    bubbleSpeed: 60,
    operations: ['+', '-', '*'],
    maxNumber: 20,
    timeBonus: 15
  },
  4: {
    bubbleCount: 14,
    bubbleSpeed: 70,
    operations: ['+', '-', '*'],
    maxNumber: 25,
    timeBonus: 18
  },
  5: {
    bubbleCount: 16,
    bubbleSpeed: 80,
    operations: ['+', '-', '*'],
    maxNumber: 30,
    timeBonus: 20
  }
};

export const getDefaultLevelSettings = (level: number): LevelSettings => ({
  bubbleCount: 8 + (level - 1) * 2,
  bubbleSpeed: 40 + (level - 1) * 10,
  operations: level >= 3 ? ['+', '-', '*'] : ['+', '-'],
  maxNumber: 10 + (level - 1) * 5,
  timeBonus: 10 + (level - 1) * 2
});

export const getLevelSettings = (level: number): LevelSettings => {
  return LEVEL_SETTINGS[level] || getDefaultLevelSettings(level);
};

export const randomBetween = (
  min: number,
  max: number,
  random: BubbleRandom = Math.random
): number => {
  return random() * (max - min) + min;
};

const pickOperation = (
  operations: BubbleOperation[],
  random: BubbleRandom
): BubbleOperation => {
  return operations[Math.floor(random() * operations.length)] || operations[0];
};

export const generateOperation = (
  level: number,
  random: BubbleRandom = Math.random
): { operation: string; result: number } => {
  const settings = getLevelSettings(level);
  const operation = pickOperation(settings.operations, random);
  let num1 = Math.floor(randomBetween(1, settings.maxNumber, random));
  let num2 = Math.floor(randomBetween(1, settings.maxNumber, random));

  let result = 0;
  switch (operation) {
    case '+':
      result = num1 + num2;
      break;
    case '-':
      if (num1 < num2) {
        [num1, num2] = [num2, num1];
      }
      result = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(randomBetween(1, Math.min(5, settings.maxNumber), random));
      num2 = Math.floor(randomBetween(1, Math.min(5, settings.maxNumber), random));
      result = num1 * num2;
      break;
  }

  return {
    operation: `${num1} ${operation} ${num2}`,
    result
  };
};

export const createBubble = (
  id: number,
  level: number,
  random: BubbleRandom = Math.random
): Bubble => {
  const settings = getLevelSettings(level);
  const size = randomBetween(BUBBLE_MIN_SIZE, BUBBLE_MAX_SIZE, random);
  const { operation, result } = generateOperation(level, random);

  return {
    id,
    x: randomBetween(size, GAME_WIDTH - size, random),
    y: randomBetween(size, GAME_HEIGHT - size, random),
    size,
    dx: randomBetween(-settings.bubbleSpeed, settings.bubbleSpeed, random) / 100,
    dy: randomBetween(-settings.bubbleSpeed, settings.bubbleSpeed, random) / 100,
    operation,
    result
  };
};

export const buildLevelBubbles = (
  level: number,
  random: BubbleRandom = Math.random
): Bubble[] => {
  const settings = getLevelSettings(level);
  return Array.from({ length: settings.bubbleCount }, (_, index) =>
    createBubble(index, level, random)
  );
};

export const pickTargetBubble = (
  bubbles: Bubble[],
  random: BubbleRandom = Math.random
): Bubble | null => {
  if (bubbles.length === 0) {
    return null;
  }

  return bubbles[Math.floor(random() * bubbles.length)] || bubbles[0];
};

export const pickNextTargetNumber = (
  bubbles: Bubble[],
  excludedBubbleId: number,
  random: BubbleRandom = Math.random
): number | null => {
  const remainingBubbles = bubbles.filter((bubble) => bubble.id !== excludedBubbleId && !bubble.popping);
  const targetBubble = pickTargetBubble(remainingBubbles, random);
  return targetBubble?.result ?? null;
};

export const createLevelState = (
  level: number,
  random: BubbleRandom = Math.random
): BubbleLevelState => {
  const settings = getLevelSettings(level);
  const bubbles = buildLevelBubbles(level, random);
  const targetBubble = pickTargetBubble(bubbles, random);

  return {
    bubbles,
    targetNumber: targetBubble?.result ?? 0,
    settings
  };
};

export const calculateBubblePopScore = (
  level: number,
  hasDoublePop: boolean
): number => {
  return level * 10 * (hasDoublePop ? 2 : 1);
};

export const formatBubbleGameTime = (seconds: number): string => {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
};

export const updateBubblePositions = (
  bubbles: Bubble[],
  delta: number,
  activePowerUps: readonly PowerUpType[]
): Bubble[] => {
  return bubbles.map((bubble) => {
    let nextBubble = { ...bubble };

    if (activePowerUps.includes('slowMotion')) {
      nextBubble = {
        ...nextBubble,
        dx: nextBubble.dx * 0.5,
        dy: nextBubble.dy * 0.5
      };
    }

    let nextX = nextBubble.x + nextBubble.dx * delta;
    let nextY = nextBubble.y + nextBubble.dy * delta;
    let nextDx = nextBubble.dx;
    let nextDy = nextBubble.dy;

    if (nextX <= nextBubble.size || nextX >= GAME_WIDTH - nextBubble.size) {
      nextDx = -nextDx;
      nextX = nextX <= nextBubble.size ? nextBubble.size : GAME_WIDTH - nextBubble.size;
    }

    if (nextY <= nextBubble.size || nextY >= GAME_HEIGHT - nextBubble.size) {
      nextDy = -nextDy;
      nextY = nextY <= nextBubble.size ? nextBubble.size : GAME_HEIGHT - nextBubble.size;
    }

    return {
      ...nextBubble,
      x: nextX,
      y: nextY,
      dx: nextDx,
      dy: nextDy
    };
  });
};

export const advanceBubblePopProgress = (bubbles: Bubble[]): Bubble[] => {
  return bubbles.flatMap((bubble) => {
    if (!bubble.popping) {
      return [bubble];
    }

    const nextProgress = (bubble.popProgress ?? 0) + 0.1;
    if (nextProgress >= 1) {
      return [];
    }

    return [
      {
        ...bubble,
        popProgress: nextProgress
      }
    ];
  });
};
