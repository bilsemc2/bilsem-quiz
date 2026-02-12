'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';

interface TabletSpeedModuleClientProps {
  workshopId: string;
  moduleId: string;
  moduleTitle: string;
}

interface RoundData {
  reference: string;
  candidate: string;
  isSame: boolean;
}

const INITIAL_LIVES = 3;
const SESSION_SECONDS = 120;
const MAX_ROUNDS = 30;

function randomDigit(): string {
  return Math.floor(Math.random() * 10).toString();
}

function randomDigits(length: number): string {
  return Array.from({ length }, () => randomDigit()).join('');
}

function mutateOneDigit(value: string): string {
  const chars = value.split('');
  const targetIndex = Math.floor(Math.random() * chars.length);

  let replacement = chars[targetIndex];
  while (replacement === chars[targetIndex]) {
    replacement = randomDigit();
  }

  chars[targetIndex] = replacement;
  return chars.join('');
}

function createRound(level: number): RoundData {
  const length = Math.min(8, 6 + Math.floor((level - 1) / 4));
  const reference = randomDigits(length);
  const sameChance = Math.max(0.38, 0.55 - level * 0.01);
  const isSame = Math.random() < sameChance;

  return {
    reference,
    candidate: isSame ? reference : mutateOneDigit(reference),
    isSame,
  };
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function TabletSpeedModuleClient({ workshopId, moduleId, moduleTitle }: TabletSpeedModuleClientProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
  const [level, setLevel] = useState(1);
  const [roundIndex, setRoundIndex] = useState(1);
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
            intelligenceType: 'isleme_hizi',
            metadata: {
              source: 'workshop-module-migrated',
              module: moduleId,
              completed: params.completed,
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
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
    [moduleId, roundIndex, timeLeft, workshopId],
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
    setTimeLeft(SESSION_SECONDS);
    setLevel(1);
    setRoundIndex(1);
    setRound(createRound(1));
    setMessage('Ayni veya farkli secimini hizli yap.');
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
    (selectionIsSame: boolean) => {
      if (phase !== 'playing' || !round) {
        return;
      }

      const correct = selectionIsSame === round.isSame;
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 4);

      if (correct) {
        const gained = 8 + level * 2;
        const nextScore = score + gained;
        setScore(nextScore);
        setMessage(`Dogru secim. +${gained} puan`);

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
      setMessage('Yanlis secim. Dikkatini toparla.');

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
          Referans ve aday sayi dizilerini karsilastir. Diziler ayniysa Ayni, degilse Farkli sec.
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
    <div className="stack" style={{ maxWidth: 880 }}>
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
          <p className="muted">Ayni/Farkli secimini 2 saniye icinde vermeye calis.</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button disabled={phase !== 'playing'} onClick={() => handleAnswer(true)}>
              Ayni
            </Button>
            <Button variant="secondary" disabled={phase !== 'playing'} onClick={() => handleAnswer(false)}>
              Farkli
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
        <div className="card">
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="stack-sm" style={{ textAlign: 'center' }}>
              <p className="muted" style={{ margin: 0 }}>
                Referans
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '2rem',
                  fontWeight: 800,
                  letterSpacing: '0.25rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {round.reference}
              </p>
            </div>
            <div className="stack-sm" style={{ textAlign: 'center' }}>
              <p className="muted" style={{ margin: 0 }}>
                Aday
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '2rem',
                  fontWeight: 800,
                  letterSpacing: '0.25rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {round.candidate}
              </p>
            </div>
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
