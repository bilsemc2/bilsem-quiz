import { useCallback, useEffect, useRef, useState } from "react";

import { useGameFeedback } from "../../../hooks/useGameFeedback.ts";
import { useSound } from "../../../hooks/useSound.ts";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout.ts";
import { useGameEngine } from "../shared/useGameEngine.ts";
import {
  FEEDBACK_DURATION_MS,
  GAME_ID,
  MAX_LEVEL,
  checkStep,
  computeScore,
  generateSequence,
  getDelayTime,
  getDisplayTime,
  isSequenceComplete,
} from "./logic.ts";
import type { LocalPhase, SequenceStep } from "./logic.ts";

export const useColorGridController = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: FEEDBACK_DURATION_MS });
  const { showFeedback, dismissFeedback } = feedback;

  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [localPhase, setLocalPhase] = useState<LocalPhase>("showing");
  const [sequence, setSequence] = useState<SequenceStep[]>([]);
  const [userSequence, setUserSequence] = useState<SequenceStep[]>([]);
  const [cells, setCells] = useState(
    Array(9)
      .fill(null)
      .map((_, i) => ({ id: i, activeColor: null as string | null })),
  );

  const sequenceRunningRef = useRef(false);

  const showSequenceAnimation = useCallback(
    async (seq: SequenceStep[], lvl: number) => {
      sequenceRunningRef.current = true;
      setLocalPhase("showing");
      const displayTime = getDisplayTime(lvl);
      const delayTime = getDelayTime(lvl);

      await new Promise((r) => setTimeout(r, 600));

      for (let i = 0; i < seq.length; i++) {
        if (!sequenceRunningRef.current) return;
        const { cellId, colorId } = seq[i];
        setCells((prev) =>
          prev.map((c) => (c.id === cellId ? { ...c, activeColor: colorId } : c)),
        );
        playSound("pop");
        await new Promise((r) => setTimeout(r, displayTime));
        if (!sequenceRunningRef.current) return;
        setCells((prev) =>
          prev.map((c) => (c.id === cellId ? { ...c, activeColor: null } : c)),
        );
        if (i < seq.length - 1) {
          await new Promise((r) => setTimeout(r, delayTime));
        }
      }
      if (!sequenceRunningRef.current) return;
      setLocalPhase("playing");
      setUserSequence([]);
    },
    [playSound],
  );

  const startSequence = useCallback(
    (lvl: number) => {
      const newSeq = generateSequence(lvl);
      setSequence(newSeq);
      setCells((prev) => prev.map((c) => ({ ...c, activeColor: null })));
      showSequenceAnimation(newSeq, lvl);
    },
    [showSequenceAnimation],
  );

  useEffect(() => {
    if (phase === "playing" && sequence.length === 0) {
      startSequence(level);
    } else if (phase === "welcome") {
      sequenceRunningRef.current = false;
      setSequence([]);
      setUserSequence([]);
      setCells((prev) => prev.map((c) => ({ ...c, activeColor: null })));
    }
  }, [phase, level, sequence.length, startSequence]);

  useEffect(() => {
    return () => {
      sequenceRunningRef.current = false;
    };
  }, []);

  const handleCellClick = (cellId: number) => {
    if (localPhase !== "playing" || phase !== "playing") return;

    const currentStep = userSequence.length;
    const isCorrectStep = checkStep(cellId, sequence, currentStep);

    if (!isCorrectStep) {
      playSound("incorrect");
      showFeedback(false);
      setLocalPhase("feedback");

      safeTimeout(() => {
        dismissFeedback();
        loseLife();
        if (engine.lives > 1) {
          startSequence(level);
        }
      }, FEEDBACK_DURATION_MS);
      return;
    }

    const expected = sequence[currentStep];
    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, activeColor: expected.colorId } : c)),
    );
    playSound("select");

    const newUserSequence = [...userSequence, expected];
    setUserSequence(newUserSequence);

    safeTimeout(() => {
      setCells((prev) =>
        prev.map((c) => (c.id === cellId ? { ...c, activeColor: null } : c)),
      );
      if (isSequenceComplete(newUserSequence.length, sequence.length)) {
        setLocalPhase("feedback");
        showFeedback(true);
        safeTimeout(() => {
          dismissFeedback();
          addScore(computeScore(level));
          nextLevel();
          if (level < MAX_LEVEL) {
            startSequence(level + 1);
          }
        }, FEEDBACK_DURATION_MS);
      }
    }, 300);
  };

  return {
    engine,
    feedback,
    localPhase,
    cells,
    handleCellClick,
  };
};
