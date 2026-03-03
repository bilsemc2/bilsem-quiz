import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Music } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "isitsel-hafiza";
const GAME_TITLE = "İşitsel Hafıza";
const GAME_DESCRIPTION = "Melodileri dikkatle dinle, notaların sırasını aklında tut ve aynı müziği tekrar çalarak hafızanı kanıtla!";
const TUZO_TEXT = "TUZÖ 5.4.2 İşitsel Melodi Dizisi & Çalışma Belleği";

type LocalPhase = "listening" | "answering" | "idle";

const NOTES = [
  { name: "Do", frequency: 261.63, color: GAME_COLORS.pink },
  { name: "Re", frequency: 293.66, color: "#FFA07A" },
  { name: "Mi", frequency: 329.63, color: GAME_COLORS.yellow },
  { name: "Fa", frequency: 349.23, color: GAME_COLORS.orange },
  { name: "Sol", frequency: 392.0, color: GAME_COLORS.emerald },
  { name: "La", frequency: 440.0, color: GAME_COLORS.blue },
  { name: "Si", frequency: 493.88, color: GAME_COLORS.purple },
  { name: "Do2", frequency: 523.25, color: "#FB7185" },
];

const AuditoryMemoryGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });

  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const {
    phase,
    level,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
  const [activeNote, setActiveNote] = useState<number | null>(null);

  // Refs for stable access in handleNoteClick
  const sequenceRef = useRef<number[]>([]);
  const playerSequenceRef = useRef<number[]>([]);

  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  useEffect(() => { playerSequenceRef.current = playerSequence; }, [playerSequence]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const phaseRef = useRef(phase);
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      setCurrentPlayIndex(-1);
      setActiveNote(null);

      if (phase === "welcome") {
        setLocalPhase("idle");
        setSequence([]);
        setPlayerSequence([]);
      }
    }

    if (phase === "playing" && prevPhaseRef.current !== "playing") {
      setLocalPhase("idle");
      setSequence([]);
      setPlayerSequence([]);
      setCurrentPlayIndex(-1);
      setActiveNote(null);
    }

    prevPhaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
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
    const t = safeTimeout(() => setActiveNote(null), duration);
    timeoutsRef.current.push(t);
  }, [safeTimeout]);

  const playSequence = useCallback(
    async (seq: number[]) => {
      setLocalPhase("listening");
      setCurrentPlayIndex(-1);

      for (let i = 0; i < seq.length; i++) {
        if (phaseRef.current !== "playing") return;
        await new Promise<void>((r) => { const t = safeTimeout(() => r(), 600); timeoutsRef.current.push(t); });
        if (phaseRef.current !== "playing") return;
        setCurrentPlayIndex(i);
        playNote(seq[i], 400);
        await new Promise<void>((r) => { const t = safeTimeout(() => r(), 400); timeoutsRef.current.push(t); });
      }

      if (phaseRef.current !== "playing") return;

      // Keep last note visible for a moment before transitioning
      await new Promise<void>((r) => { const t = safeTimeout(() => r(), 800); timeoutsRef.current.push(t); });
      if (phaseRef.current !== "playing") return;
      setCurrentPlayIndex(-1);
      await new Promise<void>((r) => { const t = safeTimeout(() => r(), 400); timeoutsRef.current.push(t); });
      if (phaseRef.current === "playing") {
        setLocalPhase("answering");
        setPlayerSequence([]);
      }
    },
    [playNote],
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
    if (phase === "playing" && localPhase === "idle" && !feedbackState) {
      startLevel(level);
    }
  }, [phase, level, localPhase, feedbackState, startLevel]);

  const handleLevelComplete = useCallback(() => {
    playSound("correct");
    showFeedback(true);
    addScore(50 + level * 10);

    const t = safeTimeout(() => {
      dismissFeedback();
      nextLevel();
    }, 1500);
    timeoutsRef.current.push(t);
  }, [playSound, showFeedback, addScore, level, dismissFeedback, nextLevel, safeTimeout]);

  const handleCrash = useCallback(() => {
    const canRetry = engine.lives > 1;
    playSound("incorrect");
    loseLife();
    showFeedback(false);

    const t = safeTimeout(() => {
      dismissFeedback();
      if (canRetry && phaseRef.current === "playing") {
        // Generate new sequence for retry
        const len = Math.min(2 + level, 9);
        const newSeq = Array.from({ length: len }, () =>
          Math.floor(Math.random() * NOTES.length),
        );
        setSequence(newSeq);
        playSequence(newSeq);
      }
    }, 1500);
    timeoutsRef.current.push(t);
  }, [playSound, loseLife, showFeedback, dismissFeedback, engine.lives, playSequence, level]);


  const handleNoteClick = useCallback((idx: number) => {
    if (localPhase !== "answering" || phase !== "playing" || !!feedbackState) return;

    playNote(idx, 300);
    const currentSeq = sequenceRef.current;
    const currentPlayerSeq = playerSequenceRef.current;
    const newPlayerSequence = [...currentPlayerSeq, idx];
    setPlayerSequence(newPlayerSequence);

    // Check correctness immediately on click
    if (idx !== currentSeq[currentPlayerSeq.length]) {
      handleCrash();
      return;
    }

    if (newPlayerSequence.length === currentSeq.length) {
      setLocalPhase("idle"); // Prevent further clicks
      handleLevelComplete();
    } else {
      playSound("pop");
    }
  }, [localPhase, phase, feedbackState, playNote, playSound, handleCrash, handleLevelComplete]);

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Music,
    accentColor: "cyber-pink",
    maxLevel: 20,
    wideLayout: true,
    howToPlay: [
      "Çalınan nota dizisini pür dikkat dinle",
      "Dinleme bittikten sonra notalara aynı sırayla tıkla",
      "Diziler uzadıkça melodiyi aklında tutmak daha da zorlaşacak!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1">
          {localPhase === "listening" && !feedbackState && (
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
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
                  className="absolute inset-0 border-4 border-cyber-pink rounded-full"
                />
              </div>

              <h2 className="text-2xl font-nunito font-black text-black dark:text-white uppercase tracking-tighter">
                DİKKATLE DİNLE!
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
                        backgroundColor: NOTES[sequence[currentPlayIndex]]?.color || '#fff',
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
                {sequence.map((noteIdx, i) => (
                  <motion.div
                    key={i}
                    animate={
                      i === currentPlayIndex ? { scale: 1.3 } : { scale: 1 }
                    }
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-nunito font-black border-3 transition-all duration-300 ${i === currentPlayIndex
                      ? "border-black text-black shadow-neo-sm z-10"
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
              className="w-full max-w-3xl flex flex-col items-center gap-6"
            >
              <h2 className="text-2xl font-nunito font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase bg-white dark:bg-slate-800 px-4 py-1.5 rounded-xl border-2 border-black/10 shadow-neo-sm">
                SIRAYLA ÇAL
              </h2>

              <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 w-full px-2 sm:px-0">
                {NOTES.map((note, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNoteClick(idx)}
                    className={`aspect-square sm:aspect-[3/4] rounded-xl border-2 border-black/10 transition-all flex flex-col items-center justify-between p-3 active:translate-y-1 active:shadow-none ${activeNote === idx ? "scale-105 shadow-neo-sm z-10" : "shadow-neo-sm"}`}
                    style={{
                      backgroundColor: note.color,
                      opacity: activeNote === idx ? 1 : 0.8,
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
                {sequence.map((_noteIdx, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full border-2 border-black/10 transition-all duration-300 flex items-center justify-center text-[9px] font-nunito font-black ${i < playerSequence.length ? "shadow-neo-xs text-black" : "bg-white dark:bg-slate-800 opacity-30 border-dashed text-slate-400"}`}
                    style={i < playerSequence.length ? { backgroundColor: NOTES[playerSequence[i]]?.color } : {}}
                  >
                    {i < playerSequence.length ? NOTES[playerSequence[i]]?.name : (i + 1)}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default AuditoryMemoryGame;
