import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

import MatrixPuzzleReviewCard from "./MatrixPuzzleReviewCard";
import type { QuestionHistoryEntry } from "./types";

interface MatrixPuzzleReviewProps {
  entries: QuestionHistoryEntry[];
  onBack: () => void;
}

const MatrixPuzzleReview: React.FC<MatrixPuzzleReviewProps> = ({
  entries,
  onBack,
}) => {
  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col font-nunito tracking-tight relative overflow-hidden items-center justify-center p-4">
      <motion.div
        key="review"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-4xl text-center relative z-10"
      >
        <h2 className="text-3xl font-nunito font-black text-black dark:text-white mb-6 uppercase tracking-widest inline-block px-8 py-4 bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm rounded-2xl">
          Soru Analizi
        </h2>

        <div className="space-y-8 max-h-[70vh] overflow-y-auto px-4 py-6 custom-scrollbar pr-4">
          {entries.map((entry, index) => (
            <motion.div
              key={`${entry.level}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MatrixPuzzleReviewCard entry={entry} />
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-10">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-8 py-5 bg-white dark:bg-slate-800 text-black dark:text-white rounded-2xl font-nunito font-black flex items-center gap-2 border-2 border-black/10 shadow-neo-sm hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest"
          >
            <ChevronLeft size={24} className="stroke-[3]" /> Geri
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default MatrixPuzzleReview;
