'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'memorize' | 'transition' | 'recall' | 'finished';

interface GridCell {
  id: string;
  symbol: string | null;
  color: string;
}

interface LevelConfig {
  gridSize: number;
  items: number;
  memorizeMs: number;
}

interface VisualMemoryGameClientProps {
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
const MAX_LEVEL = 20;

const SYMBOLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
];

const LEVEL_CONFIG: Record<number, LevelConfig> = {
  1: { gridSize: 3, items: 3, memorizeMs: 3000 },
  2: { gridSize: 3, items: 3, memorizeMs: 2800 },
  3: { gridSize: 3, items: 4, memorizeMs: 3000 },
  4: { gridSize: 3, items: 5, memorizeMs: 3000 },
  5: { gridSize: 3, items: 5, memorizeMs: 2500 },
  6: { gridSize: 3, items: 6, memorizeMs: 3000 },
  7: { gridSize: 3, items: 7, memorizeMs: 2500 },
  8: { gridSize: 4, items: 6, memorizeMs: 3500 },
  9: { gridSize: 4, items: 7, memorizeMs: 3000 },
  10: { gridSize: 4, items: 8, memorizeMs: 3000 },
  11: { gridSize: 4, items: 9, memorizeMs: 2500 },
  12: { gridSize: 4, items: 9, memorizeMs: 2000 },
  13: { gridSize: 4, items: 10, memorizeMs: 2500 },
  14: { gridSize: 4, items: 11, memorizeMs: 2500 },
  15: { gridSize: 4, items: 12, memorizeMs: 2000 },
  16: { gridSize: 5, items: 10, memorizeMs: 3000 },
  17: { gridSize: 5, items: 12, memorizeMs: 2500 },
  18: { gridSize: 5, items: 13, memorizeMs: 2000 },
  19: { gridSize: 5, items: 14, memorizeMs: 1800 },
  20: { gridSize: 5, items: 15, memorizeMs: 1500 },
};

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function generateGrid(gridSize: number, itemCount: number): GridCell[] {
  const totalCells = gridSize * gridSize;

  const cells: GridCell[] = Array.from({ length: totalCells }, (_, index) => ({
    id: `cell-${index}`,
    symbol: null,
    color: '#64748b',
  }));

  const indices = shuffle(Array.from({ length: totalCells }, (_, index) => index)).slice(0, itemCount);

  indices.forEach((index) => {
    cells[index] = {
      ...cells[index],
      symbol: pickRandom(SYMBOLS),
      color: pickRandom(COLORS),
    };
  });

  return cells;
}

