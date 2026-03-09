import { motion } from "framer-motion";
import { Eye, EyeOff, HelpCircle, Target } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import BalanceScale from "./BalanceScale";
import VisualAlgebraShapeIcon from "./VisualAlgebraShapeIcon";
import { ShapeType } from "./types";
import type { LevelData, PanContent } from "./types";

interface VisualAlgebraBoardProps {
  availableShapes: ShapeType[];
  feedbackState: FeedbackState | null;
  level: number;
  levelData: LevelData | null;
  onAddShape: (shape: ShapeType) => void;
  onCheckAnswer: () => void;
  onRemoveShape: (shape: ShapeType) => void;
  onResetPan: () => void;
  showWeights: boolean;
  toggleWeights: () => void;
  userRightPan: PanContent;
}

const PATTERN_GRID_STYLE = `
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
`;

const VisualAlgebraBoard = ({
  availableShapes,
  feedbackState,
  level,
  levelData,
  onAddShape,
  onCheckAnswer,
  onRemoveShape,
  onResetPan,
  showWeights,
  toggleWeights,
  userRightPan,
}: VisualAlgebraBoardProps) => {
  if (!levelData) {
    return null;
  }

  const panelClassName = feedbackState
    ? feedbackState.correct
      ? "bg-cyber-green/15 border-cyber-green ring-2 ring-cyber-green"
      : "bg-cyber-pink/15 border-cyber-pink ring-2 ring-cyber-pink"
    : "bg-slate-100 dark:bg-slate-800/80 border-black/10";

  return (
    <div className="flex h-full w-full flex-1 items-center justify-center pt-2 pb-4">
      <motion.div
        key={`lvl-${level}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, transition: { duration: 0.1 } }}
        className="flex w-full max-w-5xl flex-col items-stretch gap-6 sm:gap-8 lg:flex-row"
      >
        <div className="relative flex-1 overflow-hidden rounded-2xl border-2 border-black/10 bg-white p-4 shadow-neo-sm dark:bg-slate-800 lg:p-6">
          <div className="pattern-grid pointer-events-none absolute inset-0 opacity-10 dark:opacity-5" />
          <span className="absolute top-4 left-6 z-10 flex items-center gap-2 rounded-lg border-2 border-black/10 bg-white px-2 py-1 text-[10px] font-nunito font-black uppercase tracking-widest text-cyber-purple dark:bg-slate-800 sm:top-6 sm:left-8 sm:px-3 sm:text-xs">
            <HelpCircle size={16} className="stroke-[3]" /> REFERANS
          </span>
          <div className="mt-8 origin-center scale-90 sm:scale-100">
            <BalanceScale
              left={levelData.referenceEquation.left}
              right={levelData.referenceEquation.right}
              weights={levelData.weights}
              showWeights={showWeights}
              isFeedbackActive={feedbackState !== null}
            />
          </div>
          <div className="relative z-10 mx-auto mt-4 max-w-[140px] rounded-full border-2 border-black/10 bg-cyber-green py-1.5 text-center text-xs font-nunito font-black uppercase tracking-widest text-black shadow-neo-sm">
            DENGEDE
          </div>
        </div>

        <div
          className={`relative flex flex-[1.5] flex-col rounded-2xl border-2 p-4 shadow-neo-sm transition-colors duration-300 lg:p-6 ${panelClassName}`}
        >
          <div className="pattern-grid pointer-events-none absolute inset-0 opacity-10 dark:opacity-5" />
          <div className="relative z-10 mb-0 flex items-center justify-between sm:mb-4">
            <span className="flex items-center gap-2 rounded-lg border-2 border-black/10 bg-white px-2 py-1 text-[10px] font-nunito font-black uppercase tracking-widest text-black dark:bg-slate-800 dark:text-white sm:px-3 sm:text-xs">
              <Target size={16} className="stroke-[3]" /> SORU
            </span>
            <div className="flex gap-2">
              <button
                onClick={toggleWeights}
                className="rounded-xl border-2 border-black/10 bg-white p-2 text-black transition-all hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none sm:p-3"
                title="Ağırlıkları Göster"
              >
                {showWeights ? (
                  <EyeOff size={18} strokeWidth={2.5} className="sm:h-5 sm:w-5" />
                ) : (
                  <Eye size={18} strokeWidth={2.5} className="sm:h-5 sm:w-5" />
                )}
              </button>
              <button
                onClick={onResetPan}
                disabled={feedbackState !== null}
                className="rounded-xl border-2 border-black/10 bg-cyber-pink p-2 text-black transition-all hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none disabled:opacity-50 sm:p-3"
                title="Temizle"
              >
                X
              </button>
            </div>
          </div>

          <div className="relative z-10 mt-4 flex flex-1 origin-center flex-col justify-center scale-90 sm:mt-0 sm:scale-100">
            <BalanceScale
              left={levelData.question.left}
              right={userRightPan}
              weights={levelData.weights}
              interactive
              showWeights={showWeights}
              isFeedbackActive={feedbackState !== null}
              onRemoveFromPan={onRemoveShape}
            />
          </div>

          <div className="relative z-10 mt-4 flex flex-col gap-4 sm:mt-8">
            <div className="flex flex-wrap justify-center gap-2 rounded-2xl border-2 border-black/10 bg-white p-2 shadow-neo-sm dark:bg-slate-800 sm:gap-4 sm:p-4">
              {availableShapes.map((shape) => (
                <motion.button
                  key={shape}
                  whileTap={feedbackState === null ? { scale: 0.95 } : undefined}
                  onClick={() => onAddShape(shape)}
                  disabled={feedbackState !== null}
                  className={`rounded-xl border-2 border-black/10 bg-slate-50 p-2 shadow-neo-sm transition-colors dark:bg-slate-700 sm:p-3 ${
                    feedbackState
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-slate-100 dark:hover:bg-slate-600"
                  }`}
                >
                  <VisualAlgebraShapeIcon
                    type={shape}
                    weight={showWeights ? levelData.weights[shape] : undefined}
                    className="h-6 w-6 sm:h-8 sm:w-8"
                  />
                </motion.button>
              ))}
            </div>

            <button
              onClick={onCheckAnswer}
              disabled={feedbackState !== null || Object.keys(userRightPan).length === 0}
              className="w-full rounded-2xl border-2 border-black/10 bg-cyber-blue py-3 text-lg font-nunito font-black uppercase tracking-widest text-white shadow-neo-sm transition-all hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-neo-sm sm:py-4 sm:text-xl"
            >
              DENGE KONTROL (ONAYLA)
            </button>
          </div>
        </div>
      </motion.div>
      <style>{PATTERN_GRID_STYLE}</style>
    </div>
  );
};

export default VisualAlgebraBoard;
