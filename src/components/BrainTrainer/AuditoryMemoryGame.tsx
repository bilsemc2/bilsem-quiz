import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Music } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "isitsel-hafiza";
const GAME_TITLE = "İşitsel Hafıza";
const GAME_DESCRIPTION = "Melodileri dikkatle dinle, notaların sırasını aklında tut ve aynı müziği tekrar çalarak hafızanı kanıtla!";
const TUZO_TEXT = "TUZÖ 5.4.2 İşitsel Melodi Dizisi & Çalışma Belleği";

type LocalPhase = "listening" | "answering" | "idle";

const NOTES = [
  { name: "Do", frequency: 261.63, color: "#FF6B6B" },
  { name: "Re", frequency: 293.66, color: "#FFA07A" },
  { name: "Mi", frequency: 329.63, color: "#FFD93D" },
  { name: "Fa", frequency: 349.23, color: "#6BCB77" },
  { name: "Sol", frequency: 392.0, color: "#4ECDC4" },
  { name: "La", frequency: 440.0, color: "#4A90D9" },
  { name: "Si", frequency: 493.88, color: "#9B59B6" },
  { name: "Do2", frequency: 523.25, color: "#FF9FF3" },
];

const AuditoryMemoryGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1500 });

  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const {
    phase,
    level,
    addScore,
    loseLife,
    nextLevel,
    addTime,
  } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
  const [activeNote, setActiveNote] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const playNote = useCallback((noteIndex: number, duration = 400) => {
    if (!audioContextRef.current) {
      // @ts-expect-error webkitAudioContext is not standard
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    const ctx = audioContextRef.current;

    // Suspend check for browser autoplay policies
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const note = NOTES[noteIndex];
    if (!note) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(note.frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      ctx.currentTime + duration / 1000,
    );

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);

    setActiveNote(noteIndex);
    const t = setTimeout(() => setActiveNote(null), duration);
    timeoutsRef.current.push(t);
  }, []);

  const playSequence = useCallback(
    async (seq: number[]) => {
      setLocalPhase("listening");
      setCurrentPlayIndex(-1);

      for (let i = 0; i < seq.length; i++) {
        if (phase !== "playing") return; // Stop if game ended during playback
        await new Promise((r) => { const t = setTimeout(r, 600); timeoutsRef.current.push(t); });
        setCurrentPlayIndex(i);
        playNote(seq[i], 400);
        await new Promise((r) => { const t = setTimeout(r, 400); timeoutsRef.current.push(t); });
      }

      // Keep last note visible for a moment before transitioning
      await new Promise((r) => { const t = setTimeout(r, 800); timeoutsRef.current.push(t); });
      setCurrentPlayIndex(-1);
      await new Promise((r) => { const t = setTimeout(r, 400); timeoutsRef.current.push(t); });
      if (phase === "playing") {
        setLocalPhase("answering");
        setPlayerSequence([]);
      }
    },
    [playNote, phase],
  );

  const startLevel = useCallback(
    (lvl: number) => {
      const len = Math.min(2 + lvl, 9);
      const seq = Array.from({ length: len }, () =>
        Math.floor(Math.random() * NOTES.length),
      );
      setSequence(seq);
      playSound("slide");
      playSequence(seq);
    },
    [playSequence, playSound],
  );

  // Initialize or restart level
  useEffect(() => {
    if (phase === "playing" && localPhase === "idle") {
      startLevel(level);
    } else if (phase === "welcome") {
      setLocalPhase("idle");
      setSequence([]);
      setPlayerSequence([]);
    }
  }, [phase, level, localPhase, startLevel]);

  const handleLevelComplete = useCallback(() => {
    playSound("correct");
    showFeedback(true);
    addScore(50 + level * 10);

    const t = setTimeout(() => {
      dismissFeedback();
      addTime(20);
      nextLevel();
      startLevel(level + 1);
    }, 1500);
    timeoutsRef.current.push(t);
  }, [playSound, showFeedback, addScore, level, dismissFeedback, addTime, nextLevel, startLevel]);

  const handleCrash = useCallback(() => {
    playSound("incorrect");
    loseLife();
    showFeedback(false);

    const t = setTimeout(() => {
      dismissFeedback();
      if (engine.lives > 1) { // It has not updated locally immediately
        playSequence(sequence);
      }
    }, 1500);
    timeoutsRef.current.push(t);
  }, [playSound, loseLife, showFeedback, dismissFeedback, engine.lives, playSequence, sequence]);


  const handleNoteClick = (idx: number) => {
    if (localPhase !== "answering" || phase !== "playing" || !!feedbackState) return;

    playNote(idx, 300);
    const newPlayerSequence = [...playerSequence, idx];
    setPlayerSequence(newPlayerSequence);

    // Check correctness immediately on click
    if (idx !== sequence[playerSequence.length]) {
      handleCrash();
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      setLocalPhase("idle"); // Prevent further clicks
      handleLevelComplete();
    } else {
      playSound("pop");
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Music,
    accentColor: "cyber-pink",
    maxLevel: 20,
    howToPlay: [
      "Çalınan nota dizisini pür dikkat dinle",
      "Dinleme bittikten sonra notalara aynı sırayla tıkla",
      "Diziler uzadıkça melodiyi aklında tutmak daha da zorlaşacak!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
          <AnimatePresence mode="wait">
            {localPhase === "listening" && !feedbackState && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center gap-8"
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-24 h-24 bg-cyber-pink rounded-full flex items-center justify-center border-4 border-black shadow-[8px_8px_0_#000] text-black relative z-10"
                  >
                    <Volume2 size={40} className="fill-black" />
                  </motion.div>

                  {/* Concentric expanding sound waves behind the speaker */}
                  <motion.div
                    animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 bg-cyber-pink rounded-full blur-sm"
                  />
                  <motion.div
                    animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
                    className="absolute inset-0 border-4 border-cyber-pink rounded-full"
                  />
                </div>

                <h2 className="text-3xl font-syne font-black text-black dark:text-white uppercase tracking-tighter">
                  DİKKATLE DİNLE!
                </h2>

                {/* Active Note Display */}
                <AnimatePresence mode="wait">
                  {currentPlayIndex >= 0 && currentPlayIndex < sequence.length ? (
                    <motion.div
                      key={currentPlayIndex}
                      initial={{ scale: 0.5, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center gap-2 h-24" // fixed height to prevent jumping
                    >
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 0.4, repeat: Infinity }}
                        className="w-20 h-20 rounded-[35%] flex items-center justify-center text-black text-2xl font-syne font-black shadow-[8px_8px_0_#000] border-4 border-black"
                        style={{
                          backgroundColor: NOTES[sequence[currentPlayIndex]]?.color || '#fff',
                        }}
                      >
                        {NOTES[sequence[currentPlayIndex]]?.name}
                      </motion.div>
                    </motion.div>
                  ) : (
                    <div className="h-24 w-full" /> // Spacer
                  )}
                </AnimatePresence>

                {/* Sequence Progress Indicators */}
                <div className="flex gap-3 items-center flex-wrap justify-center max-w-sm mt-4">
                  {sequence.map((noteIdx, i) => (
                    <motion.div
                      key={i}
                      animate={
                        i === currentPlayIndex ? { scale: 1.3 } : { scale: 1 }
                      }
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-syne font-black border-4 transition-all duration-300 ${i === currentPlayIndex
                          ? "border-black text-black shadow-[4px_4px_0_#000] z-10"
                          : i < currentPlayIndex
                            ? "border-black text-black"
                            : "border-black text-black/20 opacity-50 border-dashed dark:border-slate-500"
                        }`}
                      style={{
                        backgroundColor:
                          i <= currentPlayIndex
                            ? `${NOTES[noteIdx]?.color || '#fff'}`
                            : "transparent",
                      }}
                    >
                      {i <= currentPlayIndex ? NOTES[noteIdx]?.name : "?"}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {localPhase === "answering" && !feedbackState && (
              <motion.div
                key="answering"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl flex flex-col items-center gap-12"
              >
                <h2 className="text-3xl font-syne font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase bg-white dark:bg-slate-800 px-6 py-2 rounded-2xl border-4 border-black shadow-[4px_4px_0_#000] -rotate-1">
                  SIRAYLA ÇAL
                </h2>

                <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-4 w-full px-4 sm:px-0">
                  {NOTES.map((note, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNoteClick(idx)}
                      className={`aspect-square sm:aspect-[3/4] rounded-2xl border-4 border-black transition-all flex flex-col items-center justify-between p-4 group active:translate-y-2 active:shadow-none ${activeNote === idx ? "scale-110 shadow-[8px_8px_0_#000] z-10" : "hover:shadow-[8px_8px_0_#000] shadow-[4px_4px_0_#000]"}`}
                      style={{
                        backgroundColor: note.color,
                        opacity: activeNote === idx ? 1 : 0.8,
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Music size={16} className="text-black dark:text-white" />
                      </div>
                      <span className="text-xl font-syne font-black text-black">
                        {note.name}
                      </span>
                      <div className="w-full h-1 rounded-full bg-black mt-2" />
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-3 mt-4 flex-wrap justify-center">
                  {sequence.map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full border-4 border-black transition-colors duration-300 ${i < playerSequence.length ? "bg-cyber-green shadow-inner" : "bg-white dark:bg-slate-800 opacity-30 border-dashed"}`}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* General game over feedback is handled by shell */}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default AuditoryMemoryGame;
