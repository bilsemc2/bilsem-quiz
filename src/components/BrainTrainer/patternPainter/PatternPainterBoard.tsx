import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw } from "lucide-react";

import PatternPainterFillGrid from "./PatternPainterFillGrid";
import PatternPainterPalette from "./PatternPainterPalette";
import PatternPainterPreview from "./PatternPainterPreview";
import type { PaintingGrid, PatternPainterLevel } from "./types";

interface PatternPainterBoardProps {
  activeColor: string | null;
  availableColors: string[];
  canCheck: boolean;
  currentLevel: PatternPainterLevel;
  userPainting: PaintingGrid;
  onCheck: () => void;
  onClear: () => void;
  onPaintTile: (row: number, column: number) => void;
  onSelectColor: (color: string) => void;
}

const PatternPainterBoard: React.FC<PatternPainterBoardProps> = ({
  activeColor,
  availableColors,
  canCheck,
  currentLevel,
  userPainting,
  onCheck,
  onClear,
  onPaintTile,
  onSelectColor,
}) => {
  return (
    <motion.div
      key="pattern-painter-game"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center"
    >
      <PatternPainterPreview
        currentLevel={currentLevel}
        userPainting={userPainting}
      />

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 border-2 border-black/10 shadow-neo-sm flex flex-col items-center">
        <h2 className="text-xl font-nunito font-black text-center mb-4 flex items-center justify-center gap-2 uppercase text-black dark:text-white">
          Boslugu Tamamla
        </h2>

        <PatternPainterFillGrid
          userPainting={userPainting}
          onPaintTile={onPaintTile}
        />

        <PatternPainterPalette
          activeColor={activeColor}
          availableColors={availableColors}
          onSelectColor={onSelectColor}
        />

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClear}
            className="flex-1 py-3 bg-white dark:bg-slate-700 text-black dark:text-white rounded-xl font-nunito font-bold border-2 border-black/10 flex items-center justify-center gap-2 transition-colors shadow-neo-sm active:translate-y-[2px] active:shadow-none uppercase tracking-wider text-sm"
          >
            <RotateCcw size={16} className="stroke-[3]" />
            <span>Temizle</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCheck}
            disabled={!canCheck}
            className={`flex-[1.5] py-3 rounded-xl font-nunito font-black border-2 border-black/10 shadow-neo-sm flex items-center justify-center gap-2 uppercase tracking-wider text-base ${
              canCheck
                ? "bg-cyber-green text-black active:translate-y-[2px] active:shadow-none"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 size={20} className="stroke-[3]" />
            <span>Kontrol Et</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default PatternPainterBoard;
