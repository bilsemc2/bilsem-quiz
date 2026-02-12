'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type PatternType = 'arithmetic' | 'geometric' | 'fibonacci' | 'square' | 'alternating';

interface NumberSequenceGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface RoundData {
  sequence: number[];
  answer: number;
  options: number[];
  patternType: PatternType;
  clue: string;
}

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 20;
const MIN_DURATION_SECONDS = 150;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function patternsForLevel(level: number): PatternType[] {
  if (level <= 3) {
    return ['arithmetic', 'geometric'];
  }

  if (level <= 7) {
    return ['arithmetic', 'geometric', 'fibonacci'];
  }

  if (level <= 12) {
    return ['arithmetic', 'geometric', 'fibonacci', 'square'];
  }

  return ['arithmetic', 'geometric', 'fibonacci', 'square', 'alternating'];
}

function createArithmetic(level: number): Omit<RoundData, 'options' | 'patternType'> {
  const length = randomInt(4, 6);
  const start = randomInt(1, 12);
  const diff = randomInt(1, 2 + Math.floor(level / 2));
  const sequence = Array.from({ length }, (_, index) => start + index * diff);
  const answer = start + length * diff;

  return {
    sequence,
    answer,
    clue: `Dizi her adimda +${diff} artiyor`,
  };
}

function createGeometric(level: number): Omit<RoundData, 'options' | 'patternType'> {
  const length = randomInt(4, 5);
  const start = randomInt(1, 4);
  const ratio = level <= 6 ? 2 : randomInt(2, 3);
  const sequence = Array.from({ length }, (_, index) => start * ratio ** index);
  const answer = start * ratio ** length;

  return {
    sequence,
    answer,
    clue: `Dizi her adimda x${ratio} ile carpiliyor`,
  };
}

function createFibonacci(): Omit<RoundData, 'options' | 'patternType'> {
  const length = randomInt(4, 6);
  const first = randomInt(1, 3);
  const second = randomInt(1, 4);
  const sequence = [first, second];

  while (sequence.length < length) {
    const last = sequence[sequence.length - 1] ?? 0;
    const before = sequence[sequence.length - 2] ?? 0;
    sequence.push(last + before);
  }

  const answer = (sequence[sequence.length - 1] ?? 0) + (sequence[sequence.length - 2] ?? 0);

  return {
    sequence,
    answer,
    clue: 'Her terim onceki iki terimin toplami',
  };
}

function createSquare(): Omit<RoundData, 'options' | 'patternType'> {
  const length = randomInt(4, 5);
  const start = randomInt(2, 5);
  const sequence = Array.from({ length }, (_, index) => (start + index) ** 2);
  const answer = (start + length) ** 2;

  return {
    sequence,
    answer,
    clue: 'Ardisik sayilarin kareleri',
  };
}

function createAlternating(level: number): Omit<RoundData, 'options' | 'patternType'> {
  const length = randomInt(5, 6);
  const start = randomInt(2, 12);
  const stepA = randomInt(1, 2 + Math.floor(level / 4));
  const stepB = randomInt(stepA + 1, stepA + 3);
  const sequence = [start];

  for (let index = 1; index < length; index += 1) {
    const delta = index % 2 === 1 ? stepA : stepB;
    sequence.push((sequence[index - 1] ?? 0) + delta);
  }

  const answer = (sequence[length - 1] ?? 0) + (length % 2 === 0 ? stepA : stepB);

  return {
    sequence,
    answer,
    clue: `Artis miktari sirayla +${stepA} ve +${stepB}`,
  };
}

function createOptions(answer: number, level: number): number[] {
  const options = new Set<number>([answer]);
  let guard = 0;

  while (options.size < 4 && guard < 200) {
    const delta = randomInt(1, 6 + Math.floor(level / 2));
    const sign = Math.random() < 0.5 ? -1 : 1;
    const candidate = answer + sign * delta;

    if (candidate >= 0) {
      options.add(candidate);
    }

    guard += 1;
  }

  while (options.size < 4) {
    options.add(answer + options.size * 2 + 1);
  }

  return shuffle(Array.from(options));
}

