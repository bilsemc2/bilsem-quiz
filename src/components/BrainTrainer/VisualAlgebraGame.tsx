import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Scale, Eye, EyeOff, HelpCircle, Target } from "lucide-react";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useSound } from "../../hooks/useSound";
import { ShapeType, PanContent, calcWeight, genLevel, getShapesForLevel, ShapeIcon } from "./visualAlgebraTypes";
import type { LevelData } from "./visualAlgebraTypes";
import BalanceScale from "./BalanceScale";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "gorsel-cebir-dengesi";

const VisualAlgebraGame: React.FC = () => {
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

  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [userRightPan, setUserRightPan] = useState<PanContent>({});
  const [showWeights, setShowWeights] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  useEffect(() => {
    if (engine.phase === "playing") {
      setLevelData(genLevel(engine.level));
      setUserRightPan({});
      setShowWeights(false);
    } else if (engine.phase === "welcome") {
      setLevelData(null);
      setUserRightPan({});
      setShowWeights(false);
    }
  }, [engine.phase, engine.level]);

  const checkAnswer = useCallback(() => {
    if (!levelData || !!feedbackState || engine.phase !== "playing") return;

    const correct =
      calcWeight(levelData.question.left, levelData.weights) ===
      calcWeight(userRightPan, levelData.weights);

    playSound(correct ? "correct" : "incorrect");
    showFeedback(correct);

    const willGameOver = !correct && engine.lives <= 1;
    if (correct) engine.addScore(10 * engine.level);
    else engine.loseLife();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = safeTimeout(() => {
      timeoutRef.current = null;
      dismissFeedback();
      if (correct) {
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          playSound("slide");
        }
      } else if (!willGameOver) {
        setUserRightPan({});
        playSound("pop");
      }
    }, 1500);
  }, [levelData, feedbackState, engine, userRightPan, playSound, showFeedback, dismissFeedback]);

  const addToPan = (s: ShapeType) => {
    if (engine.phase === "playing" && !feedbackState) {
      setUserRightPan((p) => ({ ...p, [s]: (p[s] || 0) + 1 }));
      playSound("pop");
    }
  };

  const removeFromPan = (s: ShapeType) => {
    if (engine.phase === "playing" && userRightPan[s] && !feedbackState) {
      setUserRightPan((p) => {
        const nc = p[s]! - 1;
        if (nc === 0) { const r = { ...p }; delete r[s]; return r; }
        return { ...p, [s]: nc };
      });
      playSound("pop");
    }
  };

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Görsel Cebir",
        icon: Scale,
        description: "Terazileri dengeleyerek şekiller arasındaki gizli matematiksel ilişkileri çöz!",
        howToPlay: [
          "Üstteki referans teraziye bakarak ağırlıkları bul",
          "Alttaki soru terazisine şekiller ekle",
          "Her iki kefedeki ağırlıklar eşitlendiğinde kontrol et",
        ],
        tuzoCode: "5.5.2 Kural Çıkarsama",
        accentColor: "cyber-blue",
        wideLayout: true,
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => {
        if (!levelData) return null;

        return (
          <div className="w-full flex justify-center items-center flex-1 h-full pt-2 pb-4">
            {engine.phase === "playing" && (
              <motion.div
                key={`lvl-${engine.level}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.1 } }}
                className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 sm:gap-8 items-stretch"
              >
                {/* Reference Scale */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 lg:p-6 border-2 border-black/10 shadow-neo-sm relative overflow-hidden">
                  <div className="absolute inset-0 pattern-grid opacity-10 dark:opacity-5 pointer-events-none" />
                  <span className="absolute top-4 sm:top-6 left-6 sm:left-8 text-[10px] sm:text-xs font-nunito font-black uppercase text-cyber-purple tracking-widest flex items-center gap-2 bg-white dark:bg-slate-800 px-2 sm:px-3 py-1 rounded-lg border-2 border-black/10 z-10">
                    <HelpCircle size={16} className="stroke-[3]" /> REFERANS
                  </span>
                  <div className="mt-8 scale-90 sm:scale-100 origin-center">
                    <BalanceScale
                      left={levelData.referenceEquation.left}
                      right={levelData.referenceEquation.right}
                      weights={levelData.weights}
                      showWeights={showWeights}
                      feedbackState={feedbackState}
                    />
                  </div>
                  <div className="mt-4 text-center text-xs font-nunito font-black text-black uppercase tracking-widest bg-cyber-green border-2 border-black/10 rounded-full py-1.5 shadow-neo-sm mx-auto max-w-[140px] relative z-10">
                    DENGEDE
                  </div>
                </div>

                {/* Question Scale */}
                <div
                  className={`flex-[1.5] rounded-2xl p-4 lg:p-6 border-2 shadow-neo-sm relative transition-colors duration-300 flex flex-col ${feedbackState ? (feedbackState.correct ? "bg-cyber-green/15 border-cyber-green ring-2 ring-cyber-green" : "bg-cyber-pink/15 border-cyber-pink ring-2 ring-cyber-pink") : "bg-slate-100 dark:bg-slate-800/80 border-black/10"}`}
                >
                  <div className="absolute inset-0 pattern-grid opacity-10 dark:opacity-5 pointer-events-none" />
                  <div className="flex justify-between items-center mb-0 sm:mb-4 relative z-10">
                    <span className="text-[10px] sm:text-xs font-nunito font-black uppercase text-black dark:text-white tracking-widest flex items-center gap-2 bg-white dark:bg-slate-800 px-2 sm:px-3 py-1 rounded-lg border-2 border-black/10">
                      <Target size={16} className="stroke-[3]" /> SORU
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowWeights(!showWeights)}
                        className="p-2 sm:p-3 bg-white border-2 border-black/10 rounded-xl hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none transition-all text-black"
                        title="Ağırlıkları Göster"
                      >
                        {showWeights ? (
                          <EyeOff size={18} strokeWidth={2.5} className="sm:w-5 sm:h-5" />
                        ) : (
                          <Eye size={18} strokeWidth={2.5} className="sm:w-5 sm:h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (!feedbackState) { setUserRightPan({}); playSound("slide"); }
                        }}
                        disabled={!!feedbackState}
                        className="p-2 sm:p-3 bg-cyber-pink border-2 border-black/10 rounded-xl hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none transition-all text-black disabled:opacity-50"
                        title="Temizle"
                      >
                        X
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center relative z-10 scale-90 sm:scale-100 origin-center mt-4 sm:mt-0">
                    <BalanceScale
                      left={levelData.question.left}
                      right={userRightPan}
                      weights={levelData.weights}
                      interactive
                      showWeights={showWeights}
                      feedbackState={feedbackState}
                      onRemoveFromPan={removeFromPan}
                    />
                  </div>

                  <div className="mt-4 sm:mt-8 flex flex-col gap-4 relative z-10">
                    <div className="flex justify-center gap-2 sm:gap-4 flex-wrap bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-2xl border-2 border-black/10 shadow-neo-sm">
                      {getShapesForLevel(engine.level).map((s) => (
                        <motion.button
                          key={s}
                          whileTap={!feedbackState ? { scale: 0.95 } : {}}
                          onClick={() => addToPan(s)}
                          disabled={!!feedbackState}
                          className={`p-2 sm:p-3 rounded-xl border-2 border-black/10 bg-slate-50 dark:bg-slate-700 shadow-neo-sm transition-colors ${feedbackState ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-600"}`}
                        >
                          <ShapeIcon
                            type={s}
                            weight={showWeights ? levelData.weights[s] : undefined}
                            className="w-6 h-6 sm:w-8 sm:h-8"
                          />
                        </motion.button>
                      ))}
                    </div>

                    <button
                      onClick={checkAnswer}
                      disabled={!!feedbackState || Object.keys(userRightPan).length === 0}
                      className="w-full py-3 sm:py-4 bg-cyber-blue text-white font-nunito font-black text-lg sm:text-xl uppercase tracking-widest border-2 border-black/10 rounded-2xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-neo-sm"
                    >
                      DENGE KONTROL (ONAYLA)
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            <style>{`
              .pattern-grid {
                background-image: 
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px);
                background-size: 20px 20px;
              }
              .dark .pattern-grid {
                background-image: 
                  linear-gradient(to right, #fff 1px, transparent 1px),
                  linear-gradient(to bottom, #fff 1px, transparent 1px);
              }
            `}</style>
          </div>
        );
      }}
    </BrainTrainerShell>
  );
};

export default VisualAlgebraGame;
