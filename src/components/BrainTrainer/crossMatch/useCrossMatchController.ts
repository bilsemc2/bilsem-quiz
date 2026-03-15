import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../../hooks/useGamePerformanceTracker";
import { useSound } from "../../../hooks/useSound";
import { useGameEngine } from "../shared/useGameEngine";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  INITIAL_LIVES,
  MATCH_REVEAL_DELAY_MS,
  MAX_LEVEL,
  MISMATCH_REVEAL_DELAY_MS,
  PREVIEW_DURATION_MS,
  TIME_LIMIT,
} from "./constants.ts";
import {
  areAllCardsMatched,
  areCardsMatch,
  buildCrossMatchFeedbackMessage,
  createCards,
  flipCard,
  getShuffleIntervalForLevel,
  hideCards,
  markCardsMatched,
  shuffleCardPositions,
} from "./logic.ts";
import type { Card, LocalPhase } from "./types.ts";

export const useCrossMatchController = () => {
  const actionTimeoutRef = useRef<number | null>(null);
  const shuffleIntervalRef = useRef<number | null>(null);
  const roundLevelRef = useRef<number | null>(null);
  const cardsRef = useRef<Card[]>([]);
  const pairStartedAtRef = useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } =
    useGamePerformanceTracker();
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
    getPerformanceSnapshot: () => performanceRef.current,
  });
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { dismissFeedback, feedbackState, showFeedback } = feedback;
  const { phase, level, lives, addScore, loseLife, nextLevel, setGamePhase } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("preview");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);

  useEffect(() => { cardsRef.current = cards; }, [cards]);

  const clearActionTimeout = useCallback(() => {
    if (actionTimeoutRef.current === null) return;
    window.clearTimeout(actionTimeoutRef.current);
    actionTimeoutRef.current = null;
  }, []);

  const clearShuffleInterval = useCallback(() => {
    if (shuffleIntervalRef.current === null) return;
    window.clearInterval(shuffleIntervalRef.current);
    shuffleIntervalRef.current = null;
  }, []);

  const getResponseMs = useCallback(
    () => (pairStartedAtRef.current > 0 ? Math.round(performance.now() - pairStartedAtRef.current) : null),
    [],
  );

  const startLevel = useCallback(
    (nextLevelValue: number) => {
      clearActionTimeout();
      roundLevelRef.current = nextLevelValue;
      pairStartedAtRef.current = performance.now();
      setCards(createCards(nextLevelValue));
      setFlippedCardIds([]);
      setLocalPhase("preview");

      actionTimeoutRef.current = window.setTimeout(() => {
        setCards((prev) => prev.map((card) => ({ ...card, isFlipped: false })));
        setLocalPhase("playing");
        pairStartedAtRef.current = performance.now();
      }, PREVIEW_DURATION_MS);
    },
    [clearActionTimeout],
  );

  useEffect(() => () => {
    clearActionTimeout();
    clearShuffleInterval();
  }, [clearActionTimeout, clearShuffleInterval]);

  useEffect(() => {
    if (phase === "playing") {
      if (cards.length === 0 || roundLevelRef.current !== level) {
        startLevel(level);
      }
      return;
    }

    clearActionTimeout();
    clearShuffleInterval();
    dismissFeedback();
    roundLevelRef.current = null;

    if (phase === "welcome") {
      setCards([]);
      setFlippedCardIds([]);
      setLocalPhase("preview");
      resetPerformance();
    }
  }, [cards.length, clearActionTimeout, clearShuffleInterval, dismissFeedback, level, phase, resetPerformance, startLevel]);

  useEffect(() => {
    clearShuffleInterval();

    const intervalMs = getShuffleIntervalForLevel(level);

    if (localPhase === "playing" && phase === "playing" && intervalMs) {
      shuffleIntervalRef.current = window.setInterval(() => {
        playSound("pop");
        setCards((prev) => shuffleCardPositions(prev));
      }, intervalMs);
    }

    return clearShuffleInterval;
  }, [clearShuffleInterval, level, localPhase, phase, playSound]);

  const handleCardClick = useCallback(
    (cardId: string) => {
      const latestCards = cardsRef.current;
      const card = latestCards.find((entry) => entry.id === cardId) ?? null;

      if (
        !card ||
        localPhase !== "playing" ||
        phase !== "playing" ||
        feedbackState ||
        card.isFlipped ||
        card.isMatched ||
        flippedCardIds.length >= 2
      ) {
        return;
      }

      playSound("pop");

      if (flippedCardIds.length === 0) {
        pairStartedAtRef.current = performance.now();
      }

      const nextFlippedCardIds = [...flippedCardIds, cardId];
      setFlippedCardIds(nextFlippedCardIds);
      setCards((prev) => flipCard(prev, cardId));

      if (nextFlippedCardIds.length < 2) {
        return;
      }

      const [firstCardId] = nextFlippedCardIds;
      const firstCard =
        latestCards.find((entry) => entry.id === firstCardId) ?? null;
      const isMatch = areCardsMatch(firstCard, card);
      recordAttempt({ isCorrect: isMatch, responseMs: getResponseMs() });
      clearActionTimeout();

      if (isMatch) {
        actionTimeoutRef.current = window.setTimeout(() => {
          setFlippedCardIds([]);
          addScore(level * 10);

          const updatedCards = markCardsMatched(cardsRef.current, nextFlippedCardIds);
          const allMatched = areAllCardsMatched(updatedCards);
          showFeedback(
            true,
            buildCrossMatchFeedbackMessage({
              correct: true,
              allMatched,
              level,
              maxLevel: MAX_LEVEL,
            }),
          );
          setCards(updatedCards);

          if (allMatched) {
            setLocalPhase("feedback");
            actionTimeoutRef.current = window.setTimeout(() => {
              dismissFeedback();

              if (level >= MAX_LEVEL) {
                setGamePhase("victory");
              } else {
                nextLevel();
              }
            }, FEEDBACK_DURATION_MS);
            return;
          }

          actionTimeoutRef.current = window.setTimeout(() => {
            dismissFeedback();
            pairStartedAtRef.current = performance.now();
          }, FEEDBACK_DURATION_MS);
        }, MATCH_REVEAL_DELAY_MS);

        return;
      }

      actionTimeoutRef.current = window.setTimeout(() => {
        showFeedback(
          false,
          buildCrossMatchFeedbackMessage({
            correct: false,
            allMatched: false,
            level,
            maxLevel: MAX_LEVEL,
          }),
        );
        setLocalPhase("feedback");
        const willGameOver = lives <= 1;

        actionTimeoutRef.current = window.setTimeout(() => {
          dismissFeedback();
          loseLife();

          if (!willGameOver) {
            setCards((prev) => hideCards(prev, nextFlippedCardIds));
            setFlippedCardIds([]);
            setLocalPhase("playing");
            pairStartedAtRef.current = performance.now();
          }
        }, FEEDBACK_DURATION_MS);
      }, MISMATCH_REVEAL_DELAY_MS);
    },
    [
      addScore,
      clearActionTimeout,
      dismissFeedback,
      feedbackState,
      flippedCardIds,
      getResponseMs,
      level,
      lives,
      localPhase,
      loseLife,
      nextLevel,
      phase,
      playSound,
      recordAttempt,
      setGamePhase,
      showFeedback,
    ],
  );

  return { engine, feedback, cards, localPhase, handleCardClick };
};
