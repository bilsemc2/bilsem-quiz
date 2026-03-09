import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Loader2, Eye } from "lucide-react";
import GameOptionButton from "./shared/GameOptionButton";
import type { FeedbackResult } from "./shared/GameOptionButton";
import { supabase } from "../../lib/supabase";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameEngine } from "./shared/useGameEngine";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "cumle-ici-es-anlam";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: number;
  cumle: string;
  options: Option[];
  correct_option_id: string;
  dogru_kelime: string;
}

const SentenceSynonymGame: React.FC = () => {
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
  });

  const [isFetching, setIsFetching] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [, setErrorMessage] = useState("");
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;



  const fetchQuestions = useCallback(async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("cumle_ici_es_anlam_sorulari")
        .select(
          "id, cumle, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, dogru_kelime",
        )
        .limit(100);

      if (error) throw error;
      if (!data || data.length === 0) {
        setErrorMessage("Soru bulunamadı.");
        setIsFetching(false); engine.setGamePhase("game_over");
        return;
      }

      const shuffled = data.sort(() => Math.random() - 0.5).slice(0, MAX_LEVEL);
      const labels = ["a", "b", "c", "d"];

      const parsed: Question[] = shuffled.map((q) => {
        const raw = [
          { id: "a", t: q.secenek_a },
          { id: "b", t: q.secenek_b },
          { id: "c", t: q.secenek_c },
          { id: "d", t: q.secenek_d },
        ];
        const shuf = raw.sort(() => Math.random() - 0.5);
        const corrIdx = shuf.findIndex((o) => o.id === q.dogru_cevap);

        return {
          id: q.id,
          cumle: q.cumle,
          options: shuf.map((o, i) => ({ id: labels[i], text: o.t })),
          correct_option_id: labels[corrIdx],
          dogru_kelime: q.dogru_kelime,
        };
      });

      setQuestions(parsed);
      setIsFetching(false);
    } catch {
      setErrorMessage("Sorular yüklenirken hata oluştu.");
      setIsFetching(false); engine.setGamePhase("game_over");
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
    const correct = id === questions[engine.level - 1].correct_option_id;

    playSound(correct ? "correct" : "wrong");
    showFeedback(correct);

    const willGameOver = !correct && engine.lives <= 1;

    if (correct) {
      setStreak((p) => {
        const ns = p + 1;
        if (ns > bestStreak) setBestStreak(ns);
        return ns;
      });
      engine.addScore(100 + streak * 10);
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
    }, 1500);
  };




  const formatSentence = (t: string) => {
    const m = t.match(/^'(.+?)'\s*cümlesindeki/);
    return m ? m[1] : t;
  };

  if (isFetching) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FAF9F6] dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border-2 border-black/10 shadow-neo-sm flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-black dark:text-white animate-spin" />
          <span className="font-nunito font-black uppercase tracking-widest text-black dark:text-white">
            Sorular Hazırlanıyor...
          </span>
        </div>
      </div>
    );
  }

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Cümle İçi Eş Anlam",
        icon: MessageSquare,
        description: "Cümledeki kelimenin eş anlamlısını bul, bağlamsal zekanı kanıtla.",
        howToPlay: [
          "Cümlede vurgulanan kelimenin eş anlamlısını bul.",
          "Aşağıdaki seçeneklerden en uygun olanı işaretle.",
        ],
        tuzoCode: "6.1.2 Sözcük Bilgisi (Bağlam)",
        accentColor: "cyber-purple",
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
          {engine.phase === "playing" && questions[engine.level - 1] && (
            <motion.div
              key={engine.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl space-y-4"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border-2 border-black/10 shadow-neo-sm text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-purple text-white px-4 py-1.5 rounded-full font-nunito font-black uppercase tracking-widest text-xs border-2 border-black/10 shadow-neo-sm flex items-center gap-1.5">
                  <Eye size={14} className="stroke-[3]" /> Bağlamı Çöz
                </div>

                <h2 className="text-xl sm:text-2xl font-nunito font-black text-black dark:text-white leading-relaxed mt-4 mb-4">
                  "{formatSentence(questions[engine.level - 1].cumle)}"
                </h2>

                <div className="inline-flex px-4 py-1.5 bg-cyber-pink border-2 border-black/10 rounded-lg text-black font-nunito font-black uppercase tracking-wider text-sm shadow-neo-sm">
                  Doğru kelimeyi seç
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {questions[engine.level - 1].options.map((opt, i) => {
                  const isCorr = opt.id === questions[engine.level - 1].correct_option_id;
                  const isSelected = selectedAnswer === opt.id;
                  const showResult = !!selectedAnswer;

                  let result: FeedbackResult = null;
                  if (showResult) {
                    if (isCorr) result = "correct";
                    else if (isSelected) result = "wrong";
                    else result = "dimmed";
                  }

                  return (
                    <GameOptionButton
                      key={opt.id}
                      variant="text"
                      label={opt.text}
                      optionLetter={opt.id.toUpperCase()}
                      onClick={() => handleAnswer(opt.id)}
                      disabled={!!selectedAnswer}
                      feedbackResult={result}
                      animationDelay={i * 0.1}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}

        </div>
      )}
    </BrainTrainerShell>
  );
};

export default SentenceSynonymGame;
