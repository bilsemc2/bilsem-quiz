'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type Direction = 'up' | 'right' | 'down' | 'left';
type Side = 'top' | 'right' | 'bottom' | 'left';
type Mirror = '/' | '\\';

interface LaserMazeGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface CellPoint {
  row: number;
  col: number;
}

interface ExitOption extends CellPoint {
  id: number;
  isCorrect: boolean;
}

interface RoundData {
  gridSize: number;
  start: CellPoint & {
    side: Side;
    direction: Direction;
  };
  mirrors: Record<string, Mirror>;
  exits: ExitOption[];
  correctExitId: number;
}

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 18;
const MIN_DURATION_SECONDS = 150;

function pointKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function samePoint(a: CellPoint, b: CellPoint): boolean {
  return a.row === b.row && a.col === b.col;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

function directionVector(direction: Direction): { dr: number; dc: number } {
  if (direction === 'up') {
    return { dr: -1, dc: 0 };
  }

  if (direction === 'right') {
    return { dr: 0, dc: 1 };
  }

  if (direction === 'down') {
    return { dr: 1, dc: 0 };
  }

  return { dr: 0, dc: -1 };
}

function directionArrow(direction: Direction): string {
  if (direction === 'up') {
    return '↑';
  }

  if (direction === 'right') {
    return '→';
  }

  if (direction === 'down') {
    return '↓';
  }

  return '←';
}

function reflectDirection(direction: Direction, mirror: Mirror): Direction {
  if (mirror === '/') {
    if (direction === 'up') {
      return 'right';
    }

    if (direction === 'right') {
      return 'up';
    }

    if (direction === 'down') {
      return 'left';
    }

    return 'down';
  }

  if (direction === 'up') {
    return 'left';
  }

  if (direction === 'left') {
    return 'up';
  }

  if (direction === 'down') {
    return 'right';
  }

  return 'down';
}

function collectBoundaryCells(gridSize: number): CellPoint[] {
  const cells: CellPoint[] = [];

  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      if (row === 0 || row === gridSize - 1 || col === 0 || col === gridSize - 1) {
        cells.push({ row, col });
      }
    }
  }

  return cells;
}

function createStartPoint(gridSize: number): RoundData['start'] {
  const side = shuffle<Side>(['top', 'right', 'bottom', 'left'])[0];
  const axis = randomInt(1, gridSize - 2);

  if (side === 'top') {
    return { row: 0, col: axis, side, direction: 'down' };
  }

  if (side === 'right') {
    return { row: axis, col: gridSize - 1, side, direction: 'left' };
  }

  if (side === 'bottom') {
    return { row: gridSize - 1, col: axis, side, direction: 'up' };
  }

  return { row: axis, col: 0, side, direction: 'right' };
}

function createMirrorMap(gridSize: number, mirrorCount: number): Record<string, Mirror> {
  const candidates: CellPoint[] = [];

  for (let row = 1; row < gridSize - 1; row += 1) {
    for (let col = 1; col < gridSize - 1; col += 1) {
      candidates.push({ row, col });
    }
  }

  const shuffled = shuffle(candidates);
  const count = Math.min(mirrorCount, shuffled.length);
  const mirrors: Record<string, Mirror> = {};

  for (let index = 0; index < count; index += 1) {
    const cell = shuffled[index];
    mirrors[pointKey(cell.row, cell.col)] = Math.random() < 0.5 ? '/' : '\\';
  }

  return mirrors;
}

function traceLaser(
  gridSize: number,
  start: RoundData['start'],
  mirrors: Record<string, Mirror>,
): CellPoint {
  let row = start.row;
  let col = start.col;
  let direction = start.direction;
  const guard = gridSize * gridSize * 6;

  for (let step = 0; step < guard; step += 1) {
    const vector = directionVector(direction);
    row += vector.dr;
    col += vector.dc;

    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
      return {
        row: row - vector.dr,
        col: col - vector.dc,
      };
    }

    const mirror = mirrors[pointKey(row, col)];

    if (mirror) {
      direction = reflectDirection(direction, mirror);
    }
  }

  return {
    row: start.row,
    col: start.col,
  };
}

