import React from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";

import { NOTES } from "./constants";

interface AuditoryMemoryAnsweringViewProps {
  sequence: number[];
  playerSequence: number[];
  activeNote: number | null;
  onNoteClick: (noteIndex: number) => void;
}

const AuditoryMemoryAnsweringView: React.FC<AuditoryMemoryAnsweringViewProps> = ({
  sequence,
  playerSequence,
  activeNote,
  onNoteClick,
}) => {
  return (
    <motion.div
      key="answering"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl flex flex-col items-center gap-6"
    >
      <h2 className="text-2xl font-nunito font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase bg-white dark:bg-slate-800 px-4 py-1.5 rounded-xl border-2 border-black/10 shadow-neo-sm">
        SIRAYLA CAL
      </h2>

      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 w-full px-2 sm:px-0">
        {NOTES.map((note, index) => (
          <motion.button
            key={note.name}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNoteClick(index)}
            className={`aspect-square sm:aspect-[3/4] rounded-xl border-2 border-black/10 transition-all flex flex-col items-center justify-between p-3 active:translate-y-1 active:shadow-none ${
              activeNote === index ? "scale-105 shadow-neo-sm z-10" : "shadow-neo-sm"
            }`}
            style={{
              backgroundColor: note.color,
              opacity: activeNote === index ? 1 : 0.8,
            }}
          >
            <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-black/10 flex items-center justify-center">
              <Music size={12} className="text-black dark:text-white" />
            </div>
            <span className="text-lg font-nunito font-black text-black">
              {note.name}
            </span>
            <div className="w-full h-0.5 rounded-full bg-black mt-1" />
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2 mt-2 flex-wrap justify-center items-center">
        {sequence.map((_, index) => (
          <div
            key={`progress-${index}`}
            className={`w-7 h-7 rounded-full border-2 border-black/10 transition-all duration-300 flex items-center justify-center text-[9px] font-nunito font-black ${
              index < playerSequence.length
                ? "shadow-neo-xs text-black"
                : "bg-white dark:bg-slate-800 opacity-30 border-dashed text-slate-400"
            }`}
            style={
              index < playerSequence.length
                ? { backgroundColor: NOTES[playerSequence[index]]?.color }
                : undefined
            }
          >
            {index < playerSequence.length
              ? NOTES[playerSequence[index]]?.name
              : index + 1}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AuditoryMemoryAnsweringView;
