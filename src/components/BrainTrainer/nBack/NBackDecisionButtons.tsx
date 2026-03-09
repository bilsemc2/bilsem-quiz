import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface NBackDecisionButtonsProps {
  disabled: boolean;
  onDecision: (isSame: boolean) => void;
}

const NBackDecisionButtons: React.FC<NBackDecisionButtonsProps> = ({
  disabled,
  onDecision,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto"
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onDecision(false)}
        disabled={disabled}
        className="flex-1 py-3 sm:py-4 bg-cyber-pink text-black rounded-xl font-nunito font-black text-lg sm:text-xl border-2 border-black/10 shadow-neo-sm active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <X size={24} className="stroke-[3]" />
        Farklı
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onDecision(true)}
        disabled={disabled}
        className="flex-1 py-3 sm:py-4 bg-cyber-green text-black rounded-xl font-nunito font-black text-lg sm:text-xl border-2 border-black/10 shadow-neo-sm active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <Check size={24} className="stroke-[3]" />
        Aynı
      </motion.button>
    </motion.div>
  );
};

export default NBackDecisionButtons;
