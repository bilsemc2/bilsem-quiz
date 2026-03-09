import { useCallback, useEffect, useRef, useState } from "react";

import {
  AUDIO_BASE_PATH,
  BACKGROUND_AUDIO,
  type SoundItem,
} from "../noiseFilterData.ts";
import {
  INITIAL_BACKGROUND_VOLUME,
  TARGET_AUDIO_DELAY_MS,
} from "./constants.ts";

export const useNoiseFilterAudio = () => {
  const targetAudioDelayRef = useRef<number | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const targetAudioRef = useRef<HTMLAudioElement | null>(null);
  const [backgroundVolume, setBackgroundVolume] = useState(
    INITIAL_BACKGROUND_VOLUME,
  );

  const clearTargetAudioDelay = useCallback(() => {
    if (targetAudioDelayRef.current !== null) {
      window.clearTimeout(targetAudioDelayRef.current);
      targetAudioDelayRef.current = null;
    }
  }, []);

  const safelyPlay = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) {
      return;
    }

    audio.play().catch(() => {
      // Some browsers block autoplay until the next gesture.
    });
  }, []);

  const stopTargetAudio = useCallback(() => {
    targetAudioRef.current?.pause();
    targetAudioRef.current = null;
  }, []);

  const pauseBackgroundAudio = useCallback(() => {
    bgAudioRef.current?.pause();
  }, []);

  const resumeBackgroundAudio = useCallback(() => {
    if (bgAudioRef.current?.paused) {
      safelyPlay(bgAudioRef.current);
    }
  }, [safelyPlay]);

  const resetBackgroundAudio = useCallback(() => {
    if (!bgAudioRef.current) {
      return;
    }

    bgAudioRef.current.currentTime = 0;
    safelyPlay(bgAudioRef.current);
  }, [safelyPlay]);

  const playTargetSound = useCallback(
    (sound: SoundItem, withDelay = false) => {
      clearTargetAudioDelay();
      stopTargetAudio();

      const startPlayback = () => {
        targetAudioRef.current = new Audio(AUDIO_BASE_PATH + sound.file);
        safelyPlay(targetAudioRef.current);
      };

      if (withDelay) {
        targetAudioDelayRef.current = window.setTimeout(
          startPlayback,
          TARGET_AUDIO_DELAY_MS,
        );
        return;
      }

      startPlayback();
    },
    [clearTargetAudioDelay, safelyPlay, stopTargetAudio],
  );

  const stopAllAudio = useCallback(() => {
    clearTargetAudioDelay();
    pauseBackgroundAudio();
    stopTargetAudio();
  }, [clearTargetAudioDelay, pauseBackgroundAudio, stopTargetAudio]);

  useEffect(() => {
    const backgroundAudio = new Audio(BACKGROUND_AUDIO);
    backgroundAudio.loop = true;
    backgroundAudio.volume = INITIAL_BACKGROUND_VOLUME;
    bgAudioRef.current = backgroundAudio;

    return () => {
      clearTargetAudioDelay();
      backgroundAudio.pause();
      bgAudioRef.current = null;
      stopTargetAudio();
    };
  }, [clearTargetAudioDelay, stopTargetAudio]);

  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = backgroundVolume;
    }
  }, [backgroundVolume]);

  return {
    backgroundVolume,
    setBackgroundVolume,
    pauseBackgroundAudio,
    playTargetSound,
    resetBackgroundAudio,
    resumeBackgroundAudio,
    stopAllAudio,
    stopTargetAudio,
  };
};
