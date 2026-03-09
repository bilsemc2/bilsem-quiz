import { useCallback, useRef, useState } from "react";

import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import type { GamePhase } from "../shared/useGameEngine";
import {
  BETWEEN_NUMBER_DELAY_MS,
  NUMBER_SOUNDS,
  POST_SEQUENCE_HOLD_MS,
  PRE_NUMBER_DELAY_MS,
} from "./constants";

interface UseNumberSequencePlaybackParams {
  onListeningStart: () => void;
  onQuestionReady: () => void;
}

export const useNumberSequencePlayback = ({
  onListeningStart,
  onQuestionReady,
}: UseNumberSequencePlaybackParams) => {
  const safeTimeout = useSafeTimeout();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const playbackTokenRef = useRef(0);
  const phaseRef = useRef<GamePhase>("welcome");
  const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);

  const clearScheduledActions = useCallback(() => {
    playbackTokenRef.current += 1;
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentPlayIndex(-1);
  }, []);

  const scheduleAction = useCallback(
    (callback: () => void, delayMs: number) => {
      const timeoutId = safeTimeout(() => {
        timeoutIdsRef.current = timeoutIdsRef.current.filter(
          (trackedId) => trackedId !== timeoutId,
        );
        callback();
      }, delayMs);

      timeoutIdsRef.current.push(timeoutId);
      return timeoutId;
    },
    [safeTimeout],
  );

  const waitFor = useCallback(
    (delayMs: number, token: number) =>
      new Promise<boolean>((resolve) => {
        scheduleAction(() => {
          resolve(
            playbackTokenRef.current === token && phaseRef.current === "playing",
          );
        }, delayMs);
      }),
    [scheduleAction],
  );

  const playNumberAudio = useCallback(async (value: number, token: number) => {
    if (playbackTokenRef.current !== token || phaseRef.current !== "playing") {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(NUMBER_SOUNDS[value]);
      audioRef.current = audio;

      const finish = (result: boolean) => {
        audio.onended = null;
        audio.onerror = null;
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        resolve(
          result &&
            playbackTokenRef.current === token &&
            phaseRef.current === "playing",
        );
      };

      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.play().catch(() => finish(false));
    });
  }, []);

  const syncPhase = useCallback((phase: GamePhase) => {
    phaseRef.current = phase;
  }, []);

  const playSequence = useCallback(
    async (sequence: number[]) => {
      clearScheduledActions();
      const token = playbackTokenRef.current;
      onListeningStart();

      for (let index = 0; index < sequence.length; index += 1) {
        if (!(await waitFor(PRE_NUMBER_DELAY_MS, token))) {
          return;
        }

        setCurrentPlayIndex(index);

        if (!(await playNumberAudio(sequence[index], token))) {
          return;
        }

        if (!(await waitFor(BETWEEN_NUMBER_DELAY_MS, token))) {
          return;
        }
      }

      setCurrentPlayIndex(-1);

      if (!(await waitFor(POST_SEQUENCE_HOLD_MS, token))) {
        return;
      }

      onQuestionReady();
    },
    [clearScheduledActions, onListeningStart, onQuestionReady, playNumberAudio, waitFor],
  );

  return {
    clearScheduledActions,
    currentPlayIndex,
    playSequence,
    scheduleAction,
    syncPhase,
  };
};
