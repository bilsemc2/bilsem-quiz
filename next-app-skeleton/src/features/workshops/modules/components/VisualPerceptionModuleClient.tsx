'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';

interface VisualPerceptionModuleClientProps {
  workshopId: string;
  moduleId: string;
  moduleTitle: string;
}

interface RoundData {
  cells: boolean[];
  gridSize: number;
  isSymmetric: boolean;
}

const INITIAL_LIVES = 3;
const SESSION_SECONDS = 150;
const MAX_ROUNDS = 24;

function createRound(level: number): RoundData {
  const gridSize = level >= 8 ? 6 : 4;
  const halfColumns = gridSize / 2;
  const density = Math.min(0.58, 0.28 + level * 0.02);

  const cells = Array.from({ length: gridSize * gridSize }, () => false);

  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < halfColumns; col += 1) {
      const active = Math.random() < density;
      const leftIndex = row * gridSize + col;
      const rightIndex = row * gridSize + (gridSize - 1 - col);

      cells[leftIndex] = active;
      cells[rightIndex] = active;
    }
  }

  const symmetryChance = Math.max(0.34, 0.56 - level * 0.015);
  const isSymmetric = Math.random() < symmetryChance;

  if (!isSymmetric) {
    const row = Math.floor(Math.random() * gridSize);
    const col = halfColumns + Math.floor(Math.random() * halfColumns);
    const index = row * gridSize + col;
    cells[index] = !cells[index];
  }

  return {
    cells,
    gridSize,
    isSymmetric,
  };
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VisualPerceptionModuleClient({
  workshopId,
  moduleId,
  moduleTitle,
}: VisualPerceptionModuleClientProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [roundIndex, setRoundIndex] = useState(1);
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
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

      const playedSeconds = Math.max(0, SESSION_SECONDS - timeLeft);

      try {
        const response = await fetch('/api/game-plays', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameId: moduleId,
            scoreAchieved: params.finalScore,
            durationSeconds: playedSeconds,
            livesRemaining: params.remainingLives,
            workshopType: workshopId,
            intelligenceType: 'gorsel_algi',
            metadata: {
              source: 'workshop-module-migrated',
              module: moduleId,
              completed: params.completed,
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
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
    [moduleId, round?.gridSize, roundIndex, timeLeft, workshopId],
  );

  const finishSession = useCallback(
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

  const startSession = useCallback(() => {
    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setRoundIndex(1);
    setTimeLeft(SESSION_SECONDS);
    setRound(createRound(1));
    setMessage('Seklin dikey simetrik olup olmadigini sec.');
    setSaveStatus(null);
    setIsSaving(false);
    setPhase('playing');
  }, []);

  useEffect(() => {
    if (phase !== 'playing') {
      return;
    }

    if (timeLeft <= 0) {
      void finishSession({ completed: false, remainingLives: lives });
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishSession, lives, phase, timeLeft]);

  const handleAnswer = useCallback(
    (selectionIsSymmetric: boolean) => {
      if (phase !== 'playing' || !round) {
        return;
      }

      const correct = selectionIsSymmetric === round.isSymmetric;
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 3);

      if (correct) {
        const gained = 9 + level * 2;
        const nextScore = score + gained;

        setScore(nextScore);
        setMessage(`Dogru tespit. +${gained} puan`);

        if (nextRoundIndex > MAX_ROUNDS) {
          void finishSession({ completed: true, remainingLives: lives, finalScore: nextScore });
          return;
        }

        setRoundIndex(nextRoundIndex);
        setLevel(nextLevel);
        setRound(createRound(nextLevel));
        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setMessage('Yanlis tespit. Simetri eksenini daha dikkatli izle.');

      if (nextLives <= 0) {
        void finishSession({ completed: false, remainingLives: 0 });
        return;
      }

      if (nextRoundIndex > MAX_ROUNDS) {
        void finishSession({ completed: true, remainingLives: nextLives });
        return;
      }

      setRoundIndex(nextRoundIndex);
      setLevel(nextLevel);
      setRound(createRound(nextLevel));
    },
    [finishSession, level, lives, phase, round, roundIndex, score],
  );

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{moduleTitle}</h1>
        <p className="muted">
          Her turda bir sekil goreceksin. Sekil dikey eksende simetrikse Simetrik, degilse Degil sec.
        </p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(SESSION_SECONDS / 60)} dakika</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
          <li>Maksimum tur: {MAX_ROUNDS}</li>
        </ul>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button onClick={startSession}>Modulu Baslat</Button>
          <Link className="btn btn-ghost" href={`/workshops/${workshopId}`}>
            Atolye detayina don
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 860 }}>
      <h1>{moduleTitle}</h1>

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
          <h2 className="card-title">Kontrol</h2>
          <p className="muted">Sekli orta eksenden ikiye bolerek degerlendir.</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button disabled={phase !== 'playing'} onClick={() => handleAnswer(true)}>
              Simetrik
            </Button>
            <Button variant="secondary" disabled={phase !== 'playing'} onClick={() => handleAnswer(false)}>
              Degil
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                finishSession({
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
          <h2 className="card-title">Sekil</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${round.gridSize}, minmax(0, 1fr))`,
              gap: '0.35rem',
              maxWidth: round.gridSize === 4 ? 280 : 360,
              margin: '0 auto',
            }}
          >
            {round.cells.map((active, index) => (
              <div
                key={index}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: '0.35rem',
                  border: '1px solid #cbd5e1',
                  background: active ? '#38bdf8' : '#e2e8f0',
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {phase === 'finished' ? (
        <div className="card stack-sm">
          <h2 className="card-title">Modul Tamamlandi</h2>
          <p className="muted">Nihai skor: {score}</p>
          <p className="muted">Son seviye: {level}</p>
          {isSaving ? <p className="muted">Sonuc kaydediliyor...</p> : null}
          {saveStatus ? <p className="muted">{saveStatus}</p> : null}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={startSession}>Tekrar Baslat</Button>
            <Link className="btn btn-ghost" href={`/workshops/${workshopId}`}>
              Atolye detayina don
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
