'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

type Phase = 'welcome' | 'playing' | 'finished';
type ChallengeType = 'same' | 'transposition' | 'similarity' | 'random';

interface PerceptualSpeedGameClientProps {
  gameId: string;
  gameTitle: string;
  durationSeconds: number;
}

interface Challenge {
  left: string;
  right: string;
  isSame: boolean;
  type: ChallengeType;
}

const INITIAL_LIVES = 5;
const MAX_ROUNDS = 24;
const MIN_DURATION_SECONDS = 150;
const BASE_DIGIT_LENGTH = 5;

const CONFUSION_PAIRS: Record<string, string[]> = {
  '0': ['8', '6', '9'],
  '1': ['7'],
  '2': ['5'],
  '3': ['8', '5'],
  '5': ['2', '3'],
  '6': ['0', '9'],
  '7': ['1'],
  '8': ['0', '3'],
  '9': ['6', '0'],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDigit(): string {
  return randomInt(0, 9).toString();
}

function generateNumberString(length: number): string {
  return Array.from({ length }, () => randomDigit()).join('');
}

function digitLengthForLevel(level: number): number {
  return Math.min(BASE_DIGIT_LENGTH + Math.floor((level - 1) / 4), 9);
}

function createChallenge(level: number): Challenge {
  const length = digitLengthForLevel(level);
  const base = generateNumberString(length);
  const isSame = Math.random() < 0.5;

  if (isSame) {
    return {
      left: base,
      right: base,
      isSame: true,
      type: 'same',
    };
  }

  const chars = base.split('');
  const roll = Math.random();
  let type: ChallengeType = 'random';

  if (roll < 0.45 && chars.length > 1) {
    const index = randomInt(0, chars.length - 2);
    [chars[index], chars[index + 1]] = [chars[index + 1], chars[index]];
    type = 'transposition';
  } else if (roll < 0.9) {
    const candidateIndexes = chars
      .map((digit, index) => ({ digit, index }))
      .filter((item) => CONFUSION_PAIRS[item.digit]?.length);

    if (candidateIndexes.length > 0) {
      const pick = candidateIndexes[randomInt(0, candidateIndexes.length - 1)];
      const replacements = CONFUSION_PAIRS[pick.digit];
      chars[pick.index] = replacements[randomInt(0, replacements.length - 1)];
      type = 'similarity';
    } else {
      const index = randomInt(0, chars.length - 1);
      chars[index] = randomDigit();
      type = 'random';
    }
  } else {
    const index = randomInt(0, chars.length - 1);
    let replacement = randomDigit();

    while (replacement === chars[index]) {
      replacement = randomDigit();
    }

    chars[index] = replacement;
    type = 'random';
  }

  const right = chars.join('');

  if (right === base) {
    const index = randomInt(0, chars.length - 1);
    chars[index] = chars[index] === '1' ? '2' : '1';
  }

  return {
    left: base,
    right: chars.join(''),
    isSame: false,
    type,
  };
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PerceptualSpeedGameClient({ gameId, gameTitle, durationSeconds }: PerceptualSpeedGameClientProps) {
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
  const [challenge, setChallenge] = useState<Challenge | null>(null);
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
              correctCount,
              totalAttempts,
              accuracyPercent:
                totalAttempts > 0
                  ? Math.round((correctCount / totalAttempts) * 100)
                  : 0,
              challengeType: challenge?.type ?? null,
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
    [challenge?.type, correctCount, gameId, roundIndex, sessionSeconds, timeLeft, totalAttempts],
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
    setChallenge(createChallenge(1));
    setCorrectCount(0);
    setTotalAttempts(0);
    setMessage('Diziler ayniysa Ayni, degilse Farkli sec.');
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
    (choiceSame: boolean) => {
      if (phase !== 'playing' || !challenge) {
        return;
      }

      const correct = choiceSame === challenge.isSame;
      const nextAttempts = totalAttempts + 1;
      const nextRoundIndex = roundIndex + 1;
      const nextLevel = 1 + Math.floor((nextRoundIndex - 1) / 3);

      setTotalAttempts(nextAttempts);

      if (correct) {
        const gained = 8 + level * 2;
        const nextScore = score + gained;
        const nextCorrect = correctCount + 1;

        setScore(nextScore);
        setCorrectCount(nextCorrect);
        setMessage(`Dogru yanit. +${gained} puan`);

        if (nextRoundIndex > MAX_ROUNDS) {
          void finishGame({ completed: true, remainingLives: lives, finalScore: nextScore });
          return;
        }

        setRoundIndex(nextRoundIndex);
        setLevel(nextLevel);
        setChallenge(createChallenge(nextLevel));
        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setMessage(`Yanlis secim. Son cift tipi: ${challenge.type}`);

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
      setChallenge(createChallenge(nextLevel));
    },
    [challenge, correctCount, finishGame, level, lives, phase, roundIndex, score, totalAttempts],
  );

  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  if (phase === 'welcome') {
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <h1>{gameTitle}</h1>
        <p className="muted">
          Sayi ciftlerini hizli karsilastir. Gorsel benzerlik ve transpozisyon tuzaklarina dikkat et.
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
    <div className="stack" style={{ maxWidth: 900 }}>
      <h1>{gameTitle}</h1>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Durum</h2>
          <p className="muted">Skor: {score}</p>
          <p className="muted">Can: {lives}</p>
          <p className="muted">Tur: {roundIndex} / {MAX_ROUNDS}</p>
          <p className="muted">Seviye: {level}</p>
          <p className="muted">Kalan sure: {formatClock(timeLeft)}</p>
          <p className="muted">Dogruluk: %{accuracy}</p>
          {message ? <p>{message}</p> : null}
        </div>

        <div className="card stack-sm">
          <h2 className="card-title">Kontrol</h2>
          <p className="muted">Ayni mi, farkli mi?</p>
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
      </div>

      {challenge ? (
        <div className="card">
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="stack-sm" style={{ textAlign: 'center' }}>
              <p className="muted" style={{ margin: 0 }}>
                Sol
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
                {challenge.left}
              </p>
            </div>
            <div className="stack-sm" style={{ textAlign: 'center' }}>
              <p className="muted" style={{ margin: 0 }}>
                Sag
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
                {challenge.right}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {phase === 'finished' ? (
        <div className="card stack-sm">
          <h2 className="card-title">Oyun Tamamlandi</h2>
          <p className="muted">Nihai skor: {score}</p>
          <p className="muted">Ulasilan seviye: {level}</p>
          <p className="muted">Dogruluk: %{accuracy}</p>
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