function createRound(level: number): RoundData {
  const patternPool = patternsForLevel(level);
  const patternType = patternPool[randomInt(0, patternPool.length - 1)] ?? 'arithmetic';

  let roundCore: Omit<RoundData, 'options' | 'patternType'>;

  if (patternType === 'geometric') {
    roundCore = createGeometric(level);
  } else if (patternType === 'fibonacci') {
    roundCore = createFibonacci();
  } else if (patternType === 'square') {
    roundCore = createSquare();
  } else if (patternType === 'alternating') {
    roundCore = createAlternating(level);
  } else {
    roundCore = createArithmetic(level);
  }

  return {
    ...roundCore,
    patternType,
    options: createOptions(roundCore.answer, level),
  };
}

export function NumberSequenceGameClient({ gameId, gameTitle, durationSeconds }: NumberSequenceGameClientProps) {
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
    setMessage('Dizideki kurali bul ve sonraki sayiyi sec.');
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

      const correct = choice === round.answer;
      const nextAttempts = totalAttempts + 1;
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 3);

      setTotalAttempts(nextAttempts);

      if (correct) {
        const gained = 10 + level * 3;
        const nextScore = score + gained;

        setScore(nextScore);
        setCorrectCount((previous) => previous + 1);
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
      setMessage(`Yanlis cevap. Dogru cevap: ${round.answer}`);

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
  const sequenceTokens = round ? [...round.sequence.map((value) => String(value)), '?'] : [];

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Sayi dizisindeki kurali tespit et ve sonraki terimi sec.</p>
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
      <div className="card" style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div>
          <div className="muted">Puan</div>
          <strong>{score}</strong>
        </div>
        <div>
          <div className="muted">Can</div>
          <strong>{lives}</strong>
        </div>
        <div>
          <div className="muted">Tur</div>
          <strong>
            {Math.min(roundIndex, MAX_ROUNDS)} / {MAX_ROUNDS}
          </strong>
        </div>
        <div>
          <div className="muted">Sure</div>
          <strong>{formatClock(timeLeft)}</strong>
        </div>
      </div>

      {phase === 'playing' && round ? (
        <>
          <div className="card stack" style={{ gap: '1rem' }}>
            <div>
              <strong>Seviye {level}</strong>
              <p className="muted" style={{ margin: '0.4rem 0 0' }}>
                {round.clue}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.55rem',
                flexWrap: 'wrap',
              }}
            >
              {sequenceTokens.map((token, index) => (
                <div
                  key={`${token}-${index}`}
                  style={{
                    minWidth: '64px',
                    padding: '0.7rem 0.8rem',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: token === '?' ? 'rgba(37, 99, 235, 0.12)' : 'var(--surface)',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '1.08rem',
                  }}
                >
                  {token}
                </div>
              ))}
            </div>

            <div className="grid-2">
              {round.options.map((option) => (
                <Button key={option} onClick={() => handleAnswer(option)}>
                  {option}
                </Button>
              ))}
            </div>
          </div>

          {message ? (
            <p className="muted" style={{ marginTop: '-0.25rem' }}>
              {message}
            </p>
          ) : null}
        </>
      ) : null}

      {phase === 'finished' ? (
        <div className="card stack" style={{ gap: '0.8rem' }}>
          <h2 style={{ margin: 0 }}>Oyun Tamamlandi</h2>
          <p className="muted" style={{ margin: 0 }}>
            Turler bitti veya canin tukendi. Sonucu asagida gorebilirsin.
          </p>
          <ul className="muted" style={{ margin: 0 }}>
            <li>Skor: {score}</li>
            <li>Dogru cevap: {correctCount}</li>
            <li>Toplam deneme: {totalAttempts}</li>
            <li>Dogruluk: %{accuracyPercent}</li>
            <li>Seviye: {level}</li>
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
