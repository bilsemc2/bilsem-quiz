'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type Direction = 'forward' | 'backward';

interface ClockProblemGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface RoundData {
  baseTotalMinutes: number;
  direction: Direction;
  offsetMinutes: number;
  options: string[];
  correctOption: string;
}

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 20;
const MIN_DURATION_SECONDS = 150;

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

function wrap12Hours(totalMinutes: number): number {
  const day = 12 * 60;
  let value = totalMinutes % day;

  if (value < 0) {
    value += day;
  }

  return value;
}

function toClockLabel(totalMinutes: number): string {
  const value = wrap12Hours(totalMinutes);
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  const displayHour = hours === 0 ? 12 : hours;

  return `${displayHour}:${minutes.toString().padStart(2, '0')}`;
}

function levelOffsetPool(level: number): number[] {
  if (level <= 4) {
    return [5, 10, 15, 20];
  }

  if (level <= 8) {
    return [10, 15, 20, 25, 30];
  }

  if (level <= 12) {
    return [15, 20, 25, 30, 35, 40];
  }

  return [20, 25, 30, 35, 40, 45, 50, 55, 60];
}

function createOptions(correctTotalMinutes: number, level: number): { options: string[]; correctOption: string } {
  const correctOption = toClockLabel(correctTotalMinutes);
  const optionSet = new Set<string>([correctOption]);
  const candidateDelta = [5, 10, 15, 20, 25, 30, 35, 40];

  let guard = 0;
  while (optionSet.size < 4 && guard < 120) {
    const delta = candidateDelta[randomInt(0, candidateDelta.length - 1)] + Math.floor(level / 4) * 5;
    const sign = Math.random() < 0.5 ? -1 : 1;
    optionSet.add(toClockLabel(correctTotalMinutes + sign * delta));
    guard += 1;
  }

  const options = shuffle(Array.from(optionSet));

  return {
    options,
    correctOption,
  };
}

function createRound(level: number): RoundData {
  const baseHour = randomInt(0, 11);
  const baseMinute = randomInt(0, 11) * 5;
  const baseTotalMinutes = baseHour * 60 + baseMinute;
  const direction: Direction = Math.random() < 0.5 ? 'forward' : 'backward';

  const offsetPool = levelOffsetPool(level);
  const offsetMinutes = offsetPool[randomInt(0, offsetPool.length - 1)];
  const delta = direction === 'forward' ? offsetMinutes : -offsetMinutes;
  const correctTotalMinutes = baseTotalMinutes + delta;

  const { options, correctOption } = createOptions(correctTotalMinutes, level);

  return {
    baseTotalMinutes,
    direction,
    offsetMinutes,
    options,
    correctOption,
  };
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ClockProblemGameClient({ gameId, gameTitle, durationSeconds }: ClockProblemGameClientProps) {
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
            intelligenceType: 'mantik_zaman',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
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
    [gameId, roundIndex, sessionSeconds, timeLeft],
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
    setMessage('Saat sorusunu coz ve dogru secenegi isaretle.');
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

  const handleAnswer = useCallback(
    (choice: string) => {
      if (phase !== 'playing' || !round) {
        return;
      }

      const correct = choice === round.correctOption;
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 2);

      if (correct) {
        const gained = 10 + level * 2;
        const nextScore = score + gained;

        setScore(nextScore);
        setMessage(`Dogru cevap. +${gained} puan`);

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
      setMessage(`Yanlis cevap. Dogru cevap: ${round.correctOption}`);

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
          Verilen saate gore ileri/geri dakika islemine dayali yeni saati bul.
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
    <div className="stack" style={{ maxWidth: 880 }}>
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

        <div className="card">
          <h2 className="card-title">Soru</h2>
          {round ? (
            <div className="stack-sm">
              <p className="muted" style={{ margin: 0 }}>
                Baslangic saati
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '2rem',
                  fontWeight: 800,
                  letterSpacing: '0.15rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {toClockLabel(round.baseTotalMinutes)}
              </p>
              <p style={{ margin: 0 }}>
                {round.direction === 'forward' ? 'Ileri' : 'Geri'} {round.offsetMinutes} dakika sonra saat kac olur?
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="card stack-sm">
        <h2 className="card-title">Secenekler</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {round?.options.map((option) => (
            <Button key={option} variant="secondary" disabled={phase !== 'playing'} onClick={() => handleAnswer(option)}>
              {option}
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
