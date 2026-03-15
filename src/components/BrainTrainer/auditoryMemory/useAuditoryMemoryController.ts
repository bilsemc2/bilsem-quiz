import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MAX_LEVEL,
  NOTES,
  TIME_LIMIT,
  USER_NOTE_DURATION_MS,
} from "./constants";
import {
  buildAuditoryMemoryFeedbackMessage,
  calculateAuditoryMemoryScore,
  generateSequence,
  isExpectedNote,
  isSequenceComplete,
} from "./logic";
import type { LocalPhase } from "./types";
import { useAuditoryNotePlayer } from "./useAuditoryNotePlayer";
import { useAuditorySequencePlayback } from "./useAuditorySequencePlayback";

export const useAuditoryMemoryController = () => {
  const answerStartedAtRef = useRef(0);
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
  const { activeNote, clearActiveNote, playNote } = useAuditoryNotePlayer();
  const { addScore, level, lives, loseLife, nextLevel, phase, setGamePhase } =
    engine;
  const { dismissFeedback, feedbackState, showFeedback } = feedback;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);

  const getResponseMs = useCallback(() => {
    return answerStartedAtRef.current > 0
      ? Date.now() - answerStartedAtRef.current
      : null;
  }, []);

  const handleListeningStart = useCallback(() => {
      setLocalPhase("listening");
      setPlayerSequence([]);
      answerStartedAtRef.current = 0;
    }, []);

  const handleAnswerPhaseReady = useCallback(() => {
      setLocalPhase("answering");
      setPlayerSequence([]);
      answerStartedAtRef.current = Date.now();
    }, []);

  const {
    currentPlayIndex,
    clearScheduledActions,
    scheduleAction,
    syncPhase,
    playSequence,
  } = useAuditorySequencePlayback({
    playNote,
    onListeningStart: handleListeningStart,
    onAnswerPhaseReady: handleAnswerPhaseReady,
  });

  const setupRound = useCallback(
    (nextLevel: number) => {
      const nextSequence = generateSequence(nextLevel, NOTES.length);
      setSequence(nextSequence);
      setPlayerSequence([]);
      playSound("slide");
      void playSequence(nextSequence);
    },
    [playSequence, playSound],
  );

  useEffect(() => {
    syncPhase(phase);
  }, [phase, syncPhase]);

  useEffect(() => {
    return clearScheduledActions;
  }, [clearScheduledActions]);

  useEffect(() => {
    if (
      phase === "playing" &&
      localPhase === "idle" &&
      sequence.length === 0 &&
      !feedbackState
    ) {
      setupRound(level);
      return;
    }

    if (phase === "welcome") {
      clearScheduledActions();
      clearActiveNote();
      setLocalPhase("idle");
      setSequence([]);
      setPlayerSequence([]);
      answerStartedAtRef.current = 0;
      resetPerformance();
      return;
    }

    if (phase !== "playing") {
      clearScheduledActions();
      clearActiveNote();
      setLocalPhase("idle");
      setSequence([]);
      setPlayerSequence([]);
      answerStartedAtRef.current = 0;
    }
  }, [
    clearActiveNote,
    clearScheduledActions,
    feedbackState,
    level,
    localPhase,
    phase,
    resetPerformance,
    sequence.length,
    setupRound,
  ]);

  const handleSuccess = useCallback(() => {
    setLocalPhase("idle");
    clearScheduledActions();
    recordAttempt({ isCorrect: true, responseMs: getResponseMs() });
    showFeedback(
      true,
      buildAuditoryMemoryFeedbackMessage({
        correct: true,
        level,
        maxLevel: MAX_LEVEL,
        sequenceLength: sequence.length,
      }),
    );
    addScore(calculateAuditoryMemoryScore(level));

    scheduleAction(() => {
      dismissFeedback();

      if (level >= MAX_LEVEL) {
        playSound("success");
        setGamePhase("victory");
        return;
      }

      nextLevel();
      setupRound(level + 1);
    }, FEEDBACK_DURATION_MS);
  }, [
    addScore,
    clearScheduledActions,
    dismissFeedback,
    getResponseMs,
    level,
    nextLevel,
    playSound,
    recordAttempt,
    scheduleAction,
    sequence.length,
    setGamePhase,
    setupRound,
    showFeedback,
  ]);

  const handleFailure = useCallback(() => {
    const canRetry = lives > 1;
    setLocalPhase("idle");
    clearScheduledActions();
    recordAttempt({ isCorrect: false, responseMs: getResponseMs() });
    loseLife();
    showFeedback(
      false,
      buildAuditoryMemoryFeedbackMessage({
        correct: false,
        level,
        maxLevel: MAX_LEVEL,
        sequenceLength: sequence.length,
      }),
    );

    scheduleAction(() => {
      dismissFeedback();

      if (canRetry && phase === "playing") {
        setupRound(level);
      }
    }, FEEDBACK_DURATION_MS);
  }, [
    clearScheduledActions,
    dismissFeedback,
    getResponseMs,
    level,
    lives,
    loseLife,
    phase,
    recordAttempt,
    scheduleAction,
    sequence.length,
    setupRound,
    showFeedback,
  ]);

  const handleNoteClick = useCallback(
    (noteIndex: number) => {
      if (
        localPhase !== "answering" ||
        phase !== "playing" ||
        feedbackState
      ) {
        return;
      }

      playNote(noteIndex, USER_NOTE_DURATION_MS);
      const nextPlayerSequence = [...playerSequence, noteIndex];
      setPlayerSequence(nextPlayerSequence);

      if (!isExpectedNote(sequence, playerSequence.length, noteIndex)) {
        handleFailure();
        return;
      }

      if (isSequenceComplete(sequence, nextPlayerSequence.length)) {
        handleSuccess();
        return;
      }

      playSound("pop");
    },
    [
      feedbackState,
      handleFailure,
      handleSuccess,
      localPhase,
      phase,
      playNote,
      playSound,
      playerSequence,
      sequence,
    ],
  );

  return {
    engine,
    feedback,
    localPhase,
    sequence,
    playerSequence,
    currentPlayIndex,
    activeNote,
    handleNoteClick,
  };
};
