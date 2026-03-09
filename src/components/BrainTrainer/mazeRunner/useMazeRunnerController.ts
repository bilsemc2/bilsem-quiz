import { useCallback, useEffect, useRef, useState } from "react";
import { Compass } from "lucide-react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  FEEDBACK_DURATION_MS,
  GAME_DESCRIPTION,
  GAME_ID,
  GAME_TITLE,
  INITIAL_LIVES,
  MAX_LEVEL,
  SHAKE_DURATION_MS,
  TIME_LIMIT,
  TUZO_TEXT,
  WRONG_PATH_WARNING_MS,
} from "./constants";
import { createMazeLevel } from "./logic";
import type { MazeLevelData } from "./types";

const WARNING_TEXT = "YANLIS YOL!";

export const useMazeRunnerController = () => {
  const levelStartedAtRef = useRef(0);
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
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [mazeLevel, setMazeLevel] = useState<MazeLevelData | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [boardResetKey, setBoardResetKey] = useState(0);

  const resetBoard = useCallback(() => {
    setBoardResetKey((current) => current + 1);
  }, []);

  const getResponseMs = useCallback(() => {
    return levelStartedAtRef.current > 0 ? Date.now() - levelStartedAtRef.current : null;
  }, []);

  const triggerShake = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(200);
    setShake(true);
    safeTimeout(() => setShake(false), SHAKE_DURATION_MS);
  }, [safeTimeout]);

  const setupLevel = useCallback(
    (level: number) => {
      setMazeLevel(createMazeLevel(level));
      setWarning(null);
      resetBoard();
      levelStartedAtRef.current = Date.now();
    },
    [resetBoard],
  );

  useEffect(() => {
    if (engine.phase === "playing" && !mazeLevel) {
      setupLevel(engine.level);
      return;
    }

    if (engine.phase === "welcome") {
      setMazeLevel(null);
      setWarning(null);
      setShake(false);
      resetBoard();
      resetPerformance();
      levelStartedAtRef.current = 0;
    }
  }, [engine.level, engine.phase, mazeLevel, resetBoard, resetPerformance, setupLevel]);

  const handleCrash = useCallback(() => {
    if (engine.phase !== "playing") {
      return;
    }

    triggerShake();
    playSound("incorrect");
    recordAttempt({ isCorrect: false, responseMs: getResponseMs() });
    engine.loseLife();
    resetBoard();
    showFeedback(false);
    safeTimeout(() => dismissFeedback(), WRONG_PATH_WARNING_MS);
  }, [
    dismissFeedback,
    engine,
    getResponseMs,
    playSound,
    recordAttempt,
    resetBoard,
    safeTimeout,
    showFeedback,
    triggerShake,
  ]);

  const handleWrongPath = useCallback(() => {
    if (engine.phase !== "playing") {
      return;
    }

    triggerShake();
    setWarning(WARNING_TEXT);
    playSound("incorrect");
    recordAttempt({ isCorrect: false, responseMs: getResponseMs() });
    engine.loseLife();
    safeTimeout(() => setWarning(null), WRONG_PATH_WARNING_MS);
  }, [engine, getResponseMs, playSound, recordAttempt, safeTimeout, triggerShake]);

  const handleLevelComplete = useCallback(() => {
    if (engine.phase !== "playing" || feedbackState) {
      return;
    }

    playSound("correct");
    showFeedback(true);
    recordAttempt({ isCorrect: true, responseMs: getResponseMs() });
    engine.addScore(10 * engine.level);

    safeTimeout(() => {
      dismissFeedback();
      if (engine.level >= MAX_LEVEL) {
        engine.setGamePhase("victory");
        return;
      }

      engine.nextLevel();
      setupLevel(engine.level + 1);
    }, FEEDBACK_DURATION_MS);
  }, [
    dismissFeedback,
    engine,
    feedbackState,
    getResponseMs,
    playSound,
    recordAttempt,
    safeTimeout,
    setupLevel,
    showFeedback,
  ]);

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Compass,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Yesil noktadan basla",
      "Duvarlara dokunmadan ciz",
      "Pembe noktaya ulas",
    ],
  };

  return {
    engine,
    feedback,
    feedbackState,
    gameConfig,
    mazeLevel,
    warning,
    shake,
    boardResetKey,
    handleCrash,
    handleWrongPath,
    handleLevelComplete,
  };
};
