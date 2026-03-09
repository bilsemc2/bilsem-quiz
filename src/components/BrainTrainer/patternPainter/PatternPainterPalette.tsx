import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface PatternPainterPaletteProps {
  activeColor: string | null;
  availableColors: string[];
  onSelectColor: (color: string) => void;
}

const PatternPainterPalette: React.FC<PatternPainterPaletteProps> = ({
  activeColor,
  availableColors,
  onSelectColor,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-black/10 shadow-inner">
      {availableColors.map((color) => (
        <motion.button
          key={color}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelectColor(color)}
          className="w-10 h-10 rounded-lg border-2 border-black/10 transition-all relative shadow-neo-sm active:translate-y-1 active:shadow-none"
          style={{
            backgroundColor: color,
            outline: activeColor === color ? "3px solid #000" : "none",
            outlineOffset: 2,
          }}
        >
          {activeColor === color ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2
                size={14}
                className="text-white drop-shadow-sm"
                strokeWidth={3}
              />
            </div>
          ) : null}
        </motion.button>
      ))}
    </div>
  );
};

export default PatternPainterPalette;
