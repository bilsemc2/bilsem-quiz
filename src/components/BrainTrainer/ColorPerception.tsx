import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Palette } from "lucide-react";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import {
  COLORS,
  MAX_LEVEL,
  useColorPerceptionController,
} from "./colorPerception/useColorPerceptionController";

const ColorPerception: React.FC = () => {
  const {
    engine,
    feedback,
    localPhase,
    currentColors,
    userSelections,
    handleColorSelect,
  } = useColorPerceptionController();
  const { phase, level } = engine;

  const gameConfig = {
    title: "Renk Algılama",
    description: "Ekranda beliren renkleri hızla ezberle ve doğru seç! Görsel işlem hızını ve belleğini geliştir.",
    tuzoCode: "TUZÖ 5.4.1 Görsel Kısa Süreli Bellek",
    icon: Palette,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Ekranda bir grup rengi göreceksin, onları aklında tut",
      "Renkler kaybolunca, gördüğün tüm renkleri butonlardan seç",
      "İlerledikçe renk sayısı artacak ve süre kısalacak!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full">
          {phase === "playing" && (
            <motion.div
              key={`game-${level}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6"
            >
              <div className="rounded-2xl overflow-hidden aspect-square relative shadow-neo-sm border-2 border-black/10 bg-white dark:bg-slate-800 p-2">
                <AnimatePresence>
                  {localPhase === "showing" && (
                    <motion.div
                      key="colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      className="absolute inset-0 flex flex-col sm:flex-row gap-1.5 p-1.5"
                    >
                      {currentColors.map((colorName, idx) => (
                        <div
                          key={idx}
                          className="flex-1 w-full h-full rounded-xl border-2 border-black/10 mx-0.5 mb-0.5 sm:mb-0 shadow-inner"
                          style={{ backgroundColor: COLORS[colorName] }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {localPhase === "guessing" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-6">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center bg-cyber-pink border-2 border-black/10 shadow-neo-sm"
                    >
                      <Target
                        size={40}
                        className="text-black"
                        strokeWidth={2.5}
                      />
                    </motion.div>
                    <h4 className="text-xl sm:text-2xl font-nunito font-black text-black dark:text-white uppercase tracking-tighter">
                      Renkleri Seç!
                    </h4>
                    <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-black/10 shadow-neo-sm flex-wrap justify-center">
                      {currentColors.map((_, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg transition-all duration-300 border-2 border-black/10 shadow-neo-sm"
                          style={{
                            background: userSelections[i]
                              ? COLORS[userSelections[i]]
                              : "rgba(0,0,0,0.1)",
                            borderColor: userSelections[i]
                              ? "#000"
                              : "rgba(0,0,0,0.3)",
                            borderStyle: userSelections[i] ? "solid" : "dashed",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {localPhase === "showing" && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-sm font-nunito font-black tracking-widest text-black dark:text-white border-2 border-black/10 uppercase shadow-neo-sm z-20">
                    EZBERLE!
                  </div>
                )}
              </div>

              <div
                className={`grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 transition-all duration-300 ${localPhase === "guessing" ? "opacity-100 scale-100" : "opacity-30 scale-95 pointer-events-none"} md:h-full md:content-center`}
              >
                {Object.entries(COLORS).map(([name, code]) => {
                  const isSelected = userSelections.includes(name);
                  return (
                    <motion.button
                      key={name}
                      whileTap={!isSelected ? { scale: 0.95 } : {}}
                      onClick={() => handleColorSelect(name)}
                      disabled={isSelected}
                      className={`aspect-square sm:aspect-auto sm:p-4 mb-1 rounded-xl font-nunito font-black text-black uppercase shadow-neo-sm border-2 border-black/10 transition-all ${!isSelected ? "" : "opacity-50 shadow-neo-sm translate-y-1"} bg-white`}
                    >
                      <div
                        className="w-full h-full sm:h-10 rounded-lg border-2 border-black/10 mb-1 shadow-[inset_-2px_-4px_0_rgba(0,0,0,0.2)]"
                        style={{ backgroundColor: code }}
                      />
                      <span className="hidden sm:block text-xs sm:text-sm tracking-widest text-black">
                        {name}
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

export default ColorPerception;
