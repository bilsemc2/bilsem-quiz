'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';

interface MazeGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface Cell {
  row: number;
  col: number;
}

interface RoundData {
  gridSize: number;
  blocked: string[];
  goal: Cell;
}

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 16;
const MIN_DURATION_SECONDS = 150;

function keyOf(row: number, col: number): string {
  return `${row}:${col}`;
}

function inBounds(size: number, row: number, col: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function hasPath(size: number, blocked: Set<string>, start: Cell, goal: Cell): boolean {
  const visited = new Set<string>();
  const queue: Cell[] = [start];

  visited.add(keyOf(start.row, start.col));

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.row === goal.row && current.col === goal.col) {
      return true;
    }

    const neighbors: Cell[] = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ];

    for (const next of neighbors) {
      if (!inBounds(size, next.row, next.col)) {
        continue;
      }

      const key = keyOf(next.row, next.col);

      if (blocked.has(key) || visited.has(key)) {
        continue;
      }

      visited.add(key);
      queue.push(next);
    }
  }

  return false;
}

function createRound(level: number): RoundData {
  const gridSize = level >= 10 ? 8 : level >= 5 ? 7 : 6;
  const start: Cell = { row: 0, col: 0 };
  const goal: Cell = { row: gridSize - 1, col: gridSize - 1 };
  const density = Math.min(0.32, 0.14 + level * 0.01);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const blocked = new Set<string>();

    for (let row = 0; row < gridSize; row += 1) {
      for (let col = 0; col < gridSize; col += 1) {
        const key = keyOf(row, col);

        if (key === keyOf(start.row, start.col) || key === keyOf(goal.row, goal.col)) {
          continue;
        }

        if (Math.random() < density) {
          blocked.add(key);
        }
      }
    }

    if (hasPath(gridSize, blocked, start, goal)) {
      return {
        gridSize,
        blocked: Array.from(blocked),
        goal,
      };
    }
  }

  return {
    gridSize,
    blocked: [],
    goal,
  };
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MazeGameClient({ gameId, gameTitle, durationSeconds }: MazeGameClientProps) {
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
  const [player, setPlayer] = useState<Cell>({ row: 0, col: 0 });
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
            intelligenceType: 'uzamsal_planlama',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              gridSize: round?.gridSize ?? 0,
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
    setPlayer({ row: 0, col: 0 });
    setMessage('P noktasini G hedefine ulastir.');
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

  const advanceRound = useCallback(
    (nextLevel: number, nextRoundIndex: number) => {
      setRoundIndex(nextRoundIndex);
      setLevel(nextLevel);
      setRound(createRound(nextLevel));
      setPlayer({ row: 0, col: 0 });
    },
    [],
  );

  const handleMove = useCallback(
    (dr: number, dc: number) => {
      if (phase !== 'playing' || !round) {
        return;
      }

      const next = {
        row: player.row + dr,
        col: player.col + dc,
      };

      const blockedSet = new Set(round.blocked);
      const out = !inBounds(round.gridSize, next.row, next.col);
      const blocked = blockedSet.has(keyOf(next.row, next.col));

      if (out || blocked) {
        const nextLives = lives - 1;
        setLives(nextLives);
        setMessage('Engel veya sinir ihlali. 1 can kaybettin.');

        if (nextLives <= 0) {
          void finishGame({ completed: false, remainingLives: 0 });
        }

        return;
      }

      setPlayer(next);

      if (next.row === round.goal.row && next.col === round.goal.col) {
        const gained = 14 + level * 2;
        const nextScore = score + gained;
        const nextRoundIndex = roundIndex + 1;
        const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 2);

        setScore(nextScore);
        setMessage(`Hedefe ulastin. +${gained} puan`);

        if (nextRoundIndex > MAX_ROUNDS) {
          void finishGame({ completed: true, remainingLives: lives, finalScore: nextScore });
          return;
        }

        advanceRound(nextLevel, nextRoundIndex);
      }
    },
    [advanceRound, finishGame, level, lives, phase, player.col, player.row, round, roundIndex, score],
  );

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Her turda engellerle dolu mini labirentte P karakterini G hedefine ulastir.
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
            P: oyuncu, G: hedef, #: engel
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 6rem))', gap: '0.5rem' }}>
            <div />
            <Button variant="secondary" disabled={phase !== 'playing'} onClick={() => handleMove(-1, 0)}>
              Yukari
            </Button>
            <div />
            <Button variant="secondary" disabled={phase !== 'playing'} onClick={() => handleMove(0, -1)}>
              Sol
            </Button>
            <Button variant="secondary" disabled={phase !== 'playing'} onClick={() => handleMove(1, 0)}>
              Asagi
            </Button>
            <Button variant="secondary" disabled={phase !== 'playing'} onClick={() => handleMove(0, 1)}>
              Sag
            </Button>
          </div>
          <div>
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
              gap: '0.3rem',
              maxWidth: round.gridSize <= 6 ? 360 : 420,
              margin: '0 auto',
            }}
          >
            {Array.from({ length: round.gridSize * round.gridSize }, (_, index) => {
              const row = Math.floor(index / round.gridSize);
              const col = index % round.gridSize;
              const key = keyOf(row, col);
              const isPlayer = player.row === row && player.col === col;
              const isGoal = round.goal.row === row && round.goal.col === col;
              const isBlocked = round.blocked.includes(key);

              let label = '.';
              let background = '#e2e8f0';
              let border = '#cbd5e1';

              if (isBlocked) {
                label = '#';
                background = '#94a3b8';
                border = '#64748b';
              }

              if (isGoal) {
                label = 'G';
                background = '#d1fae5';
                border = '#10b981';
              }

              if (isPlayer) {
                label = 'P';
                background = '#dbeafe';
                border = '#2563eb';
              }

              return (
                <div
                  key={`${row}-${col}`}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: '0.3rem',
                    border: `1px solid ${border}`,
                    background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                >
                  {label}
                </div>
              );
            })}
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
