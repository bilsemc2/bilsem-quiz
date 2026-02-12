'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type Operator = '+' | '-' | '*' | '/';

interface CellData {
  value: number;
  row: number;
  col: number;
  isMissing: boolean;
  userValue?: string;
}

type GridMatrix = CellData[][];

interface PuzzleData {
  grid: GridMatrix;
  ruleDescription: string;
}

interface MathGridGameClientProps {
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
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generatePuzzle(level: number): PuzzleData {
  const gridSize = 3;
  const grid: GridMatrix = [];

  const availableOps: Operator[] = ['+'];
  if (level >= 3) {
    availableOps.push('-');
  }
  if (level >= 5) {
    availableOps.push('*');
  }
  if (level >= 8) {
    availableOps.push('/');
  }

  const selectedOp: Operator =
    level <= 2
      ? '+'
      : level <= 4
        ? '-'
        : level <= 7
          ? level <= 5
            ? '*'
            : availableOps[getRandomInt(0, availableOps.length - 1)]
          : availableOps[getRandomInt(0, availableOps.length - 1)];

  let ruleDescription = '';
  if (selectedOp === '+') {
    ruleDescription = 'A + B = C';
  }
  if (selectedOp === '-') {
    ruleDescription = 'A - B = C';
  }
  if (selectedOp === '*') {
    ruleDescription = 'A * B = C';
  }
  if (selectedOp === '/') {
    ruleDescription = 'A / B = C';
  }

  const difficultyFactor = Math.ceil(level / 3);

  for (let row = 0; row < gridSize; row += 1) {
    let a = 0;
    let b = 0;
    let c = 0;

    if (selectedOp === '+') {
      const max = 10 + difficultyFactor * 10;
      a = getRandomInt(1, max);
      b = getRandomInt(1, max);
      c = a + b;
    }

    if (selectedOp === '-') {
      const max = 10 + difficultyFactor * 10;
      b = getRandomInt(1, max);
      c = getRandomInt(1, max);
      a = b + c;
    }

    if (selectedOp === '*') {
      const maxFactor = 3 + difficultyFactor;
      a = getRandomInt(2, maxFactor);
      b = getRandomInt(2, maxFactor);
      c = a * b;
    }

    if (selectedOp === '/') {
      const maxDivisor = 2 + Math.floor(difficultyFactor / 2);
      const maxResult = 5 + difficultyFactor * 2;
      b = getRandomInt(2, maxDivisor + 3);
      c = getRandomInt(2, maxResult);
      a = b * c;
    }

    const rowValues = [a, b, c];

    grid.push(
      rowValues.map((value, col) => ({
        value,
        row,
        col,
        isMissing: false,
      })),
    );
  }

  const rowIndices = [0, 1, 2];
  for (let index = rowIndices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [rowIndices[index], rowIndices[swapIndex]] = [rowIndices[swapIndex], rowIndices[index]];
  }

  let rowsToHide = 1;
  if (level >= 5) {
    rowsToHide = 2;
  }
  if (level >= 16) {
    rowsToHide = 3;
  }

  for (let index = 0; index < rowsToHide; index += 1) {
    const row = rowIndices[index];
    const col = getRandomInt(0, 2);
    grid[row][col].isMissing = true;
  }

  return { grid, ruleDescription };
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MathGridGameClient({ gameId, gameTitle, durationSeconds }: MathGridGameClientProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [grid, setGrid] = useState<GridMatrix>([]);
  const [ruleDescription, setRuleDescription] = useState('');
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [showErrors, setShowErrors] = useState(false);
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

  const startLevel = useCallback((nextLevel: number) => {
    const puzzle = generatePuzzle(nextLevel);

    setLevel(nextLevel);
    setGrid(puzzle.grid);
    setRuleDescription(puzzle.ruleDescription);
    setShowErrors(false);
    setRoundMessage(null);

    const firstMissing = puzzle.grid.flat().find((cell) => cell.isMissing);
    setActiveCell(firstMissing ? { row: firstMissing.row, col: firstMissing.col } : null);
  }, []);

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
            intelligenceType: 'sayisal_muhakeme',
            metadata: {
              completed: params.completed,
              levelsCompleted: params.levelsCompleted,
              source: 'math-grid-migrated',
              rule: ruleDescription,
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
    [durationSeconds, gameId, ruleDescription, timeLeft],
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

  const startGame = useCallback(() => {
    clearTransitionTimer();

    hasSavedRef.current = false;
    setPhase('playing');
    setScore(0);
    setLives(INITIAL_LIVES);
    setTimeLeft(durationSeconds);
    setSaveStatus(null);
    setIsSaving(false);
    startLevel(1);
  }, [clearTransitionTimer, durationSeconds, startLevel]);

  useEffect(() => {
    if (phase !== 'playing') {
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
    (row: number, col: number) => {
      if (phase !== 'playing') {
        return;
      }

      const cell = grid[row]?.[col];
      if (!cell?.isMissing) {
        return;
      }

      setActiveCell({ row, col });
      setRoundMessage(null);
    },
    [grid, phase],
  );

  const updateActiveCellValue = useCallback((updater: (current: string) => string) => {
    if (!activeCell) {
      return;
    }

    setGrid((previous) =>
      previous.map((rowCells, rowIndex) =>
        rowCells.map((cell, colIndex) => {
          if (rowIndex === activeCell.row && colIndex === activeCell.col) {
            const current = cell.userValue ?? '';
            return {
              ...cell,
              userValue: updater(current),
            };
          }
          return cell;
        }),
      ),
    );
  }, [activeCell]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (phase !== 'playing') {
        return;
      }

      setShowErrors(false);
      setRoundMessage(null);
      updateActiveCellValue((current) => {
        if (current.length >= 4) {
          return current;
        }
        return `${current}${digit}`;
      });
    },
    [phase, updateActiveCellValue],
  );

  const handleDelete = useCallback(() => {
    if (phase !== 'playing') {
      return;
    }

    setShowErrors(false);
    setRoundMessage(null);
    updateActiveCellValue((current) => current.slice(0, -1));
  }, [phase, updateActiveCellValue]);

  const evaluateAnswers = useCallback(() => {
    if (phase !== 'playing') {
      return;
    }

    const missingCells = grid.flat().filter((cell) => cell.isMissing);
    const anyFilled = missingCells.some((cell) => (cell.userValue ?? '').trim().length > 0);

    if (!anyFilled) {
      setRoundMessage('En az bir bos hucreyi doldurun.');
      return;
    }

    const hasEmpty = missingCells.some((cell) => (cell.userValue ?? '').trim().length === 0);
    const hasWrong = missingCells.some((cell) => {
      const entered = (cell.userValue ?? '').trim();
      if (!entered) {
        return false;
      }
      return Number.parseInt(entered, 10) !== cell.value;
    });

    if (!hasEmpty && !hasWrong) {
      const gained = 10 * level;
      const nextScore = score + gained;

      setScore(nextScore);
      setShowErrors(false);
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

    if (hasWrong) {
      const nextLives = lives - 1;
      setLives(nextLives);
      setShowErrors(true);
      setRoundMessage('Yanlis cevap var. Tekrar dene.');

      if (nextLives <= 0) {
        clearTransitionTimer();
        transitionTimerRef.current = window.setTimeout(() => {
          void finishGame({
            completed: false,
            remainingLives: 0,
            levelsCompleted: Math.max(0, level - 1),
          });
        }, 700);
      }

      return;
    }

    setRoundMessage('Tum bos hucreleri doldurup tekrar kontrol et.');
  }, [clearTransitionTimer, finishGame, grid, level, lives, phase, score, startLevel]);

  const gridColumns = useMemo(() => 'repeat(3, minmax(0, 1fr))', []);

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          3x3 matematik tablosunda eksik hucreleri doldur. Her seviyede islem zorlugu artar.
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
    <div className="stack" style={{ maxWidth: 920 }}>
      <div className="stack-sm">
        <h1>{gameTitle}</h1>
        <p className="muted">Kural: {ruleDescription || '-'}</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Durum</h2>
          <p className="muted">Skor: {score}</p>
          <p className="muted">Can: {lives}</p>
          <p className="muted">Seviye: {level}</p>
          <p className="muted">Kalan sure: {formatClock(timeLeft)}</p>
          {roundMessage ? <p>{roundMessage}</p> : <p className="muted">Eksik hucreleri tamamla.</p>}
        </div>

        <div className="card">
          <h2 className="card-title">Kontrol</h2>
          <p className="muted">Aktif hucre: {activeCell ? `${activeCell.row + 1},${activeCell.col + 1}` : '-'}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button disabled={phase !== 'playing'} onClick={evaluateAnswers}>
              Cevabi Kontrol Et
            </Button>
            <Button variant="secondary" disabled={phase !== 'playing'} onClick={handleDelete}>
              Sil
            </Button>
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

      <div className="card">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridColumns,
            gap: '0.7rem',
            maxWidth: 420,
            margin: '0 auto',
          }}
        >
          {grid.flat().map((cell) => {
            const entered = (cell.userValue ?? '').trim();
            const numeric = entered ? Number.parseInt(entered, 10) : Number.NaN;
            const isActive = activeCell?.row === cell.row && activeCell?.col === cell.col;
            const isWrong = showErrors && cell.isMissing && entered.length > 0 && numeric !== cell.value;
            const isCorrect = showErrors && cell.isMissing && entered.length > 0 && numeric === cell.value;

            return (
              <button
                key={`${cell.row}-${cell.col}`}
                className="btn btn-ghost"
                disabled={phase !== 'playing' || !cell.isMissing}
                onClick={() => handleCellSelect(cell.row, cell.col)}
                style={{
                  minHeight: 88,
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  background: cell.isMissing ? '#f8fafc' : '#dbeafe',
                  borderColor: isWrong ? '#dc2626' : isCorrect ? '#16a34a' : isActive ? '#2563eb' : '#cbd5e1',
                  borderWidth: isWrong || isCorrect || isActive ? 2 : 1,
                  color: '#0f172a',
                }}
              >
                {cell.isMissing ? entered || '?' : cell.value}
              </button>
            );
          })}
        </div>
      </div>

      {phase === 'playing' ? (
        <div className="card">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: '0.5rem',
              maxWidth: 420,
              margin: '0 auto',
            }}
          >
            {DIGITS.map((digit) => (
              <button
                key={digit}
                className="btn btn-secondary"
                onClick={() => handleDigit(digit)}
                style={{ minHeight: 54, fontWeight: 700 }}
              >
                {digit}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
