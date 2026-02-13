'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type Shape = 'daire' | 'kare' | 'ucgen' | 'yildiz';
type Color = 'kirmizi' | 'mavi' | 'yesil' | 'sari';

interface ConditionalLogicGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface LogicObject {
  id: string;
  shape: Shape;
  color: Color;
}

interface LogicRound {
  id: string;
  objects: LogicObject[];
  instruction: string;
  targetId: string;
}

const SHAPES: Shape[] = ['daire', 'kare', 'ucgen', 'yildiz'];
const COLORS: Color[] = ['kirmizi', 'mavi', 'yesil', 'sari'];

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 12;
const MIN_DURATION_SECONDS = 150;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function createRound(level: number, roundIndex: number): LogicRound {
  const objectCount = 4 + Math.min(3, Math.floor(level / 3));

  const objects: LogicObject[] = Array.from({ length: objectCount }, (_, index) => ({
    id: `obj-${roundIndex}-${index}-${Date.now()}`,
    shape: pick(SHAPES),
    color: pick(COLORS),
  }));

  const firstTarget = pick(objects);
  let secondTarget = pick(objects);

  while (secondTarget.id === firstTarget.id) {
    secondTarget = pick(objects);
  }

  const conditionMode = randomInt(0, 2);
  let isTrue = false;
  let condition = '';

  if (conditionMode === 0) {
    const probe = pick(objects);
    isTrue = objects.some((item) => item.color === probe.color && item.shape === probe.shape);
    condition = `bir ${probe.color} ${probe.shape} varsa`;
  } else if (conditionMode === 1) {
    const color = pick(COLORS);
    const threshold = randomInt(1, 2);
    const count = objects.filter((item) => item.color === color).length;
    isTrue = count >= threshold;
    condition = `${threshold} veya daha fazla ${color} nesne varsa`;
  } else {
    const shape = pick(SHAPES);
    const count = objects.filter((item) => item.shape === shape).length;
    isTrue = count === 0;
    condition = `hic ${shape} yoksa`;
  }

  const choiceA = `${firstTarget.color} ${firstTarget.shape}`;
  const choiceB = `${secondTarget.color} ${secondTarget.shape}`;

  return {
    id: `round-${roundIndex}-${Date.now()}`,
    objects,
    instruction: `Eger ${condition}, ${choiceA} sec; aksi halde ${choiceB} sec.`,
    targetId: isTrue ? firstTarget.id : secondTarget.id,
  };
}

function objectLabel(item: LogicObject): string {
  return `${item.color} ${item.shape}`;
}

export function ConditionalLogicGameClient({ gameId, gameTitle, durationSeconds }: ConditionalLogicGameClientProps) {
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
  const [round, setRound] = useState<LogicRound | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    setRound(createRound(1, 1));
    setSelectedId(null);
    setCorrectCount(0);
    setWrongCount(0);
    setMessage('Yonergeyi oku ve dogru nesneyi sec.');
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

  const handleSelect = useCallback(
    (objectId: string) => {
      if (phase !== 'playing' || !round || selectedId) {
        return;
      }

      setSelectedId(objectId);

      const isCorrect = objectId === round.targetId;

      if (isCorrect) {
        const gained = 90 + level * 9;
        const nextScore = score + gained;

        setScore(nextScore);
        setCorrectCount((previous) => previous + 1);
        setMessage(`Dogru secim. +${gained} puan`);
      } else {
        setLives((previous) => previous - 1);
        setWrongCount((previous) => previous + 1);
        const correctItem = round.objects.find((item) => item.id === round.targetId);
        setMessage(`Yanlis secim. Dogru: ${correctItem ? objectLabel(correctItem) : '-'}`);
      }

      window.setTimeout(() => {
        const nextLives = isCorrect ? lives : lives - 1;
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
        setRound(createRound(nextLevel, nextRound));
        setSelectedId(null);
      }, 900);
    },
    [finishGame, level, lives, phase, round, roundIndex, score, selectedId],
  );

  const totalAnswered = correctCount + wrongCount;
  const accuracyPercent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 860 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Kosullu yonergeyi degerlendir ve dogru nesneyi sec.</p>
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
            {round.instruction}
          </div>

          <div className="grid-2" style={{ gap: '0.75rem' }}>
            {round.objects.map((item) => {
              const isSelected = selectedId === item.id;
              const isCorrect = item.id === round.targetId;

              const background =
                selectedId === null
                  ? 'var(--surface)'
                  : isCorrect
                    ? 'rgba(34, 197, 94, 0.22)'
                    : isSelected
                      ? 'rgba(239, 68, 68, 0.22)'
                      : 'var(--surface)';

              return (
                <button
                  key={item.id}
                  type="button"
                  className="btn"
                  onClick={() => handleSelect(item.id)}
                  disabled={selectedId !== null}
                  style={{
                    minHeight: 50,
                    fontWeight: 700,
                    borderColor: 'var(--border)',
                    background,
                    textTransform: 'capitalize',
                  }}
                >
                  {objectLabel(item)}
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
