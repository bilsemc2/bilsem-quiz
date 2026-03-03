import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, AlertCircle } from "lucide-react";
import GameOptionButton from "./shared/GameOptionButton";
import type { FeedbackResult } from "./shared/GameOptionButton";
import GameQuestionCard from "./shared/GameQuestionCard";
import { supabase } from "../../lib/supabase";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameEngine } from "./shared/useGameEngine";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "es-anlam";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: number;
  kelime: string;
  options: Option[];
  correct_option_id: string;
  es_anlami: string;
}

const SynonymGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();

  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { phase, level, lives, addScore, loseLife, nextLevel, setGamePhase, examMode } = engine;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase
        .from("es_anlam_sorulari")
        .select(
          "id, kelime, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, es_anlami"
        )
        .limit(100);

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Soru bulunamadı.");

      const sel = data.sort(() => Math.random() - 0.5).slice(0, MAX_LEVEL);
      const optLabels = ["a", "b", "c", "d"];

      const parsed: Question[] = sel.map((q) => {
        const raw = [
          { id: "a", text: q.secenek_a },
          { id: "b", text: q.secenek_b },
          { id: "c", text: q.secenek_c },
          { id: "d", text: q.secenek_d },
        ];
        const shuffled = raw.sort(() => Math.random() - 0.5);
        const corrIdx = shuffled.findIndex((o) => o.id === q.dogru_cevap);

        return {
          id: q.id,
          kelime: q.kelime,
          options: shuffled.map((o, i) => ({ id: optLabels[i], text: o.text })),
          correct_option_id: optLabels[corrIdx],
          es_anlami: q.es_anlami,
        };
      });

      setQuestions(parsed);
      setIsLoading(false);
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Hata oluştu.");
      setIsLoading(false);
      setGamePhase("welcome");
    }
  }, [setGamePhase]);

  useEffect(() => {
    if (phase === "playing" && questions.length === 0 && !isLoading && !errorMessage) {
      fetchQuestions();
      setCurrentQuestionIndex(0);
    } else if (phase === "welcome") {
      setQuestions([]);
      setStreak(0);
      setCurrentQuestionIndex(0);
      setErrorMessage("");
    }
  }, [phase, questions.length, isLoading, errorMessage, fetchQuestions]);

  // Handle question exhaustion
  useEffect(() => {
    if (phase === "playing" && questions.length > 0 && currentQuestionIndex >= questions.length) {
      setGamePhase(level >= MAX_LEVEL ? "victory" : "game_over");
    }
  }, [phase, questions.length, currentQuestionIndex, level, setGamePhase]);

  const handleAnswer = useCallback((ansId: string) => {
    if (phase !== "playing" || feedbackState || questions.length === 0) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const correct = ansId === currentQuestion.correct_option_id;

    showFeedback(correct);
    playSound(correct ? "correct" : "incorrect");

    if (correct) {
      setStreak((p) => p + 1);
      addScore(100 + streak * 10);
    } else {
      setStreak(0);
      loseLife();
    }

    safeTimeout(() => {
      dismissFeedback();

      if (correct) {
        if (level >= MAX_LEVEL) {
          setGamePhase("victory");
          playSound("success");
        } else {
          nextLevel();
          setCurrentQuestionIndex((prev) => prev + 1);
          playSound("slide");
        }
      } else if (lives > 1) {
        // Wrong answer: advance question but don't advance level
        setCurrentQuestionIndex((prev) => prev + 1);
        playSound("slide");
      }
    }, 1500);
  }, [phase, feedbackState, questions, currentQuestionIndex, showFeedback, dismissFeedback, playSound, addScore, streak, level, lives, nextLevel, loseLife, setGamePhase, safeTimeout]);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-900 border-2 border-black/10 flex items-center justify-center p-6 text-black dark:text-white">
        <div className="text-center max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border-2 border-black/10 shadow-neo-sm">
          <AlertCircle
            className="w-20 h-20 text-cyber-pink mx-auto mb-6"
            strokeWidth={2.5}
          />
          <h2 className="text-3xl font-nunito font-black uppercase mb-4">
            Hata Oluştu
          </h2>
          <p className="text-slate-600 dark:text-slate-300 font-nunito font-medium mb-8 text-lg">
            {errorMessage}
          </p>
          <button
            onClick={() => {
              setErrorMessage("");
              if (examMode) {
                setGamePhase("game_over");
              } else {
                setGamePhase("welcome");
              }
            }}
            className="px-8 py-4 bg-cyber-pink text-black rounded-2xl border-2 border-black/10 shadow-neo-sm hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-neo-sm active:translate-y-2 active:translate-x-2 active:shadow-none transition-all font-nunito font-black uppercase tracking-widest inline-block"
          >
            {examMode ? "Devam Et" : "Geri Dön"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Eş Anlam",
        icon: BookOpen,
        description:
          "Verilen kelimenin eş anlamlısını bul ve kelime hazneni genişlet. Hızlı yanıtlar extra puan kazandırır!",
        howToPlay: [
          "Verilen kelimenin eş anlamlısını bul.",
          "Seçeneklerden doğru olanı işaretle.",
          "Hata yapmadan ilerleyerek seri bonusu kazan!",
        ],
        tuzoCode: "6.1.1 Sözcük Bilgisi",
        accentColor: "cyber-pink",
        wideLayout: true,
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => {
        const question = questions[currentQuestionIndex];
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {phase === "playing" && question && (
              <motion.div
                key={`q-${level}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl space-y-4"
              >
                {/* Question Card */}
                <GameQuestionCard
                  badge="Eş Anlamlısı Nedir?"
                  badgeColor="cyber-pink"
                  question={question.kelime}
                  animationKey={level}
                />

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options.map((opt, idx) => {
                    const isCorr = opt.id === question.correct_option_id;
                    const hasFeedback = feedbackState !== null;

                    let result: FeedbackResult = null;
                    if (hasFeedback) {
                      result = isCorr ? "correct" : "dimmed";
                    }

                    return (
                      <GameOptionButton
                        key={opt.id}
                        variant="text"
                        label={opt.text}
                        optionLetter={["A", "B", "C", "D"][idx]}
                        onClick={() => handleAnswer(opt.id)}
                        disabled={hasFeedback}
                        feedbackResult={result}
                        animationDelay={idx * 0.1}
                      />
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        );
      }}
    </BrainTrainerShell>
  );
};

export default SynonymGame;
