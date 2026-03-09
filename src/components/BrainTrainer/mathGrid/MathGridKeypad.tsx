import { motion } from "framer-motion";
import { Check, Delete } from "lucide-react";

import { NUMBER_PAD_BUTTONS } from "./constants";

interface MathGridKeypadProps {
  onDelete: () => void;
  onNumberInput: (digit: string) => void;
  onSubmit: () => void;
}

const MathGridKeypad = ({
  onDelete,
  onNumberInput,
  onSubmit,
}: MathGridKeypadProps) => (
  <div className="w-full mt-3">
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {NUMBER_PAD_BUTTONS.map((button, index) => {
        if (button === "DEL") {
          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.95 }}
              onClick={onDelete}
              className="h-11 sm:h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-black/10 text-black dark:text-white flex items-center justify-center shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
            >
              <Delete size={20} className="stroke-[3]" />
            </motion.button>
          );
        }

        if (button === "CHECK") {
          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.95 }}
              onClick={onSubmit}
              className="h-11 sm:h-12 rounded-xl bg-cyber-green border-2 border-black/10 text-black flex items-center justify-center shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
            >
              <Check size={22} className="stroke-[4]" />
            </motion.button>
          );
        }

        return (
          <motion.button
            key={index}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNumberInput(button.toString())}
            className="h-11 sm:h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-black/10 text-black dark:text-white text-xl sm:text-2xl font-nunito font-black shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
          >
            {button}
          </motion.button>
        );
      })}
    </div>
  </div>
);

export default MathGridKeypad;
