'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type Operation = '+' | '-' | '*';

interface MathMagicGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface RoundData {
  left: number;
  right: number;
  operation: Operation;
  options: number[];
  correct: number;
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

function operationPool(level: number): Operation[] {
  if (level <= 4) {
    return ['+'];
  }

  if (level <= 9) {
    return ['+', '-'];
  }

  return ['+', '-', '*'];
}

function calculate(left: number, right: number, operation: Operation): number {
  if (operation === '+') {
    return left + right;
  }

  if (operation === '-') {
    return left - right;
  }

  return left * right;
}

function createRound(level: number): RoundData {
  const pool = operationPool(level);
  const operation = pool[randomInt(0, pool.length - 1)];

  let left = randomInt(2, 20 + level * 2);
  let right = randomInt(2, 20 + level * 2);

  if (operation === '-') {
    const maxValue = 25 + level * 2;
    left = randomInt(8, maxValue);
    right = randomInt(2, left - 1);
  }

  if (operation === '*') {
    left = randomInt(2, Math.min(12, 3 + Math.floor(level / 2)));
    right = randomInt(2, Math.min(12, 3 + Math.floor(level / 2)));
  }

  const correct = calculate(left, right, operation);

  const options = new Set<number>([correct]);
  let guard = 0;

  while (options.size < 4 && guard < 200) {
    const delta = randomInt(1, 8 + level);
    const sign = Math.random() < 0.5 ? -1 : 1;
    const value = correct + sign * delta;

    if (value >= 0) {
      options.add(value);
    }

    guard += 1;
  }

  return {
    left,
    right,
    operation,
    options: shuffle(Array.from(options)),
    correct,
  };
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MathMagicGameClient({ gameId, gameTitle, durationSeconds }: MathMagicGameClientProps) {
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
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
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
      const accuracyPercent = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

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
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              correctCount,
              totalAttempts,
              accuracyPercent,
              operation: round?.operation ?? null,
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
    [correctCount, gameId, round?.operation, roundIndex, sessionSeconds, timeLeft, totalAttempts],
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
    setCorrectCount(0);
    setTotalAttempts(0);
    setMessage('Denkleme uygun sonucu sec.');
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
    (choice: number) => {
      if (phase !== 'playing' || !round) {
        return;
      }

      const correct = choice === round.correct;
      const nextAttempts = totalAttempts + 1;
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 2);

      setTotalAttempts(nextAttempts);

      if (correct) {
        const gained = 10 + level * 2;
        const nextScore = score + gained;

        setScore(nextScore);
        setCorrectCount((previous) => previous + 1);
        setMessage(`Dogru sonuc. +${gained} puan`);

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
      setMessage(`Yanlis cevap. Dogru sonuc: ${round.correct}`);

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
    [finishGame, level, lives, phase, round, roundIndex, score, totalAttempts],
  );

  const accuracyPercent = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Toplama, cikarma ve carpma isleminde dogru sonucu hizla bul.
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
    <div className="stack" style={{ maxWidth: 860 }}>
      <h1>{gameTitle}</h1>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Durum</h2>
          <p className="muted">Skor: {score}</p>
          <p className="muted">Can: {lives}</p>
          <p className="muted">Tur: {roundIndex} / {MAX_ROUNDS}</p>
          <p className="muted">Seviye: {level}</p>
          <p className="muted">Kalan sure: {formatClock(timeLeft)}</p>
          <p className="muted">Dogruluk: %{accuracyPercent}</p>
          {message ? <p>{message}</p> : null}
        </div>

        <div className="card stack-sm" style={{ textAlign: 'center' }}>
          <h2 className="card-title">Soru</h2>
          {round ? (
            <p
              style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 800,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {round.left} {round.operation} {round.right} = ?
            </p>
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
          <p className="muted">Dogruluk: %{accuracyPercent}</p>
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
