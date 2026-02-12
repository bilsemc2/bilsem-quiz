'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'showing' | 'input' | 'feedback' | 'finished';
type GameMode = 'NORMAL' | 'REVERSE';

interface CosmicMemoryGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface FinishGameOptions {
  completed: boolean;
  remainingLives: number;
  levelsCompleted: number;
  finalScoreOverride?: number;
}

const INITIAL_LIVES = 5;
const MAX_LEVEL = 10;

function getGridSize(level: number): number {
  if (level <= 3) {
    return 3;
  }

  if (level <= 7) {
    return 4;
  }

  return 5;
}

function generateSequence(level: number, gridSize: number): number[] {
  const length = Math.min(level + 2, gridSize * gridSize);
  return Array.from({ length }, () => Math.floor(Math.random() * gridSize * gridSize));
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CosmicMemoryGameClient({ gameId, gameTitle, durationSeconds }: CosmicMemoryGameClientProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [gridSize, setGridSize] = useState(3);
  const [mode, setMode] = useState<GameMode>('NORMAL');
  const [sequence, setSequence] = useState<number[]>([]);
  const [showStep, setShowStep] = useState(0);
  const [highlightCell, setHighlightCell] = useState<number | null>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [roundSuccess, setRoundSuccess] = useState<boolean | null>(null);
  const [roundMessage, setRoundMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);
  const showHideTimerRef = useRef<number | null>(null);
  const showStepTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const clearShowTimers = useCallback(() => {
    if (showHideTimerRef.current !== null) {
      window.clearTimeout(showHideTimerRef.current);
      showHideTimerRef.current = null;
    }

    if (showStepTimerRef.current !== null) {
      window.clearTimeout(showStepTimerRef.current);
      showStepTimerRef.current = null;
    }
  }, []);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  const clearRoundTimers = useCallback(() => {
    clearShowTimers();
    clearFeedbackTimer();
  }, [clearFeedbackTimer, clearShowTimers]);

  useEffect(() => {
    return () => {
      clearRoundTimers();
    };
  }, [clearRoundTimers]);

  const persistResult = useCallback(
    async (params: { finalScore: number; remainingLives: number; completed: boolean; levelsCompleted: number }) => {
      if (hasSavedRef.current) {
        return;
      }

      hasSavedRef.current = true;
      setIsSaving(true);

      const playedSeconds = Math.max(0, durationSeconds - timeLeft);

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
            intelligenceType: 'kozmik_hafiza',
            metadata: {
              completed: params.completed,
              levelsCompleted: params.levelsCompleted,
              levelReached: level,
              mode,
              gridSize,
              source: 'cosmic-memory-migrated',
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as { id?: string };
        if (payload.id) {
          setSaveStatus(`Sonuc kaydedildi (${payload.id.slice(0, 8)})`);
        } else {
          setSaveStatus('Sonuc kaydedildi');
        }
      } catch (error) {
        setSaveStatus(error instanceof Error ? `Kayit hatasi: ${error.message}` : 'Kayit hatasi');
      } finally {
        setIsSaving(false);
      }
    },
    [durationSeconds, gameId, gridSize, level, mode, timeLeft],
  );

  const finishGame = useCallback(
    async ({ completed, remainingLives, levelsCompleted, finalScoreOverride }: FinishGameOptions) => {
      clearRoundTimers();
      setPhase('finished');

      const completionBonus = completed ? 250 : 0;
      const baseScore = finalScoreOverride ?? score;
      const finalScore = baseScore + (finalScoreOverride === undefined ? completionBonus : 0);

      if (finalScore !== score) {
        setScore(finalScore);
      }

      await persistResult({
        finalScore,
        remainingLives,
        completed,
        levelsCompleted,
      });
    },
    [clearRoundTimers, persistResult, score],
  );

  const startLevel = useCallback(
    (nextLevel: number) => {
      clearRoundTimers();

      const nextGridSize = getGridSize(nextLevel);
      const nextMode: GameMode = nextLevel > 5 ? (Math.random() > 0.5 ? 'REVERSE' : 'NORMAL') : 'NORMAL';
      const nextSequence = generateSequence(nextLevel, nextGridSize);

      setLevel(nextLevel);
      setGridSize(nextGridSize);
      setMode(nextMode);
      setSequence(nextSequence);
      setShowStep(0);
      setHighlightCell(null);
      setUserSequence([]);
      setRoundSuccess(null);
      setRoundMessage('Sekansi izle.');
      setPhase('showing');
    },
    [clearRoundTimers],
  );

  const startGame = useCallback(() => {
    clearRoundTimers();

    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setTimeLeft(durationSeconds);
    setRoundSuccess(null);
    setRoundMessage(null);
    setSaveStatus(null);
    setIsSaving(false);
    startLevel(1);
  }, [clearRoundTimers, durationSeconds, startLevel]);

  useEffect(() => {
    if (phase !== 'showing') {
      return;
    }

    if (showStep >= sequence.length) {
      clearShowTimers();
      setHighlightCell(null);
      setRoundMessage(mode === 'REVERSE' ? 'Ters sirayla tikla.' : 'Ayni sirayla tikla.');
      setPhase('input');
      return;
    }

    const activeCell = sequence[showStep];
    setHighlightCell(activeCell);

    clearShowTimers();
    showHideTimerRef.current = window.setTimeout(() => {
      setHighlightCell(null);
    }, 600);

    showStepTimerRef.current = window.setTimeout(() => {
      setShowStep((previous) => previous + 1);
    }, 1000);
  }, [clearShowTimers, mode, phase, sequence, showStep]);

  useEffect(() => {
    if (phase !== 'showing' && phase !== 'input' && phase !== 'feedback') {
      return;
    }

    if (timeLeft <= 0) {
      void finishGame({
        completed: false,
        remainingLives: lives,
        levelsCompleted: Math.max(0, level - 1),
      });
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishGame, level, lives, phase, timeLeft]);

  const handleCellClick = useCallback(
    (cellIndex: number) => {
      if (phase !== 'input' || highlightCell !== null) {
        return;
      }

      const step = userSequence.length;
      const expected =
        mode === 'NORMAL' ? sequence[step] : sequence[sequence.length - 1 - step];

      if (cellIndex === expected) {
        const nextUserSequence = [...userSequence, cellIndex];
        setUserSequence(nextUserSequence);

        if (nextUserSequence.length === sequence.length) {
          const gained = level * 100;
          const victoryBonus = level >= MAX_LEVEL ? 500 : 0;
          const roundTotal = gained + victoryBonus;
          const nextScore = score + roundTotal;

          setScore(nextScore);
          setRoundSuccess(true);
          setRoundMessage(`Dogrusu! +${roundTotal} puan`);
          setPhase('feedback');

          clearFeedbackTimer();
          feedbackTimerRef.current = window.setTimeout(() => {
            if (level >= MAX_LEVEL) {
              void finishGame({
                completed: true,
                remainingLives: lives,
                levelsCompleted: MAX_LEVEL,
                finalScoreOverride: nextScore,
              });
              return;
            }

            startLevel(level + 1);
          }, 900);

          return;
        }

        setRoundMessage(`${nextUserSequence.length}/${sequence.length} dogru secim`);
        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setRoundSuccess(false);
      setRoundMessage('Yanlis secim. Tur bitiyor.');
      setPhase('feedback');

      clearFeedbackTimer();
      feedbackTimerRef.current = window.setTimeout(() => {
        if (nextLives <= 0 || level >= MAX_LEVEL) {
          void finishGame({
            completed: false,
            remainingLives: Math.max(0, nextLives),
            levelsCompleted: Math.max(0, level - 1),
          });
          return;
        }

        startLevel(level + 1);
      }, 900);
    },
    [clearFeedbackTimer, finishGame, highlightCell, level, lives, mode, phase, score, sequence, startLevel, userSequence],
  );

  const boardWidth = useMemo(() => {
    if (gridSize === 3) {
      return 360;
    }

    if (gridSize === 4) {
      return 440;
    }

    return 540;
  }, [gridSize]);

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Parlayan hucrelerin sirasini hatirla. Ileri seviyelerde ters sirayla secim yapman gerekir.
        </p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(durationSeconds / 60)} dakika</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
          <li>Maksimum seviye: {MAX_LEVEL}</li>
        </ul>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button onClick={startGame}>Oyunu Baslat</Button>
          <Link className="btn btn-ghost" href="/games">
            Oyun listesine don
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 960 }}>
      <div className="stack-sm">
        <h1>{gameTitle}</h1>
        <p className="muted">
          Faz:{' '}
          {phase === 'showing'
            ? 'Gosterim'
            : phase === 'input'
              ? 'Girdi'
              : phase === 'feedback'
                ? 'Geri Bildirim'
                : 'Tamamlandi'}
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Durum</h2>
          <p className="muted">Skor: {score}</p>
          <p className="muted">Can: {lives}</p>
          <p className="muted">Seviye: {level}</p>
          <p className="muted">Kalan sure: {formatClock(timeLeft)}</p>
          {roundMessage ? <p>{roundMessage}</p> : <p className="muted">Hucre dizisini takip et.</p>}
        </div>

        <div className="card">
          <h2 className="card-title">Kontrol</h2>
          <p className="muted">Mod: {mode}</p>
          <p className="muted">Grid: {gridSize}x{gridSize}</p>
          <p className="muted">Sekans uzunlugu: {sequence.length}</p>
          {roundSuccess !== null ? (
            <p className="muted">Son tur: {roundSuccess ? 'Basarili' : 'Basarisiz'}</p>
          ) : null}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              variant="ghost"
              onClick={() =>
                finishGame({
                  completed: false,
                  remainingLives: lives,
                  levelsCompleted: Math.max(0, level - 1),
                })
              }
            >
              Bitir
            </Button>
          </div>
        </div>
      </div>

      <div className="card" style={{ opacity: phase === 'feedback' ? 0.85 : 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gap: '0.65rem',
            maxWidth: boardWidth,
            margin: '0 auto',
          }}
        >
          {Array.from({ length: gridSize * gridSize }, (_, index) => {
            const active = highlightCell === index;
            const clicked = userSequence.includes(index);
            const clickable = phase === 'input' && highlightCell === null;

            return (
              <button
                key={index}
                className="btn btn-ghost"
                disabled={!clickable}
                onClick={() => handleCellClick(index)}
                style={{
                  minHeight: gridSize === 3 ? 86 : gridSize === 4 ? 72 : 62,
                  fontSize: gridSize === 3 ? '1.4rem' : '1.2rem',
                  fontWeight: 800,
                  background: active ? '#dbeafe' : clicked ? '#eef2ff' : '#f8fafc',
                  borderColor: active ? '#2563eb' : clicked ? '#6366f1' : '#cbd5e1',
                  borderWidth: active || clicked ? 2 : 1,
                  color: '#1e293b',
                }}
              >
                {active ? '*' : clicked ? '.' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {phase === 'finished' ? (
        <div className="card stack-sm">
          <h2 className="card-title">Oyun Tamamlandi</h2>
          <p className="muted">Nihai skor: {score}</p>
          <p className="muted">Ulasilan seviye: {level}</p>
          {isSaving ? <p className="muted">Sonuc kaydediliyor...</p> : null}
          {saveStatus ? <p className="muted">{saveStatus}</p> : null}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <Button onClick={startGame}>Tekrar Oyna</Button>
            <Link className="btn btn-ghost" href="/games">
              Oyun listesine don
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
