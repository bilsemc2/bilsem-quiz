import { useCallback, useEffect, useRef, useState } from "react";
import { useSound } from "../../../hooks/useSound";

import {
  AUDIO_BASE_PATH,
  BACKGROUND_AUDIO,
  type SoundItem,
} from "../noiseFilterData.ts";
import {
  INITIAL_BACKGROUND_VOLUME,
  TARGET_AUDIO_DELAY_MS,
} from "./constants.ts";
import {
  canPlayNoiseFilterAudio,
  getNoiseFilterBackgroundVolume,
  getNoiseFilterTargetVolume,
} from "./audioModel.ts";

export const useNoiseFilterAudio = () => {
  const { isMuted, volume } = useSound();
  const targetAudioDelayRef = useRef<number | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const targetAudioRef = useRef<HTMLAudioElement | null>(null);
  const globalVolumeRef = useRef(volume);
  const mutedRef = useRef(isMuted);
  const backgroundVolumeRef = useRef(INITIAL_BACKGROUND_VOLUME);
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
    clearTargetAudioDelay();
    targetAudioRef.current?.pause();
    if (targetAudioRef.current) {
      targetAudioRef.current.currentTime = 0;
    }
    targetAudioRef.current = null;
  }, [clearTargetAudioDelay]);

  const pauseBackgroundAudio = useCallback(() => {
    bgAudioRef.current?.pause();
  }, []);

  const resumeBackgroundAudio = useCallback(() => {
    if (
      bgAudioRef.current?.paused &&
      canPlayNoiseFilterAudio(globalVolumeRef.current, mutedRef.current)
    ) {
      safelyPlay(bgAudioRef.current);
    }
  }, [safelyPlay]);

  const resetBackgroundAudio = useCallback(() => {
    if (!bgAudioRef.current) {
      return;
    }

    bgAudioRef.current.currentTime = 0;
    bgAudioRef.current.volume = getNoiseFilterBackgroundVolume(
      backgroundVolumeRef.current,
      globalVolumeRef.current,
      mutedRef.current,
    );
    if (!canPlayNoiseFilterAudio(globalVolumeRef.current, mutedRef.current)) {
      return;
    }
    safelyPlay(bgAudioRef.current);
  }, [safelyPlay]);

  const playTargetSound = useCallback(
    (sound: SoundItem, withDelay = false) => {
      clearTargetAudioDelay();
      stopTargetAudio();

      const startPlayback = () => {
        if (!canPlayNoiseFilterAudio(globalVolumeRef.current, mutedRef.current)) {
          return;
        }

        targetAudioRef.current = new Audio(AUDIO_BASE_PATH + sound.file);
        targetAudioRef.current.volume = getNoiseFilterTargetVolume(
          globalVolumeRef.current,
          mutedRef.current,
        );
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
    backgroundAudio.volume = getNoiseFilterBackgroundVolume(
      INITIAL_BACKGROUND_VOLUME,
      globalVolumeRef.current,
      mutedRef.current,
    );
    bgAudioRef.current = backgroundAudio;

    return () => {
      clearTargetAudioDelay();
      backgroundAudio.pause();
      bgAudioRef.current = null;
      stopTargetAudio();
    };
  }, [clearTargetAudioDelay, stopTargetAudio]);

  useEffect(() => {
    globalVolumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    mutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    backgroundVolumeRef.current = backgroundVolume;
  }, [backgroundVolume]);

  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = getNoiseFilterBackgroundVolume(
        backgroundVolume,
        volume,
        isMuted,
      );

      if (isMuted || volume <= 0) {
        bgAudioRef.current.pause();
      }
    }
  }, [backgroundVolume, isMuted, volume]);

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
