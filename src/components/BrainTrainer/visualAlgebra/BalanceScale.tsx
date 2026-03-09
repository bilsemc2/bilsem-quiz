import { motion } from "framer-motion";

import VisualAlgebraShapeIcon from "./VisualAlgebraShapeIcon";
import { ShapeType } from "./types";
import type { PanContent, WeightMap } from "./types";
import { calculatePanWeight } from "./logic";

interface BalanceScaleProps {
  left: PanContent;
  right: PanContent;
  weights: WeightMap;
  interactive?: boolean;
  showWeights?: boolean;
  isFeedbackActive?: boolean;
  onRemoveFromPan?: (shape: ShapeType) => void;
}

const StringsSvg = () => (
  <svg
    className="pointer-events-none absolute -top-[4rem] h-[4rem] w-full sm:-top-[5rem] sm:h-[5rem]"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <line x1="10" y1="100" x2="50" y2="0" stroke="black" strokeWidth="3" />
    <line x1="90" y1="100" x2="50" y2="0" stroke="black" strokeWidth="3" />
  </svg>
);

const BalanceScale = ({
  left,
  right,
  weights,
  interactive = false,
  showWeights = false,
  isFeedbackActive = false,
  onRemoveFromPan,
}: BalanceScaleProps) => {
  const leftWeight = calculatePanWeight(left, weights);
  const rightWeight = calculatePanWeight(right, weights);
  const tilt = Math.max(Math.min((rightWeight - leftWeight) * 3, 15), -15);

  const renderContent = (content: PanContent, side: "left" | "right") =>
    Object.entries(content).flatMap(([shape, count]) =>
      Array.from({ length: count as number }).map((_, index) => (
        <motion.div
          key={`${shape}-${index}`}
          whileTap={
            interactive && side === "right" && !isFeedbackActive
              ? { scale: 0.9 }
              : undefined
          }
          onClick={() =>
            interactive &&
            side === "right" &&
            onRemoveFromPan?.(shape as ShapeType)
          }
          className={interactive && side === "right" ? "cursor-pointer" : ""}
        >
          <VisualAlgebraShapeIcon
            type={shape as ShapeType}
            size={32}
            weight={showWeights ? weights[shape as ShapeType] : undefined}
            className="drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
          />
        </motion.div>
      )),
    );

  return (
    <div className="relative mt-8 flex h-48 w-full select-none items-end justify-center sm:h-56">
      <div className="absolute bottom-0 z-20 h-6 w-32 rounded-xl border-2 border-black/10 bg-cyber-pink shadow-neo-sm" />
      <div className="absolute bottom-6 z-10 h-32 w-6 rounded-t-xl border-x-4 border-t-4 border-black/10 bg-slate-200 dark:bg-slate-700" />
      <div className="absolute bottom-[8.5rem] z-30 h-8 w-8 rounded-full border-2 border-black/10 bg-cyber-yellow shadow-neo-sm">
        <div className="mx-auto mt-2 h-2 w-2 rounded-full bg-black" />
      </div>

      <div
        className="absolute bottom-[8.5rem] z-20 w-full max-w-sm origin-center transition-transform duration-700 ease-in-out"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        <div className="relative mx-4 h-6 overflow-hidden rounded-xl border-2 border-black/10 bg-cyber-blue shadow-neo-sm">
          <div className="absolute inset-0 w-1/2 bg-white/20" />
        </div>

        <div
          className="absolute left-[10%] top-6 flex origin-top flex-col items-center transition-transform duration-700 ease-in-out"
          style={{ transform: `rotate(${-tilt}deg)` }}
        >
          <div className="h-16 w-1.5 bg-black sm:h-20" />
          <div className="relative flex min-h-[1.5rem] w-28 flex-wrap items-end justify-center gap-1 rounded-b-3xl border-2 border-black/10 bg-white px-1 pb-2 shadow-neo-sm dark:bg-slate-800 sm:w-32">
            <StringsSvg />
            <div className="relative z-10 flex w-full flex-wrap items-end justify-center gap-1 px-1 pt-4">
              {renderContent(left, "left")}
            </div>
          </div>
        </div>

        <div
          className="absolute right-[10%] top-6 flex origin-top flex-col items-center transition-transform duration-700 ease-in-out"
          style={{ transform: `rotate(${-tilt}deg)` }}
        >
          <div className="h-16 w-1.5 bg-black sm:h-20" />
          <div
            className={`relative flex min-h-[1.5rem] w-28 flex-wrap items-end justify-center gap-1 rounded-b-3xl border-2 border-black/10 px-1 pb-2 shadow-neo-sm sm:w-32 ${
              interactive
                ? "bg-amber-100 transition-colors dark:bg-amber-900/40"
                : "bg-white dark:bg-slate-800"
            }`}
          >
            <StringsSvg />
            <div className="relative z-10 flex min-h-[40px] w-full flex-wrap items-end justify-center gap-1 px-1 pt-4">
              {renderContent(right, "right")}
              {interactive && Object.keys(right).length === 0 && (
                <span className="absolute bottom-3 text-xs font-nunito font-bold text-black/30 dark:text-white/30">
                  Tıkla Ekle
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceScale;
