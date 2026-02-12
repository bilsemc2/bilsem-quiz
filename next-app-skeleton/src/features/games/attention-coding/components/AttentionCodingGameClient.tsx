'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type ShapeId = 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'plus' | 'hex';

interface AttentionCodingGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface ShapeOption {
  id: ShapeId;
  label: string;
  token: string;
}

interface Mapping {
  number: number;
  shapeId: ShapeId;
}

interface RoundItem {
  id: string;
  targetNumber: number;
  userShapeId: ShapeId | null;
}

interface RoundData {
  mappings: Mapping[];
  items: RoundItem[];
}

const INITIAL_LIVES = 5;
const MAX_ROUNDS = 20;
const MIN_DURATION_SECONDS = 150;

const SHAPE_OPTIONS: ShapeOption[] = [
  { id: 'circle', label: 'Daire', token: 'O' },
  { id: 'square', label: 'Kare', token: '[]' },
  { id: 'triangle', label: 'Ucgen', token: 'TRI' },
  { id: 'diamond', label: 'Elmas', token: 'DIA' },
  { id: 'star', label: 'Yildiz', token: 'STAR' },
  { id: 'plus', label: 'Arti', token: '+' },
  { id: 'hex', label: 'Altigen', token: 'HEX' },
];

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

function mappingCountForLevel(level: number): number {
  if (level <= 4) {
    return 4;
  }

  if (level <= 8) {
    return 5;
  }

  if (level <= 12) {
    return 6;
  }

  return 7;
}

function itemCountForLevel(level: number): number {
  if (level <= 3) {
    return 5;
  }

  if (level <= 7) {
    return 6;
  }

  if (level <= 12) {
    return 7;
  }

  if (level <= 16) {
    return 8;
  }

  return 9;
}

function createMappings(level: number): Mapping[] {
  const shapeCount = mappingCountForLevel(level);
  const selected = shuffle([...SHAPE_OPTIONS]).slice(0, shapeCount);

  return selected.map((shape, index) => ({
    number: index + 1,
    shapeId: shape.id,
  }));
}

function createItems(level: number, mappingCount: number): RoundItem[] {
  const itemCount = itemCountForLevel(level);

  return Array.from({ length: itemCount }, (_, index) => ({
    id: `item-${Date.now()}-${index}`,
    targetNumber: randomInt(1, mappingCount),
    userShapeId: null,
  }));
}

function createRound(level: number): RoundData {
  const mappings = createMappings(level);
  const items = createItems(level, mappings.length);

  return {
    mappings,
    items,
  };
}

function shapeMeta(shapeId: ShapeId): ShapeOption {
  return SHAPE_OPTIONS.find((shape) => shape.id === shapeId) ?? SHAPE_OPTIONS[0];
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AttentionCodingGameClient({ gameId, gameTitle, durationSeconds }: AttentionCodingGameClientProps) {
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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
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
      const accuracyPercent = totalRounds > 0 ? Math.round((correctRounds / totalRounds) * 100) : 0;

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
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              correctRounds,
              totalRounds,
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
    [correctRounds, gameId, roundIndex, sessionSeconds, timeLeft, totalRounds],
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
    setSelectedItemId(null);
    setCorrectRounds(0);
    setTotalRounds(0);
    setMessage('Numara-sekil kodlamasina gore tum satirlari doldur.');
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

  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
  }, []);

  const handleSelectShape = useCallback(
    (shapeId: ShapeId) => {
      if (phase !== 'playing' || !round || !selectedItemId) {
        return;
      }

      setRound((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          items: previous.items.map((item) =>
            item.id === selectedItemId ? { ...item, userShapeId: shapeId } : item,
          ),
        };
      });

      setSelectedItemId(null);
    },
    [phase, round, selectedItemId],
  );

  const clearSelectedItem = useCallback(() => {
    if (!selectedItemId) {
      return;
    }

    setRound((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        items: previous.items.map((item) =>
          item.id === selectedItemId ? { ...item, userShapeId: null } : item,
        ),
      };
    });
  }, [selectedItemId]);

  const submitRound = useCallback(() => {
    if (phase !== 'playing' || !round) {
      return;
    }

    const mappingMap = new Map(round.mappings.map((mapping) => [mapping.number, mapping.shapeId]));
    const allCorrect = round.items.every(
      (item) => item.userShapeId !== null && mappingMap.get(item.targetNumber) === item.userShapeId,
    );

    const nextRoundIndex = roundIndex + 1;
    const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 2);
    const nextTotalRounds = totalRounds + 1;

    setTotalRounds(nextTotalRounds);

    if (allCorrect) {
      const gained = 12 + level * 2;
      const nextScore = score + gained;
      const nextCorrectRounds = correctRounds + 1;

      setScore(nextScore);
      setCorrectRounds(nextCorrectRounds);
      setMessage(`Kodlama dogru. +${gained} puan`);

      if (nextRoundIndex > MAX_ROUNDS) {
        void finishGame({ completed: true, remainingLives: lives, finalScore: nextScore });
        return;
      }

      setRoundIndex(nextRoundIndex);
      setLevel(nextLevel);
      setRound(createRound(nextLevel));
      setSelectedItemId(null);
      return;
    }

    const nextLives = lives - 1;

    setLives(nextLives);
    setMessage('Eslesme hatasi. Kod tablosunu tekrar kontrol et.');

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
    setSelectedItemId(null);
  }, [correctRounds, finishGame, level, lives, phase, round, roundIndex, score, totalRounds]);

  const accuracyPercent = totalRounds > 0 ? Math.round((correctRounds / totalRounds) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Kod tablosunda her sayi bir sekle karsilik gelir. Her satiri dogru sekille doldur.
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
    <div className="stack" style={{ maxWidth: 980 }}>
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

        <div className="card stack-sm">
          <h2 className="card-title">Kod Tablosu</h2>
          <div className="stack-sm">
            {round?.mappings.map((mapping) => {
              const shape = shapeMeta(mapping.shapeId);

              return (
                <div key={mapping.number} className="card" style={{ padding: '0.5rem 0.75rem' }}>
                  <strong>{mapping.number}</strong> -&gt; {shape.token} ({shape.label})
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card stack-sm">
        <h2 className="card-title">Test Satirlari</h2>
        <div className="stack-sm">
          {round?.items.map((item) => {
            const selected = item.userShapeId ? shapeMeta(item.userShapeId) : null;
            const isSelected = selectedItemId === item.id;

            return (
              <button
                key={item.id}
                className="btn btn-ghost"
                style={{
                  justifyContent: 'space-between',
                  borderColor: isSelected ? '#2563eb' : undefined,
                  background: isSelected ? '#dbeafe' : undefined,
                }}
                type="button"
                onClick={() => handleSelectItem(item.id)}
              >
                <span>No: {item.targetNumber}</span>
                <span>Secim: {selected ? `${selected.token} (${selected.label})` : '-'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card stack-sm">
        <h2 className="card-title">Sekil Paleti</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SHAPE_OPTIONS.map((shape) => (
            <Button
              key={shape.id}
              variant="secondary"
              disabled={phase !== 'playing' || !selectedItemId}
              onClick={() => handleSelectShape(shape.id)}
            >
              {shape.token}
            </Button>
          ))}
          <Button variant="ghost" disabled={!selectedItemId} onClick={clearSelectedItem}>
            Seciliyi Temizle
          </Button>
          <Button disabled={phase !== 'playing'} onClick={submitRound}>
            Turu Onayla
          </Button>
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
