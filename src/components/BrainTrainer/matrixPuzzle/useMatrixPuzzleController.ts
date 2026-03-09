import { useCallback, useEffect, useRef, useState } from "react";

import { getRandomRuleForLevel, shouldUseInnerGrid } from "../../../data/matrixRules";
import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { useSound } from "../../../hooks/useSound";
import type { GameOption } from "../../../types/matrixRules";
import { generateMatrix, generateWrongOption } from "../../../utils/ruleExecutors";
import { useGameEngine } from "../shared/useGameEngine";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  OPTIONS_COUNT,
  TIME_LIMIT,
  TRANSITION_DELAY_MS,
} from "./constants";
import {
  buildQuestionHistoryEntry,
  createQuestionState,
  getMatrixPuzzleScore,
  pickHiddenCell,
} from "./logic";
import type {
  MatrixPuzzleQuestionState,
  QuestionHistoryEntry,
} from "./types";

export const useMatrixPuzzleController = () => {
  const questionStartedAtRef = useRef(0);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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
  const { dismissFeedback, showFeedback } = feedback;
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } =
    engine;

  const [currentQuestion, setCurrentQuestion] =
    useState<MatrixPuzzleQuestionState | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questionHistory, setQuestionHistory] = useState<QuestionHistoryEntry[]>(
    [],
  );
  const [isReviewing, setIsReviewing] = useState(false);

  const clearPendingActions = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }, []);

  const scheduleAction = useCallback(
    (callback: () => void, delayMs: number) => {
      const timeoutId = safeTimeout(() => {
        timeoutIdsRef.current = timeoutIdsRef.current.filter(
          (trackedId) => trackedId !== timeoutId,
        );
        callback();
      }, delayMs);

      timeoutIdsRef.current.push(timeoutId);
    },
    [safeTimeout],
  );

  const getResponseMs = useCallback(() => {
    return questionStartedAtRef.current > 0
      ? Date.now() - questionStartedAtRef.current
      : null;
  }, []);

  const setupQuestion = useCallback((nextLevelNumber: number) => {
    const rule = getRandomRuleForLevel(nextLevelNumber);
    const matrix = generateMatrix(
      [rule],
      shouldUseInnerGrid(nextLevelNumber),
    );
    const hiddenCell = pickHiddenCell();
    const correctShape = matrix[hiddenCell.row][hiddenCell.col];
    const existingShapes = [correctShape];
    const wrongShapes = Array.from({ length: OPTIONS_COUNT - 1 }, () => {
      const wrongShape = generateWrongOption(correctShape, existingShapes);
      existingShapes.push(wrongShape);
      return wrongShape;
    });

    setCurrentQuestion(
      createQuestionState({
        matrix,
        hiddenRow: hiddenCell.row,
        hiddenCol: hiddenCell.col,
        rule,
        wrongShapes,
      }),
    );
    setSelectedOption(null);
    questionStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase === "playing" && !currentQuestion) {
      clearPendingActions();
      setupQuestion(level);
      return;
    }

    if (phase === "welcome") {
      clearPendingActions();
      setCurrentQuestion(null);
      setSelectedOption(null);
      setQuestionHistory([]);
      setIsReviewing(false);
      questionStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (phase === "game_over" || phase === "victory") {
      clearPendingActions();
    }
  }, [
    clearPendingActions,
    currentQuestion,
    level,
    phase,
    resetPerformance,
    setupQuestion,
  ]);

  useEffect(() => clearPendingActions, [clearPendingActions]);

  const handleOptionSelect = useCallback(
    (option: GameOption) => {
      if (!currentQuestion || selectedOption || phase !== "playing") {
        return;
      }

      const isCorrect = option.isCorrect;
      setSelectedOption(option.id);
      recordAttempt({ isCorrect, responseMs: getResponseMs() });
      showFeedback(isCorrect);
      setQuestionHistory((previousHistory) => [
        ...previousHistory,
        buildQuestionHistoryEntry({
          question: currentQuestion,
          level,
          selectedAnswer: option.shape,
          isCorrect,
        }),
      ]);

      if (isCorrect) {
        playSound("correct");
        addScore(getMatrixPuzzleScore(level));
      } else {
        playSound("incorrect");
        loseLife();
      }

      const canRetry = lives > 1;

      scheduleAction(() => {
        dismissFeedback();

        if (isCorrect) {
          if (level >= MAX_LEVEL) {
            setGamePhase("victory");
            playSound("success");
            return;
          }

          nextLevel();
          setupQuestion(level + 1);
          return;
        }

        if (canRetry) {
          setupQuestion(level);
        }
      }, TRANSITION_DELAY_MS);
    },
    [
      addScore,
      currentQuestion,
      dismissFeedback,
      getResponseMs,
      level,
      lives,
      loseLife,
      nextLevel,
      phase,
      playSound,
      recordAttempt,
      scheduleAction,
      selectedOption,
      setGamePhase,
      setupQuestion,
      showFeedback,
    ],
  );

  return {
    engine,
    feedback,
    currentQuestion,
    selectedOption,
    questionHistory,
    isReviewing,
    setIsReviewing,
    handleOptionSelect,
  };
};
