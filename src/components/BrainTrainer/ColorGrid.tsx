import React from "react";
import { motion } from "framer-motion";
import { Grid3X3 } from "lucide-react";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { MAX_LEVEL, getColorById } from "./colorGrid/logic";
import { useColorGridController } from "./colorGrid/useColorGridController";

const ColorGrid: React.FC = () => {
  const { engine, feedback, localPhase, cells, handleCellClick } =
    useColorGridController();
  const { phase } = engine;

  const gameConfig = {
    title: "Renk Sekansı",
    description: "Renklerin yanış sırasını aklında tut ve aynı sırayla tekrarla! Görsel hafızanı zirveye taşı.",
    tuzoCode: "TUZÖ 5.4.2 Görsel Kısa Süreli Bellek",
    icon: Grid3X3,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Ekranda yanıp sönen renkli kutuları izle",
      "Sıra sana geldiğinde aynı kutulara aynı sırayla tıkla",
      "Her seviyede kutu sayısı ve hız artacak!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-md mx-auto">
          {phase === "playing" && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <div className="text-center mb-4">
                <motion.div
                  animate={{
                    scale: localPhase === "showing" ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`inline-block px-4 py-2 border-2 border-black/10 shadow-neo-sm rounded-xl ${localPhase === "showing" ? "bg-white dark:bg-slate-800" : "bg-cyber-yellow"}`}
                >
                  <p className="text-lg sm:text-xl font-nunito font-black uppercase tracking-widest text-black dark:text-white">
                    {localPhase === "showing" ? "👀 DİKKATLE İZLE" : "🎯 SIRA SENDE"}
                  </p>
                </motion.div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm aspect-square flex flex-col justify-center">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 h-full">
                  {cells.map((cell) => {
                    const color = cell.activeColor ? getColorById(cell.activeColor) : undefined;
                    return (
                      <motion.button
                        key={cell.id}
                        whileTap={localPhase === "playing" ? { scale: 0.9 } : {}}
                        onClick={() => handleCellClick(cell.id)}
                        className={`rounded-xl sm:rounded-2xl border-2 border-black/10 transition-all duration-300 w-full h-full ${cell.activeColor ? "shadow-none translate-y-1" : "shadow-neo-sm"}`}
                        style={{
                          backgroundColor: cell.activeColor ? color?.hex : "var(--tw-colors-slate-100)",
                        }}
                      >
                        {!cell.activeColor && (
                          <div className="w-full h-full rounded-lg sm:rounded-xl transition-colors dark:bg-slate-700 bg-slate-50" />
                        )}
                        {cell.activeColor && (
                          <div
                            className="w-full h-full rounded-lg sm:rounded-xl shadow-[inset_-2px_-4px_0_rgba(0,0,0,0.2)]"
                            style={{ backgroundColor: color?.hex }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ColorGrid;
