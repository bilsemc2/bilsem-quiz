'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type RuleType = 'same-color' | 'same-shape' | 'count-three';

interface LogicPuzzleGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface PuzzleOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

interface PuzzleRound {
  id: string;
  ruleType: RuleType;
  ruleText: string;
  examples: string[];
  options: PuzzleOption[];
}

const SHAPES = ['daire', 'kare', 'ucgen', 'yildiz'];
const COLORS = ['kirmizi', 'mavi', 'yesil', 'sari'];

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 10;
const MIN_DURATION_SECONDS = 150;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
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

function generateRound(roundIndex: number): PuzzleRound {
  const ruleType = pick<RuleType>(['same-color', 'same-shape', 'count-three']);

  if (ruleType === 'same-color') {
    const color = pick(COLORS);
    const wrongColor = pick(COLORS.filter((item) => item !== color));

    const options = shuffle([
      { id: `opt-${roundIndex}-a`, label: `${color} daire, ${color} kare, ${color} ucgen`, isCorrect: true },
      { id: `opt-${roundIndex}-b`, label: `${color} daire, ${wrongColor} kare, ${color} ucgen`, isCorrect: false },
      { id: `opt-${roundIndex}-c`, label: `${wrongColor} yildiz, ${wrongColor} kare, ${wrongColor} daire`, isCorrect: false },
      { id: `opt-${roundIndex}-d`, label: `${color} yildiz, ${wrongColor} daire, ${wrongColor} kare`, isCorrect: false },
    ]);

    return {
      id: `puzzle-${roundIndex}-${Date.now()}`,
      ruleType,
      ruleText: `Kural: Tum sekiller ${color} renginde olmali.`,
      examples: [`${color} daire - ${color} kare`, `${color} ucgen - ${color} yildiz`],
      options,
    };
  }

  if (ruleType === 'same-shape') {
    const shape = pick(SHAPES);
    const wrongShape = pick(SHAPES.filter((item) => item !== shape));

    const options = shuffle([
      { id: `opt-${roundIndex}-a`, label: `kirmizi ${shape}, mavi ${shape}, yesil ${shape}`, isCorrect: true },
      { id: `opt-${roundIndex}-b`, label: `sari ${shape}, mavi ${wrongShape}, yesil ${shape}`, isCorrect: false },
      { id: `opt-${roundIndex}-c`, label: `kirmizi ${wrongShape}, mavi ${wrongShape}, sari ${wrongShape}`, isCorrect: false },
      { id: `opt-${roundIndex}-d`, label: `yesil ${shape}, yesil ${wrongShape}, yesil ${shape}`, isCorrect: false },
    ]);

    return {
      id: `puzzle-${roundIndex}-${Date.now()}`,
      ruleType,
      ruleText: `Kural: Tum sekiller ${shape} olmali.`,
      examples: [`kirmizi ${shape} - mavi ${shape}`, `yesil ${shape} - sari ${shape}`],
      options,
    };
  }

  const options = shuffle([
    { id: `opt-${roundIndex}-a`, label: '3 sekil var: daire, kare, ucgen', isCorrect: true },
    { id: `opt-${roundIndex}-b`, label: '2 sekil var: daire, ucgen', isCorrect: false },
    { id: `opt-${roundIndex}-c`, label: '4 sekil var: daire, kare, ucgen, yildiz', isCorrect: false },
    { id: `opt-${roundIndex}-d`, label: '1 sekil var: yildiz', isCorrect: false },
  ]);

  return {
    id: `puzzle-${roundIndex}-${Date.now()}`,
    ruleType,
    ruleText: 'Kural: Grup tam olarak 3 sekil icermeli.',
    examples: ['kirmizi daire - mavi kare - yesil ucgen', 'sari daire - kirmizi kare - mavi yildiz'],
    options,
  };
}

