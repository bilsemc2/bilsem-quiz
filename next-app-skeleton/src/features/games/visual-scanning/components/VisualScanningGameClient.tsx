'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';

interface VisualScanningGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface Cell {
  symbol: string;
  isTarget: boolean;
  state: 'idle' | 'hit' | 'wrong';
}

interface RoundGrid {
  targetSymbol: string;
  targetCount: number;
  cells: Cell[];
}

const INITIAL_LIVES = 4;
const GRID_SIZE = 64;
const GRID_COLUMNS = 8;
const MAX_LEVEL = 8;
const MIN_DURATION_SECONDS = 150;

const SYMBOL_POOL = ['*', '@', '#', '&', '%', '!', '?', '+', '=', 'X', '$', '~', 'O', '<', '>'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function levelConfig(level: number): { targetCount: number; distractorTypes: number } {
  if (level <= 2) {
    return { targetCount: 8, distractorTypes: 3 };
  }

  if (level <= 4) {
    return { targetCount: 10, distractorTypes: 4 };
  }

  if (level <= 6) {
    return { targetCount: 12, distractorTypes: 5 };
  }

  return { targetCount: 14, distractorTypes: 6 };
}

function createRoundGrid(level: number): RoundGrid {
  const { targetCount, distractorTypes } = levelConfig(level);
  const targetSymbol = SYMBOL_POOL[randomInt(0, SYMBOL_POOL.length - 1)] ?? '*';

  const distractors = shuffle(SYMBOL_POOL.filter((symbol) => symbol !== targetSymbol)).slice(0, distractorTypes);

  const targetPositions = new Set<number>();
  while (targetPositions.size < targetCount) {
    targetPositions.add(randomInt(0, GRID_SIZE - 1));
  }

  const cells: Cell[] = [];

  for (let index = 0; index < GRID_SIZE; index += 1) {
    if (targetPositions.has(index)) {
      cells.push({ symbol: targetSymbol, isTarget: true, state: 'idle' });
      continue;
    }

    cells.push({
      symbol: distractors[randomInt(0, distractors.length - 1)] ?? '#',
      isTarget: false,
      state: 'idle',
    });
  }

  return {
    targetSymbol,
    targetCount,
    cells,
  };
}

export function VisualScanningGameClient({ gameId, gameTitle, durationSeconds }: VisualScanningGameClientProps) {
  const sessionSeconds = useMemo(
    () => Math.max(MIN_DURATION_SECONDS, Math.floor(durationSeconds)),
    [durationSeconds],
  );

  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [roundIndex, setRoundIndex] = useState(1);
  const [timeLeft, setTimeLeft] = useState(sessionSeconds);
  const [roundGrid, setRoundGrid] = useState<RoundGrid | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);

  const persistResult = useCallback(
    async (params: { finalScore: number; remainingLives: number; completed: boolean; levelReached: number }) => {
      if (hasSavedRef.current) {
        return;
      }

      hasSavedRef.current = true;
      setIsSaving(true);

      const playedSeconds = Math.max(0, sessionSeconds - timeLeft);
      const solvedCount = correctCount + wrongCount;
      const accuracyPercent = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;

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
            intelligenceType: 'gorsel_tarama',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              correctCount,
              wrongCount,
              missedCount,
              bestStreak,
              accuracyPercent,
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
    [bestStreak, correctCount, gameId, missedCount, roundIndex, sessionSeconds, timeLeft, wrongCount],
  );

  const finishGame = useCallback(
    async (params: { completed: boolean; remainingLives: number; finalScore?: number }) => {
      setPhase('finished');
      const finalScore = params.finalScore ?? score;

      if (finalScore !== score) {
        setScore(finalScore);
      }

      await persistResult({
        finalScore,
        remainingLives: params.remainingLives,
        completed: params.completed,
        levelReached: level,
      });
    },
    [level, persistResult, score],
  );

  const startRound = useCallback((nextLevel: number, nextRoundIndex: number) => {
    setLevel(nextLevel);
    setRoundIndex(nextRoundIndex);
    setRoundGrid(createRoundGrid(nextLevel));
  }, []);

  const startGame = useCallback(() => {
    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setRoundIndex(1);
    setTimeLeft(sessionSeconds);
    setCorrectCount(0);
    setWrongCount(0);
    setMissedCount(0);
    setStreak(0);
    setBestStreak(0);
    setMessage('Hedef sembolu gridde bul ve sadece hedefe tikla.');
    setSaveStatus(null);
    setIsSaving(false);
    setPhase('playing');
    setRoundGrid(createRoundGrid(1));
  }, [sessionSeconds]);

  useEffect(() => {
    setTimeLeft(sessionSeconds);
  }, [sessionSeconds]);

  useEffect(() => {
    if (phase !== 'playing') {
      return;
    }

    if (timeLeft <= 0) {
      const unresolved = roundGrid
        ? roundGrid.cells.filter((cell) => cell.isTarget && cell.state !== 'hit').length
        : 0;

      if (unresolved > 0) {
        setMissedCount((previous) => previous + unresolved);
      }

      void finishGame({ completed: false, remainingLives: lives });
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishGame, lives, phase, roundGrid, timeLeft]);

  const handleCellClick = useCallback(
    (cellIndex: number) => {
      if (phase !== 'playing' || !roundGrid) {
        return;
      }

      const clicked = roundGrid.cells[cellIndex];
      if (!clicked || clicked.state !== 'idle') {
        return;
      }

      const nextCells = [...roundGrid.cells];

      if (clicked.isTarget) {
        nextCells[cellIndex] = { ...clicked, state: 'hit' };
        const nextStreak = streak + 1;
        const gain = 8 + Math.min(20, nextStreak * 2) + level;

        setStreak(nextStreak);
        setBestStreak((previous) => Math.max(previous, nextStreak));
        setCorrectCount((previous) => previous + 1);
        setScore((previous) => previous + gain);
      } else {
        nextCells[cellIndex] = { ...clicked, state: 'wrong' };
        setStreak(0);
        setWrongCount((previous) => previous + 1);
        setScore((previous) => Math.max(0, previous - 10));

        const nextLives = lives - 1;
        setLives(nextLives);

        if (nextLives <= 0) {
          const unresolved = nextCells.filter((cell) => cell.isTarget && cell.state !== 'hit').length;
          if (unresolved > 0) {
            setMissedCount((previous) => previous + unresolved);
          }
          setRoundGrid({ ...roundGrid, cells: nextCells });
          void finishGame({ completed: false, remainingLives: 0 });
          return;
        }
      }

      const unresolvedTargets = nextCells.filter((cell) => cell.isTarget && cell.state !== 'hit').length;

      if (unresolvedTargets <= 0) {
        const bonus = 25 + level * 3;
        const nextRound = roundIndex + 1;
        const nextLevel = Math.min(MAX_LEVEL, level + 1);

        setScore((previous) => previous + bonus);
        setMessage(`Tur tamamlandi. +${bonus} bonus`);
        startRound(nextLevel, nextRound);
        return;
      }

      setRoundGrid({ ...roundGrid, cells: nextCells });
    },
    [finishGame, level, lives, phase, roundGrid, roundIndex, startRound, streak],
  );

  const remainingTargets = roundGrid
    ? roundGrid.cells.filter((cell) => cell.isTarget && cell.state !== 'hit').length
    : 0;

  const totalSolved = correctCount + wrongCount;
  const accuracyPercent = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Hedef sembolu hizli tara, sadece dogru kutulara tikla.</p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(sessionSeconds / 60)} dakika</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
          <li>Grid: {GRID_COLUMNS} x {GRID_COLUMNS}</li>
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
    <div className="stack" style={{ maxWidth: 980 }}>
      <div className="card" style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        <div>
          <div className="muted">Puan</div>
          <strong>{score}</strong>
        </div>
        <div>
          <div className="muted">Can</div>
          <strong>{lives}</strong>
        </div>
        <div>
          <div className="muted">Seviye</div>
          <strong>{level}</strong>
        </div>
        <div>
          <div className="muted">Tur</div>
          <strong>{roundIndex}</strong>
        </div>
        <div>
          <div className="muted">Hedef Kalan</div>
          <strong>{remainingTargets}</strong>
        </div>
        <div>
          <div className="muted">Sure</div>
          <strong>{formatClock(timeLeft)}</strong>
        </div>
      </div>

      {phase === 'playing' && roundGrid ? (
        <>
          <div className="card stack" style={{ gap: '0.6rem' }}>
            <p style={{ margin: 0 }}>
              Hedef sembol: <strong style={{ fontSize: '1.2rem' }}>{roundGrid.targetSymbol}</strong>
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Bu tur toplam hedef: {roundGrid.targetCount}
            </p>
          </div>

          <div
            className="card"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
              gap: '0.45rem',
            }}
          >
            {roundGrid.cells.map((cell, index) => {
              const background =
                cell.state === 'hit'
                  ? 'rgba(34, 197, 94, 0.25)'
                  : cell.state === 'wrong'
                    ? 'rgba(239, 68, 68, 0.22)'
                    : 'var(--surface)';

              return (
                <button
                  key={`${cell.symbol}-${index}`}
                  type="button"
                  onClick={() => handleCellClick(index)}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    minHeight: 44,
                    cursor: cell.state === 'idle' ? 'pointer' : 'default',
                    background,
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {cell.symbol}
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {message ? (
        <p className="muted" style={{ marginTop: '-0.25rem' }}>
          {message}
        </p>
      ) : null}

      {phase === 'finished' ? (
        <div className="card stack" style={{ gap: '0.8rem' }}>
          <h2 style={{ margin: 0 }}>Oyun Tamamlandi</h2>
          <ul className="muted" style={{ margin: 0 }}>
            <li>Skor: {score}</li>
            <li>Dogru tiklama: {correctCount}</li>
            <li>Yanlis tiklama: {wrongCount}</li>
            <li>Kacirilan hedef: {missedCount}</li>
            <li>En iyi seri: {bestStreak}</li>
            <li>Dogruluk: %{accuracyPercent}</li>
          </ul>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={startGame}>Tekrar Oyna</Button>
            <Link className="btn btn-ghost" href="/games">
              Oyun listesine don
            </Link>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {isSaving ? 'Sonuc kaydediliyor...' : saveStatus ?? 'Sonuc kaydi bekleniyor'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
