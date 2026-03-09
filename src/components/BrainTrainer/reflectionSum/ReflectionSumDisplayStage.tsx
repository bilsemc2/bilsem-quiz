import { AnimatePresence, motion } from "framer-motion";

interface ReflectionSumDisplayStageProps {
  currentIndex: number;
  digits: number[];
  isMirrored: boolean;
}

const ReflectionSumDisplayStage = ({
  currentIndex,
  digits,
  isMirrored,
}: ReflectionSumDisplayStageProps) => (
  <motion.div
    key="display"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center gap-6"
  >
    <div className="relative w-40 h-40 sm:w-52 sm:h-52 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 border-[6px] border-black/10 border-dashed rounded-2xl shadow-neo-sm opacity-20 dark:opacity-40"
        animate={{ rotate: 360 }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <AnimatePresence mode="wait">
        {currentIndex >= 0 && (
          <motion.div
            key={currentIndex}
            initial={{
              scale: 0.5,
              opacity: 0,
              rotateY: isMirrored ? 180 : 0,
              y: 20,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              rotateY: isMirrored ? 180 : 0,
              y: 0,
            }}
            exit={{ scale: 1.5, opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="w-28 h-28 sm:w-40 sm:h-40 bg-cyber-purple border-2 border-black/10 rounded-2xl shadow-neo-sm flex items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20" />
            <span className="text-6xl sm:text-8xl font-nunito font-black text-white drop-shadow-neo-sm">
              {digits[currentIndex]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    <div className="flex gap-1.5 p-2 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm">
      {digits.map((_, index) => (
        <div
          key={index}
          className={`w-3 h-3 rounded-md border-2 border-black/10 transition-all duration-300 ${
            index <= currentIndex
              ? "bg-cyber-yellow scale-125"
              : "bg-slate-200 dark:bg-slate-700"
          }`}
        />
      ))}
    </div>

    <p className="text-black dark:text-white font-nunito font-black uppercase tracking-widest text-sm sm:text-base bg-cyber-pink border-2 border-black/10 px-4 py-1.5 rounded-lg shadow-neo-sm animate-pulse">
      Sayıları Aklında Tut
    </p>
  </motion.div>
);

export default ReflectionSumDisplayStage;
