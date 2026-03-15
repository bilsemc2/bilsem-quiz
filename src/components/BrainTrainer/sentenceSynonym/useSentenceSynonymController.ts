import { useCallback, useEffect, useState } from "react";

import { loadSentenceSynonymRows } from "@/features/games/model/brainTrainerContentUseCases";
import { useGameFeedback } from "../../../hooks/useGameFeedback.ts";
import { useSound } from "../../../hooks/useSound.ts";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout.ts";
import { useGameEngine } from "../shared/useGameEngine.ts";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  MAX_LEVEL,
  TIME_LIMIT,
  buildSentenceSynonymFeedbackMessage,
  checkAnswer,
  computeScore,
  parseQuestions,
} from "./logic.ts";
import type { SentenceSynonymQuestion } from "./logic.ts";

export const useSentenceSynonymController = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
  });

  const [isFetching, setIsFetching] = useState(false);
  const [questions, setQuestions] = useState<SentenceSynonymQuestion[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [, setErrorMessage] = useState("");
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const fetchQuestions = useCallback(async () => {
    setIsFetching(true);
    try {
      const data = await loadSentenceSynonymRows();
      if (!data || data.length === 0) {
        setErrorMessage("Soru bulunamadı.");
        setIsFetching(false);
        engine.setGamePhase("game_over");
        return;
      }

      const parsed = parseQuestions(data, MAX_LEVEL);
      setQuestions(parsed);
      setIsFetching(false);
    } catch {
      setErrorMessage("Sorular yüklenirken hata oluştu.");
      setIsFetching(false);
      engine.setGamePhase("game_over");
    }
  }, [engine]);

  useEffect(() => {
    if (engine.phase === "playing" && questions.length === 0 && !isFetching) {
      setStreak(0);
      setBestStreak(0);
      dismissFeedback();
      fetchQuestions();
    }
  }, [dismissFeedback, engine.phase, questions.length, isFetching, fetchQuestions]);

  const handleAnswer = (id: string) => {
    if (feedbackState || !questions[engine.level - 1]) return;

    setSelectedAnswer(id);
    const correct = checkAnswer(id, questions[engine.level - 1]);

    playSound(correct ? "correct" : "wrong");
    showFeedback(
      correct,
      buildSentenceSynonymFeedbackMessage({
        isCorrect: correct,
        level: engine.level,
        maxLevel: MAX_LEVEL,
        dogruKelime: questions[engine.level - 1].dogru_kelime,
      }),
    );

    const willGameOver = !correct && engine.lives <= 1;

    if (correct) {
      setStreak((p) => {
        const ns = p + 1;
        if (ns > bestStreak) setBestStreak(ns);
        return ns;
      });
      engine.addScore(computeScore(streak));
    } else {
      setStreak(0);
      engine.loseLife();
    }

    safeTimeout(() => {
      setSelectedAnswer(null);
      dismissFeedback();

      if (willGameOver && !correct) {
        // loseLife already triggered game_over, no action needed
      } else if (engine.level >= questions.length || engine.level >= MAX_LEVEL) {
        engine.setGamePhase("victory");
      } else {
        engine.nextLevel();
      }
    }, FEEDBACK_DURATION_MS);
  };

  return {
    engine,
    feedback,
    isFetching,
    questions,
    selectedAnswer,
    handleAnswer,
  };
};
