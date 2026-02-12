'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type DiffType = 'hue' | 'lightness' | 'radius';

interface RoundData {
  size: number;
  oddIndex: number;
  diffType: DiffType;
  baseHue: number;
  baseLight: number;
  baseRadius: number;
  oddHue: number;
  oddLight: number;
  oddRadius: number;
}

interface SpotDifferenceGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

const TOTAL_ROUNDS = 12;
const INITIAL_LIVES = 3;

const DIFF_LABELS: Record<DiffType, string> = {
  hue: 'Renk tonu',
  lightness: 'Aciklik',
  radius: 'Kose yapisi',
};

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function createRound(roundNumber: number): RoundData {
  const size = roundNumber < 4 ? 3 : roundNumber < 8 ? 4 : 5;
  const total = size * size;
  const oddIndex = randInt(0, total - 1);

  const diffTypes: DiffType[] = ['hue', 'lightness', 'radius'];
  const diffType = diffTypes[randInt(0, diffTypes.length - 1)];

  const baseHue = randInt(0, 359);
  const baseLight = randInt(45, 70);
  const baseRadius = randInt(18, 44);

  const hardness = clamp(roundNumber / TOTAL_ROUNDS, 0, 1);
  const hueDelta = Math.round(30 - 18 * hardness);
  const lightDelta = Math.round(18 - 10 * hardness);
  const radiusDelta = Math.round(18 - 8 * hardness);
  const sign = Math.random() > 0.5 ? 1 : -1;

  let oddHue = baseHue;
  let oddLight = baseLight;
  let oddRadius = baseRadius;

  if (diffType === 'hue') {
    oddHue = (baseHue + sign * hueDelta + 360) % 360;
  }

  if (diffType === 'lightness') {
    oddLight = clamp(baseLight + sign * lightDelta, 25, 85);
  }

  if (diffType === 'radius') {
    oddRadius = clamp(baseRadius + sign * radiusDelta, 5, 60);
  }

  return {
    size,
    oddIndex,
    diffType,
    baseHue,
    baseLight,
    baseRadius,
    oddHue,
    oddLight,
    oddRadius,
  };
}

