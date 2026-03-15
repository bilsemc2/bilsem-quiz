import React from "react";
import { motion } from "framer-motion";

import { ICON_MAP } from "./iconMap";
import type { GridCell, InternalPhase } from "./types";

const getSizeClass = (gridSize: number) => {
  if (gridSize === 3) {
    return "min-w-[60px] sm:min-w-[90px] md:min-w-[110px]";
  }

  if (gridSize === 4) {
    return "min-w-[52px] sm:min-w-[70px] md:min-w-[90px]";
  }

  return "min-w-[44px] sm:min-w-[56px] md:min-w-[72px]";
};

interface VisualMemoryCellProps {
  cell: GridCell;
  gridSize: number;
  internalPhase: InternalPhase;
  isSelected: boolean;
  isTarget: boolean;
  showResult: boolean;
  onSelect: (id: string) => void;
}

const VisualMemoryCell: React.FC<VisualMemoryCellProps> = ({
  cell,
  gridSize,
  internalPhase,
  isSelected,
  isTarget,
  showResult,
  onSelect,
}) => {
  const IconTag = cell.icon ? ICON_MAP[cell.icon] : null;
  let backgroundClass = "bg-slate-100 dark:bg-slate-700";
  let borderClass = "border-2 border-slate-300 dark:border-slate-500";

  if (showResult) {
    if (isTarget) {
      backgroundClass = "bg-cyber-green";
      borderClass = "border-2 border-black/10 shadow-neo-sm z-10 scale-105";
    } else if (isSelected) {
      backgroundClass = "bg-cyber-pink opacity-80";
      borderClass = "border-2 border-black/10";
    } else {
      backgroundClass = "opacity-40";
    }
  } else if (isSelected) {
    backgroundClass = "bg-cyber-yellow";
    borderClass = "border-2 border-black/10 shadow-neo-sm";
  } else if (internalPhase === "recall" && cell.icon) {
    backgroundClass =
      "bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 cursor-pointer";
    borderClass = "border-2 border-black/10 hover:border-cyber-purple";
  }

  return (
    <motion.button
      whileTap={
        internalPhase === "recall" && !showResult && cell.icon
          ? { scale: 0.95 }
          : {}
      }
      onClick={() => onSelect(cell.id)}
      disabled={internalPhase !== "recall" || showResult || !cell.icon}
      className={`flex items-center justify-center transition-all duration-300 ${backgroundClass} ${borderClass} rounded-xl relative aspect-square ${getSizeClass(
        gridSize,
      )}`}
    >
      {IconTag ? (
        <div className="w-[55%] h-[55%] flex items-center justify-center">
          <IconTag
            className="w-full h-full"
            color={showResult && isTarget ? "white" : cell.color}
            strokeWidth={gridSize <= 4 ? 2.5 : 3}
          />
        </div>
      ) : null}
    </motion.button>
  );
};

export default VisualMemoryCell;
