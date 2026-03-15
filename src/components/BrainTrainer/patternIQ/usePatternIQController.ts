import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback.ts";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker.ts";
import { useSound } from "../../../hooks/useSound.ts";
import { useGameEngine } from "../shared/useGameEngine.ts";
import {
  areWagonStatesEqual,
  buildPatternIQFeedbackMessage,
  calculateWagonState,
  generateOptions,
  generatePattern,
} from "./logic.ts";
import type { PatternData, WagonState } from "./types.ts";

const GAME_ID = "patterniq-express";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const WAGON_COUNT = 5;
const FEEDBACK_DURATION_MS = 1200;

export { MAX_LEVEL, WAGON_COUNT };

export const usePatternIQController = () => {
  const questionStartedAtRef = useRef(0);
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
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [currentPattern, setCurrentPattern] = useState<PatternData | null>(null);
  const [options, setOptions] = useState<WagonState[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const answerTimeoutRef = useRef<number | null>(null);
  const phaseRef = useRef(engine.phase);

  const clearAnswerTimeout = useCallback(() => {
    if (answerTimeoutRef.current !== null) {
      window.clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
  }, []);

  const setupRound = useCallback(
    (level: number) => {
      const pattern = generatePattern(level);
      setCurrentPattern(pattern);
      setOptions(generateOptions(pattern, WAGON_COUNT - 1));
      setRevealed(false);
      setSelectedIndex(null);
      questionStartedAtRef.current = Date.now();
    },
    [],
  );

  useEffect(() => {
    phaseRef.current = engine.phase;
  }, [engine.phase]);

  useEffect(() => clearAnswerTimeout, [clearAnswerTimeout]);

  useEffect(() => {
    if (engine.phase === "playing" && !currentPattern) {
      playSound("slide");
      setupRound(engine.level);
    } else if (
      engine.phase === "welcome" ||
      engine.phase === "game_over" ||
      engine.phase === "victory"
    ) {
      clearAnswerTimeout();
      dismissFeedback();
      setCurrentPattern(null);
      setOptions([]);
      setSelectedIndex(null);
      setRevealed(false);
      questionStartedAtRef.current = 0;
      if (engine.phase === "welcome") {
        resetPerformance();
      }
    }
  }, [
    clearAnswerTimeout,
    engine.phase,
    engine.level,
    currentPattern,
    dismissFeedback,
    playSound,
    resetPerformance,
    setupRound,
  ]);

  const handleAnswer = useCallback(
    (index: number) => {
      if (
        engine.phase !== "playing" ||
        revealed ||
        !currentPattern ||
        !!feedbackState
      ) {
        return;
      }

      setSelectedIndex(index);
      setRevealed(true);

      const targetState = calculateWagonState(currentPattern, WAGON_COUNT - 1);
      const isCorrect = areWagonStatesEqual(options[index], targetState);
      const canRetry = engine.lives > 1;

      recordAttempt({
        isCorrect,
        responseMs:
          questionStartedAtRef.current > 0
            ? Date.now() - questionStartedAtRef.current
            : null,
      });

      showFeedback(
        isCorrect,
        buildPatternIQFeedbackMessage(isCorrect, engine.level, MAX_LEVEL),
      );
      clearAnswerTimeout();

      answerTimeoutRef.current = window.setTimeout(() => {
        answerTimeoutRef.current = null;
        dismissFeedback();
        if (phaseRef.current !== "playing") return;

        if (isCorrect) {
          engine.addScore(10 * engine.level);
          if (engine.level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            playSound("success");
          } else {
            engine.nextLevel();
            setupRound(engine.level + 1);
          }
        } else {
          engine.loseLife();
          if (canRetry) {
            setupRound(engine.level);
          }
        }
      }, FEEDBACK_DURATION_MS);
    },
    [
      clearAnswerTimeout,
      currentPattern,
      dismissFeedback,
      engine,
      feedbackState,
      options,
      playSound,
      recordAttempt,
      revealed,
      setupRound,
      showFeedback,
    ],
  );

  const skipQuestion = useCallback(() => {
    if (engine.phase !== "playing" || revealed || !!feedbackState) return;

    engine.addScore(-10);
    playSound("click");
    setupRound(engine.level);
  }, [engine, feedbackState, playSound, revealed, setupRound]);

  return {
    engine,
    feedback,
    currentPattern,
    options,
    revealed,
    selectedIndex,
    handleAnswer,
    skipQuestion,
  };
};
