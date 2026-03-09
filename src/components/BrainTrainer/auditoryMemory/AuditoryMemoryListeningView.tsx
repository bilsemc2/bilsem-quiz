import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2 } from "lucide-react";

import { NOTES } from "./constants";

interface AuditoryMemoryListeningViewProps {
  sequence: number[];
  currentPlayIndex: number;
}

const AuditoryMemoryListeningView: React.FC<AuditoryMemoryListeningViewProps> = ({
  sequence,
  currentPlayIndex,
}) => {
  return (
    <motion.div
      key="listening"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-20 h-20 bg-cyber-pink rounded-full flex items-center justify-center border-2 border-black/10 shadow-neo-sm text-black relative z-10"
        >
          <Volume2 size={32} className="fill-black" />
        </motion.div>

        <motion.div
          animate={{ scale: [1, 2], opacity: [0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 bg-cyber-pink rounded-full blur-sm"
        />
        <motion.div
          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.2,
          }}
          className="absolute inset-0 border-4 border-cyber-pink rounded-full"
        />
      </div>

      <h2 className="text-2xl font-nunito font-black text-black dark:text-white uppercase tracking-tighter">
        DIKKATLE DINLE!
      </h2>

      <AnimatePresence mode="wait">
        {currentPlayIndex >= 0 && currentPlayIndex < sequence.length ? (
          <motion.div
            key={currentPlayIndex}
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-2 h-20"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              className="w-16 h-16 rounded-[35%] flex items-center justify-center text-black text-xl font-nunito font-black shadow-neo-sm border-2 border-black/10"
              style={{
                backgroundColor:
                  NOTES[sequence[currentPlayIndex]]?.color ?? "#ffffff",
              }}
            >
              {NOTES[sequence[currentPlayIndex]]?.name}
            </motion.div>
          </motion.div>
        ) : (
          <div className="h-20 w-full" />
        )}
      </AnimatePresence>

      <div className="flex gap-2 items-center flex-wrap justify-center max-w-md mt-2">
        {sequence.map((noteIndex, index) => (
          <motion.div
            key={`${index}-${noteIndex}`}
            animate={index === currentPlayIndex ? { scale: 1.3 } : { scale: 1 }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-nunito font-black border-3 transition-all duration-300 ${
              index === currentPlayIndex
                ? "border-black text-black shadow-neo-sm z-10"
                : index < currentPlayIndex
                  ? "border-black text-black"
                  : "border-black text-black/20 opacity-50 border-dashed dark:border-slate-500"
            }`}
            style={{
              backgroundColor:
                index <= currentPlayIndex
                  ? NOTES[noteIndex]?.color ?? "#ffffff"
                  : "transparent",
            }}
          >
            {index <= currentPlayIndex ? NOTES[noteIndex]?.name : "?"}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AuditoryMemoryListeningView;
