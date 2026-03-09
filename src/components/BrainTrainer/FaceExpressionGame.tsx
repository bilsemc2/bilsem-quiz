import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Smile, Eye } from "lucide-react";
import GameOptionButton from "./shared/GameOptionButton";
import type { FeedbackResult } from "./shared/GameOptionButton";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGamePerformanceTracker } from "../../hooks/useGamePerformanceTracker";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';

const GAME_ID = "yuz-ifadesi";
const MAX_LEVEL = 20;
const GAME_TITLE = "Yüz İfadesi Tanıma";
const GAME_DESCRIPTION = "Duyguları gözlerinden tanı! Emojilerin hangi duyguyu temsil ettiğini bul ve empati yeteneğini geliştir.";
const TUZO_TEXT = "TUZÖ 7.1.1 Sosyal Algı";

const EMOTIONS = [
  { id: "mutlu", name: "Mutlu", emoji: "😊", description: "Neşeli, sevinçli", color: GAME_COLORS.yellow },
  { id: "uzgun", name: "Üzgün", emoji: "😢", description: "Kederli, hüzünlü", color: GAME_COLORS.blue },
  { id: "kizgin", name: "Kızgın", emoji: "😠", description: "Öfkeli, sinirli", color: GAME_COLORS.incorrect },
  { id: "saskin", name: "Şaşkın", emoji: "😲", description: "Hayret içinde", color: GAME_COLORS.orange },
  { id: "korkmus", name: "Korkmuş", emoji: "😨", description: "Ürkmüş, endişeli", color: GAME_COLORS.purple },
  { id: "igrenme", name: "İğrenme", emoji: "🤢", description: "Tiksinmiş", color: GAME_COLORS.emerald },
  { id: "notr", name: "Sakin", emoji: "😐", description: "Tarafsız, sakin", color: "#64748b" },
  { id: "bikkin", name: "Bıkkın", emoji: "😒", description: "Sıkılmış, bıkmış", color: GAME_COLORS.orange },
  { id: "dusunceli", name: "Düşünceli", emoji: "🤔", description: "Derin düşüncede", color: GAME_COLORS.blue },
];

const EXPRESSION_VARIANTS: Record<string, string[]> = {
  mutlu: ["😊", "😄", "😁", "😃"],
  uzgun: ["😢", "😞", "😔", "🙁"],
  kizgin: ["😠", "😡", "😤", "🤬"],
  saskin: ["😲", "😮", "😯", "😳"],
  korkmus: ["😨", "😰", "😱", "😧"],
  igrenme: ["🤢", "🤮", "😷", "😝"],
  notr: ["😐", "😑", "😶"],
  bikkin: ["😒", "🙄", "😮‍💨"],
  dusunceli: ["🤔", "🧐", "🤨", "🫤"],
};

interface Question {
  emoji: string;
  correctEmotion: (typeof EMOTIONS)[0];
  options: (typeof EMOTIONS)[0][];
}

const FaceExpressionGame: React.FC = () => {
  const questionStartedAtRef = React.useRef(0);
  const { performanceRef, recordAttempt, resetPerformance } = useGamePerformanceTracker();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
    getPerformanceSnapshot: () => performanceRef.current,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, lives, addScore, loseLife, nextLevel } = engine;

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const generateQuestion = useCallback((): Question => {
    const correctEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
    const variants = EXPRESSION_VARIANTS[correctEmotion.id];
    const emoji = variants[Math.floor(Math.random() * variants.length)];
    const wrongOptions = EMOTIONS.filter((e) => e.id !== correctEmotion.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [correctEmotion, ...wrongOptions].sort(() => Math.random() - 0.5);
    return { emoji, correctEmotion, options };
  }, []);

  const startLevel = useCallback(() => {
    setCurrentQuestion(generateQuestion());
    setSelectedAnswer(null);
    questionStartedAtRef.current = Date.now();
  }, [generateQuestion]);

  useEffect(() => {
    if (phase === "playing" && !currentQuestion) {
      startLevel();
    } else if (phase === "welcome" || phase === "game_over" || phase === "victory") {
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setStreak(0);
      resetPerformance();
    }
  }, [phase, currentQuestion, startLevel, resetPerformance]);

  const handleAnswer = useCallback((emotionId: string) => {
    if (phase !== "playing" || !!feedbackState || !currentQuestion || selectedAnswer !== null) return;

    setSelectedAnswer(emotionId);
    const isCorrect = emotionId === currentQuestion.correctEmotion.id;
    recordAttempt({
      isCorrect,
      responseMs: questionStartedAtRef.current > 0 ? Date.now() - questionStartedAtRef.current : null
    });
    showFeedback(isCorrect);
    playSound(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      addScore(10 * level + newStreak * 5);

      safeTimeout(() => {
        dismissFeedback();
        if (level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
        } else {
          nextLevel();
          startLevel();
        }
      }, 1000);
    } else {
      setStreak(0);
      loseLife();
      safeTimeout(() => {
        dismissFeedback();
        if (lives > 1) {
          startLevel();
        }
      }, 1000);
    }
  }, [phase, feedbackState, currentQuestion, selectedAnswer, showFeedback, dismissFeedback, playSound, streak, addScore, level, nextLevel, loseLife, lives, startLevel, safeTimeout, engine, recordAttempt]);

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Eye,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Ekrana gelen yüz ifadesini dikkatle incele.",
      "Alttaki seçeneklerden doğru duyguyu seç.",
      "Hızlı ve doğru cevaplarla en yüksek skora ulaş!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full">
          {phase === "playing" && currentQuestion && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center space-y-6"
            >
              <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm relative overflow-hidden">
                <p className="text-slate-500 dark:text-slate-400 font-nunito font-black mb-3 text-xs sm:text-sm tracking-widest uppercase">
                  BU HANGİ DUYGU?
                </p>
                <motion.div
                  key={level}
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="text-7xl sm:text-8xl mb-1"
                >
                  {currentQuestion.emoji}
                </motion.div>
                <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                  <Smile size={140} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full px-2 relative z-20">
                {currentQuestion.options.map((emotion) => {
                  const isSelected = selectedAnswer === emotion.id;
                  const isCorrect = emotion.id === currentQuestion.correctEmotion.id;
                  const showResult = selectedAnswer !== null;

                  let result: FeedbackResult = null;
                  if (showResult) {
                    if (isCorrect) result = "correct";
                    else if (isSelected) result = "wrong";
                    else result = "dimmed";
                  }

                  return (
                    <GameOptionButton
                      key={emotion.id}
                      variant="text"
                      label={emotion.name}
                      onClick={() => handleAnswer(emotion.id)}
                      disabled={selectedAnswer !== null || !!feedbackState}
                      feedbackResult={result}
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

export default FaceExpressionGame;