export function SpotDifferenceGameClient({
  gameId,
  gameTitle,
  durationSeconds,
}: SpotDifferenceGameClientProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundNumber, setRoundNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [round, setRound] = useState<RoundData | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);

  const startGame = useCallback(() => {
    hasSavedRef.current = false;
    setPhase('playing');
    setRoundNumber(1);
    setScore(0);
    setLives(INITIAL_LIVES);
    setTimeLeft(durationSeconds);
    setRound(createRound(1));
    setFeedback(null);
    setSelectedIndex(null);
    setSaveStatus(null);
  }, [durationSeconds]);

  const persistResult = useCallback(
    async (finalScore: number, playedSeconds: number, remainingLives: number) => {
      if (hasSavedRef.current) {
        return;
      }

      hasSavedRef.current = true;
      setIsSaving(true);

      try {
        const response = await fetch('/api/game-plays', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameId,
            scoreAchieved: finalScore,
            durationSeconds: playedSeconds,
            livesRemaining: remainingLives,
            workshopType: 'bireysel',
            intelligenceType: 'secici_dikkat',
            metadata: {
              roundsCompleted: roundNumber,
              source: 'spot-difference-migrated',
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as { id?: string };
        setSaveStatus(data.id ? `Sonuc kaydedildi (${data.id.slice(0, 8)})` : 'Sonuc kaydedildi');
      } catch (error) {
        setSaveStatus(error instanceof Error ? `Kayit hatasi: ${error.message}` : 'Kayit hatasi');
      } finally {
        setIsSaving(false);
      }
    },
    [gameId, roundNumber],
  );

  const finishGame = useCallback(
    async (completed: boolean, remainingLives: number) => {
      setPhase('finished');
      const completionBonus = completed ? 200 : 0;
      const finalScore = score + completionBonus;
      const playedSeconds = durationSeconds - timeLeft;

      if (completionBonus > 0) {
        setScore(finalScore);
      }

      await persistResult(finalScore, Math.max(0, playedSeconds), remainingLives);
    },
    [durationSeconds, persistResult, score, timeLeft],
  );

  useEffect(() => {
    if (phase !== 'playing') {
      return;
    }

    if (timeLeft <= 0) {
      void finishGame(false, lives);
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishGame, lives, phase, timeLeft]);

  const tiles = useMemo(() => {
    if (!round) {
      return [];
    }

    return Array.from({ length: round.size * round.size }, (_, index) => {
      const isOdd = index === round.oddIndex;

      return {
        index,
        hue: isOdd ? round.oddHue : round.baseHue,
        light: isOdd ? round.oddLight : round.baseLight,
        radius: isOdd ? round.oddRadius : round.baseRadius,
      };
    });
  }, [round]);

  const handlePick = useCallback(
    (index: number) => {
      if (phase !== 'playing' || !round || feedback) {
        return;
      }

      const isCorrect = index === round.oddIndex;
      const nextLives = isCorrect ? lives : lives - 1;

      setSelectedIndex(index);
      setFeedback(isCorrect ? 'Dogrusu! Yeni tura geciliyor...' : 'Olmadi, tekrar dene!');

      if (isCorrect) {
        setScore((prev) => prev + 100 + Math.max(0, timeLeft));
      } else {
        setLives(nextLives);
      }

      window.setTimeout(() => {
        setSelectedIndex(null);
        setFeedback(null);

        if (!isCorrect && nextLives <= 0) {
          void finishGame(false, 0);
          return;
        }

        if (isCorrect && roundNumber >= TOTAL_ROUNDS) {
          void finishGame(true, nextLives);
          return;
        }

        const nextRoundNumber = isCorrect ? roundNumber + 1 : roundNumber;
        setRoundNumber(nextRoundNumber);
        setRound(createRound(nextRoundNumber));
      }, 700);
    },
    [feedback, finishGame, lives, phase, round, roundNumber, timeLeft],
  );

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Gridde digerlerinden farkli olan tek kutuyu sec. Renk, parlaklik veya kose farkini yakala.
        </p>
        <ul>
          <li>Toplam tur: {TOTAL_ROUNDS}</li>
          <li>Can: {INITIAL_LIVES}</li>
          <li>Sure: {Math.ceil(durationSeconds / 60)} dakika</li>
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

  if (phase === 'finished') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle} Tamamlandi</h1>
        <p className="muted">Final skor: {score}</p>
        <p className="muted">
          Tamamlanan tur: {roundNumber}/{TOTAL_ROUNDS}
        </p>
        <p className="muted">Kalan can: {lives}</p>
        <p className="muted">{isSaving ? 'Sonuc kaydediliyor...' : saveStatus ?? 'Kayit bekleniyor'}</p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button onClick={startGame}>Tekrar Oyna</Button>
          <Link className="btn btn-ghost" href="/games">
            Oyun listesine don
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span>Skor: {score}</span>
        <span>
          Tur: {roundNumber}/{TOTAL_ROUNDS}
        </span>
        <span>Can: {lives}</span>
        <span>Sure: {timeLeft}s</span>
      </div>

      {round ? (
        <p className="muted">
          Fark tipi: <strong>{DIFF_LABELS[round.diffType]}</strong>
        </p>
      ) : null}

      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${round?.size ?? 1}, minmax(0, 1fr))`,
          gap: '0.5rem',
        }}
      >
        {tiles.map((tile) => (
          <button
            key={tile.index}
            type="button"
            onClick={() => handlePick(tile.index)}
            disabled={Boolean(feedback)}
            aria-label={`tile-${tile.index}`}
            style={{
              aspectRatio: '1 / 1',
              border: selectedIndex === tile.index ? '3px solid #f59e0b' : '1px solid #e2e8f0',
              borderRadius: `${tile.radius}%`,
              background: `hsl(${tile.hue} 72% ${tile.light}%)`,
              cursor: feedback ? 'default' : 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)',
            }}
          />
        ))}
      </div>

      {feedback ? <p>{feedback}</p> : null}

      <div>
        <Link className="btn btn-ghost" href="/games">
          Oyundan cik
        </Link>
      </div>
    </div>
  );
}
