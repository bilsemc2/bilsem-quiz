import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback.ts";
import { useSound } from "../../../hooks/useSound.ts";
import { useGameEngine } from "../shared/useGameEngine.ts";
import {
  FEEDBACK_DURATION_CORRECT_MS,
  FEEDBACK_DURATION_WRONG_MS,
  GAME_ID,
  MAX_LEVEL,
  buildDirectionFeedbackMessage,
  checkAnswer,
  generateRound,
  generateTarget,
  getGridSize,
  hasReachedTarget,
  moveTowardTarget,
} from "./logic.ts";
import type { DirectionStroopRound, GridPos } from "./logic.ts";

export const useDirectionStroopController = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
  });
  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [currentRound, setCurrentRound] = useState<DirectionStroopRound | null>(null);
  const [playerPos, setPlayerPos] = useState<GridPos>({ row: 2, col: 2 });
  const [targetPos, setTargetPos] = useState<GridPos>({ row: 0, col: 0 });
  const roundTimeoutRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);

  const clearRoundTimeout = useCallback(() => {
    if (roundTimeoutRef.current !== null) {
      window.clearTimeout(roundTimeoutRef.current);
      roundTimeoutRef.current = null;
    }
  }, []);

  const gridSize = useMemo(() => getGridSize(level), [level]);

  const initLevel = useCallback(
    (lvl: number) => {
      const size = getGridSize(lvl);
      const center = Math.floor(size / 2);
      const pPos = { row: center, col: center };
      setPlayerPos(pPos);
      setTargetPos(generateTarget(pPos, size));
      setCurrentRound(generateRound());
      playSound("slide");
    },
    [playSound],
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => clearRoundTimeout, [clearRoundTimeout]);

  useEffect(() => {
    if (phase === "playing" && !currentRound) {
      initLevel(level);
    } else if (phase === "welcome" || phase === "game_over" || phase === "victory") {
      clearRoundTimeout();
      dismissFeedback();
      setCurrentRound(null);
    }
  }, [phase, currentRound, level, initLevel, clearRoundTimeout, dismissFeedback]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (phase !== "playing" || !!feedbackState || !currentRound) return;
      const correct = checkAnswer(answer, currentRound);
      clearRoundTimeout();

      if (correct) {
        const newPos = moveTowardTarget(playerPos, targetPos);
        setPlayerPos(newPos);
        const reached = hasReachedTarget(newPos, targetPos);
        showFeedback(
          true,
          buildDirectionFeedbackMessage(true, reached, currentRound.correctAnswer, level, MAX_LEVEL),
        );

        roundTimeoutRef.current = window.setTimeout(() => {
          roundTimeoutRef.current = null;
          dismissFeedback();
          if (phaseRef.current !== "playing") return;

          if (reached) {
            addScore(20 + level * 5);
            playSound("success");
            if (level >= MAX_LEVEL) {
              engine.setGamePhase("victory");
            } else {
              nextLevel();
              setCurrentRound(null);
            }
          } else {
            setCurrentRound(generateRound());
          }
        }, FEEDBACK_DURATION_CORRECT_MS);
      } else {
        showFeedback(
          false,
          buildDirectionFeedbackMessage(false, false, currentRound.correctAnswer, level, MAX_LEVEL),
        );
        loseLife();
        roundTimeoutRef.current = window.setTimeout(() => {
          roundTimeoutRef.current = null;
          dismissFeedback();
          if (phaseRef.current === "playing") {
            setCurrentRound(generateRound());
          }
        }, FEEDBACK_DURATION_WRONG_MS);
      }
    },
    [
      phase,
      feedbackState,
      currentRound,
      showFeedback,
      dismissFeedback,
      addScore,
      level,
      nextLevel,
      loseLife,
      playerPos,
      targetPos,
      engine,
      clearRoundTimeout,
      playSound,
    ],
  );

  return {
    engine,
    feedback,
    currentRound,
    playerPos,
    targetPos,
    gridSize,
    handleAnswer,
  };
};
