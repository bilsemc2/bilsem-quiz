'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'listening' | 'answering' | 'finished';

interface AuditoryMemoryGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface NoteDef {
  id: string;
  label: string;
  token: string;
  frequency: number;
}

const NOTE_POOL: NoteDef[] = [
  { id: 'do', label: 'Do', token: 'DO', frequency: 261.63 },
  { id: 're', label: 'Re', token: 'RE', frequency: 293.66 },
  { id: 'mi', label: 'Mi', token: 'MI', frequency: 329.63 },
  { id: 'fa', label: 'Fa', token: 'FA', frequency: 349.23 },
  { id: 'sol', label: 'Sol', token: 'SOL', frequency: 392.0 },
  { id: 'la', label: 'La', token: 'LA', frequency: 440.0 },
  { id: 'si', label: 'Si', token: 'SI', frequency: 493.88 },
];

const INITIAL_LIVES = 4;
const MAX_ROUNDS = 16;
const MIN_DURATION_SECONDS = 150;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function sequenceLengthForLevel(level: number): number {
  if (level <= 3) {
    return 3;
  }

  if (level <= 6) {
    return 4;
  }

  if (level <= 9) {
    return 5;
  }

  return 6;
}

function createSequence(level: number): string[] {
  const length = sequenceLengthForLevel(level);
  const sequence: string[] = [];

  for (let index = 0; index < length; index += 1) {
    const note = NOTE_POOL[randomInt(0, NOTE_POOL.length - 1)] ?? NOTE_POOL[0];
    sequence.push(note.id);
  }

  return sequence;
}

function noteById(noteId: string): NoteDef {
  return NOTE_POOL.find((note) => note.id === noteId) ?? NOTE_POOL[0];
}

function colorForIndex(index: number): string {
  const palette = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
  return palette[index % palette.length] ?? '#3b82f6';
}

