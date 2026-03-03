import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, AlertCircle } from "lucide-react";
import GameOptionButton from "./shared/GameOptionButton";
import type { FeedbackResult } from "./shared/GameOptionButton";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "bilgi-kartlari-bosluk-doldur";
const GAME_TITLE = "Bilgi Kartları";
const GAME_DESCRIPTION = "Genel kültürünü ve kelime dağarcığını test et! Cümlelerdeki eksik kelimeleri bul ve bilgi ustası ol.";
const TUZO_TEXT = "TUZÖ 6.3.1 Genel Bilgi";

interface Question {
  id: string;
  originalText: string;
  displayText: string;
  correctAnswer: string;
  options: string[];
}

const KEY_WORDS = [
  "beyin", "kalp", "akciğer", "böbrek", "mide", "karaciğer", "kemik", "kas", "deri", "kan",
  "oksijen", "karbondioksit", "su", "enerji", "besin", "vitamin", "protein", "mineral",
  "bitki", "hayvan", "böcek", "kuş", "balık", "memeli", "sürüngen", "kurbağa",
  "güneş", "ay", "dünya", "mevsim", "yaz", "kış", "ilkbahar", "sonbahar",
  "atom", "molekül", "hücre", "organ", "sistem", "vücut", "iskelet", "sinir",
  "fotosentez", "solunum", "sindirim", "dolaşım", "boşaltım",
];

const KnowledgeCardGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const location = useLocation();

  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [localPhase, setLocalPhase] = useState<"loading" | "playing" | "error">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [streak, setStreak] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const createBlankFromSentence = (text: string): { displayText: string; answer: string } | null => {
    const words = text.split(/\s+/);
    for (const keyWord of KEY_WORDS) {
      const wordIndex = words.findIndex((w) => w.toLowerCase().replace(/[.,;:!?()]/g, "") === keyWord.toLowerCase());
      if (wordIndex !== -1) {
        const originalWord = words[wordIndex].replace(/[.,;:!?()]/g, "");
        const punctuation = words[wordIndex].replace(originalWord, "");
        words[wordIndex] = "_____" + punctuation;
        return { displayText: words.join(" "), answer: originalWord };
      }
    }
    const longWords = words
      .map((w, i) => ({ word: w.replace(/[.,;:!?()]/g, ""), index: i, original: w }))
      .filter((w) => w.word.length >= 4 && !["için", "veya", "gibi"].includes(w.word.toLowerCase()));

    if (longWords.length === 0) return null;

    const selected = longWords[Math.floor(Math.random() * longWords.length)];
    const punctuation = selected.original.replace(selected.word, "");
    words[selected.index] = "_____" + punctuation;
    return { displayText: words.join(" "), answer: selected.word };
  };

  const fetchQuestions = useCallback(async () => {
    setLocalPhase("loading");
    try {
      const { data, error } = await supabase
        .from("bilgi_kartlari")
        .select("id, icerik")
        .eq("is_active", true)
        .limit(100);

      if (error) throw error;
      if (!data || data.length === 0) {
        setErrorMessage("Bilgi kartı bulunamadı.");
        setLocalPhase("error");
        return;
      }

      const allAnswers: string[] = [];
      const processed: Question[] = [];
      const shuffled = data.sort(() => Math.random() - 0.5);

      for (const card of shuffled) {
        if (processed.length >= 20) break; // MAX_LEVEL
        const res = createBlankFromSentence(card.icerik);
        if (res) {
          allAnswers.push(res.answer);
          processed.push({
            id: card.id,
            originalText: card.icerik,
            displayText: res.displayText,
            correctAnswer: res.answer,
            options: [],
          });
        }
      }

      const finalQuestions = processed.map((q) => {
        const wrong = allAnswers
          .filter((a) => a.toLowerCase() !== q.correctAnswer.toLowerCase())
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        while (wrong.length < 3) {
          const r = KEY_WORDS[Math.floor(Math.random() * KEY_WORDS.length)];
          if (!wrong.includes(r) && r.toLowerCase() !== q.correctAnswer.toLowerCase()) {
            wrong.push(r);
          }
        }

        return {
          ...q,
          options: [q.correctAnswer, ...wrong].sort(() => Math.random() - 0.5),
        };
      });

      if (finalQuestions.length === 0) {
        setErrorMessage("Geçerli soru oluşturulamadı.");
        setLocalPhase("error");
        return;
      }

      setQuestions(finalQuestions);
      setLocalPhase("playing");
    } catch {
      setErrorMessage("Yükleme hatası.");
      setLocalPhase("error");
    }
  }, []);

  useEffect(() => {
    if (phase === "playing" && questions.length === 0 && localPhase === "loading") {
      fetchQuestions();
    } else if (phase === "welcome") {
      setQuestions([]);
      setStreak(0);
      setLocalPhase("loading");
      setErrorMessage("");
    }
  }, [phase, questions.length, localPhase, fetchQuestions]);

  const handleAnswer = (answer: string) => {
    if (feedbackState || localPhase !== "playing" || !questions[level - 1]) return;

    const currentQ = questions[level - 1];
    const isCorrect = answer.toLowerCase() === currentQ.correctAnswer.toLowerCase();

    showFeedback(isCorrect);
    playSound(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      addScore(10 * level + newStreak * 5);

      safeTimeout(() => {
        dismissFeedback();
        nextLevel();
      }, 1200);
    } else {
      setStreak(0);
      loseLife();

      safeTimeout(() => {
        dismissFeedback();
        if (engine.lives > 1) { // Will handle game over inside useGameEngine
          nextLevel();
        }
      }, 1200);
    }
  };

  const backLink = location.state?.arcadeMode
    ? "/bilsem-zeka"
    : "/atolyeler/bireysel-degerlendirme";

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: BookOpen,
    accentColor: "cyber-pink",
    maxLevel: 20,
    wideLayout: true,
    howToPlay: [
      "Cümledeki eksik bölümü dikkatle oku.",
      "Anlamı tamamlayan doğru kelimeyi seç.",
      "3 canın bitmeden 20 soruyu başarıyla tamamla!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center flex-1 p-4 mb-4 mt-8 w-full max-w-4xl mx-auto">
          {localPhase === "loading" && phase === "playing" && (
            <div className="flex flex-col items-center justify-center p-6 sm:p-10">
              <Loader2 size={48} className="text-cyber-blue animate-spin drop-shadow-sm mb-4" />
              <p className="font-nunito font-bold text-slate-500 uppercase tracking-widest">KARTLAR HAZIRLANIYOR...</p>
            </div>
          )}

          {localPhase === "error" && phase === "playing" && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-black/10 shadow-neo-sm text-center max-w-md mx-auto">
              <AlertCircle size={48} className="text-cyber-pink mx-auto mb-4" />
              <h2 className="text-xl font-nunito font-black text-black dark:text-white mb-2">
                Hata Oluştu
              </h2>
              <p className="text-slate-600 dark:text-slate-300 font-nunito mb-6">
                {errorMessage}
              </p>
              <Link
                to={backLink}
                className="px-6 py-3 bg-cyber-pink text-black rounded-xl font-nunito font-bold border-2 border-black/10 shadow-neo-sm inline-block"
              >
                Geri Dön
              </Link>
            </div>
          )}

          {localPhase === "playing" && phase === "playing" && questions[level - 1] && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-3xl space-y-4"
            >
              <div className="w-full p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-pink text-white px-4 py-1.5 rounded-full font-nunito font-black uppercase tracking-widest text-xs border-2 border-black/10 shadow-neo-sm">
                  Cümleyi Tamamla
                </div>
                <motion.h2
                  key={level}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-xl lg:text-2xl font-nunito font-medium leading-relaxed text-slate-800 dark:text-slate-100 mt-4"
                >
                  {questions[level - 1].displayText
                    .split("_____")
                    .map((p, i, a) => (
                      <React.Fragment key={i}>
                        {p}
                        {i < a.length - 1 && (
                          <span className="inline-block px-2 py-0.5 rounded-lg mx-1.5 border-2 border-dashed bg-slate-100 dark:bg-slate-700 border-slate-400 text-slate-400 font-nunito font-bold">
                            .....
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                </motion.h2>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                {questions[level - 1].options.map((opt, i) => {
                  const isCorrect = opt.toLowerCase() === questions[level - 1].correctAnswer.toLowerCase();
                  const showResult = !!feedbackState;

                  let result: FeedbackResult = null;
                  if (showResult) {
                    result = isCorrect ? "correct" : "dimmed";
                  }

                  return (
                    <GameOptionButton
                      key={i}
                      variant="text"
                      label={opt}
                      optionLetter={String.fromCharCode(65 + i)}
                      onClick={() => handleAnswer(opt)}
                      disabled={showResult}
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

export default KnowledgeCardGame;
