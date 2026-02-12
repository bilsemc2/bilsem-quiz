'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';

interface SymbolSearchGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface RoundData {
  target: string;
  symbols: string[];
  options: number[];
  correctCount: number;
}

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 20;
const MIN_DURATION_SECONDS = 150;
const SYMBOL_POOL = ['@', '#', '%', '&', '*', '+', '?', '$', '!'];

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

function cellCountForLevel(level: number): number {
  if (level <= 4) {
    return 16;
  }

  if (level <= 8) {
    return 20;
  }

  if (level <= 12) {
    return 25;
  }

  return 30;
}

function createRound(level: number): RoundData {
  const cellCount = cellCountForLevel(level);
  const target = SYMBOL_POOL[randomInt(0, SYMBOL_POOL.length - 1)];
  const maxTarget = Math.max(3, Math.floor(cellCount * 0.4));
  const minTarget = Math.max(2, Math.floor(cellCount * 0.15));
  const correctCount = randomInt(minTarget, maxTarget);

  const symbols: string[] = [];

  for (let i = 0; i < correctCount; i += 1) {
    symbols.push(target);
  }

  while (symbols.length < cellCount) {
    const candidate = SYMBOL_POOL[randomInt(0, SYMBOL_POOL.length - 1)];

    if (candidate !== target) {
      symbols.push(candidate);
    }
  }

  shuffle(symbols);

  const options = new Set<number>([correctCount]);
  while (options.size < 4) {
    const delta = randomInt(1, 5 + Math.floor(level / 3));
    const sign = Math.random() < 0.5 ? -1 : 1;
    const candidate = correctCount + sign * delta;

    if (candidate >= 0 && candidate <= cellCount) {
      options.add(candidate);
    }
  }

  return {
    target,
    symbols,
    options: shuffle(Array.from(options)),
    correctCount,
  };
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SymbolSearchGameClient({ gameId, gameTitle, durationSeconds }: SymbolSearchGameClientProps) {
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
            intelligenceType: 'secici_dikkat',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              correctCount,
              totalAttempts,
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
    [correctCount, gameId, roundIndex, sessionSeconds, timeLeft, totalAttempts],
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
    setMessage('Hedef sembolun kac kez gectigini bul.');
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

      const correct = choice === round.correctCount;
      const nextAttempts = totalAttempts + 1;
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 2);

      setTotalAttempts(nextAttempts);

      if (correct) {
        const gained = 11 + level * 2;
        const nextScore = score + gained;

        setScore(nextScore);
        setCorrectCount((previous) => previous + 1);
        setMessage(`Dogru sayim. +${gained} puan`);

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
      setMessage(`Yanlis cevap. Dogru sayi: ${round.correctCount}`);

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
  const gridColumns = round?.symbols.length && round.symbols.length >= 25 ? 6 : 5;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Karisik semboller arasinda hedef sembolun kac kez gectigini hizli tespit et.
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
          <p className="muted">Dogruluk: %{accuracyPercent}</p>
          {message ? <p>{message}</p> : null}
        </div>

        <div className="card stack-sm" style={{ textAlign: 'center' }}>
          <h2 className="card-title">Hedef</h2>
          <p
            style={{
              margin: 0,
              fontSize: '2.4rem',
              fontWeight: 800,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {round?.target ?? '-'}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Bu sembol kac kez geciyor?
          </p>
        </div>
      </div>

      <div className="card stack-sm">
        <h2 className="card-title">Sembol Alani</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
            gap: '0.35rem',
          }}
        >
          {round?.symbols.map((symbol, index) => (
            <div
              key={`${symbol}-${index}`}
              style={{
                border: '1px solid #cbd5e1',
                background: symbol === round.target ? '#dcfce7' : '#f8fafc',
                borderRadius: '0.35rem',
                minHeight: '2.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontWeight: 700,
              }}
            >
              {symbol}
            </div>
          ))}
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
