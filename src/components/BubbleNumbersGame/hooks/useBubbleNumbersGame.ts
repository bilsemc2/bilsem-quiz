import { useCallback, useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { soundManager } from '../sounds';
import { PowerUpManager } from '../powerups/PowerUpManager';
import { POWER_UPS, type PowerUpType } from '../powerups/types';
import {
  EXTRA_TIME_SECONDS,
  GAME_HEIGHT,
  GAME_WIDTH,
  HINT_DURATION_MS,
  INITIAL_TIME,
  LEVEL_UP_DELAY_MS,
  WRONG_ANSWER_SCORE_PENALTY,
  WRONG_ANSWER_TIME_PENALTY,
  advanceBubblePopProgress,
  calculateBubblePopScore,
  createLevelState,
  pickNextTargetNumber,
  type Bubble,
  updateBubblePositions
} from '../model/bubbleNumbersGameModel';

export interface BubblePowerUpState {
  type: PowerUpType;
  canUse: boolean;
  isActive: boolean;
  cooldown: number;
}

export interface BubbleNumbersGameController {
  canvasRef: RefObject<HTMLCanvasElement>;
  targetNumber: number;
  score: number;
  timeLeft: number;
  gameOver: boolean;
  level: number;
  isPaused: boolean;
  isMuted: boolean;
  powerUpStates: BubblePowerUpState[];
  handleCanvasClick: (event: MouseEvent<HTMLCanvasElement>) => void;
  handlePowerUp: (type: PowerUpType) => void;
  togglePause: () => void;
  toggleMute: () => void;
}

interface BubbleNumbersGameOptions {
  focusPlayArea?: () => void;
}

export const useBubbleNumbersGame = ({
  focusPlayArea
}: BubbleNumbersGameOptions = {}): BubbleNumbersGameController => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const timerRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const powerUpManagerRef = useRef(new PowerUpManager());

  const [currentTime, setCurrentTime] = useState(0);
  const [targetNumber, setTargetNumber] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const registerTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delayMs);

    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIdsRef.current = [];
    };
  }, []);

  const handlePowerUp = useCallback((type: PowerUpType) => {
    if (!powerUpManagerRef.current.canUsePowerUp(type, currentTime)) {
      return;
    }

    soundManager.play('pop');
    powerUpManagerRef.current.activatePowerUp(type, currentTime);

    switch (type) {
      case 'timeFreeze':
        setIsPaused(true);
        registerTimeout(() => setIsPaused(false), POWER_UPS[type].duration * 1000);
        break;
      case 'extraTime':
        setTimeLeft((previous) => previous + EXTRA_TIME_SECONDS);
        break;
      case 'hint': {
        const hintedBubble = bubblesRef.current.find(
          (bubble) => bubble.result === targetNumber && !bubble.popping
        );

        if (!hintedBubble) {
          break;
        }

        hintedBubble.highlighted = true;
        registerTimeout(() => {
          hintedBubble.highlighted = false;
        }, HINT_DURATION_MS);
        break;
      }
      default:
        break;
    }
  }, [currentTime, registerTimeout, targetNumber]);

  const updateBubbles = useCallback((delta: number) => {
    const activePowerUps = powerUpManagerRef.current.getActivePowerUps(currentTime);
    bubblesRef.current = updateBubblePositions(bubblesRef.current, delta, activePowerUps);
  }, [currentTime]);

  const drawBubbles = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    bubblesRef.current.forEach((bubble) => {
      if (bubble.popping) {
        const popProgress = bubble.popProgress ?? 0;
        context.beginPath();
        context.arc(
          bubble.x,
          bubble.y,
          bubble.size * (1 + popProgress * 0.5),
          0,
          Math.PI * 2
        );
        context.fillStyle = `rgba(33, 150, 243, ${0.3 * (1 - popProgress)})`;
        context.fill();
        context.strokeStyle = `rgba(33, 150, 243, ${0.6 * (1 - popProgress)})`;
        context.stroke();
        return;
      }

      context.beginPath();
      context.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      if (bubble.highlighted) {
        context.fillStyle = 'rgba(255, 215, 0, 0.3)';
        context.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      } else {
        context.fillStyle = 'rgba(33, 150, 243, 0.3)';
        context.strokeStyle = 'rgba(33, 150, 243, 0.6)';
      }

      context.fill();
      context.stroke();
      context.fillStyle = '#1976D2';
      context.font = `${bubble.size / 2}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(bubble.operation, bubble.x, bubble.y);
    });

    bubblesRef.current = advanceBubblePopProgress(bubblesRef.current);
  }, []);

  const handleCanvasClick = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    if (gameOver || isPaused) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedBubble = bubblesRef.current.find((bubble) => {
      const distance = Math.hypot(bubble.x - x, bubble.y - y);
      return distance <= bubble.size && !bubble.popping;
    });

    if (!clickedBubble) {
      return;
    }

    if (clickedBubble.result === targetNumber) {
      soundManager.play('pop');

      bubblesRef.current = bubblesRef.current.map((bubble) =>
        bubble.id === clickedBubble.id
          ? { ...bubble, popping: true, popProgress: 0 }
          : bubble
      );

      const hasDoublePop = powerUpManagerRef.current.isPowerUpActive('doublePop', currentTime);
      setScore((previous) => previous + calculateBubblePopScore(level, hasDoublePop));

      const nextTargetNumber = pickNextTargetNumber(bubblesRef.current, clickedBubble.id);
      if (nextTargetNumber !== null) {
        setTargetNumber(nextTargetNumber);
        return;
      }

      const nextLevel = level + 1;
      const nextLevelState = createLevelState(nextLevel);

      soundManager.play('pop');
      setIsPaused(true);
      registerTimeout(() => {
        bubblesRef.current = nextLevelState.bubbles;
        setTargetNumber(nextLevelState.targetNumber);
        setLevel(nextLevel);
        setTimeLeft((previous) => previous + nextLevelState.settings.timeBonus);
        setIsPaused(false);
        focusPlayArea?.();
      }, LEVEL_UP_DELAY_MS);
      return;
    }

    soundManager.play('wrong');
    setScore((previous) => Math.max(0, previous - WRONG_ANSWER_SCORE_PENALTY));
    setTimeLeft((previous) => Math.max(0, previous - WRONG_ANSWER_TIME_PENALTY));
  }, [currentTime, focusPlayArea, gameOver, isPaused, level, registerTimeout, targetNumber]);

  const gameLoop = useCallback((timestamp: number) => {
    if (isPaused) {
      return;
    }

    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
    }

    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    updateBubbles(delta);
    drawBubbles();

    if (!gameOver) {
      animationFrameRef.current = window.requestAnimationFrame(gameLoop);
    }
  }, [drawBubbles, gameOver, isPaused, updateBubbles]);

  useEffect(() => {
    const initialLevelState = createLevelState(1);
    bubblesRef.current = initialLevelState.bubbles;
    setTargetNumber(initialLevelState.targetNumber);
    focusPlayArea?.();
  }, [focusPlayArea]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationFrameRef.current = window.requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    if (gameOver || isPaused) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 0) {
          setGameOver(true);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [gameOver, isPaused]);

  const togglePause = useCallback(() => {
    setIsPaused((previous) => !previous);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((previous) => !previous);
  }, []);

  const powerUpStates: BubblePowerUpState[] = (Object.keys(POWER_UPS) as PowerUpType[]).map((type) => ({
    type,
    canUse: powerUpManagerRef.current.canUsePowerUp(type, currentTime),
    isActive: powerUpManagerRef.current.isPowerUpActive(type, currentTime),
    cooldown: powerUpManagerRef.current.getRemainingCooldown(type, currentTime)
  }));

  return {
    canvasRef,
    targetNumber,
    score,
    timeLeft,
    gameOver,
    level,
    isPaused,
    isMuted,
    powerUpStates,
    handleCanvasClick,
    handlePowerUp,
    togglePause,
    toggleMute
  };
};

export const bubbleNumbersGameCanvasSize = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT
};