export function AuditoryMemoryGameClient({ gameId, gameTitle, durationSeconds }: AuditoryMemoryGameClientProps) {
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
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [playCursor, setPlayCursor] = useState(-1);
  const [message, setMessage] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const hasSavedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sequenceLockRef = useRef(false);

  const playTone = useCallback((noteId: string, durationMs = 240) => {
    if (typeof window === 'undefined') {
      return;
    }

    const note = noteById(noteId);
    const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) {
      setActiveNoteId(noteId);
      window.setTimeout(() => setActiveNoteId(null), durationMs);
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }

    const context = audioContextRef.current;

    if (context.state === 'suspended') {
      void context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.frequency, context.currentTime);

    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationMs / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + durationMs / 1000 + 0.03);

    setActiveNoteId(noteId);
    window.setTimeout(() => setActiveNoteId(null), durationMs);
  }, []);

  const playSequence = useCallback(
    async (nextSequence: string[]) => {
      if (sequenceLockRef.current) {
        return;
      }

      sequenceLockRef.current = true;
      setPhase('listening');
      setPlayerSequence([]);
      setMessage('Diziyi dikkatle dinle.');

      for (let index = 0; index < nextSequence.length; index += 1) {
        const noteId = nextSequence[index] ?? '';
        setPlayCursor(index);
        playTone(noteId);
        await delay(500);
      }

      setPlayCursor(-1);
      sequenceLockRef.current = false;
      setPhase('answering');
      setMessage('Sira sende: notalari ayni sirayla sec.');
    },
    [playTone],
  );

  const persistResult = useCallback(
    async (params: {
      finalScore: number;
      remainingLives: number;
      completed: boolean;
      levelReached: number;
      sequenceLength: number;
    }) => {
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
            intelligenceType: 'isitsel_hafiza',
            metadata: {
              source: 'games-route-migrated',
              levelReached: params.levelReached,
              roundsPlayed: roundIndex,
              completed: params.completed,
              correctCount,
              totalAttempts,
              accuracyPercent,
              sequenceLength: params.sequenceLength,
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
        sequenceLength: sequence.length,
      });
    },
    [level, persistResult, score, sequence.length],
  );

  const startRound = useCallback(
    (nextLevel: number, nextRoundIndex: number) => {
      const nextSequence = createSequence(nextLevel);
      setLevel(nextLevel);
      setRoundIndex(nextRoundIndex);
      setSequence(nextSequence);
      setPlayerSequence([]);
      void playSequence(nextSequence);
    },
    [playSequence],
  );

  const startGame = useCallback(() => {
    hasSavedRef.current = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setRoundIndex(1);
    setTimeLeft(sessionSeconds);
    setCorrectCount(0);
    setTotalAttempts(0);
    setPlayerSequence([]);
    setPlayCursor(-1);
    setMessage('Diziyi dinle ve tekrarla.');
    setSaveStatus(null);
    setIsSaving(false);
    startRound(1, 1);
  }, [sessionSeconds, startRound]);

  useEffect(() => {
    setTimeLeft(sessionSeconds);
  }, [sessionSeconds]);

  useEffect(() => {
    if (phase !== 'listening' && phase !== 'answering') {
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

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const handleNoteClick = useCallback(
    (noteId: string) => {
      if (phase !== 'answering' || sequenceLockRef.current || sequence.length === 0) {
        return;
      }

      playTone(noteId, 170);

      const nextInput = [...playerSequence, noteId];
      setPlayerSequence(nextInput);

      const cursor = nextInput.length - 1;
      const expected = sequence[cursor] ?? '';

      if (noteId !== expected) {
        const nextLives = lives - 1;
        const nextRoundIndex = roundIndex + 1;

        setTotalAttempts((previous) => previous + 1);
        setLives(nextLives);
        setMessage(`Yanlis nota. Beklenen: ${noteById(expected).label}`);

        if (nextLives <= 0) {
          void finishGame({ completed: false, remainingLives: 0 });
          return;
        }

        if (nextRoundIndex > MAX_ROUNDS) {
          void finishGame({ completed: true, remainingLives: nextLives });
          return;
        }

        startRound(level, nextRoundIndex);
        return;
      }

      if (nextInput.length === sequence.length) {
        const gained = 25 + level * 4;
        const nextScore = score + gained;
        const nextRoundIndex = roundIndex + 1;
        const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 2);

        setScore(nextScore);
        setCorrectCount((previous) => previous + 1);
        setTotalAttempts((previous) => previous + 1);
        setMessage(`Dogru dizi. +${gained} puan`);

        if (nextRoundIndex > MAX_ROUNDS) {
          void finishGame({ completed: true, remainingLives: lives, finalScore: nextScore });
          return;
        }

        startRound(nextLevel, nextRoundIndex);
      }
    },
    [finishGame, level, lives, phase, playTone, playerSequence, roundIndex, score, sequence, startRound],
  );

  const replaySequence = useCallback(async () => {
    if (phase !== 'answering' || sequence.length === 0 || sequenceLockRef.current) {
      return;
    }

    setIsReplaying(true);
    await playSequence(sequence);
    setIsReplaying(false);
  }, [phase, playSequence, sequence]);

  const accuracyPercent = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">Notalari dinle, sonra ayni sirayla tekrar et.</p>
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
      <div className="card" style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
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
          <div className="muted">Sure</div>
          <strong>{formatClock(timeLeft)}</strong>
        </div>
      </div>

      {phase === 'listening' ? (
        <div className="card stack" style={{ gap: '0.9rem' }}>
          <strong>Dinleme Asamasi</strong>
          <p className="muted" style={{ margin: 0 }}>
            Siradaki notalari dinle.
          </p>
          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {sequence.map((noteId, index) => {
              const note = noteById(noteId);
              const active = playCursor === index;

              return (
                <div
                  key={`${noteId}-${index}`}
                  style={{
                    minWidth: 58,
                    textAlign: 'center',
                    padding: '0.65rem 0.7rem',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: active ? 'rgba(37, 99, 235, 0.2)' : 'var(--surface)',
                    fontWeight: 700,
                  }}
                >
                  {note.token}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {phase === 'answering' ? (
        <div className="card stack" style={{ gap: '0.9rem' }}>
          <strong>Cevapla</strong>
          <p className="muted" style={{ margin: 0 }}>
            Girilen dizi: {playerSequence.length > 0 ? playerSequence.map((id) => noteById(id).token).join(' - ') : '-'}
          </p>
          <div className="grid-3">
            {NOTE_POOL.map((note, index) => {
              const active = activeNoteId === note.id;

              return (
                <button
                  key={note.id}
                  type="button"
                  className="btn"
                  onClick={() => handleNoteClick(note.id)}
                  style={{
                    borderColor: colorForIndex(index),
                    background: active ? `${colorForIndex(index)}33` : 'var(--surface)',
                    fontWeight: 700,
                    minHeight: 48,
                  }}
                >
                  {note.token}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button variant="secondary" disabled={isReplaying} onClick={() => void replaySequence()}>
              {isReplaying ? 'Tekrar Oynatiyor...' : 'Sirayi Tekrar Dinle'}
            </Button>
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
            <li>Toplam deneme: {totalAttempts}</li>
            <li>Dogruluk: %{accuracyPercent}</li>
            <li>Ulasilan seviye: {level}</li>
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