function createModifiedGrid(originalGrid: GridCell[]): { grid: GridCell[]; targetId: string } {
  const grid = originalGrid.map((cell) => ({ ...cell }));

  const activeIndices = grid
    .map((cell, index) => (cell.symbol ? index : -1))
    .filter((index) => index !== -1);

  if (activeIndices.length === 0) {
    throw new Error('Degistirilecek aktif hucre yok.');
  }

  const indexToChange = pickRandom(activeIndices);
  const oldCell = grid[indexToChange];

  let nextSymbol = oldCell.symbol;
  while (nextSymbol === oldCell.symbol) {
    nextSymbol = pickRandom(SYMBOLS);
  }

  let nextColor = oldCell.color;
  while (nextColor === oldCell.color) {
    nextColor = pickRandom(COLORS);
  }

  grid[indexToChange] = {
    ...oldCell,
    symbol: nextSymbol,
    color: nextColor,
  };

  return {
    grid,
    targetId: oldCell.id,
  };
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VisualMemoryGameClient({ gameId, gameTitle, durationSeconds }: VisualMemoryGameClientProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [gridSize, setGridSize] = useState(3);
  const [gridBefore, setGridBefore] = useState<GridCell[]>([]);
  const [gridAfter, setGridAfter] = useState<GridCell[]>([]);
  const [targetCellId, setTargetCellId] = useState<string | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [memorizeMsLeft, setMemorizeMsLeft] = useState(0);
  const [memorizeMsTotal, setMemorizeMsTotal] = useState(0);
  const [roundMessage, setRoundMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

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
            intelligenceType: 'gorsel_hafiza',
            metadata: {
              completed: params.completed,
              levelsCompleted: params.levelsCompleted,
              source: 'visual-memory-migrated',
              gridSize,
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
    [durationSeconds, gameId, gridSize, timeLeft],
  );

  const finishGame = useCallback(
    async ({ completed, remainingLives, levelsCompleted, finalScoreOverride }: FinishGameOptions) => {
      clearTransitionTimer();
      setPhase('finished');

      const completionBonus = completed ? 200 : 0;
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
    [clearTransitionTimer, persistResult, score],
  );

  const startLevel = useCallback((nextLevel: number) => {
    const config = LEVEL_CONFIG[nextLevel] ?? LEVEL_CONFIG[MAX_LEVEL];
    const newGrid = generateGrid(config.gridSize, config.items);

    clearTransitionTimer();

    setLevel(nextLevel);
    setGridSize(config.gridSize);
    setGridBefore(newGrid);
    setGridAfter([]);
    setTargetCellId(null);
    setSelectedCellId(null);
    setMemorizeMsLeft(config.memorizeMs);
    setMemorizeMsTotal(config.memorizeMs);
    setRoundMessage('Sembolleri ezberle.');
    setPhase('memorize');
  }, [clearTransitionTimer]);

  const startGame = useCallback(() => {
    clearTransitionTimer();

    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setTimeLeft(durationSeconds);
    setSaveStatus(null);
    setIsSaving(false);
    startLevel(1);
  }, [clearTransitionTimer, durationSeconds, startLevel]);

  const transitionToRecall = useCallback(() => {
    if (phase !== 'memorize') {
      return;
    }

    setPhase('transition');
    setRoundMessage('Yeni goruntu hazirlaniyor...');

    clearTransitionTimer();
    transitionTimerRef.current = window.setTimeout(() => {
      const modified = createModifiedGrid(gridBefore);
      setGridAfter(modified.grid);
      setTargetCellId(modified.targetId);
      setSelectedCellId(null);
      setRoundMessage('Degisen hucreyi sec.');
      setPhase('recall');
    }, 700);
  }, [clearTransitionTimer, gridBefore, phase]);

  useEffect(() => {
    if (phase !== 'memorize') {
      return;
    }

    if (memorizeMsLeft <= 0) {
      transitionToRecall();
      return;
    }

    const timerId = window.setTimeout(() => {
      setMemorizeMsLeft((previous) => Math.max(0, previous - 100));
    }, 100);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [memorizeMsLeft, phase, transitionToRecall]);

  useEffect(() => {
    if (phase !== 'memorize' && phase !== 'transition' && phase !== 'recall') {
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

  const handleCellSelect = useCallback(
    (cellId: string) => {
      if (phase !== 'recall' || !targetCellId || selectedCellId) {
        return;
      }

      setSelectedCellId(cellId);

      const isCorrect = cellId === targetCellId;

      if (isCorrect) {
        const gained = 10 * level;
        const nextScore = score + gained;

        setScore(nextScore);
        setRoundMessage(`Dogrusu! +${gained} puan`);

        clearTransitionTimer();
        transitionTimerRef.current = window.setTimeout(() => {
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
        }, 700);

        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setRoundMessage('Yanlis hucre. Ayni seviye tekrar basliyor.');

      clearTransitionTimer();
      transitionTimerRef.current = window.setTimeout(() => {
        if (nextLives <= 0) {
          void finishGame({
            completed: false,
            remainingLives: 0,
            levelsCompleted: Math.max(0, level - 1),
          });
          return;
        }

        startLevel(level);
      }, 700);
    },
    [clearTransitionTimer, finishGame, level, lives, phase, score, selectedCellId, startLevel, targetCellId],
  );

  const memorizeProgress = useMemo(() => {
    if (memorizeMsTotal <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (memorizeMsLeft / memorizeMsTotal) * 100));
  }, [memorizeMsLeft, memorizeMsTotal]);

  const currentGrid = phase === 'recall' ? gridAfter : gridBefore;

  const boardMaxWidth = gridSize === 3 ? 340 : gridSize === 4 ? 440 : 560;

  const cellMinHeight = gridSize === 3 ? 86 : gridSize === 4 ? 74 : 66;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Once sembolleri ezberle, sonra degisen hucreyi bul. Seviye ilerledikce grid buyur ve sure kisalir.
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
    <div className="stack" style={{ maxWidth: 940 }}>
      <div className="stack-sm">
        <h1>{gameTitle}</h1>
        <p className="muted">Faz: {phase === 'memorize' ? 'Ezberleme' : phase === 'transition' ? 'Gecis' : phase === 'recall' ? 'Hatirlama' : 'Tamamlandi'}</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Durum</h2>
          <p className="muted">Skor: {score}</p>
          <p className="muted">Can: {lives}</p>
          <p className="muted">Seviye: {level}</p>
          <p className="muted">Kalan sure: {formatClock(timeLeft)}</p>
          {roundMessage ? <p>{roundMessage}</p> : <p className="muted">Degisen hucreyi bul.</p>}
          {phase === 'memorize' ? (
            <div style={{ marginTop: '0.5rem' }}>
              <p className="muted" style={{ margin: 0 }}>
                Ezber suresi
              </p>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: '#e2e8f0',
                  overflow: 'hidden',
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    width: `${memorizeProgress}%`,
                    height: '100%',
                    background: '#0ea5e9',
                    transition: 'width 100ms linear',
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="card">
          <h2 className="card-title">Kontrol</h2>
          <p className="muted">Grid boyutu: {gridSize}x{gridSize}</p>
          <p className="muted">Dolu hucre sayisi: {currentGrid.filter((cell) => cell.symbol !== null).length}</p>
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

      <div className="card" style={{ opacity: phase === 'transition' ? 0.6 : 1, transition: 'opacity 200ms ease' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gap: '0.65rem',
            maxWidth: boardMaxWidth,
            margin: '0 auto',
          }}
        >
          {currentGrid.map((cell) => {
            const isSelected = selectedCellId === cell.id;
            const isTarget = targetCellId === cell.id;
            const revealTarget = phase === 'recall' && selectedCellId !== null && isTarget;
            const revealWrong = phase === 'recall' && selectedCellId !== null && isSelected && !isTarget;
            const clickable = phase === 'recall' && !selectedCellId;

            return (
              <button
                key={cell.id}
                className="btn btn-ghost"
                disabled={!clickable}
                onClick={() => handleCellSelect(cell.id)}
                style={{
                  minHeight: cellMinHeight,
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  background: revealTarget ? '#dcfce7' : revealWrong ? '#fee2e2' : '#f8fafc',
                  borderColor: revealTarget ? '#16a34a' : revealWrong ? '#dc2626' : isSelected ? '#2563eb' : '#cbd5e1',
                  borderWidth: revealTarget || revealWrong || isSelected ? 2 : 1,
                  color: '#0f172a',
                }}
              >
                {cell.symbol ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      width: 38,
                      height: 38,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 999,
                      color: '#ffffff',
                      background: cell.color,
                      fontSize: '1rem',
                    }}
                  >
                    {cell.symbol}
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>.</span>
                )}
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