function createExitOptions(
  level: number,
  gridSize: number,
  start: RoundData['start'],
  correctExitCell: CellPoint,
): ExitOption[] {
  const optionCount = Math.min(5, 3 + Math.floor((level - 1) / 4));
  const boundaryCells = collectBoundaryCells(gridSize);
  const decoyCandidates = boundaryCells.filter(
    (cell) => !samePoint(cell, correctExitCell) && !samePoint(cell, start),
  );

  shuffle(decoyCandidates);

  const choices: CellPoint[] = [correctExitCell, ...decoyCandidates.slice(0, Math.max(0, optionCount - 1))];

  shuffle(choices);

  return choices.map((cell, index) => ({
    id: index + 1,
    row: cell.row,
    col: cell.col,
    isCorrect: samePoint(cell, correctExitCell),
  }));
}

function createRound(level: number): RoundData {
  const gridSize = level >= 11 ? 7 : level >= 5 ? 6 : 5;
  const availableMirrorCells = Math.max(0, (gridSize - 2) * (gridSize - 2) - 1);
  const mirrorCount = Math.min(availableMirrorCells, 3 + Math.floor(level * 1.1));
  const start = createStartPoint(gridSize);
  const mirrors = createMirrorMap(gridSize, mirrorCount);
  const correctExitCell = traceLaser(gridSize, start, mirrors);
  const exits = createExitOptions(level, gridSize, start, correctExitCell);
  const correct = exits.find((option) => option.isCorrect) ?? exits[0] ?? {
    id: 1,
    row: correctExitCell.row,
    col: correctExitCell.col,
    isCorrect: true,
  };

  return {
    gridSize,
    start,
    mirrors,
    exits: exits.length > 0 ? exits : [correct],
    correctExitId: correct.id,
  };
}

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function LaserMazeGameClient({ gameId, gameTitle, durationSeconds }: LaserMazeGameClientProps) {
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
  const [round, setRound] = useState<RoundData | null>(null);
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
            intelligenceType: 'uzamsal_muhakeme',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              currentGridSize: round?.gridSize ?? 0,
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
    [gameId, round?.gridSize, roundIndex, sessionSeconds, timeLeft],
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

  const startGame = useCallback(() => {
    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setRoundIndex(1);
    setTimeLeft(sessionSeconds);
    setRound(createRound(1));
    setMessage('Lazeri zihninde izle ve cikis numarasini sec.');
    setSaveStatus(null);
    setIsSaving(false);
    setPhase('playing');
  }, [sessionSeconds]);

  useEffect(() => {
    setTimeLeft(sessionSeconds);
  }, [sessionSeconds]);

  useEffect(() => {
    if (phase !== 'playing') {
      return;
    }

    if (timeLeft <= 0) {
      void finishGame({ completed: false, remainingLives: lives });
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishGame, lives, phase, timeLeft]);

  const handleExitChoice = useCallback(
    (choiceId: number) => {
      if (phase !== 'playing' || !round) {
        return;
      }

      const isCorrect = choiceId === round.correctExitId;
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 2);

      if (isCorrect) {
        const gained = 11 + level * 2;
        const nextScore = score + gained;

        setScore(nextScore);
        setMessage(`Dogru cikis. +${gained} puan`);

        if (nextRoundIndex > MAX_ROUNDS) {
          void finishGame({ completed: true, remainingLives: lives, finalScore: nextScore });
          return;
        }

        setRoundIndex(nextRoundIndex);
        setLevel(nextLevel);
        setRound(createRound(nextLevel));
        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setMessage('Yanlis cikis. Aynalari tekrar takip et.');

      if (nextLives <= 0) {
        void finishGame({ completed: false, remainingLives: 0 });
        return;
      }

      if (nextRoundIndex > MAX_ROUNDS) {
        void finishGame({ completed: true, remainingLives: nextLives });
        return;
      }

      setRoundIndex(nextRoundIndex);
      setLevel(nextLevel);
      setRound(createRound(nextLevel));
    },
    [finishGame, level, lives, phase, round, roundIndex, score],
  );

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Baslangic okundan giren lazerin aynalardan sekmesini zihninde canlandir. Cikis etiketini sec.
        </p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(sessionSeconds / 60)} dakika</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
          <li>Maksimum tur: {MAX_ROUNDS}</li>
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
    <div className="stack" style={{ maxWidth: 900 }}>
      <h1>{gameTitle}</h1>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Durum</h2>
          <p className="muted">Skor: {score}</p>
          <p className="muted">Can: {lives}</p>
          <p className="muted">Tur: {roundIndex} / {MAX_ROUNDS}</p>
          <p className="muted">Seviye: {level}</p>
          <p className="muted">Kalan sure: {formatClock(timeLeft)}</p>
          {message ? <p>{message}</p> : null}
        </div>

        <div className="card stack-sm">
          <h2 className="card-title">Kontrol</h2>
          <p className="muted" style={{ margin: 0 }}>
            Mavi numaralar olasi cikislar. Yesil ok lazerin giris yonunu gosterir.
          </p>
          <p className="muted" style={{ margin: 0 }}>
            `/` ve `\\` aynalari lazeri farkli yone yansitir.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {round?.exits.map((exit) => (
              <Button
                key={exit.id}
                variant="secondary"
                disabled={phase !== 'playing'}
                onClick={() => handleExitChoice(exit.id)}
              >
                Cikis {exit.id}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={() =>
                finishGame({
                  completed: false,
                  remainingLives: lives,
                })
              }
            >
              Bitir
            </Button>
          </div>
        </div>
      </div>

      {round ? (
        <div className="card stack-sm">
          <h2 className="card-title">Labirent</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${round.gridSize}, minmax(0, 1fr))`,
              gap: '0.35rem',
              maxWidth: round.gridSize === 5 ? 320 : round.gridSize === 6 ? 380 : 430,
              margin: '0 auto',
            }}
          >
            {Array.from({ length: round.gridSize * round.gridSize }, (_, index) => {
              const row = Math.floor(index / round.gridSize);
              const col = index % round.gridSize;
              const isStart = row === round.start.row && col === round.start.col;
              const exit = round.exits.find((item) => item.row === row && item.col === col);
              const mirror = round.mirrors[pointKey(row, col)];

              let label = '';

              if (mirror) {
                label = mirror;
              }

              if (isStart) {
                label = directionArrow(round.start.direction);
              }

              if (exit) {
                label = isStart ? `${directionArrow(round.start.direction)}${exit.id}` : `${exit.id}`;
              }

              return (
                <div
                  key={`${row}-${col}`}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: '0.35rem',
                    border: `1px solid ${isStart ? '#16a34a' : exit ? '#2563eb' : '#cbd5e1'}`,
                    background: isStart ? '#dcfce7' : exit ? '#dbeafe' : mirror ? '#f8fafc' : '#e2e8f0',
                    color: exit ? '#1d4ed8' : '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: round.gridSize === 7 ? '0.88rem' : '1rem',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                >
                  {label || '-'}
                </div>
              );
            })}
          </div>
          <p className="muted" style={{ margin: 0, textAlign: 'center' }}>
            Giris kenari: {round.start.side}
          </p>
        </div>
      ) : null}

      {phase === 'finished' ? (
        <div className="card stack-sm">
          <h2 className="card-title">Oyun Tamamlandi</h2>
          <p className="muted">Nihai skor: {score}</p>
          <p className="muted">Ulasilan seviye: {level}</p>
          {isSaving ? <p className="muted">Sonuc kaydediliyor...</p> : null}
          {saveStatus ? <p className="muted">{saveStatus}</p> : null}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={startGame}>Tekrar Baslat</Button>
            <Link className="btn btn-ghost" href="/games">
              Oyun listesine don
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
