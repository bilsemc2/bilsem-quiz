import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from "lucide-react";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { MAX_LEVEL, POSITION_CLASS, getStepsRemaining } from "./directionStroop/logic";
import { useDirectionStroopController } from "./directionStroop/useDirectionStroopController";

const DirectionStroopGame: React.FC = () => {
  const {
    engine,
    feedback,
    currentRound,
    playerPos,
    targetPos,
    gridSize,
    handleAnswer,
  } = useDirectionStroopController();
  const { phase } = engine;

  const stepsRemaining = useMemo(
    () => getStepsRemaining(playerPos, targetPos),
    [playerPos, targetPos],
  );

  const gameConfig = {
    title: "Yön Stroop",
    description: "Hedefe ulaşmak için Stroop etkisini atlatmalısın! Kelimenin ne dediğine değil, nerede olduğuna bak.",
    tuzoCode: "TUZÖ 5.1.2 Uzamsal Stroop & İnhibisyon",
    icon: Compass,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    howToPlay: [
      "Ekrandaki kelimenin anlamına ALDANMA, bulunduğu konuma bak.",
      "Doğru konumu seçerek hedefe doğru ilerle!",
      "Her doğru cevap seni hedefe bir adım yaklaştırır.",
    ],
  };

  const cellSize = gridSize <= 5 ? "w-10 h-10 sm:w-11 sm:h-11" : "w-8 h-8 sm:w-9 sm:h-9";
  const btnClass = "p-2.5 sm:p-3 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-neo-sm active:translate-y-1 active:shadow-none transition-all text-black dark:text-white";

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full max-w-4xl mx-auto">
          {phase === "playing" && currentRound && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 w-full"
            >
              {/* Grid area with Stroop word */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative p-8 sm:p-10 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm">
                  {/* Stroop word at edge of container */}
                  <motion.div
                    key={`${currentRound.word}-${currentRound.position}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`absolute z-10 bg-cyber-blue px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg shadow-neo-sm select-none ${POSITION_CLASS[currentRound.position]}`}
                  >
                    <span className="text-lg sm:text-xl font-black tracking-widest italic text-white">{currentRound.word}</span>
                  </motion.div>

                  {/* Navigation grid */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                    {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                      const row = Math.floor(i / gridSize);
                      const col = i % gridSize;
                      const isPlayer = row === playerPos.row && col === playerPos.col;
                      const isTarget = row === targetPos.row && col === targetPos.col;

                      return (
                        <div
                          key={i}
                          className={`${cellSize} rounded-lg border-2 flex items-center justify-center transition-colors duration-300 ${isPlayer ? "bg-cyber-blue border-cyber-blue"
                              : isTarget ? "bg-cyber-pink/20 border-cyber-pink border-dashed"
                                : "bg-slate-100 dark:bg-slate-700/40 border-transparent"
                            }`}
                        >
                          {isPlayer && (
                            <motion.div
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                          {isTarget && !isPlayer && (
                            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                              <Star size={gridSize <= 5 ? 20 : 16} className="text-cyber-pink fill-cyber-pink" />
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-sm font-bold text-black/50 dark:text-white/50 tracking-wide">🎯 {stepsRemaining} adım kaldı</p>
              </div>

              {/* Direction buttons — cross pattern */}
              <div className="grid grid-cols-3 gap-2 w-[200px] sm:w-[220px] flex-shrink-0">
                <div />
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAnswer("Yukarı")} className={btnClass}>
                  <ArrowUp size={22} strokeWidth={3} />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase">Yukarı</span>
                </motion.button>
                <div />

                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAnswer("Sol")} className={btnClass}>
                  <ArrowLeft size={22} strokeWidth={3} />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase">Sol</span>
                </motion.button>
                <div />
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAnswer("Sağ")} className={btnClass}>
                  <ArrowRight size={22} strokeWidth={3} />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase">Sağ</span>
                </motion.button>

                <div />
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAnswer("Aşağı")} className={btnClass}>
                  <ArrowDown size={22} strokeWidth={3} />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase">Aşağı</span>
                </motion.button>
                <div />
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default DirectionStroopGame;
