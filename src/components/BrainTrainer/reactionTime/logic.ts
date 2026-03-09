import { REACTION_COLORS, TARGET_COLOR } from "./constants.ts";
import type {
  GameMode,
  ReactionColorOption,
  ReactionMetrics,
  RoundState,
} from "./types.ts";

export const createEmptyReactionMetrics = (): ReactionMetrics => ({
  reactionTimes: [],
  averageReaction: 0,
  bestReaction: 0,
});

export const addReactionTime = (
  metrics: ReactionMetrics,
  reactionTime: number,
): ReactionMetrics => {
  const normalizedReactionTime = Math.round(reactionTime);
  const reactionTimes = [...metrics.reactionTimes, normalizedReactionTime];
  const total = reactionTimes.reduce((sum, value) => sum + value, 0);

  return {
    reactionTimes,
    averageReaction: Math.round(total / reactionTimes.length),
    bestReaction:
      metrics.bestReaction > 0
        ? Math.min(metrics.bestReaction, normalizedReactionTime)
        : normalizedReactionTime,
  };
};

export const calculateReactionScore = (
  reactionTime: number,
  streakCorrect: number,
) => {
  const timeScore = Math.max(0, 500 - Math.round(reactionTime));
  return Math.round(timeScore / 2) + 50 + streakCorrect * 10;
};

export const getSelectiveWaitTime = (level: number) =>
  Math.max(1000, 2000 - level * 50);

export const shouldWaitForTarget = (
  gameMode: GameMode,
  currentColor: string,
  targetColor: string = TARGET_COLOR,
) => gameMode === "selective" && currentColor !== targetColor;

export const getRoundColor = (
  gameMode: GameMode,
  randomValue: number = Math.random(),
  colors: ReactionColorOption[] = REACTION_COLORS,
) => {
  if (gameMode !== "selective") {
    return TARGET_COLOR;
  }

  const index = Math.floor(randomValue * colors.length);
  return colors[index]?.value ?? TARGET_COLOR;
};

export const getReactionButtonClass = ({
  roundState,
  currentColor,
  gameMode,
  currentReactionTime,
  targetColor = TARGET_COLOR,
}: {
  roundState: RoundState;
  currentColor: string;
  gameMode: GameMode;
  currentReactionTime: number | null;
  targetColor?: string;
}) => {
  if (roundState === "waiting") {
    return "bg-slate-200 dark:bg-slate-700";
  }

  if (roundState === "ready") {
    return "bg-cyber-yellow";
  }

  if (roundState === "go") {
    const selectedColor = REACTION_COLORS.find(
      (color) => color.value === currentColor,
    );
    return selectedColor?.className ?? "bg-cyber-green";
  }

  if (roundState === "early") {
    return "bg-cyber-pink";
  }

  if (roundState === "result") {
    if (currentReactionTime === null) {
      return "bg-cyber-green";
    }

    if (gameMode === "selective" && currentColor !== targetColor) {
      return "bg-cyber-pink";
    }

    return "bg-cyber-green";
  }

  return "bg-slate-200 dark:bg-slate-700";
};

export const getBackNavigation = (examMode: boolean, isArcadeMode: boolean) => {
  if (examMode) {
    return {
      backLink: "/atolyeler/sinav-simulasyonu/devam",
      backLabel: "Sınavı Bitir",
    };
  }

  if (isArcadeMode) {
    return {
      backLink: "/bilsem-zeka",
      backLabel: "Arcade",
    };
  }

  return {
    backLink: "/individual-assessment/attention-memory",
    backLabel: "Geri Dön",
  };
};
