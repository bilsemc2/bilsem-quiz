'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'showing' | 'input' | 'finished';
type Beat = 'TA' | 'TUM';

interface MusicRhythmModuleClientProps {
  workshopId: string;
  moduleId: string;
  moduleTitle: string;
}

const INITIAL_LIVES = 3;
const SESSION_SECONDS = 150;
const MAX_LEVEL = 12;

const BEATS: Beat[] = ['TA', 'TUM'];

function pickBeat(): Beat {
  return BEATS[Math.floor(Math.random() * BEATS.length)];
}

function generatePattern(level: number): Beat[] {
  const length = Math.min(8, level + 2);
  return Array.from({ length }, () => pickBeat());
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MusicRhythmModuleClient({ workshopId, moduleId, moduleTitle }: MusicRhythmModuleClientProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
  const [pattern, setPattern] = useState<Beat[]>([]);
  const [showIndex, setShowIndex] = useState(0);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [userInput, setUserInput] = useState<Beat[]>([]);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);
  const revealTimerRef = useRef<number | null>(null);
  const stepTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    if (stepTimerRef.current !== null) {
      window.clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }

    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

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
            intelligenceType: 'isitsel_dikkat',
            metadata: {
              source: 'workshop-module-migrated',
              module: moduleId,
              completed: params.completed,
              levelReached: params.levelReached,
              lastPatternLength: pattern.length,
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
    [moduleId, pattern.length, timeLeft, workshopId],
  );

  const finishModule = useCallback(
    async (params: { completed: boolean; remainingLives: number; finalScore?: number }) => {
      clearTimers();
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
    [clearTimers, level, persistResult, score],
  );

  const startRound = useCallback(
    (nextLevel: number) => {
      clearTimers();
      const nextPattern = generatePattern(nextLevel);

      setLevel(nextLevel);
      setPattern(nextPattern);
      setShowIndex(0);
      setCurrentBeat(null);
      setUserInput([]);
      setLocked(false);
      setMessage('Deseni izle.');
      setPhase('showing');
    },
    [clearTimers],
  );

  const startModule = useCallback(() => {
    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setTimeLeft(SESSION_SECONDS);
    setSaveStatus(null);
    setIsSaving(false);
    startRound(1);
  }, [startRound]);

  useEffect(() => {
    if (phase !== 'showing') {
      return;
    }

    if (showIndex >= pattern.length) {
      clearTimers();
      setCurrentBeat(null);
      setMessage('Deseni ayni sirada tekrar et.');
      setPhase('input');
      return;
    }

    const beat = pattern[showIndex];
    setCurrentBeat(beat);

    clearTimers();

    revealTimerRef.current = window.setTimeout(() => {
      setCurrentBeat(null);
    }, 520);

    stepTimerRef.current = window.setTimeout(() => {
      setShowIndex((previous) => previous + 1);
    }, 760);
  }, [clearTimers, pattern, phase, showIndex]);

  useEffect(() => {
    if (phase !== 'showing' && phase !== 'input') {
      return;
    }

    if (timeLeft <= 0) {
      void finishModule({ completed: false, remainingLives: lives });
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [finishModule, lives, phase, timeLeft]);

  const handleBeatClick = useCallback(
    (beat: Beat) => {
      if (phase !== 'input' || locked) {
        return;
      }

      const step = userInput.length;
      const expected = pattern[step];

      if (beat === expected) {
        const nextUserInput = [...userInput, beat];
        setUserInput(nextUserInput);

        if (nextUserInput.length === pattern.length) {
          const gained = 10 + level * 3;
          const nextScore = score + gained;
          setScore(nextScore);
          setLocked(true);
          setMessage(`Dogru ritim. +${gained} puan`);

          feedbackTimerRef.current = window.setTimeout(() => {
            if (level >= MAX_LEVEL) {
              void finishModule({ completed: true, remainingLives: lives, finalScore: nextScore });
              return;
            }

            startRound(level + 1);
          }, 700);
        } else {
          setMessage(`Dogru adim: ${nextUserInput.length}/${pattern.length}`);
        }

        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setLocked(true);
      setMessage('Yanlis ritim. Ayni seviye tekrar basliyor.');

      feedbackTimerRef.current = window.setTimeout(() => {
        if (nextLives <= 0) {
          void finishModule({ completed: false, remainingLives: 0 });
          return;
        }

        startRound(level);
      }, 700);
    },
    [finishModule, level, lives, locked, pattern, phase, score, startRound, userInput],
  );

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{moduleTitle}</h1>
        <p className="muted">
          TA ve TUM dizisini izle. Gosterim bittiginde deseni ayni sirada tekrar et.
        </p>
        <ul className="muted">
          <li>Toplam sure: {Math.ceil(SESSION_SECONDS / 60)} dakika</li>
          <li>Baslangic cani: {INITIAL_LIVES}</li>
          <li>Maksimum seviye: {MAX_LEVEL}</li>
        </ul>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button onClick={startModule}>Modulu Baslat</Button>
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
          <p className="muted">Seviye: {level}</p>
          <p className="muted">Kalan sure: {formatClock(timeLeft)}</p>
          <p className="muted">Desen uzunlugu: {pattern.length}</p>
          {message ? <p>{message}</p> : null}
        </div>

        <div className="card">
          <h2 className="card-title">Kontrol</h2>
          <p className="muted">Faz: {phase === 'showing' ? 'Gosterim' : phase === 'input' ? 'Girdi' : 'Tamamlandi'}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button disabled={phase !== 'input' || locked} onClick={() => handleBeatClick('TA')}>
              TA
            </Button>
            <Button
              variant="secondary"
              disabled={phase !== 'input' || locked}
              onClick={() => handleBeatClick('TUM')}
            >
              TUM
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                finishModule({
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

      <div className="card" style={{ textAlign: 'center' }}>
        <p className="muted" style={{ margin: 0 }}>
          Gosterim
        </p>
        <p
          style={{
            margin: '0.5rem 0',
            fontSize: '2.2rem',
            fontWeight: 800,
            minHeight: '2.5rem',
            letterSpacing: '0.15rem',
          }}
        >
          {currentBeat ?? '-'}
        </p>
        <p className="muted" style={{ margin: 0 }}>
          Girdi: {userInput.join(' - ') || '-'}
        </p>
      </div>

      {phase === 'finished' ? (
        <div className="card stack-sm">
          <h2 className="card-title">Modul Tamamlandi</h2>
          <p className="muted">Nihai skor: {score}</p>
          <p className="muted">Ulasilan seviye: {level}</p>
          {isSaving ? <p className="muted">Sonuc kaydediliyor...</p> : null}
          {saveStatus ? <p className="muted">{saveStatus}</p> : null}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={startModule}>Tekrar Baslat</Button>
            <Link className="btn btn-ghost" href={`/workshops/${workshopId}`}>
              Atolye detayina don
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
