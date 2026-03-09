import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  TIME_LIMIT,
} from "./constants";
import {
  calculateSpotDifferenceScore,
  createRound,
  createTiles,
} from "./logic";
import type { RoundData, TileData } from "./types";

export const useSpotDifferenceController = () => {
  const animationFrameRef = useRef<number | null>(null);
  const roundStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });

  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [roundTimeLeft, setRoundTimeLeft] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const clearRoundTimer = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const getResponseMs = useCallback(() => {
    return roundStartedAtRef.current > 0 ? Date.now() - roundStartedAtRef.current : null;
  }, []);

  const setupRound = useCallback(
    (level: number) => {
      clearRoundTimer();
      const nextRound = createRound(level);
      setRoundData(nextRound);
      setTiles(createTiles(nextRound));
      setRoundTimeLeft(nextRound.perRoundTime);
      setSelectedIndex(null);
      roundStartedAtRef.current = Date.now();
    },
    [clearRoundTimer],
  );

  useEffect(() => clearRoundTimer, [clearRoundTimer]);

  useEffect(() => {
    if (engine.phase === "playing" && !roundData) {
      setupRound(engine.level);
      return;
    }

    if (engine.phase === "welcome") {
      clearRoundTimer();
      setRoundData(null);
      setTiles([]);
      setRoundTimeLeft(0);
      setSelectedIndex(null);
      roundStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (engine.phase !== "playing") {
      clearRoundTimer();
    }
  }, [clearRoundTimer, engine.level, engine.phase, roundData, resetPerformance, setupRound]);

  const handlePick = useCallback(
    (index: number) => {
      if (!roundData || selectedIndex !== null || engine.phase !== "playing") {
        return;
      }

      const isCorrect = index === roundData.oddIndex;
      setSelectedIndex(index);
      clearRoundTimer();
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      feedback.showFeedback(isCorrect);
      playSound(isCorrect ? "correct" : "incorrect");

      safeTimeout(() => {
        feedback.dismissFeedback();

        if (isCorrect) {
          engine.addScore(
            calculateSpotDifferenceScore(engine.level, roundTimeLeft),
          );

          if (engine.level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            return;
          }

          engine.nextLevel();
          setupRound(engine.level + 1);
          return;
        }

        const willGameOver = engine.lives <= 1;
        engine.loseLife();

        if (!willGameOver) {
          setupRound(engine.level);
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      clearRoundTimer,
      engine,
      feedback,
      getResponseMs,
      playSound,
      recordAttempt,
      roundData,
      roundTimeLeft,
      safeTimeout,
      selectedIndex,
      setupRound,
    ],
  );

  useEffect(() => {
    if (engine.phase !== "playing" || !roundData || selectedIndex !== null) {
      return;
    }

    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsedSeconds = (now - startedAt) / 1000;
      const remainingTime = Math.max(0, roundData.perRoundTime - elapsedSeconds);
      setRoundTimeLeft(remainingTime);

      if (remainingTime <= 0) {
        clearRoundTimer();
        handlePick(-1);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return clearRoundTimer;
  }, [clearRoundTimer, engine.phase, handlePick, roundData, selectedIndex]);

  return {
    engine,
    feedback,
    roundData,
    tiles,
    roundTimeLeft,
    selectedIndex,
    handlePick,
  };
};
