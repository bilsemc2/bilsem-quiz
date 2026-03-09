'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type DirectionId = 'up' | 'right' | 'down' | 'left';
type AnswerResult = 'correct' | 'wrong' | null;

interface DirectionStroopGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface GridPosition {
  row: number;
  col: number;
}

interface PromptState {
  word: string;
  correctDirection: DirectionId;
}

const INITIAL_LIVES = 5;
const MAX_LEVEL = 12;
const MIN_DURATION_SECONDS = 150;

const DIRECTION_ORDER: DirectionId[] = ['up', 'right', 'down', 'left'];

const DIRECTION_META: Record<
  DirectionId,
  {
    label: string;
    word: string;
    arrow: string;
  }
> = {
  up: {
    label: 'Yukari',
    word: 'YUKARI',
    arrow: '↑',
  },
  right: {
    label: 'Sag',
    word: 'SAG',
    arrow: '→',
  },
  down: {
    label: 'Asagi',
    word: 'ASAGI',
    arrow: '↓',
  },
  left: {
    label: 'Sol',
    word: 'SOL',
    arrow: '←',
  },
};

const PROMPT_POSITION_STYLE: Record<DirectionId, CSSProperties> = {
  up: {
    top: '-0.6rem',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  right: {
    top: '50%',
    right: '-0.9rem',
    transform: 'translateY(-50%)',
  },
  down: {
    bottom: '-0.6rem',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  left: {
    top: '50%',
    left: '-0.9rem',
    transform: 'translateY(-50%)',
  },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

function gridSizeForLevel(level: number): number {
  if (level >= 9) {
    return 7;
  }

  if (level >= 5) {
    return 6;
  }

  return 5;
}

function getCenterPosition(size: number): GridPosition {
  const center = Math.floor(size / 2);

  return { row: center, col: center };
}

function getDistance(first: GridPosition, second: GridPosition): number {
  return Math.abs(first.row - second.row) + Math.abs(first.col - second.col);
}

function createTargetPosition(size: number, playerPosition: GridPosition): GridPosition {
  let attempt = 0;

  while (attempt < 40) {
    const candidate = {
      row: randomInt(0, size - 1),
      col: randomInt(0, size - 1),
    };

    if (getDistance(candidate, playerPosition) >= 2) {
      return candidate;
    }

    attempt += 1;
  }

  return {
    row: size - 1,
    col: size - 1,
  };
}

function createPrompt(): PromptState {
  const positionIndex = randomInt(0, DIRECTION_ORDER.length - 1);
  const correctDirection = DIRECTION_ORDER[positionIndex] ?? 'up';

  let wordDirection = correctDirection;
  while (wordDirection === correctDirection) {
    wordDirection = DIRECTION_ORDER[randomInt(0, DIRECTION_ORDER.length - 1)] ?? 'left';
  }

  return {
    word: DIRECTION_META[wordDirection].word,
    correctDirection,
  };
}

function movePlayerTowardTarget(playerPosition: GridPosition, targetPosition: GridPosition): GridPosition {
  const rowDelta = targetPosition.row - playerPosition.row;
  const colDelta = targetPosition.col - playerPosition.col;

  if (Math.abs(rowDelta) >= Math.abs(colDelta) && rowDelta !== 0) {
    return {
      row: playerPosition.row + Math.sign(rowDelta),
      col: playerPosition.col,
    };
  }

  if (colDelta !== 0) {
    return {
      row: playerPosition.row,
      col: playerPosition.col + Math.sign(colDelta),
    };
  }

  return playerPosition;
}

export function DirectionStroopGameClient({
  gameId,
  gameTitle,
  durationSeconds,
}: DirectionStroopGameClientProps) {
  const sessionSeconds = useMemo(
    () => Math.max(MIN_DURATION_SECONDS, Math.floor(durationSeconds)),
    [durationSeconds],
  );

  const [phase, setPhase] = useState<Phase>('welcome');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [timeLeft, setTimeLeft] = useState(sessionSeconds);
  const [playerPosition, setPlayerPosition] = useState<GridPosition>(() =>
    getCenterPosition(gridSizeForLevel(1)),
  );
  const [targetPosition, setTargetPosition] = useState<GridPosition>(() =>
    createTargetPosition(gridSizeForLevel(1), getCenterPosition(gridSizeForLevel(1))),
  );
  const [prompt, setPrompt] = useState<PromptState>(() => createPrompt());
  const [selectedDirection, setSelectedDirection] = useState<DirectionId | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult>(null);
  const [message, setMessage] = useState<string>('Kelimenin dedigine degil, konumuna bak.');
  const [isResolving, setIsResolving] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [targetsReached, setTargetsReached] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);
  const bestStreakRef = useRef(0);
  const correctCountRef = useRef(0);
  const wrongCountRef = useRef(0);
  const targetsReachedRef = useRef(0);
  const transitionTimeoutRef = useRef<number | null>(null);

  const gridSize = useMemo(() => gridSizeForLevel(level), [level]);
  const accuracyPercent = useMemo(() => {
    const totalAnswers = correctCount + wrongCount;

    if (totalAnswers === 0) {
      return 0;
    }

    return Math.round((correctCount / totalAnswers) * 100);
  }, [correctCount, wrongCount]);
  const stepsRemaining = useMemo(
    () => getDistance(playerPosition, targetPosition),
    [playerPosition, targetPosition],
  );

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const resetBoard = useCallback((nextLevel: number) => {
    const nextGridSize = gridSizeForLevel(nextLevel);
    const center = getCenterPosition(nextGridSize);

    setPlayerPosition(center);
    setTargetPosition(createTargetPosition(nextGridSize, center));
    setPrompt(createPrompt());
    setSelectedDirection(null);
    setAnswerResult(null);
  }, []);

  const persistResult = useCallback(
    async (params: {
      finalScore: number;
      remainingLives: number;
      completed: boolean;
      levelReached: number;
    }) => {
      if (hasSavedRef.current) {
        return;
      }

      hasSavedRef.current = true;
      setIsSaving(true);

      const playedSeconds = Math.max(0, sessionSeconds - timeLeft);
      const totalAnswers = correctCountRef.current + wrongCountRef.current;
      const finalAccuracyPercent =
        totalAnswers > 0 ? Math.round((correctCountRef.current / totalAnswers) * 100) : 0;

      try {
        const response = await fetch('/api/game-plays', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameId,
            scoreAchieved: params.finalScore,
            durationSeconds: playedSeconds,
            livesRemaining: params.remainingLives,
            workshopType: 'bireysel',
            intelligenceType: 'uzamsal_dikkat',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              completed: params.completed,
              correctCount: correctCountRef.current,
              wrongCount: wrongCountRef.current,
              targetsReached: targetsReachedRef.current,
              bestStreak: bestStreakRef.current,
              accuracyPercent: finalAccuracyPercent,
              timeExpired: timeLeft <= 0,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as { id?: string };
        setSaveStatus(payload.id ? `Kaydedildi (${payload.id.slice(0, 8)})` : 'Kaydedildi');
      } catch (error) {
        setSaveStatus(error instanceof Error ? `Kayit hatasi: ${error.message}` : 'Kayit hatasi');
      } finally {
        setIsSaving(false);
      }
    },
    [gameId, sessionSeconds, timeLeft],
  );

  const finishGame = useCallback(
    async (params: {
      completed: boolean;
      remainingLives: number;
      finalScore?: number;
      levelReached?: number;
    }) => {
      clearTransitionTimeout();
      setPhase('finished');
      setIsResolving(false);
      setSelectedDirection(null);

      const finalScore = params.finalScore ?? score;
      const levelReached = params.levelReached ?? level;

      if (finalScore !== score) {
        setScore(finalScore);
      }

      await persistResult({
        finalScore,
        remainingLives: params.remainingLives,
        completed: params.completed,
        levelReached,
      });
    },
    [clearTransitionTimeout, level, persistResult, score],
  );

  const startGame = useCallback(() => {
    clearTransitionTimeout();
    hasSavedRef.current = false;
    bestStreakRef.current = 0;
    correctCountRef.current = 0;
    wrongCountRef.current = 0;
    targetsReachedRef.current = 0;

    setPhase('playing');
    setLevel(1);
    setScore(0);
    setLives(INITIAL_LIVES);
    setTimeLeft(sessionSeconds);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setTargetsReached(0);
    setMessage('Kelimenin dedigine degil, konumuna bak.');
    setSaveStatus(null);
    setIsSaving(false);
    setIsResolving(false);

    resetBoard(1);
  }, [clearTransitionTimeout, resetBoard, sessionSeconds]);

  useEffect(() => {
    setTimeLeft(sessionSeconds);
  }, [sessionSeconds]);

  useEffect(() => {
    return () => {
      clearTransitionTimeout();
    };
  }, [clearTransitionTimeout]);

  useEffect(() => {
    if (phase !== 'playing') {
      return;
    }

    if (timeLeft <= 0) {
      void finishGame({
        completed: false,
        remainingLives: lives,
        finalScore: score,
        levelReached: level,
      });
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishGame, level, lives, phase, score, timeLeft]);

  const handleAnswer = useCallback(
    (direction: DirectionId) => {
      if (phase !== 'playing' || isResolving) {
        return;
      }

      const currentPrompt = prompt;
      const isCorrect = direction === currentPrompt.correctDirection;

      setSelectedDirection(direction);
      setAnswerResult(isCorrect ? 'correct' : 'wrong');
      setIsResolving(true);

      if (isCorrect) {
        const nextCorrectCount = correctCountRef.current + 1;
        const nextStreak = streak + 1;
        const nextBestStreak = Math.max(bestStreakRef.current, nextStreak);
        const movedPlayer = movePlayerTowardTarget(playerPosition, targetPosition);
        const reachedTarget = getDistance(movedPlayer, targetPosition) === 0;
        const basePoints = 55 + level * 8 + Math.min(30, streak * 5);
        const targetBonus = reachedTarget ? 80 + level * 10 : 0;
        const nextScore = score + basePoints + targetBonus;

        correctCountRef.current = nextCorrectCount;
        bestStreakRef.current = nextBestStreak;

        setCorrectCount(nextCorrectCount);
        setStreak(nextStreak);
        setBestStreak(nextBestStreak);
        setScore(nextScore);
        setMessage(
          reachedTarget
            ? `Hedefe ulastin. +${basePoints + targetBonus} puan`
            : `Dogru karar. +${basePoints} puan`,
        );

        clearTransitionTimeout();
        transitionTimeoutRef.current = window.setTimeout(() => {
          if (reachedTarget) {
            const nextTargetsReached = targetsReachedRef.current + 1;
            targetsReachedRef.current = nextTargetsReached;
            setTargetsReached(nextTargetsReached);

            if (level >= MAX_LEVEL) {
              void finishGame({
                completed: true,
                remainingLives: lives,
                finalScore: nextScore,
                levelReached: level,
              });
              return;
            }

            const nextLevel = level + 1;
            setLevel(nextLevel);
            resetBoard(nextLevel);
            setMessage('Yeni hedef acildi. Yine konuma odaklan.');
          } else {
            setPlayerPosition(movedPlayer);
            setPrompt(createPrompt());
            setSelectedDirection(null);
            setAnswerResult(null);
            setMessage('Dogru. Siradaki kelimede de konumu izle.');
          }

          setIsResolving(false);
        }, 650);

        return;
      }

      const nextWrongCount = wrongCountRef.current + 1;
      const nextLives = lives - 1;

      wrongCountRef.current = nextWrongCount;

      setWrongCount(nextWrongCount);
      setStreak(0);
      setLives(nextLives);
      setMessage('Yanlis. Kelimeye degil, kutunun kenarindaki yerine bak.');

      clearTransitionTimeout();
      transitionTimeoutRef.current = window.setTimeout(() => {
        if (nextLives <= 0) {
          void finishGame({
            completed: false,
            remainingLives: 0,
            finalScore: score,
            levelReached: level,
          });
          return;
        }

        setPrompt(createPrompt());
        setSelectedDirection(null);
        setAnswerResult(null);
        setIsResolving(false);
        setMessage('Devam et. Bu kez kelimenin konumuna odaklan.');
      }, 750);
    },
    [
      clearTransitionTimeout,
      finishGame,
      isResolving,
      level,
      lives,
      phase,
      playerPosition,
      prompt,
      resetBoard,
      score,
      streak,
      targetPosition,
    ],
  );

  const getDirectionButtonStyle = useCallback(
    (direction: DirectionId): CSSProperties => {
      const isSelected = selectedDirection === direction;
      const isCorrectDirection = prompt.correctDirection === direction;

      if (answerResult === 'correct' && isCorrectDirection) {
        return {
          background: '#dcfce7',
          borderColor: '#22c55e',
          color: '#166534',
        };
      }

      if (answerResult === 'wrong' && isSelected) {
        return {
          background: '#fee2e2',
          borderColor: '#ef4444',
          color: '#991b1b',
        };
      }

      if (answerResult === 'wrong' && isCorrectDirection) {
        return {
          background: '#dbeafe',
          borderColor: '#3b82f6',
          color: '#1d4ed8',
        };
      }

      if (isSelected) {
        return {
          background: '#dbeafe',
          borderColor: '#2563eb',
          color: '#1d4ed8',
        };
      }

      return {};
    },
    [answerResult, prompt.correctDirection, selectedDirection],
  );

  return (
    <div className="stack" style={{ maxWidth: 960 }}>
      <div className="stack-sm">
        <Link className="btn btn-ghost" href="/games" style={{ width: 'fit-content' }}>
          Oyun listesine don
        </Link>
        <div>
          <h1>{gameTitle}</h1>
          <p className="muted" style={{ margin: 0 }}>
            Stroop etkisini as ve kelimenin dedigine degil konumuna gore karar ver.
          </p>
        </div>
      </div>

      {phase === 'welcome' ? (
        <div className="grid-2">
          <section className="card stack">
            <div className="stack-sm">
              <h2 className="card-title">Nasıl oynanır?</h2>
              <p className="muted" style={{ margin: 0 }}>
                Kenarda duran kelime seni sasirtmaya calisir. Dogru cevap, kelimenin anlami degil
                ekranda durdugu yonudur.
              </p>
            </div>
            <ul className="muted" style={{ margin: 0, paddingLeft: '1rem' }}>
              <li>Her dogru cevap seni hedef yildiza bir adim yaklastirir.</li>
              <li>Yanlis cevap can eksiltir; canin biterse tur biter.</li>
              <li>Her hedefte alan buyur ve dikkat baskisi artar.</li>
            </ul>
          </section>

          <section className="card stack">
            <div className="grid-2">
              <div>
                <p className="muted" style={{ margin: 0 }}>Sure</p>
                <p className="metric">{Math.ceil(sessionSeconds / 60)} dk</p>
              </div>
              <div>
                <p className="muted" style={{ margin: 0 }}>Can</p>
                <p className="metric">{INITIAL_LIVES}</p>
              </div>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Hedefe ilerlemek icin tutarlilik gerekiyor. Uzun seri yaparsan puan carpani da buyur.
            </p>
            <Button onClick={startGame}>Oyunu baslat</Button>
          </section>
        </div>
      ) : null}

      {phase === 'playing' ? (
        <>
          <section className="grid-3">
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>Skor</p>
              <p className="metric">{score}</p>
            </div>
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>Sure</p>
              <p className="metric">{formatClock(timeLeft)}</p>
            </div>
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>Can / Seviye</p>
              <p className="metric">
                {lives} / {level}
              </p>
            </div>
          </section>

          <section className="grid-2" style={{ alignItems: 'start' }}>
            <div className="card stack" style={{ minHeight: 440 }}>
              <div className="stack-sm">
                <h2 className="card-title">Arena</h2>
                <p className="muted" style={{ margin: 0 }}>
                  Hedefe kalan adim: {stepsRemaining}
                </p>
              </div>

              <div
                style={{
                  position: 'relative',
                  margin: '0 auto',
                  width: 'min(100%, 360px)',
                  padding: '1.4rem',
                }}
              >
                <div
                  aria-label="stroop prompt"
                  style={{
                    position: 'absolute',
                    zIndex: 2,
                    minWidth: 96,
                    textAlign: 'center',
                    borderRadius: 999,
                    padding: '0.45rem 0.9rem',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    ...PROMPT_POSITION_STYLE[prompt.correctDirection],
                  }}
                >
                  {prompt.word}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    gap: '0.45rem',
                    padding: '1rem',
                    borderRadius: 20,
                    background: '#f8fafc',
                    border: '1px solid #dbeafe',
                  }}
                >
                  {Array.from({ length: gridSize * gridSize }).map((_, index) => {
                    const row = Math.floor(index / gridSize);
                    const col = index % gridSize;
                    const isPlayer = playerPosition.row === row && playerPosition.col === col;
                    const isTarget = targetPosition.row === row && targetPosition.col === col;

                    return (
                      <div
                        key={`${row}-${col}`}
                        style={{
                          aspectRatio: '1 / 1',
                          borderRadius: 14,
                          display: 'grid',
                          placeItems: 'center',
                          background: isTarget ? '#fce7f3' : '#e2e8f0',
                          border: isTarget ? '2px dashed #db2777' : '1px solid #cbd5e1',
                          fontWeight: 700,
                        }}
                      >
                        {isPlayer ? (
                          <span
                            aria-label="player"
                            style={{
                              width: '58%',
                              height: '58%',
                              borderRadius: '999px',
                              background: '#2563eb',
                              boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.16)',
                            }}
                          />
                        ) : null}
                        {isTarget && !isPlayer ? (
                          <span aria-label="target" style={{ color: '#db2777', fontSize: '1.3rem' }}>
                            ★
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="stack">
              <section className="card stack">
                <div className="stack-sm">
                  <h2 className="card-title">Ipuclari</h2>
                  <p className="muted" style={{ margin: 0 }}>
                    Kelime ne yazarsa yazsin, sadece durdugu yone bas.
                  </p>
                </div>
                <p style={{ margin: 0, fontWeight: 600 }}>{message}</p>
                <div className="grid-2">
                  <div>
                    <p className="muted" style={{ margin: 0 }}>Seri</p>
                    <p className="metric">{streak}</p>
                  </div>
                  <div>
                    <p className="muted" style={{ margin: 0 }}>En iyi seri</p>
                    <p className="metric">{bestStreak}</p>
                  </div>
                </div>
              </section>

              <section className="card stack">
                <h2 className="card-title">Yon Secimi</h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '0.75rem',
                    alignItems: 'stretch',
                  }}
                >
                  <div />
                  <Button
                    variant="secondary"
                    disabled={isResolving}
                    onClick={() => handleAnswer('up')}
                    style={getDirectionButtonStyle('up')}
                  >
                    {DIRECTION_META.up.arrow} {DIRECTION_META.up.label}
                  </Button>
                  <div />

                  <Button
                    variant="secondary"
                    disabled={isResolving}
                    onClick={() => handleAnswer('left')}
                    style={getDirectionButtonStyle('left')}
                  >
                    {DIRECTION_META.left.arrow} {DIRECTION_META.left.label}
                  </Button>
                  <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <p className="muted" style={{ margin: 0 }}>Hedef</p>
                    <p className="metric" style={{ fontSize: '1.2rem' }}>{targetsReached}</p>
                  </div>
                  <Button
                    variant="secondary"
                    disabled={isResolving}
                    onClick={() => handleAnswer('right')}
                    style={getDirectionButtonStyle('right')}
                  >
                    {DIRECTION_META.right.arrow} {DIRECTION_META.right.label}
                  </Button>

                  <div />
                  <Button
                    variant="secondary"
                    disabled={isResolving}
                    onClick={() => handleAnswer('down')}
                    style={getDirectionButtonStyle('down')}
                  >
                    {DIRECTION_META.down.arrow} {DIRECTION_META.down.label}
                  </Button>
                  <div />
                </div>
              </section>
            </div>
          </section>
        </>
      ) : null}

      {phase === 'finished' ? (
        <section className="card stack" style={{ maxWidth: 720 }}>
          <div className="stack-sm">
            <h2 className="card-title">Tur tamamlandi</h2>
            <p className="muted" style={{ margin: 0 }}>
              {saveStatus ?? (isSaving ? 'Skor kaydediliyor...' : 'Oturum kapatildi.')}
            </p>
          </div>

          <div className="grid-2">
            <div>
              <p className="muted" style={{ margin: 0 }}>Final skor</p>
              <p className="metric">{score}</p>
            </div>
            <div>
              <p className="muted" style={{ margin: 0 }}>Seviye</p>
              <p className="metric">{level}</p>
            </div>
            <div>
              <p className="muted" style={{ margin: 0 }}>Dogruluk</p>
              <p className="metric">{accuracyPercent}%</p>
            </div>
            <div>
              <p className="muted" style={{ margin: 0 }}>Hedef</p>
              <p className="metric">{targetsReached}</p>
            </div>
          </div>

          <div className="grid-3">
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>Dogru</p>
              <p className="metric">{correctCount}</p>
            </div>
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>Yanlis</p>
              <p className="metric">{wrongCount}</p>
            </div>
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>En iyi seri</p>
              <p className="metric">{bestStreak}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={startGame}>Tekrar oyna</Button>
            <Link className="btn btn-secondary" href="/games">
              Diger oyunlara bak
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
