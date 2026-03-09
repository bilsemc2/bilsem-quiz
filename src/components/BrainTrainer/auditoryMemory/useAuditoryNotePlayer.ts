import { useCallback, useEffect, useRef, useState } from "react";

import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { NOTES } from "./constants";

type AudioContextCtor = new () => AudioContext;

const getAudioContextConstructor = (): AudioContextCtor | null => {
  const runtime = globalThis as typeof globalThis & {
    webkitAudioContext?: AudioContextCtor;
  };

  return runtime.AudioContext ?? runtime.webkitAudioContext ?? null;
};

export const useAuditoryNotePlayer = () => {
  const safeTimeout = useSafeTimeout();
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeNoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeNote, setActiveNote] = useState<number | null>(null);

  const clearActiveNoteTimeout = useCallback(() => {
    if (activeNoteTimeoutRef.current) {
      clearTimeout(activeNoteTimeoutRef.current);
      activeNoteTimeoutRef.current = null;
    }
  }, []);

  const clearActiveNote = useCallback(() => {
    clearActiveNoteTimeout();
    setActiveNote(null);
  }, [clearActiveNoteTimeout]);

  const playNote = useCallback(
    (noteIndex: number, duration: number) => {
      const note = NOTES[noteIndex];

      if (!note) {
        return;
      }

      if (!audioContextRef.current) {
        const AudioContextClass = getAudioContextConstructor();

        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        }
      }

      const context = audioContextRef.current;

      if (context) {
        if (context.state === "suspended") {
          void context.resume();
        }

        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(note.frequency, context.currentTime);
        gain.gain.setValueAtTime(0.3, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          context.currentTime + duration / 1000,
        );

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + duration / 1000);
      }

      setActiveNote(noteIndex);
      clearActiveNoteTimeout();
      activeNoteTimeoutRef.current = safeTimeout(() => {
        activeNoteTimeoutRef.current = null;
        setActiveNote(null);
      }, duration);
    },
    [clearActiveNoteTimeout, safeTimeout],
  );

  useEffect(() => {
    return () => {
      clearActiveNoteTimeout();

      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [clearActiveNoteTimeout]);

  return {
    activeNote,
    playNote,
    clearActiveNote,
  };
};