export function LogicPuzzleGameClient({ gameId, gameTitle, durationSeconds }: LogicPuzzleGameClientProps) {
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
  const [round, setRound] = useState<PuzzleRound | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);

  const persistResult = useCallback(
    async (params: { finalScore: number; completed: boolean; remainingLives: number }) => {
      if (hasSavedRef.current) {
        return;
      }

      hasSavedRef.current = true;
      setIsSaving(true);

      const playedSeconds = Math.max(0, sessionSeconds - timeLeft);
      const totalAnswered = correctCount + wrongCount;
      const accuracyPercent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

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
            intelligenceType: 'mantik_muhakeme',
            metadata: {
              source: 'games-route-migrated',
              completed: params.completed,
              levelReached: level,
              roundsPlayed: roundIndex,
              correctCount,
              wrongCount,
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
    [correctCount, gameId, level, roundIndex, sessionSeconds, timeLeft, wrongCount],
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
    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setRoundIndex(1);
    setTimeLeft(sessionSeconds);
    setRound(generateRound(1));
    setSelectedOptionId(null);
    setCorrectCount(0);
    setWrongCount(0);
    setMessage('Referanslardan kurali cikarip dogru grubu sec.');
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

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (phase !== 'playing' || !round || selectedOptionId) {
        return;
      }

      setSelectedOptionId(optionId);

      const selected = round.options.find((option) => option.id === optionId);
      if (!selected) {
        return;
      }

      if (selected.isCorrect) {
        const gained = 110 + level * 7;
        setScore((previous) => previous + gained);
        setCorrectCount((previous) => previous + 1);
        setMessage(`Dogru kural. +${gained} puan`);
      } else {
        setLives((previous) => previous - 1);
        setWrongCount((previous) => previous + 1);
        const correctOption = round.options.find((option) => option.isCorrect);
        setMessage(`Yanlis secim. Dogru cevap: ${correctOption?.label ?? '-'}`);
      }

      window.setTimeout(() => {
        const nextLives = selected.isCorrect ? lives : lives - 1;
        const nextRound = roundIndex + 1;

        if (nextLives <= 0) {
          void finishGame({ completed: false, remainingLives: 0 });
          return;
        }

        if (nextRound > MAX_ROUNDS) {
          void finishGame({ completed: true, remainingLives: nextLives });
          return;
        }

        const nextLevel = 1 + Math.floor((nextRound - 1) / 2);

        setRoundIndex(nextRound);
        setLevel(nextLevel);
        setRound(generateRound(nextRound));
        setSelectedOptionId(null);
      }, 950);
    },
    [finishGame, level, lives, phase, round, roundIndex, selectedOptionId],
  );

  const totalAnswered = correctCount + wrongCount;
  const accuracyPercent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 860 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Ornek gruplardan mantik kuralini cikar ve dogru secenegi bul.</p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(sessionSeconds / 60)} dakika</li>
          <li>Tur sayisi: {MAX_ROUNDS}</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
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
          <div className="muted">Tur</div>
          <strong>
            {Math.min(roundIndex, MAX_ROUNDS)} / {MAX_ROUNDS}
          </strong>
        </div>
        <div>
          <div className="muted">Seviye</div>
          <strong>{level}</strong>
        </div>
        <div>
          <div className="muted">Dogruluk</div>
          <strong>%{accuracyPercent}</strong>
        </div>
        <div>
          <div className="muted">Sure</div>
          <strong>{formatClock(timeLeft)}</strong>
        </div>
      </div>

      {phase === 'playing' && round ? (
        <div className="card stack" style={{ gap: '1rem' }}>
          <div className="stack" style={{ gap: '0.45rem' }}>
            <p className="muted" style={{ margin: 0 }}>
              Referanslar
            </p>
            <ul className="muted" style={{ margin: 0 }}>
              {round.examples.map((example) => (
                <li key={`${round.id}-${example}`}>{example}</li>
              ))}
            </ul>
          </div>

          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '0.9rem',
              background: 'rgba(15, 23, 42, 0.03)',
              lineHeight: 1.6,
              fontWeight: 700,
            }}
          >
            {round.ruleText}
          </div>

          <div className="grid-2" style={{ gap: '0.75rem' }}>
            {round.options.map((option) => {
              const isSelected = selectedOptionId === option.id;

              const background =
                selectedOptionId === null
                  ? 'var(--surface)'
                  : option.isCorrect
                    ? 'rgba(34, 197, 94, 0.22)'
                    : isSelected
                      ? 'rgba(239, 68, 68, 0.22)'
                      : 'var(--surface)';

              return (
                <button
                  key={option.id}
                  type="button"
                  className="btn"
                  onClick={() => handleSelectOption(option.id)}
                  disabled={selectedOptionId !== null}
                  style={{
                    minHeight: 56,
                    fontWeight: 700,
                    borderColor: 'var(--border)',
                    background,
                    textTransform: 'capitalize',
                  }}
                >
                  {option.label}
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
            <li>Dogru tur: {correctCount}</li>
            <li>Yanlis tur: {wrongCount}</li>
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
