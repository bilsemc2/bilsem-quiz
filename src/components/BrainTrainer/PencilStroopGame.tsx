import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';
const COLORS = [
  {
    name: "Kırmızı",
    hex: "#E91E63",
    colorClass: "text-[#E91E63]",
    bgClass: "bg-cyber-pink",
    lightBg: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    name: "Mavi",
    hex: GAME_COLORS.blue,
    colorClass: "text-cyber-blue",
    bgClass: "bg-cyber-blue",
    lightBg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    name: "Yeşil",
    hex: GAME_COLORS.emerald,
    colorClass: "text-cyber-green",
    bgClass: "bg-cyber-green",
    lightBg: "bg-green-50 dark:bg-green-950/30",
  },
  {
    name: "Sarı",
    hex: "#facc15",
    colorClass: "text-cyber-yellow",
    bgClass: "bg-cyber-yellow",
    lightBg: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  {
    name: "Mor",
    hex: GAME_COLORS.purple,
    colorClass: "text-cyber-purple",
    bgClass: "bg-cyber-purple",
    lightBg: "bg-purple-50 dark:bg-purple-950/30",
  },
];

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "kalem-stroop";

interface OptionStyle {
  textColor: (typeof COLORS)[0]; // color used to render the button label text
  bgColor: (typeof COLORS)[0]; // color used for the button background tint
}

interface Round {
  pencilColorObj: (typeof COLORS)[0];
  wordObj: (typeof COLORS)[0];
  labelTextColor: (typeof COLORS)[0]; // misleading color for the word on the pencil
  correctAnswer: string;
  options: (typeof COLORS)[0][];
  optionStyles: OptionStyle[]; // per-option misleading styles
}


const PencilStroopGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const generateRound = useCallback((): Round => {
    const colorIdx = Math.floor(Math.random() * COLORS.length);
    const pencilColorObj = COLORS[colorIdx];
    const correctAnswer = pencilColorObj.name;

    // Word on pencil: different from pencil color
    let wordIdx;
    do {
      wordIdx = Math.floor(Math.random() * COLORS.length);
    } while (wordIdx === colorIdx);
    const wordObj = COLORS[wordIdx];

    // Label text color on pencil: different from both pencil color and word
    let labelIdx;
    do {
      labelIdx = Math.floor(Math.random() * COLORS.length);
    } while (labelIdx === colorIdx || labelIdx === wordIdx);
    const labelTextColor = COLORS[labelIdx];

    // Generate 4 options including the correct answer
    const optsList = [pencilColorObj];
    const usedIndices = new Set([colorIdx]);

    while (optsList.length < 4) {
      const randomIdx = Math.floor(Math.random() * COLORS.length);
      if (!usedIndices.has(randomIdx)) {
        usedIndices.add(randomIdx);
        optsList.push(COLORS[randomIdx]);
      }
    }

    const shuffled = optsList.sort(() => Math.random() - 0.5);

    // Generate misleading styles for each option
    const optionStyles: OptionStyle[] = shuffled.map((opt) => {
      // Text color: pick a random color that is DIFFERENT from the option's actual name
      const otherColors = COLORS.filter(c => c.name !== opt.name);
      const textColor = otherColors[Math.floor(Math.random() * otherColors.length)];
      // Background tint: pick another random color different from the text color
      const bgOptions = COLORS.filter(c => c.name !== textColor.name);
      const bgColor = bgOptions[Math.floor(Math.random() * bgOptions.length)];
      return { textColor, bgColor };
    });

    return {
      pencilColorObj,
      wordObj,
      labelTextColor,
      correctAnswer,
      options: shuffled,
      optionStyles,
    };
  }, []);

  const setupRound = useCallback(() => {
    setCurrentRound(generateRound());
    setSelectedAnswer(null);
  }, [generateRound]);

  const prevLevelRef = React.useRef(level);

  useEffect(() => {
    if (phase === "playing") {
      // Detect restart: level went back to 1 (from handleStart) or no round exists
      if (!currentRound || level < prevLevelRef.current) {
        setupRound();
        playSound("slide");
      }
    } else if (phase === "welcome" || phase === "game_over" || phase === "victory") {
      setCurrentRound(null);
      setSelectedAnswer(null);
    }
    prevLevelRef.current = level;
  }, [phase, level, currentRound, setupRound, playSound]);

  const handleAnswer = (answer: string) => {
    if (phase !== "playing" || !!feedbackState || selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    const correct = answer === currentRound?.correctAnswer;

    showFeedback(correct);
    playSound(correct ? "correct" : "incorrect");

    safeTimeout(() => {
      dismissFeedback();
      if (correct) {
        addScore(20 + level * 5);
        nextLevel();
        if (level < MAX_LEVEL) {
          setupRound();
        }
      } else {
        loseLife();
        if (engine.lives > 1) {
          setupRound();
        }
      }
    }, 1500);
  };

  const gameConfig = {
    title: "Kalem Stroop",
    description: "Kalemin rengine odaklan, üzerindeki yazıya ve buton renklerine ALDANMA! Zihinsel hızını ve dikkatini kanıtla.",
    tuzoCode: "TUZÖ 5.1.1 Renk-Kelime Stroop",
    icon: Pencil,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <>Ekrandaki <strong>kalemin rengine</strong> bak, yazıya ve renklere aldanma</>,
      <>Butonların renkleri seni yanıltmaya çalışacak, dikkatli ol!</>,
      <>Zihinsel çelişkiyi yen ve <strong>en doğru kararı</strong> hızlıca ver</>,
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1">
          {currentRound && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md space-y-6"
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  key={currentRound.pencilColorObj.hex}
                  initial={{ rotate: -10, y: 20 }}
                  animate={{ rotate: 5, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative"
                >
                  <Pencil
                    size={140}
                    style={{
                      color: currentRound.pencilColorObj.hex,
                      fill: currentRound.pencilColorObj.hex,
                    }}
                    className="drop-shadow-[4px_4px_0_rgba(0,0,0,1)] dark:drop-shadow-[4px_4px_0_rgba(255,255,255,1)]"
                    strokeWidth={1}
                  />
                  <div className="absolute inset-x-0 top-[25%] flex justify-center text-center pointer-events-none origin-center transform -rotate-45">
                    <span
                      className="text-2xl sm:text-3xl font-black font-nunito uppercase tracking-widest px-3 py-1.5 border-3 border-white/30 shadow-[3px_3px_0_rgba(0,0,0,0.3)] rounded-md"
                      style={{
                        transform: "translateY(1.5rem)",
                        color: currentRound.labelTextColor.hex,
                        backgroundColor: "rgba(0,0,0,0.75)",
                        textShadow: `0 0 8px ${currentRound.labelTextColor.hex}40`,
                      }}
                    >
                      {currentRound.wordObj.name}
                    </span>
                  </div>
                </motion.div>

                <div className="bg-white dark:bg-slate-800 px-6 py-2.5 rounded-xl border-2 border-black/10 shadow-neo-sm">
                  <span className="text-xs sm:text-sm font-black font-nunito text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                    KALEMİN RENGİ NE?
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full px-2 relative z-20">
                {currentRound.options.map((opt, idx) => {
                  const isSelected = selectedAnswer === opt.name;
                  const isCorrect = isSelected && opt.name === currentRound.correctAnswer;
                  const isWrong = isSelected && opt.name !== currentRound.correctAnswer;
                  const style = currentRound.optionStyles[idx];

                  // After answer: show green/pink feedback. Before answer: misleading colors
                  let btnClass: string;
                  let textStyle: React.CSSProperties = {};

                  if (isCorrect) {
                    btnClass = "bg-cyber-green text-black";
                  } else if (isWrong) {
                    btnClass = "bg-cyber-pink text-black";
                  } else if (selectedAnswer !== null && opt.name === currentRound.correctAnswer) {
                    btnClass = "bg-cyber-green text-black";
                  } else {
                    // Misleading: colored background + colored text
                    btnClass = `${style.bgColor.lightBg} border-2 border-black/10`;
                    textStyle = { color: style.textColor.hex };
                  }

                  return (
                    <motion.button
                      key={opt.name}
                      whileTap={!selectedAnswer ? { scale: 0.95 } : {}}
                      onClick={() => handleAnswer(opt.name)}
                      disabled={selectedAnswer !== null || !!feedbackState}
                      className={`p-4 border-2 border-black/10 rounded-xl font-nunito font-black text-xl sm:text-2xl shadow-neo-sm transition-colors relative overflow-hidden active:translate-y-1 active:shadow-none ${btnClass}`}
                    >
                      <span className="relative z-10" style={textStyle}>
                        {opt.name}
                      </span>
                    </motion.button>
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

export default PencilStroopGame;
