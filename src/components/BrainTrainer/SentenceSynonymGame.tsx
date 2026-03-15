import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Loader2, Eye } from "lucide-react";
import GameOptionButton from "./shared/GameOptionButton";
import type { FeedbackResult } from "./shared/GameOptionButton";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { MAX_LEVEL, formatSentence } from "./sentenceSynonym/logic";
import { useSentenceSynonymController } from "./sentenceSynonym/useSentenceSynonymController";

const SentenceSynonymGame: React.FC = () => {
  const {
    engine,
    feedback,
    isFetching,
    questions,
    selectedAnswer,
    handleAnswer,
  } = useSentenceSynonymController();

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
