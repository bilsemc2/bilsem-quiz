'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';

interface DigitSymbolGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

type SymbolMap = Record<number, string>;

const SYMBOL_POOL = ['@', '#', '$', '%', '&', '*', '+', '?', '!'];
const INITIAL_LIVES = 3;
const MIN_DURATION_SECONDS = 120;

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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

function createSymbolMap(): SymbolMap {
  const shuffled = shuffle([...SYMBOL_POOL]);
  const mapping: SymbolMap = {};

  for (let number = 1; number <= 9; number += 1) {
    mapping[number] = shuffled[number - 1];
  }

  return mapping;
}

function createOptionSet(map: SymbolMap, targetNumber: number): string[] {
  const correct = map[targetNumber];
  const distractors = shuffle(Object.values(map).filter((symbol) => symbol !== correct)).slice(0, 5);

  return shuffle([correct, ...distractors]);
}

export function DigitSymbolGameClient({ gameId, gameTitle, durationSeconds }: DigitSymbolGameClientProps) {
  const sessionSeconds = useMemo(
    () => Math.max(MIN_DURATION_SECONDS, Math.floor(durationSeconds)),
    [durationSeconds],
  );

  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [timeLeft, setTimeLeft] = useState(sessionSeconds);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [symbolMap, setSymbolMap] = useState<SymbolMap>({});
  const [targetNumber, setTargetNumber] = useState(1);
  const [options, setOptions] = useState<string[]>([]);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);

  const nextChallenge = useCallback((map: SymbolMap) => {
    const nextNumber = randomInt(1, 9);
    setTargetNumber(nextNumber);
    setOptions(createOptionSet(map, nextNumber));
    setLastAnswer(null);
  }, []);

  const persistResult = useCallback(
    async (params: { finalScore: number; completed: boolean; remainingLives: number }) => {
      if (hasSavedRef.current) {
        return;
      }

      hasSavedRef.current = true;
      setIsSaving(true);

      const playedSeconds = Math.max(0, sessionSeconds - timeLeft);
      const totalAttempts = correctCount + wrongCount;
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
            intelligenceType: 'isleme_hizi',
            metadata: {
              source: 'games-route-migrated',
              completed: params.completed,
              correctCount,
              wrongCount,
              totalAttempts,
              accuracyPercent,
              bestStreak,
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
    [bestStreak, correctCount, gameId, sessionSeconds, timeLeft, wrongCount],
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
        completed: params.completed,
        remainingLives: params.remainingLives,
      });
    },
    [persistResult, score],
  );

  const startGame = useCallback(() => {
    const map = createSymbolMap();

    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setTimeLeft(sessionSeconds);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setSymbolMap(map);
    setMessage('Sayiya karsilik gelen sembolu en hizli sekilde sec.');
    setSaveStatus(null);
    setIsSaving(false);
    setPhase('playing');
    nextChallenge(map);
  }, [nextChallenge, sessionSeconds]);

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
    (symbol: string) => {
      if (phase !== 'playing' || options.length === 0 || lastAnswer !== null) {
        return;
      }

      const correctSymbol = symbolMap[targetNumber];
      const isCorrect = symbol === correctSymbol;

      setLastAnswer(symbol);

      if (isCorrect) {
        const nextStreak = streak + 1;
        const gained = 45 + Math.min(45, streak * 6);
        const nextScore = score + gained;

        setScore(nextScore);
        setCorrectCount((previous) => previous + 1);
        setStreak(nextStreak);
        setBestStreak((previous) => Math.max(previous, nextStreak));
        setMessage(`Dogru. +${gained} puan`);
      } else {
        setWrongCount((previous) => previous + 1);
        setLives((previous) => previous - 1);
        setStreak(0);
        setMessage(`Yanlis. Dogru sembol: ${correctSymbol}`);
      }

      window.setTimeout(() => {
        const nextLives = isCorrect ? lives : lives - 1;

        if (nextLives <= 0) {
          void finishGame({ completed: false, remainingLives: 0 });
          return;
        }

        nextChallenge(symbolMap);
      }, 260);
    },
    [finishGame, lastAnswer, lives, nextChallenge, options.length, phase, score, streak, symbolMap, targetNumber],
  );

  const totalAttempts = correctCount + wrongCount;
  const accuracyPercent = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 900 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Tablodaki sayi-sembol kodlamasini takip ederek dogru sembolu sec.</p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(sessionSeconds / 60)} dakika</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
          <li>Her dogru cevap seri bonusu kazandirir.</li>
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
          <div className="muted">Dogru</div>
          <strong>{correctCount}</strong>
        </div>
        <div>
          <div className="muted">Yanlis</div>
          <strong>{wrongCount}</strong>
        </div>
        <div>
          <div className="muted">Seri</div>
          <strong>{streak}</strong>
        </div>
        <div>
          <div className="muted">Sure</div>
          <strong>{formatClock(timeLeft)}</strong>
        </div>
      </div>

      {phase === 'playing' ? (
        <div className="card stack" style={{ gap: '1rem' }}>
          <div>
            <div className="muted" style={{ marginBottom: '0.35rem' }}>
              Kod Tablosu
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '0.55rem',
              }}
            >
              {Object.entries(symbolMap).map(([number, symbol]) => (
                <div
                  key={number}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '0.55rem',
                    background: 'rgba(15, 23, 42, 0.03)',
                    textAlign: 'center',
                    fontWeight: 700,
                  }}
                >
                  {number} = {symbol}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '0.9rem',
              background: 'rgba(15, 23, 42, 0.03)',
              textAlign: 'center',
            }}
          >
            <div className="muted" style={{ marginBottom: '0.4rem' }}>
              Hedef sayi
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.7rem' }}>{targetNumber}</div>
          </div>

          <div className="grid-3" style={{ gap: '0.65rem' }}>
            {options.map((symbol) => {
              const isSelected = lastAnswer === symbol;
              const isCorrect = symbol === symbolMap[targetNumber];

              const background =
                lastAnswer === null
                  ? 'var(--surface)'
                  : isCorrect
                    ? 'rgba(34, 197, 94, 0.22)'
                    : isSelected
                      ? 'rgba(239, 68, 68, 0.22)'
                      : 'var(--surface)';

              return (
                <button
                  key={symbol}
                  type="button"
                  className="btn"
                  onClick={() => handleAnswer(symbol)}
                  disabled={lastAnswer !== null}
                  style={{
                    minHeight: 48,
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    borderColor: 'var(--border)',
                    background,
                  }}
                >
                  {symbol}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="muted" style={{ marginTop: '-0.2rem' }}>
          {message}
        </p>
      ) : null}

      {phase === 'finished' ? (
        <div className="card stack" style={{ gap: '0.8rem' }}>
          <h2 style={{ margin: 0 }}>Oyun Tamamlandi</h2>
          <ul className="muted" style={{ margin: 0 }}>
            <li>Skor: {score}</li>
            <li>Dogru sayisi: {correctCount}</li>
            <li>Yanlis sayisi: {wrongCount}</li>
            <li>Dogruluk: %{accuracyPercent}</li>
            <li>En iyi seri: {bestStreak}</li>
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
