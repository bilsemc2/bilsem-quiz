import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GitBranch, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useGameEngine } from "./shared/useGameEngine";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "sozel-analoji";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
  correct_option_id: string;
  explanation?: string;
}

const VerbalAnalogyGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
  });
  const { phase, level, lives, addScore, loseLife, nextLevel, setGamePhase } = engine;

  const feedback = useGameFeedback({
    duration: 2000,
  });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase
        .from("analoji_sorulari")
        .select("*")
        .limit(100);

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Soru bulunamadı.");

      const shuffled = data.sort(() => Math.random() - 0.5).slice(0, MAX_LEVEL);
      const labels = ["A", "B", "C", "D"];

      const parsed: Question[] = shuffled.map((q) => {
        const opts = [
          { o: "a", t: q.secenek_a },
          { o: "b", t: q.secenek_b },
          { o: "c", t: q.secenek_c },
          { o: "d", t: q.secenek_d },
        ]
          .filter((o) => o.t != null && o.t !== "")
          .sort(() => Math.random() - 0.5);

        const corIdx = opts.findIndex((o) => o.o === q.dogru_cevap);

        return {
          id: q.id,
          text: q.soru_metni,
          options: opts.map((o, i) => ({ id: labels[i], text: o.t })),
          correct_option_id: labels[corIdx],
          explanation: q.aciklama,
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
      setCurrentQuestionIndex(0);
      setErrorMessage("");
    }
  }, [phase, questions.length, isLoading, errorMessage, fetchQuestions]);

  // Handle question exhaustion: if we ran out of questions but game is still playing
  useEffect(() => {
    if (phase === "playing" && questions.length > 0 && currentQuestionIndex >= questions.length) {
      // No more questions — end the game gracefully
      setGamePhase(level >= MAX_LEVEL ? "victory" : "game_over");
    }
  }, [phase, questions.length, currentQuestionIndex, level, setGamePhase]);

  const handleAnswer = useCallback((ansId: string) => {
    if (phase !== "playing" || feedbackState || questions.length === 0) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const correct = ansId === currentQuestion.correct_option_id;

    showFeedback(correct, !correct && currentQuestion.explanation ? currentQuestion.explanation : undefined);
    playSound(correct ? "correct" : "incorrect");

    const willGameOver = !correct && lives <= 1;

    if (correct) {
      addScore(100 + level * 10);
    } else {
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
      } else if (!willGameOver) {
        // Wrong answer: advance question but don't advance level
        setCurrentQuestionIndex((prev) => prev + 1);
        playSound("slide");
      }
    }, 2000);
  }, [
    phase,
    level,
    lives,
    addScore,
    loseLife,
    nextLevel,
    setGamePhase,
    feedbackState,
    showFeedback,
    dismissFeedback,
    playSound,
    questions,
    currentQuestionIndex,
    safeTimeout,
  ]);

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
              if (engine.examMode) {
                // In exam mode, end as game_over so handleFinish fires and redirects
                setGamePhase("game_over");
              } else {
                setGamePhase("welcome");
              }
            }}
            className="px-8 py-4 bg-cyber-pink text-black rounded-2xl border-2 border-black/10 shadow-neo-sm hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-neo-sm active:translate-y-2 active:translate-x-2 active:shadow-none transition-all font-nunito font-black uppercase tracking-widest inline-block"
          >
            {engine.examMode ? "Devam Et" : "Geri Dön"}
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
        title: "Sözel Analoji",
        icon: GitBranch,
        description:
          "Kelimeler arasındaki gizli mantıksal ilişkiyi bul ve boşluğu doğru kelimeyle doldur!",
        howToPlay: [
          "İlk iki kelime arasındaki mantıksal ilişkiyi analiz et.",
          "Aynı ilişkiyi ikinci çifte de uygula.",
          "Doğru kelimeyi seçeneklerden bul.",
        ],
        tuzoCode: "6.2.2 Sözel İlişki Kurma",
        accentColor: "cyber-blue",
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
                className="w-full max-w-3xl space-y-4"
              >
                {/* Question Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border-2 border-black/10 shadow-neo-sm text-center relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-blue text-white px-4 py-1.5 rounded-full font-nunito font-black uppercase tracking-widest text-xs border-2 border-black/10 shadow-neo-sm">
                    İlişkiyi Bul
                  </div>

                  <motion.h2
                    key={level}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-2xl sm:text-4xl font-black font-nunito text-center uppercase tracking-widest leading-relaxed text-black dark:text-white mt-4 break-words"
                  >
                    {question.text}
                  </motion.h2>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options.map((opt, idx) => {
                    const isCorr = opt.id === question.correct_option_id;
                    const state = feedbackState !== null;

                    let btnClass = "bg-white dark:bg-slate-800 text-black dark:text-white";
                    if (state) {
                      if (isCorr) btnClass = "bg-cyber-green text-black animate-pulse";
                      else btnClass = "bg-slate-200 dark:bg-slate-700 text-slate-500 opacity-50";
                    }

                    return (
                      <motion.button
                        key={opt.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleAnswer(opt.id)}
                        disabled={state}
                        whileTap={!state ? { scale: 0.95 } : {}}
                        className={`p-4 sm:p-5 rounded-xl border-2 border-black/10 shadow-neo-sm font-nunito font-black text-base sm:text-lg transition-all flex items-center gap-3 active:translate-y-1 active:shadow-none ${btnClass}`}
                      >
                        <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-slate-700 border-2 border-black/10 flex items-center justify-center text-sm font-nunito font-black text-black">
                          {["A", "B", "C", "D"][idx]}
                        </span>
                        <span className="flex-1 text-left truncate">
                          {opt.text}
                        </span>
                        {state && isCorr && (
                          <CheckCircle2 className="text-black stroke-[3]" size={24} />
                        )}
                      </motion.button>
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

export default VerbalAnalogyGame;
