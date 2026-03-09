import { useCallback, useRef, useState } from "react";

import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import type { GamePhase } from "../shared/useGameEngine";
import {
  ANSWER_PHASE_DELAY_MS,
  NOTE_PLAY_DURATION_MS,
  POST_SEQUENCE_HOLD_MS,
  PRE_NOTE_DELAY_MS,
} from "./constants";

interface UseAuditorySequencePlaybackParams {
  playNote: (noteIndex: number, duration: number) => void;
  onListeningStart: () => void;
  onAnswerPhaseReady: () => void;
}

export const useAuditorySequencePlayback = ({
  playNote,
  onListeningStart,
  onAnswerPhaseReady,
}: UseAuditorySequencePlaybackParams) => {
  const safeTimeout = useSafeTimeout();
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const playbackTokenRef = useRef(0);
  const phaseRef = useRef<GamePhase>("welcome");
  const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);

  const clearScheduledActions = useCallback(() => {
    playbackTokenRef.current += 1;
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
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

  const syncPhase = useCallback((phase: GamePhase) => {
    phaseRef.current = phase;
  }, []);

  const playSequence = useCallback(
    async (sequence: number[]) => {
      clearScheduledActions();
      const token = playbackTokenRef.current;
      onListeningStart();

      for (let index = 0; index < sequence.length; index += 1) {
        if (!(await waitFor(PRE_NOTE_DELAY_MS, token))) {
          return;
        }

        setCurrentPlayIndex(index);
        playNote(sequence[index], NOTE_PLAY_DURATION_MS);

        if (!(await waitFor(NOTE_PLAY_DURATION_MS, token))) {
          return;
        }
      }

      if (!(await waitFor(POST_SEQUENCE_HOLD_MS, token))) {
        return;
      }

      setCurrentPlayIndex(-1);

      if (!(await waitFor(ANSWER_PHASE_DELAY_MS, token))) {
        return;
      }

      onAnswerPhaseReady();
    },
    [
      clearScheduledActions,
      onAnswerPhaseReady,
      onListeningStart,
      playNote,
      waitFor,
    ],
  );

  return {
    currentPlayIndex,
    clearScheduledActions,
    scheduleAction,
    syncPhase,
    playSequence,
  };
};
